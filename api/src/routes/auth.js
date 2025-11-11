import { Router } from "express";
import { getAuth, getFirestore } from "../config/firebase.config.js";
import { getUserProfileByEmail } from "../repositories/users.repository.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { validatePassword, validateEmail } from "../utils/passwordValidator.js";
import { checkLock, recordFailedAttempt, clearFailedAttempts, checkAuthLock, getClientIP } from "../utils/authLock.js";
import { logAuditEvent, getClientIP as getAuditIP, getUserAgent } from "../utils/auditLog.js";
import { rateLimitMiddleware } from "../utils/rateLimiter.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

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
    // Não falha o registro se o email falhar
  }
}

// POST /api/auth/signup
router.post("/signup", 
  rateLimitMiddleware("signup", (req) => getClientIP(req), 5, 15 * 60 * 1000),
  async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    // Validações básicas
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "email_e_senha_obrigatorios" });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ ok: false, error: "nome_obrigatorio" });
    }

    // Validar email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ ok: false, error: "email_invalido", message: emailValidation.error });
    }

    // Validar senha
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

    try {
      await auth.getUserByEmail(email);
      return res.status(409).json({ ok: false, error: "email_ja_cadastrado" });
    } catch (e) {
      if (e.code !== "auth/user-not-found") {
        // Se for erro de permissão, retornar mensagem específica
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
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let userRecord;
    try {
      userRecord = await auth.createUser({
        email: email.trim().toLowerCase(),
        password: password,
        displayName: name?.trim() || "Usuário",
        emailVerified: false,
      });
    } catch (createError) {
      // Tratar erro de permissão ao criar usuário
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
      email: email.trim().toLowerCase(),
      avatar_url: null,
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection("profiles").doc(userRecord.uid).set(profileData);

    sendWelcomeEmail(email.trim().toLowerCase(), name?.trim() || "Usuário").catch(() => {});

    // Para signup, precisamos fazer login para obter idToken
    // (não podemos usar customToken porque o frontend precisa de idToken)
    let idToken, refreshToken, expiresIn;
    try {
      const tokens = await loginWithPassword(email.trim().toLowerCase(), password);
      idToken = tokens.idToken;
      refreshToken = tokens.refreshToken;
      expiresIn = tokens.expiresIn;
      console.log("[signup] idToken obtido após criação do usuário");
    } catch (tokenError) {
      console.error("[signup] Erro ao obter idToken após signup:", tokenError);
      // Se falhar, criar customToken como fallback (mas não é ideal)
      const customToken = await auth.createCustomToken(userRecord.uid);
      return res.json({
        ok: true,
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          name: profileData.name,
          avatar_url: null,
        },
        customToken,
        warning: "idToken não disponível, usando customToken"
      });
    }

    res.json({
      ok: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        name: profileData.name,
        avatar_url: null,
      },
      idToken,
      refreshToken,
      expiresIn,
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
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      email: email.trim().toLowerCase(), 
      password: password.trim(), 
      returnSecureToken: true 
    }),
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
    
    // Erro específico de API key inválida
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
    
    // Mapear erros do Firebase para mensagens genéricas
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

      // Validar senha no Firebase usando Identity Toolkit
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
        
        // Se for erro de API key, retornar mensagem específica (erro de configuração, não de autenticação)
        if (authError.code === "api_key_invalida") {
          return res.status(500).json({
            ok: false,
            error: "api_key_invalida",
            message: authError.message || "API Key do Firebase inválida",
            details: authError.details || "Consulte api/COMO_OBTER_FIREBASE_API_KEY.md para obter a chave correta"
          });
        }
        
        // Registrar tentativa falha (apenas para erros de autenticação, não de configuração)
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
        
        // Retornar mensagem de senha incorreta
        return res.status(authError.status || 401).json({ 
          ok: false, 
          error: authError.code || "credenciais_invalidas",
          message: authError.message || "Senha incorreta"
        });
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

export default router;

