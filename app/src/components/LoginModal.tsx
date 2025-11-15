import React from "react";
import { Link } from "react-router-dom";
import { X, Mail, Lock, User, Eye, EyeOff, Sparkles as Dice, Check } from "lucide-react";

export interface LoginModalProps {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
  };
  loginType: "signin" | "signup";
  showPassword: boolean;
  firstNameError: string;
  emailError: string;
  passwordError: string;
  loginError: string;
  passwordErrors: string[];
  passwordStrength: "muito-fraca" | "fraca" | "boa" | "forte";
  showPasswordTips: boolean;
  confirmPasswordError: string;
  confirmPasswordTouched: boolean;
  authLoading: boolean;
  showForgotPassword: boolean;
  forgotPasswordEmail: string;
  forgotPasswordLoading: boolean;
  forgotPasswordMessage: string;
  forgotPasswordError: string;
  forgotPasswordStep: "email" | "password";
  forgotPasswordNewPassword: string;
  forgotPasswordConfirmPassword: string;
  forgotPasswordShowPassword: boolean;
  emailVerified: boolean;
  t: (key: string) => string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleInputBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleSubmit: (e?: React.MouseEvent) => Promise<void>;
  setShowLogin: (show: boolean) => void;
  setLoginType: (type: "signin" | "signup") => void;
  setLoginError: (error: string) => void;
  setFirstNameError: (error: string) => void;
  setEmailError: (error: string) => void;
  setPasswordError: (error: string) => void;
  setShowPassword: (show: boolean | ((prev: boolean) => boolean)) => void;
  setFormData: React.Dispatch<React.SetStateAction<{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
  }>>;
  setShowForgotPassword: (show: boolean) => void;
  setForgotPasswordEmail: (email: string) => void;
  setForgotPasswordError: (error: string) => void;
  setForgotPasswordMessage: (message: string) => void;
  setForgotPasswordStep: (step: "email" | "password") => void;
  setForgotPasswordNewPassword: (password: string) => void;
  setForgotPasswordConfirmPassword: (password: string) => void;
  setForgotPasswordShowPassword: (show: boolean) => void;
  generatePassword: () => void;
  setShowPasswordTips: (show: boolean) => void;
  setConfirmPasswordError: (error: string) => void;
  setConfirmPasswordTouched: (touched: boolean) => void;
  handleForgotPasswordCheckEmail: (e?: React.MouseEvent) => Promise<void>;
  handleForgotPasswordReset: (e?: React.MouseEvent) => Promise<void>;
}

export const LoginModal: React.FC<LoginModalProps> = React.memo(({
  formData,
  loginType,
  showPassword,
  firstNameError,
  emailError,
  passwordError,
  loginError,
  passwordErrors,
  passwordStrength,
  showPasswordTips,
  confirmPasswordError,
  confirmPasswordTouched,
  authLoading,
  showForgotPassword,
  forgotPasswordEmail,
  forgotPasswordLoading,
  forgotPasswordMessage,
  forgotPasswordError,
  forgotPasswordStep,
  forgotPasswordNewPassword,
  forgotPasswordConfirmPassword,
  forgotPasswordShowPassword,
  emailVerified,
  t,
  handleInputChange,
  handleInputBlur,
  handleSubmit,
  setShowLogin,
  setLoginType,
  setLoginError,
  setFirstNameError,
  setEmailError,
  setPasswordError,
  setShowPassword,
  setFormData,
  setShowForgotPassword,
  setForgotPasswordEmail,
  setForgotPasswordError,
  setForgotPasswordMessage,
  setForgotPasswordStep,
  setForgotPasswordNewPassword,
  setForgotPasswordConfirmPassword,
  setForgotPasswordShowPassword,
  generatePassword,
  setShowPasswordTips,
  setConfirmPasswordError,
  setConfirmPasswordTouched,
  handleForgotPasswordCheckEmail,
  handleForgotPasswordReset,
}) => (
  <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-4 safe-area-inset" style={{ zIndex: 9999 }}>
    <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full max-h-[95vh] overflow-y-auto p-4 sm:p-6 md:p-8 relative border border-gray-200 dark:border-slate-800 shadow-xl">
      <button onClick={() => {
        setShowLogin(false);
        setLoginError("");
        setEmailError("");
        setPasswordError("");
        setShowForgotPassword(false);
        setForgotPasswordEmail("");
        setForgotPasswordNewPassword("");
        setForgotPasswordConfirmPassword("");
        setForgotPasswordStep("email");
        setForgotPasswordMessage("");
        setForgotPasswordError("");
      }} className="absolute top-3 right-3 sm:top-4 sm:right-4 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white active:text-gray-500 dark:active:text-gray-300 transition touch-manipulation" aria-label="Fechar">
        <X size={20} className="sm:w-6 sm:h-6" />
      </button>
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 bg-clip-text text-transparent mb-2">
          {t("app_title")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          {showForgotPassword ? "Recuperar senha" : loginType === "signin" ? "Entre na sua conta" : "Crie sua conta"}
        </p>
      </div>
      
      {showForgotPassword ? (
        <div className="space-y-4">
          {forgotPasswordStep === "email" ? (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Digite seu email para redefinir sua senha.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("email")}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="email" 
                    name="forgotPasswordEmail" 
                    value={forgotPasswordEmail} 
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    autoComplete="email"
                    className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white pl-10 pr-4 py-2.5 rounded-md focus:outline-none focus:ring-1 text-sm border border-gray-300 dark:border-slate-700 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t("your_email")} 
                  />
                </div>
              </div>
              
              {forgotPasswordError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-400">{forgotPasswordError}</p>
                </div>
              )}
              
              <button 
                type="button"
                onClick={handleForgotPasswordCheckEmail}
                disabled={forgotPasswordLoading || !forgotPasswordEmail.trim()}
                className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4">
                {forgotPasswordLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Continuar"
                )}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Digite sua nova senha.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nova senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type={forgotPasswordShowPassword ? "text" : "password"} 
                    value={forgotPasswordNewPassword} 
                    onChange={(e) => setForgotPasswordNewPassword(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white pl-10 pr-10 py-2.5 rounded-md focus:outline-none focus:ring-1 text-sm border border-gray-300 dark:border-slate-700 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••" 
                  />
                  <button
                    type="button"
                    onClick={() => setForgotPasswordShowPassword(!forgotPasswordShowPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {forgotPasswordShowPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirmar senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type={forgotPasswordShowPassword ? "text" : "password"} 
                    value={forgotPasswordConfirmPassword} 
                    onChange={(e) => setForgotPasswordConfirmPassword(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white pl-10 pr-4 py-2.5 rounded-md focus:outline-none focus:ring-1 text-sm border border-gray-300 dark:border-slate-700 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••" 
                  />
                </div>
                {forgotPasswordConfirmPassword && forgotPasswordNewPassword !== forgotPasswordConfirmPassword && (
                  <p className="mt-1 text-xs text-red-500">As senhas não coincidem</p>
                )}
              </div>
              
              {forgotPasswordMessage && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-400">{forgotPasswordMessage}</p>
                </div>
              )}
              
              {forgotPasswordError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-400">{forgotPasswordError}</p>
                </div>
              )}
              
              <button 
                type="button"
                onClick={handleForgotPasswordReset}
                disabled={forgotPasswordLoading || !forgotPasswordNewPassword.trim() || forgotPasswordNewPassword !== forgotPasswordConfirmPassword}
                className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4">
                {forgotPasswordLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Redefinindo...
                  </>
                ) : (
                  "Redefinir senha"
                )}
              </button>
            </>
          )}
          
          <button 
            type="button"
            onClick={() => {
              setShowForgotPassword(false);
              setForgotPasswordEmail("");
              setForgotPasswordNewPassword("");
              setForgotPasswordConfirmPassword("");
              setForgotPasswordStep("email");
              setForgotPasswordError("");
              setForgotPasswordMessage("");
            }}
            className="w-full text-center text-blue-500 text-sm hover:text-blue-600 hover:underline mt-2">
            {forgotPasswordStep === "password" ? "Voltar" : "Voltar para o login"}
          </button>
        </div>
      ) : (
      <div className="space-y-3">
        {loginType === "signup" && (
          <>
          <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Nome <span className="text-red-500">*</span>
              </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  name="firstName" 
                  value={formData.firstName} 
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  autoComplete="given-name"
                  className={`w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white pl-10 pr-4 py-2.5 rounded-md focus:outline-none focus:ring-1 ${
                    firstNameError 
                      ? "border-red-500 focus:ring-red-500" 
                      : "border-gray-300 dark:border-slate-700 focus:ring-blue-500"
                  } text-sm`}
                  placeholder="Seu nome" 
                  required
                />
            </div>
            {firstNameError && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{firstNameError}</p>
            )}
          </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Sobrenome</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  name="lastName" 
                  value={formData.lastName} 
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  autoComplete="family-name"
                  className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white pl-10 pr-4 py-2.5 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-300 dark:border-slate-700 text-sm"
                  placeholder="Seu sobrenome" 
                />
              </div>
            </div>
          </>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("email")}</label>
          <div className="relative">
            <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 ${emailError ? "text-red-500" : "text-gray-400"}`} size={20} />
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              autoComplete="email"
              className={`w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white pl-10 pr-4 py-2.5 rounded-md focus:outline-none focus:ring-1 text-sm border ${
                emailError 
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500" 
                  : "border-gray-300 dark:border-slate-700 focus:ring-blue-500 focus:border-blue-500"
              }`}
              placeholder={t("your_email")} 
            />
          </div>
          {emailError && (
            <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
              <span>{emailError}</span>
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("password")}</label>
          <div className="relative">
            <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${passwordError ? "text-red-500" : "text-gray-400"}`} size={20} />
            <input 
              type={showPassword ? "text" : "password"} 
              name="password" 
              value={formData.password} 
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              autoComplete={loginType === "signin" ? "current-password" : "new-password"}
              className={`w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white pl-10 ${loginType === "signup" ? "pr-24" : "pr-12"} py-2.5 rounded-md focus:outline-none focus:ring-1 text-sm border ${
                passwordError 
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500" 
                  : "border-gray-300 dark:border-slate-700 focus:ring-blue-500 focus:border-blue-500"
              }`}
              placeholder={loginType === "signup" ? "Crie uma senha segura" : "••••••••"}
              aria-describedby={passwordError ? "password-error" : loginType === "signup" ? "password-hint" : undefined}
            />
            {loginType === "signup" && (
              <button
                type="button"
                onClick={generatePassword}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition"
                title="Gerar senha forte"
                aria-label="Gerar senha forte"
              >
                <Dice size={18} />
              </button>
            )}
            <button type="button" onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          
          {loginType === "signup" && (
            <>
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        passwordStrength === "muito-fraca" ? "w-1/4 bg-red-500" :
                        passwordStrength === "fraca" ? "w-2/4 bg-orange-500" :
                        passwordStrength === "boa" ? "w-3/4 bg-yellow-500" :
                        "w-full bg-green-500"
                      }`}
                    />
                  </div>
                  <span className={`text-xs font-medium ${
                    passwordStrength === "muito-fraca" ? "text-red-500" :
                    passwordStrength === "fraca" ? "text-orange-500" :
                    passwordStrength === "boa" ? "text-yellow-500" :
                    "text-green-500"
                  }`}>
                    {passwordStrength === "muito-fraca" ? "Muito fraca" :
                     passwordStrength === "fraca" ? "Fraca" :
                     passwordStrength === "boa" ? "Boa" :
                     "Forte"}
                  </span>
                </div>
                
                {!formData.password && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1" id="password-hint">
                    Dica: misture letras, números e símbolos
                  </p>
                )}
                
                {formData.password && formData.password.length < 8 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1" role="alert">
                    Use 8+ caracteres
                  </p>
                )}
                
                {formData.password && formData.password.length >= 8 && (() => {
                  const hasLetters = /[a-zA-Z]/.test(formData.password);
                  const hasDigits = /\d/.test(formData.password);
                  const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password);
                  const groupsCount = [hasLetters, hasDigits, hasSymbols].filter(Boolean).length;
                  
                  if (groupsCount < 2) {
                    return (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1" role="alert">
                        Adicione letras, números ou símbolos
                      </p>
                    );
                  }
                  
                  const fullName = formData.lastName?.trim() 
                    ? `${formData.firstName.trim()} ${formData.lastName.trim()}`
                    : formData.firstName.trim();
                  const email = formData.email.trim().toLowerCase();
                  const pwdLower = formData.password.toLowerCase();
                  
                  if (fullName) {
                    const nameParts = fullName.toLowerCase().split(/\s+/).filter(p => p.length > 2);
                    if (nameParts.some(part => pwdLower.includes(part))) {
                      return (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1" role="alert">
                          Evite usar seu nome ou e-mail
                        </p>
                      );
                    }
                  }
                  
                  if (email) {
                    const emailLocal = email.split("@")[0];
                    if (pwdLower.includes(emailLocal) || pwdLower.includes(email)) {
                      return (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1" role="alert">
                          Evite usar seu nome ou e-mail
                        </p>
                      );
                    }
                  }
                  
                  return null;
                })()}
                
                <button
                  type="button"
                  onClick={() => setShowPasswordTips(!showPasswordTips)}
                  className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline mt-1"
                >
                  {showPasswordTips ? "Ocultar" : "Ver"} dicas de senha
                </button>
                
                {showPasswordTips && (
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700">
                    <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                      <li>• Mínimo de 8 caracteres</li>
                      <li>• Use pelo menos dois tipos: letras, números ou símbolos</li>
                      <li>• Evite usar seu nome ou e-mail</li>
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
          
          {passwordError && (
            <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1" id="password-error" role="alert">
              <span>{passwordError}</span>
            </p>
          )}
        </div>
        {loginType === "signup" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("confirm_password")}</label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${confirmPasswordError ? "text-red-500" : formData.confirmPassword && formData.password === formData.confirmPassword ? "text-green-500" : "text-gray-400"}`} size={20} />
              <input 
                type={showPassword ? "text" : "password"} 
                name="confirmPassword" 
                value={formData.confirmPassword} 
                onChange={(e) => {
                  handleInputChange(e);
                  if (confirmPasswordTouched) {
                    if (e.target.value !== formData.password) {
                      setConfirmPasswordError("As senhas não conferem");
                    } else {
                      setConfirmPasswordError("");
                    }
                  }
                }}
                onBlur={() => {
                  setConfirmPasswordTouched(true);
                  if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
                    setConfirmPasswordError("As senhas não conferem");
                  } else {
                    setConfirmPasswordError("");
                  }
                }}
                className={`w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white pl-10 ${formData.confirmPassword && formData.password === formData.confirmPassword ? "pr-10" : "pr-4"} py-2.5 rounded-md focus:outline-none focus:ring-1 text-sm border ${
                  confirmPasswordError
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : formData.confirmPassword && formData.password === formData.confirmPassword
                    ? "border-green-500 focus:ring-green-500 focus:border-green-500"
                    : "border-gray-300 dark:border-slate-700 focus:ring-blue-500 focus:border-blue-500"
                }`}
                placeholder="Confirme sua senha"
                aria-describedby={confirmPasswordError ? "confirm-password-error" : undefined}
              />
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" size={20} />
              )}
            </div>
            {confirmPasswordError && confirmPasswordTouched && (
              <p className="mt-1 text-sm text-red-500" id="confirm-password-error" role="alert">
                {confirmPasswordError}
              </p>
            )}
          </div>
        )}
        
        {loginType === "signup" && (
          <>
            <div className="flex items-start gap-3 mt-4">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={formData.acceptTerms}
                onChange={(e) => setFormData(prev => ({ ...prev, acceptTerms: e.target.checked }))}
                className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                required
              />
              <label htmlFor="acceptTerms" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1">
                Concordo com os <Link to="/terms" target="_blank" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline">Termos de Uso</Link> e a <Link to="/privacy" target="_blank" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline">Política de Privacidade</Link>
              </label>
            </div>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="newsletter"
                className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
              />
              <label htmlFor="newsletter" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer flex-1">
                (Opcional) Quero receber novidades por e-mail
              </label>
            </div>
          </>
        )}
        
        <button 
          type="button"
          onClick={handleSubmit}
          disabled={
            authLoading || 
            (loginType === "signup" && (
              !formData.firstName?.trim() || 
              !formData.email?.trim() || 
              !formData.password?.trim() || 
              formData.password !== formData.confirmPassword || 
              passwordErrors.length > 0 || 
              !formData.acceptTerms ||
              !!emailError ||
              !!passwordError ||
              !!confirmPasswordError
            ))
          }
          className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4">
          {authLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {loginType === "signin" ? "Entrando..." : "Criando conta..."}
            </>
          ) : (
            loginType === "signin" ? "Entrar" : "Criar conta"
          )}
        </button>
        
        {loginType === "signin" && loginError && (
          <p className="text-center text-red-500 text-sm mt-2">
            {loginError}
          </p>
        )}
      </div>
      )}
      {loginType === "signin" && !showForgotPassword && (
        <div className="text-center mt-4 space-y-2">
          <button 
            type="button"
            onClick={() => {
              setShowForgotPassword(true);
              setForgotPasswordEmail(formData.email);
            }}
            className="text-blue-500 text-sm hover:text-blue-600 hover:underline block">
            {t("forgot_password")}
          </button>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Ainda não tem conta?{" "}
            <button
              type="button"
              onClick={() => {
                setLoginType("signup");
                setShowForgotPassword(false);
                setLoginError("");
                setEmailError("");
                setPasswordError("");
              }}
              className="text-blue-500 hover:text-blue-600 hover:underline font-semibold">
              Criar conta
            </button>
          </div>
        </div>
      )}
      {loginType === "signup" && (
        <div className="text-center mt-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Já tem conta?{" "}
            <button
              type="button"
              onClick={() => {
                setLoginType("signin");
                setShowForgotPassword(false);
                setLoginError("");
                setEmailError("");
                setPasswordError("");
              }}
              className="text-blue-500 hover:text-blue-600 hover:underline font-semibold">
              Entrar
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
));

LoginModal.displayName = "LoginModal";
