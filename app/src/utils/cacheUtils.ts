/**
 * Utilitários para gerenciamento de cache em memória
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Cria um gerenciador de cache simples em memória
 */
export function createCache<T>() {
  const cache = new Map<string, CacheEntry<T>>();

  const get = (key: string): T | null => {
    const entry = cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      cache.delete(key);
      return null;
    }
    
    return entry.data;
  };

  const set = (key: string, data: T, ttl: number) => {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  };

  const deleteKey = (key: string) => {
    cache.delete(key);
  };

  const clear = () => {
    cache.clear();
  };

  return { get, set, delete: deleteKey, clear };
}

/**
 * Deduplica itens entre arrays baseado em chave única (media:id)
 */
export function dedupeItems<T extends { id: number; media?: string }>(
  newItems: T[],
  existingItems: T[]
): T[] {
  const existingKeys = new Set(
    existingItems.map(m => `${m.media || "movie"}:${m.id}`)
  );
  return newItems.filter(m => !existingKeys.has(`${m.media || "movie"}:${m.id}`));
}

/**
 * Cria funções helper para gerenciar cache de linhas (rows)
 */
export function createRowCacheHelpers<T>() {
  const cache = new Map<string, { data: T[]; timestamp: number; ttl: number }>();

  const clearCachedRow = (key: string) => {
    cache.delete(key);
  };

  const getCachedRow = (key: string): T[] | null => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    return null;
  };

  const setCachedRow = (key: string, data: T[], ttl: number) => {
    cache.set(key, { data, timestamp: Date.now(), ttl });
  };

  return { clearCachedRow, getCachedRow, setCachedRow };
}

