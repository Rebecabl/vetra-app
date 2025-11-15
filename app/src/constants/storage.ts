export const KEY_FAVS = "vetra:favorites";
export const KEY_LISTS = "vetra:lists";
export const KEY_STATES = "vetra:userstates";
export const KEY_HISTORY = "vetra:watch_history";
export const KEY_STATS = "vetra:user_stats";

export const getStorageKey = (baseKey: string, userId?: string | null): string => {
  if (userId) {
    return `${baseKey}:${userId}`;
  }
  return baseKey;
};

export const clearUserData = (userId?: string | null) => {
  if (!userId) {
    localStorage.removeItem(KEY_FAVS);
    localStorage.removeItem(KEY_LISTS);
    localStorage.removeItem(KEY_STATES);
    localStorage.removeItem(KEY_HISTORY);
    localStorage.removeItem(KEY_STATS);
    return;
  }
  
  localStorage.removeItem(getStorageKey(KEY_FAVS, userId));
  localStorage.removeItem(getStorageKey(KEY_LISTS, userId));
  localStorage.removeItem(getStorageKey(KEY_STATES, userId));
  localStorage.removeItem(getStorageKey(KEY_HISTORY, userId));
  localStorage.removeItem(getStorageKey(KEY_STATS, userId));
  
  // Limpar chaves globais antigas (migração)
  localStorage.removeItem(KEY_FAVS);
  localStorage.removeItem(KEY_LISTS);
  localStorage.removeItem(KEY_STATES);
  localStorage.removeItem(KEY_HISTORY);
  localStorage.removeItem(KEY_STATS);
};

