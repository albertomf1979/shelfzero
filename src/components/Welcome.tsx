type Props = {
  onStart: () => void;
  onSkip: () => void;
};

/** FR12: pantalla de bienvenida. */
export function Welcome({ onStart, onSkip }: Props) {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="max-w-xl">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-spine text-paper shadow-lg shadow-spine/20">
          <span className="font-display text-4xl leading-none">S0</span>
        </div>

        <p className="mb-3 text-body font-medium uppercase tracking-[0.2em] text-ink-faint">
          Tu estante de libros por comprar
        </p>

        <h1 className="text-5xl font-semibold leading-tight text-ink sm:text-6xl">
          ShelfZero
        </h1>

        <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-ink-soft">
          Guarda los libros que quieres leer, organízalos a tu manera y decide
          dónde comprarlos. Sin prisa, sin olvidos.
        </p>

        <ul className="mx-auto mt-9 max-w-sm space-y-3 text-left text-body text-ink-soft">
          <Feature>
            Búscalos por <strong className="font-medium">título o ISBN</strong> y
            elige la edición exacta.
          </Feature>
          <Feature>
            Agrúpalos en <strong className="font-medium">listas</strong> y ordénalos
            por autor o temática.
          </Feature>
          <Feature>
            Salta a Google para{" "}
            <strong className="font-medium">comprarlos</strong> cuando llegue el
            momento.
          </Feature>
        </ul>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={onStart}
            className="w-full rounded-full bg-spine px-8 py-3.5 text-base font-medium text-paper shadow-md shadow-spine/25 transition hover:bg-spine-dark active:scale-[0.98] sm:w-auto"
          >
            Añadir mi primer libro
          </button>
          <button
            onClick={onSkip}
            className="w-full rounded-full border border-ink/15 bg-paper/60 px-8 py-3.5 text-base font-medium text-ink transition hover:bg-paper-2 active:scale-[0.98] sm:w-auto"
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
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}
