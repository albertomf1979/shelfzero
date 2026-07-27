import { createContext, useCallback, useContext, useEffect, useRef, useState,
         type ReactNode } from "react";
import { IconClose } from "./icons";

export type ToastAction = { label: string; onClick: () => void };
export type ToastOptions = { action?: ToastAction; duration?: number };
type ToastState = { id: number; message: string } & ToastOptions;

const ToastCtx = createContext<(message: string, opts?: ToastOptions) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback((message: string, opts: ToastOptions = {}) => {
    window.clearTimeout(timer.current);
    setToast({ id: Date.now(), message, ...opts });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const ms = toast.duration ?? (toast.action ? 6000 : 4000);
    timer.current = window.setTimeout(() => setToast(null), ms);
    return () => window.clearTimeout(timer.current);
  }, [toast]);

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div aria-live="polite" aria-atomic="true"
           className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4"
           style={{ bottom: "max(1.5rem, calc(env(safe-area-inset-bottom) + 1rem))" }}>
        {toast && (
          <div key={toast.id} data-sheet
               className="on-dark pointer-events-auto flex w-full max-w-sm items-center gap-3
                          rounded-full bg-ink px-4 py-3 text-body text-paper shadow-toast"
               style={{ animation: "sz-toast-in var(--dur-base) var(--ease-paper) both" }}>
            <p className="min-w-0 flex-1 truncate">{toast.message}</p>
            {toast.action && (
              <button onClick={() => { toast.action!.onClick(); setToast(null); }}
                className="shrink-0 rounded-full px-3 py-1 text-body font-medium
                           text-paper underline decoration-paper/40 underline-offset-2
                           transition hover:bg-paper/12">
                {toast.action.label}
              </button>
            )}
            <button onClick={() => setToast(null)} aria-label="Cerrar aviso"
              className="grid size-8 shrink-0 place-items-center rounded-full
                         transition hover:bg-paper/12">
              <IconClose className="size-4" />
            </button>
          </div>
        )}
      </div>
    </ToastCtx.Provider>
  );
}
