import React, { useEffect, useState, useCallback, useRef } from "react";
import { Filter, ChevronDown, ChevronUp, X } from "lucide-react";
import api, { type DiscoverFilters, type Genre, type WatchProvider } from "../api";

interface DiscoverFiltersProps {
  media: "movie" | "tv";
  filters: DiscoverFilters;
  onFiltersChange: (filters: DiscoverFilters) => void;
  onReset: () => void;
  onApply?: () => void;
  facets?: {
    minYear?: number;
    maxYear?: number;
    genres?: Genre[];
  };
}

export const DiscoverFiltersPanel: React.FC<DiscoverFiltersProps> = ({
  media,
  filters,
  onFiltersChange,
  onReset,
  onApply,
  facets,
}) => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [providers, setProviders] = useState<WatchProvider[]>([]);
  const [loadingGenres, setLoadingGenres] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<DiscoverFilters>(filters);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    sort: true,
    genres: true,
    dates: true,
    ratings: true,
    providers: false,
  });
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1280);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isDesktop = windowWidth >= 1280;
  const isLaptop = windowWidth >= 1024 && windowWidth < 1280;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isMobile = windowWidth < 768;

  useEffect(() => {
    const checkDesktop = windowWidth >= 1280;
    setExpandedSections({
      sort: checkDesktop,
      genres: checkDesktop,
      dates: checkDesktop,
      ratings: checkDesktop,
      providers: false,
    });
  }, [windowWidth]);

  useEffect(() => {
    loadGenres();
    loadProviders();
  }, [media]);

  useEffect(() => {
    if (facets?.genres) {
      setGenres(facets.genres);
    }
  }, [facets?.genres]);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  useEffect(() => {
    if (isOpen && (isMobile || isTablet || isLaptop)) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, isMobile, isTablet, isLaptop]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && (isMobile || isTablet || isLaptop)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, isMobile, isTablet, isLaptop]);

  const loadGenres = async () => {
    setLoadingGenres(true);
    try {
      const data = await api.getGenres(media);
      setGenres(data);
    } catch (e) {
      console.error("Erro ao carregar gêneros:", e);
    } finally {
      setLoadingGenres(false);
    }
  };

  const loadProviders = async () => {
    setLoadingProviders(true);
    try {
      const data = await api.getWatchProviders("BR");
      setProviders(data.slice(0, 20));
    } catch (e) {
      console.error("Erro ao carregar providers:", e);
    } finally {
      setLoadingProviders(false);
    }
  };

  const toggleSection = (section: string) => {
    if (isMobile) {
      setExpandedSections((prev) => {
        const newState: Record<string, boolean> = {};
        Object.keys(prev).forEach((key) => {
          newState[key] = key === section ? !prev[key] : false;
        });
        return newState;
      });
    } else {
      setExpandedSections((prev) => ({
        ...prev,
        [section]: !prev[section],
      }));
    }
  };

  const updateLocalFilter = useCallback((key: keyof DiscoverFilters, value: any) => {
    setLocalFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      
      if (windowWidth >= 1280) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          onFiltersChange(newFilters);
        }, 350);
      }
      
      return newFilters;
    });
  }, [onFiltersChange, windowWidth]);

  const handleApply = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    onFiltersChange(localFilters);
    if (onApply) onApply();
    setIsOpen(false);
  };

  const handleReset = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    const defaultFilters: DiscoverFilters = {
      sortBy: "popularity.desc",
      region: "BR",
      withPoster: true,
    };
    setLocalFilters(defaultFilters);
    onReset();
    setIsOpen(false);
  };

  const toggleGenre = (genreId: number) => {
    const currentGenres = localFilters.genres || [];
    const newGenres = currentGenres.includes(genreId)
      ? currentGenres.filter((id) => id !== genreId)
      : [...currentGenres, genreId];
    updateLocalFilter("genres", newGenres);
  };

  const toggleProvider = (providerId: number) => {
    const currentProviders = localFilters.watchProviders || [];
    const newProviders = currentProviders.includes(providerId)
      ? currentProviders.filter((id) => id !== providerId)
      : [...currentProviders, providerId];
    updateLocalFilter("watchProviders", newProviders);
  };

  const toggleMonetizationType = (type: string) => {
    const currentTypes = localFilters.watchMonetizationTypes || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];
    updateLocalFilter("watchMonetizationTypes", newTypes);
  };

  const snapRating = (value: number): number => {
    return Math.round(value * 10) / 10;
  };

  const snapVotes = (value: number): number => {
    const presets = [0, 10, 50, 100, 500, 1000, 5000];
    let closest = presets[0];
    let minDiff = Math.abs(value - closest);
    for (const preset of presets) {
      const diff = Math.abs(value - preset);
      if (diff < minDiff) {
        minDiff = diff;
        closest = preset;
      }
    }
    return closest;
  };

  const handleRatingChange = (value: number) => {
    const snapped = snapRating(value);
    updateLocalFilter("voteAverageGte", snapped);
  };

  const handleVotesChange = (value: number) => {
    const snapped = snapVotes(value);
    updateLocalFilter("voteCountGte", snapped);
  };

  const handleYearFromChange = (value: string) => {
    const year = value ? parseInt(value) : undefined;
    if (!year) {
      if (media === "movie") {
        updateLocalFilter("releaseDateFrom", undefined);
      } else {
        updateLocalFilter("airDateFrom", undefined);
      }
      return;
    }
    
    const minYear = facets?.minYear || 1870;
    const maxYear = facets?.maxYear || new Date().getFullYear() + 1;
    
    if (year < minYear) {
      const corrected = minYear;
      if (media === "movie") {
        updateLocalFilter("releaseDateFrom", `${corrected}-01-01`);
      } else {
        updateLocalFilter("airDateFrom", `${corrected}-01-01`);
      }
      return;
    }
    
    if (year > maxYear) {
      const corrected = maxYear;
      if (media === "movie") {
        updateLocalFilter("releaseDateFrom", `${corrected}-01-01`);
      } else {
        updateLocalFilter("airDateFrom", `${corrected}-01-01`);
      }
      return;
    }
    
    const yearTo = localFilters.year 
      ? undefined 
      : (media === "movie" 
          ? (localFilters.releaseDateTo ? parseInt(localFilters.releaseDateTo.split("-")[0]) : undefined)
          : (localFilters.airDateTo ? parseInt(localFilters.airDateTo.split("-")[0]) : undefined));
    
    if (yearTo && year > yearTo) {
      const corrected = yearTo;
      if (media === "movie") {
        updateLocalFilter("releaseDateFrom", `${corrected}-01-01`);
        updateLocalFilter("releaseDateTo", `${corrected}-12-31`);
      } else {
        updateLocalFilter("airDateFrom", `${corrected}-01-01`);
        updateLocalFilter("airDateTo", `${corrected}-12-31`);
      }
      return;
    }
    
    if (media === "movie") {
      updateLocalFilter("releaseDateFrom", `${year}-01-01`);
    } else {
      updateLocalFilter("airDateFrom", `${year}-01-01`);
    }
  };

  const handleYearToChange = (value: string) => {
    const year = value ? parseInt(value) : undefined;
    if (!year) {
      if (media === "movie") {
        updateLocalFilter("releaseDateTo", undefined);
      } else {
        updateLocalFilter("airDateTo", undefined);
      }
      return;
    }
    
    const minYear = facets?.minYear || 1870;
    const maxYear = facets?.maxYear || new Date().getFullYear() + 1;
    
    if (year < minYear) {
      const corrected = minYear;
      if (media === "movie") {
        updateLocalFilter("releaseDateTo", `${corrected}-12-31`);
      } else {
        updateLocalFilter("airDateTo", `${corrected}-12-31`);
      }
      return;
    }
    
    if (year > maxYear) {
      const corrected = maxYear;
      if (media === "movie") {
        updateLocalFilter("releaseDateTo", `${corrected}-12-31`);
      } else {
        updateLocalFilter("airDateTo", `${corrected}-12-31`);
      }
      return;
    }
    
    const yearFrom = localFilters.year 
      ? undefined 
      : (media === "movie" 
          ? (localFilters.releaseDateFrom ? parseInt(localFilters.releaseDateFrom.split("-")[0]) : undefined)
          : (localFilters.airDateFrom ? parseInt(localFilters.airDateFrom.split("-")[0]) : undefined));
    
    if (yearFrom && year < yearFrom) {
      const corrected = yearFrom;
      if (media === "movie") {
        updateLocalFilter("releaseDateFrom", `${corrected}-01-01`);
        updateLocalFilter("releaseDateTo", `${corrected}-12-31`);
      } else {
        updateLocalFilter("airDateFrom", `${corrected}-01-01`);
        updateLocalFilter("airDateTo", `${corrected}-12-31`);
      }
      return;
    }
    
    if (media === "movie") {
      updateLocalFilter("releaseDateTo", `${year}-12-31`);
    } else {
      updateLocalFilter("airDateTo", `${year}-12-31`);
    }
  };

  const hasActiveFilters = () => {
    return !!(
      (localFilters.genres && localFilters.genres.length > 0) ||
      (localFilters.watchProviders && localFilters.watchProviders.length > 0) ||
      (localFilters.watchMonetizationTypes && localFilters.watchMonetizationTypes.length > 0) ||
      localFilters.year ||
      localFilters.releaseDateFrom ||
      localFilters.releaseDateTo ||
      localFilters.airDateFrom ||
      localFilters.airDateTo ||
      (localFilters.voteAverageGte && localFilters.voteAverageGte > 0) ||
      (localFilters.voteCountGte && localFilters.voteCountGte > 0) ||
      localFilters.sortBy !== "popularity.desc" ||
      localFilters.withPoster === false
    );
  };

  const sortOptions = [
    { value: "popularity.desc", label: "Mais Popular" },
    { value: "vote_average.desc", label: "Melhor Avaliação" },
    { value: media === "movie" ? "release_date.desc" : "first_air_date.desc", label: "Ano (mais recente)" },
    { value: "vote_count.desc", label: "Nº de votos" },
  ];

  const getAvailableYears = () => {
    if (facets?.minYear && facets?.maxYear) {
      const years = [];
      for (let year = facets.maxYear; year >= facets.minYear; year--) {
        years.push(year);
      }
      return years;
    }
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear + 1; year >= 1870; year--) {
      years.push(year);
    }
    return years;
  };

  const votePresets = [0, 10, 50, 100, 500, 1000, 5000];

  const filtersContent = (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="mb-4 sm:mb-6">
          <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
            Ordenar por
          </label>
          <select
            value={localFilters.sortBy || "popularity.desc"}
            onChange={(e) => updateLocalFilter("sortBy", e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px]"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => toggleSection("genres")}
            className="w-full flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white mb-2 min-h-[44px]"
          >
            <span>Gêneros</span>
            <ChevronDown 
              size={18} 
              className={`transition-transform duration-200 ${expandedSections.genres ? "rotate-180" : ""}`}
            />
          </button>
          {expandedSections.genres && (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {loadingGenres ? (
                <p className="text-sm text-slate-600 dark:text-slate-400">Carregando...</p>
              ) : (
                genres.map((genre) => (
                  <label
                    key={genre.id}
                    className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white min-h-[44px] px-1"
                  >
                    <input
                      type="checkbox"
                      checked={localFilters.genres?.includes(genre.id) || false}
                      onChange={() => toggleGenre(genre.id)}
                      className="rounded border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-cyan-500 w-5 h-5 min-w-[20px] min-h-[20px]"
                    />
                    <span>{genre.name}</span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => toggleSection("dates")}
            className="w-full flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white mb-2 min-h-[44px]"
          >
            <span>{media === "movie" ? "Data de Lançamento" : "Data de Estreia"}</span>
            <ChevronDown 
              size={18} 
              className={`transition-transform duration-200 ${expandedSections.dates ? "rotate-180" : ""}`}
            />
          </button>
          {expandedSections.dates && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1.5">Ano</label>
                <select
                  value={localFilters.year || ""}
                  onChange={(e) => updateLocalFilter("year", e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px]"
                >
                  <option value="">Todos os anos</option>
                  {getAvailableYears().map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1.5">De</label>
                  <input
                    type="number"
                    min={facets?.minYear || 1870}
                    max={facets?.maxYear || new Date().getFullYear() + 1}
                    value={localFilters.year ? "" : (media === "movie" ? (localFilters.releaseDateFrom ? parseInt(localFilters.releaseDateFrom.split("-")[0]) : "") : (localFilters.airDateFrom ? parseInt(localFilters.airDateFrom.split("-")[0]) : ""))}
                    onChange={(e) => handleYearFromChange(e.target.value)}
                    placeholder="Ano"
                    disabled={!!localFilters.year}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                    aria-label="Ano de"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1.5">Até</label>
                  <input
                    type="number"
                    min={facets?.minYear || 1870}
                    max={facets?.maxYear || new Date().getFullYear() + 1}
                    value={localFilters.year ? "" : (media === "movie" ? (localFilters.releaseDateTo ? parseInt(localFilters.releaseDateTo.split("-")[0]) : "") : (localFilters.airDateTo ? parseInt(localFilters.airDateTo.split("-")[0]) : ""))}
                    onChange={(e) => handleYearToChange(e.target.value)}
                    placeholder="Ano"
                    disabled={!!localFilters.year}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                    aria-label="Ano até"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => toggleSection("ratings")}
            className="w-full flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white mb-2 min-h-[44px]"
          >
            <span>Avaliações</span>
            <ChevronDown 
              size={18} 
              className={`transition-transform duration-200 ${expandedSections.ratings ? "rotate-180" : ""}`}
            />
          </button>
          {expandedSections.ratings && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs text-slate-600 dark:text-slate-400">
                    Avaliação mínima
                  </label>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    ≥ {localFilters.voteAverageGte || 0}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={localFilters.voteAverageGte || 0}
                  onChange={(e) => handleRatingChange(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                  style={{
                    background: `linear-gradient(to right, rgb(8 145 178) 0%, rgb(8 145 178) ${((localFilters.voteAverageGte || 0) / 10) * 100}%, rgb(226 232 240) ${((localFilters.voteAverageGte || 0) / 10) * 100}%, rgb(226 232 240) 100%)`
                  }}
                  aria-label="Avaliação mínima"
                  aria-valuenow={localFilters.voteAverageGte || 0}
                  aria-valuemin={0}
                  aria-valuemax={10}
                />
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Use de 0 a 10</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs text-slate-600 dark:text-slate-400">
                    Mínimo de votos
                  </label>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    ≥ {localFilters.voteCountGte || 0} votos
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="10"
                  value={localFilters.voteCountGte || 0}
                  onChange={(e) => handleVotesChange(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                  style={{
                    background: `linear-gradient(to right, rgb(8 145 178) 0%, rgb(8 145 178) ${((localFilters.voteCountGte || 0) / 5000) * 100}%, rgb(226 232 240) ${((localFilters.voteCountGte || 0) / 5000) * 100}%, rgb(226 232 240) 100%)`
                  }}
                  aria-label="Mínimo de votos"
                  aria-valuenow={localFilters.voteCountGte || 0}
                  aria-valuemin={0}
                  aria-valuemax={5000}
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {votePresets.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => updateLocalFilter("voteCountGte", preset)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors min-h-[44px] ${
                        localFilters.voteCountGte === preset
                          ? "bg-cyan-600 text-white border-cyan-600"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-cyan-500"
                      }`}
                    >
                      {preset.toLocaleString("pt-BR")}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                  Valores muito baixos podem trazer títulos pouco avaliados.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mb-4 sm:mb-6">
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer min-h-[44px] px-1">
            <input
              type="checkbox"
              checked={localFilters.withPoster !== false}
              onChange={(e) => updateLocalFilter("withPoster", e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-cyan-500 w-5 h-5 min-w-[20px] min-h-[20px]"
            />
            <span>Apenas com pôster</span>
          </label>
        </div>

        {providers.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <button
              onClick={() => toggleSection("providers")}
              className="w-full flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white mb-2 min-h-[44px]"
            >
              <span>Onde Assistir</span>
              <ChevronDown 
                size={18} 
                className={`transition-transform duration-200 ${expandedSections.providers ? "rotate-180" : ""}`}
              />
            </button>
            {expandedSections.providers && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">Disponibilidade</label>
                  <div className="space-y-1">
                    {["flatrate", "rent", "buy"].map((type) => (
                      <label
                        key={type}
                        className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer min-h-[44px] px-1"
                      >
                        <input
                          type="checkbox"
                          checked={localFilters.watchMonetizationTypes?.includes(type) || false}
                          onChange={() => toggleMonetizationType(type)}
                          className="rounded border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-cyan-500 w-5 h-5 min-w-[20px] min-h-[20px]"
                        />
                        <span>
                          {type === "flatrate" ? "Streaming" : type === "rent" ? "Alugar" : "Comprar"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">Serviços</label>
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {loadingProviders ? (
                      <p className="text-sm text-slate-600 dark:text-slate-400">Carregando...</p>
                    ) : (
                      providers.map((provider) => (
                        <label
                          key={provider.provider_id}
                          className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer min-h-[44px] px-1"
                        >
                          <input
                            type="checkbox"
                            checked={localFilters.watchProviders?.includes(provider.provider_id) || false}
                            onChange={() => toggleProvider(provider.provider_id)}
                            className="rounded border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-cyan-500 w-5 h-5 min-w-[20px] min-h-[20px]"
                          />
                          <span>{provider.provider_name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {(isMobile || isTablet || isLaptop) && (
        <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900" style={{ paddingBottom: `max(env(safe-area-inset-bottom), 16px)` }}>
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium min-h-[44px] flex items-center justify-center"
            >
              Limpar
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold transition-colors min-h-[44px] flex items-center justify-center"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <aside className="w-[320px] xl:w-[360px] flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto max-h-[calc(100vh-8rem)] sticky top-20">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Filter size={20} />
              Filtros
            </h3>
            {hasActiveFilters() && (
              <button
                onClick={onReset}
                className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline font-medium min-h-[44px] flex items-center"
              >
                Limpar
              </button>
            )}
          </div>
          <div className="space-y-4 sm:space-y-6">
            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                Ordenar por
              </label>
              <select
                value={localFilters.sortBy || "popularity.desc"}
                onChange={(e) => updateLocalFilter("sortBy", e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px]"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4 sm:mb-6">
              <button
                onClick={() => toggleSection("genres")}
                className="w-full flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white mb-2 min-h-[44px]"
              >
                <span>Gêneros</span>
                <ChevronDown 
                  size={18} 
                  className={`transition-transform duration-200 ${expandedSections.genres ? "rotate-180" : ""}`}
                />
              </button>
              {expandedSections.genres && (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {loadingGenres ? (
                    <p className="text-sm text-slate-600 dark:text-slate-400">Carregando...</p>
                  ) : (
                    genres.map((genre) => (
                      <label
                        key={genre.id}
                        className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white min-h-[44px] px-1"
                      >
                        <input
                          type="checkbox"
                          checked={localFilters.genres?.includes(genre.id) || false}
                          onChange={() => toggleGenre(genre.id)}
                          className="rounded border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-cyan-500 w-5 h-5 min-w-[20px] min-h-[20px]"
                        />
                        <span>{genre.name}</span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="mb-4 sm:mb-6">
              <button
                onClick={() => toggleSection("dates")}
                className="w-full flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white mb-2 min-h-[44px]"
              >
                <span>{media === "movie" ? "Data de Lançamento" : "Data de Estreia"}</span>
                <ChevronDown 
                  size={18} 
                  className={`transition-transform duration-200 ${expandedSections.dates ? "rotate-180" : ""}`}
                />
              </button>
              {expandedSections.dates && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1.5">Ano</label>
                    <select
                      value={localFilters.year || ""}
                      onChange={(e) => updateLocalFilter("year", e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px]"
                    >
                      <option value="">Todos os anos</option>
                      {getAvailableYears().map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1.5">De</label>
                      <input
                        type="number"
                        min={facets?.minYear || 1870}
                        max={facets?.maxYear || new Date().getFullYear() + 1}
                        value={localFilters.year ? "" : (media === "movie" ? (localFilters.releaseDateFrom ? parseInt(localFilters.releaseDateFrom.split("-")[0]) : "") : (localFilters.airDateFrom ? parseInt(localFilters.airDateFrom.split("-")[0]) : ""))}
                        onChange={(e) => handleYearFromChange(e.target.value)}
                        placeholder="Ano"
                        disabled={!!localFilters.year}
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                        aria-label="Ano de"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1.5">Até</label>
                      <input
                        type="number"
                        min={facets?.minYear || 1870}
                        max={facets?.maxYear || new Date().getFullYear() + 1}
                        value={localFilters.year ? "" : (media === "movie" ? (localFilters.releaseDateTo ? parseInt(localFilters.releaseDateTo.split("-")[0]) : "") : (localFilters.airDateTo ? parseInt(localFilters.airDateTo.split("-")[0]) : ""))}
                        onChange={(e) => handleYearToChange(e.target.value)}
                        placeholder="Ano"
                        disabled={!!localFilters.year}
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                        aria-label="Ano até"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-4 sm:mb-6">
              <button
                onClick={() => toggleSection("ratings")}
                className="w-full flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white mb-2 min-h-[44px]"
              >
                <span>Avaliações</span>
                <ChevronDown 
                  size={18} 
                  className={`transition-transform duration-200 ${expandedSections.ratings ? "rotate-180" : ""}`}
                />
              </button>
              {expandedSections.ratings && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs text-slate-600 dark:text-slate-400">
                        Avaliação mínima
                      </label>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        ≥ {localFilters.voteAverageGte || 0}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      value={localFilters.voteAverageGte || 0}
                      onChange={(e) => handleRatingChange(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                      style={{
                        background: `linear-gradient(to right, rgb(8 145 178) 0%, rgb(8 145 178) ${((localFilters.voteAverageGte || 0) / 10) * 100}%, rgb(226 232 240) ${((localFilters.voteAverageGte || 0) / 10) * 100}%, rgb(226 232 240) 100%)`
                      }}
                      aria-label="Avaliação mínima"
                      aria-valuenow={localFilters.voteAverageGte || 0}
                      aria-valuemin={0}
                      aria-valuemax={10}
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Use de 0 a 10</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs text-slate-600 dark:text-slate-400">
                        Mínimo de votos
                      </label>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        ≥ {localFilters.voteCountGte || 0} votos
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5000"
                      step="10"
                      value={localFilters.voteCountGte || 0}
                      onChange={(e) => handleVotesChange(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                      style={{
                        background: `linear-gradient(to right, rgb(8 145 178) 0%, rgb(8 145 178) ${((localFilters.voteCountGte || 0) / 5000) * 100}%, rgb(226 232 240) ${((localFilters.voteCountGte || 0) / 5000) * 100}%, rgb(226 232 240) 100%)`
                      }}
                      aria-label="Mínimo de votos"
                      aria-valuenow={localFilters.voteCountGte || 0}
                      aria-valuemin={0}
                      aria-valuemax={5000}
                    />
                    <div className="flex flex-wrap gap-2 mt-3">
                      {votePresets.map((preset) => (
                        <button
                          key={preset}
                          onClick={() => updateLocalFilter("voteCountGte", preset)}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors min-h-[44px] ${
                            localFilters.voteCountGte === preset
                              ? "bg-cyan-600 text-white border-cyan-600"
                              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-cyan-500"
                          }`}
                        >
                          {preset.toLocaleString("pt-BR")}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                      Valores muito baixos podem trazer títulos pouco avaliados.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-4 sm:mb-6">
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer min-h-[44px] px-1">
                <input
                  type="checkbox"
                  checked={localFilters.withPoster !== false}
                  onChange={(e) => updateLocalFilter("withPoster", e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-cyan-500 w-5 h-5 min-w-[20px] min-h-[20px]"
                />
                <span>Apenas com pôster</span>
              </label>
            </div>

            {providers.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <button
                  onClick={() => toggleSection("providers")}
                  className="w-full flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white mb-2 min-h-[44px]"
                >
                  <span>Onde Assistir</span>
                  <ChevronDown 
                    size={18} 
                    className={`transition-transform duration-200 ${expandedSections.providers ? "rotate-180" : ""}`}
                  />
                </button>
                {expandedSections.providers && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">Disponibilidade</label>
                      <div className="space-y-1">
                        {["flatrate", "rent", "buy"].map((type) => (
                          <label
                            key={type}
                            className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer min-h-[44px] px-1"
                          >
                            <input
                              type="checkbox"
                              checked={localFilters.watchMonetizationTypes?.includes(type) || false}
                              onChange={() => toggleMonetizationType(type)}
                              className="rounded border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-cyan-500 w-5 h-5 min-w-[20px] min-h-[20px]"
                            />
                            <span>
                              {type === "flatrate" ? "Streaming" : type === "rent" ? "Alugar" : "Comprar"}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">Serviços</label>
                      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                        {loadingProviders ? (
                          <p className="text-sm text-slate-600 dark:text-slate-400">Carregando...</p>
                        ) : (
                          providers.map((provider) => (
                            <label
                              key={provider.provider_id}
                              className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer min-h-[44px] px-1"
                            >
                              <input
                                type="checkbox"
                                checked={localFilters.watchProviders?.includes(provider.provider_id) || false}
                                onChange={() => toggleProvider(provider.provider_id)}
                                className="rounded border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-cyan-500 w-5 h-5 min-w-[20px] min-h-[20px]"
                              />
                              <span>{provider.provider_name}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium min-h-[44px] mb-4 sm:mb-6"
      >
        <Filter size={18} />
        Filtros
        {hasActiveFilters() && (
          <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-cyan-600 text-white rounded-full">
            {(() => {
              let count = 0;
              if (localFilters.genres && localFilters.genres.length > 0) count++;
              if (localFilters.watchProviders && localFilters.watchProviders.length > 0) count++;
              if (localFilters.watchMonetizationTypes && localFilters.watchMonetizationTypes.length > 0) count++;
              if (localFilters.year) count++;
              if (localFilters.releaseDateFrom || localFilters.releaseDateTo || localFilters.airDateFrom || localFilters.airDateTo) count++;
              if (localFilters.voteAverageGte && localFilters.voteAverageGte > 0) count++;
              if (localFilters.voteCountGte && localFilters.voteCountGte > 0) count++;
              if (localFilters.sortBy !== "popularity.desc") count++;
              if (localFilters.withPoster === false) count++;
              return count;
            })()}
          </span>
        )}
      </button>

      {(isOpen && (isLaptop || isTablet || isMobile)) && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={sheetRef}
            className={`fixed z-50 bg-white dark:bg-slate-900 shadow-2xl ${
              isMobile
                ? "bottom-0 left-0 right-0 h-[98vh] rounded-t-3xl"
                : isTablet
                ? "top-0 left-0 h-full w-[75%] max-w-[400px]"
                : "top-0 right-0 h-full w-[320px]"
            } flex flex-col`}
            style={isMobile ? { paddingBottom: `env(safe-area-inset-bottom)` } : {}}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
              <div className="flex items-center gap-3">
                {hasActiveFilters() && (
                  <button
                    onClick={handleReset}
                    className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline font-medium min-h-[44px] flex items-center"
                  >
                    Limpar
                  </button>
                )}
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Filter size={20} />
                  Filtros
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>
            {filtersContent}
          </div>
        </>
      )}
    </>
  );
};
