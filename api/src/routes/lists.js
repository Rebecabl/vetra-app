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
import { requireAuth } from "../middlewares/auth.js";

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
router.get("/lists/:userId", async (req, res) => {
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
router.post("/lists/:userId", async (req, res) => {
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
 * PATCH /api/lists/:listId/cover
 * 
 * Define a capa de uma lista específica.
 * Requer autenticação e verifica se o usuário é dono da lista.
 * 
 * IMPORTANTE: Esta rota deve vir ANTES das rotas genéricas /lists/:userId
 * para evitar conflitos de roteamento.
 * 
 * @param {string} listId - ID da lista
 * @param {Object} body - { itemId: string, itemType: "movie" | "tv" }
 * 
 * @returns {Object} { list: UserList }
 */
router.patch("/lists/:listId/cover", requireAuth, async (req, res) => {
  try {
    const listId = String(req.params.listId || "").trim();
    const { itemId, itemType } = req.body || {};
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ 
        error: "nao_autenticado",
        message: "Você precisa estar logado para definir a capa" 
      });
    }

    if (!listId) {
      return res.status(400).json({ error: "listId_obrigatorio" });
    }

    if (!itemId || !itemType) {
      return res.status(400).json({ 
        error: "parametros_invalidos",
        message: "itemId e itemType são obrigatórios" 
      });
    }

    if (itemType !== "movie" && itemType !== "tv") {
      return res.status(400).json({ 
        error: "itemType_invalido",
        message: "itemType deve ser 'movie' ou 'tv'" 
      });
    }

    // Buscar listas do usuário
    const userLists = await readUserLists(userId);
    const lists = userLists.lists || [];
    
    // Encontrar a lista
    const targetList = lists.find(l => l.id === listId);
    
    if (!targetList) {
      return res.status(404).json({ 
        error: "lista_nao_encontrada",
        message: "Lista não encontrada" 
      });
    }

    const itemExists = targetList.items.some(item => {
      const itemMediaKey = `${item.media || "movie"}:${item.id}`;
      const requestedKey = `${itemType}:${itemId}`;
      return itemMediaKey === requestedKey || String(item.id) === String(itemId);
    });

    if (!itemExists) {
      return res.status(404).json({ 
        error: "item_nao_encontrado",
        message: "Este item não está nesta lista" 
      });
    }

    targetList.cover = {
      type: "item",
      itemId: `${itemType}:${itemId}`,
    };
    targetList.updatedAt = new Date().toISOString();

    await getListsCollection().doc(userId).set({
      lists,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return res.json({ 
      ok: true,
      list: targetList 
    });
  } catch (error) {
    console.error("Erro ao definir capa da lista:", error);
    return res.status(500).json({ 
      error: "erro_interno",
      message: error.message 
    });
  }
});

/**
 * GET /api/lists/:userId
 * 
 * Retorna todas as listas de um usuário.
 * 
 * @param {string} userId - ID do usuário
 * 
 * @returns {Object} { lists: [...] }
 */
router.get("/lists/:userId", async (req, res) => {
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
 * DELETE /api/lists/:userId/:listId/:itemId
 * 
 * Remove um item de uma lista específica do usuário.
 * 
 * @param {string} userId - ID do usuário
 * @param {string} listId - ID da lista
 * @param {string} itemId - ID do item (formato: "movie:123" ou "tv:456" ou apenas "123")
 * 
 * @returns {Object} { ok: true }
 */
router.delete("/lists/:userId/:listId/:itemId", async (req, res) => {
  try {
    const userId = String(req.params.userId || "").trim();
    const listId = String(req.params.listId || "").trim();
    const itemIdParam = String(req.params.itemId || "").trim();
    
    if (!userId || !listId || !itemIdParam) {
      return res.status(400).json({ error: "parametros_invalidos" });
    }

    const userLists = await readUserLists(userId);
    const lists = userLists.lists || [];
    
    // Encontrar a lista
    const targetList = lists.find(l => l.id === listId);
    
    if (!targetList) {
      return res.status(404).json({ 
        error: "lista_nao_encontrada",
        message: "Lista não encontrada" 
      });
    }

    // Parse itemId (formato: "movie:123", "tv:456" ou apenas "123")
    let itemId, itemMedia;
    if (itemIdParam.includes(":")) {
      const parts = itemIdParam.split(":");
      itemMedia = parts[0];
      itemId = parts[1];
    } else {
      const existingItem = targetList.items.find(i => String(i.id) === itemIdParam);
      if (existingItem) {
        itemId = itemIdParam;
        itemMedia = existingItem.media || "movie";
      } else {
        itemId = itemIdParam;
        itemMedia = "movie";
      }
    }

    const initialLength = targetList.items.length;
    targetList.items = targetList.items.filter(item => {
      const itemMatchesId = String(item.id) === String(itemId);
      const itemMatchesMedia = (item.media || "movie") === itemMedia;
      return !(itemMatchesId && itemMatchesMedia);
    });

    // Se o item removido era a capa, atualizar
    if (targetList.cover?.type === "item") {
      const itemKey = `${itemMedia}:${itemId}`;
      if (targetList.cover.itemId === itemKey || targetList.cover.itemId === String(itemId)) {
        if (targetList.items.length > 0) {
          const firstItem = targetList.items[0];
          targetList.cover = {
            type: "item",
            itemId: `${firstItem.media || "movie"}:${firstItem.id}`,
          };
        } else {
          // Lista vazia, remover capa
          targetList.cover = undefined;
        }
      }
    }

    targetList.updatedAt = new Date().toISOString();

    await getListsCollection().doc(userId).set({
      lists,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return res.json({ ok: true });
  } catch (error) {
    console.error("Erro ao remover item da lista:", error);
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
router.delete("/lists/:userId/:listId", async (req, res) => {
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
