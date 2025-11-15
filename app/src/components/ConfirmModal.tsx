import React from "react";
import { Trash2 } from "lucide-react";

export interface ConfirmModalProps {
  show: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  show,
  message,
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
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 via-rose-500/20 to-pink-500/20 flex items-center justify-center ring-4 ring-red-500/10">
            <Trash2 size={32} className="text-red-400" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-white text-center mb-4">
          Confirmar ação
        </h3>
        <p className="text-gray-300 text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-5 py-2.5 rounded-xl font-semibold text-white bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 transition-all duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

