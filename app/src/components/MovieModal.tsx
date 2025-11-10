import React, { useEffect, useState } from "react"
import type { Movie } from "../types"
import { getDetails } from "../api"
import { X, Play, Heart, Star } from "./Icons" // <— caminho conferido

type Details = {
  id: number
  media_type: "movie" | "tv"
  title: string
  year?: string
  runtime?: number
  rating?: number
  overview?: string
  poster_path?: string
  backdrop_path?: string
  genres?: string[]
  trailers?: { id:string; name:string; key:string; official?:boolean }[]
  cast?: { id:number; name:string; character?:string; profile_path?:string }[]
  recommendations?: { id:number; media_type:"movie"|"tv"; title:string; poster_path?:string; vote_average?:number; release_year?:string }[]
}

export default function MovieModal({
  movie,
  onClose,
  isFavorite,
  onToggleFav,
  onOpenRecommendation,
  onAddToList,
}: {
  movie: Movie
  onClose: () => void
  isFavorite: (id:number)=>boolean
  onToggleFav: (m:Movie)=>void
  onOpenRecommendation?: (m:Movie)=>void
  onAddToList?: (m:Movie)=>void
}) {
  const [data, setData] = useState<Details | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    getDetails((movie.media_type as "movie"|"tv") || "movie", movie.id)
      .then(d => { if (mounted) setData(d) })
      .catch(() => { if (mounted) setData(null) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [movie.id, movie.media_type])

  const trailers = data?.trailers || []
  const mainTrailer =
    trailers.find(t => t.official && t.key) ||
    trailers.find(t => t.key) ||
    null

  const backdrop = data?.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : movie.image
  const title = data?.title || movie.title
  const year = data?.year || movie.year
  const note = typeof data?.rating === "number" ? data!.rating : movie.rating
  const overview = data?.overview || movie.overview || ""

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
        <div className="text-white">Carregando…</div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="relative">
          {backdrop && <img src={backdrop} alt={title} className="w-full h-96 object-cover rounded-t-lg" />}
          <div className="absolute top-4 right-4">
            <button onClick={onClose} className="bg-black/50 p-2 rounded-full hover:bg-black/70">
              <X width={24} height={24} />
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent p-8">
            <h2 className="text-4xl font-bold text-white mb-2">{title}</h2>
            <div className="flex items-center gap-4 text-white">
              <span className="flex items-center gap-1 text-lg">
                <Star width={20} height={20} />
                {Number(note || 0).toFixed(1)}
              </span>
              {year ? <span className="text-lg">{year}</span> : null}
              {data?.runtime ? <span className="text-lg">{data.runtime} min</span> : null}
            </div>
            {data?.genres?.length ? (
              <div className="text-white/70 text-sm mt-2">{data.genres.join(" • ")}</div>
            ) : null}
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="flex flex-wrap gap-3">
            {mainTrailer ? (
              <a
                href={`https://www.youtube.com/watch?v=${mainTrailer.key}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 min-w-[180px] bg-gradient-to-r from-cyan-500 via-purple-600 to-lime-500 text-white px-6 py-3 rounded-md font-semibold flex items-center justify-center gap-2 hover:opacity-90"
              >
                <Play width={20} height={20} /> Assistir Trailer
              </a>
            ) : (
              <div
                className="flex-1 min-w-[180px] bg-gray-700 text-white/70 px-6 py-3 rounded-md font-semibold flex items-center justify-center gap-2"
                title="Nenhum trailer disponível"
              >
                <Play width={20} height={20} /> Sem trailer
              </div>
            )}

            <button
              onClick={()=>onToggleFav(movie)}
              className={`min-w-[160px] px-6 py-3 rounded-md font-semibold flex items-center gap-2 ${isFavorite(movie.id) ? "bg-red-600 text-white hover:bg-red-700" : "bg-gray-800 text-white hover:bg-gray-700"}`}
            >
              <Heart width={20} height={20} fill={isFavorite(movie.id) ? "currentColor" : "none"} />
              {isFavorite(movie.id) ? "Remover" : "Adicionar"}
            </button>

            {onAddToList && (
              <button
                onClick={() => onAddToList(movie)}
                className="px-6 py-3 rounded-md font-semibold flex items-center gap-2 bg-sky-400 text-white hover:bg-sky-500"
              >
                + Adicionar à Lista
              </button>
            )}
          </div>

          {overview ? (
            <section>
              <h3 className="text-xl font-semibold text-white mb-3">Sinopse</h3>
              <p className="leading-relaxed text-gray-300">{overview}</p>
            </section>
          ) : null}

          {data?.trailers?.length ? (
            <section>
              <h3 className="text-xl font-semibold text-white mb-3">Trailers</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.trailers.map(t => (
                  <a
                    key={t.id}
                    href={`https://www.youtube.com/watch?v=${t.key}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-gray-800 rounded p-3 text-white/90 hover:bg-gray-700"
                  >
                    {t.name}
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          {data?.cast?.length ? (
            <section>
              <h3 className="text-xl font-semibold text-white mb-3">Elenco</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {data.cast.map(c => (
                  <div key={c.id} className="bg-gray-800 rounded p-3">
                    <div className="w-full h-32 bg-gray-700 rounded mb-2 flex items-center justify-center overflow-hidden">
                      {c.profile_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w185${c.profile_path}`}
                          alt={c.name || "Ator"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>';
                            }
                          }}
                        />
                      ) : (
                        <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                      )}
                    </div>
                    <div className="text-white text-sm font-semibold truncate" title={c.name || ""}>
                      {c.name || "Nome não disponível"}
                    </div>
                    {c.character ? (
                      <div className="text-white/60 text-xs truncate" title={c.character}>
                        {c.character}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {data?.recommendations?.length ? (
            <section>
              <h3 className="text-xl font-semibold text-white mb-3">Recomendações</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {data.recommendations.map(r => {
                  const rec: Movie = {
                    id: r.id,
                    media_type: r.media_type,
                    title: r.title,
                    image: r.poster_path ? `https://image.tmdb.org/t/p/w300${r.poster_path}` : "",
                    rating: Number(r.vote_average || 0),
                    year: r.release_year || "",
                    overview: ""
                  }
                  return (
                    <div
                      key={r.id}
                      className="text-left bg-gray-800 rounded overflow-hidden hover:bg-gray-700 cursor-pointer"
                      onClick={() => onOpenRecommendation && onOpenRecommendation(rec)}
                      role="button"
                      tabIndex={0}
                    >
                      {r.poster_path && (
                        <img src={`https://image.tmdb.org/t/p/w300${r.poster_path}`} alt={r.title} className="w-full" style={{ aspectRatio: "2/3" }} />
                      )}
                      <div className="p-2">
                        <div className="text-white text-sm font-semibold truncate">{r.title}</div>
                        <div className="text-white/60 text-xs">{r.release_year}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}
