import { Router } from "express";
import { searchMulti } from "../services/tmdb.service.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    
    const query = String(req.query.q || req.query.query || "").trim();
    const page = Number(req.query.page || 1);
    const lang = String(req.query.lang || "pt-BR");
    
    if (!query) {
      return res.status(400).json({ error: "query_obrigatoria" });
    }

    const options = {
      include_adult: "false",
      language: lang,
      page: page,
    };

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

    const data = await searchMulti(query, options);

    res.json({
      results: data.results || [],
      items: data.results || [], 
      page: data.page || page,
      total_pages: data.total_pages || 1,
      total_results: data.total_results || 0,
    });
  } catch (error) {
    console.error("Erro na busca:", error);
    res.status(500).json({ 
      error: "erro_interno",
      message: error.message 
    });
  }
});

export default router;
