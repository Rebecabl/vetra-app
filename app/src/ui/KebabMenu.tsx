import { useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";

export const KebabMenu: React.FC<{
  items: { key: string; label: string; icon?: React.ReactNode; onClick: () => void; disabled?: boolean; tone?: "danger" }[];
}> = ({ items }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    if (open) {
      const idx = items.findIndex((it) => !it.disabled);
      const el = itemRefs.current[idx] || itemRefs.current[0];
      el?.focus();
    }
  }, [open, items]);

  const onKeyDownMenu = (e: React.KeyboardEvent) => {
    if (!open) return;
    const enabled = items.map((it, i) => (!it.disabled ? i : -1)).filter((i) => i >= 0);
    const current = itemRefs.current.findIndex((el) => el === document.activeElement);
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      btnRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const pos = enabled.indexOf(current);
      const nextIdx = enabled[(pos + 1) % enabled.length];
      itemRefs.current[nextIdx]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const pos = enabled.indexOf(current);
      const nextPos = (pos - 1 + enabled.length) % enabled.length;
      const nextIdx = enabled[nextPos];
      itemRefs.current[nextIdx]?.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const idx = current >= 0 ? current : enabled[0];
      const it = items[idx];
      if (it && !it.disabled) {
        setOpen(false);
        it.onClick();
      }
    }
  };

  return (
    <div className="relative" ref={ref} onKeyDown={onKeyDownMenu}>
      <button
        ref={btnRef}
        aria-label="Abrir menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
        className="p-2 rounded-md hover:bg-slate-800 border border-slate-700"
      >
        <MoreVertical size={18} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-700 bg-slate-900 shadow-xl z-20 py-1"
        >
          {items.map((it, i) => (
            <button
              ref={(el) => (itemRefs.current[i] = el)}
              key={it.key}
              role="menuitem"
              onClick={() => {
                if (it.disabled) return;
                setOpen(false);
                it.onClick();
              }}
              disabled={it.disabled}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left outline-none focus:bg-slate-800 ${
                it.disabled
                  ? "text-slate-500 cursor-not-allowed"
                  : it.tone === "danger"
                  ? "text-rose-300 hover:bg-rose-900/30"
                  : "text-gray-200 hover:bg-slate-800"
              }`}
            >
              {it.icon}
              <span>{it.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
