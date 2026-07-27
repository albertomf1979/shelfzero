import { useEffect, useState } from "react";
import { Sheet } from "./Sheet";

export const LIST_COLORS = [
  "#9a3b32", "#8a6224", "#5f452c", "#4e6b52",
  "#3f5d72", "#6a4a6b", "#7a5a3a", "#4e443c",
] as const;

export type PromptDialogProps = {
  open: boolean;
  title: string;
  label: string;
  placeholder?: string;
  initialValue?: string;
  confirmLabel?: string;
  maxLength?: number;         // 40 por defecto
  withColor?: boolean;        // muestra el selector de color
  validate?: (v: string) => string | null;  // devuelve el error o null
  onSubmit: (value: string, color: string | null) => void;
  onCancel: () => void;
};

export function PromptDialog({
  open, title, label, placeholder, initialValue = "", confirmLabel = "Crear",
  maxLength = 40, withColor = false, validate, onSubmit, onCancel,
}: PromptDialogProps) {
  const [value, setValue] = useState(initialValue);
  const [color, setColor] = useState<string>(LIST_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (open) { setValue(initialValue); setError(null); } }, [open, initialValue]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    const err = !v ? "Escribe un nombre." : validate?.(v) ?? null;
    if (err) { setError(err); return; }
    onSubmit(v, withColor ? color : null);
  };

  return (
    <Sheet open={open} onClose={onCancel} placement="center" size="sm"
           labelledBy="prompt-title">
      <form onSubmit={submit} className="p-6">
        <h2 id="prompt-title" className="font-display text-lg font-semibold">{title}</h2>

        <label htmlFor="prompt-input" className="mt-4 block text-meta font-medium text-ink-soft">
          {label}
        </label>
        <input
          id="prompt-input" data-autofocus value={value} maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => { setValue(e.target.value); setError(null); }}
          aria-invalid={!!error}
          aria-describedby={error ? "prompt-error" : "prompt-count"}
          className="mt-1 min-h-11 w-full rounded-md border border-rule-strong bg-paper px-3
                     text-body placeholder:text-ink-faint focus:border-spine"
        />
        <div className="mt-1 flex justify-between">
          {error
            ? <p id="prompt-error" role="alert" className="text-meta text-spine">{error}</p>
            : <span />}
          <span id="prompt-count" className="text-micro tabular-nums text-ink-faint">
            {value.length}/{maxLength}
          </span>
        </div>

        {withColor && (
          <fieldset className="mt-4">
            <legend className="text-meta font-medium text-ink-soft">Color</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {LIST_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  aria-label={`Color ${c}`} aria-pressed={color === c}
                  className={"size-11 rounded-full transition " +
                             (color === c ? "ring-2 ring-ink ring-offset-2 ring-offset-paper-raise" : "")}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </fieldset>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel}
            className="inline-flex min-h-11 items-center justify-center rounded-full border
                       border-rule-strong px-4 text-body font-medium hover:bg-paper-2">
            Cancelar
          </button>
          <button type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-spine
                       px-5 text-body font-medium text-paper shadow-raise transition
                       hover:bg-spine-dark active:scale-[0.97]">
            {confirmLabel}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
