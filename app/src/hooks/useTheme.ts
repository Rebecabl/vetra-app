import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export default function useTheme() {
  const system = (): Theme =>
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("vetra:theme") as Theme | null;
    return saved ?? system();
  });

 
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("vetra:theme", theme);
  }, [theme]);

 
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const saved = localStorage.getItem("vetra:theme");
      if (!saved) setTheme(mq.matches ? "dark" : "light");
    };
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  return { theme, setTheme };
}
