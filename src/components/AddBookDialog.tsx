import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";
import type { BookCandidate } from "../types";
import { Cover } from "./Cover";

// La librería de escaneo pesa ~450 kB: solo se descarga al abrir la cámara.
const BarcodeScanner = lazy(() =>
  import("./BarcodeScanner").then((m) => ({ default: m.BarcodeScanner }))
);

type Mode = "search" | "isbn" | "scan";

type Props = {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
};

/** Detecta si lo tecleado parece un ISBN (10/13 dígitos con guiones o no). */
function looksLikeIsbn(value: string): boolean {
  const digits = value.replace(/[^0-9Xx]/g, "");
  return (
    (digits.length === 10 || digits.length === 13) && /^[\d-\sXx]+$/.test(value)
  );
}

export function AddBookDialog({ open, onClose, onAdded }: Props) {
  const [mode, setMode] = useState<Mode>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      // Al cerrar, volver al estado inicial (y apagar la cámara si estaba activa).
      setQuery("");
      setResults([]);
      setMessage(null);
      setLoading(false);
      setMode("search");
    }
  }, [open]);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setMessage(null);
    setResults([]);

    try {
      // Si parece un ISBN, buscamos exacto aunque esté en modo búsqueda.
      if (mode === "isbn" || looksLikeIsbn(q)) {
        const { book } = await api.lookupIsbn(q);
        if (book) {
          setResults([book]);
        } else {
          // FR3: sin coincidencias -> pedir el título.
          setMessage(
            "No hemos encontrado ese ISBN. Prueba a buscar por título."
          );
          setMode("search");
        }
      } else {
        const { results } = await api.search(q);
        setResults(results);
        if (results.length === 0) {
          setMessage(
            "Sin coincidencias. Revisa el título o añádelo manualmente."
          );
        }
      }
    } catch (err: any) {
      setMessage(err?.message ?? "No se ha podido buscar. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(candidate: BookCandidate) {
    const key = candidate.isbn13 ?? candidate.title;
    setAddingKey(key);
    setMessage(null);
    try {
      await api.addBook(candidate);
      onAdded();
      onClose();
    } catch (err: any) {
      if (err?.status === 409) {
        setMessage("Ese libro ya está en tu estante.");
      } else {
        setMessage(err?.message ?? "No se ha podido guardar.");
      }
    } finally {
      setAddingKey(null);
    }
  }

  /** El escáner ha leído un ISBN: buscarlo directamente. */
  const handleScanned = useCallback(async (isbn: string) => {
    setMode("isbn");
    setQuery(isbn);
    setLoading(true);
    setMessage(null);
    setResults([]);
    try {
      const { book } = await api.lookupIsbn(isbn);
      if (book) {
        setResults([book]);
      } else {
        setMessage(
          `Hemos leído el ISBN ${isbn}, pero no está en los catálogos. Prueba a buscarlo por título.`
        );
        setMode("search");
        setQuery("");
      }
    } catch {
      setMessage("No se ha podido consultar ese ISBN.");
    } finally {
      setLoading(false);
    }
  }, []);

  /** Alta manual mínima cuando no hay coincidencias (FR3). */
  async function handleManualAdd() {
    const title = query.trim();
    if (!title) return;
    await handleAdd({ title, authors: [], subjects: [], source: "manual" });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 p-4 pt-[8vh] backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Añadir libro"
    >
      <div className="flex max-h-[84vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-paper shadow-2xl">
        {/* Cabecera + buscador */}
        <div className="border-b border-ink/10 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl">Añadir un libro</h2>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-ink-faint transition hover:bg-ink/5 hover:text-ink"
              aria-label="Cerrar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-3 flex gap-1 rounded-full bg-ink/5 p-1 text-sm">
            <button
              onClick={() => setMode("scan")}
              className={`flex-1 rounded-full px-3 py-1.5 transition ${
                mode === "scan" ? "bg-paper text-ink shadow-sm" : "text-ink-faint"
              }`}
            >
              Escanear
            </button>
            <button
              onClick={() => setMode("search")}
              className={`flex-1 rounded-full px-3 py-1.5 transition ${
                mode === "search" ? "bg-paper text-ink shadow-sm" : "text-ink-faint"
              }`}
            >
              Por título
            </button>
            <button
              onClick={() => setMode("isbn")}
              className={`flex-1 rounded-full px-3 py-1.5 transition ${
                mode === "isbn" ? "bg-paper text-ink shadow-sm" : "text-ink-faint"
              }`}
            >
              Por ISBN
            </button>
          </div>

          {mode !== "scan" && (
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                inputMode={mode === "isbn" ? "numeric" : "text"}
                placeholder={
                  mode === "isbn"
                    ? "978-84-9992-622-3"
                    : "Título del libro o autor…"
                }
                className="flex-1 rounded-full border border-ink/15 bg-paper-2/50 px-5 py-3 text-base outline-none transition placeholder:text-ink-faint/70 focus:border-spine/40 focus:bg-paper"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="rounded-full bg-spine px-6 py-3 font-medium text-paper transition hover:bg-spine-dark disabled:opacity-40"
              >
                {loading ? "Buscando…" : "Buscar"}
              </button>
            </form>
          )}
        </div>

        {/* Resultados */}
        <div className="flex-1 overflow-y-auto p-5">
          {mode === "scan" && (
            <div className="mb-4">
              <Suspense
                fallback={
                  <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-ink text-sm text-paper/80">
                    Preparando la cámara…
                  </div>
                }
              >
                <BarcodeScanner
                  onDetected={handleScanned}
                  onCancel={() => setMode("isbn")}
                />
              </Suspense>
            </div>
          )}

          {message && (
            <div className="mb-4 rounded-xl border border-gold/30 bg-gold/10 p-4 text-sm text-ink-soft">
              <p>{message}</p>
              {results.length === 0 && query.trim() && (
                <button
                  onClick={handleManualAdd}
                  className="mt-3 rounded-full border border-ink/20 px-4 py-1.5 text-sm font-medium text-ink transition hover:bg-ink/5"
                >
                  Añadir «{query.trim()}» manualmente
                </button>
              )}
            </div>
          )}

          {loading && (
            <p className="py-8 text-center text-sm text-ink-faint">
              Buscando en Google Books y Open Library…
            </p>
          )}

          {!loading && results.length > 0 && (
            <>
              <p className="mb-3 text-xs uppercase tracking-wider text-ink-faint">
                {results.length === 1
                  ? "1 coincidencia"
                  : `${results.length} coincidencias — elige la edición`}
              </p>
              <ul className="space-y-2">
                {results.map((b, i) => {
                  const key = `${b.isbn13 ?? b.title}-${i}`;
                  const busy = addingKey === (b.isbn13 ?? b.title);
                  return (
                    <li
                      key={key}
                      className="flex gap-4 rounded-xl border border-transparent p-3 transition hover:border-ink/10 hover:bg-paper-2/60"
                    >
                      <Cover
                        url={b.coverUrl}
                        title={b.title}
                        authors={b.authors}
                        className="h-24 w-16 shrink-0 shadow-sm"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display text-base leading-snug">
                          {b.title}
                        </h3>
                        <p className="mt-0.5 text-sm text-ink-soft">
                          {b.authors.join(", ") || "Autor desconocido"}
                        </p>
                        <p className="mt-1 text-xs text-ink-faint">
                          {[b.publisher, b.publishedYear, b.isbn13]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <button
                        onClick={() => handleAdd(b)}
                        disabled={busy}
                        className="shrink-0 self-center rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink-soft disabled:opacity-40"
                      >
                        {busy ? "…" : "Guardar"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {!loading && results.length === 0 && !message && mode !== "scan" && (
            <p className="py-10 text-center text-sm text-ink-faint">
              Escanea el código de barras, busca por título o introduce un ISBN.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
