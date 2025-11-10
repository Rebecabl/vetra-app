import { Router } from "express";
import { getFirestore } from "../config/firebase.config.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/:media/:id", async (req, res) => {
  try {
    const { media, id } = req.params;
    if (!["movie", "tv"].includes(media)) {
      return res.status(400).json({ error: "Tipo de mídia inválido" });
    }

    const db = getFirestore();
    const mediaKey = `${media}:${id}`;
    const commentsRef = db.collection("comments").where("mediaKey", "==", mediaKey);
    const snapshot = await commentsRef.orderBy("createdAt", "desc").get();

    const comments = [];
    snapshot.forEach((doc) => {
      comments.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return res.json({ comments });
  } catch (error) {
    console.error("Erro ao buscar comentários:", error);
    return res.status(500).json({ error: "Erro ao buscar comentários" });
  }
});

// POST /api/comments/:media/:id - Criar comentário
router.post("/:media/:id", requireAuth, async (req, res) => {
  try {
    const { media, id } = req.params;
    const { text, rating } = req.body;
    const uid = req.user?.uid;

    if (!uid) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    if (!["movie", "tv"].includes(media)) {
      return res.status(400).json({ error: "Tipo de mídia inválido" });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Texto do comentário é obrigatório" });
    }

    if (text.length > 1000) {
      return res.status(400).json({ error: "Comentário muito longo (máximo 1000 caracteres)" });
    }

    const db = getFirestore();
    const userRef = db.collection("profiles").doc(uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data() || {};

    const mediaKey = `${media}:${id}`;
    const commentData = {
      mediaKey,
      media,
      mediaId: parseInt(id),
      userId: uid,
      userName: userData.name || "Usuário",
      userAvatar: userData.avatar_url || null,
      text: text.trim(),
      rating: rating && rating >= 0 && rating <= 10 ? parseFloat(rating) : null,
      likes: [],
      reactions: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const commentRef = await db.collection("comments").add(commentData);
    const newComment = { id: commentRef.id, ...commentData };

    return res.status(201).json({ comment: newComment });
  } catch (error) {
    console.error("Erro ao criar comentário:", error);
    return res.status(500).json({ error: "Erro ao criar comentário" });
  }
});

// PUT /api/comments/:commentId/like - Curtir/descurtir comentário
router.put("/:commentId/like", requireAuth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const uid = req.user?.uid;

    if (!uid) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const db = getFirestore();
    const commentRef = db.collection("comments").doc(commentId);
    const commentDoc = await commentRef.get();

    if (!commentDoc.exists) {
      return res.status(404).json({ error: "Comentário não encontrado" });
    }

    const commentData = commentDoc.data();
    const likes = commentData.likes || [];
    const hasLiked = likes.includes(uid);

    if (hasLiked) {
      likes.splice(likes.indexOf(uid), 1);
    } else {
      likes.push(uid);
    }

    await commentRef.update({
      likes,
      updatedAt: new Date().toISOString(),
    });

    return res.json({ liked: !hasLiked, likesCount: likes.length });
  } catch (error) {
    console.error("Erro ao curtir comentário:", error);
    return res.status(500).json({ error: "Erro ao curtir comentário" });
  }
});

// PUT /api/comments/:commentId/reaction - Adicionar reação ao comentário
router.put("/:commentId/reaction", requireAuth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { reaction } = req.body; // 'like', 'love', 'laugh', 'wow', 'sad', 'angry'
    const uid = req.user?.uid;

    if (!uid) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const validReactions = ["like", "love", "laugh", "wow", "sad", "angry"];
    if (!validReactions.includes(reaction)) {
      return res.status(400).json({ error: "Reação inválida" });
    }

    const db = getFirestore();
    const commentRef = db.collection("comments").doc(commentId);
    const commentDoc = await commentRef.get();

    if (!commentDoc.exists) {
      return res.status(404).json({ error: "Comentário não encontrado" });
    }

    const commentData = commentDoc.data();
    const reactions = commentData.reactions || {};

    // Se o usuário já reagiu, remove a reação anterior
    Object.keys(reactions).forEach((r) => {
      if (reactions[r] && reactions[r].includes(uid)) {
        reactions[r] = reactions[r].filter((id) => id !== uid);
        if (reactions[r].length === 0) {
          delete reactions[r];
        }
      }
    });

    // Adiciona a nova reação
    if (!reactions[reaction]) {
      reactions[reaction] = [];
    }
    reactions[reaction].push(uid);

    await commentRef.update({
      reactions,
      updatedAt: new Date().toISOString(),
    });

    return res.json({ reactions });
  } catch (error) {
    console.error("Erro ao adicionar reação:", error);
    return res.status(500).json({ error: "Erro ao adicionar reação" });
  }
});

// DELETE /api/comments/:commentId - Deletar comentário
router.delete("/:commentId", requireAuth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const uid = req.user?.uid;

    if (!uid) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const db = getFirestore();
    const commentRef = db.collection("comments").doc(commentId);
    const commentDoc = await commentRef.get();

    if (!commentDoc.exists) {
      return res.status(404).json({ error: "Comentário não encontrado" });
    }

    if (commentDoc.data().userId !== uid) {
      return res.status(403).json({ error: "Você não tem permissão para deletar este comentário" });
    }

    await commentRef.delete();
    return res.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar comentário:", error);
    return res.status(500).json({ error: "Erro ao deletar comentário" });
  }
});

export default router;

