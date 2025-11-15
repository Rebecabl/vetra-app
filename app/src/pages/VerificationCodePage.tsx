import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import api from "../api";
import { useAuth } from "../hooks/useAuth";

interface VerificationCodePageProps {
  pushToast: (toast: { message: string; tone: "ok" | "err" | "info" | "warn" }) => void;
  pushBanner?: (banner: { message: string; tone: "success" | "error" | "warning" | "info" }) => void;
}

export const VerificationCodePage: React.FC<VerificationCodePageProps> = ({
  pushToast,
  pushBanner,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setIsLoggedIn } = useAuth(pushToast, pushBanner);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailFromQuery = params.get("email");
    const stateEmail = (location.state as any)?.email;
    const statePassword = (location.state as any)?.password;
    
    if (emailFromQuery) {
      setEmail(emailFromQuery);
    } else if (stateEmail) {
      setEmail(stateEmail);
    } else {
      navigate("/");
      return;
    }
    
    if (statePassword) {
      setPassword(statePassword);
    }
  }, [location, navigate]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleCodeChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      const newCode = [...code];
      digits.forEach((digit, i) => {
        if (i < 6) newCode[i] = digit;
      });
      setCode(newCode);
      setError("");
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const codeString = code.join("");
    
    if (codeString.length !== 6) {
      setError("Digite o código completo de 6 dígitos");
      return;
    }

    if (!password.trim()) {
      setError("Digite sua senha para confirmar");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await api.verifyCode(email, codeString, password);
      
      if (result.ok && result.user && result.idToken) {
        localStorage.setItem('vetra:idToken', result.idToken);
        if (result.refreshToken) {
          localStorage.setItem('vetra:refreshToken', result.refreshToken);
        }
        localStorage.setItem('vetra:last_email', email);
        
        localStorage.removeItem('vetra:activeTab');
        localStorage.removeItem('vetra:activeCategory');
        sessionStorage.removeItem('vetra:justLoggedOut');
        
        setUser(result.user);
        setIsLoggedIn(true);
        
        const userName = result.user?.name || "Usuário";
        const firstName = userName.split(' ')[0];
        
        if (pushBanner) {
          pushBanner({ 
            message: "Conta verificada com sucesso.", 
            tone: "success" 
          });
        } else {
          pushToast({ 
            message: "Conta verificada com sucesso.", 
            tone: "ok" 
          });
        }
        
        navigate("/", { replace: true });
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      } else {
        const errorMsg = result.error || "Código inválido. Confira o código enviado para o seu e-mail.";
        
        if (result.error === "codigo_expirado") {
          setError("Este código expirou. Clique em 'Reenviar código' para receber um novo.");
        } else if (result.error === "senha_incorreta") {
          setError("Senha incorreta. Verifique e tente novamente.");
        } else {
          setError(errorMsg);
        }
        
        if (pushToast) {
          pushToast({ message: errorMsg, tone: "err" });
        }
      }
    } catch (e: any) {
      const errorMsg = e?.message || "Erro ao verificar código. Tente novamente.";
      setError(errorMsg);
      if (pushToast) {
        pushToast({ message: errorMsg, tone: "err" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setResending(true);
    setError("");

    try {
      const result = await api.resendVerificationCode(email);
      
      if (result.ok) {
        setResendCooldown(60); // 60 segundos de cooldown
        if (pushBanner) {
          pushBanner({ 
            message: "Novo código de verificação enviado para o seu e-mail.", 
            tone: "success" 
          });
        } else {
          pushToast({ 
            message: "Novo código de verificação enviado para o seu e-mail.", 
            tone: "ok" 
          });
        }
        setCode(["", "", "", "", "", ""]);
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      } else {
        const errorMsg = result.error || "Não foi possível reenviar o código. Tente novamente.";
        setError(errorMsg);
        if (pushToast) {
          pushToast({ message: errorMsg, tone: "err" });
        }
      }
    } catch (e: any) {
      const errorMsg = e?.message || "Erro ao reenviar código. Tente novamente.";
      setError(errorMsg);
      if (pushToast) {
        pushToast({ message: errorMsg, tone: "err" });
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate("/")}
          className="mb-6 flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Voltar</span>
        </button>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-100 dark:bg-cyan-900/30 mb-4">
              <Mail size={32} className="text-cyan-600 dark:text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Verifique seu e-mail
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Enviamos um código para <span className="font-semibold text-slate-900 dark:text-white">{email}</span>
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
              Digite o código de 6 dígitos para ativar sua conta
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg text-sm text-rose-800 dark:text-rose-200">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Código de verificação
            </label>
            <div className="flex gap-2 justify-center">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 dark:focus:ring-cyan-400/20 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors"
                />
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Digite sua senha"
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 focus:border-cyan-500 dark:focus:border-cyan-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Digite sua senha para confirmar a verificação
            </p>
          </div>

          <button
            onClick={handleVerify}
            disabled={loading || code.join("").length !== 6 || !password.trim()}
            className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-lime-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Verificando...</span>
              </>
            ) : (
              "Confirmar código"
            )}
          </button>

          <div className="text-center">
            <button
              onClick={handleResend}
              disabled={resending || resendCooldown > 0}
              className="text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {resending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Enviando...
                </span>
              ) : resendCooldown > 0 ? (
                `Reenviar código (${resendCooldown}s)`
              ) : (
                "Reenviar código"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

