import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, List as ListIcon, Bookmark, Film, Star, Check } from 'lucide-react';
import type { MovieT } from '../types/movies';
import { poster } from '../lib/media.utils';

interface MovieCardInlineProps {
  movie: MovieT;
  isLoggedIn: boolean;
  isFavorite: (m: MovieT) => boolean;
  getUserMeta: (m: MovieT) => any;
  toggleFavorite: (movie: MovieT, skipConfirm?: boolean) => void;
  setShowListPickerFor: (movie: MovieT | null) => void;
  setShowCollectionPickerFor: (movie: MovieT | null) => void;
  setPendingAction: (action: (() => void) | null) => void;
  setShowActionSheet: (show: boolean) => void;
  pushToast: (toast: { message: string; tone: "ok" | "err" | "info" }) => void;
}

export const MovieCardInline: React.FC<MovieCardInlineProps> = ({
  movie,
  isLoggedIn,
  isFavorite,
  getUserMeta,
  toggleFavorite,
  setShowListPickerFor,
  setShowCollectionPickerFor,
  setPendingAction,
  setShowActionSheet,
  pushToast,
}) => {
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState<string | null>(null);

  const openDetails = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const mediaType = (movie.media || "movie") as "movie" | "tv";
    const path = `/${mediaType}/${movie.id}`;
    navigate(path);
  };

  const handleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      setPendingAction(() => () => {
        setIsAnimating("fav");
        setTimeout(() => setIsAnimating(null), 150);
        toggleFavorite(movie, true);
      });
      setShowActionSheet(true);
      return;
    }
    setIsAnimating("fav");
    setTimeout(() => setIsAnimating(null), 150);
    toggleFavorite(movie, true);
  };

  const handleAddToList = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      setPendingAction(() => () => setShowListPickerFor(movie));
      setShowActionSheet(true);
      return;
    }
    setShowListPickerFor(movie);
  };

  const handleCollection = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      setPendingAction(() => () => {
        setShowCollectionPickerFor(movie);
        setIsAnimating("collection");
        setTimeout(() => setIsAnimating(null), 150);
        if (!getUserMeta(movie).state) {
          pushToast({ 
            message: "Salvo em coleção ✔", 
            tone: "ok" 
          });
        }
      });
      setShowActionSheet(true);
      return;
    }
    setShowCollectionPickerFor(movie);
    setIsAnimating("collection");
    setTimeout(() => setIsAnimating(null), 150);
    if (!getUserMeta(movie).state) {
      pushToast({ 
        message: "Salvo em coleção ✔", 
        tone: "ok" 
      });
    }
  };

  const score = typeof movie.rating === "number" ? Math.round((movie.rating + Number.EPSILON) * 10) / 10 : null;
  const meta = getUserMeta(movie);
  const hasPoster = movie.image || movie.poster_path;
  const isWatched = meta?.state === "watched";
  const isFavoriteMovie = isFavorite(movie);
  const hasCollectionState = !!getUserMeta(movie).state;

  return (
    <div 
      onClick={openDetails} 
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetails(); } }}
      role="button"
      tabIndex={0}
      className={`group relative text-left w-full select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 rounded-[16px] sm:rounded-[20px] ${isWatched ? "ring-2 ring-green-500/50" : ""}`}
      title={movie.title}
    >
      <div className="relative rounded-[16px] sm:rounded-[20px] overflow-hidden bg-slate-900/70 backdrop-blur-sm border border-slate-800/50 dark:border-slate-700/50 shadow-sm hover:shadow-lg transition-shadow duration-300">
        <div className="relative w-full" style={{ aspectRatio: "2/3" }}>
          {hasPoster ? (
            <img 
              src={movie.image || poster(movie.poster_path)} 
              alt={movie.title} 
              className="w-full h-full object-cover" 
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const placeholder = target.nextElementSibling as HTMLElement;
                if (placeholder) placeholder.style.display = "flex";
              }}
            />
          ) : null}
          <div 
            className={`absolute inset-0 bg-slate-800 flex items-center justify-center ${hasPoster ? "hidden" : "flex"}`}
          >
            <Film size={32} className="text-slate-600 dark:text-slate-500" />
          </div>
          
          {isWatched && (
            <div 
              className="absolute bottom-2 right-2 w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] rounded-full bg-green-500/90 backdrop-blur-sm flex items-center justify-center shadow-lg ring-2 ring-white/30"
              title="Assistido"
              aria-label="Assistido"
            >
              <Check size={12} className="sm:w-[14px] sm:h-[14px] text-white" strokeWidth={3} />
            </div>
          )}
          
          {score !== null && (
            <div className="absolute top-2 left-2 z-10">
              <div className="flex items-center gap-0.5 rounded-full bg-black/80 backdrop-blur-sm px-1.5 py-0.5 text-xs font-semibold ring-1 ring-white/20">
                <Star size={12} className="shrink-0" color="#FFD700" fill="#FFD700" />
                <span className="tabular-nums text-white">{score}</span>
              </div>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 md:hidden">
            <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-8 pb-2 px-2">
              <div className="flex gap-2 justify-center items-center">
                <button
                  onClick={handleAddToList}
                  className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white flex items-center justify-center transition-all duration-150 border border-white/30 hover:border-cyan-400/70 touch-manipulation active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  title="Mais opções"
                  aria-label="Mais opções"
                >
                  <ListIcon size={18} />
                </button>
                <button
                  onClick={handleFav}
                  className={`min-w-[44px] min-h-[44px] w-11 h-11 rounded-full flex items-center justify-center transition-all duration-150 border touch-manipulation active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                    isFavoriteMovie
                      ? "bg-white/20 hover:bg-white/30 text-red-400 border-white/30 hover:border-red-400/70"
                      : "bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-cyan-400/70"
                  } ${isAnimating === "fav" ? "animate-bounce" : ""}`}
                  title={isFavoriteMovie ? "Remover dos favoritos" : "Favoritar"}
                  aria-label={isFavoriteMovie ? "Remover dos favoritos" : "Favoritar"}
                >
                  <Heart size={18} fill={isFavoriteMovie ? "currentColor" : "none"} />
                </button>
                <button
                  onClick={handleCollection}
                  className={`min-w-[44px] min-h-[44px] w-11 h-11 rounded-full backdrop-blur-sm text-white flex items-center justify-center transition-all duration-150 border touch-manipulation active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                    hasCollectionState
                      ? "bg-cyan-500/40 hover:bg-cyan-500/50 border-cyan-400/70"
                      : "bg-white/20 hover:bg-white/30 border-white/30 hover:border-cyan-400/70"
                  } ${isAnimating === "collection" ? "animate-bounce" : ""}`}
                  title="Salvar em coleção"
                  aria-label="Salvar em coleção"
                >
                  <Bookmark size={18} fill={hasCollectionState ? "currentColor" : "none"} />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-2 sm:p-3 flex flex-col bg-slate-900/70">
          <h3 className="font-semibold text-white leading-tight line-clamp-2 mb-1.5 text-sm sm:text-base min-h-[2.5em] sm:min-h-[3em]">
            {movie.title}
          </h3>
          <div className="text-[12px] sm:text-[13px] text-gray-400 flex items-center gap-1 line-clamp-1 min-h-[1.25em] mb-2">
            {movie.year ? <span>{movie.year}</span> : <span>—</span>}
            {movie.voteCount && movie.year && <span>•</span>}
            {movie.voteCount && <span>({movie.voteCount.toLocaleString('pt-BR')})</span>}
          </div>
          
          <div className="hidden md:flex gap-2 sm:gap-3 justify-center min-h-[36px] sm:min-h-[44px] items-center">
            <button
              onClick={handleAddToList}
              className="min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px] w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-slate-300 dark:text-slate-400 hover:text-white flex items-center justify-center transition-all duration-150 border border-white/20 hover:border-cyan-400/50 touch-manipulation active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              title="Mais opções"
              aria-label="Mais opções"
            >
              <ListIcon size={16} className="sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={handleFav}
              className={`min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px] w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-150 border touch-manipulation active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                isFavoriteMovie
                  ? "bg-white/10 hover:bg-white/20 text-red-400 border-white/20 hover:border-red-400/50"
                  : "bg-white/10 hover:bg-white/20 text-slate-300 dark:text-slate-400 hover:text-white border-white/20 hover:border-cyan-400/50"
              } ${isAnimating === "fav" ? "animate-bounce" : ""}`}
              title={isFavoriteMovie ? "Remover dos favoritos" : "Favoritar"}
              aria-label={isFavoriteMovie ? "Remover dos favoritos" : "Favoritar"}
            >
              <Heart size={16} className="sm:w-5 sm:h-5" fill={isFavoriteMovie ? "currentColor" : "none"} />
            </button>
            <button
              onClick={handleCollection}
              className={`min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px] w-9 h-9 sm:w-11 sm:h-11 rounded-full backdrop-blur-sm text-white flex items-center justify-center transition-all duration-150 border touch-manipulation active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                hasCollectionState
                  ? "bg-cyan-500/30 hover:bg-cyan-500/40 border-cyan-400/50"
                  : "bg-white/10 hover:bg-white/20 text-slate-300 dark:text-slate-400 hover:text-white border-white/20 hover:border-cyan-400/50"
              } ${isAnimating === "collection" ? "animate-bounce" : ""}`}
              title="Salvar em coleção"
              aria-label="Salvar em coleção"
            >
              <Bookmark size={16} className="sm:w-5 sm:h-5" fill={hasCollectionState ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

