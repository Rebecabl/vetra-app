/**
 * Sistema de logs de auditoria
 * 
 * Registra ações importantes de autenticação e segurança.
 */

import { getFirestore } from "../config/firebase.config.js";

/**
 * Registra um evento de auditoria
 * 
 * @param {Object} event - Dados do evento
 * @param {string} event.type - Tipo do evento (login, password_change, etc.)
 * @param {string} event.uid - UID do usuário (opcional)
 * @param {string} event.email - Email do usuário (opcional)
 * @param {string} event.ip - IP do cliente
 * @param {string} event.userAgent - User agent do cliente
 * @param {string} event.status - Status (success, failure, error)
 * @param {string} event.details - Detalhes adicionais (opcional)
 */
export async function logAuditEvent(event) {
  const db = getFirestore();
  
  try {
    await db.collection("audit_logs").add({
      ...event,
      timestamp: new Date(),
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[auditLog] Erro ao registrar evento:", error);
    // Não falhar a operação principal se o log falhar
  }
}

/**
 * Obtém o IP do cliente da requisição
 */
export function getClientIP(req) {
  return req.ip || 
         req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         'unknown';
}

/**
 * Obtém o User-Agent da requisição
 */
export function getUserAgent(req) {
  return req.headers['user-agent'] || 'unknown';
}

