/**
 * Utilitários de compartilhamento
 * 
 * Funções auxiliares para criar e gerenciar links compartilháveis.
 * 
 * @module utils/share
 */

/**
 * Gera um slug único para compartilhamento
 * @returns {string} Slug aleatório
 */
export function generateShareSlug(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Constrói URL de compartilhamento
 * @param {string} slug - Slug do compartilhamento
 * @param {string} baseUrl - URL base (opcional)
 * @returns {string} URL completa
 */
export function buildShareUrl(slug: string, baseUrl?: string): string {
  const base = baseUrl || window.location.origin;
  return `${base}/share/${slug}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch (error) {
    console.error('Erro ao copiar:', error);
    return false;
  }
}

