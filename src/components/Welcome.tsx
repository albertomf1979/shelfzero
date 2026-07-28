import { IconBook } from "./icons";
import { Sheet } from "./Sheet";

type Props =
  | { mode?: "onboarding"; onStart: () => void; onSkip: () => void; onClose?: never }
  | { mode: "about"; onClose: () => void; onStart?: never; onSkip?: never };

/**
 * FR12: pantalla de bienvenida. En modo "about" se puede volver a ver
 * desde los ajustes, en lugar de perderse tras el primer uso.
 */
export function Welcome(props: Props) {
  const body = (
    <>
      <div className="mx-auto mb-8 flex size-20 items-center justify-center rounded-2xl bg-spine text-paper shadow-raise">
        <IconBook className="size-11" />
      </div>

      <p className="mb-3 text-micro uppercase text-ink-faint">
        Tu estante de libros por comprar
      </p>

      <h1 className="font-display text-5xl font-semibold leading-tight text-ink">
        ShelfZero
      </h1>

      <p className="mx-auto mt-4 max-w-sm text-lede text-ink-soft">
        Sin prisa, sin olvidos.
      </p>

      <ul className="mx-auto mt-8 max-w-sm space-y-3 text-left text-body text-ink-soft">
        <Feature>
          Escanea el código de barras y guárdalo en segundos.
        </Feature>
        <Feature>
          Agrúpalos en listas y ordénalos por autor o temática.
        </Feature>
        <Feature>
          Salta a Google para comprarlos cuando llegue el momento.
        </Feature>
      </ul>
    </>
  );

  if (props.mode === "about") {
    return (
      <Sheet
        open
        onClose={props.onClose}
        labelledBy="about-title"
        placement="center"
        size="md"
      >
        <div className="p-8 text-center">
          <h2 id="about-title" className="sr-only">
            Sobre ShelfZero
          </h2>
          {body}
          <button
            data-autofocus
            onClick={props.onClose}
            className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full border border-rule-strong px-6 text-body font-medium text-ink transition hover:bg-paper-2"
          >
            Cerrar
          </button>
        </div>
      </Sheet>
    );
  }

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="max-w-xl">
        {body}

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={props.onStart}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-spine px-8 text-body font-medium text-paper shadow-raise transition hover:bg-spine-dark active:scale-[0.98] sm:w-auto"
          >
            Escanear mi primer libro
          </button>
          <button
            onClick={props.onSkip}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-rule-strong px-8 text-body font-medium text-ink transition hover:bg-paper-2 active:scale-[0.98] sm:w-auto"
          >
            Ver mi estante
          </button>
        </div>
      </div>
    </main>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="mt-2 size-1.5 shrink-0 rounded-full bg-gold"
      />
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}
