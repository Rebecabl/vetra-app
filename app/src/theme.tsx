import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function useDarkMode() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("vetra:theme");
    if (saved === "dark") return true;
    if (saved === "light") return false;
    return true; // default dark
  });

  useEffect(() => {
    const root = document.documentElement;
    enabled ? root.classList.add("dark") : root.classList.remove("dark");
    localStorage.setItem("vetra:theme", enabled ? "dark" : "light");
  }, [enabled]);

  return { enabled, setEnabled, toggle: () => setEnabled((s) => !s) };
}

export const ThemeButton: React.FC<{ enabled: boolean; onToggle: () => void }> = ({
  enabled,
  onToggle,
}) => (
  <button
    onClick={onToggle}
    aria-pressed={enabled}
    aria-label={enabled ? "Ativar tema claro" : "Ativar tema escuro"}
    title={enabled ? "Ativar tema claro" : "Ativar tema escuro"}
    className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition
      ${enabled
        ? "bg-slate-800/60 border-slate-700/60 hover:bg-slate-700/60 text-white"
        : "bg-white border-slate-300 hover:bg-gray-100 text-slate-900"}`}
  >
    {/* Dica de UX: mostrar o ícone do destino (sol = claro, lua = escuro) */}
    {enabled ? <Sun size={16} /> : <Moon size={16} />}
  </button>
);
