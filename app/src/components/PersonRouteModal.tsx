import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X, User, Film, Star, Calendar, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import { personDetails as apiPersonDetails, type ApiPersonDetails } from "../api";
import { useLang } from "../i18n";
import { useToast } from "../ui/Toast";
import { formatDate } from "../utils/date";

export const PersonRouteModal: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang } = useLang();
  const { pushToast } = useToast();
  const [person, setPerson] = useState<ApiPersonDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [biographyExpanded, setBiographyExpanded] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const modalRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!id) {
      setPerson(null);
      setLoading(false);
      setError(null);
      return;
    }
    
    let cancelled = false;
    
    (async () => {
      console.log('[PersonRouteModal] Carregando pessoa com ID:', id);
      setLoading(true);
      setError(null);
      setPerson(null); // Resetar pessoa ao mudar ID
      
      try { 
        const p = await apiPersonDetails(parseInt(id), lang);
        if (cancelled) return;
        console.log('[PersonRouteModal] Pessoa carregada:', p);
        setPerson(p);
        setLoading(false);
      } catch (e: any) {
        if (cancelled) return;
        console.error('[PersonRouteModal] Erro ao carregar pessoa:', e);
        setError(e?.message || "Erro ao carregar");
        setLoading(false);
        pushToast({ message: `Erro ao carregar pessoa: ${e?.message || "Falha"}`, tone: "err" });
      }
    })();
    
    return () => {
      cancelled = true;
    };
  }, [id, lang, pushToast]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    if (!loading && person && titleRef.current) {
      titleRef.current.focus();
    }
  }, [loading, person]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate(-1);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [navigate]);

  if (!id) return null;
  
  if (loading) {
    return (
      <div 
        className="fixed inset-0 bg-white dark:bg-slate-900 z-[9999] overflow-y-auto overscroll-contain" 
        role="dialog"
        aria-modal="true"
        aria-label="Carregando pessoa"
      >
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-slate-700 dark:text-gray-300">Carregando…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div 
        className="fixed inset-0 bg-white dark:bg-slate-900 z-[9999] overflow-y-auto overscroll-contain" 
        role="dialog"
        aria-modal="true"
        aria-label="Erro ao carregar pessoa"
      >
        <div className="min-h-screen flex items-center justify-center p-4" onClick={() => navigate(-1)}>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 text-center max-w-md shadow-lg" onClick={(e) => e.stopPropagation()}>
            <p className="text-red-400 mb-4">{error || "Pessoa não encontrada"}</p>
            <button 
              onClick={() => navigate(-1)} 
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition-colors min-h-[44px]"
              aria-label="Fechar"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Person está garantido após os returns condicionais acima
  const getProfileSize = () => {
    if (windowWidth < 480) return 'w185';
    if (windowWidth < 768) return 'w300';
    if (windowWidth < 1024) return 'w500';
    return 'w632';
  };

  const profileSize = getProfileSize();
  const profilePath = person.profile_path 
    ? person.profile_path.replace(/^\/+/, '').replace(/\/+/g, '/')
    : null;
  const profileUrl = profilePath && profilePath.length > 0
    ? `https://image.tmdb.org/t/p/w500/${profilePath}`
    : null;

  const calculateAge = (birthday: string | null | undefined) => {
    if (!birthday) return null;
    try {
      const birth = new Date(birthday);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    } catch {
      return null;
    }
  };

  const cast = person.combined_credits?.cast || [];
  const crew = person.combined_credits?.crew || [];
  const allCredits = [...cast, ...crew].sort((a: any, b: any) => {
    const dateA = a.release_date || a.first_air_date || "";
    const dateB = b.release_date || b.first_air_date || "";
    return dateB.localeCompare(dateA);
  });

  const creditsByYear: Record<string, any[]> = {};
  allCredits.forEach((credit: any) => {
    const year = credit.release_date || credit.first_air_date 
      ? String(credit.release_date || credit.first_air_date).slice(0, 4) 
      : "Sem data";
    if (!creditsByYear[year]) {
      creditsByYear[year] = [];
    }
    creditsByYear[year].push(credit);
  });

  const knownFor = [...cast, ...crew]
    .filter((c: any) => c.vote_average && c.vote_average > 0)
    .sort((a: any, b: any) => (b.vote_average || 0) - (a.vote_average || 0))
    .slice(0, 8);

  const KnownForSection: React.FC<{ items: any[] }> = ({ items }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = useCallback(() => {
      if (!scrollContainerRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }, []);

    useEffect(() => {
      if (items.length === 0) {
        setCanScrollLeft(false);
        setCanScrollRight(false);
        return;
      }

      const timeoutId = setTimeout(() => {
        checkScroll();
        const container = scrollContainerRef.current;
        if (container) {
          container.addEventListener('scroll', checkScroll);
          window.addEventListener('resize', checkScroll);
        }
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        const container = scrollContainerRef.current;
        if (container) {
          container.removeEventListener('scroll', checkScroll);
          window.removeEventListener('resize', checkScroll);
        }
      };
    }, [items, checkScroll]);

    if (items.length === 0) return null;

    const scroll = (direction: 'left' | 'right') => {
      if (!scrollContainerRef.current) return;
      const scrollAmount = 300;
      const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      scrollContainerRef.current.scrollTo({ left: newScrollLeft,       behavior: 'smooth' });
    };

    const getPosterSize = () => {
      if (typeof window === 'undefined') return 'w185';
      const width = window.innerWidth;
      if (width < 480) return 'w185';
      if (width < 768) return 'w342';
      return 'w500';
    };

    return (
      <div className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-3">Conhecido(a) por</h2>
        <div className="relative" style={{ scrollbarGutter: 'stable' }}>
          {/* Seta esquerda */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white dark:hover:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500"
              aria-label="Rolar para a esquerda"
            >
              <ChevronLeft size={20} className="text-slate-900 dark:text-white" />
            </button>
          )}
          {/* Seta direita */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white dark:hover:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500"
              aria-label="Rolar para a direita"
            >
              <ChevronRight size={20} className="text-slate-900 dark:text-white" />
            </button>
          )}
          <div
            ref={scrollContainerRef}
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-2 pb-4 scrollbar-hide"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
            role="region"
            aria-label="Trabalhos conhecidos"
          >
            {items.map((credit: any) => {
              const mediaType = credit.media || credit.media_type || "movie";
              const title = credit.title || credit.name || "Sem título";
              const posterSize = getPosterSize();
              const posterUrl = credit.poster_path 
                ? `https://image.tmdb.org/t/p/${posterSize}${credit.poster_path}`
                : null;
              
              return (
                <button
                  key={`${mediaType}-${credit.id}`}
                  onClick={() => navigate(`/${mediaType}/${credit.id}`)}
                  className="w-36 md:w-40 shrink-0 snap-start text-left group focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 rounded-lg"
                  aria-label={`Ver detalhes de ${title}`}
                >
                  <div 
                    className="relative overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-800 mb-2 transition-transform duration-300 group-hover:scale-105 group-active:scale-95 aspect-[2/3]" 
                  >
                    {posterUrl ? (
                      <img 
                        src={posterUrl}
                        alt={`Poster de ${title}`}
                        className="w-full h-full object-contain md:object-cover md:object-center" 
                        loading="lazy"
                        decoding="async"
                        fetchPriority="low"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-full h-full flex items-center justify-center ${posterUrl ? 'hidden' : ''}`}
                      style={{ aspectRatio: "2/3" }}
                    >
                      <Film size={32} className="text-slate-400 dark:text-slate-600" />
                    </div>
                    {credit.vote_average && credit.vote_average > 0 && (
                      <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-md flex items-center gap-1 text-xs font-semibold">
                        <Star size={12} fill="#FFD700" color="#FFD700" />
                        {credit.vote_average.toFixed(1)}
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white line-clamp-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors px-1">
                    {title}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const biographyLines = person.biography ? person.biography.split('\n').length : 0;
  const needsReadMore = biographyLines > 8 || (person.biography && person.biography.length > 600);
  const biographyPreview = person.biography && needsReadMore && !biographyExpanded
    ? person.biography.slice(0, 600) + '...'
    : person.biography;

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 bg-white dark:bg-slate-900 z-[1100] overflow-y-auto overscroll-contain" 
      onClick={() => navigate(-1)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="person-title"
      style={{ width: '100vw', height: '100dvh' }}
    >
      <div className="min-h-screen bg-white dark:bg-slate-900 overflow-x-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Botão fechar - sempre visível e acessível */}
        <button 
          onClick={() => navigate(-1)} 
          className="fixed top-3 right-3 sm:top-4 sm:right-4 z-[1200] min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-900 dark:text-white p-2.5 rounded-full hover:bg-white dark:hover:bg-slate-800 active:bg-gray-100 dark:active:bg-slate-700 transition-all shadow-lg touch-manipulation focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
          aria-label="Fechar"
        >
          <X size={20} className="sm:w-[22px] sm:h-[22px]" />
        </button>

        {/* Hero - Mobile-first com altura limitada e sem corte - Escondido no desktop */}
        <div className="lg:hidden relative w-full max-w-screen-xl mx-auto px-4 md:px-6 pt-4 md:pt-6">
          <div className="relative w-full aspect-[4/5] md:aspect-[3/4] max-h-[400px] md:max-h-[500px] rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800">
            {profileUrl && profilePath ? (
              <>
                <img 
                  src={profileUrl}
                  alt={`Foto de ${person.name}`}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  loading="eager"
                  decoding="async"
                  onError={(e) => {
                    console.error('[PersonRouteModal] Erro ao carregar imagem no mobile:', profileUrl);
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = document.getElementById(`profile-fallback-mobile-${person.id}`);
                    if (fallback) {
                      fallback.style.display = 'flex';
                      fallback.classList.remove('hidden');
                    }
                  }}
                  onLoad={() => {
                    console.log('[PersonRouteModal] Imagem carregada com sucesso no mobile:', profileUrl);
                  }}
                />
                <div 
                  id={`profile-fallback-mobile-${person.id}`}
                  className="absolute inset-0 w-full h-full flex items-center justify-center hidden bg-slate-200 dark:bg-slate-800 z-0"
                >
                  <div className="text-center">
                    <User size={96} className="text-slate-400 dark:text-slate-600 md:w-[120px] md:h-[120px] mx-auto mb-2" />
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{person.name}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-800 z-0">
                <div className="text-center">
                  <User size={96} className="text-slate-400 dark:text-slate-600 md:w-[120px] md:h-[120px] mx-auto mb-2" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm">{person.name}</p>
                </div>
              </div>
            )}
            
            {/* Gradiente para legibilidade - só aparece quando há imagem */}
            {profileUrl && (
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/70 pointer-events-none z-10" />
            )}
            
            {/* Nome e info no hero */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 pointer-events-none z-20">
              <h1 
                id="person-title"
                ref={titleRef}
                tabIndex={-1}
                className="relative text-white font-semibold mb-2 line-clamp-2 drop-shadow-lg"
                style={{ fontSize: 'clamp(1.25rem, 2.3vw, 2rem)' }}
              >
                {person.name}
              </h1>
              <div className="relative flex flex-wrap items-center gap-2 text-white/90 text-sm md:text-base drop-shadow-md">
                {person.known_for_department && (
                  <span className="bg-white/30 backdrop-blur-sm px-2 py-1 rounded border border-white/40 text-xs md:text-sm font-medium">
                    {person.known_for_department}
                  </span>
                )}
                {person.birthday && (
                  <span className="flex items-center gap-1">
                    <Calendar size={14} className="md:w-4 md:h-4" />
                    <span className="truncate max-w-[200px] md:max-w-none">
                      {formatDate(person.birthday, { day: 'numeric', month: 'long', year: 'numeric' }, lang)}
                      {calculateAge(person.birthday) ? ` (${calculateAge(person.birthday)} anos)` : ""}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo principal - Single column no mobile */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-screen-xl">
          {/* Informações pessoais - Mobile: abaixo do hero, Desktop: sidebar */}
          <div className="mb-6 sm:mb-8 lg:hidden">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 sm:p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4">Informações pessoais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wide opacity-70 text-slate-600 dark:text-slate-400 mb-1">Conhecido(a) por</div>
                  <div className="text-sm md:text-base text-slate-900 dark:text-white font-medium break-words" title={person.known_for_department || "—"}>
                    {person.known_for_department || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide opacity-70 text-slate-600 dark:text-slate-400 mb-1">Creditado(a) em</div>
                  <div className="text-sm md:text-base text-slate-900 dark:text-white font-medium">{allCredits.length}</div>
                </div>
                {person.birthday && (
                  <div>
                    <div className="text-xs uppercase tracking-wide opacity-70 text-slate-600 dark:text-slate-400 mb-1">Nascimento</div>
                    <div className="text-sm md:text-base text-slate-900 dark:text-white font-medium break-words">
                      {formatDate(person.birthday, { day: 'numeric', month: 'long', year: 'numeric' }, lang)}
                      {calculateAge(person.birthday) ? ` (${calculateAge(person.birthday)} anos)` : ""}
                    </div>
                  </div>
                )}
                {person.place_of_birth && (
                  <div className="md:col-span-2">
                    <div className="text-xs uppercase tracking-wide opacity-70 text-slate-600 dark:text-slate-400 mb-1">Local de nascimento</div>
                    <div className="text-sm md:text-base text-slate-900 dark:text-white font-medium break-words" title={person.place_of_birth}>
                      {person.place_of_birth}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Layout desktop: grid com sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Sidebar desktop */}
            <div className="hidden lg:block lg:col-span-4">
              <div className="sticky top-8">
                <div className="mb-6">
                  {profileUrl ? (
                    <div className="relative w-full bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden" style={{ aspectRatio: "2/3" }}>
                      <img 
                        src={profileUrl}
                        alt={`Foto de ${person.name}`}
                        className="w-full h-full rounded-lg shadow-lg object-contain"
                        loading="eager"
                        decoding="async"
                        onError={(e) => {
                          console.error('[PersonRouteModal] Erro ao carregar imagem sidebar:', profileUrl);
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = document.getElementById(`profile-sidebar-fallback-${person.id}`);
                          if (fallback) {
                            fallback.style.display = 'flex';
                            fallback.classList.remove('hidden');
                          }
                        }}
                        onLoad={() => {
                          console.log('[PersonRouteModal] Imagem sidebar carregada com sucesso:', profileUrl);
                        }}
                      />
                      <div 
                        id={`profile-sidebar-fallback-${person.id}`}
                        className="absolute inset-0 w-full h-full flex items-center justify-center hidden"
                        style={{ aspectRatio: "2/3" }}
                      >
                        <div className="text-center">
                          <User size={120} className="text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                          <p className="text-slate-500 dark:text-slate-400 text-sm">{person.name}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center" style={{ aspectRatio: "2/3" }}>
                      <div className="text-center">
                        <User size={120} className="text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm">{person.name}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Informações pessoais</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="text-slate-600 dark:text-slate-400 mb-1">Conhecido(a) por</div>
                      <div className="text-slate-900 dark:text-white font-medium">
                        {person.known_for_department || "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-600 dark:text-slate-400 mb-1">Creditado(a) em</div>
                      <div className="text-slate-900 dark:text-white font-medium">{allCredits.length}</div>
                    </div>
                    {person.birthday ? (
                      <div>
                        <div className="text-slate-600 dark:text-slate-400 mb-1">Nascimento</div>
                        <div className="text-slate-900 dark:text-white font-medium">
                          {formatDate(person.birthday, { day: 'numeric', month: 'long', year: 'numeric' }, lang)}
                          {calculateAge(person.birthday) ? ` (${calculateAge(person.birthday)} anos)` : ""}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-slate-600 dark:text-slate-400 mb-1">Nascimento</div>
                        <div className="text-slate-900 dark:text-white font-medium">—</div>
                      </div>
                    )}
                    {person.place_of_birth ? (
                      <div>
                        <div className="text-slate-600 dark:text-slate-400 mb-1">Local de nascimento</div>
                        <div className="text-slate-900 dark:text-white font-medium">{person.place_of_birth}</div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {/* Conteúdo principal */}
            <div className="lg:col-span-8">
              {/* Título desktop (mobile está no hero) */}
              <div className="hidden lg:block mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  {person.name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-gray-400 text-sm md:text-base">
                  {person.known_for_department ? (
                    <span className="bg-slate-100 dark:bg-slate-700/50 px-3 py-1 rounded-full border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                      {person.known_for_department}
                    </span>
                  ) : null}
                  {person.birthday ? (
                    <span className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>
                        {formatDate(person.birthday, { day: 'numeric', month: 'long', year: 'numeric' }, lang)}
                        {calculateAge(person.birthday) ? ` (${calculateAge(person.birthday)} anos)` : ""}
                      </span>
                    </span>
                  ) : null}
                  {person.place_of_birth ? (
                    <span className="flex items-center gap-2">
                      <Globe size={16} />
                      <span>{person.place_of_birth}</span>
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Biografia com "Ler mais" */}
              {person.biography ? (
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-3">Biografia</h2>
                  <div className="text-slate-700 dark:text-gray-300 leading-relaxed whitespace-pre-line" style={{ fontSize: 'clamp(14px, 3.6vw, 16px)' }}>
                    <p className={needsReadMore && !biographyExpanded ? 'line-clamp-6 sm:line-clamp-8' : ''}>
                      {biographyPreview}
                    </p>
                    {needsReadMore && (
                      <button
                        onClick={() => setBiographyExpanded(!biographyExpanded)}
                        className="mt-2 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 rounded px-2 py-1"
                        aria-expanded={biographyExpanded}
                      >
                        {biographyExpanded ? 'Ler menos' : 'Ler mais'}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-3">Biografia</h2>
                  <p className="text-slate-600 dark:text-gray-400" style={{ fontSize: 'clamp(14px, 3.6vw, 16px)' }}>
                    Não temos uma biografia para {person.name}.
                  </p>
                </div>
              )}

              <KnownForSection items={knownFor} />

              {allCredits.length > 0 && (
                <div className="mb-6 sm:mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Filmografia</h2>
                    <div className="flex gap-2">
                      <select 
                        onChange={(e) => {
                          const filter = e.target.value;
                         
                        }}
                        className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-md px-3 py-1.5 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        aria-label="Filtrar filmografia"
                      >
                        <option value="all">Todos</option>
                        <option value="cast">Atuação</option>
                        <option value="crew">Equipe</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-4 sm:space-y-6">
                    {Object.keys(creditsByYear).sort((a, b) => {
                      if (a === "Sem data") return 1;
                      if (b === "Sem data") return -1;
                      return b.localeCompare(a);
                    }).map((year) => {
                      const yearCredits = creditsByYear[year];
                      if (yearCredits.length === 0) return null;
                      
                      return (
                        <div key={year} className="relative">
                          <div className="absolute left-3 sm:left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500 via-purple-500 to-lime-400 opacity-30" />
                          
                          <div className="flex items-center gap-3 sm:gap-4 mb-3">
                            <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-lg">
                              {year === "Sem data" ? "?" : year.slice(-2)}
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                              {year}
                            </h3>
                            <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                              ({yearCredits.length} {yearCredits.length === 1 ? "trabalho" : "trabalhos"})
                            </span>
                          </div>
                          
                          <div className="ml-10 sm:ml-12 space-y-2 sm:space-y-3">
                            {yearCredits.map((credit: any) => {
                              const mediaType = credit.media || credit.media_type || "movie";
                              const title = credit.title || credit.name || "Sem título";
                              const character = credit.character || null;
                              const job = credit.job || null;
                              const department = credit.department || null;
                              const creditYear = credit.release_date || credit.first_air_date 
                                ? String(credit.release_date || credit.first_air_date).slice(0, 4) 
                                : null;
                              
                              // Tamanho de poster baseado na viewport
                              const posterSize = typeof window !== 'undefined' && window.innerWidth < 480 ? 'w185' : 'w342';
                              const posterUrl = credit.poster_path 
                                ? `https://image.tmdb.org/t/p/${posterSize}${credit.poster_path}`
                                : null;
                              
                              return (
                                <button
                                  key={`${mediaType}-${credit.id}-${credit.character || credit.job || ""}`}
                                  onClick={() => navigate(`/${mediaType}/${credit.id}`)}
                                  className="w-full text-left flex items-start gap-3 p-2 sm:p-3 md:p-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-500 hover:shadow-md transition-all group focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 min-h-[72px] sm:min-h-[88px]"
                                  aria-label={`Ver detalhes de ${title}`}
                                >
                                  <div className="flex-shrink-0 w-14 h-20 sm:w-16 sm:h-24 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700" style={{ aspectRatio: "2/3" }}>
                                    {posterUrl ? (
                                      <img 
                                        src={posterUrl}
                                        alt={`Poster de ${title}`}
                                        className="w-full h-full object-contain sm:object-cover sm:object-center"
                                        loading="lazy"
                                        decoding="async"
                                        fetchPriority="low"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                          const fallback = target.nextElementSibling as HTMLElement;
                                          if (fallback) fallback.style.display = 'flex';
                                        }}
                                      />
                                    ) : null}
                                    <div className={`w-full h-full flex items-center justify-center ${posterUrl ? 'hidden' : ''}`} style={{ aspectRatio: "2/3" }}>
                                      <Film size={20} className="text-slate-400 dark:text-slate-500 sm:w-6 sm:h-6" />
                                    </div>
                                  </div>
                                  
                                  <div className="flex-1 min-w-0 py-1">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                      <div className="flex-1 min-w-0">
                                        <div className="text-slate-900 dark:text-white font-semibold group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-2 text-sm sm:text-base">
                                          {title}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                            {mediaType === "tv" ? "Série" : "Filme"}
                                          </span>
                                          {creditYear && (
                                            <span className="text-xs text-slate-600 dark:text-slate-400">
                                              {creditYear}
                                            </span>
                                          )}
                                          {credit.vote_average && credit.vote_average > 0 && (
                                            <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                              <Star size={12} fill="#FFD700" color="#FFD700" />
                                              {credit.vote_average.toFixed(1)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {character && (
                                      <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-1.5 line-clamp-1">
                                        <span className="font-medium">como</span> {character}
                                      </div>
                                    )}
                                    {job && (
                                      <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-1.5 line-clamp-1">
                                        <span className="font-medium">{job}</span>
                                        {department && department !== job && (
                                          <span className="text-slate-600 dark:text-slate-400"> • {department}</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {crew.length > 0 && (
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">Equipe Técnica</h2>
                  <div className="space-y-2 sm:space-y-3">
                    {crew.slice(0, 20).map((credit: any) => {
                      const mediaType = credit.media || credit.media_type || "movie";
                      const title = credit.title || credit.name || "Sem título";
                      const job = credit.job || null;
                      const posterSize = typeof window !== 'undefined' && window.innerWidth < 480 ? 'w185' : 'w342';
                      const posterUrl = credit.poster_path 
                        ? `https://image.tmdb.org/t/p/${posterSize}${credit.poster_path}`
                        : null;
                      
                      return (
                        <button
                          key={`crew-${mediaType}-${credit.id}-${job}`}
                          onClick={() => navigate(`/${mediaType}/${credit.id}`)}
                          className="w-full text-left flex items-center gap-3 p-2 sm:p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 min-h-[56px] sm:min-h-[64px]"
                          aria-label={`Ver detalhes de ${title}`}
                        >
                          <div className="flex-shrink-0 w-10 h-14 sm:w-12 sm:h-16 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden" style={{ aspectRatio: "2/3" }}>
                            {posterUrl ? (
                              <img 
                                src={posterUrl} 
                                alt={`Poster de ${title}`}
                                className="w-full h-full object-contain sm:object-cover sm:object-center"
                                loading="lazy"
                                decoding="async"
                                fetchPriority="low"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className={`w-full h-full flex items-center justify-center ${posterUrl ? 'hidden' : ''}`} style={{ aspectRatio: "2/3" }}>
                              <Film size={18} className="text-slate-400 dark:text-slate-500 sm:w-5 sm:h-5" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-slate-900 dark:text-white font-medium group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors text-sm sm:text-base line-clamp-1">
                              {title}
                            </div>
                            {job && (
                              <div className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 mt-0.5 line-clamp-1">
                                {job}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonRouteModal;

