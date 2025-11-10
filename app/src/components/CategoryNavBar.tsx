import React from "react";
import { Film, Tv, Home } from "lucide-react";

interface CategoryNavBarProps {
  activeCategory: "movies" | "tv" | "home";
  onCategoryChange: (category: "movies" | "tv" | "home") => void;
}

export const CategoryNavBar: React.FC<CategoryNavBarProps> = ({
  activeCategory,
  onCategoryChange,
}) => {
  return (
    <nav className="sticky top-[64px] z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 h-16">
          <button
            onClick={() => onCategoryChange("home")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
              activeCategory === "home"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Home size={18} />
            Principal
          </button>
          
          <button
            onClick={() => onCategoryChange("movies")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
              activeCategory === "movies"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Film size={18} />
            Filmes
          </button>
          
          <button
            onClick={() => onCategoryChange("tv")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
              activeCategory === "tv"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Tv size={18} />
            Séries
          </button>
        </div>
      </div>
    </nav>
  );
};

