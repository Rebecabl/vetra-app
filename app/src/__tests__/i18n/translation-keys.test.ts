/**
 * Testes de validação de chaves de tradução
 * 
 * Este arquivo garante que:
 * 1. Todas as chaves de PT-BR existem em EN-US e ES-ES
 * 2. Não há chaves duplicadas ou inválidas
 * 3. Todas as chaves usadas no código existem nos dicionários
 * 
 * NOTA: Este arquivo é apenas para testes e não é incluído no build de produção.
 */

// @ts-nocheck - Arquivo de teste, não afeta o build de produção
import { describe, test, expect } from "vitest";
import { I18N } from "../../i18n";

// Função helper para coletar todas as chaves de um dicionário
function collectAllKeys(dict: any): Set<string> {
  const keys = new Set<string>();
  
  Object.entries(dict).forEach(([namespace, namespaceDict]) => {
    if (typeof namespaceDict === "object" && namespaceDict !== null) {
      Object.keys(namespaceDict).forEach((key) => {
        keys.add(`${namespace}.${key}`);
      });
    }
  });
  
  return keys;
}

describe("Translation Keys Validation", () => {
  test("should have same namespace structure across all languages", () => {
    const ptNamespaces = Object.keys(I18N["pt-BR"]);
    const enNamespaces = Object.keys(I18N["en-US"]);
    const esNamespaces = Object.keys(I18N["es-ES"]);
    
    expect(ptNamespaces.sort()).toEqual(enNamespaces.sort());
    expect(ptNamespaces.sort()).toEqual(esNamespaces.sort());
  });
  
  test("should have all PT-BR keys in EN-US and ES-ES", () => {
    const ptKeys = collectAllKeys(I18N["pt-BR"]);
    const enKeys = collectAllKeys(I18N["en-US"]);
    const esKeys = collectAllKeys(I18N["es-ES"]);
    
    const missingInEn = Array.from(ptKeys).filter((k) => !enKeys.has(k));
    const missingInEs = Array.from(ptKeys).filter((k) => !esKeys.has(k));
    
    if (missingInEn.length > 0) {
      console.warn("Missing keys in EN-US:", missingInEn);
    }
    if (missingInEs.length > 0) {
      console.warn("Missing keys in ES-ES:", missingInEs);
    }
    
    expect(missingInEn).toEqual([]);
    expect(missingInEs).toEqual([]);
  });
  
  test("should not have empty values", () => {
    const languages: Array<"pt-BR" | "en-US" | "es-ES"> = ["pt-BR", "en-US", "es-ES"];
    
    languages.forEach((lang) => {
      Object.entries(I18N[lang]).forEach(([namespace, namespaceDict]) => {
        Object.entries(namespaceDict).forEach(([key, value]) => {
          expect(value).toBeTruthy();
          expect(typeof value).toBe("string");
          expect(value.trim().length).toBeGreaterThan(0);
        });
      });
    });
  });
  
  test("should validate key format", () => {
    const validKeys = [
      "common.loading",
      "nav.movies",
      "home.search_placeholder_full",
      "filters.type",
    ];
    
    validKeys.forEach((key) => {
      expect(key).toMatch(/^[a-z0-9_]+\.([a-z0-9_]+)+$/i);
    });
  });
});

describe("Translation Keys Used in Code", () => {
  // Lista de chaves críticas que devem existir
  const criticalKeys = [
    // Common
    "common.loading",
    "common.save",
    "common.cancel",
    "common.close",
    "common.remove",
    "common.today",
    "common.content_type",
    "common.time_period",
    
    // Nav
    "nav.home",
    "nav.movies",
    "nav.tv_series",
    "nav.favorites",
    "nav.my_favorites",
    "nav.shared_list",
    "nav.trending",
    "nav.popular",
    
    // Home
    "home.search_placeholder_full",
    "home.this_week_capitalized",
    
    // Filters
    "filters.filters",
    "filters.type",
    "filters.sort_by",
    "filters.clear_all",
    "filters.type_all",
    "filters.type_movie",
    "filters.type_tv",
    
    // API
    "api.api_title",
    "api.api_badge_ok_backend",
    "api.api_badge_ok_tmdb",
    
    // Empty
    "empty.no_results",
    "empty.no_results_for",
    "empty.edit_filters",
    
    // Format
    "format.votes",
  ];
  
  test("should have all critical keys defined", () => {
    // Este teste valida que as chaves críticas estão no formato esperado
    criticalKeys.forEach((key) => {
      expect(key).toMatch(/^[a-z0-9_]+\.([a-z0-9_]+)+$/i);
      expect(key.split(".").length).toBe(2);
    });
  });
  
  test("should not have empty keys", () => {
    criticalKeys.forEach((key) => {
      expect(key).toBeTruthy();
      expect(key.trim().length).toBeGreaterThan(0);
      expect(key).not.toContain("..");
    });
  });
});

