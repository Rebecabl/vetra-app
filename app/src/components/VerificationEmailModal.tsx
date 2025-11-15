import React, { useState } from "react";
import { X, Mail, CheckCircle2 } from "lucide-react";
import api from "../api";

interface VerificationEmailModalProps {
  show: boolean;
  email: string;
  onClose: () => void;
  pushToast?: (toast: { message: string; tone: "ok" | "err" | "info" }) => void;
}

export const VerificationEmailModal: React.FC<VerificationEmailModalProps> = ({
  show,
  email,
  onClose,
  pushToast,
}) => {
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    if (!email) return;
    
    setResending(true);
    try {
      const result = await api.resendVerificationEmail(email);
      if (result.ok) {
        if (pushToast) {
          pushToast({ message: "Novo e-mail de verificação enviado para o seu endereço.", tone: "ok" });
        }
      } else {
        if (pushToast) {
          pushToast({ message: result.error || "Não foi possível reenviar o e-mail. Tente novamente.", tone: "err" });
        }
      }
    } catch (e: any) {
      console.error("[VerificationEmailModal] Erro ao reenviar:", e);
      if (pushToast) {
        pushToast({ message: "Não foi possível reenviar o e-mail. Tente novamente.", tone: "err" });
      }
    } finally {
      setResending(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" style={{ zIndex: 10000 }}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Verifique seu e-mail</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            aria-label="Fechar"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-100 dark:bg-cyan-900/30 mb-4">
            <Mail size={32} className="text-cyan-600 dark:text-cyan-400" />
          </div>
          <p className="text-slate-700 dark:text-slate-300 mb-2">
            Enviamos um e-mail de verificação para <strong className="text-slate-900 dark:text-white">{email}</strong>.
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Você pode continuar usando o VETRA normalmente, mas recomendamos confirmar seu e-mail para maior segurança.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resending ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
                Enviando...
              </span>
            ) : (
              "Reenviar e-mail de verificação"
            )}
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-xl bg-cyan-600 dark:bg-cyan-500 text-white font-semibold hover:bg-cyan-700 dark:hover:bg-cyan-600 transition-all duration-200"
          >
            Entendi, continuar
          </button>
        </div>
      </div>
    </div>
  );
};

