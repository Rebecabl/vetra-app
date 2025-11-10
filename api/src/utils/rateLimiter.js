/**
 * Rate Limiter simples usando Firestore
 * 
 * Limita requisições por IP/email em janelas de tempo.
 */

import { getFirestore } from "../config/firebase.config.js";

/**
 * Verifica e incrementa contador de rate limit
 * 
 * @param {string} key - Chave única (ex: "forgot_password:email@example.com" ou "login:192.168.1.1")
 * @param {number} maxRequests - Número máximo de requisições
 * @param {number} windowMs - Janela de tempo em milissegundos
 * @returns {Promise<{allowed: boolean, remaining: number, resetAt: Date}>}
 */
export async function checkRateLimit(key, maxRequests = 5, windowMs = 15 * 60 * 1000) {
  const db = getFirestore();
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);
  
  try {
    const rateLimitDoc = await db.collection("rate_limits").doc(key).get();
    
    if (!rateLimitDoc.exists) {
      // Primeira requisição
      await db.collection("rate_limits").doc(key).set({
        count: 1,
        firstRequestAt: now,
        lastRequestAt: now,
        resetAt: new Date(now.getTime() + windowMs),
      });
      
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: new Date(now.getTime() + windowMs)
      };
    }
    
    const data = rateLimitDoc.data();
    const firstRequest = data.firstRequestAt?.toDate() || now;
    
    // Se a janela expirou, reiniciar
    if (firstRequest < windowStart) {
      await db.collection("rate_limits").doc(key).set({
        count: 1,
        firstRequestAt: now,
        lastRequestAt: now,
        resetAt: new Date(now.getTime() + windowMs),
      });
      
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: new Date(now.getTime() + windowMs)
      };
    }
    
    // Verificar se excedeu o limite
    const count = (data.count || 0) + 1;
    
    if (count > maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: data.resetAt?.toDate() || new Date(now.getTime() + windowMs)
      };
    }
    
    // Incrementar contador
    await db.collection("rate_limits").doc(key).update({
      count,
      lastRequestAt: now,
    });
    
    return {
      allowed: true,
      remaining: maxRequests - count,
      resetAt: data.resetAt?.toDate() || new Date(now.getTime() + windowMs)
    };
  } catch (error) {
    console.error("[rateLimiter] Erro:", error);
    // Fail open - permitir requisição em caso de erro
    return {
      allowed: true,
      remaining: maxRequests,
      resetAt: new Date(now.getTime() + windowMs)
    };
  }
}

/**
 * Middleware de rate limiting
 * 
 * @param {string} keyPrefix - Prefixo da chave (ex: "forgot_password")
 * @param {Function} getKey - Função para obter a chave da requisição (recebe req, retorna string)
 * @param {number} maxRequests - Número máximo de requisições
 * @param {number} windowMs - Janela de tempo em milissegundos
 */
export function rateLimitMiddleware(keyPrefix, getKey, maxRequests = 5, windowMs = 15 * 60 * 1000) {
  return async (req, res, next) => {
    try {
      const key = `${keyPrefix}:${getKey(req)}`;
      const result = await checkRateLimit(key, maxRequests, windowMs);
      
      if (!result.allowed) {
        const resetSeconds = Math.ceil((result.resetAt - new Date()) / 1000);
        return res.status(429).json({
          ok: false,
          error: "rate_limit_exceeded",
          message: "Muitas requisições. Tente novamente mais tarde.",
          resetAt: result.resetAt.toISOString(),
          resetIn: resetSeconds
        });
      }
      
      // Adicionar headers de rate limit
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAt.getTime() / 1000));
      
      next();
    } catch (error) {
      console.error("[rateLimiter] Erro no middleware:", error);
      next(); // Fail open
    }
  };
}

