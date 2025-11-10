/**
 * Rotas de próximos lançamentos
 * 
 * Fornece informações sobre filmes e séries que serão lançados,
 * útil para calendários e descoberta de conteúdo futuro.
 * 
 * @module routes/upcoming
 */

import { Router } from "express";
import { getByCategory } from "../services/tmdb.service.js";

const router = Router();

/**
 * GET /api/upcoming?type=movie|tv&page=1
 * 
 * Retorna filmes ou séries que serão lançados em breve.
 * 
 * @param {string} type - Tipo de mídia: "movie" ou "tv" (padrão: "movie")
 * @param {number} page - Número da página (padrão: 1)
 * 
 * @returns {Object} Lista paginada de próximos lançamentos
 */
router.get("/", async (req, res) => {
  try {
    const type = req.query.type || "movie";
    const page = Number(req.query.page || 1);

    if (!["movie", "tv"].includes(type)) {
      return res.status(400).json({ error: "tipo_invalido" });
    }

    // Para filmes: "upcoming", para séries: "on_the_air"
    const category = type === "movie" ? "upcoming" : "on_the_air";
    
    const data = await getByCategory(type, category, page);

    // Mapeia para o formato esperado pelo frontend
    const results = data.results.map((item) => ({
      id: item.id,
      media_type: item.media,
      title: item.title,
      poster_path: item.poster_path,
      backdrop_path: item.backdrop_path,
      overview: item.overview,
      release_date: item.release_date,
      vote_average: item.vote_average,
      vote_count: item.vote_count,
    }));

    res.json({
      page: data.page,
      total_pages: data.total_pages,
      total_results: data.total_results,
      results,
    });
  } catch (error) {
    console.error("[Upcoming] Erro:", error);
    res.status(500).json({ 
      error: "erro_interno",
      message: error.message 
    });
  }
});

export default router;
