import { DEMO_LIMIT } from "../api";

const REPO = "https://github.com/albertomf1979/shelfzero";

/**
 * Aviso permanente en la versión de demostración: deja claro que lo que se ve
 * es una prueba, dónde se guardan los datos y cuál es el límite.
 */
export function DemoBanner({ used }: { used: number }) {
  const left = Math.max(0, DEMO_LIMIT - used);

  return (
    <div className="border-b border-gold-deep/25 bg-gold-deep/10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 sm:px-6">
        <span className="rounded-full bg-gold-deep px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-paper">
          Demostración
        </span>
        <p className="text-meta text-ink-soft">
          Puedes guardar hasta{" "}
          <strong className="font-medium text-ink">{DEMO_LIMIT} libros</strong>
          {used > 0 && (
            <>
              {" "}
              · te {left === 1 ? "queda" : "quedan"}{" "}
              <strong className="font-medium text-ink">{left}</strong>
            </>
          )}
          . Se guardan solo en este navegador.
        </p>
        <a
          href={REPO}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto shrink-0 text-meta font-medium text-gold-deep underline decoration-gold-deep/40 underline-offset-2 hover:decoration-gold-deep"
        >
          Crear mi propio estante ↗
        </a>
      </div>
    </div>
  );
}

/** Mensaje al intentar pasar del límite. */
export function DemoLimitNotice({ onClose }: { onClose: () => void }) {
  return (
    <div className="rounded-xl border border-gold-deep/35 bg-gold-deep/10 p-5 text-center">
      <p className="font-display text-lg font-semibold text-ink">
        Has llegado al límite de la demostración
      </p>
      <p className="mx-auto mt-2 max-w-sm text-body text-ink-soft">
        Esta versión permite guardar {DEMO_LIMIT} libros. ShelfZero es software
        libre: despliega tu propia copia y tendrás un estante sin límites, con
        tus libros en tu cuenta.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <a
          href={REPO}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-spine px-6 text-body font-medium text-paper shadow-raise transition hover:bg-spine-dark"
        >
          Ver en GitHub ↗
        </a>
        <button
          onClick={onClose}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-rule-strong px-5 text-body font-medium text-ink transition hover:bg-paper-2"
        >
          Seguir mirando
        </button>
      </div>
    </div>
  );
}
