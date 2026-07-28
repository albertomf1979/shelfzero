import { Sheet } from "./Sheet";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;      // por defecto "Aceptar"
  cancelLabel?: string;       // por defecto "Cancelar"
  tone?: "default" | "danger"; // danger = spine
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open, title, description, confirmLabel = "Aceptar", cancelLabel = "Cancelar",
  tone = "default", busy = false, onConfirm, onCancel,
}: ConfirmDialogProps) {
  return (
    <Sheet open={open} onClose={onCancel} placement="center" size="sm"
           labelledBy="confirm-title" describedBy={description ? "confirm-desc" : undefined}>
      <div className="p-6">
        <h2 id="confirm-title" className="font-display text-lg font-semibold text-ink">
          {title}
        </h2>
        {description && (
          <p id="confirm-desc" className="mt-2 text-body text-ink-soft">{description}</p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button onClick={onCancel}
            className="inline-flex min-h-11 items-center justify-center rounded-full border
                       border-rule-strong px-4 text-body font-medium text-ink transition
                       hover:bg-paper-2 active:bg-paper-3">
            {cancelLabel}
          </button>
          <button data-autofocus onClick={onConfirm} disabled={busy}
            className={
              "inline-flex min-h-11 items-center justify-center rounded-full px-5 text-body " +
              "font-medium text-paper shadow-raise transition active:scale-[0.97] " +
              "disabled:bg-ink/25 disabled:shadow-none " +
              (tone === "danger" ? "bg-danger hover:bg-danger-strong" : "bg-ink hover:bg-ink/90")
            }>
            {confirmLabel}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
