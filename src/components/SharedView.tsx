import { useEffect, useState } from "react";
import { api, googleBuyUrl } from "../api";
import type { Book } from "../types";
import { Cover } from "./Cover";

/**
 * Vista pública de solo lectura de un enlace compartido (/s/:token).
 * No requiere cuenta y no permite modificar nada.
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
      .catch((e) =>
        setError(e?.message ?? "Este enlace no es válido o ha caducado.")
      );
  }, [token]);

  if (error) {
    return (
      <Frame>
        <p className="py-20 text-center text-ink-soft">{error}</p>
      </Frame>
    );
  }

  if (!data) {
    return (
      <Frame>
        <p className="py-20 text-center text-sm text-ink-faint">Cargando…</p>
      </Frame>
    );
  }

  const heading =
    data.kind === "list" ? data.title : data.books[0]?.title ?? "Libro";

  return (
    <Frame>
      <div className="mb-8">
        <p className="mb-1 text-xs uppercase tracking-[0.15em] text-ink-faint">
          {data.kind === "list" ? "Lista compartida" : "Libro compartido"}
        </p>
        <h1 className="font-display text-3xl leading-tight">{heading}</h1>
        {data.kind === "list" && (
          <p className="mt-2 text-sm text-ink-soft">
            {data.books.length}{" "}
            {data.books.length === 1 ? "libro" : "libros"}
          </p>
        )}
      </div>

      {data.books.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink-faint">
          Esta lista todavía no tiene libros.
        </p>
      ) : (
        <ul className="space-y-3">
          {data.books.map((b) => (
            <li
              key={b.id}
              className="flex gap-4 rounded-xl border border-ink/10 bg-paper/60 p-4"
            >
              <Cover
                url={b.coverUrl}
                title={b.title}
                authors={b.authors}
                className="h-28 w-19 shrink-0 shadow-md"
              />
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg leading-snug">{b.title}</h2>
                <p className="mt-0.5 text-sm text-ink-soft">
                  {b.authors.join(", ") || "Autor desconocido"}
                </p>
                <p className="mt-1 text-xs text-ink-faint">
                  {[b.subjects[0], b.publishedYear, b.isbn13]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {b.description && (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">
                    {b.description}
                  </p>
                )}
                <a
                  href={googleBuyUrl(b)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block rounded-full border border-ink/15 px-4 py-1.5 text-xs font-medium text-ink transition hover:bg-ink/5"
                >
                  Buscar dónde comprarlo ↗
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh]">
      <header className="border-b border-ink/10 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-4 py-3 sm:px-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-spine font-display text-lg text-paper">
            S0
          </span>
          <span className="font-display text-xl">ShelfZero</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
