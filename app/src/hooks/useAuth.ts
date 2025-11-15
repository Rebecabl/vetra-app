import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api, { type UserProfile } from "../api";
import { useToast } from "../ui/Toast";

interface UseAuthReturn {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  user: UserProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  isCheckingSession: boolean;
  profileLoading: boolean;
  authLoading: boolean;
  
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
  }>>;
  loginType: "signin" | "signup";
  setLoginType: (type: "signin" | "signup") => void;
  showPassword: boolean;
  setShowPassword: (show: boolean | ((prev: boolean) => boolean)) => void;
  emailError: string;
  setEmailError: (error: string) => void;
  passwordError: string;
  setPasswordError: (error: string) => void;
  loginError: string;
  setLoginError: (error: string) => void;
  passwordErrors: string[];
  setPasswordErrors: (errors: string[]) => void;
  passwordStrength: "muito-fraca" | "fraca" | "boa" | "forte";
  setPasswordStrength: (strength: "muito-fraca" | "fraca" | "boa" | "forte") => void;
  showPasswordTips: boolean;
  setShowPasswordTips: (show: boolean) => void;
  confirmPasswordError: string;
  setConfirmPasswordError: (error: string) => void;
  confirmPasswordTouched: boolean;
  setConfirmPasswordTouched: (touched: boolean) => void;
  
  showForgotPassword: boolean;
  setShowForgotPassword: (show: boolean) => void;
  forgotPasswordEmail: string;
  setForgotPasswordEmail: (email: string) => void;
  forgotPasswordLoading: boolean;
  setForgotPasswordLoading: (value: boolean) => void;
  forgotPasswordMessage: string;
  setForgotPasswordMessage: (message: string) => void;
  forgotPasswordError: string;
  setForgotPasswordError: (error: string) => void;
  forgotPasswordStep: "email" | "password";
  setForgotPasswordStep: (step: "email" | "password") => void;
  forgotPasswordNewPassword: string;
  setForgotPasswordNewPassword: (password: string) => void;
  forgotPasswordConfirmPassword: string;
  setForgotPasswordConfirmPassword: (password: string) => void;
  forgotPasswordShowPassword: boolean;
  setForgotPasswordShowPassword: (show: boolean) => void;
  emailVerified: boolean;
  setEmailVerified: (verified: boolean) => void;
  
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleInputBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleSubmit: (e?: React.MouseEvent) => Promise<void>;
  loadProfile: (email: string) => Promise<void>;
  saveProfile: (profileData: { name: string; avatar_url?: string | null }) => Promise<void>;
  generatePassword: () => void;
  handleForgotPasswordCheckEmail: (e?: React.MouseEvent) => Promise<void>;
  handleForgotPasswordReset: (e?: React.MouseEvent) => Promise<void>;
  
  pendingAction: (() => void) | null;
  setPendingAction: (action: (() => void) | null) => void;
  pendingRoute: string | null;
  setPendingRoute: (route: string | null) => void;
}

export const useAuth = (
  pushToast: (toast: { message: string; tone: "ok" | "err" | "info" | "warn" }) => void,
  pushBanner?: (banner: { message: string; tone: "success" | "error" | "warning" | "info" }) => void
): UseAuthReturn => {
  const navigate = useNavigate();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });
  const [loginType, setLoginType] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [passwordStrength, setPasswordStrength] = useState<"muito-fraca" | "fraca" | "boa" | "forte">("muito-fraca");
  const [showPasswordTips, setShowPasswordTips] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>("");
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [forgotPasswordStep, setForgotPasswordStep] = useState<"email" | "password">("email");
  const [forgotPasswordNewPassword, setForgotPasswordNewPassword] = useState("");
  const [forgotPasswordConfirmPassword, setForgotPasswordConfirmPassword] = useState("");
  const [forgotPasswordShowPassword, setForgotPasswordShowPassword] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [showVerificationEmailModal, setShowVerificationEmailModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  
  // Refs para evitar dependências problemáticas no useCallback
  const validationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emailErrorRef = useRef(emailError);
  const passwordErrorRef = useRef(passwordError);
  const loginErrorRef = useRef(loginError);
  const passwordErrorsRef = useRef(passwordErrors);
  const loginTypeRef = useRef(loginType);
  const formDataRef = useRef(formData);
  
  useEffect(() => {
    emailErrorRef.current = emailError;
    passwordErrorRef.current = passwordError;
    loginErrorRef.current = loginError;
    passwordErrorsRef.current = passwordErrors;
    loginTypeRef.current = loginType;
  }, [emailError, passwordError, loginError, passwordErrors, loginType]);
  
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);
  
  const loadProfile = async (email: string) => {
    try {
      setProfileLoading(true);
      const data: UserProfile = await api.profileGet(email);
      
      console.log("[loadProfile] Dados do perfil recebidos:", {
        email: data?.email,
        status: data?.status,
        deletedAt: data?.deletedAt,
        deletionScheduledFor: data?.deletionScheduledFor
      });
   
      if (data?.name && data.name.trim() && data.name !== "Usuário") {
        setUser({ 
          name: data.name.trim(), 
          email: data?.email ?? email, 
          avatar_url: data?.avatar_url ?? null, 
          updatedAt: data?.updatedAt ?? null,
          status: data?.status,
          deletedAt: data?.deletedAt,
          deletionScheduledFor: data?.deletionScheduledFor
        });
      } else if (data?.name) {
        setUser({ 
          name: data.name, 
          email: data?.email ?? email, 
          avatar_url: data?.avatar_url ?? null, 
          updatedAt: data?.updatedAt ?? null,
          status: data?.status,
          deletedAt: data?.deletedAt,
          deletionScheduledFor: data?.deletionScheduledFor
        });
      } else {
        // Se não tem nome, ainda armazenar o status
        setUser({
          name: "Usuário",
          email: data?.email ?? email,
          avatar_url: data?.avatar_url ?? null,
          updatedAt: data?.updatedAt ?? null,
          status: data?.status,
          deletedAt: data?.deletedAt,
          deletionScheduledFor: data?.deletionScheduledFor
        });
      }
      
      console.log("[loadProfile] User state atualizado:", {
        email: user?.email,
        status: user?.status,
        deletedAt: user?.deletedAt
      });
    } catch (error) {
      console.error("[loadProfile] Erro ao carregar perfil:", error);
    } finally { 
      setProfileLoading(false); 
    }
  };
  
  const saveProfile = async (profileData: { name: string; avatar_url?: string | null }) => {
    if (!user?.email) throw new Error("email obrigatório");
    const res = await api.profileUpdate({ 
      name: profileData.name.trim(), 
      email: user.email,
      avatar_url: profileData.avatar_url || null
    });
    setUser((u) => ({ 
      name: res.name, 
      email: u?.email || user?.email || "", 
      avatar_url: res.avatar_url ?? null, 
      updatedAt: res.updatedAt ?? null 
    }));
  };
  
  const calculatePasswordStrength = (pwd: string): "muito-fraca" | "fraca" | "boa" | "forte" => {
    if (!pwd || pwd.length < 8) return "muito-fraca";
    
    const hasLetters = /[a-zA-Z]/.test(pwd);
    const hasDigits = /\d/.test(pwd);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);
    
    const groupsCount = [hasLetters, hasDigits, hasSymbols].filter(Boolean).length;
    
    if (groupsCount < 2) return "fraca";
    if (pwd.length >= 12 && groupsCount === 3) return "forte";
    return "boa";
  };
  
  const validatePasswordInRealTime = useCallback(() => {
    const errors: string[] = [];
    const pwd = formDataRef.current.password;
    const fullName = formDataRef.current.lastName?.trim() 
      ? `${formDataRef.current.firstName.trim()} ${formDataRef.current.lastName.trim()}`
      : formDataRef.current.firstName.trim();
    const email = formDataRef.current.email.trim().toLowerCase();
    
    if (!pwd) {
      setPasswordStrength("muito-fraca");
      setPasswordErrors([]);
      return;
    }
    
    const strength = calculatePasswordStrength(pwd);
    setPasswordStrength(strength);
    
    if (pwd.length < 8) {
      errors.push("A senha precisa ter pelo menos 8 caracteres");
    }
    
    const hasLetters = /[a-zA-Z]/.test(pwd);
    const hasDigits = /\d/.test(pwd);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);
    const groupsCount = [hasLetters, hasDigits, hasSymbols].filter(Boolean).length;
    
    if (pwd.length >= 8 && groupsCount < 2) {
      errors.push("Use pelo menos dois tipos: letras, números ou símbolos");
    }
    
    if (fullName) {
      const nameParts = fullName.toLowerCase().split(/\s+/).filter(p => p.length > 2);
      const pwdLower = pwd.toLowerCase();
      if (nameParts.some(part => pwdLower.includes(part))) {
        errors.push("Sua senha não deve conter seu nome ou e-mail");
      }
    }
    
    if (email) {
      const emailLocal = email.split("@")[0];
      const pwdLower = pwd.toLowerCase();
      if (pwdLower.includes(emailLocal) || pwdLower.includes(email)) {
        errors.push("Sua senha não deve conter seu nome ou e-mail");
      }
    }
    
    setPasswordErrors(errors);
  }, []);
  
  const validateEmailFormat = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: newValue };
      formDataRef.current = updated;
      return updated;
    });
    
    if (name === "email") {
      if (emailErrorRef.current) setEmailError("");
      if (loginTypeRef.current === "signin" && loginErrorRef.current) setLoginError("");
      
      // Validação de formato de e-mail no cadastro
      if (loginTypeRef.current === "signup" && value.trim() && !validateEmailFormat(value.trim())) {
        setEmailError("Informe um e-mail válido, no formato nome@dominio.com.");
      }
    }
    if (name === "password") {
      if (passwordErrorRef.current) setPasswordError("");
      if (passwordErrorsRef.current.length > 0) setPasswordErrors([]);
      if (loginTypeRef.current === "signin" && loginErrorRef.current) setLoginError("");
      if (loginTypeRef.current === "signup") {
        setTimeout(() => validatePasswordInRealTime(), 0);
      }
    }
    if (name === "confirmPassword" && loginTypeRef.current === "signup") {
      const currentPassword = formDataRef.current?.password || "";
      if (value && value !== currentPassword) {
        setConfirmPasswordError("As senhas não conferem");
      } else if (value === currentPassword) {
        setConfirmPasswordError("");
      }
    }
  }, [validatePasswordInRealTime]);
  
  const handleInputBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
  
    if (loginTypeRef.current === "signup" && (name === "password" || name === "firstName" || name === "lastName" || name === "email")) {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
      
      validationTimeoutRef.current = setTimeout(() => {
        validatePasswordInRealTime();
      }, 300);
    }
  }, [validatePasswordInRealTime]);
  
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);
  
  const generatePassword = () => {
    const length = 16;
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    const all = lowercase + uppercase + numbers + symbols;
    
    let password = "";
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    for (let i = password.length; i < length; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }
    
    password = password.split("").sort(() => Math.random() - 0.5).join("");
    
    setFormData(prev => ({ ...prev, password, confirmPassword: password }));
    setPasswordErrors([]);
    setConfirmPasswordError("");
    setConfirmPasswordTouched(false);
    validatePasswordInRealTime();
  };
  
  const handleSubmit = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (loginType === "signup") {
      if (!formData.firstName?.trim()) {
        pushToast({ message: "Preencha seu nome", tone: "warn" });
        return;
      }
      
      if (!formData.email?.trim()) {
        setEmailError("Informe um e-mail válido");
        return;
      }
      
      if (emailError) {
        return;
      }
      
      if (!formData.password?.trim()) {
        setPasswordError("A senha precisa ter pelo menos 8 caracteres");
        return;
      }
      
      if (passwordErrors.length > 0) {
        setPasswordError(passwordErrors[0]);
        return;
      }
      
      if (formData.password !== formData.confirmPassword) {
        setConfirmPasswordError("As senhas não conferem");
        setConfirmPasswordTouched(true);
        return;
      }

      if (!formData.acceptTerms) {
        pushToast({ message: "Você precisa aceitar os Termos e a Política de Privacidade", tone: "warn" });
        return;
      }
    }
    
    if (loginType === "signin") {
      setEmailError("");
      setPasswordError("");
      setLoginError("");
      
      if (!formData.email?.trim()) {
        setEmailError("Por favor, insira seu email.");
        return;
      }
      if (!formData.password?.trim()) {
        setPasswordError("Por favor, insira sua senha.");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        setEmailError("Por favor, insira um email válido.");
        return;
      }
    } else {
      setEmailError("");
      setPasswordError("");
      setLoginError("");
    }

    // Validação de formato de e-mail antes de submeter
    if (loginType === "signup" && !validateEmailFormat(formData.email.trim())) {
      setEmailError("Informe um e-mail válido, no formato nome@dominio.com.");
      setAuthLoading(false);
      return;
    }

    setAuthLoading(true);
    try {
      let result;
      if (loginType === "signup") {
        const fullName = formData.lastName?.trim() 
          ? `${formData.firstName.trim()} ${formData.lastName.trim()}`
          : formData.firstName.trim();
        
        result = await api.authSignup(
          fullName || "Usuário",
          formData.email.trim().toLowerCase(),
          formData.password
        );
      } else {
        result = await api.authSignin(
          formData.email.trim().toLowerCase(),
          formData.password.trim() 
        );
      }

      if (!result.ok) {
        console.log("[handleSubmit] Erro recebido:", result);
        console.log("[handleSubmit] result.error:", result.error);
        console.log("[handleSubmit] result.message:", (result as any).message);
        
        let errorMsg = "Erro ao fazer login";
        let actualError = result.error;
        let actualMessage = (result as any).message;
       
        if (typeof result.error === "string" && result.error.includes("{")) {
          try {
            const jsonMatch = result.error.match(/\{.*\}/);
            if (jsonMatch) {
              const parsedError = JSON.parse(jsonMatch[0]);
              actualError = parsedError.error || actualError;
              actualMessage = parsedError.message || actualMessage;
              console.log("[handleSubmit] Erro parseado:", { actualError, actualMessage });
            }
          } catch (e) {
            console.warn("[handleSubmit] Erro ao fazer parse do erro:", e);
          }
        }
        
        if (actualError && String(actualError).includes("Backend não disponível")) {
          errorMsg = "Backend não está rodando. Por favor, inicie o servidor: cd api && npm run dev";
          pushToast({ message: errorMsg, tone: "err" });
          setAuthLoading(false);
          console.error("[handleSubmit] Backend não disponível. Verifique se o servidor está rodando na porta 4001.");
          return;
        }

        if (actualError === "credenciais_invalidas" || 
            actualError === "Credenciais inválidas" || 
            actualError === "INVALID_LOGIN_CREDENTIALS" ||
            String(actualError).includes("credenciais_invalidas") ||
            String(result.error).includes("credenciais_invalidas")) {
          if (loginType === "signin") {
            errorMsg = actualMessage || "Sua senha está incorreta. Confira-a.";
            console.log("[handleSubmit] Definindo passwordError:", errorMsg);
            setPasswordError(errorMsg);
            setAuthLoading(false);
            return;
          } else {
            errorMsg = actualMessage || "Erro ao criar conta";
            pushToast({ message: errorMsg, tone: "err" });
            setAuthLoading(false);
            return;
          }
        }
   
        if (result.error === "email_ja_cadastrado" || String(actualError).includes("email") && String(actualError).includes("já") || String(actualError).includes("already")) {
          if (loginType === "signup") {
            setEmailError("Este e-mail já está em uso. Tente entrar ou recuperar sua senha.");
            setAuthLoading(false);
            return;
          } else {
            errorMsg = "Este e-mail já está em uso. Tente entrar ou recuperar sua senha.";
            pushToast({ message: errorMsg, tone: "err" });
            setAuthLoading(false);
            return;
          }
        }

        if (loginType === "signup") {
          if (result.error === "senha_fraca" || String(actualError).includes("senha")) {
            const errors = (result as any).errors || [];
            if (errors.length > 0) {
              const firstError = errors[0];
              if (firstError.includes("8 caracteres")) {
                setPasswordError("A senha precisa ter pelo menos 8 caracteres");
              } else if (firstError.includes("dois tipos")) {
                setPasswordError("Use pelo menos dois tipos: letras, números ou símbolos");
              } else if (firstError.includes("nome ou e-mail")) {
                setPasswordError("Sua senha não deve conter seu nome ou e-mail");
              } else {
                setPasswordError(firstError);
              }
            } else {
              setPasswordError("A senha não atende aos critérios de segurança");
            }
            setAuthLoading(false);
            return;
          }

          if (String(actualError).includes("rate") || String(actualError).includes("limit") || String(actualError).includes("muitas tentativas")) {
            errorMsg = "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
            pushToast({ message: errorMsg, tone: "err" });
            setAuthLoading(false);
            return;
          }
        }
        
        if (result.error === "email_invalido") {
          if (loginType === "signin") {
            setEmailError((result as any).message || "Formato de email inválido");
            setAuthLoading(false);
            return;
          } else {
            pushToast({ message: (result as any).message || "Formato de email inválido", tone: "err" });
            setAuthLoading(false);
            return;
          }
        }
        
        if (result.error === "nome_obrigatorio") {
          pushToast({ message: "Nome é obrigatório", tone: "err" });
          setAuthLoading(false);
          return;
        }
        
        if (result.error) {
          errorMsg = result.error;
          pushToast({ message: errorMsg, tone: "err" });
          setAuthLoading(false);
          return;
        }
        
        console.error("[handleSubmit] Erro não tratado:", result);
        pushToast({ message: "Erro ao fazer login. Tente novamente.", tone: "err" });
        setAuthLoading(false);
        return;
      }

      if (result.user) {
        setIsLoggedIn(true);
        const userEmail = result.user.email || formData.email.trim().toLowerCase();
        setUser({
          name: result.user.name || (loginType === "signup" ? (formData.lastName?.trim() ? `${formData.firstName.trim()} ${formData.lastName.trim()}` : formData.firstName.trim()) : "Usuário") || "Usuário",
          email: userEmail,
          avatar_url: result.user.avatar_url || null,
          updatedAt: result.user.updatedAt || null,
        });
        
        if (pendingAction) {
          setTimeout(() => {
            pendingAction();
            setPendingAction(null);
            pushToast({ message: "Ação concluída!", tone: "ok" });
          }, 300);
        }
        
        if (pendingRoute) {
          setTimeout(() => {
            navigate(pendingRoute);
            setPendingRoute(null);
          }, 100);
        }
        setFormData({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "", acceptTerms: false });
        setPasswordErrors([]);
        setEmailError("");
        setLoginError(""); 
        
        if (result.idToken) {
          try {
            // Limpa navegação salva antes de salvar o token (novo login, não reload)
            localStorage.removeItem('vetra:activeTab');
            localStorage.removeItem('vetra:activeCategory');
            sessionStorage.removeItem('vetra:justLoggedOut');
            
            console.log("[handleSubmit] Salvando idToken no localStorage");
            localStorage.setItem('vetra:idToken', result.idToken);
            if (result.refreshToken) {
              localStorage.setItem('vetra:refreshToken', result.refreshToken);
            }
            console.log("[handleSubmit] Tokens salvos com sucesso");
          } catch (e) {
            console.error("[handleSubmit] Erro ao salvar tokens:", e);
          }
        } else {
          console.warn("[handleSubmit] ATENÇÃO: idToken não recebido do backend!");
          console.warn("[handleSubmit] Result completo:", result);
        }
        
        if (userEmail) {
          try {
            localStorage.setItem('vetra:last_email', userEmail);
          } catch {}
        }
  
        if (userEmail) {
          loadProfile(userEmail);
        }
        
        if (pushBanner) {
          const userName = result.user?.name || "Usuário";
          const firstName = userName.split(' ')[0];
          pushBanner({ 
            message: loginType === "signup" 
              ? "Conta criada com sucesso. Você já pode começar a usar o VETRA." 
              : `Login realizado com sucesso. Bem-vinda de volta, ${firstName}!`, 
            tone: "success" 
          });
        } else {
          pushToast({ 
            message: loginType === "signup" ? "Conta criada com sucesso. Você já pode começar a usar o VETRA." : "Login realizado com sucesso.", 
            tone: "ok" 
          });
        }
      }
    } catch (error: any) {
      console.error("Erro na autenticação:", error);
      console.error("Erro completo:", JSON.stringify(error, null, 2));
      
      // Reabilita conta automaticamente se estiver desabilitada
      if (error?.error === "conta_desabilitada" || error?.message?.includes("desabilitada")) {
        const emailToReEnable = formData.email.trim().toLowerCase();
        if (emailToReEnable) {
          console.log("[handleSubmit] Tentando reabilitar conta automaticamente:", emailToReEnable.substring(0, 3) + "***");
          try {
            const reEnableResult = await api.reEnableAccount(emailToReEnable);
            if (reEnableResult.ok) {
              console.log("[handleSubmit] Conta reabilitada, tentando login novamente...");
              try {
                const retryResult = await api.authSignin(emailToReEnable, formData.password);
                if (retryResult.ok && retryResult.idToken) {
                  setIsLoggedIn(true);
                  const userEmail = retryResult.user?.email || emailToReEnable;
                  setUser({ 
                    name: retryResult.user?.name || "Usuário", 
                    email: userEmail,
                    avatar_url: retryResult.user?.avatar_url || null,
                    updatedAt: retryResult.user?.updatedAt || null
                  });
                  
                  try {
                    // Limpa navegação salva antes de salvar o token (novo login, não reload)
                    localStorage.removeItem('vetra:activeTab');
                    localStorage.removeItem('vetra:activeCategory');
                    sessionStorage.removeItem('vetra:justLoggedOut');
                    
                    localStorage.setItem('vetra:idToken', retryResult.idToken);
                    if (retryResult.refreshToken) {
                      localStorage.setItem('vetra:refreshToken', retryResult.refreshToken);
                    }
                    localStorage.setItem('vetra:last_email', userEmail);
                  } catch {}
                  
                  if (userEmail) {
                    loadProfile(userEmail);
                  }
                  
                  if (pushBanner) {
                    const userName = retryResult.user?.name || "Usuário";
                    const firstName = userName.split(' ')[0];
                    pushBanner({ 
                      message: `Login realizado com sucesso. Bem-vinda de volta, ${firstName}!`, 
                      tone: "success" 
                    });
                  } else {
                    pushToast({ 
                      message: "Login realizado com sucesso.", 
                      tone: "ok" 
                    });
                  }
                  return;
                }
              } catch (retryError: any) {
                console.error("[handleSubmit] Erro ao fazer login após reabilitação:", retryError);
                setLoginError(retryError?.message || "Erro ao fazer login após reabilitação. Tente novamente.");
              }
            } else {
              console.error("[handleSubmit] Erro ao reabilitar conta:", reEnableResult.error);
              setLoginError(reEnableResult.error || "Conta desabilitada. Não foi possível reabilitar automaticamente.");
            }
          } catch (reEnableError: any) {
            console.error("[handleSubmit] Erro ao tentar reabilitar conta:", reEnableError);
            setLoginError("Conta desabilitada. Entre em contato com o suporte.");
          }
        } else {
          setLoginError("Conta desabilitada. Entre em contato com o suporte.");
        }
        setAuthLoading(false);
        return;
      }
      
      const errorMessage = error?.message || error?.error || String(error);
      const errorString = JSON.stringify(error);
      
      if (errorMessage.includes("credenciais_invalidas") || 
          errorMessage.includes("Credenciais inválidas") ||
          errorMessage.includes("INVALID_LOGIN_CREDENTIALS") ||
          errorMessage.includes("Senha incorreta") ||
          errorString.includes("credenciais_invalidas") ||
          errorString.includes("INVALID_LOGIN_CREDENTIALS")) {
        if (loginType === "signin") {
          setPasswordError("Sua senha está incorreta. Confira-a.");
          setAuthLoading(false);
          return;
        }
      }
      
      if (errorMessage.includes("email") && (errorMessage.includes("inválido") || errorMessage.includes("inválido"))) {
        if (loginType === "signin") {
          setEmailError("Por favor, insira um email válido.");
          setAuthLoading(false);
          return;
        }
      }
      
      pushToast({ message: error?.message || "Erro ao fazer login. Tente novamente.", tone: "err" });
      setAuthLoading(false);
    } finally {
      setAuthLoading(false);
    }
  };
  
  // Verifica sessão persistente ao carregar o app
  useEffect(() => {
    const checkPersistedSession = async () => {
      try {
        const idToken = localStorage.getItem('vetra:idToken');
        const lastEmail = localStorage.getItem('vetra:last_email');
        
        if (idToken && lastEmail) {
          console.log("[checkPersistedSession] Token encontrado, verificando sessão...");
          
          const verifyResult = await api.authVerify(idToken);
          
          if (verifyResult.ok && verifyResult.user) {
            console.log("[checkPersistedSession] Sessão válida, restaurando login...");
            setIsLoggedIn(true);
            setUser({
              name: verifyResult.user.name || "Usuário",
              email: verifyResult.user.email || lastEmail,
              avatar_url: verifyResult.user.avatar_url || null,
              updatedAt: verifyResult.user.updatedAt || null,
            });
            await loadProfile(verifyResult.user.email || lastEmail);
          } else {
            console.log("[checkPersistedSession] Token inválido ou expirado, limpando...");
            localStorage.removeItem('vetra:idToken');
            localStorage.removeItem('vetra:refreshToken');
            localStorage.removeItem('vetra:last_email');
            setIsLoggedIn(false);
            setUser(null);
          }
        } else {
          console.log("[checkPersistedSession] Nenhuma sessão persistida encontrada");
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error("[checkPersistedSession] Erro ao verificar sessão:", error);
        localStorage.removeItem('vetra:idToken');
        localStorage.removeItem('vetra:refreshToken');
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setIsCheckingSession(false);
      }
    };
    
    checkPersistedSession();
  }, []);
  
  useEffect(() => {
    if (isLoggedIn && (user?.email || "").trim()) {
      loadProfile(user!.email!);
    }
  }, [isLoggedIn, user?.email]);
  
  const handleForgotPasswordCheckEmail = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
  };

  const handleForgotPasswordReset = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
  };
  
  return {
    isLoggedIn,
    setIsLoggedIn,
    user,
    setUser,
    isCheckingSession,
    profileLoading,
    authLoading,
    formData,
    setFormData,
    loginType,
    setLoginType,
    showPassword,
    setShowPassword,
    emailError,
    setEmailError,
    passwordError,
    setPasswordError,
    loginError,
    setLoginError,
    passwordErrors,
    setPasswordErrors,
    passwordStrength,
    setPasswordStrength,
    showPasswordTips,
    setShowPasswordTips,
    confirmPasswordError,
    setConfirmPasswordError,
    confirmPasswordTouched,
    setConfirmPasswordTouched,
    showForgotPassword,
    setShowForgotPassword,
    forgotPasswordEmail,
    setForgotPasswordEmail,
    forgotPasswordLoading,
    setForgotPasswordLoading,
    forgotPasswordMessage,
    setForgotPasswordMessage,
    forgotPasswordError,
    setForgotPasswordError,
    forgotPasswordStep,
    setForgotPasswordStep,
    forgotPasswordNewPassword,
    setForgotPasswordNewPassword,
    forgotPasswordConfirmPassword,
    setForgotPasswordConfirmPassword,
    forgotPasswordShowPassword,
    setForgotPasswordShowPassword,
    emailVerified,
    setEmailVerified,
    handleInputChange,
    handleInputBlur,
    handleSubmit,
    loadProfile,
    saveProfile,
    generatePassword,
    handleForgotPasswordCheckEmail,
    handleForgotPasswordReset,
    pendingAction,
    setPendingAction,
    pendingRoute,
    setPendingRoute,
  };
};

