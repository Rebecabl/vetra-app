import { useEffect, useRef, useState } from "react";
import { Globe } from "lucide-react";
import type { Lang } from "../i18n";

export const LanguageMenu: React.FC<{ lang: Lang; onChange: (l: Lang) => void }> = ({ lang, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  const label = lang === "pt-BR" ? "PT-BR" : lang === "en-US" ? "EN" : "ES";
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((s) => !s)}
        className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm
                   bg-white text-slate-900 border-slate-300 hover:bg-gray-100
                   dark:bg-slate-800/60 dark:text-white dark:border-slate-700/60 dark:hover:bg-slate-700/60"
        title="Idioma"
      >
        <Globe size={16} />
        {label}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-lg border shadow-xl z-20
                        bg-white border-slate-200
                        dark:bg-slate-900 dark:border-slate-700">
          {(["pt-BR", "en-US", "es-ES"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => {
                onChange(l);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm
                          hover:bg-gray-50 text-slate-700
                          dark:hover:bg-slate-800 dark:text-gray-300
                          ${l === lang ? "font-semibold" : ""}`}
            >
              {l === "pt-BR" ? "Português (BR)" : l === "en-US" ? "English" : "Español"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
