import React, { useState, useRef } from "react";
import { X, Image as ImageIcon, Upload, Search, Check } from "lucide-react";
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
  const [selectedType, setSelectedType] = useState<"none" | "first_item" | "item" | "upload" | "tmdb">("none");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [tmdbSearchQuery, setTmdbSearchQuery] = useState("");
  const [tmdbResults, setTmdbResults] = useState<any[]>([]);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [newListName, setNewListName] = useState(listName || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione uma imagem válida");
      return;
    }

    // Validar tamanho (máx 1MB)
    if (file.size > 1024 * 1024) {
      alert("A imagem deve ter no máximo 1MB");
      return;
    }

    // Validar dimensões mínimas
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      if (img.width < 400 || img.height < 400) {
        alert("A imagem deve ter pelo menos 400x400 pixels");
        URL.revokeObjectURL(objectUrl);
        return;
      }
      setUploadPreview(objectUrl);
    };
    img.onerror = () => {
      alert("Erro ao carregar a imagem");
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  };

  const handleSearchTmdb = async () => {
    if (!tmdbSearchQuery.trim()) return;
    setTmdbLoading(true);
    try {
      // TODO: Implementar busca no TMDb
      // Por enquanto, apenas simular
      setTmdbResults([]);
    } catch (error) {
      console.error("Erro ao buscar no TMDb:", error);
    } finally {
      setTmdbLoading(false);
    }
  };

  const handleConfirm = () => {
    if (isNewList && !newListName.trim()) {
      alert("Por favor, informe um nome para a lista");
      return;
    }

    if (selectedType === "item" && !selectedItemId) {
      alert("Por favor, selecione um item da lista");
      return;
    }

    if (selectedType === "upload" && !uploadPreview) {
      alert("Por favor, selecione uma imagem para upload");
      return;
    }

    if (isNewList && onListNameChange) {
      onListNameChange(newListName.trim());
    }

    onSelect({
      type: selectedType,
      itemId: selectedItemId || undefined,
      url: uploadPreview || undefined,
    }, newListName.trim());
    onClose();
  };

  const toPosterPath = (path: string | null | undefined): string | null => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `https://image.tmdb.org/t/p/w500${path}`;
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
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

          {/* Opções de tipo */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">
              Tipo de capa
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setSelectedType("none")}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedType === "none"
                    ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedType === "none" ? "border-cyan-500 bg-cyan-500" : "border-slate-300 dark:border-slate-600"
                  }`}>
                    {selectedType === "none" && <Check size={12} className="text-white" />}
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">Sem capa</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Usar placeholder padrão</p>
              </button>

              <button
                onClick={() => setSelectedType("first_item")}
                disabled={listItems.length === 0}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedType === "first_item"
                    ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                } ${listItems.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedType === "first_item" ? "border-cyan-500 bg-cyan-500" : "border-slate-300 dark:border-slate-600"
                  }`}>
                    {selectedType === "first_item" && <Check size={12} className="text-white" />}
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">Primeiro item</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {listItems.length > 0 ? "Usar pôster do primeiro item" : "Adicione itens primeiro"}
                </p>
              </button>

              <button
                onClick={() => setSelectedType("item")}
                disabled={listItems.length === 0}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedType === "item"
                    ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                } ${listItems.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedType === "item" ? "border-cyan-500 bg-cyan-500" : "border-slate-300 dark:border-slate-600"
                  }`}>
                    {selectedType === "item" && <Check size={12} className="text-white" />}
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">Item específico</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {listItems.length > 0 ? "Escolher de um item da lista" : "Adicione itens primeiro"}
                </p>
              </button>

              <button
                onClick={() => setSelectedType("upload")}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedType === "upload"
                    ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedType === "upload" ? "border-cyan-500 bg-cyan-500" : "border-slate-300 dark:border-slate-600"
                  }`}>
                    {selectedType === "upload" && <Check size={12} className="text-white" />}
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">Upload</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Enviar imagem própria</p>
              </button>

              <button
                onClick={() => setSelectedType("tmdb")}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedType === "tmdb"
                    ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedType === "tmdb" ? "border-cyan-500 bg-cyan-500" : "border-slate-300 dark:border-slate-600"
                  }`}>
                    {selectedType === "tmdb" && <Check size={12} className="text-white" />}
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">Buscar TMDb</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Buscar pôster no TMDb</p>
              </button>
            </div>
          </div>

          {/* Conteúdo específico por tipo */}
          {selectedType === "item" && listItems.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Escolha um item da lista
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-64 overflow-y-auto">
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
          )}

          {selectedType === "upload" && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Enviar imagem
              </h3>
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg hover:border-cyan-500 dark:hover:border-cyan-500 transition-colors flex flex-col items-center justify-center gap-3"
                >
                  <Upload size={32} className="text-slate-400 dark:text-slate-600" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Clique para selecionar imagem
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Máx. 1MB • Mín. 400x400px
                  </span>
                </button>
                {uploadPreview && (
                  <div className="relative">
                    <img
                      src={uploadPreview}
                      alt="Preview"
                      className="w-full max-h-64 object-contain rounded-lg border border-slate-200 dark:border-slate-700"
                    />
                    <button
                      onClick={() => {
                        setUploadPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedType === "tmdb" && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Buscar no TMDb
              </h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tmdbSearchQuery}
                    onChange={(e) => setTmdbSearchQuery(e.target.value)}
                    placeholder="Buscar filme ou série..."
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px]"
                    onKeyDown={(e) => e.key === "Enter" && handleSearchTmdb()}
                  />
                  <button
                    onClick={handleSearchTmdb}
                    disabled={tmdbLoading || !tmdbSearchQuery.trim()}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center gap-2"
                  >
                    <Search size={18} />
                    Buscar
                  </button>
                </div>
                {tmdbLoading && (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    Buscando...
                  </div>
                )}
                {tmdbResults.length > 0 && (
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Funcionalidade em desenvolvimento
                  </div>
                )}
              </div>
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

