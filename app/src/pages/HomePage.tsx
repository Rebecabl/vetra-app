import React from "react";
import { Link } from "react-router-dom";
import { Search, ChevronDown, User } from "lucide-react";
import { HorizontalCarousel } from "../components/HorizontalCarousel";
import { SearchFiltersPanel, SearchFilters, getDefaultFilters } from "../components/SearchFiltersPanel";
import { FilterChips } from "../components/FilterChips";
import { Pagination } from "../components/Pagination";
import { poster } from "../lib/media.utils";
import type { MovieT, UserStateMap, CatState } from "../types/movies";
import type { CatKey } from "../lib/media.utils";
import type { UserProfile } from "../api";

interface HomePageProps {
  // User data
  user: UserProfile | null;
  isLoggedIn: boolean;
  favorites: MovieT[];
  userStates: UserStateMap;
  
  // Search state
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  showSearchFilters: boolean;
  setShowSearchFilters: (show: boolean) => void;
  appliedSearchFilters: SearchFilters;
  handleApplyFilters: (filters: SearchFilters) => void;
  handleClearAllFilters: () => void;
  handleRemoveFilter: (key: string) => void;
  loading: boolean;
  movies: MovieT[];
  people: any[];
  searchTotalResults: number;
  searchPage: number;
  setSearchPage: (page: number) => void;
  hasActiveFilters: boolean;
  setMovies: (movies: MovieT[]) => void;
  setPeople: (people: any[]) => void;
  setSearchTotalResults: (total: number) => void;
  setHasActiveFilters: (has: boolean) => void;
  
  // Home sections
  cats: Record<CatKey, CatState>;
  topRatedMovies: { items: MovieT[]; loading: boolean; error?: string };
  homeSections: {
    recentReleases: { items: MovieT[]; loading: boolean; error?: string };
    comingSoon: { items: MovieT[]; loading: boolean; error?: string };
    popularMovies: { items: MovieT[]; loading: boolean; error?: string };
    byGenre: { items: MovieT[]; loading: boolean; error?: string; genre?: string }[];
  };
  
  // Functions
  runSearch: (term?: string, filters?: SearchFilters, page?: number) => void;
  getPersonalizedRecommendations: () => MovieT[];
  loadTopRatedSection: (page: number, skipIds: Set<string>, forceRefresh?: boolean) => Promise<MovieT[]>;
  loadPopularSection: (page: number, skipIds: Set<string>, forceRefresh?: boolean) => Promise<MovieT[]>;
  normalizeNumber: (value: string) => string;
  snapRating: (value: number) => number;
  snapVotes: (value: number) => number;
  linearToLog: (value: number, min: number, max: number) => number;
  logToLinear: (value: number, min: number, max: number) => number;
  
  // UI state
  useBottomNav: boolean;
  
  // Translation
  t: (key: string, params?: Record<string, any>) => string;
  
  // Render functions
  renderMovieCard: (movie: MovieT) => React.ReactNode;
}

export const HomePage: React.FC<HomePageProps> = ({
  user,
  isLoggedIn,
  favorites,
  userStates,
  searchTerm,
  setSearchTerm,
  showSearchFilters,
  setShowSearchFilters,
  appliedSearchFilters,
  handleApplyFilters,
  handleClearAllFilters,
  handleRemoveFilter,
  loading,
  movies,
  people,
  searchTotalResults,
  searchPage,
  setSearchPage,
  hasActiveFilters,
  setMovies,
  setPeople,
  setSearchTotalResults,
  setHasActiveFilters,
  cats,
  topRatedMovies,
  homeSections,
  runSearch,
  getPersonalizedRecommendations,
  loadTopRatedSection,
  loadPopularSection,
  normalizeNumber,
  snapRating,
  snapVotes,
  linearToLog,
  logToLinear,
  useBottomNav,
  t,
  renderMovieCard,
}) => {
  return (
    <>
      {/* Hero Section - Inspirado no TMDB - Full-bleed */}
      <section className="mb-6 md:mb-8 w-full">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 w-full">
          {cats.trending?.items && cats.trending.items.length > 0 ? (
            <div className="absolute inset-0 overflow-hidden opacity-[0.03] dark:opacity-[0.08]">
              <img
                src={cats.trending.items[0]?.image || poster(cats.trending.items[0]?.poster_path)}
                alt=""
                className="w-full h-full object-cover scale-110"
                style={{ filter: 'blur(60px)' }}
                loading="lazy"
              />
            </div>
          ) : null}
          
          <div className="relative px-6 sm:px-8 md:px-10 lg:px-12 xl:px-16 py-8 md:py-10 lg:py-12">
            <div className="relative z-10 max-w-4xl mx-auto">
              <div className="mb-6 md:mb-8">
                <h2 className="text-[31px] sm:text-[37px] md:text-[43px] font-bold text-slate-900 dark:text-white mb-2 md:mb-3 tracking-tight">
                  {user?.name ? (
                    <>{t("hello")}, <span className="bg-gradient-to-r from-cyan-500 via-purple-500 to-lime-500 bg-clip-text text-transparent">{user.name.split(' ')[0]}</span></>
                  ) : (
                    <>{t("welcome")}.</>
                  )}
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-normal">
                  {user?.name 
                    ? "Este é o seu painel do VETRA para buscar títulos, salvar favoritos e montar listas."
                    : "Encontre e organize seus filmes e séries em um só lugar."
                  }
                </p>
              </div>
              
              <div className="flex flex-col gap-3 max-w-2xl">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex-1 relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                      <Search className="text-slate-400 dark:text-slate-500" size={20} />
                    </div>
                    <input
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (e.target.value.trim() === "") {
                          const defaults = getDefaultFilters();
                          const hasNonDefaultFilters = 
                            appliedSearchFilters.type !== defaults.type ||
                            appliedSearchFilters.sort !== defaults.sort ||
                            appliedSearchFilters.yearGte !== defaults.yearGte ||
                            appliedSearchFilters.yearLte !== defaults.yearLte ||
                            appliedSearchFilters.voteAvgGte > defaults.voteAvgGte ||
                            appliedSearchFilters.voteCntGte > defaults.voteCntGte ||
                            appliedSearchFilters.withPoster !== defaults.withPoster;
                          
                          if (!hasNonDefaultFilters) {
                            setMovies([]);
                            setPeople([]);
                            setSearchTotalResults(0);
                            setHasActiveFilters(false);
                            setSearchPage(1);
                            const params = new URLSearchParams(window.location.search);
                            params.delete("q");
                            params.delete("page");
                            const newURL = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
                            window.history.replaceState({}, "", newURL);
                          }
                        }
                      }}
                      placeholder="Buscar por filme, série ou pessoa..."
                      className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 pl-12 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 focus:border-cyan-500 dark:focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:focus:ring-cyan-400/20 transition-all duration-200 text-base font-normal"
                      style={{ lineHeight: '1.6', minHeight: '48px' }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          runSearch();
                        }
                      }}
                      aria-label="Buscar por filme, série ou pessoa"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                    <button
                      onClick={() => setShowSearchFilters(!showSearchFilters)}
                      className="px-3 sm:px-4 py-3 rounded-lg font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 text-sm sm:text-base whitespace-nowrap min-h-[44px] sm:min-h-[48px] flex items-center justify-center gap-1.5 sm:gap-2"
                    >
                      <ChevronDown className={`transition-transform ${showSearchFilters ? 'rotate-180' : ''}`} size={16} />
                      <span className="hidden min-[361px]:inline">{t("filters")}</span>
                      <span className="min-[361px]:hidden">Filtros</span>
                    </button>
                    <button
                      onClick={() => runSearch()}
                      className="px-4 sm:px-6 py-3 rounded-lg font-semibold text-white bg-slate-700 dark:bg-slate-600 hover:bg-slate-600 dark:hover:bg-slate-500 transition-all duration-200 shadow-md hover:shadow-lg text-sm sm:text-base whitespace-nowrap min-h-[44px] sm:min-h-[48px] border border-slate-600 dark:border-slate-500"
                    >
                      {t("search_button")}
                    </button>
                  </div>
                </div>
                
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Dica: combine filtros por gênero, ano e nota TMDB para refinar os resultados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Search Filters Panel - Outside hero section */}
      <SearchFiltersPanel
        isOpen={showSearchFilters}
        onClose={() => setShowSearchFilters(false)}
        appliedFilters={appliedSearchFilters}
        onApply={handleApplyFilters}
        onClearAll={handleClearAllFilters}
        searchTerm={searchTerm}
        t={t}
        normalizeNumber={normalizeNumber}
        snapRating={snapRating}
        snapVotes={snapVotes}
        linearToLog={linearToLog}
        logToLinear={logToLinear}
      />

      {/* Container para as outras seções */}
      <div className="container mx-auto px-[var(--container-gutter-mobile)] md:px-[var(--container-gutter-desktop)] pb-16 md:pb-24" style={{ scrollMarginTop: useBottomNav ? 'calc(var(--appbar-h-mobile) + max(env(safe-area-inset-top), 0px))' : 'calc(var(--app-header-h) + max(env(safe-area-inset-top), 0px))' }}>
        {/* 1) Recomendados para você - apenas quando não há busca e há sinais do usuário */}
        {!searchTerm && !hasActiveFilters && isLoggedIn && (favorites.length > 0 || Object.keys(userStates).length > 0) && (
          <HorizontalCarousel
            title={t("home.recommended_for_you")}
            items={getPersonalizedRecommendations()}
            loading={false}
            renderItem={renderMovieCard}
            limit={20}
          />
        )}

        {(searchTerm.trim() || hasActiveFilters) ? (
          <section className="mb-6 md:mb-8">
            <div className="flex flex-col gap-3 mb-3 md:mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg md:text-xl font-bold">
                  {searchTerm ? t("empty.no_results_for", { q: searchTerm }) : t("empty.no_results")}
                </h2>
                {!loading && searchTotalResults > 0 && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t("common.showing", { from: ((searchPage - 1) * 20) + 1, to: Math.min(searchPage * 20, searchTotalResults), total: searchTotalResults })}
                  </p>
                )}
              </div>
              <FilterChips
                filters={appliedSearchFilters}
                onRemoveFilter={handleRemoveFilter}
                onClearAll={handleClearAllFilters}
                t={t}
              />
            </div>
            {loading ? (
              <div className="text-center py-6 md:mb-8">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-cyan-500 dark:border-slate-700" />
              </div>
            ) : (
              <>
                {movies.length > 0 && (
                  <>
                    <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">{t("movie.movies_and_series")}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 min-[1201px]:grid-cols-6 gap-2 sm:gap-2 md:gap-3 lg:gap-4 mb-10">
                      {movies.map((m) => renderMovieCard(m))}
                    </div>
                  </>
                )}
                
                {people.length > 0 && (
                  <>
                    <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">{t("nav.people")}</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-2 md:gap-3">
                      {people.map((p: any) => (
                        <Link key={p.id} to={`/person/${p.id}`} className="group">
                          <div className="rounded-xl overflow-hidden bg-white dark:bg-slate-900/70 ring-1 ring-slate-200 dark:ring-white/10 shadow-lg dark:shadow-xl">
                            {p.profile_path ? (
                              <img 
                                src={`https://image.tmdb.org/t/p/w300${p.profile_path}`} 
                                alt={p.name} 
                                className="w-full object-cover object-center" 
                                style={{aspectRatio:"2/3", objectFit: 'cover', objectPosition: 'center top'}} 
                              />
                            ) : (
                              <div className="w-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center" style={{aspectRatio:"2/3"}}>
                                <User size={48} className="text-slate-400 dark:text-gray-600" />
                              </div>
                            )}
                            <div className="p-3 text-slate-900 dark:text-white/90 font-semibold group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{p.name}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
                
                {!loading && movies.length === 0 && people.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-slate-900 dark:text-white text-lg font-semibold mb-2">{t("empty.no_results_filters")}</p>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                      {searchTerm 
                        ? t("empty.no_results_hint")
                        : t("empty.no_results_hint_no_search")}
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                      <button
                        onClick={handleClearAllFilters}
                        className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-all"
                      >
                        {t("filters.clear_all")}
                      </button>
                      <button
                        onClick={() => setShowSearchFilters(true)}
                        className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-all"
                      >
                        {t("empty.edit_filters")}
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Pagination for search results */}
                {!loading && searchTotalResults > 0 && (
                  <Pagination
                    currentPage={searchPage}
                    totalPages={Math.ceil(searchTotalResults / 20)}
                    onPageChange={(page) => {
                      setSearchPage(page);
                      runSearch(searchTerm, appliedSearchFilters, page);
                    }}
                    loading={loading}
                  />
                )}
              </>
            )}
          </section>
        ) : (
          <>
            {/* 2) Mais bem avaliados */}
            <div className="mb-6">
              <div className="mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{t("nav.top_rated")}</h2>
              </div>
              {topRatedMovies.items.length > 0 ? (
                <HorizontalCarousel
                  title=""
                  subtitle=""
                  items={(topRatedMovies.items || []).slice(0, 20)}
                  loading={topRatedMovies.loading}
                  renderItem={renderMovieCard}
                  limit={20}
                  ariaLabel="Carrossel: Mais bem avaliados"
                />
              ) : topRatedMovies.loading ? (
                <div className="text-center py-6" role="status" aria-label="Carregando Mais bem avaliados">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-cyan-500 dark:border-slate-700" />
                </div>
              ) : topRatedMovies.error ? (
                <div className="text-center py-6 bg-slate-100 dark:bg-slate-800 rounded-lg" role="alert">
                  <p className="text-slate-600 dark:text-slate-400 mb-2">Falha ao carregar Mais bem avaliados.</p>
                  <button
                    onClick={() => loadTopRatedSection(1, new Set())}
                    className="text-cyan-600 dark:text-cyan-400 hover:underline min-h-[44px]"
                    aria-label="Recarregar Mais bem avaliados"
                  >
                    Recarregar
                  </button>
                </div>
              ) : (
                <div className="text-center py-6 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <p className="text-slate-600 dark:text-slate-400 mb-2">Não encontramos títulos para esta seção agora.</p>
                  <button
                    onClick={() => loadTopRatedSection(1, new Set())}
                    className="text-cyan-600 dark:text-cyan-400 hover:underline min-h-[44px]"
                    aria-label="Tentar novamente Mais bem avaliados"
                  >
                    Tentar novamente
                  </button>
                </div>
              )}
            </div>

            {/* 3) Populares */}
            <div className="mb-6">
              <div className="mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{t("nav.popular")}</h2>
              </div>
              {homeSections.popularMovies.items.length > 0 ? (
                <HorizontalCarousel
                  title=""
                  subtitle=""
                  items={(homeSections.popularMovies.items || []).slice(0, 20)}
                  loading={homeSections.popularMovies.loading}
                  renderItem={renderMovieCard}
                  limit={20}
                  ariaLabel="Carrossel: Populares"
                />
              ) : homeSections.popularMovies.loading ? (
                <div className="text-center py-6" role="status" aria-label="Carregando Populares">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-cyan-500 dark:border-slate-700" />
                </div>
              ) : homeSections.popularMovies.error ? (
                <div className="text-center py-6 bg-slate-100 dark:bg-slate-800 rounded-lg" role="alert">
                  <p className="text-slate-600 dark:text-slate-400 mb-2">Falha ao carregar Populares.</p>
                  <button
                    onClick={() => loadPopularSection(1, new Set())}
                    className="text-cyan-600 dark:text-cyan-400 hover:underline min-h-[44px]"
                    aria-label="Recarregar Populares"
                  >
                    Recarregar
                  </button>
                </div>
              ) : (
                <div className="text-center py-6 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <p className="text-slate-600 dark:text-slate-400 mb-2">Não encontramos títulos para esta seção agora.</p>
                  <button
                    onClick={() => loadPopularSection(1, new Set())}
                    className="text-cyan-600 dark:text-cyan-400 hover:underline min-h-[44px]"
                    aria-label="Tentar novamente Populares"
                  >
                    Tentar novamente
                  </button>
                </div>
              )}
            </div>

            {/* 4) Lançamentos recentes */}
            {homeSections.recentReleases.items.length > 0 && (
              <HorizontalCarousel
                title={t("home.recent_releases")}
                items={homeSections.recentReleases.items.slice(0, 20)}
                loading={homeSections.recentReleases.loading}
                renderItem={renderMovieCard}
              />
            )}

            {/* 5) Em breve */}
            {homeSections.comingSoon.items.length > 0 && (
              <HorizontalCarousel
                title={t("home.coming_soon")}
                items={homeSections.comingSoon.items.slice(0, 20)}
                loading={homeSections.comingSoon.loading}
                renderItem={renderMovieCard}
              />
            )}

            {/* 6) Por gênero (opcional, rotativo) */}
            {homeSections.byGenre.map((genreSection, idx) => (
              genreSection.items.length > 0 && (
                <HorizontalCarousel
                  key={`genre-${idx}-${genreSection.genre}`}
                  title={genreSection.genre || t("home.by_genre")}
                  items={genreSection.items.slice(0, 15)}
                  loading={genreSection.loading}
                  renderItem={renderMovieCard}
                />
              )
            ))}
          </>
        )}
      </div>
    </>
  );
};

