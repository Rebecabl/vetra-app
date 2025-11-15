import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, List as ListIcon, Share2, Trash2, Image as ImageIcon } from 'lucide-react';
import { KebabMenu } from '../ui/KebabMenu';
import { MovieCardInline } from './MovieCardInline';
import type { UserList, MovieT } from '../types/movies';
import { mediaKey } from '../types/movies';
import { getListCoverImageUrl, getListFallbackPosters } from './ListCover';
import { toPosterPath } from '../lib/media.utils';
import { addHistoryEntry } from '../utils/history.utils';
import api from '../api';

interface ListDetailProps {
  lst: UserList;
  isLoggedIn: boolean;
  isFavorite: (m: MovieT) => boolean;
  getUserMeta: (m: MovieT) => any;
  toggleFavorite: (movie: MovieT, skipConfirm?: boolean) => void;
  setShowListPickerFor: (movie: MovieT | null) => void;
  setShowCollectionPickerFor: (movie: MovieT | null) => void;
  setPendingAction: (action: (() => void) | null) => void;
  setShowActionSheet: (show: boolean) => void;
  pushToast: (toast: { message: string; tone: "ok" | "err" | "info" }) => void;
  renameList: (listId: string, newName: string) => void;
  clearList: (listId: string) => void;
  deleteList: (listId: string) => void;
  setListCover: (listId: string, type: "item" | "upload" | "auto", itemId?: string, url?: string, focalPoint?: { x: number; y: number }) => Promise<any>;
  removeFromList: (listId: string, movieId: number, media?: string) => Promise<void>;
  setConfirmModal: (modal: { show: boolean; message: string; onConfirm: () => void }) => void;
  setShareSlug: (slug: string) => void;
  setShowShare: (show: boolean) => void;
  setActiveListId: (id: string | null) => void;
  onDragStart: (listId: string, idx: number) => (e: React.DragEvent) => void;
  onDrop: (listId: string, idx: number) => (e: React.DragEvent) => void;
  t: (key: string) => string;
}

export const ListDetail: React.FC<ListDetailProps> = ({
  lst,
  isLoggedIn,
  isFavorite,
  getUserMeta,
  toggleFavorite,
  setShowListPickerFor,
  setShowCollectionPickerFor,
  setPendingAction,
  setShowActionSheet,
  pushToast,
  renameList,
  clearList,
  deleteList,
  setListCover,
  removeFromList,
  setConfirmModal,
  setShareSlug,
  setShowShare,
  setActiveListId,
  onDragStart,
  onDrop,
  t,
}) => {
  const [localListName, setLocalListName] = useState(lst.name);
  const listIdRef = useRef(lst.id);
  const inputRef = useRef<HTMLInputElement>(null);
  const isEditingRef = useRef(false);
  
  useEffect(() => {
    if (listIdRef.current !== lst.id) {
      listIdRef.current = lst.id;
      setLocalListName(lst.name);
    } else if (!isEditingRef.current && lst.name !== localListName) {
      setLocalListName(lst.name);
    }
  }, [lst.id, lst.name, localListName]);

  const [order, setOrder] = useState<"recent" | "year" | "rating">("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const saved = localStorage.getItem(`vetra:listItemsPerPage:${lst.id}`);
    return saved ? parseInt(saved, 10) : 24;
  });

  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...lst.items];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((m) => 
        m.title?.toLowerCase().includes(query) ||
        m.overview?.toLowerCase().includes(query)
      );
    }
    
    if (order === "year") {
      filtered.sort((a, b) => parseInt(b.year || "0") - parseInt(a.year || "0"));
    } else if (order === "rating") {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    
    return filtered;
  }, [lst.items, order, searchQuery]);

  const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedItems.slice(start, start + itemsPerPage);
  }, [filteredAndSortedItems, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, order, itemsPerPage]);

  const coverImageUrl = getListCoverImageUrl(lst, mediaKey, toPosterPath);
  const fallbackPosters = getListFallbackPosters(lst, 4, toPosterPath);
  
  useEffect(() => {
    if (lst.cover) {
      console.log("[ListDetail] Capa calculada:", JSON.stringify({
        listId: lst.id,
        cover: lst.cover,
        coverImageUrl,
        itemsCount: lst.items.length,
        itemKeys: lst.items.map(m => mediaKey(m)),
        coverItem: lst.items.find(m => mediaKey(m) === lst.cover?.itemId) ? {
          id: lst.items.find(m => mediaKey(m) === lst.cover?.itemId)!.id,
          media: lst.items.find(m => mediaKey(m) === lst.cover?.itemId)!.media,
          poster_path: lst.items.find(m => mediaKey(m) === lst.cover?.itemId)!.poster_path,
          image: lst.items.find(m => mediaKey(m) === lst.cover?.itemId)!.image
        } : null
      }, null, 2));
    }
  }, [lst.id, lst.cover, coverImageUrl, lst.items.length]);

  const openShare = async () => {
    try {
      if (lst.items.length === 0) {
        pushToast({ message: "A lista está vazia", tone: "err" });
        return;
      }
      const payload = lst.items.map((m) => ({
        id: m.id, media: m.media || "movie", title: m.title,
        poster_path: m.poster_path ?? toPosterPath(m.image),
        vote_average: m.rating ?? null, vote_count: m.voteCount ?? null,
        release_date: m.year ? `${m.year}-01-01` : null, first_air_date: null, overview: m.overview ?? "",
      }));
      const resp = await api.shareCreate(payload, 'list', lst.name);
      if (!resp || !resp.slug) {
        throw new Error("Resposta inválida do servidor");
      }
      const slug = resp.slug || (resp.code ? resp.code.replace(/V9-|-/g, "").slice(0, 10) : "");
      setShareSlug(slug);
      setShowShare(true);
      
      if (isLoggedIn) {
        addHistoryEntry({
          type: "list_shared",
          list: { id: lst.id, name: lst.name },
          action: `Lista '${lst.name}' compartilhada publicamente`
        });
      }
    } catch (e: any) {
      console.error("[shareListDetail] Erro ao compartilhar:", e);
      const errorMsg = e?.message || "Não foi possível gerar o link agora. Tente novamente.";
      pushToast({ message: errorMsg, tone: "err" });
    }
  };

  return (
    <div>
      {/* Cabeçalho compacto da lista */}
      <div className="mb-6 sm:mb-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Título e contagem */}
          <div className="flex-1 min-w-0">
            <input
              ref={inputRef}
              className="w-full bg-transparent text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white outline-none border-b-2 border-transparent focus:border-cyan-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 mb-1"
              value={localListName}
              onChange={(e) => {
                isEditingRef.current = true;
                setLocalListName(e.target.value);
              }}
              onFocus={() => {
                isEditingRef.current = true;
              }}
              onBlur={() => {
                isEditingRef.current = false;
                if (localListName.trim() && localListName !== lst.name) {
                  renameList(lst.id, localListName.trim());
                } else if (!localListName.trim()) {
                  setLocalListName(lst.name);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  isEditingRef.current = false;
                  e.currentTarget.blur();
                }
                if (e.key === "Escape") {
                  isEditingRef.current = false;
                  setLocalListName(lst.name);
                  e.currentTarget.blur();
                }
              }}
              placeholder="Nome da lista"
            />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {lst.items.length} {lst.items.length === 1 ? 'item' : 'itens'}
            </p>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Botão de compartilhar - só aparece para listas do usuário (não compartilhadas) */}
            {lst.id !== 'shared' && (
              <button 
                onClick={openShare} 
                disabled={lst.items.length === 0}
                className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 text-sm font-medium transition-all min-h-[44px] focus:outline-none focus:ring-2 focus:ring-cyan-500"
                title={lst.items.length === 0 ? "A lista está vazia" : "Compartilhar lista"}
                aria-label="Compartilhar lista"
              >
                <Share2 size={18} />
                <span className="hidden sm:inline">Compartilhar</span>
              </button>
            )}
            {/* Menu Kebab - só aparece para listas do usuário (não compartilhadas) */}
            {lst.id !== 'shared' && (
              <KebabMenu
                items={[
                  { key: "clear", label: "Limpar itens", icon: <Trash2 size={14} />, onClick: () => setConfirmModal({ show: true, message: "Limpar todos os itens desta lista?", onConfirm: () => { clearList(lst.id); setConfirmModal({ show: false, message: "", onConfirm: () => {} }); } }) },
                  { key: "delete", label: "Excluir lista", icon: <Trash2 size={14} />, tone: "danger",
                    onClick: () => setConfirmModal({ show: true, message: `Excluir a lista "${lst.name}"? Esta ação não pode ser desfeita.`, onConfirm: () => { deleteList(lst.id); setConfirmModal({ show: false, message: "", onConfirm: () => {} }); } }) },
                ]}
              />
            )}
          </div>
        </div>
      </div>

      {/* Lista de itens */}
      {lst.items.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {paginatedItems.map((m, idx) => {
            return (
              <div key={`${m.media}-${m.id}`} className="relative group"
                   draggable
                   onDragStart={onDragStart(lst.id, idx)}
                   onDrop={onDrop(lst.id, idx)}>
                <MovieCardInline
                  movie={m}
                  isLoggedIn={isLoggedIn}
                  isFavorite={isFavorite}
                  getUserMeta={getUserMeta}
                  toggleFavorite={toggleFavorite}
                  setShowListPickerFor={setShowListPickerFor}
                  setShowCollectionPickerFor={setShowCollectionPickerFor}
                  setPendingAction={setPendingAction}
                  setShowActionSheet={setShowActionSheet}
                  pushToast={pushToast}
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <KebabMenu
                    items={[
                      { 
                        key: "setCover", 
                        label: "Definir como capa", 
                        icon: <ImageIcon size={14} />,
                        onClick: async () => {
                          const itemKey = mediaKey(m);
                          const result = await setListCover(lst.id, "item", itemKey);
                          if (result?.success !== false) {
                          pushToast({ message: "Capa definida", tone: "ok" });
                          } else {
                            pushToast({ message: result.error || "Erro ao definir capa", tone: "err" });
                          }
                        }
                      },
                      { 
                        key: "remove", 
                        label: "Remover da lista", 
                        icon: <Trash2 size={14} />, 
                        tone: "danger",
                        onClick: () => {
                          removeFromList(lst.id, m.id, m.media);
                        }
                      },
                    ]}
                  />
                </div>
              </div>
            );
            })}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  setCurrentPage(prev => Math.max(1, prev - 1));
                }}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => {
                      setCurrentPage(pageNum);
                    }}
                    disabled={currentPage === pageNum}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                      currentPage === pageNum
                        ? "bg-cyan-600 text-white border-cyan-600"
                        : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => {
                  setCurrentPage(prev => Math.min(totalPages, prev + 1));
                }}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 md:py-16 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-md rounded-3xl border border-slate-700/50 shadow-2xl">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-lime-400/20 mb-6 ring-4 ring-cyan-500/10">
            <ListIcon size={48} className="text-cyan-400" />
          </div>
          <p className="text-white text-xl font-bold mb-2">{t("lists.none_in_list")}</p>
          <p className="text-gray-400">{t("lists.list_empty")}</p>
        </div>
      )}

      <div className="mt-6 flex items-center gap-2 flex-wrap">
        <button 
          onClick={() => {
            setActiveListId(null);
          }} 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium transition-all min-h-[44px] focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <ChevronLeft size={18} />
          <span>{t("back_all_lists")}</span>
        </button>
      </div>
    </div>
  );
};

