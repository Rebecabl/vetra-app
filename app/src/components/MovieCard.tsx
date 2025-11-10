import React from "react"
import { Heart, Play, Star } from "./Icons"
import type { Movie } from "../types"

export default function MovieCard({
  movie,
  isFavorite,
  onDetails,
  onToggleFav
}: {
  movie: Movie
  isFavorite: (id:number)=>boolean
  onDetails: (m:Movie)=>void
  onToggleFav: (m:Movie)=>void
}) {
  return (
    <div className="relative group cursor-pointer" onClick={() => onDetails(movie)}>
      <div className="relative overflow-hidden rounded-xl transition-all duration-500 group-hover:scale-[1.08] group-hover:z-10 shadow-lg group-hover:shadow-2xl">
        {movie.image ? (
          <img
            src={movie.image}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            style={{ aspectRatio: '2/3' }}
          />
        ) : (
          <div className="w-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 flex items-center justify-center" style={{ aspectRatio: '2/3' }}>
            <div className="text-slate-600 text-4xl">No Image</div>
          </div>
        )}

        {/* Overlay gradiente mais sofisticado */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500">
          {/* Brilho sutil no topo */}
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Conteúdo do overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1 px-2 py-1 bg-black/60 rounded backdrop-blur-sm">
                <Star width={14} height={14} className="text-yellow-400 fill-yellow-400" />
                <span className="text-white text-xs font-semibold">{Number(movie.rating || 0).toFixed(1)}</span>
              </div>
              {movie.year && (
                <div className="px-2 py-1 bg-black/60 rounded backdrop-blur-sm text-white text-xs">
                  {movie.year}
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={(e)=>{ e.stopPropagation(); onDetails(movie) }}
                className="flex-1 bg-white text-black px-3 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Play width={16} height={16}/> 
                <span className="text-sm">Detalhes</span>
              </button>
              <button
                onClick={(e)=>{ e.stopPropagation(); onToggleFav(movie) }}
                className={`px-3 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                  isFavorite(movie.id) 
                    ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white' 
                    : 'bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 border border-white/20'
                }`}
              >
                <Heart width={16} height={16} fill={isFavorite(movie.id) ? 'currentColor':'none'}/>
              </button>
            </div>
          </div>
        </div>

        {/* Indicador de favorito no canto */}
        {isFavorite(movie.id) && (
          <div className="absolute top-2 right-2 bg-red-600 rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Heart width={14} height={14} className="text-white fill-white" />
          </div>
        )}
      </div>

      {/* Informações abaixo do card */}
      <div className="mt-3 space-y-1">
        <h3 className="font-semibold text-slate-900 dark:text-white truncate text-sm group-hover:text-cyan-400 dark:group-hover:text-cyan-400 transition-colors duration-300">
          {movie.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Star width={12} height={12} className="text-yellow-500 fill-yellow-500" />
            {Number(movie.rating || 0).toFixed(1)}
          </span>
          {movie.year && (
            <>
              <span className="text-gray-400">•</span>
              <span>{movie.year}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
