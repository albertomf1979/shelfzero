import type { Book } from "../types";
import { googleBuyUrl } from "../api";
import { Sheet } from "./Sheet";

type Props = {
  book: Book | null;
  onClose: () => void;
  onOpenDetail: (book: Book) => void;
  onToggleBought: (book: Book) => void;
  onShare: (book: Book) => void;
  onDelete: (book: Book) => void;
};

/** Acciones de un libro desde la vista lista (el botón «⋯»). */
export function BookMenu({
  book,
  onClose,
  onOpenDetail,
  onToggleBought,
  onShare,
  onDelete,
}: Props) {
  if (!book) return null;
  const bought = book.status === "bought";

  return (
    <Sheet open={!!book} onClose={onClose} labelledBy="bookmenu-title" size="sm">
      <div className="p-5">
        <h2
          id="bookmenu-title"
          className="mb-1 line-clamp-2 font-display text-lg font-semibold"
        >
          {book.title}
        </h2>
        <p className="mb-4 line-clamp-1 text-meta text-ink-faint">
          {book.authors.join(", ") || "Autor desconocido"}
        </p>

        <div className="flex flex-col">
          <a
            href={googleBuyUrl(book)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            data-autofocus
            className="flex min-h-12 items-center rounded-lg px-3 text-body font-medium text-ink transition hover:bg-paper-2"
          >
            Buscar dónde comprarlo ↗
          </a>
          <button
            onClick={() => {
              onOpenDetail(book);
              onClose();
            }}
            className="flex min-h-12 items-center rounded-lg px-3 text-left text-body text-ink transition hover:bg-paper-2"
          >
            Ver ficha
          </button>
          <button
            onClick={() => {
              onToggleBought(book);
              onClose();
            }}
            className="flex min-h-12 items-center rounded-lg px-3 text-left text-body text-ink transition hover:bg-paper-2"
          >
            {bought ? "Devolver a la lista de deseos" : "Marcar como adquirido"}
          </button>
          <button
            onClick={() => {
              onShare(book);
              onClose();
            }}
            className="flex min-h-12 items-center rounded-lg px-3 text-left text-body text-ink transition hover:bg-paper-2"
          >
            Compartir
          </button>

          <div className="my-2 h-px bg-rule/50" />

          <button
            onClick={() => {
              onDelete(book);
              onClose();
            }}
            className="flex min-h-12 items-center rounded-lg px-3 text-left text-body font-medium text-danger transition hover:bg-danger/10"
          >
            Quitar del estante
          </button>
        </div>
      </div>
    </Sheet>
  );
}
