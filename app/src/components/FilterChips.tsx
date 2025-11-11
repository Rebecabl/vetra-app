import React from "react";
import { X } from "lucide-react";
import { SearchFilters, getDefaultFilters } from "./SearchFiltersPanel";
import { useLang } from "../i18n";

interface FilterChipsProps {
  filters: SearchFilters;
  onRemoveFilter: (key: keyof SearchFilters) => void;
  onClearAll: () => void;
  t: (key: string, params?: any) => string;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  filters,
  onRemoveFilter,
  onClearAll,
  t,
}) => {
  const { lang } = useLang();
  const locale = lang === "pt-BR" ? "pt-BR" : lang === "en-US" ? "en-US" : "es-ES";
  const hasActiveFilters = () => {
    const defaults = getDefaultFilters();
    return (
      filters.type !== defaults.type ||
      filters.sort !== defaults.sort ||
      filters.yearGte !== defaults.yearGte ||
      filters.yearLte !== defaults.yearLte ||
      filters.voteAvgGte !== defaults.voteAvgGte ||
      filters.voteCntGte !== defaults.voteCntGte ||
      filters.withPoster !== defaults.withPoster
    );
  };

  if (!hasActiveFilters()) {
    return null;
  }

  const defaults = getDefaultFilters();
  const chips: Array<{ key: keyof SearchFilters; label: string }> = [];

  // Type chip
  if (filters.type !== defaults.type) {
    const typeLabels: Record<string, string> = {
      movie: t("nav.movies"),
      tv: t("nav.tv_series"),
      person: t("nav.people"),
    };
    chips.push({
      key: "type",
      label: `${t("filters.type")}: ${typeLabels[filters.type] || filters.type}`,
    });
  }

  // Sort chip (only if not default)
  const uiSort = filters.sort === "popularity.desc" ? "rating" : filters.sort;
  if (uiSort !== "rating") {
    const sortLabels: Record<string, string> = {
      relevance: t("filters.relevance"),
      year: t("filters.year"),
    };
    chips.push({
      key: "sort",
      label: `${t("filters.sort_by")}: ${sortLabels[uiSort] || uiSort}`,
    });
  }

  // Year range chip - only show if different from defaults
  const currentYear = new Date().getFullYear();
  const defaultYearTo = defaults.yearLte !== null ? defaults.yearLte : currentYear;
  const yearFrom = filters.yearGte !== null ? filters.yearGte : defaults.yearGte;
  const yearTo = filters.yearLte !== null ? filters.yearLte : defaultYearTo;
  
  if (filters.yearGte !== defaults.yearGte || filters.yearLte !== defaultYearTo) {
    chips.push({
      key: "yearGte",
      label: `${t("filters.year")}: ${yearFrom}–${yearTo}`,
    });
  }

  // Rating chip
  if (filters.voteAvgGte > defaults.voteAvgGte) {
    chips.push({
      key: "voteAvgGte",
      label: `≥ ${filters.voteAvgGte.toFixed(1)}`,
    });
  }

  // Votes chip
  if (filters.voteCntGte > defaults.voteCntGte) {
    chips.push({
      key: "voteCntGte",
      label: t("format.votes", { count: filters.voteCntGte.toLocaleString(locale) }),
    });
  }

  // Poster chip
  if (!filters.withPoster) {
    chips.push({
      key: "withPoster",
      label: t("filters.only_with_poster"),
    });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {chips.map((chip) => (
        <div
          key={chip.key}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200 rounded-full text-xs sm:text-sm font-medium"
        >
          <span>{chip.label}</span>
          <button
            onClick={() => onRemoveFilter(chip.key)}
            className="hover:bg-cyan-200 dark:hover:bg-cyan-900/50 rounded-full p-0.5 transition-colors min-w-[20px] min-h-[20px] flex items-center justify-center"
            aria-label={t("common.remove") + " " + chip.label}
          >
            <X size={14} />
          </button>
        </div>
      ))}
      {chips.length > 0 && (
        <button
          onClick={onClearAll}
          className="px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline transition-colors"
        >
          {t("filters.clear_all")}
        </button>
      )}
    </div>
  );
};

