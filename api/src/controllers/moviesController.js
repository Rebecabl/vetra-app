import { getDetails, searchMulti as searchMovies, normalizeMovie } from "../services/tmdb.service.js"

export async function search(req, res) {
  try {
    const query = String(req.query.query || "").trim()
    if (!query) return res.json({ page: 1, total_results: 0, results: [] })
    const r = await searchMovies(query, Number(req.query.page || 1))
    const results = (r.results || [])
      .filter(x => x.media_type === "movie" || x.media_type === "tv")
      .map(normalizeMovie)
    res.json({ page: r.page, total_results: r.total_results, results })
  } catch (e) {
    res.status(500).json({ error: "search_failed" })
  }
}

export async function detailsFull(req, res) {
  try {
    const { mediaType, id } = req.params
    const d = await getDetails(mediaType, id)
    const year = (d.release_date || d.first_air_date || "").slice(0, 4)
    const runtime = mediaType === "movie" ? d.runtime : (d.episode_run_time || [])[0]
    const trailers = (d.videos?.results || [])
      .filter(v => v.site === "YouTube" && v.type === "Trailer")
      .map(v => ({ id: v.id, name: v.name, key: v.key, official: !!v.official, published_at: v.published_at }))
    const cast = (d.credits?.cast || []).slice(0, 12).map(c => ({
      id: c.id, name: c.name, character: c.character, profile_path: c.profile_path
    }))
    const recs = (d.recommendations?.results || []).slice(0, 12).map(r => ({
      id: r.id,
      media_type: mediaType,
      title: r.title || r.name,
      poster_path: r.poster_path,
      vote_average: r.vote_average || 0,
      release_year: (r.release_date || r.first_air_date || "").slice(0, 4)
    }))
    res.json({
      id: d.id,
      media_type: mediaType,
      title: d.title || d.name,
      year,
      runtime,
      rating: Number(d.vote_average || 0),
      overview: d.overview,
      poster_path: d.poster_path,
      backdrop_path: d.backdrop_path,
      genres: (d.genres || []).map(g => g.name),
      trailers,
      cast,
      recommendations: recs
    })
  } catch (e) {
    res.status(500).json({ error: "details_failed" })
  }
}

export async function videos(req, res) {
  try {
    const { mediaType, id } = req.params
    const d = await getDetails(mediaType, id)
    const trailers = (d.videos?.results || [])
      .filter(v => v.site === "YouTube")
      .map(v => ({ id: v.id, name: v.name, key: v.key, type: v.type, official: !!v.official }))
    res.json({ id: d.id, media_type: mediaType, videos: trailers })
  } catch (e) {
    res.status(500).json({ error: "videos_failed" })
  }
}