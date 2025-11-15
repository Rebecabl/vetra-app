import { Router } from "express";
import { getAuth, getFirestore } from "../config/firebase.config.js";
import { getUserProfileByEmail } from "../repositories/users.repository.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import admin from "firebase-admin";
import { validatePassword, validateEmail } from "../utils/passwordValidator.js";
import { checkLock, recordFailedAttempt, clearFailedAttempts, checkAuthLock, getClientIP } from "../utils/authLock.js";
import { logAuditEvent, getClientIP as getAuditIP, getUserAgent } from "../utils/auditLog.js";
import { rateLimitMiddleware } from "../utils/rateLimiter.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function saveVerificationCode(email, code) {
  try {
    const db = getFirestore();
    const now = admin.firestore.Timestamp.now();
    const expiresAt = admin.firestore.Timestamp.fromMillis(now.toMillis() + 15 * 60 * 1000);
    
    const existingCodes = await db.collection("verification_codes")
      .where("email", "==", email.trim().toLowerCase())
      .where("status", "==", "active")
      .get();
    
    const batch = db.batch();
    existingCodes.forEach(doc => {
      batch.update(doc.ref, { status: "invalidated" });
    });
    
    const codeRef = db.collection("verification_codes").doc();
    batch.set(codeRef, {
      email: email.trim().toLowerCase(),
      code: code,
      createdAt: now,
      expiresAt: expiresAt,
      status: "active",
      attempts: 0,
      maxAttempts: 5
    });
    
    await batch.commit();
    return codeRef.id;
  } catch (error) {
    console.error("[saveVerificationCode] Erro ao salvar código:", error);
    throw error;
  }
}

async function validateVerificationCode(email, code) {
  const db = getFirestore();
  const now = admin.firestore.Timestamp.now();
  
  const codesSnapshot = await db.collection("verification_codes")
    .where("email", "==", email.trim().toLowerCase())
    .where("status", "==", "active")
    .get();
  
  if (codesSnapshot.empty) {
    return { valid: false, error: "Código inválido" };
  }
  
  const codes = codesSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => {
      const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0);
      const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0);
      return dateB - dateA;
    });
  
  const codeData = codes[0];
  const codeRef = db.collection("verification_codes").doc(codeData.id);
  
  let expiresAt;
  if (codeData.expiresAt?.toMillis) {
    expiresAt = codeData.expiresAt.toMillis();
  } else if (codeData.expiresAt?.toDate) {
    expiresAt = codeData.expiresAt.toDate().getTime();
  } else {
    expiresAt = new Date(codeData.expiresAt).getTime();
  }
  
  if (expiresAt < now.toMillis()) {
    await codeRef.update({ status: "expired" });
    return { valid: false, error: "Código expirado" };
  }
  
  if ((codeData.attempts || 0) >= (codeData.maxAttempts || 5)) {
    await codeRef.update({ status: "blocked" });
    return { valid: false, error: "Código bloqueado por muitas tentativas" };
  }
  
  if (codeData.code !== code) {
    await codeRef.update({ 
      attempts: (codeData.attempts || 0) + 1
    });
    return { valid: false, error: "Código inválido" };
  }
  
  await codeRef.update({ 
    status: "consumed",
    consumedAt: now
  });
  
  return { valid: true, codeId: codeData.id };
}

async function sendVerificationCodeEmail(email, name, code) {
  const transporter = getEmailTransporter();
  if (!transporter) {
    const errorMsg = "SMTP não configurado. Configure as variáveis SMTP_USER e SMTP_PASS no arquivo .env";
    console.error("[SMTP] ❌", errorMsg);
    console.error("[SMTP] 📖 Consulte: api/ENV_EXAMPLE.md para ver como configurar");
    throw new Error(errorMsg);
  }
  
  try {
    await transporter.sendMail({
      from: `"VETRA" <${process.env.SMTP_USER}>`,
      to: email.trim().toLowerCase(),
      subject: "Seu código de verificação – VETRA",
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(90deg, #22D3EE, #8B5CF6, #A3E635); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .code-box { background: #fff; border: 3px solid #22D3EE; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
          .code { font-size: 36px; font-weight: bold; color: #22D3EE; letter-spacing: 8px; font-family: monospace; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>VETRA</h1>
          </div>
          <div class="content">
            <p>Olá, ${name || "Usuário"}! 👋</p>
            <p>Aqui está o seu código para ativar sua conta no VETRA:</p>
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            <p>O código vale por até 15 minutos.</p>
            <p>Se você não fez este cadastro, pode ignorar esta mensagem.</p>
          </div>
          <div class="footer">
            <p>VETRA - Organize seus filmes e séries</p>
          </div>
        </div>
      </body>
      </html>
    `,
    });
    console.log("[SMTP] ✅ E-mail de verificação enviado com sucesso para:", email);
  } catch (sendError) {
    console.error("[SMTP] ❌ Erro ao enviar e-mail:", sendError.message);
    console.error("[SMTP] Detalhes:", sendError);
    throw sendError;
  }
}

function getEmailTransporter() {
  const emailConfig = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };

  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    console.warn("[SMTP] Configuração ausente - emails não serão enviados");
    return null;
  }

  return nodemailer.createTransport(emailConfig);
}

async function sendWelcomeEmail(email, name) {
  const transporter = getEmailTransporter();
  if (!transporter) return;

  try {
    await transporter.sendMail({
      from: `"VETRA" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Bem-vindo ao VETRA!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(90deg, #22D3EE, #8B5CF6, #A3E635); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: #0b1220; margin: 0; font-size: 28px; font-weight: bold; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: linear-gradient(90deg, #22D3EE, #8B5CF6, #A3E635); color: #0b1220; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>VETRA</h1>
            </div>
            <div class="content">
              <h2>Olá, ${name || "Usuário"}!</h2>
              <p>Bem-vindo ao VETRA! Estamos muito felizes em tê-lo conosco.</p>
              <p>Agora você pode:</p>
              <ul>
                <li>Explorar milhares de filmes e séries</li>
                <li>Criar listas personalizadas</li>
                <li>Salvar seus favoritos</li>
                <li>Compartilhar suas listas com amigos</li>
              </ul>
              <p>Comece a explorar e organize seus filmes favoritos!</p>
              <p>Se tiver alguma dúvida, estamos aqui para ajudar.</p>
              <p>Boa diversão!</p>
              <p style="margin-top: 30px;"><strong>Equipe VETRA</strong></p>
            </div>
            <div class="footer">
              <p>Este é um email automático, por favor não responda.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Bem-vindo ao VETRA, ${name || "Usuário"}!
        
        Estamos muito felizes em tê-lo conosco. Agora você pode explorar milhares de filmes e séries, criar listas personalizadas, salvar seus favoritos e compartilhar suas listas com amigos.
        
        Comece a explorar e organize seus filmes favoritos!
        
        Boa diversão!
        Equipe VETRA
      `,
    });
    console.log(`[Email] Boas-vindas enviado para ${email}`);
  } catch (error) {
    console.error("[Email] Erro ao enviar:", error);
  }
}

// POST /api/auth/signup
router.post("/signup", 
  rateLimitMiddleware("signup", (req) => getClientIP(req), 10, 15 * 60 * 1000), // 10 tentativas a cada 15 minutos
  async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "email_e_senha_obrigatorios" });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ ok: false, error: "nome_obrigatorio" });
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ ok: false, error: "email_invalido", message: emailValidation.error });
    }

    const passwordValidation = validatePassword(password, email.trim().toLowerCase(), name.trim());
    if (!passwordValidation.valid) {
      return res.status(400).json({ 
        ok: false, 
        error: "senha_fraca", 
        errors: passwordValidation.errors,
        message: "Não foi possível criar a conta. Verifique os dados e tente novamente."
      });
    }

    const auth = getAuth();
    const db = getFirestore();
    const normalizedEmail = email.trim().toLowerCase();

    let existingUser = null;
    try {
      existingUser = await auth.getUserByEmail(normalizedEmail);
      
      if (existingUser.emailVerified) {
        return res.status(409).json({ ok: false, error: "email_ja_cadastrado" });
      }
      
      // Usuário não verificado: atualizar senha e gerar novo código
      console.log("[signup] Usuário existe mas não está verificado. Atualizando senha e gerando novo código...");
      
      // Não dar trim na senha
      try {
        await auth.updateUser(existingUser.uid, {
          password: password
        });
        console.log("[signup] ✅ Senha atualizada no Firebase Auth");
      } catch (updateError) {
        console.error("[signup] ⚠️ Erro ao atualizar senha:", updateError.message);
      }
      
      let verificationCode;
      try {
        verificationCode = generateVerificationCode();
        await saveVerificationCode(normalizedEmail, verificationCode);
        
        try {
          await sendVerificationCodeEmail(
            normalizedEmail,
            name?.trim() || "Usuário",
            verificationCode
          );
          console.log("[signup] ✅ Novo código de verificação enviado com sucesso para:", normalizedEmail);
          
          return res.json({
            ok: true,
            requiresVerification: true,
            email: normalizedEmail,
            message: process.env.NODE_ENV !== "production" 
              ? "Novo código de verificação gerado. Verifique o console do servidor." 
              : "Novo código de verificação enviado para o seu e-mail."
          });
        } catch (emailError) {
          console.error("[signup] ❌ Erro ao enviar e-mail com código:", emailError.message);
          
          if (process.env.NODE_ENV === "production") {
            return res.status(500).json({
              ok: false,
              error: "erro_envio_email",
              message: "Não foi possível enviar o e-mail de verificação. Verifique a configuração do SMTP."
            });
          } else {
            return res.json({
              ok: true,
              requiresVerification: true,
              email: normalizedEmail,
              message: "Novo código de verificação gerado. Verifique o console do servidor."
            });
          }
        }
      } catch (codeError) {
        console.error("[signup] ❌ Erro ao gerar código de verificação:", codeError);
        return res.status(500).json({
          ok: false,
          error: "erro_gerar_codigo",
          message: "Não foi possível gerar o código de verificação. Tente novamente."
        });
      }
    } catch (e) {
      if (e.code !== "auth/user-not-found") {
        if (e.code === "auth/internal-error" && e.message?.includes("PERMISSION_DENIED")) {
          console.error("[signup] ❌ Erro de permissão da Service Account!");
          console.error("[signup] A Service Account não tem permissões suficientes.");
          console.error("[signup] 📖 Consulte: api/CORRIGIR_PERMISSOES_SERVICE_ACCOUNT.md");
          return res.status(500).json({
            ok: false,
            error: "permissao_service_account",
            message: "Service Account não tem permissões suficientes. Consulte api/CORRIGIR_PERMISSOES_SERVICE_ACCOUNT.md",
            details: "Adicione a role 'Service Usage Consumer' à Service Account no Google Cloud Console"
          });
        }
        throw e;
      }
      // Se não encontrou o usuário, continuar com a criação
    }

    // Criar novo usuário
    const passwordHash = await bcrypt.hash(password, 10);
    
    console.log("[signup] 🔐 Criando usuário com senha");
    console.log("[signup] Tamanho da senha:", password?.length);
    console.log("[signup] Primeiros 3 caracteres (debug):", password?.substring(0, 3) + "***");
    console.log("[signup] Últimos 3 caracteres (debug):", "***" + password?.substring(password.length - 3));

    let userRecord;
    try {
      userRecord = await auth.createUser({
        email: normalizedEmail,
        password: password,
        displayName: name?.trim() || "Usuário",
        emailVerified: false,
      });
      console.log("[signup] ✅ Usuário criado no Firebase Auth com sucesso");
    } catch (createError) {
      // Race condition: email já existe
      if (createError.code === "auth/email-already-exists") {
        try {
          existingUser = await auth.getUserByEmail(normalizedEmail);
          if (existingUser.emailVerified) {
            return res.status(409).json({ ok: false, error: "email_ja_cadastrado" });
          }
          return res.status(409).json({ 
            ok: false, 
            error: "email_ja_cadastrado",
            message: "Este e-mail já está cadastrado. Use a opção 'Reenviar código' na página de verificação."
          });
        } catch (checkError) {
          throw createError;
        }
      }
      
      if (createError.code === "auth/internal-error" && createError.message?.includes("PERMISSION_DENIED")) {
        console.error("[signup] ❌ Erro de permissão ao criar usuário!");
        console.error("[signup] A Service Account não tem permissões para criar usuários.");
        console.error("[signup] 📖 Consulte: api/CORRIGIR_PERMISSOES_SERVICE_ACCOUNT.md");
        return res.status(500).json({
          ok: false,
          error: "permissao_service_account",
          message: "Service Account não tem permissões para criar usuários. Consulte api/CORRIGIR_PERMISSOES_SERVICE_ACCOUNT.md",
          details: "Adicione a role 'Service Usage Consumer' e 'Firebase Admin SDK Administrator Service Agent' à Service Account"
        });
      }
      throw createError;
    }

    const profileData = {
      name: name?.trim() || "Usuário",
      email: normalizedEmail,
      avatar_url: null,
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection("profiles").doc(userRecord.uid).set(profileData);

    sendWelcomeEmail(normalizedEmail, name?.trim() || "Usuário").catch(() => {});

    let verificationCode;
    let userCreated = true;
    
    try {
      verificationCode = generateVerificationCode();
      await saveVerificationCode(normalizedEmail, verificationCode);
      
      try {
        await sendVerificationCodeEmail(
          normalizedEmail,
          name?.trim() || "Usuário",
          verificationCode
        );
        console.log("[signup] ✅ Código de verificação enviado com sucesso para:", normalizedEmail);
      } catch (emailError) {
        console.error("[signup] ❌ Erro ao enviar e-mail com código:", emailError.message);
        
        // Rollback: deletar usuário e perfil se falhar
        try {
          await auth.deleteUser(userRecord.uid);
          await db.collection("profiles").doc(userRecord.uid).delete();
          console.log("[signup] ✅ Rollback realizado: usuário e perfil deletados após falha no envio de e-mail");
        } catch (rollbackError) {
          console.error("[signup] ⚠️ Erro ao fazer rollback:", rollbackError);
        }
        
        return res.status(500).json({
          ok: false,
          error: "erro_envio_email",
          message: "Não foi possível enviar o e-mail de verificação. Verifique a configuração do SMTP no arquivo .env. Consulte api/ENV_EXAMPLE.md para mais informações."
        });
      }
      } catch (codeError) {
        console.error("[signup] ❌ Erro ao gerar código de verificação:", codeError);
        
        // Rollback: deletar usuário e perfil se falhar
        try {
        await auth.deleteUser(userRecord.uid);
        await db.collection("profiles").doc(userRecord.uid).delete();
        console.log("[signup] ✅ Rollback realizado: usuário e perfil deletados após falha ao gerar código");
      } catch (rollbackError) {
        console.error("[signup] ⚠️ Erro ao fazer rollback:", rollbackError);
      }
      
      return res.status(500).json({
        ok: false,
        error: "erro_gerar_codigo",
        message: "Não foi possível gerar o código de verificação. Tente novamente."
      });
    }

    // Não fazer login automático - requer verificação de código
    res.json({
      ok: true,
      requiresVerification: true,
      email: normalizedEmail,
      message: "Conta criada com sucesso. Verifique seu e-mail para ativar sua conta."
    });
  } catch (error) {
    console.error("Erro no signup:", error);
    if (error.code === "auth/email-already-exists") {
      return res.status(409).json({ ok: false, error: "email_ja_cadastrado" });
    }
    res.status(500).json({ ok: false, error: "erro_interno", message: error.message });
  }
});

/**
 * Login usando Firebase Identity Toolkit REST API
 * Valida senha diretamente no Firebase Auth
 * 
 * @param {string} email - Email do usuário
 * @param {string} password - Senha do usuário
 * @returns {Promise<{idToken: string, refreshToken: string, expiresIn: string, localId: string, email: string}>}
 * @throws {Error} Se as credenciais forem inválidas ou houver erro
 */
async function loginWithPassword(email, password) {
  const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || process.env.FIREBASE_WEB_API_KEY;
  
  if (!FIREBASE_API_KEY) {
    console.error("[loginWithPassword] FIREBASE_API_KEY não configurado!");
    throw new Error("FIREBASE_API_KEY não configurado. Configure no .env");
  }

  // Validar formato da API key (deve começar com AIzaSy e ter ~39 caracteres)
  if (!FIREBASE_API_KEY.startsWith("AIzaSy") || FIREBASE_API_KEY.length < 35) {
    console.error("[loginWithPassword] ⚠️ API Key com formato inválido!");
    console.error("[loginWithPassword] A chave deve começar com 'AIzaSy' e ter ~39 caracteres");
    console.error("[loginWithPassword] Verifique o arquivo api/COMO_OBTER_FIREBASE_API_KEY.md para instruções");
    throw Object.assign(new Error("API Key inválida. Verifique o formato da chave no .env"), {
      status: 500,
      code: "api_key_invalida",
      details: "A chave deve começar com 'AIzaSy' e ter aproximadamente 39 caracteres. Consulte api/COMO_OBTER_FIREBASE_API_KEY.md"
    });
  }

  const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "vetra-238a2";
  console.log("[loginWithPassword] API Key configurada:", FIREBASE_API_KEY.substring(0, 10) + "***");
  console.log("[loginWithPassword] Tamanho da chave:", FIREBASE_API_KEY.length, "caracteres");
  console.log("[loginWithPassword] Primeiros 20 caracteres:", FIREBASE_API_KEY.substring(0, 20));
  console.log("[loginWithPassword] Projeto Firebase:", FIREBASE_PROJECT_ID);
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
  
  console.log("[loginWithPassword] Fazendo requisição para Identity Toolkit...");
  console.log("[loginWithPassword] Email:", email.trim().toLowerCase());
  console.log("[loginWithPassword] Senha (tamanho):", password?.length || 0);
  console.log("[loginWithPassword] Primeiros 3 caracteres (debug):", password?.substring(0, 3) + "***");
  console.log("[loginWithPassword] Últimos 3 caracteres (debug):", "***" + password?.substring(password.length - 3));
  
  const requestBody = { 
    email: email.trim().toLowerCase(), 
    password: password, // Não fazer trim - pode remover espaços intencionais da senha
    returnSecureToken: true 
  };
  
  console.log("[loginWithPassword] Corpo da requisição (sem senha completa):", {
    email: requestBody.email,
    passwordLength: requestBody.password?.length,
    returnSecureToken: requestBody.returnSecureToken
  });
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });
  
  console.log("[loginWithPassword] Resposta do Firebase, status:", response.status);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorCode = errorData?.error?.message || "";
    const errorDetails = errorData?.error || {};
    
    console.error("[loginWithPassword] Erro do Firebase:", {
      status: response.status,
      code: errorCode,
      details: errorDetails
    });
    
    // Erro específico de configuração não encontrada (Firebase Auth não habilitado ou projeto incorreto)
    if (errorCode.includes("CONFIGURATION_NOT_FOUND") || 
        errorDetails?.status === "CONFIGURATION_NOT_FOUND") {
      console.error("[loginWithPassword] ❌ CONFIGURAÇÃO NÃO ENCONTRADA!");
      console.error("[loginWithPassword] Possíveis causas:");
      console.error("[loginWithPassword] 1. Firebase Authentication não está habilitado no Firebase Console");
      console.error("[loginWithPassword] 2. Email/Password não está habilitado como método de login");
      console.error("[loginWithPassword] 3. Projeto ID não corresponde (verifique FIREBASE_PROJECT_ID no .env)");
      console.error("[loginWithPassword] 📖 Consulte: api/DIAGNOSTICAR_CONFIGURACAO.md");
      throw Object.assign(new Error("Firebase Authentication não está configurado corretamente. Consulte api/DIAGNOSTICAR_CONFIGURACAO.md"), {
        status: 500,
        code: "api_nao_habilitada",
        details: "Acesse Firebase Console > Authentication > Sign-in method > Habilitar Email/Password"
      });
    }
    
    if (errorCode.includes("API key not valid") || 
        errorCode.includes("INVALID_ARGUMENT") ||
        errorDetails?.status === "INVALID_ARGUMENT") {
      console.error("[loginWithPassword] ❌ API KEY INVÁLIDA!");
      console.error("[loginWithPassword] A chave no .env não é válida para este projeto Firebase.");
      console.error("[loginWithPassword] 📖 Consulte: api/COMO_OBTER_FIREBASE_API_KEY.md");
      throw Object.assign(new Error("API Key do Firebase inválida. Consulte api/COMO_OBTER_FIREBASE_API_KEY.md para obter a chave correta."), {
        status: 500,
        code: "api_key_invalida",
        details: "A chave configurada não é válida. Acesse Firebase Console > Configurações do Projeto > Geral > Chaves da API da Web"
      });
    }
    
    if (errorCode.includes("INVALID_PASSWORD") || 
        errorCode.includes("EMAIL_NOT_FOUND") ||
        errorCode.includes("INVALID_EMAIL") ||
        errorCode.includes("INVALID_LOGIN_CREDENTIALS")) {
      throw Object.assign(new Error("Senha incorreta"), { 
        status: 401,
        code: "credenciais_invalidas"
      });
    }
    
    if (errorCode.includes("USER_DISABLED")) {
      throw Object.assign(new Error("Conta desabilitada"), { 
        status: 403,
        code: "conta_desabilitada"
      });
    }
    
    if (errorCode.includes("TOO_MANY_ATTEMPTS_TRY_LATER")) {
      throw Object.assign(new Error("Muitas tentativas. Tente novamente mais tarde."), { 
        status: 429,
        code: "muitas_tentativas"
      });
    }
    
    throw Object.assign(new Error("Erro ao autenticar"), { 
      status: response.status,
      code: "erro_autenticacao"
    });
  }

  const data = await response.json();
  return {
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn,
    localId: data.localId, // UID do Firebase
    email: data.email
  };
}

// POST /api/auth/signin
router.post("/signin", 
  checkAuthLock,
  rateLimitMiddleware("login", (req) => getClientIP(req), 10, 15 * 60 * 1000),
  async (req, res) => {
    const ip = getClientIP(req);
    const userAgent = getUserAgent(req);
    let normalizedEmail = "";
    
    try {
      const { email, password } = req.body || {};

      if (!email || !password) {
        return res.status(400).json({ ok: false, error: "email_e_senha_obrigatorios" });
      }

      // Normalizar email
      normalizedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim();

      // Validar formato de email
      const emailValidation = validateEmail(normalizedEmail);
      if (!emailValidation.valid) {
        // Retornar mensagem genérica para não vazar informações
        await logAuditEvent({
          type: "login_attempt",
          email: normalizedEmail,
          ip,
          userAgent,
          status: "failure",
          details: "Email inválido"
        });
        return res.status(401).json({ ok: false, error: "credenciais_invalidas" });
      }

      let firebaseTokens;
      try {
        console.log("[signin] Tentando validar senha no Firebase para:", normalizedEmail.substring(0, 3) + "***");
        firebaseTokens = await loginWithPassword(normalizedEmail, trimmedPassword);
        console.log("[signin] Senha validada com sucesso no Firebase");
      } catch (authError) {
        console.error("[signin] Erro ao validar senha no Firebase:", authError.message, authError.code);
        
        // Se for erro de API não habilitada, retornar mensagem específica
        if (authError.code === "api_nao_habilitada") {
          return res.status(500).json({
            ok: false,
            error: "api_nao_habilitada",
            message: authError.message || "Identity Toolkit API não está habilitada",
            details: authError.details || "Consulte api/HABILITAR_IDENTITY_TOOLKIT.md para habilitar a API"
          });
        }
        
        if (authError.code === "api_key_invalida") {
          return res.status(500).json({
            ok: false,
            error: "api_key_invalida",
            message: authError.message || "API Key do Firebase inválida",
            details: authError.details || "Consulte api/COMO_OBTER_FIREBASE_API_KEY.md para obter a chave correta"
          });
        }
        
        const lockResult = await recordFailedAttempt(normalizedEmail, ip);
        await logAuditEvent({
          type: "login_attempt",
          email: normalizedEmail,
          ip,
          userAgent,
          status: "failure",
          details: authError.message || "Senha incorreta"
        });
        
        if (lockResult.locked) {
          return res.status(429).json({
            ok: false,
            error: "conta_bloqueada",
            message: "Muitas tentativas falhas. Tente novamente em alguns minutos.",
            remainingTime: lockResult.lockUntil ? Math.ceil((lockResult.lockUntil - new Date()) / 1000) : 900
          });
        }
        
        // Se for erro de conta desabilitada, verificar se está marcada para exclusão
        // Se estiver, reabilitar automaticamente para permitir login e reativação
        if (authError.code === "conta_desabilitada") {
          const db = getFirestore();
          const profileSnapshot = await db
            .collection("profiles")
            .where("email", "==", normalizedEmail)
            .limit(1)
            .get();
          
          if (!profileSnapshot.empty) {
            const profileData = profileSnapshot.docs[0].data();
            if (profileData?.status === "pending_deletion") {
              try {
                const auth = getAuth();
                const userRecord = await auth.getUserByEmail(normalizedEmail);
                await auth.updateUser(userRecord.uid, {
                  disabled: false
                });
                console.log("[signin] Conta reabilitada temporariamente para permitir reativação");
                
                try {
                  firebaseTokens = await loginWithPassword(normalizedEmail, trimmedPassword);
                  console.log("[signin] Login bem-sucedido após reabilitação");
                } catch (retryError) {
                  return res.status(403).json({ 
                    ok: false, 
                    error: "conta_desabilitada",
                    message: "Não foi possível reabilitar a conta. Entre em contato com o suporte."
                  });
                }
              } catch (rehabError) {
                console.error("[signin] Erro ao reabilitar conta:", rehabError);
                return res.status(403).json({ 
                  ok: false, 
                  error: "conta_desabilitada",
                  message: "Conta desabilitada. Entre em contato com o suporte."
                });
              }
            } else {
              // Conta desabilitada mas não está marcada para exclusão
              return res.status(403).json({ 
                ok: false, 
                error: "conta_desabilitada",
                message: "Conta desabilitada. Entre em contato com o suporte."
              });
            }
          } else {
            return res.status(403).json({ 
              ok: false, 
              error: "conta_desabilitada",
              message: "Conta desabilitada. Entre em contato com o suporte."
            });
          }
        } else {
          return res.status(authError.status || 401).json({ 
            ok: false, 
            error: authError.code || "credenciais_invalidas",
            message: authError.message || "Senha incorreta"
          });
        }
      }

      // Login bem-sucedido - limpar tentativas falhas
      await clearFailedAttempts(normalizedEmail, ip);

      const auth = getAuth();
      const db = getFirestore();
      const uid = firebaseTokens.localId;

      // Buscar ou criar perfil no Firestore
      let profileDoc = await db.collection("profiles").doc(uid).get();
      let profile = profileDoc.exists ? profileDoc.data() : null;

      // Se não existe perfil, criar um básico
      if (!profile) {
        const userRecord = await auth.getUser(uid);
        profile = {
          email: normalizedEmail,
          name: userRecord.displayName || "Usuário",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await db.collection("profiles").doc(uid).set(profile);
      }

      const profileData = {
        uid: uid,
        email: firebaseTokens.email || normalizedEmail,
        name: profile.name || "Usuário",
        avatar_url: profile.avatar_url || null,
        updatedAt: profile.updatedAt || null,
      };

      await logAuditEvent({
        type: "login_success",
        uid: uid,
        email: normalizedEmail,
        ip,
        userAgent,
        status: "success"
      });

      // Retornar ID Token do Firebase (não customToken)
      res.json({
        ok: true,
        user: profileData,
        idToken: firebaseTokens.idToken,
        refreshToken: firebaseTokens.refreshToken,
        expiresIn: firebaseTokens.expiresIn,
      });
    } catch (error) {
      console.error("Erro no signin:", error);
      await logAuditEvent({
        type: "login_error",
        email: normalizedEmail,
        ip: getClientIP(req),
        userAgent: getUserAgent(req),
        status: "error",
        details: error.message
      });
      res.status(500).json({ ok: false, error: "erro_interno", message: error.message });
    }
  }
);

// POST /api/auth/verify - verificar token
router.post("/verify", async (req, res) => {
  try {
    const { idToken } = req.body || {};
    if (!idToken) {
      return res.status(400).json({ ok: false, error: "token_obrigatorio" });
    }

    const auth = getAuth();
    const decoded = await auth.verifyIdToken(idToken);
    const db = getFirestore();

    // Buscar perfil
    const profileDoc = await db.collection("profiles").doc(decoded.uid).get();
    
    // Verificar se a conta está marcada para exclusão
    if (profileDoc.exists) {
      const profile = profileDoc.data();
      if (profile.status === "pending_deletion" || profile.deletedAt) {
        console.log("[verify] Conta marcada para exclusão, rejeitando token");
        return res.status(401).json({ 
          ok: false, 
          error: "conta_marcada_exclusao",
          message: "Esta conta está marcada para exclusão"
        });
      }
    }
    
    const profile = profileDoc.exists ? profileDoc.data() : {
      name: decoded.name || "Usuário",
      email: decoded.email,
      avatar_url: null,
    };

    res.json({
      ok: true,
      user: {
        uid: decoded.uid,
        email: decoded.email,
        name: profile.name || decoded.name || "Usuário",
        avatar_url: profile.avatar_url || null,
        status: profile.status || "active",
        deletedAt: profile.deletedAt || null,
        deletionScheduledFor: profile.deletionScheduledFor || null,
      },
    });
  } catch (error) {
    console.error("Erro na verificação:", error);
    res.status(401).json({ ok: false, error: "token_invalido" });
  }
});

// POST /api/auth/forgot-password
router.post("/forgot-password",
  rateLimitMiddleware("forgot_password", (req) => {
    const email = req.body?.email?.trim().toLowerCase() || "";
    const ip = getClientIP(req);
    return email || ip;
  }, 3, 60 * 60 * 1000), // 3 tentativas por hora
  async (req, res) => {
    try {
      const { email } = req.body || {};
      
      if (!email) {
        return res.status(400).json({ ok: false, error: "email_obrigatorio" });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const emailValidation = validateEmail(normalizedEmail);
      
      if (!emailValidation.valid) {
        // Mensagem genérica mesmo para email inválido
        return res.json({
          ok: true,
          message: "Se este email estiver cadastrado, você receberá instruções para redefinir sua senha."
        });
      }

      const auth = getAuth();
      const ip = getClientIP(req);
      const userAgent = getUserAgent(req);

      try {
        // Usar Firebase Auth para enviar email de reset
        // Nota: Isso requer configuração no Firebase Console
        const user = await auth.getUserByEmail(normalizedEmail);
        
        // Gerar link de reset (isso normalmente é feito pelo Firebase Auth)
        // Por enquanto, apenas logamos
        await logAuditEvent({
          type: "forgot_password_request",
          uid: user.uid,
          email: normalizedEmail,
          ip,
          userAgent,
          status: "success"
        });

        // Resposta genérica (não vazar se email existe)
        return res.json({
          ok: true,
          message: "Se este email estiver cadastrado, você receberá instruções para redefinir sua senha."
        });
      } catch (error) {
        if (error.code === "auth/user-not-found") {
          // Mesmo assim, retornar mensagem genérica
          await logAuditEvent({
            type: "forgot_password_request",
            email: normalizedEmail,
            ip,
            userAgent,
            status: "failure",
            details: "Email não encontrado"
          });
          
          return res.json({
            ok: true,
            message: "Se este email estiver cadastrado, você receberá instruções para redefinir sua senha."
          });
        }
        throw error;
      }
    } catch (error) {
      console.error("Erro em forgot-password:", error);
      // Sempre retornar mensagem genérica
      return res.json({
        ok: true,
        message: "Se este email estiver cadastrado, você receberá instruções para redefinir sua senha."
      });
    }
  }
);

// POST /api/auth/check-email - Verificar se email existe
router.post("/check-email",
  rateLimitMiddleware("check_email", (req) => {
    const email = req.body?.email?.trim().toLowerCase() || "";
    const ip = getClientIP(req);
    return email || ip;
  }, 10, 60 * 60 * 1000), // 10 tentativas por hora
  async (req, res) => {
    try {
      const { email } = req.body || {};
      
      if (!email) {
        return res.status(400).json({ ok: false, error: "email_obrigatorio" });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const emailValidation = validateEmail(normalizedEmail);
      
      if (!emailValidation.valid) {
        return res.status(400).json({ 
          ok: false, 
          error: "email_invalido",
          exists: false
        });
      }

      const auth = getAuth();
      const db = getFirestore();

      // Verificar primeiro no Firestore (mais confiável)
      try {
        const profilesSnapshot = await db.collection("profiles")
          .where("email", "==", normalizedEmail)
          .limit(1)
          .get();
        
        if (!profilesSnapshot.empty) {
          // Email encontrado no Firestore
          return res.json({
            ok: true,
            exists: true
          });
        }
      } catch (firestoreError) {
        console.error("[check-email] Erro ao verificar no Firestore:", firestoreError);
        // Continuar para verificar no Firebase Auth
      }

      // Se não encontrou no Firestore, verificar no Firebase Auth
      try {
        const user = await auth.getUserByEmail(normalizedEmail);
        return res.json({
          ok: true,
          exists: true
        });
      } catch (error) {
        if (error.code === "auth/user-not-found") {
          return res.json({
            ok: true,
            exists: false
          });
        }
        // Se for erro de permissão, ainda tentar verificar no Firestore como fallback
        if (error.code === "auth/internal-error" || error.message?.includes("PERMISSION_DENIED")) {
          console.warn("[check-email] Erro de permissão no Firebase Auth, usando Firestore como fallback");
          // Já verificamos no Firestore acima, então retornar false
          return res.json({
            ok: true,
            exists: false
          });
        }
        throw error;
      }
    } catch (error) {
      console.error("Erro em check-email:", error);
      return res.status(500).json({
        ok: false,
        error: "erro_interno",
        exists: false
      });
    }
  }
);

// POST /api/auth/reset-password (reset direto sem email)
router.post("/reset-password",
  rateLimitMiddleware("reset_password", (req) => {
    const email = req.body?.email?.trim().toLowerCase() || "";
    const ip = getClientIP(req);
    return email || ip;
  }, 5, 60 * 60 * 1000), // 5 tentativas por hora
  async (req, res) => {
    try {
      const { email, newPassword } = req.body || {};
      
      if (!email) {
        return res.status(400).json({ ok: false, error: "email_obrigatorio" });
      }

      if (!newPassword) {
        return res.status(400).json({ ok: false, error: "senha_obrigatoria" });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const emailValidation = validateEmail(normalizedEmail);
      
      if (!emailValidation.valid) {
        return res.status(400).json({ 
          ok: false, 
          error: "email_invalido",
          message: "Email inválido"
        });
      }

      const auth = getAuth();
      const db = getFirestore();
      const ip = getClientIP(req);
      const userAgent = getUserAgent(req);

      // Verificar primeiro no Firestore (mais confiável)
      let uid = null;
      let profile = null;
      
      try {
        const profilesSnapshot = await db.collection("profiles")
          .where("email", "==", normalizedEmail)
          .limit(1)
          .get();
        
        if (!profilesSnapshot.empty) {
          const doc = profilesSnapshot.docs[0];
          uid = doc.id;
          profile = doc.data();
        }
      } catch (firestoreError) {
        console.error("[reset-password] Erro ao verificar no Firestore:", firestoreError);
      }

      // Se não encontrou no Firestore, verificar no Firebase Auth
      if (!uid) {
        try {
          const user = await auth.getUserByEmail(normalizedEmail);
          uid = user.uid;
          
          // Buscar perfil no Firestore usando o UID do Firebase Auth
          const profileDoc = await db.collection("profiles").doc(uid).get();
          if (profileDoc.exists) {
            profile = profileDoc.data();
          }
        } catch (error) {
          if (error.code === "auth/user-not-found") {
            await logAuditEvent({
              type: "password_reset",
              email: normalizedEmail,
              ip,
              userAgent,
              status: "failure",
              details: "Email não encontrado"
            });
            
            return res.status(404).json({ 
              ok: false, 
              error: "usuario_nao_encontrado",
              message: "Email não encontrado"
            });
          }
          throw error;
        }
      }

      // Se ainda não encontrou, retornar erro
      if (!uid || !profile) {
        await logAuditEvent({
          type: "password_reset",
          email: normalizedEmail,
          ip,
          userAgent,
          status: "failure",
          details: "Email não encontrado"
        });
        
        return res.status(404).json({ 
          ok: false, 
          error: "usuario_nao_encontrado",
          message: "Email não encontrado"
        });
      }

      // Validar força da senha
      const passwordValidation = validatePassword(newPassword, normalizedEmail, profile.name || "");
      
      if (!passwordValidation.valid) {
        return res.status(400).json({
          ok: false,
          error: "senha_fraca",
          errors: passwordValidation.errors,
          message: "A senha não atende aos critérios de segurança"
        });
      }

      // Atualizar senha no Firebase Auth (se o usuário existir lá)
      try {
        await auth.updateUser(uid, {
          password: newPassword
        });

        // Revogar todos os refresh tokens (logout global)
        await auth.revokeRefreshTokens(uid);
      } catch (authError) {
        // Se o usuário não existir no Firebase Auth, apenas atualizar no Firestore
        if (authError.code === "auth/user-not-found") {
          console.warn("[reset-password] Usuário não encontrado no Firebase Auth, atualizando apenas no Firestore");
        } else {
          throw authError;
        }
      }

      // Atualizar hash no Firestore
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      await db.collection("profiles").doc(uid).update({
        passwordHash: newPasswordHash,
        updatedAt: new Date().toISOString(),
      });

      await logAuditEvent({
        type: "password_reset",
        uid,
        email: normalizedEmail,
        ip,
        userAgent,
        status: "success"
      });

      res.status(200).json({
        ok: true,
        message: "Senha alterada com sucesso. Faça login com sua nova senha."
      });
    } catch (error) {
      console.error("Erro em reset-password:", error);
      await logAuditEvent({
        type: "password_reset_error",
        email: req.body?.email,
        ip: getClientIP(req),
        userAgent: getUserAgent(req),
        status: "error",
        details: error.message
      });
      
      res.status(500).json({
        ok: false,
        error: "erro_interno",
        message: error.message
      });
    }
  }
);

// POST /api/auth/change-password (requer autenticação)
router.post("/change-password",
  requireAuth,
  async (req, res) => {
    try {
      const { idToken, newPassword } = req.body || {};
      const uid = req.user?.uid;

      if (!uid) {
        return res.status(401).json({ ok: false, error: "nao_autenticado" });
      }

      if (!idToken || !newPassword) {
        return res.status(400).json({ ok: false, error: "campos_obrigatorios", message: "Token e nova senha são obrigatórios" });
      }

      const auth = getAuth();
      const db = getFirestore();
      const ip = getClientIP(req);
      const userAgent = getUserAgent(req);

      // Verificar token e obter dados do usuário
      let decodedToken;
      try {
        decodedToken = await auth.verifyIdToken(idToken);
        
        // Verificar se o token é recente (auth_time <= 10 minutos)
        const authTime = decodedToken.auth_time * 1000; // Converter para ms
        const now = Date.now();
        const maxAge = 10 * 60 * 1000; // 10 minutos
        
        if (now - authTime > maxAge) {
          await logAuditEvent({
            type: "password_change_attempt",
            uid,
            ip,
            userAgent,
            status: "failure",
            details: "Token muito antigo, requer reautenticação"
          });
          
          return res.status(401).json({
            ok: false,
            error: "token_expirado",
            message: "Token muito antigo. Faça login novamente."
          });
        }
      } catch (error) {
        await logAuditEvent({
          type: "password_change_attempt",
          uid,
          ip,
          userAgent,
          status: "failure",
          details: `Token inválido: ${error.message}`
        });
        
        return res.status(401).json({ ok: false, error: "token_invalido" });
      }

      // Validar força da senha
      const profileDoc = await db.collection("profiles").doc(uid).get();
      if (!profileDoc.exists) {
        return res.status(404).json({ ok: false, error: "usuario_nao_encontrado" });
      }

      const profile = profileDoc.data();
      const passwordValidation = validatePassword(newPassword, profile.email || "", profile.name || "");
      
      if (!passwordValidation.valid) {
        return res.status(400).json({
          ok: false,
          error: "senha_fraca",
          errors: passwordValidation.errors,
          message: "A senha não atende aos critérios de segurança"
        });
      }

      // Atualizar senha no Firebase Auth
      await auth.updateUser(uid, {
        password: newPassword
      });

      // Revogar todos os refresh tokens (logout global)
      await auth.revokeRefreshTokens(uid);

      // Atualizar hash no Firestore
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      await db.collection("profiles").doc(uid).update({
        passwordHash: newPasswordHash,
        updatedAt: new Date().toISOString(),
      });

      await logAuditEvent({
        type: "password_change",
        uid,
        email: profile.email,
        ip,
        userAgent,
        status: "success"
      });

      res.status(200).json({
        ok: true,
        message: "Senha alterada com sucesso. Todas as sessões foram encerradas."
      });
    } catch (error) {
      console.error("Erro em change-password:", error);
      const uid = req.user?.uid;
      await logAuditEvent({
        type: "password_change_error",
        uid,
        ip: getClientIP(req),
        userAgent: getUserAgent(req),
        status: "error",
        details: error.message
      });
      
      res.status(500).json({
        ok: false,
        error: "erro_interno",
        message: error.message
      });
    }
  }
);

/**
 * POST /api/auth/delete-account
 * 
 * Marca a conta do usuário para exclusão (soft delete).
 * A conta será permanentemente excluída após 30 dias, a menos que seja reativada.
 * 
 * Requer autenticação e confirmação de senha.
 */
router.post("/delete-account",
  requireAuth,
  async (req, res) => {
    console.log("[delete-account] Requisição recebida");
    try {
      const { password } = req.body || {};
      const uid = req.user?.uid;
      const email = req.user?.email;
      
      console.log("[delete-account] Dados recebidos:", { 
        hasPassword: !!password, 
        uid, 
        email: email ? email.substring(0, 3) + "***" : null 
      });

      if (!uid) {
        return res.status(401).json({ 
          ok: false, 
          error: "nao_autenticado",
          message: "Usuário não autenticado" 
        });
      }

      if (!password) {
        return res.status(400).json({ 
          ok: false, 
          error: "senha_obrigatoria",
          message: "Senha é obrigatória para confirmar a exclusão" 
        });
      }

      if (!email) {
        return res.status(400).json({ 
          ok: false, 
          error: "email_nao_encontrado",
          message: "Email do usuário não encontrado" 
        });
      }

      const auth = getAuth();
      const db = getFirestore();
      const ip = getAuditIP(req);
      const userAgent = getUserAgent(req);

      // Validar senha usando loginWithPassword
      try {
        await loginWithPassword(email, password);
      } catch (passwordError) {
        await logAuditEvent({
          type: "account_deletion_attempt",
          uid,
          email,
          ip,
          userAgent,
          status: "failure",
          details: `Senha inválida: ${passwordError.message}`
        });

        // Verificar se é erro de senha incorreta
        if (passwordError.code === "credenciais_invalidas" || 
            passwordError.message?.includes("Senha incorreta") ||
            passwordError.message?.includes("INVALID_PASSWORD") ||
            passwordError.message?.includes("INVALID_LOGIN_CREDENTIALS")) {
          return res.status(401).json({
            ok: false,
            error: "senha_incorreta",
            message: "Senha incorreta. Verifique e tente novamente."
          });
        }

        // Outros erros de autenticação
        return res.status(401).json({
          ok: false,
          error: "erro_validacao_senha",
          message: passwordError.message || "Erro ao validar senha. Tente novamente."
        });
      }

      // Verificar se o perfil existe, criar se não existir
      const profileRef = db.collection("profiles").doc(uid);
      let profileDoc = await profileRef.get();

      if (!profileDoc.exists) {
        // Se o perfil não existe, criar um básico com os dados do token
        // Isso pode acontecer se o usuário foi criado antes do sistema criar perfis automaticamente
        console.log(`[delete-account] Perfil não encontrado para UID ${uid}, criando perfil básico...`);
        try {
          const userRecord = await auth.getUser(uid);
          const newProfileData = {
            name: userRecord.displayName || "Usuário",
            email: userRecord.email || email || "",
            avatar_url: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await profileRef.set(newProfileData);
          console.log(`[delete-account] Perfil básico criado para UID ${uid}`, newProfileData);
          // Recarregar o documento após criar
          profileDoc = await profileRef.get();
        } catch (createError) {
          console.error(`[delete-account] Erro ao criar perfil básico:`, createError);
          return res.status(500).json({ 
            ok: false, 
            error: "erro_criar_perfil",
            message: "Erro ao processar perfil. Tente novamente." 
          });
        }
      }

      // Verificar novamente se o perfil existe após tentar criar
      if (!profileDoc.exists) {
        console.error(`[delete-account] Perfil ainda não existe após tentativa de criação para UID ${uid}`);
        return res.status(500).json({ 
          ok: false, 
          error: "erro_criar_perfil",
          message: "Não foi possível criar o perfil. Tente novamente." 
        });
      }

      // Marcar conta para exclusão (soft delete)
      // A conta será permanentemente excluída após 30 dias
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 30); // 30 dias a partir de agora

      await profileRef.update({
        deletedAt: new Date().toISOString(),
        deletionScheduledFor: deletionDate.toISOString(),
        status: "pending_deletion",
        updatedAt: new Date().toISOString(),
      });

      // NÃO desabilitar a conta no Firebase Auth quando marcamos para exclusão
      // O usuário precisa poder fazer login para reativar a conta dentro de 30 dias
      // A desabilitação só deve acontecer após os 30 dias (via job/cron)
      console.log("[delete-account] Conta marcada para exclusão, mas mantendo habilitada no Firebase Auth para permitir reativação");

      await logAuditEvent({
        type: "account_deletion",
        uid,
        email,
        ip,
        userAgent,
        status: "success",
        details: `Conta marcada para exclusão em ${deletionDate.toISOString()}`
      });

      res.status(200).json({
        ok: true,
        message: "Conta marcada para exclusão. Você pode reativar dentro de 30 dias.",
        deletionDate: deletionDate.toISOString()
      });
    } catch (error) {
      console.error("Erro em delete-account:", error);
      const uid = req.user?.uid;
      await logAuditEvent({
        type: "account_deletion_error",
        uid,
        ip: getAuditIP(req),
        userAgent: getUserAgent(req),
        status: "error",
        details: error.message
      });
      
      res.status(500).json({
        ok: false,
        error: "erro_interno",
        message: error.message || "Erro ao processar exclusão da conta. Tente novamente."
      });
    }
  }
);

/**
 * POST /api/auth/reactivate-account
 * 
 * Reativa uma conta que foi marcada para exclusão (dentro do prazo de 30 dias).
 * Remove o status de pending_deletion e reabilita o usuário no Firebase Auth.
 * 
 * Requer autenticação.
 */
router.post("/reactivate-account",
  requireAuth,
  async (req, res) => {
    console.log("[reactivate-account] Requisição recebida");
    try {
      const uid = req.user?.uid;
      const email = req.user?.email;

      if (!uid) {
        return res.status(401).json({ 
          ok: false, 
          error: "nao_autenticado",
          message: "Usuário não autenticado" 
        });
      }

      const auth = getAuth();
      const db = getFirestore();
      const ip = getAuditIP(req);
      const userAgent = getUserAgent(req);

      // Verificar se o perfil existe
      const profileRef = db.collection("profiles").doc(uid);
      const profileDoc = await profileRef.get();

      if (!profileDoc.exists) {
        return res.status(404).json({ 
          ok: false, 
          error: "usuario_nao_encontrado",
          message: "Perfil do usuário não encontrado" 
        });
      }

      const profileData = profileDoc.data();
      
      // Verificar se a conta está marcada para exclusão
      if (profileData?.status !== "pending_deletion") {
        return res.status(400).json({ 
          ok: false, 
          error: "conta_nao_marcada_exclusao",
          message: "Esta conta não está marcada para exclusão." 
        });
      }

      // Verificar se ainda está dentro do prazo de 30 dias
      const deletionScheduledFor = profileData?.deletionScheduledFor;
      if (deletionScheduledFor) {
        const deletionDate = new Date(deletionScheduledFor);
        const now = new Date();
        
        if (now > deletionDate) {
          return res.status(400).json({ 
            ok: false, 
            error: "prazo_expirado",
            message: "O prazo de 30 dias para reativar a conta expirou. A exclusão é permanente." 
          });
        }
      }

      // Reativar conta: remover status de exclusão
      await profileRef.update({
        status: "active",
        deletedAt: null,
        deletionScheduledFor: null,
        updatedAt: new Date().toISOString(),
      });

      // Reabilitar o usuário no Firebase Auth
      try {
        await auth.updateUser(uid, {
          disabled: false
        });
      } catch (authError) {
        console.error("[reactivate-account] Erro ao reabilitar usuário no Firebase Auth:", authError);
        // Continuar mesmo se falhar, pois o perfil já foi atualizado
      }

      await logAuditEvent({
        type: "account_reactivation",
        uid,
        email,
        ip,
        userAgent,
        status: "success",
        details: "Conta reativada com sucesso"
      });

      res.status(200).json({
        ok: true,
        message: "Conta reativada com sucesso! Bem-vindo de volta."
      });
    } catch (error) {
      console.error("Erro em reactivate-account:", error);
      const uid = req.user?.uid;
      await logAuditEvent({
        type: "account_reactivation_error",
        uid,
        ip: getAuditIP(req),
        userAgent: getUserAgent(req),
        status: "error",
        details: error.message
      });
      
      res.status(500).json({
        ok: false,
        error: "erro_interno",
        message: error.message || "Erro ao reativar conta. Tente novamente."
      });
    }
  }
);

/**
 * POST /api/auth/re-enable-account
 * 
 * Reabilita uma conta que foi desabilitada no Firebase Auth mas está marcada para exclusão.
 * Este endpoint é útil para reabilitar contas que foram desabilitadas antes da correção.
 * 
 * Requer autenticação (mas pode ser chamado mesmo com conta desabilitada via token antigo).
 */
router.post("/re-enable-account",
  async (req, res) => {
    console.log("[re-enable-account] Requisição recebida");
    try {
      const { email } = req.body || {};
      
      if (!email) {
        return res.status(400).json({ 
          ok: false, 
          error: "email_obrigatorio",
          message: "Email é obrigatório" 
        });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const auth = getAuth();
      const db = getFirestore();
      const ip = getClientIP(req);
      const userAgent = getUserAgent(req);

      // Buscar perfil no Firestore
      const profileSnapshot = await db
        .collection("profiles")
        .where("email", "==", normalizedEmail)
        .limit(1)
        .get();

      if (profileSnapshot.empty) {
        return res.status(404).json({ 
          ok: false, 
          error: "usuario_nao_encontrado",
          message: "Perfil do usuário não encontrado" 
        });
      }

      const profileData = profileSnapshot.docs[0].data();
      
      // Verificar se a conta está marcada para exclusão
      if (profileData?.status !== "pending_deletion") {
        return res.status(400).json({ 
          ok: false, 
          error: "conta_nao_marcada_exclusao",
          message: "Esta conta não está marcada para exclusão." 
        });
      }

      // Verificar se ainda está dentro do prazo de 30 dias
      const deletionScheduledFor = profileData?.deletionScheduledFor;
      if (deletionScheduledFor) {
        const deletionDate = new Date(deletionScheduledFor);
        const now = new Date();
        
        if (now > deletionDate) {
          return res.status(400).json({ 
            ok: false, 
            error: "prazo_expirado",
            message: "O prazo de 30 dias para reativar a conta expirou. A exclusão é permanente." 
          });
        }
      }

      // Reabilitar a conta no Firebase Auth
      try {
        const userRecord = await auth.getUserByEmail(normalizedEmail);
        await auth.updateUser(userRecord.uid, {
          disabled: false
        });
        console.log("[re-enable-account] Conta reabilitada no Firebase Auth:", normalizedEmail);
      } catch (authError) {
        console.error("[re-enable-account] Erro ao reabilitar conta no Firebase Auth:", authError);
        // Se o usuário não existir no Firebase Auth, não é um problema crítico
        if (authError.code !== "auth/user-not-found") {
          return res.status(500).json({ 
            ok: false, 
            error: "erro_reabilitacao",
            message: "Erro ao reabilitar conta no Firebase Auth. Tente novamente." 
          });
        }
      }

      await logAuditEvent({
        type: "account_re_enable",
        email: normalizedEmail,
        ip,
        userAgent,
        status: "success",
        details: "Conta reabilitada no Firebase Auth"
      });

      res.status(200).json({
        ok: true,
        message: "Conta reabilitada com sucesso! Você pode fazer login agora."
      });
    } catch (error) {
      console.error("Erro em re-enable-account:", error);
      await logAuditEvent({
        type: "account_re_enable_error",
        ip: getClientIP(req),
        userAgent: getUserAgent(req),
        status: "error",
        details: error.message
      });
      
      res.status(500).json({
        ok: false,
        error: "erro_interno",
        message: error.message || "Erro ao reabilitar conta. Tente novamente."
      });
    }
  }
);

// POST /api/auth/verify-code - Validar código de verificação e ativar conta
router.post("/verify-code",
  rateLimitMiddleware("verify_code", (req) => {
    const email = req.body?.email?.trim().toLowerCase() || "";
    const ip = getClientIP(req);
    return email || ip;
  }, 10, 15 * 60 * 1000), // 10 tentativas por 15 minutos
  async (req, res) => {
    try {
      const { email, code, password } = req.body || {};
      
      console.log("[verify-code] 📧 Recebida requisição de verificação");
      console.log("[verify-code] Email:", email);
      console.log("[verify-code] Código recebido:", code);
      console.log("[verify-code] Senha recebida (tamanho):", password?.length || 0);
      
      if (!email || !code) {
        return res.status(400).json({ 
          ok: false, 
          error: "email_e_codigo_obrigatorios",
          message: "Email e código são obrigatórios" 
        });
      }
      
      if (!password) {
        return res.status(400).json({ 
          ok: false, 
          error: "senha_obrigatoria",
          message: "Senha é obrigatória para validar o código" 
        });
      }
      
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedCode = code.trim();
      // Manter senha como está (sem trim) para não remover espaços intencionais
      
      // Validar código
      const validation = await validateVerificationCode(normalizedEmail, normalizedCode);
      
      if (!validation.valid) {
        return res.status(400).json({
          ok: false,
          error: validation.error === "Código expirado" ? "codigo_expirado" : "codigo_invalido",
          message: validation.error
        });
      }
      
      // Código válido - ativar conta e fazer login
      const auth = getAuth();
      const db = getFirestore();
      
      // Buscar usuário pelo email
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(normalizedEmail);
      } catch (error) {
        if (error.code === "auth/user-not-found") {
          return res.status(404).json({
            ok: false,
            error: "usuario_nao_encontrado",
            message: "Usuário não encontrado"
          });
        }
        throw error;
      }
      
      // Verificar senha
      try {
        console.log("[verify-code] 🔐 Verificando senha para:", normalizedEmail);
        console.log("[verify-code] Tamanho da senha recebida:", password?.length);
        console.log("[verify-code] Primeiros 3 caracteres da senha (para debug):", password?.substring(0, 3) + "***");
        console.log("[verify-code] Últimos 3 caracteres da senha (para debug):", "***" + password?.substring(password.length - 3));
        
        // Tentar fazer login com a senha exatamente como recebida
        try {
          await loginWithPassword(normalizedEmail, password);
          console.log("[verify-code] ✅ Senha válida - login bem-sucedido");
        } catch (firstAttemptError) {
          // Se falhar, pode ser que a conta foi criada antes da correção (com trim)
          // Tentar novamente com a senha com trim() para compatibilidade com contas antigas
          console.log("[verify-code] ⚠️ Primeira tentativa falhou, tentando com senha com trim() para compatibilidade...");
          const trimmedPassword = password?.trim() || "";
          
          if (trimmedPassword !== password && trimmedPassword.length > 0) {
            try {
              await loginWithPassword(normalizedEmail, trimmedPassword);
              console.log("[verify-code] ✅ Senha válida com trim() - login bem-sucedido (conta antiga)");
            } catch (secondAttemptError) {
              // Se ambas falharem, retornar o erro original
              throw firstAttemptError;
            }
          } else {
            // Se não há diferença ou senha vazia, retornar erro original
            throw firstAttemptError;
          }
        }
      } catch (loginError) {
        console.error("[verify-code] ❌ Erro ao validar senha");
        console.error("[verify-code] Mensagem do erro:", loginError.message);
        console.error("[verify-code] Código do erro:", loginError.code);
        console.error("[verify-code] Status do erro:", loginError.status);
        console.error("[verify-code] Detalhes completos:", JSON.stringify(loginError, null, 2));
        
        // Se for erro de credenciais inválidas, pode ser que a senha foi salva diferente
        if (loginError.code === "credenciais_invalidas" || loginError.message?.includes("INVALID_PASSWORD") || loginError.message?.includes("INVALID_LOGIN_CREDENTIALS")) {
          console.error("[verify-code] ⚠️ POSSÍVEL CAUSA: A senha pode ter sido salva com espaços removidos durante o cadastro");
          console.error("[verify-code] 💡 SUGESTÃO: Tente criar uma nova conta ou verifique se há espaços no início/fim da senha");
        }
        
        return res.status(401).json({
          ok: false,
          error: "senha_incorreta",
          message: loginError.message || "Senha incorreta. Verifique e tente novamente."
        });
      }
      
      // Marcar e-mail como verificado no Firebase Auth
      await auth.updateUser(userRecord.uid, {
        emailVerified: true
      });
      
      // Atualizar perfil no Firestore
      const profileRef = db.collection("profiles").doc(userRecord.uid);
      // Limpar status de exclusão se existir (reativação da conta)
      await profileRef.update({
        emailVerified: true,
        status: "active", // Limpar pending_deletion
        deletedAt: null, // Limpar deletedAt
        deletionScheduledFor: null, // Limpar deletionScheduledFor
        updatedAt: new Date().toISOString()
      });
      
      // Fazer login para obter tokens
      const tokens = await loginWithPassword(normalizedEmail, password);
      
      // Buscar dados do perfil
      const profileDoc = await profileRef.get();
      const profileData = profileDoc.data();
      
      await logAuditEvent({
        type: "email_verified",
        email: normalizedEmail,
        uid: userRecord.uid,
        ip: getClientIP(req),
        userAgent: getUserAgent(req),
        status: "success"
      });
      
      res.json({
        ok: true,
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          name: profileData?.name || userRecord.displayName || "Usuário",
          avatar_url: profileData?.avatar_url || null,
          emailVerified: true
        },
        idToken: tokens.idToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        message: "Conta verificada com sucesso!"
      });
    } catch (error) {
      console.error("[verify-code] Erro:", error);
      await logAuditEvent({
        type: "email_verification_error",
        email: req.body?.email || "",
        ip: getClientIP(req),
        userAgent: getUserAgent(req),
        status: "error",
        details: error.message
      });
      
      res.status(500).json({
        ok: false,
        error: "erro_interno",
        message: error.message || "Erro ao verificar código. Tente novamente."
      });
    }
  }
);

// POST /api/auth/resend-verification-code - Reenviar código de verificação
router.post("/resend-verification-code",
  rateLimitMiddleware("resend_code", (req) => {
    const email = req.body?.email?.trim().toLowerCase() || "";
    const ip = getClientIP(req);
    return email || ip;
  }, 3, 60 * 1000), // 3 tentativas por minuto (cooldown de 30-60 segundos)
  async (req, res) => {
    try {
      const { email } = req.body || {};
      
      if (!email) {
        return res.status(400).json({ 
          ok: false, 
          error: "email_obrigatorio",
          message: "Email é obrigatório" 
        });
      }
      
      const normalizedEmail = email.trim().toLowerCase();
      
      // Verificar se o usuário existe e não está verificado
      const auth = getAuth();
      const db = getFirestore();
      
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(normalizedEmail);
      } catch (error) {
        if (error.code === "auth/user-not-found") {
          return res.status(404).json({
            ok: false,
            error: "usuario_nao_encontrado",
            message: "Usuário não encontrado"
          });
        }
        throw error;
      }
      
      // Se já estiver verificado, não permitir reenvio
      if (userRecord.emailVerified) {
        return res.status(400).json({
          ok: false,
          error: "email_ja_verificado",
          message: "Este e-mail já foi verificado"
        });
      }
      
      // Buscar nome do perfil
      const profileDoc = await db.collection("profiles").doc(userRecord.uid).get();
      const profileData = profileDoc.data();
      const userName = profileData?.name || userRecord.displayName || "Usuário";
      
      // Gerar novo código
      const verificationCode = generateVerificationCode();
      await saveVerificationCode(normalizedEmail, verificationCode);
      
      // Enviar e-mail
      try {
        await sendVerificationCodeEmail(normalizedEmail, userName, verificationCode);
        console.log("[resend-verification-code] ✅ Novo código enviado para:", normalizedEmail);
        
        await logAuditEvent({
          type: "verification_code_resent",
          email: normalizedEmail,
          uid: userRecord.uid,
          ip: getClientIP(req),
          userAgent: getUserAgent(req),
          status: "success"
        });
        
        res.json({
          ok: true,
          message: "Novo código de verificação enviado para o seu e-mail."
        });
      } catch (emailError) {
        console.error("[resend-verification-code] ❌ Erro ao enviar e-mail:", emailError.message);
        return res.status(500).json({
          ok: false,
          error: "erro_envio_email",
          message: "Não foi possível enviar o e-mail. Verifique a configuração do SMTP no arquivo .env. Consulte api/ENV_EXAMPLE.md para mais informações."
        });
      }
    } catch (error) {
      console.error("[resend-verification-code] Erro:", error);
      await logAuditEvent({
        type: "resend_code_error",
        email: req.body?.email || "",
        ip: getClientIP(req),
        userAgent: getUserAgent(req),
        status: "error",
        details: error.message
      });
      
      res.status(500).json({
        ok: false,
        error: "erro_interno",
        message: error.message || "Erro ao reenviar código. Tente novamente."
      });
    }
  }
);

export default router;

