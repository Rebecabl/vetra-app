import React, { useEffect, useState } from "react";
import { X, Filter, ChevronDown, ChevronUp } from "lucide-react";
import api, { type DiscoverFilters, type Genre, type WatchProvider } from "../api";

interface DiscoverFiltersProps {
  media: "movie" | "tv";
  filters: DiscoverFilters;
  onFiltersChange: (filters: DiscoverFilters) => void;
  onReset: () => void;
}

export const DiscoverFiltersPanel: React.FC<DiscoverFiltersProps> = ({
  media,
  filters,
  onFiltersChange,
  onReset,
}) => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [providers, setProviders] = useState<WatchProvider[]>([]);
  const [loadingGenres, setLoadingGenres] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    sort: true,
    genres: true,
    dates: false,
    ratings: false,
    providers: false,
  });

  useEffect(() => {
    loadGenres();
    loadProviders();
  }, [media]);

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
      setProviders(data.slice(0, 20)); // Limitar a 20 providers mais populares
    } catch (e) {
      console.error("Erro ao carregar providers:", e);
    } finally {
      setLoadingProviders(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateFilter = (key: keyof DiscoverFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleGenre = (genreId: number) => {
    const currentGenres = filters.genres || [];
    const newGenres = currentGenres.includes(genreId)
      ? currentGenres.filter((id) => id !== genreId)
      : [...currentGenres, genreId];
    updateFilter("genres", newGenres);
  };

  const toggleProvider = (providerId: number) => {
    const currentProviders = filters.watchProviders || [];
    const newProviders = currentProviders.includes(providerId)
      ? currentProviders.filter((id) => id !== providerId)
      : [...currentProviders, providerId];
    updateFilter("watchProviders", newProviders);
  };

  const toggleMonetizationType = (type: string) => {
    const currentTypes = filters.watchMonetizationTypes || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];
    updateFilter("watchMonetizationTypes", newTypes);
  };

  const hasActiveFilters = () => {
    return !!(
      (filters.genres && filters.genres.length > 0) ||
      (filters.watchProviders && filters.watchProviders.length > 0) ||
      (filters.watchMonetizationTypes && filters.watchMonetizationTypes.length > 0) ||
      filters.year ||
      filters.voteAverageGte ||
      filters.sortBy !== "popularity.desc"
    );
  };

  const sortOptions = [
    { value: "popularity.desc", label: "Mais Popular" },
    { value: "popularity.asc", label: "Menos Popular" },
    { value: "vote_average.desc", label: "Melhor Avaliado" },
    { value: "vote_average.asc", label: "Pior Avaliado" },
    { value: "release_date.desc", label: "Data de Lançamento (Recente)" },
    { value: "release_date.asc", label: "Data de Lançamento (Antigo)" },
    { value: "title.asc", label: "Título (A-Z)" },
    { value: "title.desc", label: "Título (Z-A)" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);

  return (
    <div className="w-full md:w-80 flex-shrink-0 bg-white dark:bg-slate-900 md:border-r border-b md:border-b-0 border-slate-200 dark:border-slate-800 p-4 md:overflow-y-auto md:max-h-[calc(100vh-8rem)] sticky md:static top-20 md:top-0 z-20 md:z-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm md:backdrop-blur-none">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Filter size={20} />
          Filtros
        </h3>
        {hasActiveFilters() && (
          <button
            onClick={onReset}
            className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Ordenar */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection("sort")}
          className="w-full flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white mb-2"
        >
          Ordenar
          {expandedSections.sort ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {expandedSections.sort && (
          <select
            value={filters.sortBy || "popularity.desc"}
            onChange={(e) => updateFilter("sortBy", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Gêneros */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection("genres")}
          className="w-full flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white mb-2"
        >
          Gêneros
          {expandedSections.genres ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {expandedSections.genres && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {loadingGenres ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">Carregando...</p>
            ) : (
              genres.map((genre) => (
                <label
                  key={genre.id}
                  className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <input
                    type="checkbox"
                    checked={filters.genres?.includes(genre.id) || false}
                    onChange={() => toggleGenre(genre.id)}
                    className="rounded border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>{genre.name}</span>
                </label>
              ))
            )}
          </div>
        )}
      </div>

      {/* Datas */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection("dates")}
          className="w-full flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white mb-2"
        >
          {media === "movie" ? "Data de Lançamento" : "Data de Estreia"}
          {expandedSections.dates ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {expandedSections.dates && (
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Ano</label>
              <select
                value={filters.year || ""}
                onChange={(e) => updateFilter("year", e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
              >
                <option value="">Todos os anos</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            {media === "movie" ? (
              <>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">De</label>
                  <input
                    type="date"
                    value={filters.releaseDateFrom || ""}
                    onChange={(e) => updateFilter("releaseDateFrom", e.target.value || undefined)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Até</label>
                  <input
                    type="date"
                    value={filters.releaseDateTo || ""}
                    onChange={(e) => updateFilter("releaseDateTo", e.target.value || undefined)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">De</label>
                  <input
                    type="date"
                    value={filters.airDateFrom || ""}
                    onChange={(e) => updateFilter("airDateFrom", e.target.value || undefined)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Até</label>
                  <input
                    type="date"
                    value={filters.airDateTo || ""}
                    onChange={(e) => updateFilter("airDateTo", e.target.value || undefined)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Avaliações */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection("ratings")}
          className="w-full flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white mb-2"
        >
          Avaliações
          {expandedSections.ratings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {expandedSections.ratings && (
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                Avaliação mínima: {filters.voteAverageGte || 0}
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={filters.voteAverageGte || 0}
                onChange={(e) => updateFilter("voteAverageGte", Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                Mínimo de votos: {filters.voteCountGte || 0}
              </label>
              <input
                type="number"
                min="0"
                value={filters.voteCountGte || ""}
                onChange={(e) => updateFilter("voteCountGte", e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                placeholder="0"
              />
            </div>
          </div>
        )}
      </div>

      {/* Onde Assistir */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection("providers")}
          className="w-full flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white mb-2"
        >
          Onde Assistir
          {expandedSections.providers ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {expandedSections.providers && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">Disponibilidade</label>
              <div className="space-y-1">
                {["flatrate", "rent", "buy"].map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.watchMonetizationTypes?.includes(type) || false}
                      onChange={() => toggleMonetizationType(type)}
                      className="rounded border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-cyan-500"
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
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {loadingProviders ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400">Carregando...</p>
                ) : (
                  providers.map((provider) => (
                    <label
                      key={provider.provider_id}
                      className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.watchProviders?.includes(provider.provider_id) || false}
                        onChange={() => toggleProvider(provider.provider_id)}
                        className="rounded border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-cyan-500"
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
    </div>
  );
};

