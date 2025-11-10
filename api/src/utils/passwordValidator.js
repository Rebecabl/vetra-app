/**
 * Validador de senha
 * 
 * Valida força da senha conforme políticas de segurança.
 */

/**
 * Valida se a senha atende aos critérios de segurança
 * @param {string} password - Senha a ser validada
 * @param {string} email - Email do usuário (para verificar se senha contém partes do email)
 * @param {string} name - Nome do usuário (para verificar se senha contém partes do nome)
 * @returns {{ valid: boolean; errors: string[] }} - Resultado da validação
 */
export function validatePassword(password, email = "", name = "") {
  const errors = [];

  if (!password || typeof password !== "string") {
    return { valid: false, errors: ["Senha é obrigatória"] };
  }

  // Tamanho mínimo
  if (password.length < 8) {
    errors.push("A senha deve ter no mínimo 8 caracteres");
  }

  // Maiúscula
  if (!/[A-Z]/.test(password)) {
    errors.push("A senha deve conter pelo menos uma letra maiúscula");
  }

  // Minúscula
  if (!/[a-z]/.test(password)) {
    errors.push("A senha deve conter pelo menos uma letra minúscula");
  }

  // Dígito
  if (!/\d/.test(password)) {
    errors.push("A senha deve conter pelo menos um número");
  }

  // Caractere especial
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("A senha deve conter pelo menos um caractere especial (!@#$%^&*...)");
  }

  // Verificar se contém partes do nome
  if (name) {
    const nameParts = name.toLowerCase().split(/\s+/).filter(p => p.length > 2);
    const passwordLower = password.toLowerCase();
    for (const part of nameParts) {
      if (passwordLower.includes(part)) {
        errors.push("A senha não deve conter partes do seu nome");
        break;
      }
    }
  }

  // Verificar se contém partes do email
  if (email) {
    const emailParts = email.toLowerCase().split("@")[0].split(/[._-]/).filter(p => p.length > 2);
    const passwordLower = password.toLowerCase();
    for (const part of emailParts) {
      if (passwordLower.includes(part)) {
        errors.push("A senha não deve conter partes do seu email");
        break;
      }
    }
  }

  // Verificar senhas comuns
  const commonPasswords = [
    "password", "12345678", "123456789", "1234567890",
    "qwerty", "abc123", "password123", "admin123",
    "senha123", "123456", "password1", "welcome123"
  ];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push("Esta senha é muito comum. Escolha uma senha mais segura");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Valida formato de email
 * @param {string} email - Email a ser validado
 * @returns {{ valid: boolean; error?: string }} - Resultado da validação
 */
export function validateEmail(email) {
  if (!email || typeof email !== "string") {
    return { valid: false, error: "Email é obrigatório" };
  }

  const trimmed = email.trim().toLowerCase();

  // Formato básico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: "Formato de email inválido" };
  }

  // Verificar domínios temporários comuns (opcional - pode ser expandido)
  const tempDomains = [
    "10minutemail.com", "tempmail.com", "guerrillamail.com",
    "mailinator.com", "throwaway.email", "temp-mail.org"
  ];
  const domain = trimmed.split("@")[1]?.toLowerCase();
  if (domain && tempDomains.some(d => domain.includes(d))) {
    return { valid: false, error: "Emails temporários não são permitidos" };
  }

  return { valid: true };
}

