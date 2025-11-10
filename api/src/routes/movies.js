import { normalizeMovie, searchMulti as searchMovies, getDetails } from "../services/tmdb.service.js";

export async function searchHandler(req, res) {
  try {
    // Aceita tanto 'q' quanto 'query' como parâmetro
    const q = String(req.query.q || req.query.query || "").trim();
    const page = Number(req.query.page || 1);
    const lang = String(req.query.lang || "pt-BR");
    
    if (!q) {
      return res.json({ 
        items: [], 
        results: [],
        page: 1, 
        total_pages: 1, 
        total_results: 0 
      });
    }
    
    const options = {
      include_adult: "false",
      language: lang,
      page: page,
    };
    
    // Aplicar filtros se existirem
    if (req.query.year) {
      const year = Number(req.query.year);
      if (!isNaN(year)) {
        options.year = year;
      }
    }
    
    if (req.query.min_rating || req.query.minRating) {
      const minRating = Number(req.query.min_rating || req.query.minRating);
      if (!isNaN(minRating)) {
        options["vote_average.gte"] = minRating;
      }
    }
    
    // Busca usando searchMulti que busca filmes, séries e pessoas
    const data = await searchMovies(q, options);
    
    // Retornar todos os resultados sem filtrar por tipo
    // O frontend irá processar e separar filmes/séries/pessoas
    res.json({ 
      items: data.results || [],
      results: data.results || [],
      page: data.page || page,
      total_pages: data.total_pages || 1,
      total_results: data.total_results || 0,
    });
  } catch (e) {
    console.error("tmdb search error:", e);
    res.status(500).json({ error: "tmdb_search_failed", message: e.message });
  }
}

export async function detailsHandler(req, res) {
  try {
    const { media, id } = req.params;
    const d = await getDetails(media, id);
    res.json(d);
  } catch (e) {
    console.error("tmdb details error:", e);
    res.status(404).json({ error: "not_found" });
  }
}
