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
    
    let results = (data.results || []).filter((person) => {
      if (!person.name || !person.name.trim()) {
        return false;
      }
      return true;
    });

    results.sort((a, b) => {
      const aHasPhoto = !!(a.profile_path && a.profile_path.trim());
      const bHasPhoto = !!(b.profile_path && b.profile_path.trim());
      if (aHasPhoto && !bHasPhoto) return -1;
      if (!aHasPhoto && bHasPhoto) return 1;
      
      const aIsActor = a.known_for_department === "Acting";
      const bIsActor = b.known_for_department === "Acting";
      if (aIsActor && !bIsActor) return -1;
      if (!aIsActor && bIsActor) return 1;
      
      const aPopularity = a.popularity || 0;
      const bPopularity = b.popularity || 0;
      return bPopularity - aPopularity;
    });

    res.json({
      results: results,
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

