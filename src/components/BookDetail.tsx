import { useEffect } from "react";
import type { Book, BookList } from "../types";
import { googleBuyUrl } from "../api";
import { Cover } from "./Cover";

type Props = {
  book: Book | null;
  lists: BookList[];
  onClose: () => void;
  onToggleBought: (book: Book) => void;
  onDelete: (book: Book) => void;
  onToggleList: (book: Book, listId: number, add: boolean) => void;
};

export function BookDetail({
  book,
  lists,
  onClose,
  onToggleBought,
  onDelete,
  onToggleList,
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 p-4 pt-[6vh] backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`Ficha de ${book.title}`}
    >
      <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-paper shadow-2xl">
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
            <Cover
              url={book.coverUrl}
              title={book.title}
              authors={book.authors}
              className="mx-auto h-56 w-38 shrink-0 shadow-xl shadow-ink/25 sm:mx-0 sm:h-64 sm:w-44"
            />

            <div className="min-w-0 flex-1">
              {book.status === "bought" && (
                <span className="mb-2 inline-block rounded-full bg-ink/10 px-3 py-1 text-[0.7rem] font-medium uppercase tracking-wide text-ink-soft">
                  ✓ Comprado
                </span>
              )}

              <h1 className="font-display text-2xl leading-tight sm:text-3xl">
                {book.title}
              </h1>
              <p className="mt-2 text-lg text-ink-soft">
                {book.authors.join(", ") || "Autor desconocido"}
              </p>

              {meta.length > 0 && (
                <p className="mt-3 text-sm text-ink-faint">{meta.join(" · ")}</p>
              )}

              {book.subjects.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {book.subjects.slice(0, 6).map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-paper-3/70 px-2.5 py-1 text-xs text-ink-soft"
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
              <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-faint">
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
              <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-faint">
                Listas
              </h2>
              <div className="flex flex-wrap gap-2">
                {lists.map((l) => {
                  const active = book.listIds.includes(l.id);
                  return (
                    <button
                      key={l.id}
                      onClick={() => onToggleList(book, l.id, !active)}
                      className={`rounded-full px-3 py-1.5 text-sm transition ${
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
              className="rounded-full bg-spine px-6 py-2.5 text-sm font-medium text-paper transition hover:bg-spine-dark"
            >
              Buscar dónde comprarlo ↗
            </a>
            <button
              onClick={() => onToggleBought(book)}
              className="rounded-full border border-ink/20 px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-ink/5"
            >
              {book.status === "bought"
                ? "Marcar como pendiente"
                : "Marcar como comprado"}
            </button>
            <button
              onClick={() => onDelete(book)}
              className="ml-auto rounded-full px-4 py-2.5 text-sm font-medium text-ink-faint transition hover:bg-spine/10 hover:text-spine"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
