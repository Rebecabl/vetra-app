import React from 'react';
import { X } from 'lucide-react';

interface RenameListModalProps {
  show: boolean;
  currentName: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const RenameListModal: React.FC<RenameListModalProps> = ({
  show,
  currentName,
  inputValue,
  onInputChange,
  onConfirm,
  onCancel,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={onCancel} 
      />
      <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-6 shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Renomear Lista</h3>
          <button 
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-slate-700 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Novo nome da lista</label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && inputValue.trim()) {
                  onConfirm();
                }
                if (e.key === "Escape") {
                  onCancel();
                }
              }}
              autoFocus
              className="w-full bg-slate-800/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
              placeholder="Digite o novo nome..."
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl font-semibold text-white bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={!inputValue.trim()}
              className="px-5 py-2.5 rounded-xl font-semibold text-white bg-slate-700 dark:bg-slate-600 hover:bg-slate-600 dark:hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg border border-slate-600 dark:border-slate-500 hover:border-slate-500 dark:hover:border-slate-400"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

