import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { getTrending, getCategory, type ApiMovie } from "../api";
import { poster } from "../lib/media.utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  onSignIn: () => void;
  onSignUp: () => void;
};

const LandingScreen: React.FC<Props> = ({ onSignIn, onSignUp }) => {
  const [popularMovies, setPopularMovies] = useState<ApiMovie[]>([]);
  const [popularTv, setPopularTv] = useState<ApiMovie[]>([]);
  const [topRated, setTopRated] = useState<ApiMovie[]>([]);
  const [ctaBackgroundMovies, setCtaBackgroundMovies] = useState<ApiMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const moviesScrollRef = useRef<HTMLDivElement>(null);
  const tvScrollRef = useRef<HTMLDivElement>(null);
  const topRatedScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [movies, tv, top, movies2, tv2, top2, movies3, tv3, top3] = await Promise.all([
          getCategory("movie", "popular", 1),
          getCategory("tv", "popular", 1),
          getCategory("movie", "top_rated", 1),
          getCategory("movie", "popular", 2),
          getCategory("tv", "popular", 2),
          getCategory("movie", "top_rated", 2),
          getCategory("movie", "popular", 3),
          getCategory("tv", "popular", 3),
          getCategory("movie", "top_rated", 3),
        ]);

        if (!mounted) return;

        const ctaMovies = [
          ...(movies?.results || []),
          ...(tv?.results || []),
          ...(top?.results || []),
          ...(movies2?.results || []),
          ...(tv2?.results || []),
          ...(top2?.results || []),
          ...(movies3?.results || []),
          ...(tv3?.results || []),
          ...(top3?.results || []),
        ].filter((m) => m.poster_path);

        const uniqueCtaMovies = Array.from(
          new Map(ctaMovies.map((m) => [m.id, m])).values()
        );
        
        const finalCtaMovies = uniqueCtaMovies.length >= 80 
          ? uniqueCtaMovies.slice(0, 80)
          : uniqueCtaMovies.length >= 60
          ? uniqueCtaMovies.slice(0, 60)
          : [...uniqueCtaMovies, ...uniqueCtaMovies.slice(0, 60 - uniqueCtaMovies.length)].slice(0, 60);

        setCtaBackgroundMovies(finalCtaMovies);
        setPopularMovies((movies?.results || []).slice(0, 20));
        setPopularTv((tv?.results || []).slice(0, 20));
        setTopRated((top?.results || []).slice(0, 20));
      } catch (error) {
        // Silenciosamente trata erros - a landing page funciona mesmo sem backend
        // (usa TMDB diretamente como fallback)
        console.warn("Erro ao carregar conteúdo da landing (pode ser normal se backend não estiver rodando):", error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  return (
    <div className="min-h-screen bg-[#0a0e27] text-white flex flex-col">
      {/* Header Moderno */}
      <header className="relative z-50 w-full border-b border-white/10 bg-[#0a0e27]/95 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 group cursor-pointer">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true" className="group-hover:scale-110 transition-transform duration-300">
              <path d="M8 8 L8 32 L20 20 Z" fill="#22D3EE" />
              <path d="M12 12 L12 28 L24 20 Z" fill="#8B5CF6" />
              <path d="M16 8 L32 20 L16 32 Z" fill="#A3E635" />
            </svg>
              <span className="text-2xl font-extrabold text-white tracking-tight group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:via-purple-400 group-hover:to-lime-400 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
              VETRA
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onSignUp}
            className="text-sm font-semibold text-white hover:text-white/80 transition-all duration-200"
          >
            Fazer Login
          </button>
        </div>
        </div>
      </header>

      {/* Hero Section - Estilo Cinematográfico */}
      <main className="flex-grow relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Background - Gradiente estático */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-[#0a0e27]" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1a1f3a] via-[#1e293b] to-[#0a0e27]" />
          <div 
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 60% 50% at 20% 20%, rgba(34, 211, 238, 0.15) 0%, transparent 60%)`
            }}
          />
          <div 
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 70% 60% at 80% 80%, rgba(139, 92, 246, 0.12) 0%, transparent 70%)`
            }}
          />
          
          {/* Overlay escuro para legibilidade */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e27] via-[#0a0e27]/70 to-[#0a0e27]/30 z-20" />
        </div>
        
        {/* Conteúdo Principal - Hero Section Centralizado */}
        <div className="relative z-30 w-full px-3 sm:px-4 lg:px-6 pt-8 sm:pt-12 lg:pt-16 pb-6 lg:pb-8">
          <div className="text-center max-w-5xl mx-auto">
            {/* Título Principal */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-[75px] font-bold tracking-tight mb-4 lg:mb-5 leading-tight">
              <div className="block mb-2">
                <span>Descubra, </span>
                <span>Organize,</span>
              </div>
              <div className="block">
                <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-lime-400 bg-clip-text text-transparent">
                  Compartilhe.
                </span>
              </div>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-white/90 mb-8 lg:mb-10 max-w-2xl mx-auto leading-relaxed px-4 font-light">
              A forma mais inteligente de organizar seus filmes e séries favoritos. Explore, salve e compartilhe com quem você ama.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={onSignUp}
                className="px-6 py-2.5 bg-white text-[#0a0e27] font-semibold text-sm rounded-md hover:bg-white/90 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                COMEÇAR AGORA
              </button>
              <button
                onClick={onSignIn}
                className="px-6 py-2.5 bg-transparent border border-white/60 text-white font-semibold text-sm rounded-md hover:border-white/80 hover:bg-white/5 transition-all duration-200"
              >
                ENTRAR
              </button>
            </div>
          </div>
        </div>
      </main>

      <div className="relative z-10 w-full px-3 sm:px-4 lg:px-6 pb-8 space-y-6 lg:space-y-8">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                <p className="text-white/60 text-sm">Carregando conteúdo...</p>
              </div>
            </div>
          )}

          {!loading && popularMovies.length > 0 && (
            <section className="mt-6 sm:mt-8 lg:mt-12">
              <div className="mb-4 sm:mb-5 lg:mb-7 flex items-center gap-2 sm:gap-3">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  Filmes populares
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent"></div>
              </div>
              <div className="relative group">
                <div 
                  ref={moviesScrollRef}
                  className="flex gap-2 sm:gap-3 md:gap-4 lg:gap-6 overflow-x-auto scroll-smooth px-2 sm:px-3 md:px-4 lg:px-6 -mx-2 sm:-mx-3 md:-mx-4 lg:-mx-6"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
                >
                  {popularMovies.map((item) => (
                    <div
                      key={item.id}
                      className="group/item cursor-pointer flex-shrink-0 w-[120px] xs:w-[140px] sm:w-[160px] md:w-[200px] lg:w-[220px]"
                      onClick={onSignUp}
                    >
                      <div className="relative aspect-[2/3] rounded-lg sm:rounded-xl overflow-hidden bg-slate-800/50 shadow-xl group-active/item:shadow-2xl group-active/item:shadow-cyan-500/30 transition-all duration-500 group-active/item:scale-105 border border-white/5 group-active/item:border-white/20">
                        {item.poster_path ? (
                          <img
                            src={poster(item.poster_path, "w500")}
                            alt={item.title || item.name || ""}
                            className="w-full h-full object-cover transition-transform duration-700 group-active/item:scale-110"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/30 bg-slate-800">
                            <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-active/item:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 transform translate-y-full group-active/item:translate-y-0 transition-transform duration-300">
                          <p className="text-white text-xs sm:text-sm font-semibold line-clamp-2">{item.title || item.name}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    if (moviesScrollRef.current) {
                      moviesScrollRef.current.scrollBy({ left: 250, behavior: 'smooth' });
                    }
                  }}
                  className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/70 active:bg-black/90 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white transition-all shadow-lg touch-manipulation"
                  aria-label="Próximo"
                >
                  <ChevronRight size={16} className="sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => {
                    if (moviesScrollRef.current) {
                      moviesScrollRef.current.scrollBy({ left: -250, behavior: 'smooth' });
                    }
                  }}
                  className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/70 active:bg-black/90 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white transition-all shadow-lg touch-manipulation"
                  aria-label="Anterior"
                >
                  <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
                </button>
              </div>
            </section>
          )}

          {!loading && (
            <div className="my-10 lg:my-14 py-6 lg:py-8">
              <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 lg:gap-8">
                  {/* 10K+ Filmes e Séries */}
                  <div className="group relative flex flex-col items-center text-center p-5 lg:p-6 bg-gradient-to-br from-white/5 via-white/5 to-white/0 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-cyan-400/50 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/25 hover:scale-[1.03] hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/15 group-hover:to-transparent rounded-2xl transition-all duration-500" />
                    <div className="relative z-10 w-full">
                      <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                        10K+
                      </div>
                      <div className="text-sm sm:text-base text-white/90 font-medium group-hover:text-white transition-colors duration-300">
                        Filmes e Séries
                      </div>
                    </div>
                  </div>

                  {/* Compartilhamento Ilimitado */}
                  <div className="group relative flex flex-col items-center text-center p-5 lg:p-6 bg-gradient-to-br from-white/5 via-white/5 to-white/0 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-purple-400/50 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/25 hover:scale-[1.03] hover:-translate-y-1">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-14 lg:h-16 w-px bg-gradient-to-b from-transparent via-white/25 to-transparent hidden sm:block" />
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/0 group-hover:from-purple-500/15 group-hover:to-transparent rounded-2xl transition-all duration-500" />
                    <div className="relative z-10 w-full">
                      <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-purple-400 via-purple-300 to-purple-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                        ∞
                      </div>
                      <div className="text-sm sm:text-base text-white/90 font-medium group-hover:text-white transition-colors duration-300">
                        Compartilhamentos
                      </div>
                    </div>
                  </div>

                  {/* 100% Gratuito */}
                  <div className="group relative flex flex-col items-center text-center p-5 lg:p-6 bg-gradient-to-br from-white/5 via-white/5 to-white/0 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-lime-400/50 transition-all duration-500 hover:shadow-2xl hover:shadow-lime-500/25 hover:scale-[1.03] hover:-translate-y-1">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-14 lg:h-16 w-px bg-gradient-to-b from-transparent via-white/25 to-transparent hidden sm:block" />
                    <div className="absolute inset-0 bg-gradient-to-br from-lime-400/0 to-lime-400/0 group-hover:from-lime-400/15 group-hover:to-transparent rounded-2xl transition-all duration-500" />
                    <div className="relative z-10 w-full">
                      <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-lime-400 via-lime-300 to-lime-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                        100%
                      </div>
                      <div className="text-sm sm:text-base text-white/90 font-medium group-hover:text-white transition-colors duration-300">
                        Gratuito
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loading && popularTv.length > 0 && (
            <section className="mt-6 sm:mt-8 lg:mt-12">
              <div className="mb-4 sm:mb-5 lg:mb-7 flex items-center gap-2 sm:gap-3">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  Séries populares
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent"></div>
              </div>
              <div className="relative group">
                <div 
                  ref={tvScrollRef}
                  className="flex gap-2 sm:gap-3 md:gap-4 lg:gap-6 overflow-x-auto scroll-smooth px-2 sm:px-3 md:px-4 lg:px-6 -mx-2 sm:-mx-3 md:-mx-4 lg:-mx-6"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
                >
                  {popularTv.map((item) => (
                    <div
                      key={item.id}
                      className="group/item cursor-pointer flex-shrink-0 w-[120px] xs:w-[140px] sm:w-[160px] md:w-[200px] lg:w-[220px]"
                      onClick={onSignUp}
                    >
                      <div className="relative aspect-[2/3] rounded-lg sm:rounded-xl overflow-hidden bg-slate-800/50 shadow-xl group-active/item:shadow-2xl group-active/item:shadow-cyan-500/30 transition-all duration-500 group-active/item:scale-105 border border-white/5 group-active/item:border-white/20">
                        {item.poster_path ? (
                          <img
                            src={poster(item.poster_path, "w500")}
                            alt={item.title || item.name || ""}
                            className="w-full h-full object-cover transition-transform duration-700 group-active/item:scale-110"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/30 bg-slate-800">
                            <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-active/item:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 transform translate-y-full group-active/item:translate-y-0 transition-transform duration-300">
                          <p className="text-white text-xs sm:text-sm font-semibold line-clamp-2">{item.title || item.name}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    if (tvScrollRef.current) {
                      tvScrollRef.current.scrollBy({ left: -250, behavior: 'smooth' });
                    }
                  }}
                  className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/70 active:bg-black/90 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white transition-all shadow-lg touch-manipulation"
                  aria-label="Anterior"
                >
                  <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => {
                    if (tvScrollRef.current) {
                      tvScrollRef.current.scrollBy({ left: 250, behavior: 'smooth' });
                    }
                  }}
                  className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/70 active:bg-black/90 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white transition-all shadow-lg touch-manipulation"
                  aria-label="Próximo"
                >
                  <ChevronRight size={16} className="sm:w-5 sm:h-5" />
                </button>
              </div>
            </section>
          )}

          {!loading && topRated.length > 0 && (
            <section className="mt-6 sm:mt-8 lg:mt-12">
              <div className="mb-4 sm:mb-5 lg:mb-7 flex items-center gap-2 sm:gap-3">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  Mais bem avaliados
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent"></div>
              </div>
              <div className="relative group">
                <div 
                  ref={topRatedScrollRef}
                  className="flex gap-2 sm:gap-3 md:gap-4 lg:gap-6 overflow-x-auto scroll-smooth px-2 sm:px-3 md:px-4 lg:px-6 -mx-2 sm:-mx-3 md:-mx-4 lg:-mx-6"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
                >
                  {topRated.map((item) => (
                    <div
                      key={item.id}
                      className="group/item cursor-pointer flex-shrink-0 w-[120px] xs:w-[140px] sm:w-[160px] md:w-[200px] lg:w-[220px]"
                      onClick={onSignUp}
                    >
                      <div className="relative aspect-[2/3] rounded-lg sm:rounded-xl overflow-hidden bg-slate-800/50 shadow-xl group-active/item:shadow-2xl group-active/item:shadow-cyan-500/30 transition-all duration-500 group-active/item:scale-105 border border-white/5 group-active/item:border-white/20">
                        {item.poster_path ? (
                          <img
                            src={poster(item.poster_path, "w500")}
                            alt={item.title || item.name || ""}
                            className="w-full h-full object-cover transition-transform duration-700 group-active/item:scale-110"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/30 bg-slate-800">
                            <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-active/item:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 transform translate-y-full group-active/item:translate-y-0 transition-transform duration-300">
                          <p className="text-white text-xs sm:text-sm font-semibold line-clamp-2">{item.title || item.name}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    if (topRatedScrollRef.current) {
                      topRatedScrollRef.current.scrollBy({ left: 250, behavior: 'smooth' });
                    }
                  }}
                  className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/70 active:bg-black/90 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white transition-all shadow-lg touch-manipulation"
                  aria-label="Próximo"
                >
                  <ChevronRight size={16} className="sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => {
                    if (topRatedScrollRef.current) {
                      topRatedScrollRef.current.scrollBy({ left: -250, behavior: 'smooth' });
                    }
                  }}
                  className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/70 active:bg-black/90 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white transition-all shadow-lg touch-manipulation"
                  aria-label="Anterior"
                >
                  <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
                </button>
              </div>
            </section>
          )}

          <section className="relative text-center py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden min-h-[300px] sm:min-h-[400px]">
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-[#0a0e27]" />
              
              {ctaBackgroundMovies.length > 0 && (
                <div className="absolute inset-0 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-14 xl:grid-cols-18 2xl:grid-cols-24 gap-0 p-0 overflow-hidden">
                  {ctaBackgroundMovies.map((movie, index) => {
                    const rotation = (Math.random() - 0.5) * 3;
                    const scale = 0.95 + Math.random() * 0.1;
                    const xOffset = (Math.random() - 0.5) * 8;
                    const yOffset = (Math.random() - 0.5) * 8;
                    
                    return (
                      <div
                        key={`cta-bg-${movie.id}-${index}`}
                        className="relative aspect-[2/3] overflow-hidden"
                        style={{
                          transform: `rotate(${rotation}deg) scale(${scale}) translate(${xOffset}px, ${yOffset}px)`,
                          filter: 'grayscale(30%) brightness(0.6) contrast(1) saturate(0.9)',
                          opacity: 0.85,
                        }}
                      >
                        {movie.poster_path ? (
                          <img
                            src={poster(movie.poster_path, "w342")}
                            alt={movie.title || movie.name || ""}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
              
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-[#0a0e27] via-[#0a0e27]/90 via-[#0a0e27]/70 via-[#0a0e27]/40 via-[#0a0e27]/20 to-transparent h-24 sm:h-32 pointer-events-none z-10" />
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-[#0a0e27]/15 to-transparent h-32 sm:h-48 pointer-events-none z-10" />
              
              <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#0a0e27] via-[#0a0e27]/90 via-[#0a0e27]/70 via-[#0a0e27]/40 via-[#0a0e27]/20 to-transparent w-16 sm:w-32 pointer-events-none z-10" />
              <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#0a0e27]/15 to-transparent w-24 sm:w-48 pointer-events-none z-10" />
              
              <div className="absolute top-0 bottom-0 right-0 bg-gradient-to-l from-[#0a0e27] via-[#0a0e27]/90 via-[#0a0e27]/70 via-[#0a0e27]/40 via-[#0a0e27]/20 to-transparent w-16 sm:w-32 pointer-events-none z-10" />
              <div className="absolute top-0 bottom-0 right-0 bg-gradient-to-l from-[#0a0e27]/15 to-transparent w-24 sm:w-48 pointer-events-none z-10" />
              
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0e27] via-[#0a0e27]/90 via-[#0a0e27]/70 via-[#0a0e27]/40 via-[#0a0e27]/20 to-transparent h-24 sm:h-32 pointer-events-none z-10" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0e27]/15 to-transparent h-32 sm:h-48 pointer-events-none z-10" />
              
              <div className="absolute inset-0 pointer-events-none z-10" 
                style={{
                  background: 'radial-gradient(ellipse 60% 45% at center, transparent 0%, transparent 30%, rgba(10, 14, 39, 0.25) 50%, rgba(10, 14, 39, 0.4) 100%)'
                }}
              />
              
              <div className="absolute inset-0 bg-[#0a0e27]/15 pointer-events-none z-10" />
          </div>

            <div className="relative z-20 flex items-center justify-center min-h-[300px] sm:min-h-[400px] md:min-h-[450px] px-3 sm:px-4 md:px-6">
              <div className="w-full max-w-3xl">
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 lg:p-14 border border-white/30 shadow-2xl mx-2 sm:mx-0">
                  <div className="text-center mb-4 sm:mb-6">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-center text-white tracking-tight">
                      Pronto para começar?
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl text-white/95 mb-2 text-center leading-relaxed font-light px-2">
                      Junte-se a milhares de usuários organizando seus favoritos.
                    </p>
                    <p className="text-xs sm:text-sm text-white/70 mb-4 sm:mb-6 px-2">
                      Cadastro rápido • Sem anúncios • 100% gratuito
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-2">
                    <button
                      onClick={onSignUp}
                      className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white text-[#0a0e27] font-bold text-sm sm:text-base rounded-xl hover:bg-white/95 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-100"
                    >
                      Criar conta gratuita
                    </button>
                    <button
                      onClick={onSignIn}
                      className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-transparent border-2 border-white/50 text-white font-semibold text-sm sm:text-base rounded-xl hover:border-white/70 hover:bg-white/15 transition-all duration-200"
                    >
                      Já tenho uma conta
                    </button>
                  </div>
                </div>
              </div>
          </div>
          </section>
        </div>

      {/* Footer Simples e Limpo */}
      <footer className="relative z-10 border-t border-white/10 bg-[#0a0e27]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div className="flex items-center gap-2.5">
              <svg width="32" height="32" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <path d="M8 8 L8 32 L20 20 Z" fill="#22D3EE" />
                <path d="M12 12 L12 28 L24 20 Z" fill="#8B5CF6" />
                <path d="M16 8 L32 20 L16 32 Z" fill="#A3E635" />
              </svg>
              <span className="text-xl font-bold text-white">VETRA</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-white/60">
              <Link to="/about" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded px-2 py-1">
                Sobre o VETRA
              </Link>
              <Link to="/privacy" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded px-2 py-1">
                Política de Privacidade
              </Link>
              <Link to="/terms" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded px-2 py-1">
                Termos de Uso
              </Link>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-6 border-t border-white/5">
            <p className="text-sm text-white/50 text-center md:text-left">
              © {new Date().getFullYear()} VETRA. Todos os direitos reservados.
            </p>
            <p className="text-xs text-white/40 text-center md:text-right">
              Dados fornecidos por{" "}
              <a 
                href="https://www.themoviedb.org/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white/60 hover:text-white transition-colors underline"
              >
                TMDB
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* Botão Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 bg-slate-700/80 hover:bg-slate-600/90 backdrop-blur-sm border border-slate-600/50 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl"
          aria-label="Voltar ao topo"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default LandingScreen;
