import { Router } from "express";
import { getPopularPeople, getPersonDetails, searchPerson } from "../services/tmdb.service.js";

const router = Router();

router.get("/popular", async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const lang = req.query.lang || "pt-BR";

    const data = await getPopularPeople(page, lang);

    res.json({
      results: data.results || [],
      page: data.page || page,
      total_pages: data.total_pages || 1,
      total_results: data.total_results || 0,
    });
  } catch (error) {
    console.error("[People] Erro ao buscar pessoas populares:", error);
    res.status(500).json({ 
      error: "erro_interno",
      message: error.message 
    });
  }
});

router.get("/search", async (req, res) => {
  try {
    const query = String(req.query.query || req.query.q || "").trim();
    const page = Number(req.query.page || 1);
    const lang = req.query.lang || "pt-BR";
    
    if (!query) {
      return res.status(400).json({ error: "query_obrigatoria" });
    }

    const data = await searchPerson(query, page, lang);

    res.json({
      results: data.results || [],
      page: data.page || page,
      total_pages: data.total_pages || 1,
      total_results: data.total_results || 0,
    });
  } catch (error) {
    console.error("[People] Erro ao buscar pessoas:", error);
    res.status(500).json({ 
      error: "erro_interno",
      message: error.message 
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const lang = req.query.lang || "pt-BR";

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "id_invalido", message: "ID da pessoa inválido" });
    }

    const person = await getPersonDetails(id, lang);

    res.json(person);
  } catch (error) {
    console.error("[People] Erro ao buscar detalhes da pessoa:", error);
    
    // Trata erros específicos do TMDB
    if (error.message.includes("404") || error.message.includes("not found")) {
      return res.status(404).json({ error: "pessoa_nao_encontrada" });
    }
    
    res.status(500).json({ 
      error: "erro_interno",
      message: error.message 
    });
  }
});

export default router;

