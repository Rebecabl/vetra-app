import React from "react";
import { Plus, LinkIcon, Pencil, Trash2, ListIcon, ImageIcon } from "lucide-react";
import { ListCover, getListCoverImageUrl, getListFallbackPosters } from "../components/ListCover";
import { KebabMenu } from "../ui/KebabMenu";
import type { UserList, MovieT } from "../types/movies";
import { mediaKey } from "../types/movies";
import { toPosterPath } from "../lib/media.utils";
import api from "../api";

interface ListsPageProps {
  viewingShared: boolean;
  sharedList: { listName: string; items: MovieT[] } | null;
  lists: UserList[];
  activeListId: string | null;
  listSearchQuery: string;
  setListSearchQuery: (query: string) => void;
  listSortOrder: "recent" | "az" | "items" | "updated";
  setListSortOrder: (order: "recent" | "az" | "items" | "updated") => void;
  filteredAndSortedLists: UserList[];
  createList: (name: string) => string;
  setActiveListId: (id: string | null) => void;
  pushToast: (toast: { message: string; tone: "ok" | "err" | "info" }) => void;
  setShareSlug: (slug: string) => void;
  setShowShare: (show: boolean) => void;
  setRenameInput: (name: string) => void;
  setRenameModal: (modal: { show: boolean; listId: string; currentName: string }) => void;
  setCoverSelectorListId: (id: string | null) => void;
  setShowCoverSelector: (show: boolean) => void;
  setConfirmModal: (modal: { show: boolean; message: string; onConfirm: () => void }) => void;
  deleteList: (id: string) => void;
  formatListUpdatedAt: (updatedAt: string) => string;
  t: (key: string, params?: Record<string, any>) => string;
  renderListDetail: (lst: UserList) => React.ReactNode;
}

export const ListsPage: React.FC<ListsPageProps> = ({
  viewingShared,
  sharedList,
  lists,
  activeListId,
  listSearchQuery,
  setListSearchQuery,
  listSortOrder,
  setListSortOrder,
  filteredAndSortedLists,
  createList,
  setActiveListId,
  pushToast,
  setShareSlug,
  setShowShare,
  setRenameInput,
  setRenameModal,
  setCoverSelectorListId,
  setShowCoverSelector,
  setConfirmModal,
  deleteList,
  formatListUpdatedAt,
  t,
  renderListDetail,
}) => {
  return (
    <section>
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {viewingShared && sharedList ? sharedList.listName : t("lists")}
          </h2>
        </div>
        {!viewingShared && (
          <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
            <button
              onClick={() => {
                const defaultName = `Minha lista ${lists.length + 1}`;
                const id = createList(defaultName);
                setActiveListId(id);
                pushToast({ message: t("created_list_ok", { name: defaultName }), tone: "ok" });
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 sm:hover:scale-105 min-h-[44px]"
            >
              <Plus size={16} className="sm:w-4.5 sm:h-4.5" />{t("new_list")}
            </button>
          </div>
        )}
      </div>

      {viewingShared && sharedList ? (
        <>
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs font-medium rounded-full border border-cyan-200 dark:border-cyan-800" title="Qualquer pessoa com o link pode ver.">
              <LinkIcon size={12} />
              Link público
            </span>
          </div>
          {renderListDetail({ id: 'shared', name: sharedList.listName, items: sharedList.items } as UserList)}
        </>
      ) : activeListId ? (() => {
        const lst = lists.find((l) => l.id === activeListId);
        if (!lst) return <div className="text-slate-600 dark:text-gray-400">{t("list_not_found")}</div>;
        return renderListDetail(lst);
      })() : (
        lists.length > 0 ? (
          <>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  placeholder="Buscar listas..."
                  value={listSearchQuery}
                  onChange={(e) => setListSearchQuery(e.target.value)}
                  className="w-full sm:w-auto sm:min-w-[200px] max-w-md px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={listSortOrder}
                  onChange={(e) => setListSortOrder(e.target.value as "recent" | "az" | "items" | "updated")}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px]"
                >
                  <option value="recent">Recentes</option>
                  <option value="az">A–Z</option>
                  <option value="items">Mais itens</option>
                  <option value="updated">Última atualização</option>
                </select>
              </div>
            </div>
            
            {filteredAndSortedLists.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 min-[1280px]:grid-cols-4 gap-6 sm:gap-8">
                {filteredAndSortedLists.map((l) => {
                  const shareList = async () => {
                    try {
                      if (l.items.length === 0) {
                        pushToast({ message: "A lista está vazia", tone: "err" });
                        return;
                      }
                      const payload = l.items.map((m) => ({
                        id: m.id, 
                        media: m.media || "movie", 
                        title: m.title,
                        poster_path: m.poster_path ?? toPosterPath(m.image),
                        vote_average: m.rating ?? null, 
                        vote_count: m.voteCount ?? null,
                        release_date: m.year ? `${m.year}-01-01` : null, 
                        first_air_date: null, 
                        overview: m.overview ?? "",
                      }));
                      
                      console.log("[shareList] Criando compartilhamento:", { itemsCount: payload.length, type: 'list', listName: l.name });
                      const resp = await api.shareCreate(payload, 'list', l.name);
                      
                      if (!resp || !resp.slug) {
                        throw new Error("Resposta inválida do servidor");
                      }
                      
                      setShareSlug(resp.slug || (resp.code ? resp.code.replace(/V9-|-/g, "").slice(0, 10) : ""));
                      setShowShare(true);
                    } catch (e: any) { 
                      console.error("[shareList] Erro ao compartilhar:", e);
                      const errorMsg = e?.message?.includes("listId_obrigatorio") 
                        ? "Erro ao gerar link. Tente novamente." 
                        : (e?.message || t("share_fail") || "Erro ao compartilhar lista");
                      pushToast({ message: errorMsg, tone: "err" }); 
                    }
                  };
                  const coverImageUrl = getListCoverImageUrl(l, mediaKey, toPosterPath);
                  const fallbackPosters = getListFallbackPosters(l, 4, toPosterPath);
                  

                  return (
                    <div key={l.id} className="group relative bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 hover:scale-[1.03] backdrop-blur-sm">
                      {/* Capa da lista - destaque visual melhorado */}
                      <div className="relative aspect-[16/9] overflow-hidden bg-slate-200 dark:bg-slate-800">
                        <ListCover
                          title={l.name}
                          itemsCount={l.items.length}
                          imageUrl={coverImageUrl}
                          fallbackPosters={fallbackPosters}
                          focalPoint={l.cover?.focalPoint}
                          mode="grid"
                          showOverlay={true}
                          onClick={() => setActiveListId(l.id)}
                          onShare={l.items.length > 0 ? shareList : undefined}
                          onMore={() => {
                            setRenameInput(l.name);
                            setRenameModal({ show: true, listId: l.id, currentName: l.name });
                          }}
                          className="cursor-pointer h-full w-full"
                        />
                        {/* Overlay gradiente sutil no hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20" />
                      </div>
                      
                      {/* Informações da lista - design melhorado */}
                      <div className="p-5 sm:p-6 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3 line-clamp-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors duration-300">
                          {l.name}
                        </h3>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{l.items.length}</span>
                            <span className="text-slate-500 dark:text-slate-500">{l.items.length === 1 ? "item" : "itens"}</span>
                            {l.updatedAt && (
                              <>
                                <span className="text-slate-400 dark:text-slate-600">•</span>
                                <span className="text-slate-500 dark:text-slate-500">{formatListUpdatedAt(l.updatedAt)}</span>
                              </>
                            )}
                          </div>
                          {l.isPublic !== undefined && (
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                              l.isPublic 
                                ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                                : "bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400"
                            }`}>
                              {l.isPublic ? "Pública" : "Privada"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Ações no hover (para grid, mostrar em overlay) */}
                      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenameInput(l.name);
                              setRenameModal({ show: true, listId: l.id, currentName: l.name });
                            }}
                            className="p-2 rounded-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            title="Editar"
                            aria-label="Editar lista"
                          >
                            <Pencil size={18} />
                          </button>
                          <KebabMenu
                            items={[
                              { 
                                key: "chooseCover", 
                                label: "Escolher capa", 
                                icon: <ImageIcon size={14} />,
                                onClick: () => {
                                  setCoverSelectorListId(l.id);
                                  setShowCoverSelector(true);
                                }
                              },
                              { key: "delete", label: "Excluir", icon: <Trash2 size={14} />, tone: "danger",
                                onClick: () => setConfirmModal({ 
                                  show: true, 
                                  message: `Excluir a lista "${l.name}"? Esta ação não pode ser desfeita.`, 
                                  onConfirm: () => { 
                                    deleteList(l.id); 
                                    setConfirmModal({ show: false, message: "", onConfirm: () => {} }); 
                                  } 
                                }) 
                              },
                            ]}
                          />
                        </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-600 dark:text-slate-400">Nenhuma lista encontrada.</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 md:py-16 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-md rounded-3xl border border-slate-700/50 shadow-2xl">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-lime-400/20 mb-6 ring-4 ring-cyan-500/10">
              <ListIcon size={48} className="text-cyan-400" />
            </div>
            <p className="text-white text-xl font-bold mb-2">{t("none_list_created")}</p>
            <p className="text-gray-400">{t("create_list_hint")}</p>
          </div>
        )
      )}
    </section>
  );
};

