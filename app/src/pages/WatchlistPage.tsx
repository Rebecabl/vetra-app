import React from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Share2, Star, Bookmark } from "lucide-react";
import { poster, toPosterPath, type CatKey } from "../lib/media.utils";
import { mediaKey } from "../types/movies";
import type { MovieT, UserState, UserStateMap, MediaT, CatState, TabKey, UserList } from "../types/movies";
import api from "../api";

interface WatchlistPageProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  userStates: UserStateMap;
  setUserStates: React.Dispatch<React.SetStateAction<UserStateMap>>;
  favorites: MovieT[];
  watchHistory: Array<{ movie: MovieT; watchedAt: string }>;
  lists: UserList[];
  cats: Record<CatKey, CatState>;
  viewingShared: boolean;
  setConfirmModal: (modal: { show: boolean; message: string; onConfirm: () => void }) => void;
  pushToast: (toast: { message: string; tone: "ok" | "err" | "info" | "warn" }) => void;
  setShareSlug: (slug: string) => void;
  setShowShare: (show: boolean) => void;
  removeFromWatchHistory: (movie: MovieT) => void;
  setRatingFor: (movie: MovieT, rating: number | undefined) => void;
  setDescriptionFor: (movie: MovieT, description: string) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export const WatchlistPage: React.FC<WatchlistPageProps> = ({
  activeTab,
  setActiveTab,
  userStates,
  setUserStates,
  favorites,
  watchHistory,
  lists,
  cats,
  viewingShared,
  setConfirmModal,
  pushToast,
  setShareSlug,
  setShowShare,
  removeFromWatchHistory,
  setRatingFor,
  setDescriptionFor,
  t,
}) => {
  const navigate = useNavigate();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">{t("collections")}</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">{t("organize_by_status")}</p>
          </div>
          <div className="flex items-center gap-3">
            {(() => {
              const currentState = activeTab === "watchlist" ? "want" : (activeTab.startsWith("watchlist-") ? activeTab.replace("watchlist-", "") : "want") as UserState;
              const stateLabels = { want: "Quero assistir", watched: "Assisti", not_watched: "Não assisti", abandoned: "Abandonei" };
              const itemsCount = Object.entries(userStates).filter(([_, meta]) => meta.state === currentState).length;
              
              if (itemsCount > 0) {
                return (
                  <button
                    onClick={() => {
                      setConfirmModal({
                        show: true,
                        message: `Tem certeza que deseja remover todos os itens de "${stateLabels[currentState]}"?`,
                        onConfirm: () => {
                          const keysToRemove = Object.entries(userStates)
                            .filter(([_, meta]) => meta.state === currentState)
                            .map(([key]) => key);
                          
                          setUserStates((prev) => {
                            const updated = { ...prev };
                            keysToRemove.forEach(key => {
                              const meta = updated[key];
                              if (meta?.state === "watched") {
                                // Se estava marcado como assistido, remover do histórico também
                                removeFromWatchHistory({ id: Number(key.split(":")[1]), media: (key.split(":")[0] || "movie") as MediaT } as MovieT);
                              }
                              delete updated[key];
                            });
                            return updated;
                          });
                          
                          pushToast({ message: `Todos os itens de "${stateLabels[currentState]}" foram removidos`, tone: "ok" });
                          setConfirmModal({ show: false, message: "", onConfirm: () => {} });
                        }
                      });
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 dark:bg-rose-700 hover:bg-rose-700 dark:hover:bg-rose-800 text-white text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg border border-rose-700 dark:border-rose-800"
                    title="Limpar coleção"
                  >
                    <Trash2 size={16} />
                    Limpar
                  </button>
                );
              }
              return null;
            })()}
            <button
              onClick={async () => {
                try {
                  const currentState = activeTab === "watchlist" ? "want" : (activeTab.startsWith("watchlist-") ? activeTab.replace("watchlist-", "") : "want") as UserState;
                  const stateLabels = { want: "Quero assistir", watched: "Assisti", not_watched: "Não assisti", abandoned: "Abandonei" };
                  
                  // Buscar itens com todas as fontes disponíveis
                  const allMovies = [
                    ...favorites,
                    ...watchHistory.map(h => h.movie),
                    ...(cats.trending?.items || []),
                    ...(cats.popular?.items || []),
                    ...(cats.top_rated?.items || []),
                    ...(cats.now_playing?.items || []),
                    ...(cats.upcoming?.items || []),
                  ];
                  
                  const itemsWithMeta = Object.entries(userStates)
                    .filter(([_, meta]) => meta.state === currentState)
                    .map(([key, meta]) => {
                      const [media, idStr] = key.split(":");
                      const id = Number(idStr);
                      const mediaType = (media || "movie") as MediaT;
                      
                      // Buscar em todas as fontes
                      let found = allMovies.find(
                        m => m.id === id && (m.media || "movie") === mediaType
                      );
                      
                      // Se não encontrou, buscar nas listas
                      if (!found) {
                        for (const list of lists) {
                          found = list.items.find(
                            m => m.id === id && (m.media || "movie") === mediaType
                          );
                          if (found) break;
                        }
                      }
                      
                      // Se ainda não encontrou, usar cache
                      if (!found && meta.movieCache) {
                        found = {
                          id,
                          media: meta.movieCache.media || mediaType,
                          title: meta.movieCache.title,
                          image: meta.movieCache.image || "",
                          poster_path: meta.movieCache.poster_path || null,
                          year: meta.movieCache.year || null,
                          rating: null,
                          voteCount: null,
                          overview: ""
                        };
                      }
                      
                      if (!found) return null;
                      
                      return {
                        movie: { ...found, media: mediaType },
                        meta
                      };
                    })
                    .filter((item) => item !== null) as Array<{ movie: MovieT; meta: { state?: UserState; rating?: number; description?: string } }>;
                  
                  if (itemsWithMeta.length === 0) {
                    pushToast({ message: "Não há itens para compartilhar nesta coleção.", tone: "warn" });
                    return;
                  }
                  
                  // Preparar payload com nota e descrição
                  const payload = itemsWithMeta.map(({ movie, meta }) => ({
                    id: movie.id,
                    media: movie.media || "movie",
                    title: movie.title,
                    poster_path: movie.poster_path ?? toPosterPath(movie.image),
                    vote_average: meta.rating ?? null,
                    vote_count: movie.voteCount ?? null,
                    release_date: movie.year ? `${movie.year}-01-01` : null,
                    first_air_date: null,
                    overview: meta.description || movie.overview || "",
                    // Campos customizados para coleções
                    user_rating: meta.rating ?? null,
                    user_description: meta.description || null,
                  }));
                  
                  console.log("[shareCollection] Criando compartilhamento:", { itemsCount: payload.length, type: 'collection', category: stateLabels[currentState] });
                  const resp = await api.shareCreate(payload, 'collection', stateLabels[currentState]);
                  
                  if (!resp || !resp.slug) {
                    throw new Error("Resposta inválida do servidor");
                  }
                  
                  setShareSlug(resp.slug || (resp.code ? resp.code.replace(/V9-|-/g, "").slice(0, 10) : ""));
                  setShowShare(true);
                } catch (e: any) {
                  console.error("[shareCollection] Erro ao compartilhar:", e);
                  const errorMsg = e?.message?.includes("listId_obrigatorio") 
                    ? "Erro ao gerar link. Tente novamente." 
                    : (e?.message || "Erro ao compartilhar coleção");
                  pushToast({ message: errorMsg, tone: "err" });
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 dark:bg-slate-600 hover:bg-slate-600 dark:hover:bg-slate-500 text-white text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg border border-slate-600 dark:border-slate-500"
            >
              <Share2 size={16} />
              Compartilhar
            </button>
          </div>
        </div>
      </div>
    
      {/* Abas */}
      <div className="flex flex-wrap gap-3 mb-8 border-b-2 border-slate-200 dark:border-slate-800 pb-1">
        {(["want", "watched", "not_watched", "abandoned"] as const).map((state) => {
          const stateLabels = { want: "Quero ver", watched: "Assisti", not_watched: "Não assisti", abandoned: "Abandonei" };
          const items = Object.entries(userStates)
            .filter(([_, meta]) => meta.state === state)
            .map(([key]) => {
              const [media, idStr] = key.split(":");
              const id = Number(idStr);
              // Buscar em todas as fontes disponíveis
              const allMovies = [
                ...favorites,
                ...watchHistory.map(h => h.movie),
                ...(cats.trending?.items || []),
                ...(cats.popular?.items || []),
                ...(cats.top_rated?.items || []),
                ...(cats.now_playing?.items || []),
                ...(cats.upcoming?.items || []),
              ];
              
              let found = allMovies.find(
                m => m.id === id && (m.media || "movie") === (media || "movie")
              );
              
              // Se não encontrou, buscar nas listas do usuário
              if (!found) {
                for (const list of lists) {
                  found = list.items.find(
                    m => m.id === id && (m.media || "movie") === (media || "movie")
                  );
                  if (found) break;
                }
              }
              
              return found ? { ...found, media: (media || "movie") as MediaT } : null;
            })
            .filter((m) => m !== null);
        
          const isActive = activeTab === `watchlist-${state}` || (activeTab === "watchlist" && state === "want");
          
          return (
            <button
              key={state}
              onClick={() => setActiveTab(`watchlist-${state}` as TabKey)}
              className={`relative px-6 py-3 rounded-t-xl font-semibold text-sm transition-all duration-200 ${
                isActive
                  ? "bg-slate-700 dark:bg-slate-600 text-white shadow-lg"
                  : "bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
              }`}
            >
              <span className="flex items-center gap-2">
                {stateLabels[state]}
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  isActive 
                    ? "bg-white/20 text-white" 
                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                }`}>
                  {items.length}
                </span>
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 dark:bg-cyan-400 rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Conteúdo das abas */}
      {(() => {
        const currentState = activeTab === "watchlist" ? "want" : (activeTab.startsWith("watchlist-") ? activeTab.replace("watchlist-", "") : "want") as UserState;
        const stateLabels = { want: "Quero ver", watched: "Assisti", not_watched: "Não assisti", abandoned: "Abandonei" };
        const items = Object.entries(userStates)
          .filter(([_, meta]) => meta.state === currentState)
          .map(([key, meta]) => {
            const [media, idStr] = key.split(":");
            const id = Number(idStr);
            const mediaType = (media || "movie") as MediaT;
            
            // Buscar em todas as fontes disponíveis
            const allMovies = [
              ...favorites,
              ...watchHistory.map(h => h.movie),
              ...(cats.trending?.items || []),
              ...(cats.popular?.items || []),
              ...(cats.top_rated?.items || []),
              ...(cats.now_playing?.items || []),
              ...(cats.upcoming?.items || []),
            ];
            
            let found = allMovies.find(
              m => m.id === id && (m.media || "movie") === mediaType
            );
            
            // Se não encontrou, buscar nas listas do usuário
            if (!found) {
              for (const list of lists) {
                found = list.items.find(
                  m => m.id === id && (m.media || "movie") === mediaType
                );
                if (found) break;
              }
            }
            
            // Se ainda não encontrou, usar o cache salvo ou criar um objeto básico
            if (!found) {
              const cached = meta.movieCache;
              if (cached) {
                found = {
                  id,
                  media: cached.media || mediaType,
                  title: cached.title || `Item ${id}`,
                  image: cached.image || "",
                  poster_path: cached.poster_path || null,
                  year: cached.year || null,
                  rating: null,
                  voteCount: null,
                  overview: ""
                };
              } else {
                found = {
                  id,
                  media: mediaType,
                  title: `Item ${id}`,
                  image: "",
                  poster_path: null,
                  year: null,
                  rating: null,
                  voteCount: null,
                  overview: ""
                };
              }
            }
            
            return { movie: { ...found, media: mediaType }, meta };
          })
          .filter((item) => item !== null)
          .sort((a, b) => (b.meta.rating || 0) - (a.meta.rating || 0)); // Ordenar por nota (maior primeiro)

        if (items.length === 0) {
          return (
            <div className="text-center py-16 md:py-20 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 mb-6">
                <Bookmark size={40} className="text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Nenhum item em "{stateLabels[currentState]}"</h3>
              <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">{t("add_movies_hint")}</p>
            </div>
          );
        }

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map(({ movie, meta }, idx) => (
              <div key={`${movie.media}-${movie.id}`} className="group animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  {/* Poster */}
                  <div className="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900">
                    <img
                      src={poster(movie.poster_path || movie.image, "w500")}
                      alt={movie.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Badge de nota */}
                    {meta.rating !== undefined && (
                      <div className="absolute top-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-lg">
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-slate-900 dark:text-white font-bold text-sm">{meta.rating}/10</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Conteúdo */}
                  <div className="p-5">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {movie.title}
                    </h3>
                    
                    <div className="flex items-center gap-3 mb-4">
                      {movie.year && (
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                          {movie.year}
                        </span>
                      )}
                    </div>
                    
                    {/* Campo de nota */}
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Minha nota
                      </label>
                      <div className="flex items-center gap-2">
                        <Star size={16} className="text-yellow-500" />
                        <input
                          type="number"
                          min={0}
                          max={10}
                          step={0.5}
                          value={meta.rating ?? ""}
                          onChange={(e) => setRatingFor(movie, e.target.value === "" ? undefined : Number(e.target.value))}
                          placeholder="0-10"
                          className="flex-1 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    
                    {/* Campo de descrição */}
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Minha descrição
                      </label>
                      <textarea
                        value={meta.description || ""}
                        onChange={(e) => setDescriptionFor(movie, e.target.value)}
                        placeholder="Adicione suas observações sobre este título..."
                        className="w-full text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                        rows={3}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    
                    {/* Botões de ação */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const mediaType = (movie.media || "movie") as "movie" | "tv";
                          navigate(`/${mediaType}/${movie.id}`);
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-slate-700 dark:bg-slate-600 hover:bg-slate-600 dark:hover:bg-slate-500 text-white font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        Ver detalhes
                      </button>
                      {!viewingShared && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmModal({
                              show: true,
                              message: `Tem certeza que deseja remover "${movie.title}" desta coleção?`,
                              onConfirm: () => {
                                const k = mediaKey(movie);
                                const prevState = userStates[k]?.state;
                                
                                if (prevState === "watched") {
                                  removeFromWatchHistory(movie);
                                }
                                
                                setUserStates((prev) => {
                                  const updated = { ...prev };
                                  delete updated[k];
                                  return updated;
                                });
                                
                                pushToast({ message: `"${movie.title}" removido da coleção`, tone: "ok" });
                                setConfirmModal({ show: false, message: "", onConfirm: () => {} });
                              }
                            });
                          }}
                          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all duration-200 shadow-md hover:shadow-lg"
                          title="Remover da coleção"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })()}
    </section>
  );
};

