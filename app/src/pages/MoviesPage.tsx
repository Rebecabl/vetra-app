import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DiscoverFiltersPanel } from "../components/DiscoverFilters";
import type { DiscoverFilters } from "../api";
import type { MovieT } from "../types/movies";
import { mediaKey } from "../types/movies";

interface MoviesPageProps {
  discoverMovies: {
    items: MovieT[];
    total: number;
    page: number;
    totalPages: number;
    loading: boolean;
  };
  moviesFilters: DiscoverFilters;
  setMoviesFilters: (filters: DiscoverFilters) => void;
  moviesPerPage: number;
  setMoviesPerPage: (perPage: number) => void;
  moviesFacets: any;
  loadDiscoverMovies: (page: number, filters: DiscoverFilters) => void;
  setDiscoverMovies: React.Dispatch<React.SetStateAction<{
    items: MovieT[];
    total: number;
    page: number;
    totalPages: number;
    loading: boolean;
  }>>;
  t: (key: string, params?: Record<string, any>) => string;
  renderMovieCard: (movie: MovieT) => React.ReactNode;
}

export const MoviesPage: React.FC<MoviesPageProps> = ({
  discoverMovies,
  moviesFilters,
  setMoviesFilters,
  moviesPerPage,
  setMoviesPerPage,
  moviesFacets,
  loadDiscoverMovies,
  setDiscoverMovies,
  t,
  renderMovieCard,
}) => {
  return (
    <div className="flex flex-col min-[1280px]:flex-row gap-4 sm:gap-6">
      {/* Filtros Laterais */}
      <DiscoverFiltersPanel
        media="movie"
        filters={moviesFilters}
        onFiltersChange={(newFilters) => {
          setMoviesFilters(newFilters);
          setDiscoverMovies((prev) => ({ ...prev, page: 1 }));
          loadDiscoverMovies(1, newFilters);
        }}
        onReset={() => {
          const defaultFilters = { sortBy: "popularity.desc", region: "BR", withPoster: true };
          setMoviesFilters(defaultFilters);
          setDiscoverMovies((prev) => ({ ...prev, page: 1 }));
          loadDiscoverMovies(1, defaultFilters);
        }}
        onApply={() => {
          setDiscoverMovies((prev) => ({ ...prev, page: 1 }));
          loadDiscoverMovies(1, moviesFilters);
        }}
        facets={moviesFacets}
      />
      
      {/* Grid de Resultados */}
      <div className="flex-1 min-w-0">
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">{t("movies")}</h2>
              {discoverMovies.total > 0 && (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  {discoverMovies.total} resultados • Mostrando {((discoverMovies.page - 1) * moviesPerPage) + 1}–{Math.min(discoverMovies.page * moviesPerPage, discoverMovies.total)} de {discoverMovies.total}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">Itens por página:</label>
              <select
                value={moviesPerPage}
                onChange={(e) => {
                  const newPerPage = parseInt(e.target.value, 10);
                  setMoviesPerPage(newPerPage);
                  localStorage.setItem("vetra:moviesPerPage", String(newPerPage));
                  setDiscoverMovies((prev) => ({ ...prev, page: 1 }));
                  loadDiscoverMovies(1, moviesFilters);
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
          
          {discoverMovies.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
              <button
                onClick={() => {
                  const prevPage = discoverMovies.page - 1;
                  if (prevPage >= 1) {
                    loadDiscoverMovies(prevPage, moviesFilters);
                  }
                }}
                disabled={discoverMovies.page === 1 || discoverMovies.loading}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: Math.min(5, discoverMovies.totalPages) }, (_, i) => {
                let pageNum;
                if (discoverMovies.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (discoverMovies.page <= 3) {
                  pageNum = i + 1;
                } else if (discoverMovies.page >= discoverMovies.totalPages - 2) {
                  pageNum = discoverMovies.totalPages - 4 + i;
                } else {
                  pageNum = discoverMovies.page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => {
                      loadDiscoverMovies(pageNum, moviesFilters);
                    }}
                    disabled={discoverMovies.loading}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                      discoverMovies.page === pageNum
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
                  const nextPage = discoverMovies.page + 1;
                  if (nextPage <= discoverMovies.totalPages) {
                    loadDiscoverMovies(nextPage, moviesFilters);
                  }
                }}
                disabled={discoverMovies.page === discoverMovies.totalPages || discoverMovies.loading}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {discoverMovies.loading && discoverMovies.items.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 min-[1280px]:grid-cols-5 min-[1536px]:grid-cols-6 gap-3 sm:gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : discoverMovies.items.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 min-[1201px]:grid-cols-6 gap-2 sm:gap-2 md:gap-3 lg:gap-4">
              {discoverMovies.items.map((movie) => renderMovieCard(movie))}
            </div>
            {discoverMovies.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
                <button
                  onClick={() => {
                    const prevPage = discoverMovies.page - 1;
                    if (prevPage >= 1) {
                      loadDiscoverMovies(prevPage, moviesFilters);
                    }
                  }}
                  disabled={discoverMovies.page === 1 || discoverMovies.loading}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <ChevronLeft size={18} />
                </button>
                {Array.from({ length: Math.min(5, discoverMovies.totalPages) }, (_, i) => {
                  let pageNum;
                  if (discoverMovies.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (discoverMovies.page <= 3) {
                    pageNum = i + 1;
                  } else if (discoverMovies.page >= discoverMovies.totalPages - 2) {
                    pageNum = discoverMovies.totalPages - 4 + i;
                  } else {
                    pageNum = discoverMovies.page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => {
                        loadDiscoverMovies(pageNum, moviesFilters);
                      }}
                      disabled={discoverMovies.loading}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                        discoverMovies.page === pageNum
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
                    const nextPage = discoverMovies.page + 1;
                    if (nextPage <= discoverMovies.totalPages) {
                      loadDiscoverMovies(nextPage, moviesFilters);
                    }
                  }}
                  disabled={discoverMovies.page === discoverMovies.totalPages || discoverMovies.loading}
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
                onClick={() => setMoviesFilters({ sortBy: "popularity.desc", region: "BR", withPoster: true })}
                className="px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 transition-colors min-h-[44px]"
              >
                Limpar filtros
              </button>
              <button
                onClick={() => {
                  const defaultFilters = { sortBy: "popularity.desc", region: "BR", withPoster: true };
                  setMoviesFilters(defaultFilters);
                  loadDiscoverMovies(1, defaultFilters);
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

