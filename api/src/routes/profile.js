/**
 * Rotas de perfil de usuário
 * 
 * Gerencia informações do perfil dos usuários.
 * 
 * @module routes/profile
 */

import { Router } from "express";
import { getFirestore, getAuth } from "../config/firebase.config.js";
import { getUserProfile, upsertUserProfile } from "../repositories/users.repository.js";
import bcrypt from "bcryptjs";
import { validatePassword } from "../utils/passwordValidator.js";
import { logAuditEvent, getClientIP, getUserAgent } from "../utils/auditLog.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

/**
 * GET /api/profile/:email
 * 
 * Retorna o perfil de um usuário pelo email.
 * 
 * @param {string} email - Email do usuário
 * 
 * @returns {Object} Dados do perfil
 */
router.get("/:email", async (req, res) => {
  try {
    const email = String(req.params.email || "").trim().toLowerCase();
    
    if (!email) {
      return res.status(400).json({ error: "email_obrigatorio" });
    }

    const db = getFirestore();
    const snapshot = await db
      .collection("profiles")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "usuario_nao_encontrado" });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    const uid = doc.id;

    let emailVerified = false;
    try {
      const auth = getAuth();
      const userRecord = await auth.getUser(uid);
      emailVerified = userRecord.emailVerified || false;
    } catch (authError) {
      console.warn("[profile GET] Erro ao buscar emailVerified do Firebase Auth:", authError.message);
    }

    const { passwordHash, ...profile } = data;

    const response = {
      uid: doc.id,
      ...profile,
      status: data.status || null,
      deletedAt: data.deletedAt || null,
      deletionScheduledFor: data.deletionScheduledFor || null,
      emailVerified,
    };

    console.log("[profile GET] Retornando perfil:", {
      email: response.email,
      status: response.status,
      deletedAt: response.deletedAt,
      deletionScheduledFor: response.deletionScheduledFor
    });

    return res.json(response);
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return res.status(500).json({ 
      error: "erro_interno",
      message: error.message 
    });
  }
});

/**
 * GET /api/profile/uid/:uid
 * 
 * Retorna o perfil de um usuário pelo UID.
 * 
 * @param {string} uid - ID único do usuário
 * 
 * @returns {Object} Dados do perfil
 */
router.get("/uid/:uid", async (req, res) => {
  try {
    const uid = String(req.params.uid || "").trim();
    
    if (!uid) {
      return res.status(400).json({ error: "uid_obrigatorio" });
    }

    const profile = await getUserProfile(uid);

    if (!profile) {
      return res.status(404).json({ error: "usuario_nao_encontrado" });
    }

    // Buscar status de verificação de e-mail do Firebase Auth
    let emailVerified = false;
    try {
      const auth = getAuth();
      const userRecord = await auth.getUser(uid);
      emailVerified = userRecord.emailVerified || false;
    } catch (authError) {
      console.warn("[profile GET uid] Erro ao buscar emailVerified:", authError.message);
    }

    const { passwordHash, ...safeProfile } = profile;

    const response = {
      ...safeProfile,
      status: profile.status || null,
      deletedAt: profile.deletedAt || null,
      deletionScheduledFor: profile.deletionScheduledFor || null,
      emailVerified,
    };

    console.log("[profile GET uid] Retornando perfil:", {
      uid: response.uid,
      status: response.status,
      deletedAt: response.deletedAt,
      deletionScheduledFor: response.deletionScheduledFor
    });

    return res.json(response);
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return res.status(500).json({ 
      error: "erro_interno",
      message: error.message 
    });
  }
});

/**
 * POST /api/profile
 * 
 * Atualiza o perfil de um usuário.
 * 
 * @body {string} email - Email do usuário (obrigatório)
 * @body {string} name - Nome do usuário (opcional)
 * @body {string} avatar_url - URL do avatar (opcional)
 * 
 * @returns {Object} Dados atualizados do perfil
 */
router.post("/", async (req, res) => {
  try {
    const { email, name, avatar_url } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: "email_obrigatorio" });
    }

    const db = getFirestore();
    const snapshot = await db
      .collection("profiles")
      .where("email", "==", email.trim().toLowerCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "usuario_nao_encontrado" });
    }

    const doc = snapshot.docs[0];
    const uid = doc.id;
    const currentData = doc.data();

    const updateData = {
      ...currentData,
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) {
      updateData.name = name.trim() || "Usuário";
    }

    if (avatar_url !== undefined) {
      updateData.avatar_url = avatar_url || null;
    }

    await db.collection("profiles").doc(uid).set(updateData, { merge: true });

    const { passwordHash, ...profile } = updateData;

    return res.json({
      uid,
      ...profile,
    });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return res.status(500).json({ 
      error: "erro_interno",
      message: error.message 
    });
  }
});

/**
 * POST /api/profile/change-password
 * 
 * Altera a senha de um usuário autenticado
 * Requer ID Token válido no header Authorization
 * 
 * @header Authorization: Bearer <idToken>
 * @body {string} newPassword - Nova senha (obrigatório, mínimo 8 caracteres)
 * 
 * @returns {Object} Confirmação de sucesso
 */
router.post("/change-password", async (req, res) => {
  try {
    // 1) Pega ID Token do header
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) {
      return res.status(401).json({ 
        ok: false,
        error: "missing_bearer_token",
        message: "Token de autenticação não fornecido" 
      });
    }

    const idToken = auth.slice("Bearer ".length);
    const { newPassword } = req.body || {};

    console.log("[change-password] Recebida requisição de mudança de senha");

    // Validar nova senha
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(422).json({ 
        ok: false,
        error: "senha_fraca",
        message: "Senha fraca: mínimo 8 caracteres." 
      });
    }

    const authInstance = getAuth();
    const db = getFirestore();
    const ip = getClientIP(req);
    const userAgent = getUserAgent(req);

    let decoded;
    try {
      decoded = await authInstance.verifyIdToken(idToken, false);
      console.log("[change-password] Token válido para UID:", decoded.uid);
    } catch (e) {
      const code = e?.code || e?.errorInfo?.code || "unknown";
      console.error("[change-password] verifyIdToken error:", code, e?.message);
      
      await logAuditEvent({
        type: "password_change_attempt",
        uid: decoded?.uid,
        email: decoded?.email,
        ip,
        userAgent,
        status: "failure",
        details: `Token inválido: ${code}`
      });
      
      return res.status(401).json({ 
        ok: false,
        error: "invalid_token",
        message: "Token inválido ou expirado" 
      });
    }

    const uid = decoded.uid;
    const email = decoded.email || "";

    // Token deve ter sido emitido há menos de 10 minutos
    const authAgeSec = Math.floor(Date.now() / 1000) - decoded.auth_time;
    if (authAgeSec > 600) {
      console.log("[change-password] Token muito antigo, requer reautenticação");
      await logAuditEvent({
        type: "password_change_attempt",
        uid,
        email,
        ip,
        userAgent,
        status: "failure",
        details: "Token muito antigo, requer reautenticação"
      });
      
      return res.status(401).json({ 
        ok: false,
        error: "token_expirado",
        message: "Reautentique-se para trocar a senha. Faça login novamente." 
      });
    }

    let profile = null;
    try {
      const profileDoc = await db.collection("profiles").doc(uid).get();
      if (profileDoc.exists) {
        profile = profileDoc.data();
      }
    } catch (profileError) {
      console.warn("[change-password] Erro ao buscar perfil:", profileError.message);
    }

    const passwordValidation = validatePassword(newPassword.trim(), email, profile?.name || "");
    if (!passwordValidation.valid) {
      await logAuditEvent({
        type: "password_change_attempt",
        uid,
        email,
        ip,
        userAgent,
        status: "failure",
        details: "Senha não atende aos critérios"
      });
      
      return res.status(422).json({
        ok: false,
        error: "senha_fraca",
        errors: passwordValidation.errors,
        message: "A senha não atende aos critérios de segurança"
      });
    }

    try {
      console.log("[change-password] Atualizando senha no Firebase Auth para UID:", uid);
      await authInstance.updateUser(uid, { 
        password: newPassword.trim() 
      });
      console.log("[change-password] Senha atualizada no Firebase Auth com sucesso");
    } catch (e) {
      const code = e?.errorInfo?.code || e?.code || "unknown";
      console.error("[change-password] updateUser error:", code, e?.message);
      
      await logAuditEvent({
        type: "password_change_error",
        uid,
        email,
        ip,
        userAgent,
        status: "error",
        details: `Erro ao atualizar: ${code} - ${e?.message}`
      });

      if (code === "auth/user-not-found") {
        return res.status(404).json({ 
          ok: false,
          error: "usuario_nao_encontrado",
          message: "Usuário não encontrado no sistema de autenticação." 
        });
      }
      
      if (code === "auth/invalid-password") {
        return res.status(422).json({ 
          ok: false,
          error: "senha_invalida",
          message: "Senha inválida segundo a política do Firebase." 
        });
      }
      
      if (code === "auth/argument-error") {
        return res.status(400).json({ 
          ok: false,
          error: "argumento_invalido",
          message: "Parâmetros inválidos." 
        });
      }

      return res.status(500).json({ 
        ok: false,
        error: "erro_interno",
        message: "Erro ao atualizar a senha." 
      });
    }

    // Revoga todos os refresh tokens (logout global)
    try {
      await authInstance.revokeRefreshTokens(uid);
      console.log("[change-password] Refresh tokens revogados com sucesso");
    } catch (revokeError) {
      console.error("[change-password] Erro ao revogar tokens:", revokeError);
    }

    // Atualizar hash no Firestore (backup)
    try {
      const newPasswordHash = await bcrypt.hash(newPassword.trim(), 10);
      await db.collection("profiles").doc(uid).update({
        passwordHash: newPasswordHash,
        updatedAt: new Date().toISOString(),
      });
      console.log("[change-password] Hash atualizado no Firestore");
    } catch (firestoreError) {
      console.warn("[change-password] Erro ao atualizar hash no Firestore:", firestoreError.message);
    }

    await logAuditEvent({
      type: "password_change",
      uid,
      email,
      ip,
      userAgent,
      status: "success"
    });

    console.log("[change-password] Senha alterada com sucesso!");
    
    return res.status(200).json({ 
      ok: true, 
      message: "Senha alterada com sucesso. Todas as sessões foram encerradas." 
    });

  } catch (error) {
    console.error("[change-password] Erro geral:", error);
    
    await logAuditEvent({
      type: "password_change_error",
      email: req.body?.email?.trim().toLowerCase(),
      ip: getClientIP(req),
      userAgent: getUserAgent(req),
      status: "error",
      details: error.message
    });
    
    return res.status(500).json({ 
      ok: false,
      error: "erro_interno",
      message: error.message || "Erro desconhecido ao alterar senha"
    });
  }
});

export default router;
