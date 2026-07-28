import { useEffect, useState } from "react";
import type { Book, SortMode, ViewMode } from "../types";
import { formatDateShort, isoDate } from "../lib/dates";
import { cleanSubjects } from "../lib/subjects";
import { Cover } from "./Cover";
import { IconMore } from "./icons";

type Props = {
  books: Book[];
  view: ViewMode;
  sort: SortMode;
  onOpen: (book: Book) => void;
  onMenu: (book: Book) => void;
};

/** Agrupa por autor o temática cuando el orden lo pide (FR6). */
function group(
  books: Book[],
  sort: SortMode
): { label: string | null; books: Book[] }[] {
  if (sort !== "author" && sort !== "subject") {
    return [{ label: null, books }];
  }
  const groups = new Map<string, Book[]>();
  for (const b of books) {
    const key =
      sort === "author"
        ? b.authors[0] ?? "Sin autor"
        : cleanSubjects(b.subjects)[0] ?? "Sin temática";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(b);
  }
  return [...groups.entries()].map(([label, books]) => ({ label, books }));
}

export function Shelf({ books, view, sort, onOpen, onMenu }: Props) {
  const groups = group(books, sort);

  return (
    <div className="space-y-10">
      {groups.map(({ label, books: groupBooks }) => (
        <section key={label ?? "all"}>
          {label && (
            <h2 className="mb-4 flex items-center gap-3 font-display text-lg text-ink-soft">
              <span>{label}</span>
              <span className="h-px flex-1 bg-rule/50" />
              <span className="text-meta tabular-nums text-ink-faint">
                {groupBooks.length}
              </span>
            </h2>
          )}

          {view === "shelf" ? (
            <ShelfView books={groupBooks} onOpen={onOpen} />
          ) : (
            <ListView books={groupBooks} onOpen={onOpen} onMenu={onMenu} />
          )}
        </section>
      ))}
    </div>
  );
}

// --- Vista estantería ------------------------------------------------------

/** Columnas según el ancho: la balda se dibuja por fila, así que hay que saberlas. */
function useColumns() {
  const [cols, setCols] = useState(3);
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      setCols(w < 340 ? 2 : w < 640 ? 3 : w < 768 ? 4 : w < 1024 ? 5 : 6);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  return cols;
}

function chunk<T>(xs: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n));
  return out;
}

/**
 * Una fila de libros apoyados sobre una balda continua.
 * Alinear al canto inferior es lo que absorbe la disparidad de portadas.
 */
function ShelfRow({
  row,
  cols,
  offset,
  onOpen,
  tone = "light",
}: {
  row: Book[];
  cols: number;
  offset: number;
  onOpen: (b: Book) => void;
  tone?: "light" | "dark";
}) {
  return (
    <li className="list-none">
      <div className="flex items-end gap-3 sm:gap-4">
        {row.map((b, i) => (
          <BookOnShelf
            key={b.id}
            book={b}
            index={offset + i}
            onOpen={onOpen}
          />
        ))}
        {/* Rellenos para que la balda llegue de lado a lado */}
        {Array.from({ length: cols - row.length }).map((_, i) => (
          <div key={`gap-${i}`} aria-hidden="true" className="min-w-0 flex-1" />
        ))}
      </div>

      {/* La balda: cara + canto */}
      <div aria-hidden="true" className="mt-1.5">
        <div
          className={
            "h-2 rounded-[1px] " +
            (tone === "dark"
              ? "bg-gradient-to-b from-wood-dark to-wood-dark/70"
              : "bg-gradient-to-b from-wood to-wood-dark")
          }
          style={{ boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.18)" }}
        />
        <div className="h-1 rounded-b-sm bg-wood-dark/45 blur-[0.5px]" />
      </div>
    </li>
  );
}

function BookOnShelf({
  book,
  index,
  onOpen,
}: {
  book: Book;
  index: number;
  onOpen: (b: Book) => void;
}) {
  const bought = book.status === "bought";
  return (
    <div className="min-w-0 flex-1">
      <button
        onClick={() => onOpen(book)}
        aria-label={`Ver ficha de ${book.title}`}
        className="group block w-full text-left"
      >
        <div
          className="relative"
          style={{
            animation: "sz-rise var(--dur-slow) var(--ease-paper) both",
            animationDelay: `${Math.min(index, 11) * 24}ms`,
          }}
        >
          <Cover
            url={book.coverUrl}
            title={book.title}
            authors={book.authors}
            className={
              "aspect-[2/3] w-full rounded-sm shadow-cover transition duration-200 " +
              "group-hover:-translate-y-1 group-hover:shadow-cover-lift " +
              "group-active:translate-y-0 group-active:shadow-cover " +
              (bought ? "saturate-[.55] opacity-90" : "")
            }
          />

          {/* Lomo pintado: da cuerpo físico sin imágenes extra */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-[3px] rounded-l-sm bg-gradient-to-r from-ink/35 via-ink/10 to-transparent"
          />

          {bought && (
            <span
              className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-[2px] border border-gold-deep/70 bg-paper/70 px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-gold-deep mix-blend-multiply"
              style={{
                animation: "sz-stamp var(--dur-slow) var(--ease-paper) both",
                transform: "rotate(-6deg)",
              }}
            >
              Comprado
            </span>
          )}
        </div>

        <p className="mt-2 line-clamp-2 font-display text-meta font-medium leading-tight text-ink">
          {book.title}
        </p>
        {book.authors[0] && (
          <p className="line-clamp-1 text-[0.75rem] leading-tight text-ink-faint">
            {book.authors[0]}
          </p>
        )}
      </button>
    </div>
  );
}

function ShelfView({
  books,
  onOpen,
}: {
  books: Book[];
  onOpen: (b: Book) => void;
}) {
  const cols = useColumns();
  // Los comprados ya no se mezclan aquí: tienen su propia pestaña.
  const rows = chunk(books, cols);
  const allBought = books.length > 0 && books.every((b) => b.status === "bought");

  return (
    <ul className="space-y-8">
      {rows.map((row, r) => (
        <ShelfRow
          key={r}
          row={row}
          cols={cols}
          offset={r * cols}
          onOpen={onOpen}
          tone={allBought ? "dark" : "light"}
        />
      ))}
    </ul>
  );
}

// --- Vista lista -----------------------------------------------------------

function ListView({
  books,
  onOpen,
  onMenu,
}: {
  books: Book[];
  onOpen: (b: Book) => void;
  onMenu: (b: Book) => void;
}) {
  return (
    <ul className="divide-y divide-rule/50 border-y border-rule/50">
      {books.map((b) => {
        const bought = b.status === "bought";
        const subject = cleanSubjects(b.subjects)[0];
        return (
          <li key={b.id}>
            <div className="group flex items-center gap-3 px-1 py-3 transition hover:bg-paper-2/60">
              <button
                onClick={() => onOpen(b)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                aria-label={`Ver ficha de ${b.title}`}
              >
                <Cover
                  url={b.coverUrl}
                  title={b.title}
                  authors={b.authors}
                  className={
                    "h-[60px] w-10 shrink-0 rounded-sm shadow-cover " +
                    (bought ? "saturate-[.55]" : "")
                  }
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={
                      "line-clamp-1 font-display text-base font-medium leading-snug " +
                      (bought ? "text-ink-soft" : "text-ink")
                    }
                  >
                    {b.title}
                  </p>
                  <p className="line-clamp-1 text-meta text-ink-faint">
                    {[b.authors[0], b.publishedYear].filter(Boolean).join(" · ")}
                  </p>
                  {/* Fecha de ingreso al estante y quién lo recomendó */}
                  <p className="line-clamp-1 text-meta text-ink-faint">
                    <time dateTime={isoDate(b.createdAt)}>
                      Añadido el {formatDateShort(b.createdAt)}
                    </time>
                    {b.recommendedBy && <> · Por {b.recommendedBy}</>}
                  </p>
                </div>

                {bought ? (
                  <span className="hidden shrink-0 rounded-[2px] border border-gold-deep/70 px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-gold-deep min-[360px]:inline-flex">
                    Comprado
                  </span>
                ) : subject ? (
                  <span className="hidden shrink-0 rounded-full bg-paper-3 px-2.5 py-1 text-[0.75rem] text-ink-faint min-[360px]:inline-flex">
                    {subject}
                  </span>
                ) : null}
              </button>

              <button
                onClick={() => onMenu(b)}
                aria-label={`Acciones de ${b.title}`}
                aria-haspopup="menu"
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-soft transition hover:bg-ink/8"
              >
                <IconMore className="size-5" />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
