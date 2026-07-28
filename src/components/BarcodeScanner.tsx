import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

type Props = {
  onDetected: (isbn: string) => void;
  onCancel: () => void;
};

/** Capacidades de cámara que no están en los tipos estándar del DOM. */
type AdvancedCapabilities = MediaTrackCapabilities & {
  focusMode?: string[];
  zoom?: { min: number; max: number; step: number };
  torch?: boolean;
};
type AdvancedConstraint = {
  focusMode?: string;
  zoom?: number;
  torch?: boolean;
  pointsOfInterest?: { x: number; y: number }[];
};

/** BarcodeDetector nativo: mucho más robusto donde existe (Android/Chrome). */
type BarcodeDetectorLike = {
  detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]>;
};
declare global {
  interface Window {
    BarcodeDetector?: {
      new (opts?: { formats?: string[] }): BarcodeDetectorLike;
      getSupportedFormats?: () => Promise<string[]>;
    };
  }
}

const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e"];

/**
 * Escaneo del código de barras del libro (EAN-13 = ISBN) con la cámara.
 * Todo ocurre en el dispositivo: no se sube ninguna imagen.
 *
 * Los códigos de los libros son pequeños, así que la cámara se pide con la
 * máxima resolución disponible y con autoenfoque continuo; sin eso, a la
 * distancia a la que uno sostiene un libro la imagen sale borrosa y no
 * decodifica. Se ofrecen además zoom y linterna cuando el dispositivo los
 * soporta, y toque para reenfocar.
 */
export function BarcodeScanner({ onDetected, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const doneRef = useRef(false);

  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const [zoom, setZoom] = useState<{ min: number; max: number; step: number } | null>(null);
  const [zoomValue, setZoomValue] = useState(1);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [hint, setHint] = useState("Enfoca el código de barras de la contraportada");

  const finish = useCallback(
    (raw: string) => {
      if (doneRef.current) return;
      const text = raw.replace(/[^0-9Xx]/g, "");
      if (text.length !== 13 && text.length !== 10) return;
      doneRef.current = true;
      onDetected(text);
    },
    [onDetected]
  );

  useEffect(() => {
    let stream: MediaStream | undefined;
    let controls: { stop: () => void } | undefined;
    let raf = 0;
    let cancelled = false;

    async function start() {
      try {
        // Resolución alta y cámara trasera: un EAN-13 de libro ocupa pocos
        // milímetros y necesita píxeles suficientes por barra.
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        if (cancelled) return;

        const track = stream.getVideoTracks()[0];
        trackRef.current = track;

        const caps = (track.getCapabilities?.() ?? {}) as AdvancedCapabilities;

        // Autoenfoque continuo: es lo que faltaba para los códigos pequeños.
        if (caps.focusMode?.includes("continuous")) {
          await track
            .applyConstraints({
              advanced: [{ focusMode: "continuous" } as AdvancedConstraint],
            } as MediaTrackConstraints)
            .catch(() => {});
        }

        if (caps.zoom) {
          setZoom(caps.zoom);
          setZoomValue(caps.zoom.min <= 1 ? 1 : caps.zoom.min);
        }
        if (caps.torch) setHasTorch(true);

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        await video.play().catch(() => {});
        setStarting(false);

        // 1) BarcodeDetector nativo si está disponible.
        const supported = window.BarcodeDetector?.getSupportedFormats
          ? await window.BarcodeDetector.getSupportedFormats().catch(() => [])
          : [];
        const useNative =
          !!window.BarcodeDetector && supported.some((f) => FORMATS.includes(f));

        if (useNative) {
          const detector = new window.BarcodeDetector!({
            formats: FORMATS.filter((f) => supported.includes(f)),
          });
          const tick = async () => {
            if (cancelled || doneRef.current) return;
            try {
              const found = await detector.detect(video);
              if (found[0]?.rawValue) finish(found[0].rawValue);
            } catch {
              // Fotograma no listo: se reintenta en el siguiente.
            }
            if (!doneRef.current && !cancelled) raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
          return;
        }

        // 2) Respaldo: ZXing sobre el mismo flujo, esforzándose más.
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);
        const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 120 });
        controls = await reader.decodeFromStream(stream, video, (result) => {
          if (result) finish(result.getText());
        });
        if (cancelled || doneRef.current) controls.stop();
      } catch (err: any) {
        if (cancelled) return;
        setStarting(false);
        if (err?.name === "NotAllowedError") {
          setError("No hay permiso para usar la cámara. Actívalo o introduce el ISBN a mano.");
        } else if (err?.name === "NotFoundError" || err?.name === "OverconstrainedError") {
          setError("No se ha encontrado una cámara utilizable en este dispositivo.");
        } else {
          setError("No se ha podido abrir la cámara.");
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      controls?.stop();
      stream?.getTracks().forEach((t) => t.stop());
      trackRef.current = null;
    };
  }, [finish]);

  /** Acercar ayuda cuando el código es pequeño: más píxeles por barra. */
  async function changeZoom(value: number) {
    setZoomValue(value);
    await trackRef.current
      ?.applyConstraints({ advanced: [{ zoom: value } as AdvancedConstraint] } as MediaTrackConstraints)
      .catch(() => {});
  }

  async function toggleTorch() {
    const next = !torchOn;
    setTorchOn(next);
    await trackRef.current
      ?.applyConstraints({ advanced: [{ torch: next } as AdvancedConstraint] } as MediaTrackConstraints)
      .catch(() => {});
  }

  /** Toque para reenfocar donde el dispositivo lo permite. */
  async function refocus(e: React.MouseEvent<HTMLDivElement>) {
    const track = trackRef.current;
    if (!track) return;
    const caps = (track.getCapabilities?.() ?? {}) as AdvancedCapabilities;
    const rect = e.currentTarget.getBoundingClientRect();
    const point = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
    const advanced: AdvancedConstraint[] = [];
    if (caps.focusMode?.includes("single-shot")) {
      advanced.push({ focusMode: "single-shot", pointsOfInterest: [point] });
    } else if (caps.focusMode?.includes("continuous")) {
      advanced.push({ focusMode: "continuous", pointsOfInterest: [point] });
    }
    if (!advanced.length) return;
    setHint("Reenfocando…");
    await track
      .applyConstraints({ advanced } as MediaTrackConstraints)
      .catch(() => {});
    setTimeout(
      () => setHint("Enfoca el código de barras de la contraportada"),
      1200
    );
  }

  return (
    <div className="on-dark overflow-hidden rounded-xl bg-ink">
      <div
        className="relative aspect-[4/3] w-full"
        onClick={refocus}
        role="presentation"
      >
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
          autoPlay
        />

        {/* Guía de encuadre */}
        {!error && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[30%] w-[80%] rounded-lg border-2 border-paper/80 shadow-[0_0_0_100vmax_rgba(0,0,0,0.35)]" />
          </div>
        )}

        {(starting || error) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink/80 p-6 text-center">
            <p className="text-body text-paper/90">
              {error ?? "Abriendo la cámara…"}
            </p>
            {error && (
              <button
                onClick={onCancel}
                className="inline-flex min-h-11 items-center rounded-full bg-paper px-5 text-body font-medium text-ink"
              >
                Introducir ISBN a mano
              </button>
            )}
          </div>
        )}
      </div>

      {!error && (
        <div className="space-y-3 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-meta text-paper/80">{hint}</p>
            <div className="flex shrink-0 items-center gap-2">
              {hasTorch && (
                <button
                  onClick={toggleTorch}
                  aria-pressed={torchOn}
                  className={
                    "inline-flex min-h-9 items-center rounded-full border px-3 text-meta transition " +
                    (torchOn
                      ? "border-paper bg-paper text-ink"
                      : "border-paper/30 text-paper hover:bg-paper/10")
                  }
                >
                  Luz
                </button>
              )}
              <button
                onClick={onCancel}
                className="inline-flex min-h-9 shrink-0 items-center rounded-full border border-paper/30 px-4 text-meta text-paper transition hover:bg-paper/10"
              >
                Cancelar
              </button>
            </div>
          </div>

          {/* Acercar: decisivo cuando el código de barras es pequeño */}
          {zoom && zoom.max > zoom.min && (
            <label className="flex items-center gap-3 text-meta text-paper/80">
              Zoom
              <input
                type="range"
                min={zoom.min}
                max={zoom.max}
                step={zoom.step || 0.1}
                value={zoomValue}
                onChange={(e) => changeZoom(Number(e.target.value))}
                className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-paper/25 accent-paper"
                aria-label="Acercar la cámara"
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}
