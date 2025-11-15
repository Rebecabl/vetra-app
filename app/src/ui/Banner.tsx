import * as React from "react";
import { CheckCircle2, XCircle, AlertCircle, Info, X } from "lucide-react";

export type BannerTone = "success" | "error" | "warning" | "info";
export type Banner = { 
  id: string; 
  message: string; 
  tone?: BannerTone; 
  timeoutMs?: number;
  icon?: React.ReactNode;
};

function genId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `banner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useBanner() {
  const [banners, setBanners] = React.useState<Banner[]>([]);
  const timersRef = React.useRef<Record<string, number>>({});

  const clearTimer = React.useCallback((id: string) => {
    const t = timersRef.current[id];
    if (t) {
      clearTimeout(t);
      delete timersRef.current[id];
    }
  }, []);

  const removeBanner = React.useCallback((id: string) => {
    clearTimer(id);
    setBanners((prev) => prev.filter((b) => b.id !== id));
  }, [clearTimer]);

  const pushBanner = React.useCallback(
    (b: Omit<Banner, "id"> & { id?: string }) => {
      const id = b.id || genId();
      const banner: Banner = { 
        id, 
        tone: "success", 
        timeoutMs: 5000, 
        ...b 
      };
      setBanners((prev) => [...prev, banner]);

      if (banner.timeoutMs && banner.timeoutMs > 0) {
        timersRef.current[id] = window.setTimeout(() => removeBanner(id), banner.timeoutMs);
      }
      return id;
    },
    [removeBanner]
  );

  React.useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach((t) => clearTimeout(t));
      timersRef.current = {};
    };
  }, []);

  return { banners, pushBanner, removeBanner };
}

export const BannerHost: React.FC<{
  banners: Banner[];
  onClose: (id: string) => void;
}> = ({ banners, onClose }) => {
  if (banners.length === 0) return null;

  return (
    <div className="fixed top-16 sm:top-20 md:top-24 left-0 right-0 z-[9998] px-4 sm:px-6 lg:px-8 pointer-events-none">
      <div className="max-w-7xl mx-auto flex flex-col gap-2">
        {banners.map((banner) => {
          const getIcon = () => {
            if (banner.icon) return banner.icon;
            switch (banner.tone) {
              case "success":
                return <CheckCircle2 size={20} className="flex-shrink-0" />;
              case "error":
                return <XCircle size={20} className="flex-shrink-0" />;
              case "warning":
                return <AlertCircle size={20} className="flex-shrink-0" />;
              case "info":
                return <Info size={20} className="flex-shrink-0" />;
              default:
                return <CheckCircle2 size={20} className="flex-shrink-0" />;
            }
          };

          const getToneClasses = () => {
            switch (banner.tone) {
              case "success":
                return "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200";
              case "error":
                return "bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200";
              case "warning":
                return "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200";
              case "info":
                return "bg-cyan-50 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-200";
              default:
                return "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200";
            }
          };

          const iconColor = banner.tone === "success" 
            ? "text-emerald-600 dark:text-emerald-400"
            : banner.tone === "error"
            ? "text-rose-600 dark:text-rose-400"
            : banner.tone === "warning"
            ? "text-amber-600 dark:text-amber-400"
            : "text-cyan-600 dark:text-cyan-400";

          return (
            <div
              key={banner.id}
              className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm ${getToneClasses()} transition-all duration-300`}
              role="alert"
              aria-live="polite"
            >
              <div className="flex items-start gap-3">
                <div className={iconColor}>
                  {getIcon()}
                </div>
                <span className="flex-1 text-sm font-medium leading-5">
                  {banner.message}
                </span>
                <button
                  aria-label="Fechar"
                  onClick={() => onClose(banner.id)}
                  className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity rounded p-1 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
