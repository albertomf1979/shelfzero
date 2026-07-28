import { useEffect, useState } from "react";
import { api, googleBuyUrl } from "../api";
import type { Book } from "../types";
import { Cover } from "./Cover";
import { IconBook } from "./icons";

/**
 * Vista pública de un enlace compartido (/s/:token).
 * Es la cara del producto para quien no tiene cuenta: enseña el mismo
 * estante bonito que ve el dueño, pero sin controles ni acciones.
 */
export function SharedView({ token }: { token: string }) {
  const [data, setData] = useState<{
    kind: "book" | "list";
    title: string | null;
    books: Book[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getShare(token)
      .then(setData)
      .catch(() =>
        setError("Este estante ya no está compartido.")
      );
  }, [token]);

  if (error) {
    return (
      <Frame>
        <p className="py-20 text-center text-lede text-ink-soft">{error}</p>
      </Frame>
    );
  }

  if (!data) {
    return (
      <Frame>
        <p className="py-20 text-center text-meta text-ink-faint">Cargando…</p>
      </Frame>
    );
  }

  const heading =
    data.kind === "list" ? data.title : data.books[0]?.title ?? "Libro";

  return (
    <Frame>
      <header className="mb-8">
        <p className="mb-1 text-micro uppercase text-ink-faint">
          {data.kind === "list" ? "Estante compartido" : "Libro compartido"}
        </p>
        <h1 className="font-display text-3xl font-semibold leading-tight">
          {heading}
        </h1>
        {data.kind === "list" && (
          <p className="mt-2 text-meta text-ink-faint">
            {data.books.length} {data.books.length === 1 ? "libro" : "libros"}
          </p>
        )}
        <div className="mt-5 h-px bg-rule/60" />
      </header>

      {data.books.length === 0 ? (
        <p className="py-16 text-center text-meta text-ink-faint">
          Este estante todavía no tiene libros.
        </p>
      ) : (
        <SharedShelf books={data.books} />
      )}

      <footer className="mt-16 border-t border-rule/50 pt-6 text-center">
        <p className="text-micro uppercase text-ink-faint">
          Hecho con ShelfZero
        </p>
      </footer>
    </Frame>
  );
}

/** Misma estantería que la privada, en modo lectura: cada libro va a Google. */
function SharedShelf({ books }: { books: Book[] }) {
  const [cols, setCols] = useState(3);

  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      setCols(w < 340 ? 2 : w < 640 ? 3 : w < 768 ? 4 : 5);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  const rows: Book[][] = [];
  for (let i = 0; i < books.length; i += cols) rows.push(books.slice(i, i + cols));

  return (
    <ul className="space-y-8">
      {rows.map((row, r) => (
        <li key={r} className="list-none">
          <div className="flex items-end gap-3 sm:gap-4">
            {row.map((b, i) => (
              <div key={b.id} className="min-w-0 flex-1">
                <a
                  href={googleBuyUrl(b)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                  aria-label={`Buscar «${b.title}» en Google`}
                >
                  <div
                    className="relative"
                    style={{
                      animation: "sz-rise var(--dur-slow) var(--ease-paper) both",
                      animationDelay: `${Math.min(r * cols + i, 11) * 24}ms`,
                    }}
                  >
                    <Cover
                      url={b.coverUrl}
                      title={b.title}
                      authors={b.authors}
                      className="aspect-[2/3] w-full rounded-sm shadow-cover transition duration-200 group-hover:-translate-y-1 group-hover:shadow-cover-lift"
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 left-0 w-[3px] rounded-l-sm bg-gradient-to-r from-ink/35 via-ink/10 to-transparent"
                    />
                  </div>
                  <p className="mt-2 line-clamp-2 font-display text-meta font-medium leading-tight text-ink">
                    {b.title}
                  </p>
                  {b.authors[0] && (
                    <p className="line-clamp-1 text-[0.75rem] leading-tight text-ink-faint">
                      {b.authors[0]}
                    </p>
                  )}
                </a>
              </div>
            ))}
            {Array.from({ length: cols - row.length }).map((_, i) => (
              <div key={`gap-${i}`} aria-hidden="true" className="min-w-0 flex-1" />
            ))}
          </div>

          <div aria-hidden="true" className="mt-1.5">
            <div
              className="h-2 rounded-[1px] bg-gradient-to-b from-wood to-wood-dark"
              style={{ boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.18)" }}
            />
            <div className="h-1 rounded-b-sm bg-wood-dark/45 blur-[0.5px]" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh]">
      <header className="border-b border-rule/50">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-4 py-3 sm:px-6">
          <span className="flex size-9 items-center justify-center rounded-lg bg-spine text-paper">
            <IconBook className="size-5" />
          </span>
          <span className="font-display text-xl">ShelfZero</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
