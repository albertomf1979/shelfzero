import type { Book } from "../types";
import { formatDateShort, isoDate } from "../lib/dates";
import { Cover } from "./Cover";
import { IconBarcode, IconPlus } from "./icons";

type Props = {
  books: Book[];
  onOpenShelf: () => void;
  onOpenBook: (book: Book) => void;
  onScan: () => void;
  onAdd: () => void;
};

/**
 * Portada de la app: un escaparate antes del estante.
 * Muestra las últimas incorporaciones y cuánto hay guardado, en vez de
 * soltar al usuario directamente en la rejilla completa.
 */
export function Home({ books, onOpenShelf, onOpenBook, onScan, onAdd }: Props) {
  const total = books.length;
  const pending = books.filter((b) => b.status !== "bought").length;
  const bought = total - pending;

  // Las tres últimas incorporaciones, sin importar el orden elegido en el estante.
  const latest = [...books].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);

  if (total === 0) return <EmptyHome onScan={onScan} onAdd={onAdd} />;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-4 pt-8 sm:px-6 sm:pt-12">
      <div className="overflow-hidden rounded-2xl border border-rule/50 bg-paper-raise shadow-raise">
        <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-end md:gap-12">
          {/* Recuento y llamada a la acción */}
          <div className="min-w-0">
            <p className="text-micro uppercase text-ink-faint">
              Tu estante, hoy
            </p>

            <h1 className="mt-2 font-display text-4xl leading-[1.05] sm:text-5xl">
              <span className="tabular-nums">{pending}</span>{" "}
              {pending === 1 ? "libro" : "libros"}
              <span className="block text-ink-soft">deseados</span>
            </h1>

            <p className="mt-4 max-w-md text-lede text-ink-soft">
              {bought > 0 ? (
                <>
                  Llevas <strong className="font-medium">{bought}</strong>{" "}
                  {bought === 1 ? "comprado" : "comprados"} de{" "}
                  <strong className="font-medium">{total}</strong>. Sin prisa,
                  sin olvidos.
                </>
              ) : (
                <>
                  <strong className="font-medium">{total}</strong>{" "}
                  {total === 1 ? "libro guardado" : "libros guardados"} para
                  cuando llegue el momento. Sin prisa, sin olvidos.
                </>
              )}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={onOpenShelf}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-spine px-7 text-body font-medium text-paper shadow-raise transition hover:bg-spine-dark active:scale-[0.98]"
              >
                Ver el estante
              </button>
              <button
                onClick={onScan}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-rule-strong px-6 text-body font-medium text-ink transition hover:bg-paper-2"
              >
                <IconBarcode className="size-5" />
                Escanear un libro
              </button>
            </div>
          </div>

          {/* Últimas incorporaciones, apoyadas en su balda */}
          <div className="md:w-[19rem] lg:w-[22rem]">
            <p className="mb-3 text-micro uppercase text-ink-faint">
              {latest.length === 1
                ? "Última incorporación"
                : `Últimas ${latest.length} incorporaciones`}
            </p>

            <ul className="flex items-end gap-3 sm:gap-4">
              {latest.map((b, i) => (
                <li key={b.id} className="min-w-0 flex-1 list-none">
                  <button
                    onClick={() => onOpenBook(b)}
                    aria-label={`Ver ficha de ${b.title}`}
                    className="group block w-full text-left"
                  >
                    <div
                      className="relative"
                      style={{
                        animation:
                          "sz-rise var(--dur-slow) var(--ease-paper) both",
                        animationDelay: `${i * 70}ms`,
                      }}
                    >
                      <Cover
                        url={b.coverUrl}
                        title={b.title}
                        authors={b.authors}
                        loading="eager"
                        className="aspect-[2/3] w-full rounded-sm shadow-cover transition duration-200 group-hover:-translate-y-1.5 group-hover:shadow-cover-lift"
                      />
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 left-0 w-[3px] rounded-l-sm bg-gradient-to-r from-ink/35 via-ink/10 to-transparent"
                      />
                    </div>
                  </button>
                </li>
              ))}
              {/* Rellenos para que la balda llegue de lado a lado */}
              {Array.from({ length: 3 - latest.length }).map((_, i) => (
                <li
                  key={`gap-${i}`}
                  aria-hidden="true"
                  className="min-w-0 flex-1 list-none"
                />
              ))}
            </ul>

            <div aria-hidden="true" className="mt-1.5">
              <div
                className="h-2 rounded-[1px] bg-gradient-to-b from-wood to-wood-dark"
                style={{ boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.18)" }}
              />
              <div className="h-1 rounded-b-sm bg-wood-dark/45 blur-[0.5px]" />
            </div>

            {/* El más reciente, con su fecha */}
            {latest[0] && (
              <p className="mt-3 line-clamp-2 text-meta text-ink-faint">
                <span className="text-ink-soft">{latest[0].title}</span>
                {" · "}
                <time dateTime={isoDate(latest[0].createdAt)}>
                  {formatDateShort(latest[0].createdAt)}
                </time>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Portada cuando todavía no hay nada guardado. */
function EmptyHome({
  onScan,
  onAdd,
}: {
  onScan: () => void;
  onAdd: () => void;
}) {
  return (
    <section className="mx-auto max-w-2xl px-4 pb-4 pt-12 text-center sm:px-6">
      <div aria-hidden="true" className="mx-auto mb-7 max-w-[16rem]">
        <div className="h-24 rounded-t-sm bg-paper-2/70" />
        <div
          className="h-2 bg-gradient-to-b from-wood to-wood-dark"
          style={{ boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.18)" }}
        />
        <div className="h-1 bg-wood-dark/45" />
      </div>

      <p className="text-micro uppercase text-ink-faint">Tu estante, hoy</p>
      <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">
        Todavía está vacío
      </h1>
      <p className="mx-auto mt-4 max-w-sm text-lede text-ink-soft">
        Sin prisa, sin olvidos. Escanea el primer libro que te apetezca y empieza
        a llenarlo.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          onClick={onScan}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-spine px-7 text-body font-medium text-paper shadow-raise transition hover:bg-spine-dark active:scale-[0.98]"
        >
          <IconBarcode className="size-5" />
          Escanear un libro
        </button>
        <button
          onClick={onAdd}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-rule-strong px-6 text-body font-medium text-ink transition hover:bg-paper-2"
        >
          <IconPlus className="size-4" />
          Añadir de otra forma
        </button>
      </div>
    </section>
  );
}
