import type { MovieT } from "../types/movies";

export const KEY_ACTIVITY_HISTORY = "vetra:activity_history";
const MAX_HISTORY_ENTRIES = 2000;
const INITIAL_LOAD_LIMIT = 50;

export type HistoryActionType = 
  | "state_changed"
  | "favorite_added" 
  | "favorite_removed"
  | "list_created"
  | "list_renamed"
  | "list_deleted"
  | "list_item_added"
  | "list_item_removed"
  | "list_shared"
  | "list_unshared"
  | "comment_created"
  | "comment_edited"
  | "comment_deleted";

export interface HistoryEntry {
  id: string;
  type: HistoryActionType;
  timestamp: string;
  media?: {
    id: number;
    title: string;
    year?: number;
    poster_path?: string | null;
    media_type: "movie" | "tv";
  };
  list?: {
    id: string;
    name: string;
  };
  state?: "want_to_watch" | "watched" | "not_watched" | "abandoned";
  action: string;
}

export interface GroupedHistoryEntry {
  dateLabel: string;
  dateKey: string;
  entries: HistoryEntry[];
}

export function addHistoryEntry(entry: Omit<HistoryEntry, "id" | "timestamp">): void {
  try {
    const existing = getHistoryEntries();
    const newEntry: HistoryEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    
    const updated = [newEntry, ...existing].slice(0, MAX_HISTORY_ENTRIES);
    localStorage.setItem(KEY_ACTIVITY_HISTORY, JSON.stringify(updated));
  } catch (error) {
    console.error("[history] Erro ao adicionar entrada:", error);
  }
}

export function getHistoryEntries(limit?: number): HistoryEntry[] {
  try {
    const stored = localStorage.getItem(KEY_ACTIVITY_HISTORY);
    if (!stored) return [];
    const entries: HistoryEntry[] = JSON.parse(stored);
    return limit ? entries.slice(0, limit) : entries;
  } catch (error) {
    console.error("[history] Erro ao ler histórico:", error);
    return [];
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(KEY_ACTIVITY_HISTORY);
  } catch (error) {
    console.error("[history] Erro ao limpar histórico:", error);
  }
}

export function getHistoryEntriesByType(type: HistoryActionType): HistoryEntry[] {
  return getHistoryEntries().filter(entry => entry.type === type);
}

export function groupHistoryByDate(entries: HistoryEntry[], lang: string = "pt-BR"): GroupedHistoryEntry[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: Map<string, { label: string; entries: HistoryEntry[] }> = new Map();

  entries.forEach(entry => {
    const entryDate = new Date(entry.timestamp);
    const entryDateOnly = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
    
    let dateKey: string;
    let dateLabel: string;

    if (entryDateOnly.getTime() === today.getTime()) {
      dateKey = "today";
      dateLabel = "Hoje";
    } else if (entryDateOnly.getTime() === yesterday.getTime()) {
      dateKey = "yesterday";
      dateLabel = "Ontem";
    } else {
      dateKey = entryDateOnly.toISOString().split('T')[0];
      dateLabel = entryDate.toLocaleDateString(lang, { 
        day: "numeric", 
        month: "long", 
        year: "numeric" 
      });
    }

    if (!groups.has(dateKey)) {
      groups.set(dateKey, { label: dateLabel, entries: [] });
    }
    groups.get(dateKey)!.entries.push(entry);
  });

  const orderedKeys = ["today", "yesterday"];
  const result: GroupedHistoryEntry[] = [];

  orderedKeys.forEach(key => {
    if (groups.has(key)) {
      result.push({
        dateKey: key,
        dateLabel: groups.get(key)!.label,
        entries: groups.get(key)!.entries
      });
      groups.delete(key);
    }
  });

  const remaining = Array.from(groups.entries())
    .sort((a, b) => {
      if (a[0] < b[0]) return 1;
      if (a[0] > b[0]) return -1;
      return 0;
    })
    .map(([dateKey, { label, entries }]) => ({
      dateKey,
      dateLabel: label,
      entries
    }));

  result.push(...remaining);

  return result;
}

export function formatHistoryAction(entry: HistoryEntry, lang: string = "pt-BR"): string {
  const date = new Date(entry.timestamp);
  const dateStr = date.toLocaleDateString(lang, { 
    day: "2-digit", 
    month: "2-digit", 
    year: "numeric" 
  });
  const timeStr = date.toLocaleTimeString(lang, { 
    hour: "2-digit", 
    minute: "2-digit" 
  });
  return `${entry.action} em ${dateStr} às ${timeStr}`;
}

export { INITIAL_LOAD_LIMIT };
