import { Router } from "express";
import { getTrending, getByCategory, getPopularWithFilter, discover, getGenres, getWatchProviders } from "../services/tmdb.service.js";

const router = Router();

router.get("/trending", async (req, res) => {
  try {
    const window = req.query.window || "day";
    const page = Number(req.query.page || 1);

    if (!["day", "week"].includes(window)) {
      return res.status(400).json({ error: "window_invalido" });
    }

    const data = await getTrending(window, page);

    res.json({
      results: data.results,
      page: data.page,
      total_pages: data.total_pages,
      total_results: data.total_results,
    });
  } catch (error) {
    console.error("[Browse] Erro ao buscar trending:", error);
    res.status(500).json({ 
      error: "erro_interno",
      message: error.message 
    });
  }
});

// IMPORTANTE: Esta rota deve vir ANTES de /:category para não ser capturada por ela
router.get("/popular/filter", async (req, res) => {
  try {
    const filter = req.query.filter || "streaming";
    const page = Number(req.query.page || 1);
    const region = req.query.region || "BR";

    const validFilters = ["streaming", "rent", "cinema", "tv"];
    if (!validFilters.includes(filter)) {
      return res.status(400).json({ 
        error: "filtro_invalido",
        validFilters,
      });
    }

    const data = await getPopularWithFilter(filter, page, region);

    res.json({
      results: data.results || [],
      page: data.page || page,
      total_pages: data.total_pages || 1,
      total_results: data.total_results || 0,
    });
  } catch (error) {
    console.error("[Browse] Erro ao buscar popular filtrado:", error);
    res.status(500).json({ 
      error: "erro_interno",
      message: error.message 
    });
  }
});

router.get("/discover", async (req, res) => {
  try {
    const media = req.query.media;
    const page = Number(req.query.page || 1);

    if (!media || !["movie", "tv"].includes(media)) {
      return res.status(400).json({ error: "media_obrigatorio", message: "Parâmetro 'media' (movie ou tv) é obrigatório" });
    }

    const filters = {
      sortBy: req.query.sortBy || "popularity.desc",
      region: req.query.region || "BR",
      genres: req.query.genres ? req.query.genres.split(",").filter(Boolean) : [],
      year: req.query.year ? Number(req.query.year) : null,
      releaseDateFrom: req.query.releaseDateFrom || null,
      releaseDateTo: req.query.releaseDateTo || null,
      airDateFrom: req.query.airDateFrom || null,
      airDateTo: req.query.airDateTo || null,
      voteAverageGte: req.query.voteAverageGte ? Number(req.query.voteAverageGte) : null,
      voteCountGte: req.query.voteCountGte ? Number(req.query.voteCountGte) : null,
      watchProviders: req.query.watchProviders ? req.query.watchProviders.split(",").filter(Boolean) : [],
      watchMonetizationTypes: req.query.watchMonetizationTypes ? req.query.watchMonetizationTypes.split(",").filter(Boolean) : [],
      runtimeGte: req.query.runtimeGte ? Number(req.query.runtimeGte) : null,
      runtimeLte: req.query.runtimeLte ? Number(req.query.runtimeLte) : null,
    };

    const data = await discover(media, filters, page);

    res.json({
      results: data.results || [],
      page: data.page || page,
      total_pages: data.total_pages || 1,
      total_results: data.total_results || 0,
    });
  } catch (error) {
    console.error("[Browse] Erro ao buscar discover:", error);
    res.status(500).json({ 
      error: "erro_interno",
      message: error.message 
    });
  }
});

router.get("/genres", async (req, res) => {
  try {
    const media = req.query.media;

    if (!media || !["movie", "tv"].includes(media)) {
      return res.status(400).json({ error: "media_obrigatorio", message: "Parâmetro 'media' (movie ou tv) é obrigatório" });
    }

    const genres = await getGenres(media);

    res.json(genres);
  } catch (error) {
    console.error("[Browse] Erro ao buscar gêneros:", error);
    res.status(500).json({ 
      error: "erro_interno",
      message: error.message 
    });
  }
});

router.get("/watch-providers", async (req, res) => {
  try {
    const region = req.query.region || "BR";

    const providers = await getWatchProviders(region);

    res.json(providers);
  } catch (error) {
    console.error("[Browse] Erro ao buscar watch providers:", error);
    res.status(500).json({ 
      error: "erro_interno",
      message: error.message 
    });
  }
});

router.get("/:category", async (req, res) => {
  try {
    const category = req.params.category;
    const media = req.query.media || "movie";
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
    console.error("[Browse] Erro:", error);
    res.status(500).json({ 
      error: "erro_interno",
      message: error.message 
    });
  }
});

export default router;
