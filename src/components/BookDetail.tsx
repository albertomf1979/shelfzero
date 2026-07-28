import { useEffect } from "react";
import type { Book, BookList } from "../types";
import { googleBuyUrl } from "../api";
import { formatDate, isoDate } from "../lib/dates";
import { cleanSubjects } from "../lib/subjects";
import { Cover } from "./Cover";

type Props = {
  book: Book | null;
  lists: BookList[];
  onClose: () => void;
  onToggleBought: (book: Book) => void;
  onDelete: (book: Book) => void;
  onToggleList: (book: Book, listId: number, add: boolean) => void;
  onShare: (book: Book) => void;
};

export function BookDetail({
  book,
  lists,
  onClose,
  onToggleBought,
  onDelete,
  onToggleList,
  onShare,
}: Props) {
  useEffect(() => {
    if (!book) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [book, onClose]);

  if (!book) return null;

  const meta = [
    book.publisher,
    book.publishedYear,
    book.isbn13 ? `ISBN ${book.isbn13}` : book.isbn10 ? `ISBN ${book.isbn10}` : null,
  ].filter(Boolean);
  const subjects = cleanSubjects(book.subjects, 4);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 p-4 pt-[6vh] backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`Ficha de ${book.title}`}
    >
      <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-paper shadow-sheet">
        <div className="relative p-6 sm:p-8">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-ink-faint transition hover:bg-ink/5 hover:text-ink"
            aria-label="Cerrar ficha"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
            <div className="relative mx-auto shrink-0 sm:mx-0">
              <Cover
                url={book.coverUrl}
                title={book.title}
                authors={book.authors}
                className={`h-56 w-[9.5rem] rounded-sm shadow-cover-lift sm:h-64 sm:w-44 ${
                  book.status === "bought" ? "saturate-[.55] opacity-90" : ""
                }`}
                loading="eager"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 w-[3px] rounded-l-sm bg-gradient-to-r from-ink/35 via-ink/10 to-transparent"
              />
              {book.status === "bought" && (
                <span
                  className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-[2px] border border-gold-deep/70 bg-paper/70 px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-gold-deep mix-blend-multiply"
                  style={{
                    animation: "sz-stamp var(--dur-slow) var(--ease-paper) both",
                    transform: "rotate(-6deg)",
                  }}
                >
                  Comprado
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl leading-tight sm:text-3xl">
                {book.title}
              </h1>
              <p className="mt-2 text-lg text-ink-soft">
                {book.authors.join(", ") || "Autor desconocido"}
              </p>

              {meta.length > 0 && (
                <p className="mt-3 text-body text-ink-faint">{meta.join(" · ")}</p>
              )}

              {/* Cuándo entró al estante y quién lo recomendó */}
              <p className="mt-1.5 text-meta text-ink-faint">
                <time dateTime={isoDate(book.createdAt)}>
                  Añadido el {formatDate(book.createdAt)}
                </time>
              </p>
              {book.recommendedBy && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-paper-3 px-3 py-1 text-meta text-ink-soft">
                  Recomendación de{" "}
                  <strong className="font-medium">{book.recommendedBy}</strong>
                </p>
              )}

              {/* Temáticas limpias: sin ruido de catálogo y en español si se conoce */}
              {subjects.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {subjects.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-paper-3 px-2.5 py-1 text-meta text-ink-soft"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {book.description && (
            <div className="mt-7">
              <h2 className="mb-2 text-meta font-medium uppercase tracking-wider text-ink-faint">
                Resumen
              </h2>
              <p className="whitespace-pre-line text-[0.95rem] leading-relaxed text-ink-soft">
                {book.description.length > 900
                  ? `${book.description.slice(0, 900)}…`
                  : book.description}
              </p>
            </div>
          )}

          {/* Listas */}
          {lists.length > 0 && (
            <div className="mt-7">
              <h2 className="mb-2 text-meta font-medium uppercase tracking-wider text-ink-faint">
                Listas
              </h2>
              <div className="flex flex-wrap gap-2">
                {lists.map((l) => {
                  const active = book.listIds.includes(l.id);
                  return (
                    <button
                      key={l.id}
                      onClick={() => onToggleList(book, l.id, !active)}
                      className={`rounded-full px-3 py-1.5 text-body transition ${
                        active
                          ? "bg-spine text-paper"
                          : "border border-ink/15 text-ink-soft hover:bg-ink/5"
                      }`}
                    >
                      {active ? "✓ " : "+ "}
                      {l.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="mt-8 flex flex-wrap gap-2 border-t border-ink/10 pt-6">
            <a
              href={googleBuyUrl(book)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-spine px-6 py-2.5 text-body font-medium text-paper transition hover:bg-spine-dark"
            >
              Buscar dónde comprarlo ↗
            </a>
            <button
              onClick={() => onToggleBought(book)}
              className="rounded-full border border-ink/20 px-5 py-2.5 text-body font-medium text-ink transition hover:bg-ink/5"
            >
              {book.status === "bought"
                ? "Marcar como pendiente"
                : "Marcar como comprado"}
            </button>
            <button
              onClick={() => onShare(book)}
              className="rounded-full border border-ink/20 px-5 py-2.5 text-body font-medium text-ink transition hover:bg-ink/5"
            >
              Compartir
            </button>
            <button
              onClick={() => onDelete(book)}
              className="ml-auto rounded-full px-4 py-2.5 text-body font-medium text-ink-faint transition hover:bg-danger/10 hover:text-danger"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
