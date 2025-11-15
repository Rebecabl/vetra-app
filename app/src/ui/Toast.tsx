import * as React from "react";
import { CheckCircle2, XCircle, AlertCircle, Info, X, Heart, Link as LinkIcon, MessageCircle } from "lucide-react";

export type ToastTone = "ok" | "err" | "warn" | "info";
export type Toast = { id: string; message: string; tone?: ToastTone; timeoutMs?: number; icon?: React.ReactNode };

function genId() {

  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

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
      const toast: Toast = { id, tone: "info", timeoutMs: 2500, ...t };
      setToasts((prev) => [...prev, toast]);

      if (toast.timeoutMs && toast.timeoutMs > 0) {
        timersRef.current[id] = window.setTimeout(() => removeToast(id), toast.timeoutMs);
      }
      return id;
    },
    [removeToast]
  );

  React.useEffect(() => {
   
    return () => {
      Object.values(timersRef.current).forEach((t) => clearTimeout(t));
      timersRef.current = {};
    };
  }, []);

  return { toasts, pushToast, removeToast };
}


export const ToastHost: React.FC<{
  toasts: Toast[];
  onClose: (id: string) => void;
}> = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null;

  const getIcon = (toast: Toast) => {
    if (toast.icon) return toast.icon;
    
    if (toast.message.toLowerCase().includes("favorito")) {
      return <Heart size={16} className="flex-shrink-0" />;
    }
    if (toast.message.toLowerCase().includes("copiado") || toast.message.toLowerCase().includes("link")) {
      return <LinkIcon size={16} className="flex-shrink-0" />;
    }
    if (toast.message.toLowerCase().includes("comentário")) {
      return <MessageCircle size={16} className="flex-shrink-0" />;
    }
    
    switch (toast.tone) {
      case "ok":
        return <CheckCircle2 size={16} className="flex-shrink-0" />;
      case "err":
        return <XCircle size={16} className="flex-shrink-0" />;
      case "warn":
        return <AlertCircle size={16} className="flex-shrink-0" />;
      case "info":
        return <Info size={16} className="flex-shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm">
      {toasts.map((t) => {
        const toneClasses =
          t.tone === "ok"
            ? "bg-emerald-500/95 dark:bg-emerald-600/95 text-white border-emerald-600/50 dark:border-emerald-500/50"
            : t.tone === "err"
            ? "bg-rose-500/95 dark:bg-rose-600/95 text-white border-rose-600/50 dark:border-rose-500/50"
            : t.tone === "warn"
            ? "bg-amber-500/95 dark:bg-amber-600/95 text-white border-amber-600/50 dark:border-amber-500/50"
            : "bg-slate-700/95 dark:bg-slate-800/95 text-white border-slate-600/50 dark:border-slate-700/50";
        
        const icon = getIcon(t);
        
        return (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-lg px-3 py-2.5 shadow-xl border backdrop-blur-sm ${toneClasses} animate-in slide-in-from-right-2 fade-in duration-300`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-2.5">
              {icon && (
                <div className="flex-shrink-0 opacity-90">
                  {icon}
                </div>
              )}
              <span className="flex-1 text-xs font-medium leading-4 line-clamp-2">
                {t.message}
              </span>
              <button
                aria-label="Fechar"
                onClick={() => onClose(t.id)}
                className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity rounded p-0.5 hover:bg-white/10"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
