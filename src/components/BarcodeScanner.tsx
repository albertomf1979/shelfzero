import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

type Props = {
  onDetected: (isbn: string) => void;
  onCancel: () => void;
};

/**
 * Escaneo del código de barras del libro (EAN-13 = ISBN) con la cámara.
 * Todo ocurre en el dispositivo: no se sube ninguna imagen.
 */
export function BarcodeScanner({ onDetected, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let stopped = false;
    let controls: { stop: () => void } | undefined;

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.CODE_128,
    ]);
    const reader = new BrowserMultiFormatReader(hints);

    (async () => {
      try {
        controls = await reader.decodeFromVideoDevice(
          undefined, // cámara por defecto (trasera en móvil)
          videoRef.current!,
          (result) => {
            if (stopped || !result) return;
            const text = result.getText().replace(/[^0-9Xx]/g, "");
            if (text.length === 13 || text.length === 10) {
              stopped = true;
              controls?.stop();
              onDetected(text);
            }
          }
        );
        if (stopped) controls.stop();
        setStarting(false);
      } catch (err: any) {
        setStarting(false);
        if (err?.name === "NotAllowedError") {
          setError(
            "No hay permiso para usar la cámara. Actívalo o introduce el ISBN a mano."
          );
        } else if (err?.name === "NotFoundError") {
          setError("No se ha encontrado ninguna cámara en este dispositivo.");
        } else {
          setError("No se ha podido abrir la cámara.");
        }
      }
    })();

    return () => {
      stopped = true;
      controls?.stop();
    };
  }, [onDetected]);

  return (
    <div className="overflow-hidden rounded-xl bg-ink">
      <div className="relative aspect-[4/3] w-full">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
        />

        {/* Guía de encuadre */}
        {!error && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[28%] w-[78%] rounded-lg border-2 border-paper/80 shadow-[0_0_0_100vmax_rgba(0,0,0,0.35)]" />
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
                className="rounded-full bg-paper px-5 py-2 text-body font-medium text-ink"
              >
                Introducir ISBN a mano
              </button>
            )}
          </div>
        )}
      </div>

      {!error && (
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <p className="text-body text-paper/80">
            Enfoca el código de barras de la contraportada
          </p>
          <button
            onClick={onCancel}
            className="shrink-0 rounded-full border border-paper/30 px-4 py-1.5 text-body text-paper transition hover:bg-paper/10"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
