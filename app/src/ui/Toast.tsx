import * as React from "react";

export type ToastTone = "ok" | "err" | "warn" | "info";
export type Toast = { id: string; message: string; tone?: ToastTone; timeoutMs?: number };

function genId() {
  // fallback pra ambientes sem crypto.randomUUID
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  // mapa de timers por id
  const timersRef = React.useRef<Record<string, number>>({});

  const clearTimer = React.useCallback((id: string) => {
    const t = timersRef.current[id];
    if (t) {
      clearTimeout(t);
      delete timersRef.current[id];
    }
  }, []);

  const removeToast = React.useCallback((id: string) => {
    clearTimer(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, [clearTimer]);

  const pushToast = React.useCallback(
    (t: Omit<Toast, "id"> & { id?: string }) => {
      const id = t.id || genId();
      const toast: Toast = { id, tone: "info", timeoutMs: 3500, ...t };
      setToasts((prev) => [...prev, toast]);

      // auto-close
      if (toast.timeoutMs && toast.timeoutMs > 0) {
        timersRef.current[id] = window.setTimeout(() => removeToast(id), toast.timeoutMs);
      }
      return id;
    },
    [removeToast]
  );

  React.useEffect(() => {
    // cleanup global ao desmontar
    return () => {
      Object.values(timersRef.current).forEach((t) => clearTimeout(t));
      timersRef.current = {};
    };
  }, []);

  return { toasts, pushToast, removeToast };
}

// Componente visual simples dos toasts
export const ToastHost: React.FC<{
  toasts: Toast[];
  onClose: (id: string) => void;
}> = ({ toasts, onClose }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => {
        const toneClasses =
          t.tone === "ok"
            ? "bg-emerald-600 text-white"
            : t.tone === "err"
            ? "bg-rose-600 text-white"
            : t.tone === "warn"
            ? "bg-amber-500 text-black"
            : "bg-slate-800 text-white";
        return (
          <div
            key={t.id}
            className={`min-w-[220px] max-w-[360px] rounded-md px-4 py-3 shadow-lg border border-white/10 ${toneClasses}`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <span className="flex-1 text-sm leading-5">{t.message}</span>
              <button
                aria-label="Fechar"
                onClick={() => onClose(t.id)}
                className="opacity-80 hover:opacity-100"
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
