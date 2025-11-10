/**
 * Rotas de listas personalizadas
 * 
 * Gerencia listas personalizadas de filmes e séries dos usuários.
 * Cada usuário pode ter múltiplas listas com nomes customizados.
 * 
 * @module routes/lists
 */

import { Router } from "express";
import { getFirestore } from "../config/firebase.config.js";
import { FieldValue } from "firebase-admin/firestore";

const router = Router();

const getListsCollection = () => getFirestore().collection("user_lists");

async function readUserLists(userId) {
  const doc = await getListsCollection().doc(userId).get();
  
  if (!doc.exists) {
    return { lists: [] };
  }

  const data = doc.data();
  return {
    lists: Array.isArray(data.lists) ? data.lists : [],
  };
}

/**
 * GET /api/lists/:userId
 * 
 * Retorna todas as listas de um usuário.
 * 
 * @param {string} userId - ID do usuário
 * 
 * @returns {Object} { lists: [...] }
 */
router.get("/:userId", async (req, res) => {
  try {
    const userId = String(req.params.userId || "").trim();
    
    if (!userId) {
      return res.status(400).json({ error: "userId_invalido" });
    }

    const data = await readUserLists(userId);
    return res.json(data);
  } catch (error) {
    console.error("Erro ao buscar listas:", error);
    return res.status(500).json({ 
      error: "erro_interno",
      message: error.message 
    });
  }
});

/**
 * POST /api/lists/:userId
 * 
 * Adiciona um item a uma lista específica do usuário.
 * Se a lista não existir, ela é criada.
 * 
 * @param {string} userId - ID do usuário
 * @param {Object} body - { listId, item }
 * 
 * @returns {Object} { ok: true }
 */
router.post("/:userId", async (req, res) => {
  try {
    const userId = String(req.params.userId || "").trim();
    
    if (!userId) {
      return res.status(400).json({ error: "userId_invalido" });
    }

    const { listId, item } = req.body || {};
    
    if (!listId) {
      return res.status(400).json({ error: "listId_obrigatorio" });
    }

    if (!item || !item.id) {
      return res.status(400).json({ error: "item_invalido" });
    }

    const userLists = await readUserLists(userId);
    const lists = userLists.lists || [];
    
    // Encontra ou cria a lista
    let targetList = lists.find(l => l.id === listId);
    
    if (!targetList) {
      targetList = {
        id: listId,
        name: `Lista ${lists.length + 1}`,
        items: [],
      };
      lists.push(targetList);
    }

    const itemExists = targetList.items.some(i => 
      i.id === item.id && (i.media || "movie") === (item.media || "movie")
    );

    if (!itemExists) {
      targetList.items.push({
        id: item.id,
        title: item.title || "",
        image: item.image || item.poster_path || "",
        rating: item.rating,
        year: item.year,
        media: item.media || "movie",
      });
    }

    await getListsCollection().doc(userId).set({
      lists,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return res.json({ ok: true });
  } catch (error) {
    console.error("Erro ao adicionar item à lista:", error);
    return res.status(500).json({ 
      error: "erro_interno",
      message: error.message 
    });
  }
});

/**
 * DELETE /api/lists/:userId/:listId
 * 
 * Remove uma lista do usuário.
 * 
 * @param {string} userId - ID do usuário
 * @param {string} listId - ID da lista
 * 
 * @returns {Object} { ok: true }
 */
router.delete("/:userId/:listId", async (req, res) => {
  try {
    const userId = String(req.params.userId || "").trim();
    const listId = String(req.params.listId || "").trim();
    
    if (!userId || !listId) {
      return res.status(400).json({ error: "parametros_invalidos" });
    }

    const userLists = await readUserLists(userId);
    const lists = (userLists.lists || []).filter(l => l.id !== listId);

    await getListsCollection().doc(userId).set({
      lists,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return res.json({ ok: true });
  } catch (error) {
    console.error("Erro ao deletar lista:", error);
    return res.status(500).json({ 
      error: "erro_interno",
      message: error.message 
    });
  }
});

export default router;
