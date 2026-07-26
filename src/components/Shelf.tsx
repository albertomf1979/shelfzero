import type { Book, SortMode, ViewMode } from "../types";
import { googleBuyUrl } from "../api";
import { Cover } from "./Cover";

type Props = {
  books: Book[];
  view: ViewMode;
  sort: SortMode;
  onOpen: (book: Book) => void;
  onToggleBought: (book: Book) => void;
};

/** Agrupa por autor o temática cuando el orden lo pide (FR6). */
function group(books: Book[], sort: SortMode): { label: string | null; books: Book[] }[] {
  if (sort !== "author" && sort !== "subject") {
    return [{ label: null, books }];
  }
  const groups = new Map<string, Book[]>();
  for (const b of books) {
    const key =
      sort === "author"
        ? b.authors[0] ?? "Sin autor"
        : b.subjects[0] ?? "Sin temática";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(b);
  }
  return [...groups.entries()].map(([label, books]) => ({ label, books }));
}

export function Shelf({ books, view, sort, onOpen, onToggleBought }: Props) {
  const groups = group(books, sort);

  return (
    <div className="space-y-10">
      {groups.map(({ label, books: groupBooks }) => (
        <section key={label ?? "all"}>
          {label && (
            <h2 className="mb-4 flex items-center gap-3 font-display text-lg text-ink-soft">
              <span>{label}</span>
              <span className="h-px flex-1 bg-ink/10" />
              <span className="text-sm text-ink-faint">{groupBooks.length}</span>
            </h2>
          )}

          {view === "shelf" ? (
            <ShelfView
              books={groupBooks}
              onOpen={onOpen}
              onToggleBought={onToggleBought}
            />
          ) : (
            <ListView
              books={groupBooks}
              onOpen={onOpen}
              onToggleBought={onToggleBought}
            />
          )}
        </section>
      ))}
    </div>
  );
}

/** Vista estantería: galería de portadas sobre baldas de madera. */
function ShelfView({
  books,
  onOpen,
  onToggleBought,
}: Omit<Props, "view" | "sort">) {
  // Repartimos en baldas de 6 (se adapta con el grid en móvil).
  return (
    <div className="grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {books.map((book) => (
        <div key={book.id} className="group flex flex-col">
          <button
            onClick={() => onOpen(book)}
            className="relative block w-full text-left transition duration-200 hover:-translate-y-1.5"
            aria-label={`Abrir ficha de ${book.title}`}
          >
            <Cover
              url={book.coverUrl}
              title={book.title}
              authors={book.authors}
              className={`aspect-[2/3] w-full shadow-md shadow-ink/20 transition group-hover:shadow-xl group-hover:shadow-ink/25 ${
                book.status === "bought" ? "opacity-60 saturate-50" : ""
              }`}
            />
            {book.status === "bought" && (
              <span className="absolute right-1.5 top-1.5 rounded-full bg-ink/85 px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide text-paper">
                Comprado
              </span>
            )}
          </button>

          {/* Balda */}
          <div className="mt-1 h-1.5 rounded-b-sm bg-gradient-to-b from-wood to-wood/60 shadow-sm" />

          <div className="mt-2 px-0.5">
            <p className="font-display text-[0.8rem] leading-tight line-clamp-2">
              {book.title}
            </p>
            <p className="mt-0.5 text-[0.7rem] text-ink-faint line-clamp-1">
              {book.authors[0] ?? "—"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Vista lista: filas compactas con acciones rápidas. */
function ListView({ books, onOpen, onToggleBought }: Omit<Props, "view" | "sort">) {
  return (
    <ul className="divide-y divide-ink/8 overflow-hidden rounded-xl border border-ink/10 bg-paper/50">
      {books.map((book) => (
        <li
          key={book.id}
          className="flex items-center gap-4 p-3 transition hover:bg-paper-2/50 sm:p-4"
        >
          <button onClick={() => onOpen(book)} className="shrink-0">
            <Cover
              url={book.coverUrl}
              title={book.title}
              authors={book.authors}
              className={`h-20 w-14 shadow-sm ${
                book.status === "bought" ? "opacity-60 saturate-50" : ""
              }`}
            />
          </button>

          <button
            onClick={() => onOpen(book)}
            className="min-w-0 flex-1 text-left"
          >
            <h3 className="font-display text-base leading-snug line-clamp-1">
              {book.title}
            </h3>
            <p className="mt-0.5 text-sm text-ink-soft line-clamp-1">
              {book.authors.join(", ") || "Autor desconocido"}
            </p>
            <p className="mt-1 text-xs text-ink-faint line-clamp-1">
              {[book.subjects[0], book.publishedYear].filter(Boolean).join(" · ")}
            </p>
          </button>

          <div className="flex shrink-0 items-center gap-1.5">
            <a
              href={googleBuyUrl(book)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-ink/5"
              title="Buscar dónde comprarlo en Google"
            >
              Buscar
            </a>
            <button
              onClick={() => onToggleBought(book)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                book.status === "bought"
                  ? "bg-ink/10 text-ink-soft hover:bg-ink/15"
                  : "border border-ink/15 text-ink hover:bg-ink/5"
              }`}
              title={
                book.status === "bought"
                  ? "Marcar como pendiente"
                  : "Marcar como comprado"
              }
            >
              {book.status === "bought" ? "✓ Comprado" : "Comprado"}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
