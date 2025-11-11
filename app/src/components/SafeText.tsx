import React from "react";
import { useLang } from "../i18n";

/**
 * Componente wrapper para renderização segura de textos traduzidos.
 * Evita que chaves de tradução apareçam cruas na UI quando:
 * - A chave não existe no dicionário
 * - O namespace não foi carregado
 * - O valor retornado é igual à chave (fallback)
 */
interface SafeTextProps {
  /** Chave de tradução (ex: "common.loading" ou "nav.movies") */
  translationKey: string;
  /** Variáveis para interpolação (ex: { count: 5 }) */
  vars?: Record<string, string | number>;
  /** Texto de fallback caso a tradução não seja encontrada */
  fallback?: string;
  /** Componente HTML a ser usado (padrão: span) */
  as?: keyof JSX.IntrinsicElements;
  /** Classes CSS adicionais */
  className?: string;
  /** Props adicionais para o elemento */
  [key: string]: any;
}

/**
 * Verifica se uma string parece ser uma chave de tradução não resolvida
 */
function looksLikeTranslationKey(str: string): boolean {
  // Padrão: chaves geralmente têm formato namespace.key ou são alfanuméricas com underscores/pontos
  // e não contêm espaços ou caracteres especiais comuns em textos reais
  if (!str || str.length < 3) return false;
  
  // Se contém espaços, provavelmente é texto real
  if (/\s/.test(str)) return false;
  
  // Se parece com chave (namespace.key ou snake_case)
  const keyPattern = /^[a-z0-9_]+(\.[a-z0-9_]+)+$/i;
  if (keyPattern.test(str)) return true;
  
  // Se é tudo minúsculas com underscores/pontos e sem caracteres especiais
  const simpleKeyPattern = /^[a-z0-9_.-]{4,}$/i;
  if (simpleKeyPattern.test(str) && !/[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/.test(str)) {
    return true;
  }
  
  return false;
}

export const SafeText: React.FC<SafeTextProps> = ({ 
  translationKey, 
  vars, 
  fallback,
  as: Component = "span",
  className,
  ...props 
}) => {
  const { t } = useLang();
  
  let translated = t(translationKey, vars);
  
  // Se a tradução retornou a própria chave ou parece ser uma chave não resolvida
  if (translated === translationKey || looksLikeTranslationKey(translated)) {
    // Usar fallback se fornecido, senão usar string vazia ou logar warning
    if (fallback) {
      translated = fallback;
    } else {
      // Em desenvolvimento, logar warning
      if (import.meta.env?.MODE === "development" || import.meta.env?.DEV) {
        console.warn(`[SafeText] Translation key not found or unresolved: "${translationKey}". Value: "${translated}"`);
      }
      // Em produção, retornar string vazia para não quebrar layout
      translated = "";
    }
  }
  
  if (!translated) {
    return null;
  }
  
  return <Component className={className} {...props}>{translated}</Component>;
};

/**
 * Hook para uso seguro de traduções em componentes funcionais
 */
export function useSafeText() {
  const { t, lang } = useLang();
  
  const safeT = (key: string, vars?: Record<string, string | number>, fallback?: string): string => {
    let translated = t(key, vars);
    
    if (translated === key || looksLikeTranslationKey(translated)) {
      if (fallback) {
        return fallback;
      }
      if (import.meta.env?.MODE === "development" || import.meta.env?.DEV) {
        console.warn(`[useSafeText] Translation key not found: "${key}"`);
      }
      return "";
    }
    
    return translated;
  };
  
  return { safeT, t, lang };
}

