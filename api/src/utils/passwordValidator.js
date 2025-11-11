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
    errors.push("A senha precisa ter pelo menos 8 caracteres");
    return { valid: false, errors };
  }

  // Verificar grupos: letras, dígitos, símbolos
  const hasLetters = /[a-zA-Z]/.test(password);
  const hasDigits = /\d/.test(password);
  const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const groupsCount = [hasLetters, hasDigits, hasSymbols].filter(Boolean).length;

  // Deve conter pelo menos 2 dos 3 grupos
  if (groupsCount < 2) {
    errors.push("Use pelo menos dois tipos: letras, números ou símbolos");
    return { valid: false, errors };
  }

  // Verificar se contém nome completo (case-insensitive)
  if (name) {
    const nameLower = name.trim().toLowerCase();
    const passwordLower = password.toLowerCase();
    if (nameLower && passwordLower.includes(nameLower)) {
      errors.push("Sua senha não deve conter seu nome ou e-mail");
      return { valid: false, errors };
    }
  }

  // Verificar se contém email completo (case-insensitive)
  if (email) {
    const emailLower = email.trim().toLowerCase();
    const passwordLower = password.toLowerCase();
    if (emailLower && passwordLower.includes(emailLower)) {
      errors.push("Sua senha não deve conter seu nome ou e-mail");
      return { valid: false, errors };
    }
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

