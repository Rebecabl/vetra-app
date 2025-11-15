import React, { useState, useMemo, useEffect } from "react";
import { Clock, Trash2, ChevronDown, ChevronLeft, ChevronRight, List, Calendar as CalendarIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { poster } from "../lib/media.utils";
import { 
  getHistoryEntries, 
  clearHistory, 
  type HistoryEntry, 
  type HistoryActionType,
  groupHistoryByDate,
  INITIAL_LOAD_LIMIT
} from "../utils/history.utils";
import { formatDate } from "../utils/date";
import type { Lang } from "../i18n";

interface ActivityHistoryPageProps {
  lang: Lang;
  t: (key: string) => string;
}

type ViewMode = "list" | "calendar";

const FILTER_OPTIONS: Array<{ value: HistoryActionType | "all"; label: string; category: string }> = [
  { value: "all", label: "Tudo", category: "all" },
  { value: "state_changed", label: "Estados", category: "states" },
  { value: "favorite_added", label: "Favoritos", category: "favorites" },
  { value: "favorite_removed", label: "Favoritos", category: "favorites" },
  { value: "list_created", label: "Listas", category: "lists" },
  { value: "list_renamed", label: "Listas", category: "lists" },
  { value: "list_deleted", label: "Listas", category: "lists" },
  { value: "list_item_added", label: "Listas", category: "lists" },
  { value: "list_item_removed", label: "Listas", category: "lists" },
  { value: "list_shared", label: "Compartilhamentos", category: "shares" },
  { value: "list_unshared", label: "Compartilhamentos", category: "shares" },
  { value: "comment_created", label: "Comentários", category: "comments" },
  { value: "comment_edited", label: "Comentários", category: "comments" },
  { value: "comment_deleted", label: "Comentários", category: "comments" },
];

const getActionText = (entry: HistoryEntry): string => {
  if (entry.action) return entry.action;
  
  switch (entry.type) {
    case "state_changed":
      const stateMap: Record<string, string> = {
        "want_to_watch": "Marcado como Quero ver",
        "watched": "Marcado como Assistido",
        "not_watched": "Marcado como Não assisti",
        "abandoned": "Marcado como Abandonei"
      };
      return stateMap[entry.state || ""] || "Estado alterado";
    case "favorite_added":
      return "Adicionado aos Favoritos";
    case "favorite_removed":
      return "Removido dos Favoritos";
    case "list_created":
      return `Lista "${entry.list?.name || ""}" criada`;
    case "list_renamed":
      return `Lista "${entry.list?.name || ""}" renomeada`;
    case "list_deleted":
      return `Lista "${entry.list?.name || ""}" excluída`;
    case "list_item_added":
      return `Adicionado à lista "${entry.list?.name || ""}"`;
    case "list_item_removed":
      return `Removido da lista "${entry.list?.name || ""}"`;
    case "list_shared":
      return `Lista "${entry.list?.name || ""}" compartilhada publicamente`;
    case "list_unshared":
      return `Compartilhamento da lista "${entry.list?.name || ""}" desativado`;
    case "comment_created":
      return "Comentário adicionado";
    case "comment_edited":
      return "Comentário editado";
    case "comment_deleted":
      return "Comentário removido";
    default:
      return "Ação realizada";
  }
};

const getTypeBadge = (type: HistoryActionType): { label: string; color: string } => {
  if (type === "state_changed") return { label: "Estado", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" };
  if (type === "favorite_added" || type === "favorite_removed") return { label: "Favorito", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" };
  if (["list_created", "list_renamed", "list_deleted", "list_item_added", "list_item_removed"].includes(type)) {
    return { label: "Lista", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" };
  }
  if (type === "list_shared" || type === "list_unshared") {
    return { label: "Compartilhamento", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" };
  }
  if (["comment_created", "comment_edited", "comment_deleted"].includes(type)) {
    return { label: "Comentário", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" };
  }
  return { label: "Outro", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" };
};

export const ActivityHistoryPage: React.FC<ActivityHistoryPageProps> = ({ lang, t }) => {
  const [filter, setFilter] = useState<HistoryActionType | "all">("all");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(INITIAL_LOAD_LIMIT);
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const allEntries = useMemo(() => {
    const entries = getHistoryEntries();
    console.log("[ActivityHistoryPage] Entradas carregadas:", entries.length);
    return entries;
  }, [refreshKey]);
  
  useEffect(() => {
    const entries = getHistoryEntries();
    console.log("[ActivityHistoryPage] useEffect - Entradas:", entries.length);
    if (entries.length > 0) {
      setRefreshKey(prev => prev + 1);
    }
  }, []);
  
  const filteredEntries = useMemo(() => {
    let filtered: HistoryEntry[];
    
    if (filter === "all") {
      filtered = allEntries;
    } else if (filter === "state_changed") {
      filtered = allEntries.filter(e => e.type === "state_changed");
    } else if (filter === "favorite_added" || filter === "favorite_removed") {
      filtered = allEntries.filter(e => e.type === "favorite_added" || e.type === "favorite_removed");
    } else if (["list_created", "list_renamed", "list_deleted", "list_item_added", "list_item_removed"].includes(filter)) {
      filtered = allEntries.filter(e => 
        e.type === "list_created" || 
        e.type === "list_renamed" || 
        e.type === "list_deleted" || 
        e.type === "list_item_added" || 
        e.type === "list_item_removed"
      );
    } else if (filter === "list_shared" || filter === "list_unshared") {
      filtered = allEntries.filter(e => e.type === "list_shared" || e.type === "list_unshared");
    } else if (["comment_created", "comment_edited", "comment_deleted"].includes(filter)) {
      filtered = allEntries.filter(e => 
        e.type === "comment_created" || 
        e.type === "comment_edited" || 
        e.type === "comment_deleted"
      );
    } else {
      filtered = allEntries.filter(e => e.type === filter);
    }
    
    return filtered;
  }, [allEntries, filter]);
  
  const groupedEntries = useMemo(() => {
    const limited = filteredEntries.slice(0, displayLimit);
    return groupHistoryByDate(limited, lang);
  }, [filteredEntries, displayLimit, lang]);
  
  const hasMore = filteredEntries.length > displayLimit;
  
  const uniqueFilters = useMemo(() => {
    const seen = new Set<string>();
    return FILTER_OPTIONS.filter(opt => {
      if (opt.value === "all") return true;
      if (seen.has(opt.category)) return false;
      seen.add(opt.category);
      return true;
    });
  }, []);
  
  const handleClearHistory = () => {
    clearHistory();
    setShowClearConfirm(false);
    setRefreshKey(prev => prev + 1);
  };
  
  const handleLoadMore = () => {
    setDisplayLimit(prev => prev + INITIAL_LOAD_LIMIT);
  };
  
  const getActiveCategory = (): string => {
    if (filter === "all") return "all";
    const opt = FILTER_OPTIONS.find(o => o.value === filter);
    return opt?.category || "all";
  };
  
  const getEntriesForDate = (date: Date): HistoryEntry[] => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredEntries.filter(entry => {
      const entryDate = new Date(entry.timestamp).toISOString().split('T')[0];
      return entryDate === dateStr;
    });
  };
  
  const getCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: Array<{ date: Date | null; entries: HistoryEntry[] }> = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: null, entries: [] });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({ date, entries: getEntriesForDate(date) });
    }
    
    // Completa a grade até ter 42 células (6 semanas x 7 dias)
    const totalCells = 42;
    const remainingCells = totalCells - days.length;
    for (let i = 0; i < remainingCells; i++) {
      days.push({ date: null, entries: [] });
    }
    
    return days;
  };
  
  const calendarDays = useMemo(() => getCalendarDays(), [calendarMonth, filteredEntries]);
  
  const selectedDateEntries = useMemo(() => {
    if (!selectedDate) return [];
    return getEntriesForDate(selectedDate);
  }, [selectedDate, filteredEntries]);
  
  const getFilterLabel = (): string => {
    const opt = uniqueFilters.find(o => {
      if (o.value === "all") return filter === "all";
      return o.category === getActiveCategory();
    });
    return opt?.label || "Tudo";
  };
  
  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-8 pt-12 sm:pt-14 md:pt-16 lg:pt-20 pb-12 max-w-6xl min-h-[60vh]">
      {/* Cabeçalho */}
      <div className="mb-8 md:mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">Histórico</h1>
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
              Acompanhe suas atividades recentes no VETRA: estados, favoritos, listas, compartilhamentos e comentários.
            </p>
          </div>
          {allEntries.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors self-start sm:self-auto"
            >
              <Trash2 size={16} />
              Limpar histórico
            </button>
          )}
        </div>
        
        {/* Barra de visualização e filtros */}
        {allEntries.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Toggle de visualização */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "list"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <List size={16} />
                Lista
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "calendar"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <CalendarIcon size={16} />
                Calendário
              </button>
            </div>
            
            {/* Filtros */}
            <div className="flex flex-wrap gap-2">
              {uniqueFilters.map((opt) => {
                const isActive = 
                  (opt.value === "all" && filter === "all") ||
                  (opt.value !== "all" && opt.category === getActiveCategory());
                
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setFilter(opt.value as HistoryActionType | "all");
                      setDisplayLimit(INITIAL_LOAD_LIMIT);
                      setSelectedDate(null);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-cyan-500 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Modal de confirmação */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Limpar histórico?</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Tem certeza de que deseja limpar seu histórico? Essa ação não apaga seus favoritos, listas nem comentários, apenas os registros desta página.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleClearHistory}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Limpar histórico
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Conteúdo */}
      {groupedEntries.length === 0 && viewMode === "list" ? (
        <div className="text-center py-20 md:py-24 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-md rounded-3xl border border-slate-700/50 shadow-2xl">
          <Clock size={80} className="mx-auto mb-6 text-slate-500" />
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
            {allEntries.length === 0 ? "Nenhum histórico ainda" : "Nenhum registro encontrado"}
          </h3>
          <p className="text-gray-400 text-lg">
            {allEntries.length === 0 
              ? "Suas ações no VETRA aparecerão aqui assim que você começar a usar o app."
              : filter !== "all" 
                ? `Nenhum histórico de ${getFilterLabel().toLowerCase()} ainda para este filtro.`
                : "Tente outro filtro"}
          </p>
        </div>
      ) : viewMode === "list" ? (
        <>
          <div className="space-y-8">
            {groupedEntries.map((group) => (
              <div key={group.dateKey}>
                <h2 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                  {group.dateLabel}
                </h2>
                <div className="space-y-3">
                  {group.entries.map((entry) => {
                    const actionText = getActionText(entry);
                    const badge = getTypeBadge(entry.type);
                    const entryDate = new Date(entry.timestamp);
                    
                    return (
                      <div
                        key={entry.id}
                        className="bg-white dark:bg-slate-900 rounded-lg p-4 md:p-5 border border-slate-200 dark:border-slate-700 hover:border-cyan-500/50 dark:hover:border-cyan-500/50 transition-colors cursor-pointer"
                        onClick={() => {
                          if (entry.media) {
                            window.location.href = `/${entry.media.media_type}/${entry.media.id}`;
                          }
                        }}
                      >
                        <div className="flex gap-4">
                          {entry.media && (
                            <Link
                              to={`/${entry.media.media_type}/${entry.media.id}`}
                              className="flex-shrink-0 hover:opacity-80 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <img
                                src={entry.media.poster_path 
                                  ? `https://image.tmdb.org/t/p/w185${entry.media.poster_path}`
                                  : poster(entry.media.poster_path)
                                }
                                alt={entry.media.title}
                                className="w-16 h-24 md:w-20 md:h-30 object-cover rounded-lg shadow-md"
                              />
                            </Link>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                {entry.media ? (
                                  <Link
                                    to={`/${entry.media.media_type}/${entry.media.id}`}
                                    className="block"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors mb-1">
                                      {entry.media.title}
                                      {entry.media.year && ` (${entry.media.year})`}
                                    </h3>
                                  </Link>
                                ) : entry.list ? (
                                  <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white mb-1">
                                    {entry.list.name}
                                  </h3>
                                ) : (
                                  <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white mb-1">
                                    {actionText}
                                  </h3>
                                )}
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
                                {badge.label}
                              </span>
                            </div>
                            
                            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mb-2">
                              {actionText}
                            </p>
                            
                            <p className="text-xs text-slate-500 dark:text-slate-500">
                              {formatDate(entryDate, { 
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              }, lang)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          
          {hasMore && (
            <div className="flex justify-center pt-6">
              <button
                onClick={handleLoadMore}
                className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium"
              >
                <ChevronDown size={18} />
                Carregar mais
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => {
                const prevMonth = new Date(calendarMonth);
                prevMonth.setMonth(prevMonth.getMonth() - 1);
                setCalendarMonth(prevMonth);
                setSelectedDate(null);
              }}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-cyan-300 dark:hover:border-cyan-600 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <ChevronLeft size={20} className="text-slate-700 dark:text-slate-300" />
            </button>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white capitalize">
              {formatDate(calendarMonth, { month: "long", year: "numeric" }, lang)}
            </h2>
            <button
              onClick={() => {
                const nextMonth = new Date(calendarMonth);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                setCalendarMonth(nextMonth);
                setSelectedDate(null);
              }}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-cyan-300 dark:hover:border-cyan-600 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <ChevronRight size={20} className="text-slate-700 dark:text-slate-300" />
            </button>
          </div>
          
          {/* Grid do calendário */}
          <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-6 md:p-8">
            {/* Cabeçalho dos dias da semana */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(day => (
                <div key={day} className="text-center text-sm font-bold text-slate-500 dark:text-slate-400 py-3 uppercase tracking-wide">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Grid dos dias */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                if (!day.date) {
                  return <div key={`empty-${idx}`} className="aspect-square" />;
                }
                
                const isSelected = selectedDate && day.date.toISOString().split('T')[0] === selectedDate.toISOString().split('T')[0];
                const isToday = day.date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                const hasEntries = day.entries.length > 0;
                
                return (
                  <button
                    key={day.date.toISOString()}
                    onClick={() => setSelectedDate(day.date!)}
                    className={`aspect-square rounded-xl transition-all duration-200 relative group ${
                      isSelected
                        ? "bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/50 scale-105 z-10"
                        : isToday
                        ? "bg-gradient-to-br from-cyan-100 to-cyan-50 dark:from-cyan-900/30 dark:to-cyan-800/20 text-cyan-700 dark:text-cyan-300 border-2 border-cyan-300 dark:border-cyan-600 shadow-md"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-cyan-300 dark:hover:border-cyan-600 hover:shadow-md"
                    }`}
                  >
                    <div className={`absolute inset-0 flex flex-col items-center justify-center ${
                      isSelected ? "text-white" : ""
                    }`}>
                      <span className={`text-base font-semibold ${
                        isSelected ? "text-white" : isToday ? "text-cyan-700 dark:text-cyan-300" : "text-slate-900 dark:text-white"
                      }`}>
                        {day.date.getDate()}
                      </span>
                      
                      {/* Indicadores de eventos */}
                      {hasEntries && (
                        <div className="mt-1 flex items-center justify-center gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            isSelected 
                              ? "bg-white/90" 
                              : isToday
                              ? "bg-cyan-500"
                              : "bg-cyan-500"
                          }`} />
                          {day.entries.length > 1 && (
                            <span className={`text-[9px] font-bold leading-none ${
                              isSelected 
                                ? "text-white/90" 
                                : isToday
                                ? "text-cyan-600 dark:text-cyan-400"
                                : "text-cyan-600 dark:text-cyan-400"
                            }`}>
                              +{day.entries.length - 1}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Badge de contador (canto superior direito) */}
                    {hasEntries && day.entries.length > 1 && (
                      <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg ${
                        isSelected 
                          ? "bg-white text-cyan-600" 
                          : "bg-gradient-to-br from-cyan-500 to-cyan-600 text-white"
                      }`}>
                        {day.entries.length}
                      </div>
                    )}
                    
                    {/* Efeito hover sutil */}
                    {!isSelected && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/0 to-purple-500/0 group-hover:from-cyan-500/5 group-hover:to-purple-500/5 transition-all duration-200" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Lista de eventos do dia selecionado */}
          {selectedDate && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                {formatDate(selectedDate, { 
                  day: "2-digit", 
                  month: "long", 
                  year: "numeric" 
                }, lang)}
              </h3>
              
              {selectedDateEntries.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateEntries.map((entry) => {
                    const actionText = getActionText(entry);
                    const badge = getTypeBadge(entry.type);
                    const entryDate = new Date(entry.timestamp);
                    
                    return (
                      <div
                        key={entry.id}
                        className="bg-white dark:bg-slate-900 rounded-lg p-4 md:p-5 border border-slate-200 dark:border-slate-700 hover:border-cyan-500/50 dark:hover:border-cyan-500/50 transition-colors cursor-pointer"
                        onClick={() => {
                          if (entry.media) {
                            window.location.href = `/${entry.media.media_type}/${entry.media.id}`;
                          }
                        }}
                      >
                        <div className="flex gap-4">
                          {entry.media && (
                            <Link
                              to={`/${entry.media.media_type}/${entry.media.id}`}
                              className="flex-shrink-0 hover:opacity-80 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <img
                                src={entry.media.poster_path 
                                  ? `https://image.tmdb.org/t/p/w185${entry.media.poster_path}`
                                  : poster(entry.media.poster_path)
                                }
                                alt={entry.media.title}
                                className="w-16 h-24 md:w-20 md:h-30 object-cover rounded-lg shadow-md"
                              />
                            </Link>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                {entry.media ? (
                                  <Link
                                    to={`/${entry.media.media_type}/${entry.media.id}`}
                                    className="block"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors mb-1">
                                      {entry.media.title}
                                      {entry.media.year && ` (${entry.media.year})`}
                                    </h3>
                                  </Link>
                                ) : entry.list ? (
                                  <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white mb-1">
                                    {entry.list.name}
                                  </h3>
                                ) : (
                                  <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white mb-1">
                                    {actionText}
                                  </h3>
                                )}
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
                                {badge.label}
                              </span>
                            </div>
                            
                            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mb-2">
                              {actionText}
                            </p>
                            
                            <p className="text-xs text-slate-500 dark:text-slate-500">
                              {formatDate(entryDate, { 
                                hour: "2-digit",
                                minute: "2-digit"
                              }, lang)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-slate-600 dark:text-slate-400">
                    Você não teve atividades neste dia para este filtro.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
