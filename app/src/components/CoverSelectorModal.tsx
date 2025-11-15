import React, { useState } from "react";
import { X, Image as ImageIcon, Check } from "lucide-react";
import type { MovieT } from "../types/movies";

export interface CoverSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (cover: {
    type: "none" | "first_item" | "item" | "upload" | "tmdb";
    itemId?: string;
    url?: string;
  }, listName?: string) => void;
  listItems?: MovieT[];
  currentCover?: {
    type?: "item" | "upload" | "auto";
    itemId?: string;
    url?: string;
  };
  isNewList?: boolean;
  listName?: string;
  onListNameChange?: (name: string) => void;
}

export const CoverSelectorModal: React.FC<CoverSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  listItems = [],
  currentCover,
  isNewList = false,
  listName = "",
  onListNameChange,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState(listName || "");
  
  // Se já tem uma capa definida, selecionar o item correspondente
  React.useEffect(() => {
    if (currentCover?.type === "item" && currentCover.itemId) {
      setSelectedItemId(currentCover.itemId);
    }
  }, [currentCover]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (isNewList && !newListName.trim()) {
      alert("Por favor, informe um nome para a lista");
      return;
    }

    if (!selectedItemId && listItems.length > 0) {
      alert("Por favor, selecione um item da lista");
      return;
    }

    if (isNewList && onListNameChange) {
      onListNameChange(newListName.trim());
    }

    // Se não selecionou nenhum item, usar "none" para remover a capa
    onSelect({
      type: selectedItemId ? "item" : "none",
      itemId: selectedItemId || undefined,
    }, newListName.trim());
    onClose();
  };

  const toPosterPath = (path: string | null | undefined): string | null => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `https://image.tmdb.org/t/p/w500${path}`;
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 sm:p-6 flex items-center justify-between z-10">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {isNewList ? "Criar nova lista" : "Escolher capa da lista"}
          </h2>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Fechar"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Campo de nome se for nova lista */}
          {isNewList && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Nome da lista
              </label>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Ex: Minha lista de favoritos"
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px]"
                autoFocus
              />
            </div>
          )}

          {/* Seleção de itens da lista */}
          {listItems.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Escolha um filme da lista para ser a capa
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-96 overflow-y-auto">
                {listItems.map((item) => {
                  const itemKey = `${item.media || "movie"}:${item.id}`;
                  const posterUrl = toPosterPath(item.poster_path || item.image);
                  return (
                    <button
                      key={itemKey}
                      onClick={() => setSelectedItemId(itemKey)}
                      className={`relative aspect-[2/3] rounded-lg overflow-hidden border-2 transition-all ${
                        selectedItemId === itemKey
                          ? "border-cyan-500 ring-2 ring-cyan-500 ring-offset-2"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      {posterUrl ? (
                        <img
                          src={posterUrl}
                          alt={(item.title || (item as any).name || "") as string}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                          <ImageIcon size={24} className="text-slate-400 dark:text-slate-600" />
                        </div>
                      )}
                      {selectedItemId === itemKey && (
                        <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center">
                          <Check size={24} className="text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <p className="mb-2">A lista está vazia</p>
              <p className="text-sm">Adicione filmes à lista para escolher uma capa</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4 sm:p-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 min-h-[44px]"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-medium transition-colors min-h-[44px]"
          >
            {isNewList ? "Criar lista" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
};

