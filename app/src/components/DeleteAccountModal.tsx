import React from "react";
import { createPortal } from "react-dom";
import { X, Lock } from "lucide-react";
import { Link } from "react-router-dom";

export interface DeleteAccountModalProps {
  show: boolean;
  password: string;
  error: string;
  loading: boolean;
  confirmCheckbox: boolean;
  onClose: () => void;
  onPasswordChange: (password: string) => void;
  onCheckboxChange: (checked: boolean) => void;
  onConfirm: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  show,
  password,
  error,
  loading,
  confirmCheckbox,
  onClose,
  onPasswordChange,
  onCheckboxChange,
  onConfirm,
}) => {
  if (!show) return null;

  const handleClose = () => {
    onClose();
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        zIndex: 9999,
        overflow: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 sm:p-8 border border-slate-300 dark:border-slate-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Excluir conta
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <p className="text-slate-700 dark:text-slate-300 mb-6">
          Esta ação removerá seu perfil, listas e favoritos. Você poderá
          reativar a conta dentro de 30 dias. Após esse prazo, a exclusão é
          permanente. Para mais informações sobre retenção de dados, consulte
          nossa{" "}
          <Link
            to="/privacy"
            target="_blank"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Política de Privacidade
          </Link>
          .
        </p>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Digite sua senha para confirmar
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  onPasswordChange(e.target.value);
                }}
                placeholder="••••••••"
                className={`w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white pl-10 pr-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 ${
                  error
                    ? "border-red-500 focus:ring-red-500"
                    : "border-slate-300 dark:border-slate-600 focus:ring-cyan-500 focus:border-cyan-500"
                }`}
                autoFocus
              />
            </div>
            {error && (
              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="deleteConfirmCheckbox"
              checked={confirmCheckbox}
              onChange={(e) => onCheckboxChange(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-0 cursor-pointer"
            />
            <label
              htmlFor="deleteConfirmCheckbox"
              className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer flex-1"
            >
              Entendo que esta ação não pode ser desfeita após 30 dias.
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || !password.trim() || !confirmCheckbox}
            className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Excluindo...
              </span>
            ) : (
              "Excluir minha conta"
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : modalContent;
};

