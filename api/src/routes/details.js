/**
 * Rotas de detalhes de filmes e séries
 * 
 * Fornece informações completas sobre filmes e séries,
 * incluindo elenco, trailers, recomendações e onde assistir.
 * 
 * @module routes/details
 */

import { Router } from "express";
import { getDetails } from "../services/tmdb.service.js";

const router = Router();

/**
 * GET /api/details/:media/:id
 * 
 * Retorna detalhes completos de um filme ou série.
 * 
 * @param {string} media - Tipo de mídia: "movie" ou "tv"
 * @param {number} id - ID do filme/série no TMDB
 * 
 * @returns {Object} Detalhes completos incluindo:
 *   - Informações básicas (título, sinopse, ano, etc)
 *   - Elenco e equipe
 *   - Trailers
 *   - Recomendações
 *   - Onde assistir (streaming providers)
 */
router.get("/:media/:id", async (req, res) => {
  try {
    const { media, id } = req.params;
    const allowed = new Set(["movie", "tv"]);
    
    if (!allowed.has(media)) {
      return res.status(400).json({ error: "media inválida" });
    }

    const movieId = Number(id);
    if (!movieId || isNaN(movieId)) {
      return res.status(400).json({ error: "id inválido" });
    }

    const details = await getDetails(media, movieId);

    const trailers = details.trailer_url
      ? [{
          id: "main",
          name: "Trailer",
          key: details.trailer_url.split("v=")[1] || "",
          official: true,
        }]
      : [];

    const payload = {
      id: details.id,
      media_type: details.media,
      title: details.title,
      original_title: details.original_title,
      year: details.year,
      runtime: details.runtime,
      rating: details.vote_average ?? 0,
      vote_count: details.vote_count,
      overview: details.overview,
      poster_path: details.poster_path,
      backdrop_path: details.backdrop_path,
      genres: details.genres,
      trailers,
      cast: details.cast,
      recommendations: details.recommendations.map((r) => ({
        id: r.id,
        media_type: r.media,
        title: r.title,
        poster_path: r.poster_path,
        vote_average: r.vote_average,
        release_year: r.year,
      })),
      release_date: details.release_date,
      status: details.status,
      budget: details.budget,
      revenue: details.revenue,
      production_companies: details.production_companies,
      production_countries: details.production_countries,
      spoken_languages: details.spoken_languages,
      tagline: details.tagline,
      homepage: details.homepage,
      imdb_id: details.imdb_id,
      watch_providers: details.watch_providers,
      directors: details.directors,
      // Novos campos
      writers: details.writers || [],
      producers: details.producers || [],
      cinematographers: details.cinematographers || [],
      composers: details.composers || [],
      editors: details.editors || [],
      keywords: details.keywords || [],
      belongs_to_collection: details.belongs_to_collection || null,
      certification: details.certification || null,
      numberOfSeasons: details.numberOfSeasons || null,
      numberOfEpisodes: details.numberOfEpisodes || null,
      lastAirDate: details.lastAirDate || null,
      nextEpisodeToAir: details.nextEpisodeToAir || null,
      networks: details.networks || [],
      external_ids: details.external_ids || {},
      images: details.images || { backdrops: [], posters: [] },
      allVideos: details.allVideos || [],
      seasons: details.seasons || null,
    };

    return res.json(payload);
  } catch (error) {
    console.error("Erro ao buscar detalhes:", error);
    
    // Trata erros específicos do TMDB
    if (error.message.includes("404") || error.message.includes("not found")) {
      return res.status(404).json({ error: "conteudo_nao_encontrado" });
    }
    
    return res.status(500).json({ 
      error: "erro_interno",
      message: error.message 
    });
  }
});

export default router;
