import { useState } from "react";
import { applyTheme, getTheme, type Theme } from "../lib/theme";
import { Sheet } from "./Sheet";

type Props = {
  open: boolean;
  onClose: () => void;
  onAbout: () => void;
};

const THEMES: { value: Theme; label: string }[] = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
  { value: "system", label: "Sistema" },
];

/** Ajustes del estante: tema y acceso a la presentación. */
export function ShelfMenu({ open, onClose, onAbout }: Props) {
  const [theme, setTheme] = useState<Theme>(() => getTheme());

  function choose(t: Theme) {
    setTheme(t);
    applyTheme(t);
  }

  return (
    <Sheet open={open} onClose={onClose} labelledBy="shelfmenu-title" size="sm">
      <div className="p-5">
        <h2
          id="shelfmenu-title"
          className="mb-4 font-display text-lg font-semibold"
        >
          Ajustes
        </h2>

        <p className="mb-2 text-micro uppercase text-ink-faint">Apariencia</p>
        <div
          className="mb-5 flex gap-1 rounded-full bg-ink/8 p-1"
          role="radiogroup"
          aria-label="Tema"
        >
          {THEMES.map((t) => (
            <button
              key={t.value}
              role="radio"
              aria-checked={theme === t.value}
              onClick={() => choose(t.value)}
              data-autofocus={t.value === theme ? "" : undefined}
              className={
                "min-h-9 flex-1 rounded-full px-3 text-body transition " +
                (theme === t.value
                  ? "bg-paper-raise text-ink shadow-raise"
                  : "text-ink-soft hover:text-ink")
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            onAbout();
            onClose();
          }}
          className="flex min-h-12 w-full items-center rounded-lg px-3 text-left text-body text-ink transition hover:bg-paper-2"
        >
          Sobre ShelfZero
        </button>
      </div>
    </Sheet>
  );
}
