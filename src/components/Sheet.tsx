import { useEffect, useRef, type ReactNode } from "react";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  describedBy?: string;
  children: ReactNode;
  /** "sheet" = hoja inferior en móvil (por defecto); "center" = siempre centrado */
  placement?: "sheet" | "center";
  size?: "sm" | "md" | "lg";
};

const SIZES = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-2xl" } as const;

export function Sheet({
  open, onClose, labelledBy, describedBy, children,
  placement = "sheet", size = "md",
}: SheetProps) {
  const panel = useRef<HTMLDivElement>(null);
  const restore = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restore.current = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const first = panel.current?.querySelector<HTMLElement>(
      "[data-autofocus], button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
    );
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); return; }
      if (e.key !== "Tab" || !panel.current) return;
      const nodes = Array.from(
        panel.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex='-1'])"
        )
      ).filter((n) => n.offsetParent !== null);
      if (!nodes.length) return;
      const firstN = nodes[0], lastN = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === firstN) { e.preventDefault(); lastN.focus(); }
      else if (!e.shiftKey && document.activeElement === lastN) { e.preventDefault(); firstN.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      restore.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={
        "fixed inset-0 z-50 flex justify-center bg-ink/45 backdrop-blur-sm " +
        (placement === "sheet" ? "items-end sm:items-start sm:pt-[8vh]" : "items-center p-4")
      }
      style={{ animation: "sz-fade var(--dur-fast) both" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panel}
        data-sheet
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className={
          "w-full bg-paper-raise text-ink shadow-sheet " + SIZES[size] + " " +
          (placement === "sheet"
            ? "max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
            : "max-h-[86dvh] overflow-y-auto rounded-2xl")
        }
        style={{
          animation: "sz-sheet-in var(--dur-base) var(--ease-paper) both",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
      >
        {children}
      </div>
    </div>
  );
}
