/**
 * Rotas de favoritos
 * 
 * Gerencia a persistência de favoritos dos usuários no Firestore.
 * 
 * @module routes/favorites
 */

import { Router } from "express";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getFirestore as getFirestoreHelper } from "../config/firebase.config.js";

const router = Router();

const getFavoritesCollection = () => {
  try {
    return getFirestore().collection("favorites");
  } catch {
    return getFirestoreHelper().collection("favorites");
  }
};

/**
 * POST /api/favorites
 * 
 * Salva ou atualiza a lista de favoritos de um usuário.
 * 
 * @param {string} uid - ID do usuário
 * @param {Array} items - Lista de itens favoritos
 * 
 * @returns {Object} { ok: true, id }
 */
router.post("/", async (req, res) => {
  try {
    const { uid, items = [] } = req.body || {};
    
    if (!uid) {
      return res.status(400).json({ error: "uid_obrigatorio" });
    }

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "items_deve_ser_array" });
    }

    await getFavoritesCollection().doc(uid).set({
      items,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return res.json({ ok: true, id: uid });
  } catch (error) {
    console.error("Erro ao salvar favoritos:", error);
    return res.status(500).json({ 
      error: "erro_interno",
      message: error.message 
    });
  }
});

/**
 * GET /api/favorites/:uid
 * 
 * Recupera a lista de favoritos de um usuário.
 * 
 * @param {string} uid - ID do usuário
 * 
 * @returns {Object} { items: [...] }
 */
router.get("/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    
    if (!uid) {
      return res.status(400).json({ error: "uid_obrigatorio" });
    }

    const doc = await getFavoritesCollection().doc(uid).get();
    
    if (!doc.exists) {
      return res.json({ items: [] });
    }

    const data = doc.data();
    return res.json({ 
      items: Array.isArray(data.items) ? data.items : [] 
    });
  } catch (error) {
    console.error("Erro ao buscar favoritos:", error);
    return res.status(500).json({ 
      error: "erro_interno",
      message: error.message 
    });
  }
});

export default router;
