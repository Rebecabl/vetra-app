/**
 * Sistema de bloqueio por tentativas de login
 * 
 * Gerencia contadores de falhas e bloqueios temporários para prevenir brute force.
 */

import { getFirestore } from "../config/firebase.config.js";

const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos
const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos

/**
 * Obtém o IP do cliente da requisição
 */
function getClientIP(req) {
  return req.ip || 
         req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         'unknown';
}

/**
 * Obtém a chave de bloqueio para um email e IP
 */
function getLockKey(email, ip) {
  return `auth_lock:${email}:${ip}`;
}

/**
 * Verifica se um email/IP está bloqueado
 * 
 * @param {string} email - Email do usuário
 * @param {string} ip - IP do cliente
 * @returns {Promise<{locked: boolean, lockUntil?: Date, remainingTime?: number}>}
 */
export async function checkLock(email, ip) {
  const db = getFirestore();
  const lockKey = getLockKey(email, ip);
  
  try {
    const lockDoc = await db.collection("auth_locks").doc(lockKey).get();
    
    if (!lockDoc.exists) {
      return { locked: false };
    }
    
    const lockData = lockDoc.data();
    const lockUntil = lockData.lockUntil?.toDate();
    const now = new Date();
    
    if (lockUntil && lockUntil > now) {
      const remainingTime = Math.ceil((lockUntil - now) / 1000); // segundos
      return {
        locked: true,
        lockUntil,
        remainingTime
      };
    }
    
    // Lock expirado, remover
    await db.collection("auth_locks").doc(lockKey).delete();
    return { locked: false };
  } catch (error) {
    console.error("[authLock] Erro ao verificar lock:", error);
    // Em caso de erro, não bloquear (fail open)
    return { locked: false };
  }
}

/**
 * Registra uma tentativa falha de login
 * 
 * @param {string} email - Email do usuário
 * @param {string} ip - IP do cliente
 * @returns {Promise<{locked: boolean, attempts: number, lockUntil?: Date}>}
 */
export async function recordFailedAttempt(email, ip) {
  const db = getFirestore();
  const lockKey = getLockKey(email, ip);
  const now = new Date();
  const lockUntil = new Date(now.getTime() + LOCK_DURATION_MS);
  
  try {
    const lockDoc = await db.collection("auth_locks").doc(lockKey).get();
    
    let attempts = 1;
    let firstFailAt = now;
    
    if (lockDoc.exists) {
      const lockData = lockDoc.data();
      const dataFirstFail = lockData.firstFailAt?.toDate() || now;
      const windowStart = new Date(now.getTime() - WINDOW_MS);
      
      // Se a primeira falha foi dentro da janela, incrementar
      if (dataFirstFail > windowStart) {
        attempts = (lockData.attempts || 0) + 1;
        firstFailAt = dataFirstFail;
      } else {
        // Janela expirada, reiniciar contador
        attempts = 1;
        firstFailAt = now;
      }
    }
    
    const shouldLock = attempts >= MAX_FAILED_ATTEMPTS;
    
    await db.collection("auth_locks").doc(lockKey).set({
      email: email.toLowerCase(),
      ip,
      attempts,
      firstFailAt: firstFailAt,
      lastFailAt: now,
      lockUntil: shouldLock ? lockUntil : null,
      locked: shouldLock,
      createdAt: lockDoc.exists ? lockDoc.data().createdAt : now,
      updatedAt: now,
    }, { merge: true });
    
    return {
      locked: shouldLock,
      attempts,
      lockUntil: shouldLock ? lockUntil : null
    };
  } catch (error) {
    console.error("[authLock] Erro ao registrar tentativa falha:", error);
    return { locked: false, attempts: 0 };
  }
}

/**
 * Limpa o contador de tentativas falhas (chamado após login bem-sucedido)
 * 
 * @param {string} email - Email do usuário
 * @param {string} ip - IP do cliente
 */
export async function clearFailedAttempts(email, ip) {
  const db = getFirestore();
  const lockKey = getLockKey(email, ip);
  
  try {
    await db.collection("auth_locks").doc(lockKey).delete();
  } catch (error) {
    console.error("[authLock] Erro ao limpar tentativas:", error);
    // Não falhar se não conseguir limpar
  }
}

/**
 * Middleware para verificar bloqueio antes de processar login
 */
export function checkAuthLock(req, res, next) {
  const email = req.body?.email?.trim().toLowerCase();
  const ip = getClientIP(req);
  
  if (!email) {
    return next(); // Deixar outras validações tratarem
  }
  
  checkLock(email, ip)
    .then(({ locked, remainingTime }) => {
      if (locked) {
        return res.status(429).json({
          ok: false,
          error: "conta_bloqueada",
          message: "Muitas tentativas falhas. Tente novamente em alguns minutos.",
          remainingTime
        });
      }
      next();
    })
    .catch((error) => {
      console.error("[authLock] Erro no middleware:", error);
      next(); // Fail open
    });
}

export { getClientIP };

