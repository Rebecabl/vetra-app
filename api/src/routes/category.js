/**
 * Rotas de categoria (formato alternativo)
 * 
 * Fornece acesso a categorias no formato /api/category/:media/:category
 * 
 * @module routes/category
 */

import { Router } from "express";
import { getByCategory } from "../services/tmdb.service.js";

const router = Router();

/**
 * GET /api/category/:media/:category
 * 
 * Retorna conteúdo por categoria (formato alternativo para compatibilidade com frontend).
 * 
 * @param {string} media - Tipo: "movie" ou "tv"
 * @param {string} category - Categoria: "popular", "top_rated", "now_playing", "upcoming"
 * @param {number} page - Número da página (padrão: 1)
 * 
 * @returns {Object} Lista paginada de conteúdo
 */
router.get("/:media/:category", async (req, res) => {
  try {
    const media = req.params.media;
    const category = req.params.category;
    const page = Number(req.query.page || 1);

    if (!["movie", "tv"].includes(media)) {
      return res.status(400).json({ error: "media_invalido" });
    }

    const validCategories = {
      movie: ["popular", "top_rated", "now_playing", "upcoming"],
      tv: ["popular", "top_rated", "on_the_air", "airing_today"],
    };

    if (!validCategories[media].includes(category)) {
      return res.status(400).json({ 
        error: "categoria_invalida",
        validCategories: validCategories[media],
      });
    }

    const data = await getByCategory(media, category, page);

    res.json({
      results: data.results,
      page: data.page,
      total_pages: data.total_pages,
      total_results: data.total_results,
    });
  } catch (error) {
    console.error("[Category] Erro:", error);
    res.status(500).json({ 
      error: "erro_interno",
      message: error.message 
    });
  }
});

export default router;

