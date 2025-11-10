import { Router } from "express";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getFirestore as getFirestoreHelper } from "../config/firebase.config.js";
import { nanoid } from "nanoid";

const router = Router();

const getSharedCollection = () => {
  try {
    return getFirestore().collection("shared_lists");
  } catch {
    return getFirestoreHelper().collection("shared_lists");
  }
};

router.post("/", async (req, res) => {
  try {
    console.log("[share] POST /api/share - Body:", JSON.stringify(req.body).substring(0, 200));
    const { items = [], type = "favorites", listName = null, ownerEmail = null } = req.body || {};
    
    if (!Array.isArray(items)) {
      console.log("[share] Erro: items não é array");
      return res.status(400).json({ error: "items_deve_ser_array" });
    }

    if (items.length === 0) {
      console.log("[share] Erro: lista vazia");
      return res.status(400).json({ error: "lista_vazia" });
    }

    const slug = nanoid(16);
    console.log("[share] Criando compartilhamento com slug:", slug, "type:", type, "items:", items.length);

    const sharedData = {
      items,
      type,
      listName,
      ownerEmail,
      createdAt: FieldValue.serverTimestamp(),
    };

    await getSharedCollection().doc(slug).set(sharedData);
    console.log("[share] Compartilhamento salvo com sucesso");

    const baseUrl = process.env.SHARE_BASE_URL || 
                    process.env.SHARE_BASE || 
                    "http://localhost:5173";
    const url = `${baseUrl}?share=${slug}`;

    const response = { 
      id: slug,
      slug,
      url,
      type,
    };
    console.log("[share] Retornando resposta:", response);
    return res.json(response);
  } catch (error) {
    console.error("[share] Erro ao criar compartilhamento:", error);
    console.error("[share] Stack trace:", error.stack);
    return res.status(500).json({ 
      error: "erro_interno",
      message: error.message 
    });
  }
});

router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    
    if (!slug || slug.length < 8) {
      return res.status(400).json({ error: "slug_invalido" });
    }

    const doc = await getSharedCollection().doc(slug).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: "compartilhamento_nao_encontrado" });
    }

    const data = doc.data();
    
    return res.json({
      id: doc.id,
      slug,
      items: data.items || [],
      type: data.type || "favorites",
      listName: data.listName || null,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
    });
  } catch (error) {
    console.error("Erro ao buscar compartilhamento:", error);
    return res.status(500).json({ 
      error: "erro_interno",
      message: error.message 
    });
  }
});

export default router;
