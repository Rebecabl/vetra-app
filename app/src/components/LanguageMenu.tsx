import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { Globe } from "lucide-react";
import type { Lang } from "../i18n";
import { useLang } from "../i18n";

export const LanguageMenu: React.FC<{ 
  lang: Lang; 
  onChange: (l: Lang) => void;
  variant?: "default" | "dark-bg";
}> = ({ lang, onChange, variant = "default" }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { t } = useLang();

  // Fechar menu ao clicar fora
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) {
      document.addEventListener("mousedown", fn);
      return () => document.removeEventListener("mousedown", fn);
    }
  }, [open]);

  // Fechar menu ao pressionar Escape
  useEffect(() => {
    const fn = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    if (open) {
      document.addEventListener("keydown", fn);
      return () => document.removeEventListener("keydown", fn);
    }
  }, [open]);

  // Navegação por teclado no menu
  const handleMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!open) return;

    const menuItems = menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]');
    if (!menuItems || menuItems.length === 0) return;

    const currentIndex = Array.from(menuItems).findIndex((item) => item === document.activeElement);

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        const nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
        menuItems[nextIndex]?.focus();
        break;
      case "ArrowUp":
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
        menuItems[prevIndex]?.focus();
        break;
      case "Home":
        e.preventDefault();
        menuItems[0]?.focus();
        break;
      case "End":
        e.preventDefault();
        menuItems[menuItems.length - 1]?.focus();
        break;
    }
  };

  // Nomes dos idiomas traduzidos
  const languageNames: Record<Lang, string> = {
    "pt-BR": t("common.language_portuguese"),
    "en-US": t("common.language_english"),
    "es-ES": t("common.language_spanish"),
  };

  const languages: Lang[] = ["pt-BR", "en-US", "es-ES"];

  const handleLanguageSelect = (l: Lang) => {
    onChange(l);
    setOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        ref={buttonRef}
        onClick={() => setOpen((s) => !s)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((s) => !s);
          }
        }}
        className={`inline-flex items-center justify-center rounded-full border
                   transition-all duration-200
                   h-9 w-9
                   focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2
                   ${
                     variant === "dark-bg"
                       ? "bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm dark:focus:ring-offset-transparent"
                       : "bg-white text-slate-900 border-slate-300 hover:bg-gray-100 dark:bg-slate-800/60 dark:text-white dark:border-slate-700/60 dark:hover:bg-slate-700/60 dark:focus:ring-offset-slate-800"
                   }
                   [&>svg]:stroke-current ${
                     variant === "dark-bg"
                       ? "[&>svg]:text-white"
                       : "[&>svg]:text-slate-700 dark:[&>svg]:text-white"
                   }`}
        aria-label={t("common.change_language")}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="language-menu"
      >
        <Globe size={16} className="stroke-current" aria-hidden="true" />
      </button>
      {open && (
        <div
          ref={menuRef}
          id="language-menu"
          role="menu"
          aria-label={t("common.change_language")}
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 mt-2 w-48 rounded-lg border shadow-xl z-50
                      bg-white border-slate-200
                      dark:bg-slate-900 dark:border-slate-700
                      py-1"
        >
          {languages.map((l) => (
            <button
              key={l}
              role="menuitemradio"
              aria-checked={l === lang}
              onClick={() => handleLanguageSelect(l)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleLanguageSelect(l);
                }
              }}
              className={`w-full text-left px-4 py-2.5 text-sm
                          hover:bg-gray-50 text-slate-700
                          dark:hover:bg-slate-800 dark:text-gray-300
                          focus:outline-none focus:bg-gray-50 dark:focus:bg-slate-800
                          transition-colors
                          ${l === lang ? "font-semibold bg-gray-50 dark:bg-slate-800" : ""}`}
            >
              {languageNames[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
