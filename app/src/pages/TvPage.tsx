import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DiscoverFiltersPanel } from "../components/DiscoverFilters";
import type { DiscoverFilters } from "../api";
import type { MovieT } from "../types/movies";
import { mediaKey } from "../types/movies";

interface TvPageProps {
  discoverTv: {
    items: MovieT[];
    total: number;
    page: number;
    totalPages: number;
    loading: boolean;
  };
  tvFilters: DiscoverFilters;
  setTvFilters: (filters: DiscoverFilters) => void;
  tvPerPage: number;
  setTvPerPage: (perPage: number) => void;
  tvFacets: any;
  loadDiscoverTv: (page: number, filters: DiscoverFilters) => void;
  setDiscoverTv: React.Dispatch<React.SetStateAction<{
    items: MovieT[];
    total: number;
    page: number;
    totalPages: number;
    loading: boolean;
  }>>;
  t: (key: string, params?: Record<string, any>) => string;
  renderMovieCard: (movie: MovieT) => React.ReactNode;
}

export const TvPage: React.FC<TvPageProps> = ({
  discoverTv,
  tvFilters,
  setTvFilters,
  tvPerPage,
  setTvPerPage,
  tvFacets,
  loadDiscoverTv,
  setDiscoverTv,
  t,
  renderMovieCard,
}) => {
  return (
    <div className="flex flex-col min-[1280px]:flex-row gap-4 sm:gap-6">
      {/* Filtros Laterais */}
      <DiscoverFiltersPanel
        media="tv"
        filters={tvFilters}
        onFiltersChange={(newFilters) => {
          setTvFilters(newFilters);
          setDiscoverTv((prev) => ({ ...prev, page: 1 }));
          loadDiscoverTv(1, newFilters);
        }}
        onReset={() => {
          const defaultFilters = { sortBy: "popularity.desc", region: "BR", withPoster: true };
          setTvFilters(defaultFilters);
          setDiscoverTv((prev) => ({ ...prev, page: 1 }));
          loadDiscoverTv(1, defaultFilters);
        }}
        onApply={() => {
          setDiscoverTv((prev) => ({ ...prev, page: 1 }));
          loadDiscoverTv(1, tvFilters);
        }}
        facets={tvFacets}
      />
      
      {/* Grid de Resultados */}
      <div className="flex-1 min-w-0">
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">{t("tv_series")}</h2>
              {discoverTv.total > 0 && (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  {discoverTv.total} resultados • Mostrando {((discoverTv.page - 1) * tvPerPage) + 1}–{Math.min(discoverTv.page * tvPerPage, discoverTv.total)} de {discoverTv.total}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">Itens por página:</label>
              <select
                value={tvPerPage}
                onChange={(e) => {
                  const newPerPage = parseInt(e.target.value, 10);
                  setTvPerPage(newPerPage);
                  localStorage.setItem("vetra:tvPerPage", String(newPerPage));
                  setDiscoverTv((prev) => ({ ...prev, page: 1 }));
                  loadDiscoverTv(1, tvFilters);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px]"
              >
                <option value="12">12</option>
                <option value="24">24</option>
                <option value="36">36</option>
                <option value="48">48</option>
              </select>
            </div>
          </div>
          
          {discoverTv.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
              <button
                onClick={() => {
                  const prevPage = discoverTv.page - 1;
                  if (prevPage >= 1) {
                    loadDiscoverTv(prevPage, tvFilters);
                  }
                }}
                disabled={discoverTv.page === 1 || discoverTv.loading}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: Math.min(5, discoverTv.totalPages) }, (_, i) => {
                let pageNum;
                if (discoverTv.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (discoverTv.page <= 3) {
                  pageNum = i + 1;
                } else if (discoverTv.page >= discoverTv.totalPages - 2) {
                  pageNum = discoverTv.totalPages - 4 + i;
                } else {
                  pageNum = discoverTv.page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => {
                      loadDiscoverTv(pageNum, tvFilters);
                    }}
                    disabled={discoverTv.loading}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                      discoverTv.page === pageNum
                        ? "bg-cyan-600 text-white border-cyan-600"
                        : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => {
                  const nextPage = discoverTv.page + 1;
                  if (nextPage <= discoverTv.totalPages) {
                    loadDiscoverTv(nextPage, tvFilters);
                  }
                }}
                disabled={discoverTv.page === discoverTv.totalPages || discoverTv.loading}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {discoverTv.loading && discoverTv.items.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 min-[1280px]:grid-cols-5 min-[1536px]:grid-cols-6 gap-3 sm:gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : discoverTv.items.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 min-[1280px]:grid-cols-5 min-[1536px]:grid-cols-6 gap-2 sm:gap-2 md:gap-3 lg:gap-4">
              {discoverTv.items.map((series) => renderMovieCard(series))}
            </div>
            {discoverTv.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
                <button
                  onClick={() => {
                    const prevPage = discoverTv.page - 1;
                    if (prevPage >= 1) {
                      loadDiscoverTv(prevPage, tvFilters);
                    }
                  }}
                  disabled={discoverTv.page === 1 || discoverTv.loading}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <ChevronLeft size={18} />
                </button>
                {Array.from({ length: Math.min(5, discoverTv.totalPages) }, (_, i) => {
                  let pageNum;
                  if (discoverTv.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (discoverTv.page <= 3) {
                    pageNum = i + 1;
                  } else if (discoverTv.page >= discoverTv.totalPages - 2) {
                    pageNum = discoverTv.totalPages - 4 + i;
                  } else {
                    pageNum = discoverTv.page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => {
                        loadDiscoverTv(pageNum, tvFilters);
                      }}
                      disabled={discoverTv.loading}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                        discoverTv.page === pageNum
                          ? "bg-cyan-600 text-white border-cyan-600"
                          : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => {
                    const nextPage = discoverTv.page + 1;
                    if (nextPage <= discoverTv.totalPages) {
                      loadDiscoverTv(nextPage, tvFilters);
                    }
                  }}
                  disabled={discoverTv.page === discoverTv.totalPages || discoverTv.loading}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Nenhum título encontrado para estes filtros.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-4">
              <button
                onClick={() => setTvFilters({ sortBy: "popularity.desc", region: "BR", withPoster: true })}
                className="px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 transition-colors min-h-[44px]"
              >
                Limpar filtros
              </button>
              <button
                onClick={() => {
                  const defaultFilters = { sortBy: "popularity.desc", region: "BR", withPoster: true };
                  setTvFilters(defaultFilters);
                  loadDiscoverTv(1, defaultFilters);
                }}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors min-h-[44px]"
              >
                Voltar para populares
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

