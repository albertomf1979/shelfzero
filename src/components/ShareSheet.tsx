import { useEffect, useState } from "react";
import { api } from "../api";

type Target =
  | { kind: "book"; refId: number; label: string }
  | { kind: "list"; refId: number; label: string };

type Props = {
  target: Target | null;
  onClose: () => void;
};

/** FR11: compartir por email, SMS, WhatsApp, X o copiando el enlace. */
export function ShareSheet({ target, onClose }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!target) {
      setUrl(null);
      setError(null);
      setCopied(false);
      return;
    }
    let cancelled = false;
    api
      .createShare(target.kind, target.refId)
      .then((r) => !cancelled && setUrl(r.url))
      .catch(() => !cancelled && setError("No se ha podido crear el enlace."));
    return () => {
      cancelled = true;
    };
  }, [target]);

  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [target, onClose]);

  if (!target) return null;

  const text =
    target.kind === "list"
      ? `Mira mi lista de libros «${target.label}» en ShelfZero`
      : `Mira este libro: ${target.label}`;

  const channels = url
    ? [
        {
          name: "WhatsApp",
          href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
        },
        {
          name: "Email",
          href: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`,
        },
        {
          name: "SMS",
          href: `sms:?&body=${encodeURIComponent(`${text} ${url}`)}`,
        },
        {
          name: "X",
          href: `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        },
      ]
    : [];

  async function nativeShare() {
    if (!url) return;
    try {
      await navigator.share({ title: "ShelfZero", text, url });
      onClose();
    } catch {
      // El usuario canceló: no hacemos nada.
    }
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("No se ha podido copiar. Selecciona el enlace a mano.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Compartir"
    >
      <div className="w-full max-w-md rounded-2xl bg-paper p-6 shadow-sheet">
        <div className="mb-1 flex items-start justify-between gap-4">
          <h2 className="font-display text-xl">Compartir</h2>
          <button
            onClick={onClose}
            className="-mr-2 -mt-1 rounded-full p-2 text-ink-faint transition hover:bg-ink/5 hover:text-ink"
            aria-label="Cerrar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="mb-5 text-body text-ink-soft">{target.label}</p>

        {error && (
          <p className="mb-4 rounded-lg bg-danger/10 p-3 text-body text-danger">
            {error}
          </p>
        )}

        {!url && !error && (
          <p className="py-6 text-center text-body text-ink-faint">
            Creando enlace…
          </p>
        )}

        {url && (
          <>
            {/* Compartir nativo (móvil) */}
            {typeof navigator !== "undefined" && "share" in navigator && (
              <button
                onClick={nativeShare}
                className="mb-3 w-full rounded-full bg-spine px-5 py-3 text-body font-medium text-paper transition hover:bg-spine-dark"
              >
                Compartir…
              </button>
            )}

            <div className="grid grid-cols-4 gap-2">
              {channels.map((ch) => (
                <a
                  key={ch.name}
                  href={ch.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-ink/12 px-2 py-3 text-meta font-medium text-ink-soft transition hover:border-ink/25 hover:bg-paper-2/60"
                >
                  {ch.name}
                </a>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl bg-paper-2/70 p-2">
              <span className="min-w-0 flex-1 truncate px-2 text-meta text-ink-faint">
                {url}
              </span>
              <button
                onClick={copy}
                className="shrink-0 rounded-full bg-ink px-4 py-2 text-meta font-medium text-paper transition hover:bg-ink-soft"
              >
                {copied ? "¡Copiado!" : "Copiar"}
              </button>
            </div>

            <p className="mt-4 text-center text-meta text-ink-faint">
              Quien tenga el enlace podrá ver esto en modo lectura.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
