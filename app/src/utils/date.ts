import type { Lang } from "../i18n";

/**
 * Formata uma data de acordo com o idioma selecionado
 */
export const formatDate = (dateStr: string | Date, options: Intl.DateTimeFormatOptions = {}, lang: Lang = "pt-BR"): string => {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const localeMap: Record<Lang, string> = {
    "pt-BR": "pt-BR",
    "en-US": "en-US",
    "es-ES": "es-ES",
  };
  return date.toLocaleDateString(localeMap[lang] || "pt-BR", options);
};

/**
 * Formata uma data de forma curta (pt-BR)
 */
export const formatDateShort = (dateStr: string | Date): string => {
  if (!dateStr) return "";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
};

