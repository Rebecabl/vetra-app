import { getAuth } from "../config/firebase.config.js";

/**
 * Middleware que exige autenticação via Firebase ID Token
 * Valida o token e verifica se não foi revogado
 * 
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 */
export async function requireAuth(req, res, next) {
  try {
    const hdr = req.headers.authorization || "";
    const m = hdr.match(/^Bearer\s+(.+)$/i);
    if (!m) {
      return res.status(401).json({ 
        ok: false,
        error: "missing_bearer_token",
        message: "Token de autenticação não fornecido" 
      });
    }

    const idToken = m[1];
    
    // Verificar token e se foi revogado (checkRevoked: true)
    const decoded = await getAuth().verifyIdToken(idToken, true);
    
    // Anexar dados do usuário ao request
    req.user = { 
      uid: decoded.uid, 
      email: decoded.email || null,
      auth_time: decoded.auth_time,
      exp: decoded.exp
    };
    
    next();
  } catch (e) {
    // Token inválido, expirado ou revogado
    return res.status(401).json({ 
      ok: false,
      error: "invalid_token", 
      message: "Token inválido ou expirado. Faça login novamente.",
      details: e.message 
    });
  }
}
