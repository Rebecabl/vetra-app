import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Filter, ChevronDown } from "lucide-react";

export interface SearchFilters {
  type: "all" | "movie" | "tv" | "person";
  sort: "relevance" | "rating" | "year" | "popularity.desc";
  yearGte: number | null;
  yearLte: number | null;
  voteAvgGte: number;
  voteCntGte: number;
  withPoster: boolean;
}

export const getDefaultFilters = (): SearchFilters => ({
  type: "all",
  sort: "popularity.desc",
  yearGte: 1870,
  yearLte: new Date().getFullYear(),
  voteAvgGte: 0,
  voteCntGte: 100, // Default: 100 para reduzir ruído
  withPoster: true,
});

export const DEFAULT_FILTERS = getDefaultFilters();

interface SearchFiltersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  appliedFilters: SearchFilters;
  onApply: (filters: SearchFilters) => void;
  onClearAll: () => void;
  searchTerm: string;
  t: (key: string, params?: any) => string;
  normalizeNumber: (value: string) => string;
  snapRating: (value: number) => number;
  snapVotes: (value: number) => number;
  linearToLog: (value: number, min: number, max: number) => number;
  logToLinear: (value: number, min: number, max: number) => number;
}

export const SearchFiltersPanel: React.FC<SearchFiltersPanelProps> = ({
  isOpen,
  onClose,
  appliedFilters,
  onApply,
  onClearAll,
  searchTerm,
  t,
  normalizeNumber,
  snapRating,
  snapVotes,
  linearToLog,
  logToLinear,
}) => {
  const [draftFilters, setDraftFilters] = useState<SearchFilters>(appliedFilters);
  const [yearFromError, setYearFromError] = useState<string>("");
  const [yearToError, setYearToError] = useState<string>("");
  const [minRatingError, setMinRatingError] = useState<string>("");
  const [relevanceWarning, setRelevanceWarning] = useState<string>("");
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1280);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setDraftFilters(appliedFilters);
      setYearFromError("");
      setYearToError("");
      setMinRatingError("");
      setRelevanceWarning("");
      // Focus title on open for accessibility
      setTimeout(() => {
        if (titleRef.current) {
          titleRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen, appliedFilters]);

  useEffect(() => {
    if (isOpen && windowWidth < 1024) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen, windowWidth]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleCancel();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  const isMobile = windowWidth < 1024; // Changed from 768 to 1024
  const isDesktop = windowWidth >= 1024; // Changed from 1280 to 1024

  const currentYear = new Date().getFullYear();
  const minYear = 1870;
  const maxYear = currentYear + 1;

  const validateFilters = (): boolean => {
    setYearFromError("");
    setYearToError("");
    setMinRatingError("");

    if (draftFilters.yearGte !== null) {
      const yearFrom = draftFilters.yearGte;
      if (isNaN(yearFrom) || yearFrom < minYear || yearFrom > maxYear) {
        setYearFromError(`Informe um ano válido (${minYear} a ${maxYear}).`);
        return false;
      }
    }

    if (draftFilters.yearLte !== null) {
      const yearTo = draftFilters.yearLte;
      if (isNaN(yearTo) || yearTo < minYear || yearTo > maxYear) {
        setYearToError(`Informe um ano válido (${minYear} a ${maxYear}).`);
        return false;
      }
    }

    if (draftFilters.yearGte !== null && draftFilters.yearLte !== null) {
      if (draftFilters.yearGte > draftFilters.yearLte) {
        setYearFromError("Intervalo de anos inválido. Ajuste os campos.");
        setYearToError("Intervalo de anos inválido. Ajuste os campos.");
        return false;
      }
    }

    if (draftFilters.voteAvgGte < 0 || draftFilters.voteAvgGte > 10) {
      setMinRatingError("Use um valor entre 0 e 10.");
      return false;
    }

    // Check relevance warning
    if (draftFilters.sort === "relevance" && !searchTerm.trim()) {
      setRelevanceWarning("Relevância requer um termo de busca.");
      // Auto-correct to rating
      setDraftFilters((prev) => ({ ...prev, sort: "rating" }));
    } else {
      setRelevanceWarning("");
    }

    return true;
  };

  const handleApply = useCallback(() => {
    if (!validateFilters()) {
      return;
    }

    // Auto-fix year range if inverted
    let finalFilters = { ...draftFilters };
    if (finalFilters.yearGte !== null && finalFilters.yearLte !== null) {
      if (finalFilters.yearGte > finalFilters.yearLte) {
        // Swap values
        const temp = finalFilters.yearGte;
        finalFilters.yearGte = finalFilters.yearLte;
        finalFilters.yearLte = temp;
      }
    }

    onApply(finalFilters);
    onClose();
    // Scroll to top after applying
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [draftFilters, onApply, onClose, validateFilters]);

  const handleClearAll = () => {
    const defaults = getDefaultFilters();
    // Adjust sort based on search term
    if (!searchTerm.trim() && defaults.sort === "relevance") {
      defaults.sort = "popularity.desc";
    }
    setDraftFilters(defaults);
    setYearFromError("");
    setYearToError("");
    setMinRatingError("");
    setRelevanceWarning("");
    // Apply immediately but don't close modal - user can see the reset and continue editing
    onClearAll();
    // Note: onClearAll in App.tsx will update URL and reload results
    // Modal stays open so user can adjust if needed
  };

  const handleCancel = () => {
    setDraftFilters(appliedFilters);
    setYearFromError("");
    setYearToError("");
    setMinRatingError("");
    setRelevanceWarning("");
    onClose();
  };

  const updateDraftFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setDraftFilters((prev) => ({ ...prev, [key]: value }));
    // Clear errors when user makes changes
    if (key === "yearGte") setYearFromError("");
    if (key === "yearLte") setYearToError("");
    if (key === "voteAvgGte") setMinRatingError("");
  };

  const isPerson = draftFilters.type === "person";

  // Map UI sort to internal sort
  const uiSort = draftFilters.sort === "popularity.desc" ? "rating" : draftFilters.sort;

  const filtersContent = (
    <div className="h-full flex flex-col" ref={panelRef}>
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-300 dark:border-slate-600 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
        <h3 
          id="filters-title"
          ref={titleRef}
          tabIndex={-1}
          className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 outline-none focus:ring-2 focus:ring-cyan-500 rounded"
        >
          <Filter size={20} aria-hidden="true" />
          {t("filters.filters")}
        </h3>
        <button
          onClick={handleCancel}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={t("common.close")}
        >
          <X size={20} className="text-slate-600 dark:text-slate-400" aria-hidden="true" />
        </button>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {relevanceWarning && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-xs sm:text-sm text-yellow-800 dark:text-yellow-200">
            {relevanceWarning}
          </div>
        )}

        {/* Type */}
        <div>
          <label htmlFor="filter-type" className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
            {t("filters.type")}
          </label>
          <select
            id="filter-type"
            value={draftFilters.type}
            onChange={(e) => updateDraftFilter("type", e.target.value as SearchFilters["type"])}
            className="w-full px-3 py-2.5 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-cyan-500"
            aria-label={t("filters.type")}
          >
            <option value="all">{t("filters.type_all")}</option>
            <option value="movie">{t("filters.type_movie")}</option>
            <option value="tv">{t("filters.type_tv")}</option>
            <option value="person">{t("filters.type_person")}</option>
          </select>
        </div>

        {/* Sort */}
        <div>
          <label htmlFor="filter-sort" className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
            {t("filters.sort_by")}
          </label>
          <select
            id="filter-sort"
            value={uiSort}
            onChange={(e) => {
              const value = e.target.value as "relevance" | "rating" | "year";
              // Map UI sort to internal
              const mappedSort = value === "rating" ? "popularity.desc" : value;
              updateDraftFilter("sort", mappedSort);
            }}
            className="w-full px-3 py-2.5 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-cyan-500"
            aria-label={t("filters.sort_by")}
          >
            <option value="relevance">{t("filters.relevance")}</option>
            <option value="rating">{t("filters.rating")}</option>
            <option value="year">{t("filters.year")}</option>
          </select>
        </div>

        {/* Year Range */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
            {t("filters.year_from")} / {t("filters.year_to")}
          </label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                id="filter-year-from"
                type="number"
                value={draftFilters.yearGte !== null ? draftFilters.yearGte : ""}
                onChange={(e) => {
                  const value = e.target.value === "" ? null : parseInt(e.target.value);
                  updateDraftFilter("yearGte", value);
                }}
                onBlur={validateFilters}
                placeholder={String(minYear)}
                min={minYear}
                max={maxYear}
                disabled={isPerson}
                aria-label={t("filters.year_from")}
                aria-invalid={!!yearFromError}
                aria-describedby={yearFromError ? "year-from-error" : undefined}
                className={`flex-1 px-3 py-2.5 sm:py-2 rounded-lg border bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm text-center min-h-[44px] focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                  yearFromError
                    ? "border-red-500 dark:border-red-500"
                    : isPerson
                    ? "border-slate-200 dark:border-slate-600 opacity-50 cursor-not-allowed"
                    : "border-slate-300 dark:border-slate-600"
                }`}
                title={isPerson ? t("filters.not_applicable_person") : ""}
              />
              <span className="text-slate-500 dark:text-slate-400 text-sm" aria-hidden="true">até</span>
              <input
                id="filter-year-to"
                type="number"
                value={draftFilters.yearLte !== null ? draftFilters.yearLte : ""}
                onChange={(e) => {
                  const value = e.target.value === "" ? null : parseInt(e.target.value);
                  updateDraftFilter("yearLte", value);
                }}
                onBlur={validateFilters}
                placeholder={String(maxYear)}
                min={minYear}
                max={maxYear}
                disabled={isPerson}
                aria-label={t("filters.year_to")}
                aria-invalid={!!yearToError}
                aria-describedby={yearToError ? "year-to-error" : undefined}
                className={`flex-1 px-3 py-2.5 sm:py-2 rounded-lg border bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm text-center min-h-[44px] focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                  yearToError
                    ? "border-red-500 dark:border-red-500"
                    : isPerson
                    ? "border-slate-200 dark:border-slate-600 opacity-50 cursor-not-allowed"
                    : "border-slate-300 dark:border-slate-600"
                }`}
                title={isPerson ? t("filters.not_applicable_person") : ""}
              />
            </div>
            {(yearFromError || yearToError) && (
              <p id={yearFromError ? "year-from-error" : "year-to-error"} className="text-xs text-red-600 dark:text-red-400" role="alert">
                {yearFromError || yearToError}
              </p>
            )}
            {/* Year Presets */}
            <div className="flex flex-wrap gap-2" role="group" aria-label={t("filters.year_presets")}>
              {[
                { label: t("filters.last_2_years"), from: currentYear - 1, to: currentYear },
                { label: t("filters.last_5_years"), from: currentYear - 4, to: currentYear },
                { label: "2010+", from: 2010, to: currentYear },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    updateDraftFilter("yearGte", preset.from);
                    updateDraftFilter("yearLte", preset.to);
                  }}
                  disabled={isPerson}
                  aria-label={preset.label}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap min-h-[44px] flex items-center justify-center ${
                    draftFilters.yearGte === preset.from && draftFilters.yearLte === preset.to
                      ? "bg-cyan-500 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Min Rating */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
            Mín. de Avaliação
          </label>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <input
                id="filter-min-rating-slider"
                type="range"
                min="0"
                max="100"
                step="5"
                value={draftFilters.voteAvgGte * 10}
                onChange={(e) => {
                  const value = snapRating(parseFloat(e.target.value) / 10);
                  updateDraftFilter("voteAvgGte", value);
                }}
                disabled={isPerson}
                aria-label={t("filters.min_rating")}
                className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
              />
              <input
                id="filter-min-rating"
                type="text"
                value={draftFilters.voteAvgGte.toFixed(1)}
                onChange={(e) => {
                  const normalized = normalizeNumber(e.target.value);
                  const num = parseFloat(normalized);
                  if (!isNaN(num)) {
                    updateDraftFilter("voteAvgGte", Math.max(0, Math.min(10, num)));
                  }
                }}
                onBlur={(e) => {
                  const normalized = normalizeNumber(e.target.value);
                  const num = parseFloat(normalized);
                  if (!isNaN(num) && num >= 0 && num <= 10) {
                    updateDraftFilter("voteAvgGte", snapRating(num));
                    validateFilters();
                  }
                }}
                placeholder="0"
                disabled={isPerson}
                aria-label={t("filters.min_rating")}
                aria-invalid={!!minRatingError}
                aria-describedby={minRatingError ? "min-rating-error" : undefined}
                className={`w-20 px-2 py-2 rounded-lg border bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm text-center min-h-[44px] focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                  minRatingError
                    ? "border-red-500 dark:border-red-500"
                    : isPerson
                    ? "border-slate-200 dark:border-slate-600 opacity-50 cursor-not-allowed"
                    : "border-slate-300 dark:border-slate-600"
                }`}
                title={isPerson ? t("filters.not_applicable_person") : t("filters.rating_range")}
              />
            </div>
            {minRatingError && (
              <p id="min-rating-error" className="text-xs text-red-600 dark:text-red-400" role="alert">
                {minRatingError}
              </p>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">{t("filters.rating_range")}</p>
            {/* Rating Presets */}
            <div className="flex flex-wrap gap-2">
              {[6, 7, 8, 9].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => updateDraftFilter("voteAvgGte", preset)}
                  disabled={isPerson}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap min-h-[44px] flex items-center justify-center ${
                    Math.abs(draftFilters.voteAvgGte - preset) < 0.1
                      ? "bg-cyan-500 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {preset}+
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Min Votes */}
        <div>
          <label htmlFor="filter-min-votes" className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
            {t("filters.min_votes")}
          </label>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <input
                id="filter-min-votes-slider"
                type="range"
                min="0"
                max="100"
                step="1"
                value={linearToLog(Math.max(1, draftFilters.voteCntGte || 1), 1, 10000)}
                onChange={(e) => {
                  const value = snapVotes(logToLinear(parseFloat(e.target.value), 1, 10000));
                  updateDraftFilter("voteCntGte", value);
                }}
                disabled={isPerson}
                aria-label={t("filters.min_votes")}
                className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
              />
              <input
                id="filter-min-votes"
                type="number"
                value={draftFilters.voteCntGte}
                onChange={(e) => {
                  const value = e.target.value === "" ? 0 : parseInt(e.target.value);
                  updateDraftFilter("voteCntGte", Math.max(0, value || 0));
                }}
                onBlur={(e) => {
                  const num = parseInt(e.target.value) || 0;
                  updateDraftFilter("voteCntGte", snapVotes(Math.max(0, num)));
                }}
                placeholder="0"
                min="0"
                disabled={isPerson}
                aria-label={t("filters.min_votes")}
                className={`w-24 px-2 py-2 rounded-lg border bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm text-center min-h-[44px] focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                  isPerson
                    ? "border-slate-200 dark:border-slate-600 opacity-50 cursor-not-allowed"
                    : "border-slate-300 dark:border-slate-600"
                }`}
                title={isPerson ? t("filters.not_applicable_person") : ""}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t("filters.min_votes_hint")}</p>
            {/* Vote Presets */}
            <div className="flex flex-wrap gap-2">
              {[0, 10, 50, 100, 500, 1000, 5000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => updateDraftFilter("voteCntGte", preset)}
                  disabled={isPerson}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap min-h-[44px] flex items-center justify-center ${
                    draftFilters.voteCntGte === preset
                      ? "bg-cyan-500 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {preset.toLocaleString("pt-BR")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* With Poster */}
        <div className="flex items-center min-h-[44px]">
          <label htmlFor="filter-with-poster" className="flex items-center gap-2 cursor-pointer">
            <input
              id="filter-with-poster"
              type="checkbox"
              checked={draftFilters.withPoster}
              onChange={(e) => updateDraftFilter("withPoster", e.target.checked)}
              aria-label={t("filters.only_with_poster")}
              className="w-5 h-5 text-cyan-600 rounded border-slate-300 dark:border-slate-600 focus:ring-cyan-500"
            />
            <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">{t("filters.only_with_poster")}</span>
          </label>
        </div>
      </div>

      {/* Footer - Fixed */}
      <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-300 dark:border-slate-600 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row gap-2 sm:gap-3 z-10">
        <button
          onClick={handleApply}
          aria-label={t("filters.apply")}
          className="flex-1 px-4 py-3 rounded-lg font-semibold text-white bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 transition-all min-h-[44px] flex items-center justify-center"
        >
          {t("filters.apply")}
        </button>
        <button
          onClick={handleClearAll}
          aria-label={t("filters.clear_all")}
          className="px-4 py-3 rounded-lg font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all min-h-[44px] whitespace-nowrap"
        >
          {t("filters.clear_all")}
        </button>
        <button
          onClick={handleCancel}
          aria-label={t("filters.cancel")}
          className="px-4 py-3 rounded-lg font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all min-h-[44px] whitespace-nowrap"
        >
          {t("filters.cancel")}
        </button>
      </div>
    </div>
  );

  if (!isOpen) return null;

  // Mobile/Tablet: bottom-sheet or full-screen modal (< 1024px)
  if (isMobile) {
    return (
      <>
        <div className="fixed inset-0 bg-black/50 z-40" onClick={handleCancel} aria-hidden="true" />
        <div
          className="fixed inset-x-0 bottom-0 bg-white dark:bg-slate-800 rounded-t-2xl border-t border-slate-300 dark:border-slate-600 shadow-2xl z-50 max-h-[90vh] flex flex-col"
          role="dialog"
          aria-labelledby="filters-title"
          aria-modal="true"
        >
          {filtersContent}
        </div>
      </>
    );
  }

  // Desktop: side panel (≥ 1024px)
  if (isDesktop) {
    return (
      <>
        <div className="fixed inset-0 bg-black/50 z-40" onClick={handleCancel} aria-hidden="true" />
        <div
          className="fixed right-0 top-0 h-full w-full max-w-[420px] lg:max-w-[480px] bg-white dark:bg-slate-800 border-l border-slate-300 dark:border-slate-600 shadow-2xl z-50 flex flex-col"
          role="dialog"
          aria-labelledby="filters-title"
          aria-modal="true"
        >
          {filtersContent}
        </div>
      </>
    );
  }

  return null;
};

