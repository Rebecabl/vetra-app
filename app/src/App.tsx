import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Heart, Search, Star, Play, X, Mail, Lock, User, Eye, EyeOff, Clipboard, Plus,
  List as ListIcon, Share2, Pencil, Trash2, Home, ChevronDown, Settings, LogOut,
  BarChart3, Clock, TrendingUp, Film, Users, Calendar, Globe, DollarSign, Building2,
  PenTool, Video, Music, Scissors, Award, Tag, Tv, Link as LinkIcon, ThumbsUp,
  MessageCircle, Smile, Send, Bookmark, ChevronLeft, ChevronRight, Menu
} from "lucide-react";
import {
  Routes, Route, useLocation, useNavigate, Link, useParams
} from "react-router-dom";

import api, {
  tmdbAuthStatus,
  type ApiDetails,
  type ApiMovie,
  type ApiBrowseResp as BrowseResp,
  type ApiPersonDetails,
  personDetails as apiPersonDetails,
  popularPeople,
  changePassword,
  getComments,
  createComment,
  likeComment,
  reactToComment,
  deleteComment,
  type Comment,
  type DiscoverFilters,
} from "./api";
import type { UserProfile } from "./api";

import { useLang, type Lang } from "./i18n";
import { useDarkMode, ThemeButton } from "./theme";
import { ToastHost, useToast } from "./ui/Toast";

import { KebabMenu } from "./ui/KebabMenu";
import { LanguageMenu } from "./components/LanguageMenu";
import LandingScreen from "./landing/LandingScreen";
import { HorizontalCarousel } from "./components/HorizontalCarousel";
import { DiscoverFiltersPanel } from "./components/DiscoverFilters";

import { poster, toPosterPath, CAT_META, type CatKey } from "./lib/media.utils";

type MediaT = "movie" | "tv";
type MovieT = {
  id: number;
  media?: MediaT;
  title: string;
  rating?: number | null;
  voteCount?: number | null;
  year?: string | null;
  image: string;
  overview?: string;
  poster_path?: string | null;
};

type ApiStatus = "ok" | "falhou" | "carregando";
type TabKey = "home" | "favorites" | "lists" | "people" | "history" | "stats" | "watchlist";

type UserList = { id: string; name: string; items: MovieT[] };

type CatState = {
  items: MovieT[];
  page: number;
  totalPages?: number;
  loading: boolean;
  error?: string;
  initialized: boolean;
};

type UserState = "want" | "watched" | "not_watched" | "abandoned";
type UserStateMap = Record<
  string, // `${media}:${id}`
  { 
    state?: UserState; 
    rating?: number; 
    description?: string;
    // Cache básico do filme para exibição
    movieCache?: {
      title: string;
      poster_path?: string | null;
      image?: string;
      year?: string | null;
      media?: MediaT;
    };
  }
>;

const KEY_FAVS = "vetra:favorites";
const KEY_LISTS = "vetra:lists";
const KEY_STATES = "vetra:userstates";
const KEY_HISTORY = "vetra:watch_history";
const KEY_STATS = "vetra:user_stats";

const mediaKey = (m: MovieT) => `${m.media || "movie"}:${m.id}`;
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}> = ({ currentPage, totalPages, onPageChange, loading }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex justify-center items-center gap-1.5 mt-10 flex-wrap">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || loading}
        className="px-3 py-2 rounded-lg bg-white/5 dark:bg-slate-800/50 hover:bg-white/10 dark:hover:bg-slate-700/70 text-slate-700 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm border border-slate-200/20 dark:border-slate-700/50"
        aria-label="Página anterior"
      >
        ‹
      </button>
      {pages.map((page, idx) => {
        if (page === "...") {
          return (
            <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 dark:text-slate-500 text-sm">
              ...
            </span>
          );
        }
        const pageNum = page as number;
        const isActive = currentPage === pageNum;
        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-600"
                : "bg-white/5 dark:bg-slate-800/50 hover:bg-white/10 dark:hover:bg-slate-700/70 text-slate-600 dark:text-slate-300 border border-slate-200/20 dark:border-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed"
            }`}
            aria-label={`Ir para página ${pageNum}`}
            aria-current={isActive ? "page" : undefined}
          >
            {pageNum}
          </button>
        );
      })}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || loading}
        className="px-3 py-2 rounded-lg bg-white/5 dark:bg-slate-800/50 hover:bg-white/10 dark:hover:bg-slate-700/70 text-slate-700 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm border border-slate-200/20 dark:border-slate-700/50"
        aria-label="Próxima página"
      >
        ›
      </button>
    </div>
  );
};
const CategorySection: React.FC<{
  title: string;
  items: MovieT[];
  loading: boolean;
  error?: string;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  renderCard: (m: MovieT) => React.ReactNode;
  sectionKey?: string;
  subtitle?: string;
}> = ({ title, items, loading, error, currentPage, totalPages, onPageChange, renderCard, sectionKey, subtitle }) => (
  <section className="mb-12 md:mb-16">
    <div className="mb-6">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
      )}
    </div>
    {loading && items.length === 0 ? (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-cyan-500 dark:border-slate-700" />
      </div>
    ) : items.length > 0 ? (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
          {items.slice(0, 12).map((m, idx) => (
            <div key={`${sectionKey || title}-${m.media}-${m.id}-${idx}`} className="animate-fade-in-up" style={{ animationDelay: `${idx * 30}ms` }}>
              {renderCard(m)}
            </div>
          ))}
        </div>
        {currentPage && totalPages && totalPages > 1 && onPageChange && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            loading={loading}
          />
        )}
      </>
    ) : (
      <div className="text-center py-12 text-slate-500 dark:text-gray-400">
        {error ? `Falha ao carregar: ${error}` : "Sem resultados"}
      </div>
    )}
  </section>
);

// ======================= LoginModal (FORA do AppShell para evitar recriação) =======================
interface LoginModalProps {
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
  emailError: string;
  passwordError: string;
  loginError: string;
  passwordErrors: string[];
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
  setLoginError: (error: string) => void;
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
  handleForgotPasswordCheckEmail: (e?: React.MouseEvent) => Promise<void>;
  handleForgotPasswordReset: (e?: React.MouseEvent) => Promise<void>;
}

const LoginModal: React.FC<LoginModalProps> = React.memo(({
  formData,
  loginType,
  showPassword,
  emailError,
  passwordError,
  loginError,
  passwordErrors,
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
        setLoginError,
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
        handleForgotPasswordCheckEmail,
        handleForgotPasswordReset,
}) => (
  <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 safe-area-inset">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  name="firstName" 
                  value={formData.firstName} 
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  autoComplete="given-name"
                  className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white pl-10 pr-4 py-2.5 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-300 dark:border-slate-700 text-sm"
                  placeholder="Seu nome" 
                  required
                />
            </div>
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
              className={`w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white pl-10 pr-12 py-2.5 rounded-md focus:outline-none focus:ring-1 text-sm border ${
                passwordError 
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500" 
                  : "border-gray-300 dark:border-slate-700 focus:ring-blue-500 focus:border-blue-500"
              }`}
              placeholder="••••••••" 
            />
            <button type="button" onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {passwordError && (
            <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
              <span>{passwordError}</span>
            </p>
          )}
          
          {loginType === "signup" && (
            <div className="mt-2 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Critérios de senha:</p>
              <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <li className={`flex items-center gap-2 ${formData.password.length >= 8 ? 'text-green-500 dark:text-green-400' : ''}`}>
                  <span>{formData.password.length >= 8 ? '✓' : '•'}</span>
                  Mínimo de 8 caracteres
                </li>
                <li className={`flex items-center gap-2 ${/[A-Z]/.test(formData.password) ? 'text-green-500 dark:text-green-400' : ''}`}>
                  <span>{/[A-Z]/.test(formData.password) ? '✓' : '•'}</span>
                  Pelo menos uma letra maiúscula
                </li>
                <li className={`flex items-center gap-2 ${/[a-z]/.test(formData.password) ? 'text-green-500 dark:text-green-400' : ''}`}>
                  <span>{/[a-z]/.test(formData.password) ? '✓' : '•'}</span>
                  Pelo menos uma letra minúscula
                </li>
                <li className={`flex items-center gap-2 ${/\d/.test(formData.password) ? 'text-green-500 dark:text-green-400' : ''}`}>
                  <span>{/\d/.test(formData.password) ? '✓' : '•'}</span>
                  Pelo menos um número
                </li>
                <li className={`flex items-center gap-2 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'text-green-500 dark:text-green-400' : ''}`}>
                  <span>{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? '✓' : '•'}</span>
                  Pelo menos um caractere especial
                </li>
                <li className={`flex items-center gap-2 ${formData.password && !formData.password.toLowerCase().includes((formData.firstName || "").toLowerCase()) && !formData.password.toLowerCase().includes((formData.lastName || "").toLowerCase()) ? 'text-green-500 dark:text-green-400' : formData.password ? 'text-red-500 dark:text-red-400' : ''}`}>
                  <span>{formData.password && !formData.password.toLowerCase().includes((formData.firstName || "").toLowerCase()) && !formData.password.toLowerCase().includes((formData.lastName || "").toLowerCase()) ? '✓' : formData.password ? '✗' : '•'}</span>
                  Não conter partes do seu nome
                </li>
                <li className={`flex items-center gap-2 ${formData.password && formData.email && !formData.password.toLowerCase().includes(formData.email.toLowerCase().split("@")[0]) ? 'text-green-500 dark:text-green-400' : formData.password && formData.email ? 'text-red-500 dark:text-red-400' : ''}`}>
                  <span>{formData.password && formData.email && !formData.password.toLowerCase().includes(formData.email.toLowerCase().split("@")[0]) ? '✓' : formData.password && formData.email ? '✗' : '•'}</span>
                  Não conter partes do seu email
                </li>
              </ul>
            </div>
          )}
        </div>
        {loginType === "signup" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("confirm_password")}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input type={showPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange}
                className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white pl-10 pr-4 py-2.5 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-300 dark:border-slate-700 text-sm"
                placeholder="••••••••" />
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">As senhas não coincidem</p>
            )}
          </div>
        )}
        
        {loginType === "signup" && (
          <div className="flex items-start gap-3 mt-4">
            <input
              type="checkbox"
              id="acceptTerms"
              checked={formData.acceptTerms}
              onChange={(e) => setFormData(prev => ({ ...prev, acceptTerms: e.target.checked }))}
              className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
            />
            <label htmlFor="acceptTerms" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1">
              Eu aceito os <button type="button" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline">Termos de Uso</button> e a <button type="button" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline">Política de Privacidade</button> da VETRA
            </label>
          </div>
        )}
        
        <button 
          type="submit"
          onClick={handleSubmit}
          disabled={authLoading}
          className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4">
          {authLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {loginType === "signin" ? "Entrando..." : "Criando conta..."}
            </>
          ) : (
            loginType === "signin" ? "Entrar" : t("create_account")
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
        <div className="text-center mt-4">
          <button 
            type="button"
            onClick={() => {
              setShowForgotPassword(true);
              setForgotPasswordEmail(formData.email);
            }}
            className="text-blue-500 text-sm hover:text-blue-600 hover:underline">
            {t("forgot_password")}
          </button>
        </div>
      )}
    </div>
  </div>
));

LoginModal.displayName = "LoginModal";

// ======================= App =======================
const AppShell: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [viewingShared, setViewingShared] = useState(false);
  const [sharedCollection, setSharedCollection] = useState<{ items: Array<{ movie: MovieT; meta: { rating?: number; description?: string } }>; listName: string; category?: string } | null>(null);
  const [sharedList, setSharedList] = useState<{ items: MovieT[]; listName: string } | null>(null);

  const [showLogin, setShowLogin] = useState(false);
  const [loginType, setLoginType] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
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

  const [apiStatus, setApiStatus] = useState<ApiStatus>("carregando");
  const [tmdb, setTmdb] = useState(() => tmdbAuthStatus());

  const { enabled: darkEnabled, toggle: toggleDark } = useDarkMode();
  const { lang, t, setLang } = useLang();
  const { toasts, pushToast, removeToast } = useToast();
  
  // Helper para formatar datas de acordo com o idioma
  const formatDate = (dateStr: string | Date, options: Intl.DateTimeFormatOptions = {}) => {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    const localeMap: Record<Lang, string> = {
      "pt-BR": "pt-BR",
      "en-US": "en-US",
      "es-ES": "es-ES",
    };
    return date.toLocaleDateString(localeMap[lang] || "pt-BR", options);
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"all" | "movie" | "tv" | "person">("all");
  const [searchSort, setSearchSort] = useState<"relevance" | "rating" | "year">("relevance");
  const [searchYear, setSearchYear] = useState<string>("");
  const [searchYearTo, setSearchYearTo] = useState<string>("");
  const [searchMinRating, setSearchMinRating] = useState<string>("");
  const [searchGenre, setSearchGenre] = useState<string[]>([]);
  const [searchOnlyWithPoster, setSearchOnlyWithPoster] = useState<boolean>(true);
  const [searchMinVotes, setSearchMinVotes] = useState<string>("");
  const [showSearchFilters, setShowSearchFilters] = useState(false);
  const [searchGenres, setSearchGenres] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [movies, setMovies] = useState<MovieT[]>([]);
  const [people, setPeople] = useState<any[]>([]); // resultados de pessoa
  const [popularPeopleList, setPopularPeopleList] = useState<any[]>([]);
  const [peoplePage, setPeoplePage] = useState(1);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [peopleTotalPages, setPeopleTotalPages] = useState(1);
  const [peopleSearchTerm, setPeopleSearchTerm] = useState("");
  const [searchedPeople, setSearchedPeople] = useState<any[]>([]); // resultados da busca de pessoas
  const [peopleSearchLoading, setPeopleSearchLoading] = useState(false);

  const [favorites, setFavorites] = useState<MovieT[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY_FAVS) || "[]"); } catch { return []; }
  });
  const [lists, setLists] = useState<UserList[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY_LISTS) || "[]"); } catch { return []; }
  });
  const [userStates, setUserStates] = useState<UserStateMap>(() => {
    try { return JSON.parse(localStorage.getItem(KEY_STATES) || "{}"); } catch { return {}; }
  });
  
 
  const [watchHistory, setWatchHistory] = useState<Array<{ movie: MovieT; watchedAt: string }>>(() => {
    try { return JSON.parse(localStorage.getItem(KEY_HISTORY) || "[]"); } catch { return []; }
  });
  
 
  const [userStats, setUserStats] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY_STATS) || "{}"); } catch { return {}; }
  });

  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [showListPickerFor, setShowListPickerFor] = useState<MovieT | null>(null);
  const [showCollectionPickerFor, setShowCollectionPickerFor] = useState<MovieT | null>(null);

  const [selectedMovie, setSelectedMovie] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [activeCategory, setActiveCategory] = useState<"movies" | "tv" | "people" | "home">("home");

  const [cats, setCats] = useState<Record<CatKey, CatState>>({
    trending: { items: [], page: 0, loading: false, initialized: false },
    popular: { items: [], page: 0, loading: false, initialized: false },
    top_rated: { items: [], page: 0, loading: false, initialized: false },
    now_playing: { items: [], page: 0, loading: false, initialized: false },
    upcoming: { items: [], page: 0, loading: false, initialized: false },
  });

  // Estados para filtros
  const [trendingWindow, setTrendingWindow] = useState<"day" | "week">("day");
  const [popularFilter, setPopularFilter] = useState<"streaming" | "tv" | "rent" | "cinema">("streaming");
  const [freeWatchFilter, setFreeWatchFilter] = useState<"movie" | "tv">("movie");
  
  // Estado para filmes populares filtrados
  const [filteredPopular, setFilteredPopular] = useState<{
    items: MovieT[];
    loading: boolean;
    page: number;
    totalPages: number;
  }>({
    items: [],
    loading: false,
    page: 0,
    totalPages: 1,
  });

  // Estados para discover (Filmes e Séries)
  const [moviesFilters, setMoviesFilters] = useState<DiscoverFilters>({
    sortBy: "popularity.desc",
    region: "BR",
  });
  const [tvFilters, setTvFilters] = useState<DiscoverFilters>({
    sortBy: "popularity.desc",
    region: "BR",
  });
  const [discoverMovies, setDiscoverMovies] = useState<{
    items: MovieT[];
    loading: boolean;
    page: number;
    totalPages: number;
  }>({
    items: [],
    loading: false,
    page: 1,
    totalPages: 1,
  });
  const [discoverTv, setDiscoverTv] = useState<{
    items: MovieT[];
    loading: boolean;
    page: number;
    totalPages: number;
  }>({
    items: [],
    loading: false,
    page: 1,
    totalPages: 1,
  });

  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "", acceptTerms: false });
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [showShare, setShowShare] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  const [user, setUser] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileMenuRef, setProfileMenuRef] = useState<HTMLDivElement | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Modais modernos
  const [renameModal, setRenameModal] = useState<{ show: boolean; listId: string | null; currentName: string }>({ show: false, listId: null, currentName: "" });
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; message: string; onConfirm: () => void }>({ show: false, message: "", onConfirm: () => {} });
  const [renameInput, setRenameInput] = useState("");

  const location = useLocation();
  const navigate = useNavigate();
  const background = (location.state as any)?.background;

  const loadProfile = async (email: string) => {
    try {
      setProfileLoading(true);
      const data: UserProfile = await api.profileGet(email);
   
      if (data?.name && data.name.trim() && data.name !== "Usuário") {
        setUser({ 
          name: data.name.trim(), 
          email: data?.email ?? email, 
          avatar_url: data?.avatar_url ?? null, 
          updatedAt: data?.updatedAt ?? null 
        });
      } else if (data?.name) {
        
        setUser({ 
          name: data.name, 
          email: data?.email ?? email, 
          avatar_url: data?.avatar_url ?? null, 
          updatedAt: data?.updatedAt ?? null 
        });
      }
    } catch (error) {
      console.error("[loadProfile] Erro ao carregar perfil:", error);
    } finally { 
      setProfileLoading(false); 
    }
  };

  const saveProfile = async (profileData: { name: string; avatar_url?: string | null }) => {
    try {
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
      setShowProfileModal(false);
      pushToast({ message: t("saved_ok") ?? "Salvo!", tone: "ok" });
    } catch (e: any) {
      pushToast({ message: e?.message || "Falha ao salvar", tone: "err" });
    }
  };


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef && !profileMenuRef.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showProfileMenu, profileMenuRef]);

  useEffect(() => setTmdb(tmdbAuthStatus()), []);

  // health check / fallback TMDb
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await api.health();
        if (!alive) return;
        if (r && (r as any).ok) setApiStatus("ok");
        else {
          const tstat = tmdbAuthStatus();
          setApiStatus(tstat.hasV3 || tstat.hasBearer ? "ok" : "falhou");
        }
      } catch {
        if (!alive) return;
        const tstat = tmdbAuthStatus();
        setApiStatus(tstat.hasV3 || tstat.hasBearer ? "ok" : "falhou");
      }
    })();
    return () => { alive = false; };
  }, []);


  useEffect(() => {
    setFavorites((prev) => prev.map((m) => {
      const path = m.poster_path ?? toPosterPath(m.image);
      const img = path ? poster(path) : m.image;
      return { ...m, poster_path: path ?? null, image: img };
    }));
  }, []);
  useEffect(() => {
    setLists((prev) => prev.map((lst) => ({
      ...lst,
      items: lst.items.map((m) => {
        const path = m.poster_path ?? toPosterPath(m.image);
        const img = path ? poster(path) : m.image;
        return { ...m, poster_path: path ?? null, image: img };
      }),
    })));
  }, []);

  // compartilhar via ?share= ou /share/:slug
  useEffect(() => {
    // Verificar query string primeiro
    const usp = new URLSearchParams(window.location.search);
    let slug = usp.get("share");
    
 
    if (!slug) {
      const pathMatch = window.location.pathname.match(/\/share\/([^\/]+)/);
      if (pathMatch) {
        slug = pathMatch[1];
      
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set("share", slug);
        newUrl.pathname = newUrl.pathname.replace(/\/share\/[^\/]+/, "");
        window.history.replaceState({}, "", newUrl.toString());
      }
    }
    
    if (!slug) return;
    (async () => {
      try {
        const data = await api.shareGet(slug);
        if (Array.isArray(data.items)) {
          if (data.type === 'collection') {
            // Coleção compartilhada
            const mapped = data.items.map((m: any) => ({
              movie: {
                id: m.id,
                media: (m.media || "movie") as MediaT,
                title: m.title || "",
                rating: m.vote_average ?? null,
                voteCount: m.vote_count ?? null,
                year: (m.release_date || m.first_air_date || "")?.slice(0, 4) || null,
                image: poster(m.poster_path),
                overview: m.overview || m.user_description || "",
                poster_path: m.poster_path ?? null,
              },
              meta: {
                rating: m.user_rating ?? null,
                description: m.user_description || null,
              }
            }));
            
            const categoryName = data.listName || "Coleção Compartilhada";
            setSharedCollection({ items: mapped, listName: categoryName, category: categoryName });
            setActiveTab("watchlist");
            setViewingShared(true);
          } else if (data.type === 'list') {
            // Lista compartilhada
            const mapped = data.items.map((m: any) => ({
              id: m.id,
              media: m.media || "movie",
              title: m.title || "",
              rating: m.vote_average ?? null,
              voteCount: m.vote_count ?? null,
              year: (m.release_date || m.first_air_date || "")?.slice(0, 4) || null,
              image: poster(m.poster_path),
              overview: m.overview || "",
              poster_path: m.poster_path ?? null,
            }));
            const listName = data.listName || "Lista Compartilhada";
            setSharedList({ items: mapped, listName });
            setActiveTab("lists");
            setViewingShared(true);
          } else {
            // Favoritos compartilhados
          const mapped = data.items.map((m: any) => ({
            id: m.id,
            media: m.media || "movie",
            title: m.title || "",
            rating: m.vote_average ?? null,
            voteCount: m.vote_count ?? null,
            year: (m.release_date || m.first_air_date || "")?.slice(0, 4) || null,
            image: poster(m.poster_path),
            overview: m.overview || "",
            poster_path: m.poster_path ?? null,
          }));
          setFavorites(mapped);
          setActiveTab("favorites");
          setViewingShared(true);
          }
        }
      } catch { pushToast({ message: t("share_fail"), tone: "err" }); }
    })();
  }, []);

  
  const mapRows = (rows: ApiMovie[]): MovieT[] =>
    rows.map((m) => ({
      id: m.id,
      media: (m as any).media || (m as any).media_type || "movie",
      title: (m as any).title || (m as any).name || "",
      rating: m.vote_average ?? null,
      voteCount: m.vote_count ?? null,
      year: (m as any).release_date || (m as any).first_air_date
        ? String((m as any).release_date || (m as any).first_air_date).slice(0, 4)
        : null,
      image: poster((m as any).poster_path),
      overview: (m as any).overview,
      poster_path: (m as any).poster_path ?? null,
    }));

 
  const loadTrending = async (window: "day" | "week", page: number = 1) => {
    setCats((s) => ({ ...s, trending: { ...s.trending, loading: true, error: undefined } }));
    try {
      const data = await api.getTrending(window, page) as BrowseResp;
      const rows = (data?.results || []) as ApiMovie[];
      
   
      const filteredRows = rows.filter((x: any) => {
        const hasImage = (x.poster_path && x.poster_path.trim() !== "") || 
                        (x.backdrop_path && x.backdrop_path.trim() !== "");
        const hasTitle = (x.title && x.title.trim() !== "") || 
                        (x.name && x.name.trim() !== "");
        const hasInfo = (x.overview && x.overview.trim() !== "") || 
                       x.release_date || 
                       x.first_air_date ||
                       x.vote_average !== null;
        return hasImage && hasTitle && hasInfo;
      });
      
      const mapped = mapRows(filteredRows);

      setCats((s) => ({
        ...s,
        trending: {
          items: page > 1 ? [...(s.trending.items || []), ...mapped] : mapped,
          page,
          totalPages: (data as any)?.total_pages ?? s.trending.totalPages ?? 1,
          loading: false,
          initialized: true,
          error: undefined,
        },
      }));
    } catch (e: any) {
      setCats((s) => ({
        ...s,
        trending: { ...s.trending, loading: false, initialized: true, error: e?.message || "Erro desconhecido" },
      }));
    }
  };

  // categorias
  const loadCategory = async (key: CatKey, page: number = 1) => {
    setCats((s) => ({ ...s, [key]: { ...s[key], loading: true, error: undefined } }));
    try {
      const data = (await (api as any).browse(key, page)) as BrowseResp;
      const rows = (data?.results || []) as ApiMovie[];
      

      const filteredRows = rows.filter((x: any) => {
     
        const hasImage = (x.poster_path && x.poster_path.trim() !== "") || 
                        (x.backdrop_path && x.backdrop_path.trim() !== "");
        
      
        const hasTitle = (x.title && x.title.trim() !== "") || 
                        (x.name && x.name.trim() !== "");
        
   
        const hasInfo = (x.overview && x.overview.trim() !== "") || 
                       x.release_date || 
                       x.first_air_date ||
                       x.vote_average !== null;
        
        return hasImage && hasTitle && hasInfo;
      });
      
      const mapped = mapRows(filteredRows);

      setCats((s) => ({
        ...s,
        [key]: {
        
          items: page > 1 ? [...(s[key].items || []), ...mapped] : mapped,
          page,
          totalPages: (data as any)?.total_pages ?? s[key].totalPages ?? 1,
          loading: false,
          initialized: true,
          error: undefined,
        },
      }));
    } catch (e: any) {
      setCats((s) => ({
        ...s,
        [key]: { ...s[key], loading: false, initialized: true, error: e?.message || "Erro desconhecido" },
      }));
    }
  };

 
  useEffect(() => {
    loadTrending(trendingWindow, 1);
    (["popular", "top_rated", "now_playing", "upcoming"] as CatKey[]).forEach((k) => {
      loadCategory(k, 1);
     
      setTimeout(() => loadCategory(k, 2), 500);
    });
    
  }, [lang]);

 
  useEffect(() => {
    if (cats.trending.initialized) {
      loadTrending(trendingWindow, 1);
    }
   
  }, [trendingWindow]);

 
  const loadFilteredPopular = async (filter: "streaming" | "tv" | "rent" | "cinema", page: number = 1) => {
    setFilteredPopular((s) => ({ ...s, loading: true }));
    try {
      const data = await api.browsePopularWithFilter(filter, page) as BrowseResp;
      const rows = (data?.results || []) as ApiMovie[];
      
      
      const filteredRows = rows.filter((x: any) => {
        const hasImage = (x.poster_path && x.poster_path.trim() !== "") || 
                        (x.backdrop_path && x.backdrop_path.trim() !== "");
        const hasTitle = (x.title && x.title.trim() !== "") || 
                        (x.name && x.name.trim() !== "");
        const hasInfo = (x.overview && x.overview.trim() !== "") || 
                       x.release_date || 
                       x.first_air_date ||
                       x.vote_average !== null;
        return hasImage && hasTitle && hasInfo;
      });
      
      const mapped = mapRows(filteredRows);

      setFilteredPopular((prev) => ({
        items: page > 1 ? [...prev.items, ...mapped] : mapped,
        loading: false,
        page,
        totalPages: (data as any)?.total_pages ?? 1,
      }));
    } catch (e: any) {
      console.error("[loadFilteredPopular] Erro:", e);
      setFilteredPopular((s) => ({ ...s, loading: false }));
    }
  };

  useEffect(() => {
    loadFilteredPopular(popularFilter, 1);

  }, [popularFilter]);


  useEffect(() => {
    if (activeCategory !== "home" && activeTab === "home") {

    }
  }, [activeCategory, activeTab]);


  useEffect(() => {
    if (activeTab === "people" && !peopleLoading) {
      setPeopleLoading(true);
      setPopularPeopleList([]); // Limpar lista anterior
      popularPeople(1, lang)
        .then((data) => {
          console.log("[PeopleContent] Dados recebidos:", data);
          const results = (data as any).results || [];
          console.log("[PeopleContent] Total de resultados:", results.length);
          
         
          const filteredResults = results.filter((person: any) => {
            const hasName = person.name && person.name.trim() !== "";
            return hasName;
          });
          
          console.log("[PeopleContent] Após filtro:", filteredResults.length);
          
      
          const sortedResults = filteredResults.sort((a: any, b: any) => {
            const aHasPhoto = a.profile_path && a.profile_path.trim() !== "";
            const bHasPhoto = b.profile_path && b.profile_path.trim() !== "";
            if (aHasPhoto && !bHasPhoto) return -1;
            if (!aHasPhoto && bHasPhoto) return 1;
            return 0;
          });
          
          setPopularPeopleList(sortedResults);
          setPeopleTotalPages((data as any).total_pages || 1);
        })
        .catch((e) => {
          console.error("[PeopleContent] Erro ao carregar pessoas populares:", e);
          pushToast({ message: "Erro ao carregar pessoas", tone: "err" });
        })
        .finally(() => setPeopleLoading(false));
    }
    
  }, [activeTab]);
  
  useEffect(() => {
    if (activeTab === "people" && peoplePage > 1 && !peopleLoading) {
      setPeopleLoading(true);
      popularPeople(peoplePage, lang)
        .then((data) => {
          const results = (data as any).results || [];
          const filteredResults = results.filter((person: any) => {
            const hasName = person.name && person.name.trim() !== "";
            return hasName;
          });
          
          const sortedResults = filteredResults.sort((a: any, b: any) => {
            const aHasPhoto = a.profile_path && a.profile_path.trim() !== "";
            const bHasPhoto = b.profile_path && b.profile_path.trim() !== "";
            if (aHasPhoto && !bHasPhoto) return -1;
            if (!aHasPhoto && bHasPhoto) return 1;
            return 0;
          });
          
          setPopularPeopleList((prev) => [...prev, ...sortedResults]);
          setPeopleTotalPages((data as any).total_pages || 1);
        })
        .catch((e) => {
          console.error("[PeopleContent] Erro ao carregar mais pessoas:", e);
          pushToast({ message: "Erro ao carregar pessoas", tone: "err" });
        })
        .finally(() => setPeopleLoading(false));
    }
 
  }, [peoplePage]);

  
  useEffect(() => {
    if (activeCategory === "movies" && activeTab === "home") {
      setDiscoverMovies({ items: [], loading: true, page: 1, totalPages: 1 });
      api.discover("movie", moviesFilters, 1)
        .then((data) => {
          const results = (data?.results || []) as ApiMovie[];
          const filtered = results.filter((x: any) => {
            const hasImage = (x.poster_path && x.poster_path.trim() !== "") || 
                            (x.backdrop_path && x.backdrop_path.trim() !== "");
            const hasTitle = (x.title && x.title.trim() !== "") || 
                            (x.name && x.name.trim() !== "");
            const hasInfo = (x.overview && x.overview.trim() !== "") || 
                           x.release_date || 
                           x.first_air_date ||
                           x.vote_average !== null;
            return hasImage && hasTitle && hasInfo;
          });
          const mapped = mapRows(filtered);
          setDiscoverMovies({
            items: mapped,
            loading: false,
            page: 1,
            totalPages: (data as any)?.total_pages ?? 1,
          });
        })
        .catch((e: any) => {
          console.error("[loadDiscoverMovies] Erro:", e);
          setDiscoverMovies((prev) => ({ ...prev, loading: false }));
                                      pushToast({ message: t("error_load_movies"), tone: "err" });
        });
    }
    
  }, [activeCategory, activeTab, moviesFilters]);


  useEffect(() => {
    if (activeCategory === "tv" && activeTab === "home") {
      setDiscoverTv({ items: [], loading: true, page: 1, totalPages: 1 });
      api.discover("tv", tvFilters, 1)
        .then((data) => {
          const results = (data?.results || []) as ApiMovie[];
          const filtered = results.filter((x: any) => {
            const hasImage = (x.poster_path && x.poster_path.trim() !== "") || 
                            (x.backdrop_path && x.backdrop_path.trim() !== "");
            const hasTitle = (x.title && x.title.trim() !== "") || 
                            (x.name && x.name.trim() !== "");
            const hasInfo = (x.overview && x.overview.trim() !== "") || 
                           x.release_date || 
                           x.first_air_date ||
                           x.vote_average !== null;
            return hasImage && hasTitle && hasInfo;
          });
          const mapped = mapRows(filtered);
          setDiscoverTv({
            items: mapped,
            loading: false,
            page: 1,
            totalPages: (data as any)?.total_pages ?? 1,
          });
        })
        .catch((e: any) => {
          console.error("[loadDiscoverTv] Erro:", e);
          setDiscoverTv((prev) => ({ ...prev, loading: false }));
                                      pushToast({ message: t("error_load_series"), tone: "err" });
        });
    }
   
  }, [activeCategory, activeTab, tvFilters]);


  const runSearch = async (query: string) => {
    if (!query.trim()) {
      setMovies([]); setPeople([]); return;
    }
    setLoading(true);
    try {
      const filters: { year?: number; minRating?: number } = {};
      if (searchYear) filters.year = parseInt(searchYear);
      if (searchMinRating) filters.minRating = parseFloat(searchMinRating);
      
      const data = await api.search(query, 1, filters);
      const mixed = (data as any).items || (data as any).results || [];
      
      console.log('Search results:', { 
        query, 
        total: mixed.length, 
        movies: mixed.filter((x: any) => (x.media_type || x.media) === 'movie').length,
        tv: mixed.filter((x: any) => (x.media_type || x.media) === 'tv').length,
        people: mixed.filter((x: any) => (x.media_type || x.media) === 'person').length,
      });


      let moviesPart = mixed.filter((x: any) => {
        const mediaType = x.media_type || x.media;
        

        if (mediaType === "movie" || mediaType === "tv") {

        if (searchOnlyWithPoster && !x.poster_path) return false;

        const hasTitle = (x.title && x.title.trim() !== "") || 
                        (x.name && x.name.trim() !== "");
    
          return hasTitle;
        }
        
        
        if (x.poster_path && !x.profile_path) {
          const hasTitle = (x.title && x.title.trim() !== "") || 
                          (x.name && x.name.trim() !== "");
          if (searchOnlyWithPoster && !x.poster_path) return false;
          return hasTitle;
        }
        

        if (x.title && x.release_date) {
          if (searchOnlyWithPoster && !x.poster_path) return false;
          return true;
        }

        if (x.name && x.first_air_date) {
          if (searchOnlyWithPoster && !x.poster_path) return false;
          return true;
        }
        
        return false;
      });
      

      if (searchYear || searchYearTo) {
        moviesPart = moviesPart.filter((x: any) => {
          const releaseYear = x.release_date || x.first_air_date;
          if (!releaseYear) return false;
          const year = parseInt(releaseYear.slice(0, 4));
          if (searchYear && year < parseInt(searchYear)) return false;
          if (searchYearTo && year > parseInt(searchYearTo)) return false;
          return true;
        });
      }
      
      
      if (searchMinVotes) {
        const minVotes = parseInt(searchMinVotes);
        moviesPart = moviesPart.filter((x: any) => (x.vote_count || 0) >= minVotes);
      }
      

      const peoplePart = mixed.filter((x: any) => {
        const mediaType = x.media_type || x.media;
        
    
        const isPerson = mediaType === "person" || 
                        (x.profile_path && !x.poster_path) ||
                        (x.known_for_department && !x.title && !x.name);
        
        if (!isPerson) return false;
        
     
        const hasProfileImage = x.profile_path && x.profile_path.trim() !== "";
        
        // Deve ter nome
        const hasName = x.name && x.name.trim() !== "";
        
        // Deve ter pelo menos alguma informação relevante (biografia, known_for, etc)
        const hasInfo = (x.biography && x.biography.trim() !== "") ||
                       (x.known_for && x.known_for.length > 0) ||
                       x.known_for_department ||
                       x.popularity !== null;
        
        return hasProfileImage && hasName && hasInfo;
      });

      let mapped = mapRows(moviesPart);
     
      if (searchYear && !filters.year) {
        const year = parseInt(searchYear);
        mapped = mapped.filter((m) => m.year && parseInt(m.year) === year);
      }
      
      if (searchMinRating && !filters.minRating) {
        const minRating = parseFloat(searchMinRating);
        mapped = mapped.filter((m) => m.rating && m.rating >= minRating);
      }

      mapped = [...mapped].sort((a, b) => {
        if (searchSort === "rating") return (b.rating || 0) - (a.rating || 0);
        if (searchSort === "year") return parseInt(b.year || "0") - parseInt(a.year || "0");
        return 0;
      });

      setMovies(mapped);
      setPeople(peoplePart || []);
      
      console.log('Filtered results:', { movies: mapped.length, people: peoplePart.length });
    } catch (e: any) {
      console.error('Search error:', e);
      setMovies([]); 
      setPeople([]);
      pushToast({ message: t("search_fail") || "Erro ao buscar. Tente novamente.", tone: "err" });
    } finally { setLoading(false); }
  };


  useEffect(() => {
    const tmo = setTimeout(() => {
      if (searchTerm.trim()) runSearch(searchTerm);
    }, 400);
    return () => clearTimeout(tmo);
  }, [searchTerm, lang, searchSort, searchYear, searchYearTo, searchMinRating, searchMinVotes, searchOnlyWithPoster]);

  const handleForgotPasswordCheckEmail = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    
    if (!forgotPasswordEmail.trim()) {
      setForgotPasswordError("Por favor, insira seu email");
      return;
    }
    
    setForgotPasswordLoading(true);
    setForgotPasswordError("");
    setForgotPasswordMessage("");
    
    try {
      const result = await api.checkEmailExists(forgotPasswordEmail);
      
      if (result.ok && result.exists) {
        setEmailVerified(true);
        setForgotPasswordStep("password");
        setForgotPasswordError("");
        setForgotPasswordMessage("");
      } else {

        if (result.exists === false) {
          setForgotPasswordError("Email não encontrado. Verifique se o email está correto.");
        } else {
          setForgotPasswordError(result.error || "Erro ao verificar email. Tente novamente.");
        }
        setForgotPasswordMessage("");
      }
    } catch (error: any) {
      console.error("[handleForgotPasswordCheckEmail] Erro:", error);
      setForgotPasswordError(error?.message || "Erro ao verificar email");
      setForgotPasswordMessage("");
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleForgotPasswordReset = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    
    if (!forgotPasswordNewPassword.trim()) {
      setForgotPasswordError("Por favor, insira a nova senha");
      return;
    }

    if (forgotPasswordNewPassword !== forgotPasswordConfirmPassword) {
      setForgotPasswordError("As senhas não coincidem");
      return;
    }
    
    setForgotPasswordLoading(true);
    setForgotPasswordError("");
    setForgotPasswordMessage("");
    
    try {
      const result = await api.resetPassword(forgotPasswordEmail, forgotPasswordNewPassword);
      
      if (result.ok) {
        setForgotPasswordMessage(result.message || "Senha alterada com sucesso! Faça login com sua nova senha.");
        setForgotPasswordError("");
 
        setTimeout(() => {
          setShowForgotPassword(false);
          setForgotPasswordEmail("");
          setForgotPasswordNewPassword("");
          setForgotPasswordConfirmPassword("");
          setForgotPasswordStep("email");
          setEmailVerified(false);
          setForgotPasswordError("");
          setForgotPasswordMessage("");
        }, 2000);
      } else {
        setForgotPasswordError(result.error || result.message || "Erro ao redefinir senha");
        setForgotPasswordMessage("");
      }
    } catch (error: any) {
      console.error("[handleForgotPasswordReset] Erro:", error);
      setForgotPasswordError(error?.message || "Erro ao redefinir senha");
      setForgotPasswordMessage("");
    } finally {
      setForgotPasswordLoading(false);
    }
  };


  useEffect(() => { try { localStorage.setItem(KEY_FAVS, JSON.stringify(favorites)); } catch {} }, [favorites]);
  useEffect(() => { try { localStorage.setItem(KEY_LISTS, JSON.stringify(lists)); } catch {} }, [lists]);
  useEffect(() => { try { localStorage.setItem(KEY_STATES, JSON.stringify(userStates)); } catch {} }, [userStates]);
  useEffect(() => { try { localStorage.setItem(KEY_HISTORY, JSON.stringify(watchHistory)); } catch {} }, [watchHistory]);
  useEffect(() => { try { localStorage.setItem(KEY_STATS, JSON.stringify(userStats)); } catch {} }, [userStats]);


  const toggleFavorite = (movie: MovieT, skipConfirm = false) => {
    if (viewingShared) return;
    if (!isLoggedIn) { setShowLogin(true); return; }
    const wasFav = favorites.some((f) => f.id === movie.id && (f.media || "movie") === (movie.media || "movie"));
    
    if (wasFav && !skipConfirm) {

      const movieTitle = movie.title || "este item";
      setConfirmModal({
        show: true,
        message: `Tem certeza que deseja remover "${movieTitle}" dos favoritos?`,
        onConfirm: () => {
          setFavorites((prev) =>
            prev.filter((f) => !(f.id === movie.id && (f.media || "movie") === (movie.media || "movie")))
          );
          pushToast({ message: t("removed_ok") || "Removido dos favoritos", tone: "ok" });
          setConfirmModal({ show: false, message: "", onConfirm: () => {} });
        }
      });
      return;
    }
    
   
    setFavorites((prev) =>
      wasFav
        ? prev.filter((f) => !(f.id === movie.id && (f.media || "movie") === (movie.media || "movie")))
        : [...prev, movie]
    );
    pushToast({ message: wasFav ? t("removed_ok") : t("added_ok"), tone: "ok" });
  };
  const isFavorite = (m: MovieT) => favorites.some((f) => f.id === m.id && (f.media || "movie") === (m.media || "movie"));

  const getFavoriteGenres = (): string[] => {
    const genreCount: Record<string, number> = {};
    const allItems = [...favorites, ...watchHistory.map(h => h.movie)];

    return [];
  };

  const updateUserStats = useCallback(() => {
    const stats = {
      totalWatched: watchHistory.length,
      totalFavorites: favorites.length,
      totalLists: lists.length,
      favoriteGenres: getFavoriteGenres(),
      watchedThisMonth: watchHistory.filter(h => {
        const date = new Date(h.watchedAt);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length,
      lastWatched: watchHistory.length > 0 ? watchHistory[watchHistory.length - 1] : null,
    };
    setUserStats(stats);
  }, [watchHistory, favorites, lists]);


  const addToWatchHistory = useCallback((movie: MovieT) => {
    const key = mediaKey(movie);
    setWatchHistory(prev => {
      const exists = prev.find(h => mediaKey(h.movie) === key);
      if (!exists) {
        return [...prev, { movie, watchedAt: new Date().toISOString() }];
      }
      return prev;
    });
  }, []);


  const removeFromWatchHistory = useCallback((movie: MovieT) => {
    const key = mediaKey(movie);
    setWatchHistory(prev => prev.filter(h => mediaKey(h.movie) !== key));
  }, []);


  useEffect(() => {
    updateUserStats();
  }, [watchHistory, favorites, lists, updateUserStats]);

  const getPersonalizedRecommendations = (): MovieT[] => {
 
    return cats.trending?.items?.slice(0, 10) || [];
  };

  const setStateFor = (m: MovieT, state?: UserState) => {
    try {
      if (!m || !m.id) {
        console.error("setStateFor: objeto movie inválido", m);
        return;
      }
      const k = mediaKey(m);
      const prevState = userStates[k]?.state;
   
    if (state === "watched") {
      addToWatchHistory(m);
      } else if (prevState === "watched") {
  
      removeFromWatchHistory(m);
    }
      
   
      const movieCache = {
        title: m.title,
        poster_path: m.poster_path,
        image: m.image,
        year: m.year,
        media: m.media || "movie" as MediaT
      };
      
      setUserStates((prev) => ({ 
        ...prev, 
        [k]: { 
          ...(prev[k] || {}), 
          state,
          movieCache: movieCache
        } 
      }));
    } catch (error) {
      console.error("Erro em setStateFor:", error, m);
      throw error;
    }
  };
  const setRatingFor = (m: MovieT, rating?: number) => {
    const k = mediaKey(m);
    let r = typeof rating === "number" ? Math.max(0, Math.min(10, rating)) : undefined;
    setUserStates((prev) => ({ ...prev, [k]: { ...(prev[k] || {}), rating: r } }));
  };
  const setDescriptionFor = (m: MovieT, description?: string) => {
    const k = mediaKey(m);
    setUserStates((prev) => ({ ...prev, [k]: { ...(prev[k] || {}), description: description?.trim() || undefined } }));
  };
  const getUserMeta = (m: MovieT) => userStates[mediaKey(m)] || {};


  const createList = (name: string): string => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setLists((prev) => [...prev, { id, name, items: [] }]);
    pushToast({ message: t("created_list_ok", { name }), tone: "ok" });
    return id;
  };
  const addToList = (listId: string, movie: MovieT) => {
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId
          ? {
              ...l,
              items: l.items.some(
                (it) => it.id === movie.id && (it.media || "movie") === (movie.media || "movie")
              )
                ? l.items
                : [...l.items, movie],
            }
          : l
      )
    );
    pushToast({ message: t("added_list_ok"), tone: "ok" });
  };
  const removeFromList = (listId: string, movieId: number, media?: MediaT) => {
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId
          ? { ...l, items: l.items.filter((m) => !(m.id === movieId && (m.media || "movie") === (media || "movie"))) }
          : l
      )
    );
    pushToast({ message: t("removed_list_ok"), tone: "ok" });
  };
  const renameList = (listId: string, newName: string) => {
    setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, name: newName } : l)));
    pushToast({ message: t("renamed_list_ok", { name: newName }), tone: "ok" });
  };
  const clearList = (listId: string) => {
    setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, items: [] } : l)));
    pushToast({ message: t("cleared_list_ok"), tone: "ok" });
  };
  const deleteList = (listId: string) => {
    const name = lists.find((l) => l.id === listId)?.name || "Lista";
    setLists((prev) => prev.filter((l) => l.id !== listId));
    setActiveListId((prev) => (prev === listId ? null : prev));
    pushToast({ message: t("deleted_list_ok", { name }), tone: "ok" });
  };

  // auth
  const [authLoading, setAuthLoading] = useState(false);
  // Refs para evitar dependências problemáticas no useCallback
  const validationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emailErrorRef = useRef(emailError);
  const passwordErrorRef = useRef(passwordError);
  const loginErrorRef = useRef(loginError);
  const passwordErrorsRef = useRef(passwordErrors);
  const loginTypeRef = useRef(loginType);
  
  useEffect(() => {
    emailErrorRef.current = emailError;
    passwordErrorRef.current = passwordError;
    loginErrorRef.current = loginError;
    passwordErrorsRef.current = passwordErrors;
    loginTypeRef.current = loginType;
  }, [emailError, passwordError, loginError, passwordErrors, loginType]);

  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);
  

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    
    // Apenas atualizar formData - NADA MAIS
    setFormData(prev => {
      const updated = { ...prev, [name]: newValue };
      formDataRef.current = updated;
      return updated;
    });
    
  
    if (name === "email") {
      if (emailErrorRef.current) setEmailError("");
      if (loginTypeRef.current === "signin" && loginErrorRef.current) setLoginError("");
    }
    if (name === "password") {
      if (passwordErrorRef.current) setPasswordError("");
      if (passwordErrorsRef.current.length > 0) setPasswordErrors([]);
      if (loginTypeRef.current === "signin" && loginErrorRef.current) setLoginError("");
    }
  }, []); 

  const handleInputBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
  
    if (loginTypeRef.current === "signup" && (name === "password" || name === "firstName" || name === "lastName" || name === "email")) {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
      
      validationTimeoutRef.current = setTimeout(() => {
        const currentData = formDataRef.current;
          const errors: string[] = [];
        const pwd = currentData.password;
        const fullName = currentData.lastName?.trim() 
          ? `${currentData.firstName.trim()} ${currentData.lastName.trim()}`
          : currentData.firstName.trim();
        const email = currentData.email.trim().toLowerCase();
          
          if (pwd) {
            if (pwd.length < 8) errors.push("Mínimo 8 caracteres");
            if (!/[A-Z]/.test(pwd)) errors.push("Uma maiúscula");
            if (!/[a-z]/.test(pwd)) errors.push("Uma minúscula");
            if (!/\d/.test(pwd)) errors.push("Um número");
            if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) errors.push("Um caractere especial");
            
            if (fullName) {
              const nameParts = fullName.toLowerCase().split(/\s+/).filter(p => p.length > 2);
              const pwdLower = pwd.toLowerCase();
              if (nameParts.some(part => pwdLower.includes(part))) {
                errors.push("Não pode conter seu nome");
              }
            }
            
            if (email) {
              const emailParts = email.split("@")[0].split(/[._-]/).filter(p => p.length > 2);
              const pwdLower = pwd.toLowerCase();
              if (emailParts.some(part => pwdLower.includes(part))) {
                errors.push("Não pode conter seu email");
              }
            }
        }
        
        setPasswordErrors(prev => {
          if (prev.length !== errors.length) return errors;
          const prevStr = prev.slice().sort().join(",");
          const errorsStr = errors.slice().sort().join(",");
          return prevStr === errorsStr ? prev : errors;
        });
      }, 300);
    }
  }, []);
  
 
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);
  
  const validatePasswordInRealTime = () => {
    const errors: string[] = [];
    const pwd = formData.password;
    const fullName = formData.lastName?.trim() 
      ? `${formData.firstName.trim()} ${formData.lastName.trim()}`
      : formData.firstName.trim();
    const email = formData.email.trim().toLowerCase();
    
    if (!pwd) return;
    
    if (pwd.length < 8) errors.push("Mínimo 8 caracteres");
    if (!/[A-Z]/.test(pwd)) errors.push("Uma maiúscula");
    if (!/[a-z]/.test(pwd)) errors.push("Uma minúscula");
    if (!/\d/.test(pwd)) errors.push("Um número");
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) errors.push("Um caractere especial");
    
    if (fullName) {
      const nameParts = fullName.toLowerCase().split(/\s+/).filter(p => p.length > 2);
      const pwdLower = pwd.toLowerCase();
      if (nameParts.some(part => pwdLower.includes(part))) {
        errors.push("Não pode conter seu nome");
      }
    }
    
    if (email) {
      const emailParts = email.split("@")[0].split(/[._-]/).filter(p => p.length > 2);
      const pwdLower = pwd.toLowerCase();
      if (emailParts.some(part => pwdLower.includes(part))) {
        errors.push("Não pode conter seu email");
      }
    }
    
    setPasswordErrors(errors);
  };
  
  const validateEmailInRealTime = (email: string) => {
    if (!email) {
      setEmailError("");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setEmailError("Formato de email inválido");
    } else {
      setEmailError("");
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações do cadastro
    if (loginType === "signup") {
      if (!formData.firstName?.trim()) {
        pushToast({ message: "Preencha seu nome", tone: "warn" });
        return;
      }
      
      if (!formData.email?.trim()) {
        pushToast({ message: "Preencha seu email", tone: "warn" });
        return;
      }
      
      if (!formData.password?.trim()) {
        pushToast({ message: "Preencha sua senha", tone: "warn" });
        return;
      }
      
      if (formData.password !== formData.confirmPassword) {
      pushToast({ message: "As senhas não coincidem", tone: "warn" });
      return;
    }

      if (passwordErrors.length > 0) {
        pushToast({ message: "A senha não atende aos critérios de segurança", tone: "warn" });
      return;
    }

      if (!formData.acceptTerms) {
        pushToast({ message: "Você deve aceitar os termos de uso", tone: "warn" });
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
            console.log("[handleSubmit] Estado passwordError antes:", passwordError);
            setPasswordError(errorMsg);
            console.log("[handleSubmit] passwordError definido, aguardando re-render...");
            setAuthLoading(false);
        
            return;
          } else {
            errorMsg = actualMessage || "Erro ao criar conta";
            pushToast({ message: errorMsg, tone: "err" });
            setAuthLoading(false);
            return;
          }
        }
   
        if (result.error === "email_ja_cadastrado") {
          if (loginType === "signup") {
            setEmailError("Este email já está cadastrado. Use 'Esqueci minha senha' se necessário.");
            setAuthLoading(false);
            return;
          } else {
            errorMsg = "Este email já está cadastrado. Use 'Esqueci minha senha' se necessário.";
            pushToast({ message: errorMsg, tone: "err" });
            setAuthLoading(false);
            return;
          }
        }
        
  
        if (result.error === "senha_fraca") {
          const errors = (result as any).errors || [];
          errorMsg = errors.length > 0 
            ? `Senha inválida: ${errors.join(", ")}`
            : "A senha não atende aos critérios de segurança";
          pushToast({ message: errorMsg, tone: "err" });
          setAuthLoading(false);
          return;
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
        setShowLogin(false);
        setViewingShared(false);
        setSharedList(null);
        setSharedCollection(null);
        setFormData({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "", acceptTerms: false });
        setPasswordErrors([]);
        setEmailError("");
        setLoginError(""); 
        
       
        if (result.idToken) {
          try {
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
        
        pushToast({ 
          message: loginType === "signup" ? "Conta criada com sucesso! Verifique seu email." : "Login efetuado com sucesso!", 
          tone: "ok" 
        });
      }
    } catch (error: any) {
      console.error("Erro na autenticação:", error);
      console.error("Erro completo:", JSON.stringify(error, null, 2));
      

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


  useEffect(() => {
    if (isLoggedIn && (user?.email || "").trim()) {
      loadProfile(user!.email!);
    }
  
  }, [isLoggedIn, user?.email]);


  const openDetailsByRoute = useCallback(async (media: MediaT, id: number): Promise<void> => {
    try {
      const d: ApiDetails = await api.details(media, id);
      
      const detailed: MovieT = {
        id: d.id, 
        media: d.media, 
        title: d.title, 
        rating: d.vote_average, 
        voteCount: d.vote_count,
        year: d.year, 
        image: poster(d.poster_path), 
        overview: d.overview || undefined, 
        poster_path: d.poster_path ?? null,
      };
      
      setSelectedMovie({ ...detailed, _details: d } as any);
    } catch (e: any) {
      console.error("Erro ao carregar detalhes:", e?.message);
      throw e;
    }
  }, []);


  const goToHomeCategory = (key: CatKey) => {
    setActiveTab("home");
    if (!cats[key]?.initialized && !cats[key]?.loading) loadCategory(key);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };


  const MovieCard: React.FC<{ movie: MovieT }> = ({ movie }) => {
    const openDetails = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      const mediaType = (movie.media || "movie") as "movie" | "tv";
      const path = `/${mediaType}/${movie.id}`;
      navigate(path);
    };

    const handleFav = (e: React.MouseEvent) => { e.stopPropagation(); toggleFavorite(movie); };
    const handleAddToList = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isLoggedIn) { setShowLogin(true); return; }
      setShowListPickerFor(movie);
    };

    const score = typeof movie.rating === "number" ? Math.round((movie.rating + Number.EPSILON) * 10) / 10 : null;
    const meta = getUserMeta(movie);

    return (
      <div 
        onClick={openDetails} 
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetails(); } }}
        role="button"
        tabIndex={0}
        className="group relative text-left w-full select-none cursor-pointer z-0"
        title={movie.title}
      >
        <div className="absolute -inset-2 bg-gradient-to-br from-cyan-400/0 via-purple-500/0 to-lime-400/0 group-hover:from-cyan-400/80 group-hover:via-purple-500/80 group-hover:to-lime-400/80 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" style={{ zIndex: -1 }} />
        
        <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-cyan-400/50 via-purple-500/40 to-lime-400/50 transition-all duration-300 group-hover:from-cyan-400 group-hover:via-purple-500 group-hover:to-lime-400 group-hover:shadow-2xl group-hover:shadow-cyan-500/40 transform group-hover:-translate-y-2 group-hover:scale-[1.03]">
          <div className="rounded-2xl overflow-hidden bg-slate-900/70 backdrop-blur-sm ring-1 ring-white/10 transition-all duration-300 group-hover:ring-2 group-hover:ring-cyan-400/50">
            <div className="relative overflow-hidden">
              <img 
                src={movie.image || poster(movie.poster_path)} 
                alt={movie.title} 
                className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110" 
                style={{ aspectRatio: "2/3" }} 
                loading="lazy" 
              />
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-purple-500/0 to-lime-400/0 group-hover:from-cyan-500/25 group-hover:via-purple-500/20 group-hover:to-lime-400/25 transition-all duration-500 pointer-events-none" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute top-1.5 left-1.5">
                <div className="flex items-center gap-0.5 rounded-full bg-black/70 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-white/10 transition-all duration-300 group-hover:bg-black/90 group-hover:ring-yellow-400/50 group-hover:shadow-lg group-hover:scale-110">
                  <Star size={12} className="shrink-0" color="#FFD700" fill="#FFD700" />
                  <span className="tabular-nums">{score ?? "—"}</span>
                </div>
              </div>
            </div>
            <div className="p-2 flex flex-col transition-all duration-300 group-hover:bg-slate-800/90">
              <h3 className="font-semibold text-white/95 leading-tight line-clamp-2 mb-1.5 text-xs transition-colors duration-300 group-hover:text-cyan-300">{movie.title}</h3>
              
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] text-gray-400 flex items-center gap-1 transition-colors duration-300 group-hover:text-gray-300">
                  {movie.year && <span>{movie.year}</span>}
                  {movie.voteCount && movie.year && <span>•</span>}
                  {movie.voteCount && <span>({movie.voteCount})</span>}
                </div>
                {meta?.state && (
                  <span className="text-[9px] uppercase text-gray-400 px-1 py-0.5 rounded bg-white/5 transition-all duration-300 group-hover:bg-cyan-500/20 group-hover:text-cyan-300">
                    {meta.state}
                </span>
                )}
              </div>
              
              {}
              <div className="flex gap-2 sm:gap-1.5 justify-center">
                {!viewingShared && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isLoggedIn) { setShowLogin(true); return; }
                      setShowListPickerFor(movie);
                    }}
                    className="min-w-[44px] min-h-[44px] sm:w-7 sm:h-7 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white flex items-center justify-center transition-all duration-200 border border-white/20 group-hover:bg-white/20 group-hover:border-cyan-400/50 group-hover:shadow-lg group-hover:shadow-cyan-400/50 touch-manipulation active:scale-95"
                    title={t("add_to_list")}
                  >
                    <ListIcon size={16} className="sm:w-[14px] sm:h-[14px]" />
                  </button>
                )}
                  <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFav(e);
                  }}
                  disabled={viewingShared}
                  className={`min-w-[44px] min-h-[44px] sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all duration-200 border border-white/20 group-hover:border-cyan-400/50 group-hover:shadow-lg group-hover:shadow-cyan-400/50 touch-manipulation active:scale-95 ${
                    viewingShared
                      ? "bg-white/10 text-slate-400 cursor-not-allowed"
                        : isFavorite(movie)
                        ? "bg-white/10 hover:bg-white/20 text-white group-hover:bg-red-500/30 group-hover:border-red-400/50"
                        : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                  title={isFavorite(movie) ? t("remove") : t("favorite")}
                >
                    <Heart size={16} className="sm:w-[14px] sm:h-[14px]" fill={!viewingShared && isFavorite(movie) ? "currentColor" : "none"} />
                  </button>
                  {!viewingShared && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isLoggedIn) { setShowLogin(true); return; }
                      setShowCollectionPickerFor(movie);
                    }}
                    className={`min-w-[44px] min-h-[44px] sm:w-7 sm:h-7 rounded-full backdrop-blur-sm text-white flex items-center justify-center transition-all duration-200 border group-hover:shadow-lg group-hover:shadow-cyan-400/50 touch-manipulation active:scale-95 ${
                      getUserMeta(movie).state
                        ? "bg-cyan-500/30 hover:bg-cyan-500/40 border-cyan-400/50 group-hover:bg-cyan-500/50"
                        : "bg-white/10 hover:bg-white/20 border-white/20 group-hover:border-cyan-400/50"
                    }`}
                    title={t("add_to_collection")}
                  >
                    <Bookmark size={16} className="sm:w-[14px] sm:h-[14px]" fill={getUserMeta(movie).state ? "currentColor" : "none"} />
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };


  const MovieRouteModal: React.FC = () => {
    const { id } = useParams();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [newCommentText, setNewCommentText] = useState("");
    const [newCommentRating, setNewCommentRating] = useState<number | undefined>(undefined);
    const [submittingComment, setSubmittingComment] = useState(false);
    const [activeMediaTab, setActiveMediaTab] = useState<"videos" | "backdrops" | "posters">("videos");
    
    // Extrai o tipo de mídia da URL (movie ou tv) - memoizado para evitar re-renders
    const mediaType = useMemo(() => {
      return location.pathname.startsWith("/movie/") ? "movie" : 
             location.pathname.startsWith("/tv/") ? "tv" : null;
    }, [location.pathname]);
    
    useEffect(() => {
      if (!id) {
        setError("ID não encontrado");
        setLoading(false);
        return;
      }
      
      if (!mediaType || (mediaType !== "movie" && mediaType !== "tv")) {
        setError("Tipo de mídia inválido");
        setLoading(false);
        return;
      }
      
      const movieId = parseInt(id);
      if (isNaN(movieId)) {
        setError("ID inválido");
        setLoading(false);
        return;
      }
      
      if (selectedMovie && selectedMovie.id === movieId && (selectedMovie.media || selectedMovie._details?.media) === mediaType) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      openDetailsByRoute(mediaType, movieId)
        .then(() => {
          setLoading(false);
        })
        .catch((e: any) => {
          setLoading(false);
          setError(e?.message || "Erro ao carregar");
          pushToast({ message: `Erro: ${e?.message || "Falha ao carregar"}`, tone: "err" });
        });
      
      return () => {
       
        setLoading(false);
      };

    }, [id, mediaType, openDetailsByRoute]);
    
    const d: ApiDetails | undefined = selectedMovie?._details;
    const runtimeStr = d?.runtime ? `${Math.floor(d.runtime / 60)}h ${d.runtime % 60}min` : undefined;

  
    useEffect(() => {
      if (d) {
       
        if (d.allVideos && d.allVideos.length > 0) {
          setActiveMediaTab("videos");
        } else if (d.images?.backdrops && d.images.backdrops.length > 0) {
          setActiveMediaTab("backdrops");
        } else if (d.images?.posters && d.images.posters.length > 0) {
          setActiveMediaTab("posters");
        }
      }
    }, [d?.id]);


    useEffect(() => {
      if (!selectedMovie || !mediaType || !id) return;
      const movieId = parseInt(id);
      if (isNaN(movieId)) return;
      
      setCommentsLoading(true);
      getComments(mediaType, movieId)
        .then((cmts) => {
          setComments(cmts);
        })
        .catch((e) => {
          console.error("Erro ao carregar comentários:", e);
        })
        .finally(() => {
          setCommentsLoading(false);
        });
    }, [selectedMovie?.id, mediaType, id]);


    useEffect(() => {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }, []);


    const handleCreateComment = async () => {
      if (!isLoggedIn) {
        pushToast({ message: "Você precisa estar logado para comentar", tone: "err" });
        return;
      }
      if (!newCommentText.trim()) {
        pushToast({ message: "Digite um comentário", tone: "err" });
        return;
      }
      if (!mediaType || !id) return;
      
      const movieId = parseInt(id);
      if (isNaN(movieId)) return;

      setSubmittingComment(true);
      const result = await createComment(mediaType, movieId, newCommentText.trim(), newCommentRating);
      if (result.ok && result.comment) {
        setComments([result.comment, ...comments]);
        setNewCommentText("");
        setNewCommentRating(undefined);
        pushToast({ message: "Comentário publicado!", tone: "ok" });
      } else {
        pushToast({ message: result.error || "Erro ao publicar comentário", tone: "err" });
      }
      setSubmittingComment(false);
    };

    const handleLikeComment = async (commentId: string) => {
      if (!isLoggedIn || !user?.email) {
        pushToast({ message: "Você precisa estar logado para curtir", tone: "err" });
        return;
      }
      const result = await likeComment(commentId);
      if (result.ok) {
        setComments(comments.map(c => {
          if (c.id !== commentId) return c;
          const currentLikes = c.likes || [];
          const hasLiked = currentLikes.includes(user.email!);
          return {
            ...c,
            likes: result.liked && !hasLiked
              ? [...currentLikes, user.email!]
              : result.liked === false && hasLiked
              ? currentLikes.filter((uid: string) => uid !== user.email!)
              : currentLikes
          };
        }));
      }
    };

    const handleDeleteComment = async (commentId: string) => {
      if (!isLoggedIn) return;
      if (!confirm("Tem certeza que deseja deletar este comentário?")) return;
      
      const result = await deleteComment(commentId);
      if (result.ok) {
        setComments(comments.filter(c => c.id !== commentId));
        pushToast({ message: "Comentário deletado", tone: "ok" });
      } else {
        pushToast({ message: result.error || "Erro ao deletar comentário", tone: "err" });
      }
    };

  
    
    if (error) {
      return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => navigate(-1)}>
          <div className="bg-gray-900 rounded-lg p-4 sm:p-6 md:p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="text-red-400 text-lg sm:text-xl mb-4 font-bold">Erro ao carregar</div>
            <div className="text-white mb-4 bg-red-900/30 p-3 sm:p-4 rounded border border-red-500/50 text-sm sm:text-base">
              {error}
            </div>
            <div className="text-gray-400 text-xs sm:text-sm mt-4 mb-4">
              <strong>Possíveis causas:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Chave da API do TMDb não configurada</li>
                <li>Chave da API inválida ou expirada</li>
                <li>Problema de conexão</li>
              </ul>
            </div>
            <button 
              onClick={() => navigate(-1)}
              className="w-full min-h-[44px] px-4 py-2.5 bg-white text-black rounded-md hover:bg-gray-200 active:bg-gray-300 font-semibold transition touch-manipulation"
            >
              {t("close")}
            </button>
          </div>
        </div>
      );
    }


    if (selectedMovie) {

    } else if (loading) {
     
      return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => navigate(-1)}>
          <div className="bg-gray-900 rounded-lg p-6 sm:p-8 text-center max-w-sm w-full mx-4">
            <div className="text-white text-lg sm:text-xl mb-4">Carregando informações do filme…</div>
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-cyan-500"></div>
            <div className="text-gray-400 text-sm mt-4">Aguarde...</div>
          </div>
        </div>
      );
    } else {
     
      return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => navigate(-1)}>
          <div className="bg-gray-900 rounded-lg p-6 sm:p-8 text-center max-w-sm w-full mx-4">
            <div className="text-white text-lg sm:text-xl mb-4">Erro: Filme não encontrado</div>
            <button 
              onClick={() => navigate(-1)}
              className="min-h-[44px] px-4 py-2.5 bg-white text-black rounded-md hover:bg-gray-200 active:bg-gray-300 font-semibold transition touch-manipulation"
            >
              {t("close")}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-black/80 dark:bg-black/90 z-50 flex items-center justify-center p-2 sm:p-3 md:p-4 backdrop-blur-sm" onClick={() => navigate(-1)}>
        <div className="bg-white dark:bg-gray-900 rounded-lg max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl mx-2 sm:mx-auto" onClick={(e) => e.stopPropagation()}>
          <div className="relative overflow-hidden rounded-t-lg">
            <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] overflow-hidden">
              <img 
                src={d?.backdrop_path ? `https://image.tmdb.org/t/p/w1280${d.backdrop_path}` : (selectedMovie.image || poster(selectedMovie.poster_path))} 
                alt={selectedMovie.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent dark:from-gray-900 dark:via-gray-900/50" />
            </div>
            <button onClick={() => navigate(-1)} className="absolute top-3 right-3 sm:top-4 sm:right-4 min-w-[44px] min-h-[44px] flex items-center justify-center bg-black/60 dark:bg-black/60 backdrop-blur-sm p-2 rounded-full hover:bg-black/80 active:bg-black/90 transition z-10 touch-manipulation" aria-label="Fechar">
              <X size={20} className="sm:w-6 sm:h-6" color="white" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-gray-900 dark:via-gray-900/95 p-4 sm:p-6 md:p-8">
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 md:gap-6 mb-4">
                {d?.vote_average !== null && d?.vote_average !== undefined ? (
                  <div className="flex-shrink-0">
                    <div className="relative w-16 h-16 md:w-20 md:h-20">
                      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 36 36">
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          className="stroke-slate-300 dark:stroke-white/20"
                          strokeWidth="2"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          stroke={d.vote_average >= 7 ? "#10b981" : d.vote_average >= 5 ? "#f59e0b" : "#ef4444"}
                          strokeWidth="2"
                          strokeDasharray={`${(d.vote_average / 10) * 100}, 100`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-slate-900 dark:text-white font-bold text-sm md:text-base">
                          {Math.round(d.vote_average * 10)}%
                </span>
              </div>
            </div>
                    <p className="text-xs text-slate-600 dark:text-gray-400 mt-1 text-center">Avaliação dos usuários</p>
          </div>
                ) : null}
                
                <div className="flex-1">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2 break-words">
                    {selectedMovie.title} {selectedMovie.year ? `(${selectedMovie.year})` : ""}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 md:gap-4 text-slate-700 dark:text-white text-sm md:text-base">
                    {d?.certification ? (
                      <span className="px-2 py-1 bg-slate-200 dark:bg-gray-700/50 rounded text-xs font-semibold border border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white">
                        {d.certification}
                      </span>
                    ) : null}
                    {d?.genres?.length ? <span className="text-slate-600 dark:text-gray-300">• {d.genres.join(", ")}</span> : null}
                    {runtimeStr ? <span className="text-slate-600 dark:text-gray-300">• {runtimeStr}</span> : null}
                    {d?.directors?.length ? <span className="text-slate-600 dark:text-gray-300">• Dir.: {d.directors.join(", ")}</span> : null}
                    <span className="text-slate-600 dark:text-gray-300">• {(selectedMovie.media || d?.media) === "tv" ? "Série" : "Filme"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-white dark:bg-gray-900">
            {!viewingShared && (
              <div className="flex flex-wrap gap-3 mb-6">
                <select
                  value={getUserMeta(selectedMovie).state || ""}
                  onChange={(e) => setStateFor(selectedMovie, (e.target.value || undefined) as UserState)}
                  className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2"
                >
                  <option value="">{`— estado —`}</option>
                  <option value="want">Quero assistir</option>
                  <option value="watched">Assisti</option>
                  <option value="not_watched">Não assisti</option>
                  <option value="abandoned">Abandonei</option>
                </select>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-700 dark:text-gray-300">Minha nota</span>
                  <input
                    type="number" min={0} max={10} step={0.5}
                    value={getUserMeta(selectedMovie).rating ?? ""}
                    onChange={(e) => setRatingFor(selectedMovie, e.target.value === "" ? undefined : Number(e.target.value))}
                    className="w-20 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-md px-2 py-2"
                    placeholder="0–10"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-6">
              {(() => {
 
                const findTrailerInVideos = (videos: any[]): string | null => {
                  if (!videos || videos.length === 0) return null;
         
                  const officialTrailer = videos.find((v: any) => 
                    v.site === "YouTube" && 
                    (v.type === "Trailer" || v.type === "Teaser") && 
                    v.official && 
                    v.key
                  );
                  if (officialTrailer?.key) {
                    return `https://www.youtube.com/watch?v=${officialTrailer.key}`;
                  }
                  
         
                  const anyTrailer = videos.find((v: any) => 
                    v.site === "YouTube" && 
                    (v.type === "Trailer" || v.type === "Teaser") && 
                    v.key
                  );
                  if (anyTrailer?.key) {
                    return `https://www.youtube.com/watch?v=${anyTrailer.key}`;
                  }
                  
                
                  const anyYouTubeVideo = videos.find((v: any) => 
                    v.site === "YouTube" && v.key
                  );
                  if (anyYouTubeVideo?.key) {
                    return `https://www.youtube.com/watch?v=${anyYouTubeVideo.key}`;
                  }
                  
                  return null;
                };
                
 
                const findTrailerInTrailers = (trailers: any[]): string | null => {
                  if (!trailers || trailers.length === 0) return null;
                  
           
                  const officialTrailer = trailers.find((t: any) => t.official && t.key);
                  if (officialTrailer?.key) {
                    return `https://www.youtube.com/watch?v=${officialTrailer.key}`;
                  }
                  

                  const anyTrailer = trailers.find((t: any) => t.key);
                  if (anyTrailer?.key) {
                    return `https://www.youtube.com/watch?v=${anyTrailer.key}`;
                  }
                  
                  return null;
                };
                
               
                let trailerUrl: string | null = null;
                
                if (d?.trailer_url && d.trailer_url.trim() !== "") {
                  trailerUrl = d.trailer_url;
                }
            
                if (!trailerUrl && d?.trailers && d.trailers.length > 0) {
                  trailerUrl = findTrailerInTrailers(d.trailers);
                }
         
                if (!trailerUrl && d?.allVideos && d.allVideos.length > 0) {
                  trailerUrl = findTrailerInVideos(d.allVideos);
                }
         
                if (!trailerUrl && d?.videos && Array.isArray(d.videos) && d.videos.length > 0) {
                  trailerUrl = findTrailerInVideos(d.videos);
                }
                
             
                if (trailerUrl) {
                  return (
                    <a 
                      href={trailerUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex-1 min-w-full sm:min-w-[220px] min-h-[44px] text-center bg-gradient-to-r from-cyan-500 via-purple-600 to-lime-500 text-white px-4 sm:px-6 py-3 rounded-md font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90 active:opacity-80 transition touch-manipulation"
                    >
                  <Play size={20} />{t("trailer")}
                </a>
                  );
                } else {
                  return (
                    <button 
                      disabled 
                      className="flex-1 min-w-full sm:min-w-[220px] min-h-[44px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 sm:px-6 py-3 rounded-md font-semibold inline-flex items-center justify-center gap-2 cursor-not-allowed"
                    >
                  <Play size={20} />{t("no_trailer")}
                </button>
                  );
                }
              })()}
              {!viewingShared && (
                <>
                  <button onClick={() => toggleFavorite(selectedMovie)}
                    className={`flex-1 sm:flex-none min-w-full sm:min-w-[220px] min-h-[44px] px-4 sm:px-6 py-3 rounded-md font-semibold transition flex items-center justify-center gap-2 touch-manipulation active:scale-95 ${
                      isFavorite(selectedMovie) ? "bg-red-600 text-white hover:bg-red-700 active:bg-red-800" : "bg-slate-200 dark:bg-gray-800 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-gray-700 active:bg-slate-400 dark:active:bg-gray-600"}`}>
                    <Heart size={20} />{isFavorite(selectedMovie) ? t("remove") : t("favorite")}
                  </button>
                  <button
                    onClick={() => {
                      if (!isLoggedIn) { setShowLogin(true); return; }
                      setShowListPickerFor(selectedMovie);
                    }}
                    className="flex-1 sm:flex-none min-w-full sm:min-w-[220px] min-h-[44px] px-4 sm:px-6 py-3 rounded-md font-semibold transition flex items-center justify-center gap-2 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700 active:bg-slate-400 dark:active:bg-slate-600 border border-slate-300 dark:border-slate-600 touch-manipulation active:scale-95">
                    <ListIcon size={20} />{t("add_to_list")}
                  </button>
                </>
              )}
            </div>

            <div className="text-slate-700 dark:text-gray-300 space-y-6 sm:space-y-8 px-4 sm:px-6 pb-4 sm:pb-6">
              {d?.tagline ? (
                <div className="text-center italic text-lg text-slate-600 dark:text-gray-400 border-l-4 border-cyan-500 pl-4 py-2">
                  "{d.tagline}"
                </div>
              ) : null}
              
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">{t("synopsis")}</h3>
                <p className="leading-relaxed text-slate-700 dark:text-gray-300">{selectedMovie.overview || d?.overview || "—"}</p>
              </div>

                  <div>
                <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white mb-3">Informações</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {d?.release_date ? (
                    <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-slate-200 dark:border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar size={18} className="text-cyan-500 dark:text-cyan-400" />
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-300">Data de lançamento</h4>
                      </div>
                      <p className="text-slate-900 dark:text-white">{formatDate(d.release_date, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                ) : null}
                
                {d?.original_title && d.original_title !== selectedMovie.title ? (
                    <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-slate-200 dark:border-white/10">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">Título original</h4>
                      <p className="text-slate-900 dark:text-white">{d.original_title}</p>
                  </div>
                ) : null}

                {d?.status ? (
                    <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-slate-200 dark:border-white/10">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">Status</h4>
                      <p className="text-slate-900 dark:text-white">
                        {d.status === "Released" ? "Lançado" : d.status === "In Production" ? "Em produção" : d.status === "Post Production" ? "Pós-produção" : d.status === "Planned" ? "Planejado" : d.status === "Returning Series" ? "Em exibição" : d.status === "Ended" ? "Finalizada" : d.status}
                      </p>
                  </div>
                ) : null}

                {d?.production_countries?.length ? (
                    <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-slate-200 dark:border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe size={18} className="text-cyan-500 dark:text-cyan-400" />
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-300">País de origem</h4>
                      </div>
                      <p className="text-slate-900 dark:text-white">{d.production_countries.join(", ")}</p>
                  </div>
                ) : null}

                {d?.spoken_languages?.length ? (
                    <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-slate-200 dark:border-white/10">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">Idiomas</h4>
                      <p className="text-slate-900 dark:text-white">{d.spoken_languages.join(", ")}</p>
                  </div>
                ) : null}


                {d?.imdb_id ? (
                    <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-slate-200 dark:border-white/10">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">IMDb</h4>
                      <a href={`https://www.imdb.com/title/${d.imdb_id}`} target="_blank" rel="noreferrer" className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 underline inline-flex items-center gap-1">
                        Ver no IMDb <LinkIcon size={14} className="inline" />
                    </a>
                  </div>
                ) : null}

                {d?.homepage ? (
                    <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-slate-200 dark:border-white/10">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">Site oficial</h4>
                      <a href={d.homepage} target="_blank" rel="noreferrer" className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 underline break-all inline-flex items-center gap-1">
                        {d.homepage.replace(/^https?:\/\//, '')} <LinkIcon size={14} className="inline" />
                    </a>
                  </div>
                ) : null}

                  {d?.certification ? (
                    <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-slate-200 dark:border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Award size={18} className="text-yellow-500 dark:text-yellow-400" />
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-300">Classificação</h4>
              </div>
                      <p className="text-slate-900 dark:text-white font-semibold">{d.certification}</p>
                    </div>
                  ) : null}

                  {(d?.numberOfSeasons || d?.numberOfEpisodes) ? (
                    <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-slate-200 dark:border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Tv size={18} className="text-purple-500 dark:text-purple-400" />
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-300">Temporadas/Episódios</h4>
                      </div>
                      <p className="text-slate-900 dark:text-white">
                        {d.numberOfSeasons ? `${d.numberOfSeasons} temporada${d.numberOfSeasons > 1 ? 's' : ''}` : ''}
                        {d.numberOfSeasons && d.numberOfEpisodes ? ' • ' : ''}
                        {d.numberOfEpisodes ? `${d.numberOfEpisodes} episódio${d.numberOfEpisodes > 1 ? 's' : ''}` : ''}
                      </p>
                    </div>
                  ) : null}

                  {d?.lastAirDate ? (
                    <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-slate-200 dark:border-white/10">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">Último episódio</h4>
                      <p className="text-slate-900 dark:text-white">{formatDate(d.lastAirDate, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  ) : null}
                </div>
              </div>

              {(d?.writers?.length || d?.producers?.length || d?.cinematographers?.length || d?.composers?.length || d?.editors?.length) ? (
                  <div>
                  <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white mb-3">Equipe Técnica</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {d.writers?.length ? (
                      <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-slate-200 dark:border-white/10">
                        <div className="flex items-center gap-2 mb-3">
                          <PenTool size={18} className="text-blue-500 dark:text-blue-400" />
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-300">Roteiristas</h4>
                        </div>
                        <div className="space-y-1">
                          {d.writers.map((w: any, idx: number) => (
                            <p key={idx} className="text-slate-900 dark:text-white text-sm">
                              {w.name}
                              {w.job && w.job !== "Writer" ? (
                                <span className="text-slate-600 dark:text-white/60 text-xs ml-1">({w.job})</span>
                              ) : null}
                            </p>
                          ))}
                        </div>
                  </div>
                ) : null}

                    {d.producers?.length ? (
                      <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-slate-200 dark:border-white/10">
                        <div className="flex items-center gap-2 mb-3">
                          <Video size={18} className="text-green-500 dark:text-green-400" />
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-300">Produtores</h4>
                        </div>
                        <div className="space-y-1">
                          {d.producers.map((p: any, idx: number) => (
                            <p key={idx} className="text-slate-900 dark:text-white text-sm">
                              {p.name}
                              {p.job && p.job !== "Producer" ? (
                                <span className="text-slate-600 dark:text-white/60 text-xs ml-1">({p.job})</span>
                              ) : null}
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {d.cinematographers?.length ? (
                      <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-slate-200 dark:border-white/10">
                        <div className="flex items-center gap-2 mb-3">
                          <Video size={18} className="text-cyan-500 dark:text-cyan-400" />
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-300">Fotografia</h4>
                        </div>
                        <div className="space-y-1">
                          {d.cinematographers.map((c: string, idx: number) => (
                            <p key={idx} className="text-slate-900 dark:text-white text-sm">{c}</p>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {d.composers?.length ? (
                      <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-slate-200 dark:border-white/10">
                        <div className="flex items-center gap-2 mb-3">
                          <Music size={18} className="text-pink-500 dark:text-pink-400" />
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-300">Música</h4>
                        </div>
                        <div className="space-y-1">
                          {d.composers.map((c: string, idx: number) => (
                            <p key={idx} className="text-slate-900 dark:text-white text-sm">{c}</p>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {d.editors?.length ? (
                      <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-slate-200 dark:border-white/10">
                        <div className="flex items-center gap-2 mb-3">
                          <Scissors size={18} className="text-orange-500 dark:text-orange-400" />
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-300">Edição</h4>
                        </div>
                        <div className="space-y-1">
                          {d.editors.map((e: string, idx: number) => (
                            <p key={idx} className="text-slate-900 dark:text-white text-sm">{e}</p>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {d?.keywords?.length ? (
                  <div>
                  <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white mb-3">Palavras-chave</h3>
                  <div className="flex flex-wrap gap-2">
                    {d.keywords.map((keyword: string, idx: number) => (
                      <span
                        key={idx}
                        className="bg-slate-100 dark:bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm text-slate-700 dark:text-white/80 border border-slate-300 dark:border-white/20"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                  </div>
                ) : null}

              {d?.belongs_to_collection ? (
                  <div>
                  <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white mb-3">Faz parte da coleção</h3>
                  <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-slate-200 dark:border-white/10 inline-block">
                    <p className="text-slate-900 dark:text-white font-semibold">{d.belongs_to_collection.name}</p>
                  </div>
                  </div>
                ) : null}

              {d?.networks?.length ? (
                  <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Redes de TV</h3>
                  <div className="flex flex-wrap gap-4 items-center">
                    {d.networks.map((network: any) => (
                      <div key={network.id} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg px-4 py-2 border border-slate-300 dark:border-slate-700">
                        {network.logo_path ? (
                          <img 
                            src={`https://image.tmdb.org/t/p/w92${network.logo_path}`} 
                            alt={network.name}
                            className="h-8 object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                            }}
                          />
                        ) : null}
                        <span className="text-slate-900 dark:text-white text-sm">{network.name}</span>
                      </div>
                    ))}
                  </div>
                  </div>
                ) : null}

              {d?.external_ids && (d.external_ids.facebook_id || d.external_ids.instagram_id || d.external_ids.twitter_id || d.external_ids.wikidata_id) ? (
                  <div>
                  <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white mb-3">Links Externos</h3>
                  <div className="flex flex-wrap gap-3">
                    {d.external_ids.facebook_id ? (
                      <a
                        href={`https://www.facebook.com/${d.external_ids.facebook_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-300 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition text-slate-900 dark:text-white"
                      >
                        <LinkIcon size={16} />
                        <span className="text-sm">Facebook</span>
                      </a>
                    ) : null}
                    {d.external_ids.instagram_id ? (
                      <a
                        href={`https://www.instagram.com/${d.external_ids.instagram_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-300 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition text-slate-900 dark:text-white"
                      >
                        <LinkIcon size={16} />
                        <span className="text-sm">Instagram</span>
                      </a>
                    ) : null}
                    {d.external_ids.twitter_id ? (
                      <a
                        href={`https://twitter.com/${d.external_ids.twitter_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-300 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition text-slate-900 dark:text-white"
                      >
                        <LinkIcon size={16} />
                        <span className="text-sm">Twitter</span>
                      </a>
                    ) : null}
                    {d.external_ids.wikidata_id ? (
                      <a
                        href={`https://www.wikidata.org/wiki/${d.external_ids.wikidata_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-300 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition text-slate-900 dark:text-white"
                      >
                        <LinkIcon size={16} />
                        <span className="text-sm">Wikidata</span>
                      </a>
                ) : null}
              </div>
                </div>
              ) : null}

              {d?.watch_providers && (d.watch_providers.streaming?.length || d.watch_providers.rent?.length || d.watch_providers.buy?.length) ? (
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Onde assistir</h3>
                  {d.watch_providers.streaming?.length ? (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-slate-600 dark:text-gray-400 mb-2">Streaming</h4>
                      <div className="flex flex-wrap gap-3">
                        {d.watch_providers.streaming.map((provider) => (
                          <div key={provider.provider_id} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-300 dark:border-slate-700 hover:border-cyan-500/50 transition">
                            {provider.logo_path ? (
                              <img 
                                src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`} 
                                alt={provider.provider_name}
                                className="h-6 object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                }}
                              />
                            ) : null}
                            <span className="text-slate-900 dark:text-white text-sm">{provider.provider_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {d.watch_providers.rent?.length ? (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-slate-600 dark:text-gray-400 mb-2">Alugar</h4>
                      <div className="flex flex-wrap gap-3">
                        {d.watch_providers.rent.map((provider) => (
                          <div key={provider.provider_id} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-300 dark:border-slate-700">
                            {provider.logo_path ? (
                              <img 
                                src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`} 
                                alt={provider.provider_name}
                                className="h-6 object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                }}
                              />
                            ) : null}
                            <span className="text-slate-900 dark:text-white text-sm">{provider.provider_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {d.watch_providers.buy?.length ? (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-600 dark:text-gray-400 mb-2">Comprar</h4>
                      <div className="flex flex-wrap gap-3">
                        {d.watch_providers.buy.map((provider) => (
                          <div key={provider.provider_id} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-300 dark:border-slate-700">
                            {provider.logo_path ? (
                              <img 
                                src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`} 
                                alt={provider.provider_name}
                                className="h-6 object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                }}
                              />
                            ) : null}
                            <span className="text-slate-900 dark:text-white text-sm">{provider.provider_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {d?.production_companies?.length ? (
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Estúdios de produção</h3>
                  <div className="flex flex-wrap gap-4 items-center">
                    {d.production_companies.map((company) => (
                      <div key={company.id} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg px-4 py-2 border border-slate-300 dark:border-slate-700">
                        {company.logo_path ? (
                          <img 
                            src={`https://image.tmdb.org/t/p/w92${company.logo_path}`} 
                            alt={company.name}
                            className="h-8 object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                            }}
                          />
                        ) : null}
                        <span className="text-slate-900 dark:text-white text-sm">{company.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {(d?.images?.backdrops?.length || d?.images?.posters?.length || d?.allVideos?.length) ? (
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Mídia</h3>
                  
                  <div className="border-b border-slate-200 dark:border-slate-700 mb-4">
                    <div className="flex gap-4 overflow-x-auto scrollbar-hide">
                      {d.allVideos && d.allVideos.length > 0 && (
                        <button
                          onClick={() => setActiveMediaTab("videos")}
                          className={`px-4 py-2 font-semibold text-sm whitespace-nowrap border-b-2 transition-colors ${
                            activeMediaTab === "videos"
                              ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
                              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          Vídeos ({d.allVideos.length})
                        </button>
                      )}
                      {d.images?.backdrops && d.images.backdrops.length > 0 && (
                        <button
                          onClick={() => setActiveMediaTab("backdrops")}
                          className={`px-4 py-2 font-semibold text-sm whitespace-nowrap border-b-2 transition-colors ${
                            activeMediaTab === "backdrops"
                              ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
                              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          Imagens de fundo ({d.images.backdrops.length})
                        </button>
                      )}
                      {d.images?.posters && d.images.posters.length > 0 && (
                        <button
                          onClick={() => setActiveMediaTab("posters")}
                          className={`px-4 py-2 font-semibold text-sm whitespace-nowrap border-b-2 transition-colors ${
                            activeMediaTab === "posters"
                              ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
                              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          Pôsteres ({d.images.posters.length})
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    {activeMediaTab === "videos" && d.allVideos && d.allVideos.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {d.allVideos.map((video) => (
                          <a
                            key={video.id}
                            href={`https://www.youtube.com/watch?v=${video.key}`}
                            target="_blank"
                            rel="noreferrer"
                            className="group relative aspect-video bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 hover:border-cyan-500/50 transition"
                          >
                            <img
                              src={`https://img.youtube.com/vi/${video.key}/maxresdefault.jpg`}
                              alt={video.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.key}/hqdefault.jpg`;
                              }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/60 transition">
                              <Play size={48} className="text-white/90 group-hover:text-white transition" fill="white" />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                              <p className="text-white text-sm font-medium truncate">{video.name}</p>
                              <p className="text-white/60 text-xs">{video.type} {video.official ? "• Oficial" : ""}</p>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}

                    {activeMediaTab === "backdrops" && d.images?.backdrops && d.images.backdrops.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {d.images.backdrops.map((img, idx) => (
                          <a
                            key={idx}
                            href={`https://image.tmdb.org/t/p/original${img.file_path}`}
                            target="_blank"
                            rel="noreferrer"
                            className="group relative aspect-video bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 hover:border-cyan-500/50 transition"
                          >
                            <img
                              src={`https://image.tmdb.org/t/p/w500${img.file_path}`}
                              alt={`Backdrop ${idx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              loading="lazy"
                            />
                          </a>
                        ))}
                      </div>
                    )}

                    {activeMediaTab === "posters" && d.images?.posters && d.images.posters.length > 0 && (
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {d.images.posters.map((img, idx) => (
                          <a
                            key={idx}
                            href={`https://image.tmdb.org/t/p/original${img.file_path}`}
                            target="_blank"
                            rel="noreferrer"
                            className="group relative aspect-[2/3] bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 hover:border-cyan-500/50 transition"
                          >
                            <img
                              src={`https://image.tmdb.org/t/p/w500${img.file_path}`}
                              alt={`Poster ${idx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              loading="lazy"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {d?.seasons && d.seasons.length > 0 ? (
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Temporadas</h3>
                  <div className="space-y-4">
                    {d.seasons
                      .filter((s) => s.season_number > 0)
                      .sort((a, b) => b.season_number - a.season_number)
                      .map((season) => (
                        <div
                          key={season.id}
                          className="bg-slate-50 dark:bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition"
                        >
                          <div className="flex gap-4">
                            {season.poster_path ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w154${season.poster_path}`}
                                alt={season.name}
                                className="w-24 h-36 object-cover rounded-lg flex-shrink-0"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="w-24 h-36 bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Tv size={32} className="text-slate-400 dark:text-gray-600" />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white">{season.name}</h4>
                                  {season.air_date ? (
                                    <p className="text-sm text-slate-600 dark:text-gray-400">
                                      {formatDate(season.air_date, { month: 'long', year: 'numeric' })}
                                    </p>
                                  ) : null}
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-slate-700 dark:text-gray-300">{season.episode_count} episódio{season.episode_count !== 1 ? 's' : ''}</p>
                                </div>
                              </div>
                              {season.overview ? (
                                <p className="text-sm text-slate-700 dark:text-gray-300 leading-relaxed line-clamp-3">{season.overview}</p>
                              ) : null}
                            </div>
                          </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {d?.cast?.length ? (
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">{t("cast")} ({d.cast.length})</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
                    {d.cast.slice(0, d.cast.length % 2 === 0 ? d.cast.length : d.cast.length - 1).map((c) => (
                      <Link key={c.id} to={`/person/${c.id}`} className="group">
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 transition">
                          <div className="w-full h-40 bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden" style={{ aspectRatio: "2/3" }}>
                            {c.profile_path ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w185${c.profile_path}`}
                                alt={c.name || "Ator"}
                                className="w-full h-full object-cover object-center"
                                style={{ objectFit: 'cover', objectPosition: 'center top' }}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-12 h-12 text-slate-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>';
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User size={48} className="text-slate-400 dark:text-gray-600" />
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <div className="text-slate-900 dark:text-white font-semibold text-sm truncate" title={c.name || ""}>
                              {c.name || "Nome não disponível"}
                            </div>
                            {c.character ? (
                              <div className="text-slate-600 dark:text-gray-400 text-xs truncate" title={c.character}>
                                {c.character}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="border-t border-slate-300 dark:border-slate-700 pt-8">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Avaliações e Comentários</h3>
                
                {isLoggedIn ? (
                  <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 mb-6 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        {user?.avatar_url ? (
                          <img src={user.avatar_url} alt={user.name || ""} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <User size={20} className="text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          placeholder="Compartilhe sua opinião sobre este título..."
                          className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                          rows={3}
                        />
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600 dark:text-gray-400">Sua nota:</span>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                <button
                                  key={num}
                                  onClick={() => setNewCommentRating(newCommentRating === num ? undefined : num)}
                                  className={`w-8 h-8 rounded flex items-center justify-center text-sm font-semibold transition-colors ${
                                    newCommentRating === num
                                      ? "bg-cyan-500 text-white"
                                      : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-gray-400 hover:bg-slate-300 dark:hover:bg-slate-600"
                                  }`}
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={handleCreateComment}
                            disabled={submittingComment || !newCommentText.trim()}
                            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            <Send size={16} />
                            {submittingComment ? "Publicando..." : "Publicar"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 mb-6 border border-slate-200 dark:border-slate-700 text-center shadow-sm dark:shadow-none">
                    <p className="text-slate-600 dark:text-gray-400 mb-3">Faça login para comentar e avaliar</p>
                    <button
                      onClick={() => setShowLogin(true)}
                      className="px-4 py-2.5 rounded-xl bg-slate-700 dark:bg-slate-600 text-white font-semibold hover:bg-slate-600 dark:hover:bg-slate-500 shadow-md hover:shadow-lg border border-slate-600 dark:border-slate-500 hover:border-slate-500 dark:hover:border-slate-400 transition-all duration-200"
                    >
                      Entrar
                    </button>
                  </div>
                )}

                {commentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 dark:text-gray-400">
                    <MessageCircle size={48} className="mx-auto mb-3 opacity-50" />
                    <p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => {
                      const isLiked = isLoggedIn && user?.email && comment.likes?.includes(user.email);
                      const isOwner = isLoggedIn && user?.email && comment.userId === user.email;
                      const reactions = comment.reactions || {};
                      const reactionCounts = Object.entries(reactions).reduce((acc, [key, users]) => {
                        acc[key] = users.length;
                        return acc;
                      }, {} as Record<string, number>);

                      return (
                        <div key={comment.id} className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                              {comment.userAvatar ? (
                                <img src={comment.userAvatar} alt={comment.userName || ""} className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <User size={20} className="text-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-slate-900 dark:text-white">{comment.userName}</span>
                                {comment.rating !== null && comment.rating !== undefined && (
                                  <div className="flex items-center gap-1 text-yellow-500 dark:text-yellow-400">
                                    <Star size={14} fill="currentColor" />
                                    <span className="text-sm font-semibold">{comment.rating}</span>
                                  </div>
                                )}
                                <span className="text-xs text-slate-500 dark:text-gray-400">
                                  {formatDate(comment.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                                {isOwner && (
                                  <button
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="ml-auto text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                                    title="Deletar comentário"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                              <p className="text-slate-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">{comment.text}</p>
                              <div className="flex items-center gap-4">
                                <button
                                  onClick={() => handleLikeComment(comment.id)}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                                    isLiked
                                      ? "bg-cyan-500/20 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30"
                                      : "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600"
                                  }`}
                                >
                                  <ThumbsUp size={16} fill={isLiked ? "currentColor" : "none"} />
                                  <span className="text-sm font-semibold">{comment.likes?.length || 0}</span>
                                </button>
                                {Object.keys(reactionCounts).length > 0 && (
                                  <div className="flex items-center gap-2">
                                    {Object.entries(reactionCounts).map(([reaction, count]) => (
                                      <span key={reaction} className="text-xs bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-full text-slate-600 dark:text-gray-300">
                                        {reaction}: {count}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {d?.recommendations?.length ? (
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">{t("recommendations")}</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-2 md:gap-3">
                    {d.recommendations.slice(0, d.recommendations.length % 2 === 0 ? d.recommendations.length : d.recommendations.length - 1).map((rec: any) => (
                      <button
                        key={`${(rec.media || rec.media_type || "movie")}-${rec.id}`}
                        onClick={() => navigate(`/${(rec.media || rec.media_type || "movie")}/${rec.id}`)}
                        className="text-left group" title={rec.title || rec.name}>
                        <div className="relative overflow-hidden rounded-lg transition-transform duration-300 group-hover:scale-105">
                          <img src={poster(rec.poster_path)} alt={rec.title || rec.name || ""} className="w-full h-full object-cover" style={{ aspectRatio: "2/3" }} />
                        </div>
                        <div className="mt-2">
                          <div className="font-semibold text-slate-900 dark:text-white truncate">{rec.title || rec.name}</div>
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
                            <span className="flex items-center gap-1"><Star size={14} fill="#FFD700" color="#FFD700" />{rec.vote_average ?? "—"}</span>
                            {rec.release_date || rec.first_air_date ? (<><span>•</span><span>{String(rec.release_date || rec.first_air_date).slice(0, 4)}</span></>) : null}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ======== Person Modal (rota /person/:id) ========
  const PersonRouteModal: React.FC = () => {
    const { id } = useParams();
    const [person, setPerson] = useState<ApiPersonDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      (async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try { 
          const p = await apiPersonDetails(parseInt(id), lang); 
          setPerson(p); 
        } catch (e: any) {
          setError(e?.message || "Erro ao carregar");
          pushToast({ message: `Erro ao carregar pessoa: ${e?.message || "Falha"}`, tone: "err" });
        } finally {
          setLoading(false);
        }
      })();
    }, [id, lang]);


    useEffect(() => {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }, []);

    if (!id) return null;
    
    if (loading) {
    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => navigate(-1)}>
          <div className="text-white" onClick={(e) => e.stopPropagation()}>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-4"></div>
            <p>Carregando…</p>
          </div>
        </div>
      );
    }

    if (error || !person) {
      return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => navigate(-1)}>
          <div className="bg-slate-900 rounded-lg p-8 text-center max-w-md" onClick={(e) => e.stopPropagation()}>
            <p className="text-red-400 mb-4">{error || "Pessoa não encontrada"}</p>
            <button onClick={() => navigate(-1)} className="px-4 py-2 bg-white text-slate-900 rounded-lg font-semibold">
              Fechar
            </button>
          </div>
        </div>
      );
    }


    const calculateAge = (birthday: string | null | undefined) => {
      if (!birthday) return null;
      try {
        const birth = new Date(birthday);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        return age;
      } catch {
        return null;
      }
    };

    const cast = person.combined_credits?.cast || [];
    const crew = person.combined_credits?.crew || [];
    const allCredits = [...cast, ...crew].sort((a: any, b: any) => {
      const dateA = a.release_date || a.first_air_date || "";
      const dateB = b.release_date || b.first_air_date || "";
      return dateB.localeCompare(dateA);
    });

    // Agrupar créditos por ano
    const creditsByYear: Record<string, any[]> = {};
    allCredits.forEach((credit: any) => {
      const year = credit.release_date || credit.first_air_date 
        ? String(credit.release_date || credit.first_air_date).slice(0, 4) 
        : "Sem data";
      if (!creditsByYear[year]) {
        creditsByYear[year] = [];
      }
      creditsByYear[year].push(credit);
    });

    // Obter trabalhos mais conhecidos (top rated ou mais populares)
    const knownFor = [...cast, ...crew]
      .filter((c: any) => c.vote_average && c.vote_average > 0)
      .sort((a: any, b: any) => (b.vote_average || 0) - (a.vote_average || 0))
      .slice(0, 8);


    const KnownForSection: React.FC<{ items: any[] }> = ({ items }) => {
      const scrollContainerRef = useRef<HTMLDivElement>(null);
      const [showLeftArrow, setShowLeftArrow] = useState(false);
      const [showRightArrow, setShowRightArrow] = useState(true);

      const checkScroll = useCallback(() => {
        if (!scrollContainerRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
      }, []);

      const scrollLeft = () => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
        }
      };

      const scrollRight = () => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
      };

      useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        checkScroll();
        container.addEventListener('scroll', checkScroll);
        window.addEventListener('resize', checkScroll);
        return () => {
          container.removeEventListener('scroll', checkScroll);
          window.removeEventListener('resize', checkScroll);
        };
      }, [items, checkScroll]);

      if (items.length === 0) return null;

      return (
        <div className="mb-8">
          <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-3">Conhecido(a) por</h2>
          <div className="relative">
            {showLeftArrow && (
              <button
                onClick={scrollLeft}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-slate-900/80 dark:bg-slate-800/80 backdrop-blur-sm text-white p-2 rounded-full hover:bg-slate-800 dark:hover:bg-slate-700 transition-all shadow-lg"
                aria-label="Rolar para esquerda"
              >
                <ChevronLeft size={24} />
                    </button>
            )}
            <div
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
              style={{ scrollBehavior: 'smooth' }}
            >
              {items.map((credit: any) => {
                const mediaType = credit.media || credit.media_type || "movie";
                const title = credit.title || credit.name || "Sem título";
                return (
                  <button
                    key={`${mediaType}-${credit.id}`}
                    onClick={() => navigate(`/${mediaType}/${credit.id}`)}
                    className="flex-shrink-0 text-left group w-[140px]"
                  >
                    <div className="relative overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800 mb-2 transition-transform duration-300 group-hover:scale-105" style={{ aspectRatio: "2/3" }}>
                      {credit.poster_path ? (
                        <img 
                          src={poster(credit.poster_path)} 
                          alt={title} 
                          className="w-full h-full object-cover object-center" 
                          style={{ objectFit: 'cover', objectPosition: 'center' }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film size={32} className="text-slate-400 dark:text-slate-600" />
                </div>
                      )}
                    </div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white line-clamp-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {title}
                    </div>
                  </button>
                );
              })}
            </div>
            {showRightArrow && (
              <button
                onClick={scrollRight}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-slate-900/80 dark:bg-slate-800/80 backdrop-blur-sm text-white p-2 rounded-full hover:bg-slate-800 dark:hover:bg-slate-700 transition-all shadow-lg"
                aria-label="Rolar para direita"
              >
                <ChevronRight size={24} />
              </button>
            )}
            <div className="absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-white dark:from-slate-950 to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-white dark:from-slate-950 to-transparent pointer-events-none" />
          </div>
        </div>
      );
    };

    return (
      <div className="fixed inset-0 bg-white dark:bg-slate-900 z-50 overflow-y-auto" onClick={() => navigate(-1)}>
        <div className="min-h-screen bg-white dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => navigate(-1)} 
            className="fixed top-3 right-3 sm:top-4 sm:right-4 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 active:bg-gray-200 dark:active:bg-slate-600 transition z-50 shadow-lg touch-manipulation"
            aria-label="Fechar"
          >
            <X size={20} className="sm:w-[22px] sm:h-[22px]" />
          </button>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4">
                <div className="sticky top-8">
                  <div className="mb-6">
            {person.profile_path ? (
                      <img 
                        src={`https://image.tmdb.org/t/p/w500${person.profile_path}`} 
                        alt={person.name} 
                        className="w-full rounded-lg shadow-lg"
                        style={{ aspectRatio: "2/3", objectFit: 'cover', objectPosition: 'center top' }}
                      />
                    ) : (
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center" style={{ aspectRatio: "2/3" }}>
                        <User size={120} className="text-slate-400 dark:text-slate-600" />
                      </div>
                    )}
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Informações pessoais</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="text-slate-600 dark:text-slate-400 mb-1">Conhecido(a) por</div>
                        <div className="text-slate-900 dark:text-white font-medium">
                          {person.known_for_department || "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-600 dark:text-slate-400 mb-1">Creditado(a) em</div>
                        <div className="text-slate-900 dark:text-white font-medium">{allCredits.length}</div>
                      </div>
                      {person.birthday ? (
                        <div>
                          <div className="text-slate-600 dark:text-slate-400 mb-1">Nascimento</div>
                          <div className="text-slate-900 dark:text-white font-medium">
                            {person.birthday ? formatDate(person.birthday, { day: 'numeric', month: 'long', year: 'numeric' }) : null}
                            {calculateAge(person.birthday) ? ` (${calculateAge(person.birthday)} anos)` : ""}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-slate-600 dark:text-slate-400 mb-1">Nascimento</div>
                          <div className="text-slate-900 dark:text-white font-medium">—</div>
                        </div>
                      )}
                      {person.place_of_birth ? (
                        <div>
                          <div className="text-slate-600 dark:text-slate-400 mb-1">Local de nascimento</div>
                          <div className="text-slate-900 dark:text-white font-medium">{person.place_of_birth}</div>
              </div>
            ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8">
                <div className="mb-6">
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    {person.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-gray-400 text-sm md:text-base">
                    {person.known_for_department ? (
                      <span className="bg-slate-100 dark:bg-slate-700/50 px-3 py-1 rounded-full border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                        {person.known_for_department}
                      </span>
                    ) : null}
                    {person.birthday ? (
                      <span className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>
                          {person.birthday ? formatDate(person.birthday, { day: 'numeric', month: 'long', year: 'numeric' }) : null}
                          {calculateAge(person.birthday) ? ` (${calculateAge(person.birthday)} anos)` : ""}
                        </span>
                      </span>
                    ) : null}
                    {person.place_of_birth ? (
                      <span className="flex items-center gap-2">
                        <Globe size={16} />
                        <span>{person.place_of_birth}</span>
                      </span>
                    ) : null}
                  </div>
                </div>

                {person.biography ? (
                  <div className="mb-8">
                    <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-3">Biografia</h2>
                    <p className="text-slate-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                      {person.biography}
                    </p>
                  </div>
                ) : (
                  <div className="mb-8">
                    <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-3">Biografia</h2>
                    <p className="text-slate-600 dark:text-gray-400">
                      Não temos uma biografia para {person.name}.
                    </p>
                  </div>
                )}

                <KnownForSection items={knownFor} />

                {allCredits.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">Filmografia</h2>
                      <div className="flex gap-2">
                        <select 
                          onChange={(e) => {
                            const filter = e.target.value;
                           
                          }}
                          className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-md px-3 py-1.5 text-sm"
                        >
                          <option value="all">Todos</option>
                          <option value="cast">Atuação</option>
                          <option value="crew">Equipe</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      {Object.keys(creditsByYear).sort((a, b) => {
                        if (a === "Sem data") return 1;
                        if (b === "Sem data") return -1;
                        return b.localeCompare(a);
                      }).map((year) => {
                        const yearCredits = creditsByYear[year];
                        if (yearCredits.length === 0) return null;
                        
                        return (
                          <div key={year} className="relative">
                            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500 via-purple-500 to-lime-400 opacity-30" />
                            
                            <div className="flex items-center gap-4 mb-3">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                {year === "Sem data" ? "?" : year.slice(-2)}
                              </div>
                              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                {year}
                              </h3>
                              <span className="text-sm text-slate-600 dark:text-slate-400">
                                ({yearCredits.length} {yearCredits.length === 1 ? "trabalho" : "trabalhos"})
                              </span>
                            </div>
                            
                            <div className="ml-12 space-y-3">
                              {yearCredits.map((credit: any) => {
                                const mediaType = credit.media || credit.media_type || "movie";
                                const title = credit.title || credit.name || "Sem título";
                                const character = credit.character || null;
                                const job = credit.job || null;
                                const department = credit.department || null;
                                const creditYear = credit.release_date || credit.first_air_date 
                                  ? String(credit.release_date || credit.first_air_date).slice(0, 4) 
                                  : null;
                                
                                return (
                                  <button
                                    key={`${mediaType}-${credit.id}-${credit.character || credit.job || ""}`}
                                    onClick={() => navigate(`/${mediaType}/${credit.id}`)}
                                    className="w-full text-left flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-500 hover:shadow-lg transition-all group"
                                  >
                                    <div className="flex-shrink-0 w-16 h-24 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700">
                                      {credit.poster_path ? (
                                        <img 
                                          src={poster(credit.poster_path)} 
                                          alt={title}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <Film size={24} className="text-slate-400 dark:text-slate-500" />
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2 mb-1">
                                        <div className="flex-1 min-w-0">
                                          <div className="text-slate-900 dark:text-white font-semibold group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-2">
                                            {title}
                                          </div>
                                          <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                              {mediaType === "tv" ? "Série" : "Filme"}
                                            </span>
                                            {creditYear && (
                                              <span className="text-xs text-slate-600 dark:text-slate-400">
                                                {creditYear}
                                              </span>
                                            )}
                                            {credit.vote_average && credit.vote_average > 0 && (
                                              <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                                <Star size={12} fill="#FFD700" color="#FFD700" />
                                                {credit.vote_average.toFixed(1)}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {character && (
                                        <div className="text-sm text-slate-700 dark:text-slate-300 mt-2">
                                          <span className="font-medium">como</span> {character}
                                        </div>
                                      )}
                                      {job && (
                                        <div className="text-sm text-slate-700 dark:text-slate-300 mt-2">
                                          <span className="font-medium">{job}</span>
                                          {department && department !== job && (
                                            <span className="text-slate-600 dark:text-slate-400"> • {department}</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
            </button>
                                );
                              })}
          </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {crew.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-4">Equipe Técnica</h2>
                    <div className="space-y-3">
                      {crew.slice(0, 20).map((credit: any) => {
                        const mediaType = credit.media || credit.media_type || "movie";
                        const title = credit.title || credit.name || "Sem título";
                        const job = credit.job || null;
                        return (
                          <button
                            key={`crew-${mediaType}-${credit.id}-${job}`}
                            onClick={() => navigate(`/${mediaType}/${credit.id}`)}
                            className="w-full text-left flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                          >
                            <div className="flex-shrink-0 w-10 h-14 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                              {credit.poster_path ? (
                                <img src={poster(credit.poster_path)} alt={title} className="w-full h-full object-cover" />
                              ) : (
                                <Film size={20} className="text-slate-400 dark:text-slate-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-slate-900 dark:text-white font-medium group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                {title}
                              </div>
                              {job && (
                                <div className="text-sm text-slate-600 dark:text-gray-400 mt-0.5">
                                  {job}
                                </div>
                              )}
                            </div>
                    </button>
                        );
                      })}
                </div>
              </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };


  const MobileFooter: React.FC = () => (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-slate-300 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/90 dark:supports-[backdrop-filter]:bg-slate-900/90 safe-area-inset-bottom" aria-label="Navegação inferior" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
      <div className="grid grid-cols-5 h-14 sm:h-16 gap-0.5">
          <button onClick={() => setActiveTab("home")} className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 min-h-[44px] touch-manipulation active:bg-slate-100 dark:active:bg-slate-800 transition-colors ${activeTab === "home" ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-gray-400"}`} title={t("home")}>
            <Home size={18} className="sm:w-5 sm:h-5" /><span className="text-[9px] sm:text-[10px] font-medium leading-tight px-1 text-center">{t("home")}</span>
          </button>
          <button onClick={() => setActiveTab("favorites")} className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 min-h-[44px] touch-manipulation active:bg-slate-100 dark:active:bg-slate-800 transition-colors ${activeTab === "favorites" ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-gray-400"}`} title={t("favorites")}>
            <Heart size={18} className="sm:w-5 sm:h-5" /><span className="text-[9px] sm:text-[10px] font-medium leading-tight px-1 text-center">{t("favorites")}</span>
          </button>
          <button onClick={() => { setActiveListId(null); setActiveTab("lists"); }} className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 min-h-[44px] touch-manipulation active:bg-slate-100 dark:active:bg-slate-800 transition-colors ${activeTab === "lists" ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-gray-400"}`} title={t("lists")}>
            <ListIcon size={18} className="sm:w-5 sm:h-5" /><span className="text-[9px] sm:text-[10px] font-medium leading-tight px-1 text-center">{t("lists")}</span>
          </button>
            <button onClick={() => setActiveTab("watchlist")} className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 min-h-[44px] touch-manipulation active:bg-slate-100 dark:active:bg-slate-800 transition-colors ${activeTab === "watchlist" || activeTab.startsWith("watchlist-") ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-gray-400"}`} title={t("collections")}>
            <Bookmark size={18} className="sm:w-5 sm:h-5" /><span className="text-[9px] sm:text-[10px] font-medium leading-tight px-1 text-center">{t("collections")}</span>
          </button>
          <button onClick={() => setActiveTab("people")} className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 min-h-[44px] touch-manipulation active:bg-slate-100 dark:active:bg-slate-800 transition-colors ${activeTab === "people" ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-gray-400"}`} title={t("people")}>
            <Users size={18} className="sm:w-5 sm:h-5" /><span className="text-[9px] sm:text-[10px] font-medium leading-tight px-1 text-center">{t("people")}</span>
          </button>
      </div>
    </nav>
  );

  const SiteFooter: React.FC = () => (
    <footer className="mt-20 border-t border-slate-300 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="container mx-auto px-6 lg:px-8 py-6 md:py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-12">
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Explorar</h4>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-gray-400">
              <li>
                <button onClick={() => goToHomeCategory("trending")} className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Em alta
                </button>
              </li>
              <li>
                <button onClick={() => goToHomeCategory("popular")} className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Populares
                </button>
              </li>
              <li>
                <button onClick={() => goToHomeCategory("top_rated")} className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Mais bem avaliados
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Categorias</h4>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-gray-400">
              <li>
                <button onClick={() => goToHomeCategory("now_playing")} className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Em cartaz
                </button>
              </li>
              <li>
                <button onClick={() => goToHomeCategory("upcoming")} className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Em breve
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("favorites")} className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Meus favoritos
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Conta</h4>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-gray-400">
              <li>
                <button onClick={() => setShowProfileModal(true)} className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Meu perfil
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("lists")} className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  {t("lists")}
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("watchlist")} className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Coleções
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("history")} className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Histórico
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("stats")} className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Estatísticas
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Sobre</h4>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-gray-400">
              <li>
                <button className="hover:text-slate-900 dark:hover:text-white transition-colors">Sobre o VETRA</button>
              </li>
              <li>
                <button className="hover:text-slate-900 dark:hover:text-white transition-colors">Ajuda</button>
              </li>
              <li>
                <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Dados por TMDB
                </a>
              </li>
            </ul>
        </div>
        </div>
        <div className="pt-8 border-t border-slate-300 dark:border-slate-800/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-600 dark:text-gray-500">
              © {new Date().getFullYear()} VETRA. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6 text-xs text-slate-600 dark:text-gray-500">
              <button className="hover:text-slate-900 dark:hover:text-gray-400 transition-colors">Termos de Uso</button>
              <button className="hover:text-slate-900 dark:hover:text-gray-400 transition-colors">Privacidade</button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );


  const exportJSON = () => {
    const data = { favorites, lists, userStates };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "vetra-export.json"; a.click();
    URL.revokeObjectURL(url);
  };
  const exportCSV = () => {
    const rows: string[] = ["type,media,id,title,year,rating,voteCount,state,personalRating"];
    const pushMovie = (m: MovieT) => {
      const meta = getUserMeta(m);
      rows.push([
        "item",
        (m.media || "movie"),
        String(m.id),
        `"${(m.title || "").replace(/"/g, '""')}"`,
        m.year || "",
        String(m.rating ?? ""),
        String(m.voteCount ?? ""),
        meta.state || "",
        typeof meta.rating === "number" ? String(meta.rating) : "",
      ].join(","));
    };
    favorites.forEach(pushMovie);
    lists.forEach((l) => l.items.forEach(pushMovie));
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "vetra-export.csv"; a.click();
    URL.revokeObjectURL(url);
  };
  const importJSON = async (file: File) => {
    try {
      const txt = await file.text();
      const data = JSON.parse(txt);
      if (data.favorites) setFavorites(data.favorites);
      if (data.lists) setLists(data.lists);
      if (data.userStates) setUserStates(data.userStates);
      pushToast({ message: "Importação concluída", tone: "ok" });
    } catch { pushToast({ message: "Falha ao importar", tone: "err" }); }
  };


  const dragSrc = useRef<{ listId: string; idx: number } | null>(null);
  const onDragStart = (listId: string, idx: number) => (e: React.DragEvent) => {
    dragSrc.current = { listId, idx };
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const onDrop = (listId: string, idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const src = dragSrc.current;
    if (!src || src.listId !== listId) return;
    setLists((prev) => prev.map((l) => {
      if (l.id !== listId) return l;
      const arr = [...l.items];
      const [m] = arr.splice(src.idx, 1);
      const target = idx >= arr.length ? arr.length : idx;
      arr.splice(target, 0, m);
      return { ...l, items: arr };
    }));
    dragSrc.current = null;
  };


  const ListDetail: React.FC<{ lst: UserList }> = ({ lst }) => {
    const [order, setOrder] = useState<"recent" | "year" | "rating">("recent");

    const sortedItems = useMemo(() => {
      const arr = [...lst.items];
      if (order === "year") return arr.sort((a, b) => parseInt(b.year || "0") - parseInt(a.year || "0"));
      if (order === "rating") return arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      return arr; 
    }, [lst.items, order]);

    const cover = lst.items.find((m) => m.poster_path) || lst.items[0];

    const openShare = async () => {
      try {
        if (lst.items.length === 0) {
          pushToast({ message: "A lista está vazia", tone: "err" });
          return;
        }
        const payload = lst.items.map((m) => ({
          id: m.id, media: m.media || "movie", title: m.title,
          poster_path: m.poster_path ?? toPosterPath(m.image),
          vote_average: m.rating ?? null, vote_count: m.voteCount ?? null,
          release_date: m.year ? `${m.year}-01-01` : null, first_air_date: null, overview: m.overview ?? "",
        }));
        console.log("[shareListDetail] Criando compartilhamento:", { itemsCount: payload.length, type: 'list', listName: lst.name });
        const resp = await api.shareCreate(payload, 'list', lst.name);
        if (!resp || !resp.url) {
          throw new Error("Resposta inválida do servidor");
        }
        setShareUrl(resp.url); 
        setShowShare(true);
        try { 
          await navigator.clipboard.writeText(resp.url); 
          pushToast({ message: "Link copiado para a área de transferência!", tone: "ok" }); 
        } catch {}
      } catch (e: any) {
        console.error("[shareListDetail] Erro ao compartilhar:", e);
        const errorMsg = e?.message || t("share_fail") || "Erro ao compartilhar lista";
        pushToast({ message: errorMsg, tone: "err" });
      }
    };

    return (
      <div>
        <div className="flex items-center justify-between mb-4 gap-3">
          {viewingShared ? (
            <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">{lst.name}</h3>
          ) : (
          <input
            className="bg-transparent text-lg md:text-xl font-bold outline-none border-b border-transparent focus:border-slate-600"
            value={lst.name}
            onChange={(e) => renameList(lst.id, e.target.value)}
            disabled={viewingShared}
          />
          )}
          <div className="flex items-center gap-2">
            <select value={order} onChange={(e)=>setOrder(e.target.value as any)} className="bg-slate-800 text-white border border-slate-600 rounded-md px-2 py-2">
              <option value="recent">Recentes</option>
              <option value="year">Ano</option>
              <option value="rating">Nota</option>
            </select>
            {lst.items.length > 0 && !viewingShared && (
              <button onClick={openShare} className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 px-4 py-2 rounded-md text-sm" title={t("share")}>
                <Share2 size={16} />{t("share")}
              </button>
            )}
            {!viewingShared && (
              <KebabMenu
                items={[
                  { key: "edit", label: t("edit_list"), icon: <Pencil size={14} />, onClick: () => {} },
                  { key: "clear", label: t("clear_items"), icon: <Trash2 size={14} />, onClick: () => setConfirmModal({ show: true, message: t("clear_items_q"), onConfirm: () => { clearList(lst.id); setConfirmModal({ show: false, message: "", onConfirm: () => {} }); } }) },
                  { key: "delete", label: t("delete_list"), icon: <Trash2 size={14} />, tone: "danger",
                    onClick: () => setConfirmModal({ show: true, message: t("delete_list_q", { name: lst.name }), onConfirm: () => { deleteList(lst.id); setConfirmModal({ show: false, message: "", onConfirm: () => {} }); } }) },
                ]}
              />
            )}
          </div>
        </div>

        {lst.items.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6"
               onDragOver={onDragOver}>
            {sortedItems.map((m, idx) => (
              <div key={`${m.media}-${m.id}`} className="relative"
                   draggable={!viewingShared}
                   onDragStart={onDragStart(lst.id, idx)}
                   onDrop={onDrop(lst.id, idx)}>
                <MovieCard movie={m} />
                {!viewingShared && (
                  <button onClick={() => removeFromList(lst.id, m.id, m.media)}
                    className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded hover:bg-black/80" title={t("remove")}>
                    {t("remove")}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-slate-600 dark:text-gray-400">{t("list_empty")}</div>
        )}

          {!viewingShared && (
          <div className="mt-6 flex items-center gap-2">
              <button onClick={() => { setRenameInput(lst.name); setRenameModal({ show: true, listId: lst.id, currentName: lst.name }); }}
                className="text-sm px-3 py-2 rounded-md border border-slate-600 bg-slate-800 hover:bg-slate-700" title="Renomear lista">
                Renomear
              </button>
              <button onClick={() => setConfirmModal({ show: true, message: `Excluir a lista "${lst.name}"?`, onConfirm: () => { deleteList(lst.id); setConfirmModal({ show: false, message: "", onConfirm: () => {} }); } })}
                className="text-sm px-3 py-2 rounded-md border border-rose-600 text-rose-200 bg-rose-900/30 hover:bg-rose-900/50" title="Excluir lista">
                Excluir
              </button>
          <button onClick={() => setActiveListId(null)} className="ml-auto text-sm text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white underline">
            {t("back_all_lists")}
          </button>
        </div>
        )}

        {cover ? (
          <div className="mt-6 text-sm text-gray-400">Capa automática: <span className="text-white">{cover!.title}</span></div>
        ) : null}
      </div>
    );
  };

  const handlePeoplePageChange = (page: number) => {
    setPeoplePage(page);
  };


  const HistoryContent = (
    <section>
      <div className="mb-8">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2">Histórico de visualização</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">{t("watched_movies")}</p>
      </div>
      {watchHistory.length === 0 ? (
        <div className="text-center py-12 md:py-16 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-md rounded-3xl border border-slate-700/50 shadow-2xl">
          <Clock size={64} className="mx-auto mb-4 text-slate-500" />
          <h3 className="text-xl font-bold text-white mb-2">Nenhum histórico ainda</h3>
          <p className="text-gray-400">{t("mark_watched_hint")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {(() => {
            const reversedHistory = watchHistory.slice().reverse();
            return reversedHistory.slice(0, reversedHistory.length % 2 === 0 ? reversedHistory.length : reversedHistory.length - 1).map((entry) => (
            <div key={mediaKey(entry.movie)}>
              <MovieCard movie={entry.movie} />
              <p className="text-xs text-gray-400 mt-2 text-center">
                {formatDate(entry.watchedAt, { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            ));
          })()}
        </div>
      )}
    </section>
  );

 
  useEffect(() => {
    if (!peopleSearchTerm.trim()) {
      setSearchedPeople([]);
      setPeopleSearchLoading(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setPeopleSearchLoading(true);
      try {
        console.log("[PeopleSearch] Buscando pessoas:", peopleSearchTerm);
        

        const firstPageData = await api.searchPeople(peopleSearchTerm, 1, lang);
        let allResults = (firstPageData as any).results || [];
        const totalPages = (firstPageData as any).total_pages || 1;
        const totalResults = (firstPageData as any).total_results || 0;
        
        console.log("[PeopleSearch] Primeira página:", {
          results: allResults.length,
          totalPages,
          totalResults
        });
        

        const maxPages = Math.min(totalPages, 10); 
        if (maxPages > 1) {
          const pagePromises = [];
          for (let page = 2; page <= maxPages; page++) {
            pagePromises.push(api.searchPeople(peopleSearchTerm, page, lang));
          }
          
          try {
   
            const additionalPages = await Promise.allSettled(pagePromises);
            additionalPages.forEach((result: any) => {
              if (result.status === 'fulfilled') {
                const pageData = result.value;
                const pageResults = (pageData as any).results || [];
                allResults = [...allResults, ...pageResults];
              } else {
                console.warn("[PeopleSearch] Erro ao carregar uma página:", result.reason);
              }
            });
            console.log("[PeopleSearch] Todas as páginas carregadas:", allResults.length, "resultados de", maxPages, "páginas");
          } catch (e) {
            console.warn("[PeopleSearch] Erro ao carregar páginas adicionais, usando apenas primeira página:", e);
          }
        }
        

        let peopleResults = allResults.filter((x: any) => {
          const hasName = x.name && x.name.trim() !== "";
          return hasName;
        });
        
        peopleResults.sort((a: any, b: any) => {
          const aHasPhoto = !!(a.profile_path && a.profile_path.trim());
          const bHasPhoto = !!(b.profile_path && b.profile_path.trim());
          if (aHasPhoto && !bHasPhoto) return -1;
          if (!aHasPhoto && bHasPhoto) return 1;
          
          const aIsActor = a.known_for_department === "Acting";
          const bIsActor = b.known_for_department === "Acting";
          if (aIsActor && !bIsActor) return -1;
          if (!aIsActor && bIsActor) return 1;
          
          const aPopularity = a.popularity || 0;
          const bPopularity = b.popularity || 0;
          if (bPopularity !== aPopularity) {
            return bPopularity - aPopularity;
          }
          
          return 0;
        });
        
        setSearchedPeople(peopleResults);
      } catch (e: any) {
        console.error("[PeopleSearch] Erro ao buscar pessoas:", e);
        setSearchedPeople([]);
        pushToast({ message: t("error_search_people"), tone: "err" });
      } finally {
        setPeopleSearchLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [peopleSearchTerm, lang]);


  const filteredPeople = useMemo(() => {
    if (peopleSearchTerm.trim()) {
      return searchedPeople;
    }
    return popularPeopleList;
  }, [peopleSearchTerm, searchedPeople, popularPeopleList]);


  const StatsContent = (
    <section>
      <div className="mb-8">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2">Minhas estatísticas</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">Visão geral da sua atividade</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 rounded-xl p-6 border border-cyan-500/30">
          <div className="flex items-center gap-3 mb-2">
            <Film className="text-cyan-400" size={24} />
            <h3 className="text-sm font-semibold text-gray-400">Assistidos</h3>
          </div>
          <div className="text-2xl font-bold text-white">{userStats.totalWatched || 0}</div>
        </div>
        <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-xl p-6 border border-red-500/30">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="text-red-400" size={24} />
            <h3 className="text-sm font-semibold text-gray-400">Favoritos</h3>
          </div>
          <div className="text-2xl font-bold text-white">{userStats.totalFavorites || 0}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-6 border border-purple-500/30">
          <div className="flex items-center gap-3 mb-2">
            <ListIcon className="text-purple-400" size={24} />
            <h3 className="text-sm font-semibold text-gray-400">Listas</h3>
          </div>
          <div className="text-2xl font-bold text-white">{userStats.totalLists || 0}</div>
        </div>
        <div className="bg-gradient-to-br from-lime-500/20 to-lime-600/20 rounded-xl p-6 border border-lime-500/30">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-lime-400" size={24} />
            <h3 className="text-sm font-semibold text-gray-400">Este mês</h3>
          </div>
          <div className="text-2xl font-bold text-white">{userStats.watchedThisMonth || 0}</div>
        </div>
      </div>
      {userStats.lastWatched && (
        <div className="bg-slate-900/60 rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Último assistido</h3>
          <div className="flex items-center gap-4">
            <img 
              src={userStats.lastWatched.movie.image || poster(userStats.lastWatched.movie.poster_path)} 
              alt={userStats.lastWatched.movie.title}
              className="w-20 h-30 object-cover rounded-lg"
            />
            <div>
              <h4 className="text-white font-semibold">{userStats.lastWatched.movie.title}</h4>
              <p className="text-gray-400 text-sm">
                {formatDate(userStats.lastWatched.watchedAt, { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );

  const PeopleContent = (
    <section>
      <div className="mb-4 sm:mb-6 md:mb-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">{t("people")}</h2>
        <div className="h-1 w-16 sm:w-20 bg-gradient-to-r from-cyan-500 via-purple-500 to-lime-400 rounded-full" />
      </div>
      
      <div className="mb-4 sm:mb-6">
        <div className="relative">
          <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <Search className="text-slate-400 dark:text-slate-500 w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <input
            value={peopleSearchTerm}
            onChange={(e) => setPeopleSearchTerm(e.target.value)}
            placeholder={t("search_by_name")}
            className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-lg border border-slate-300 dark:border-slate-600 focus:border-cyan-500 dark:focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:focus:ring-cyan-400/20 transition-all duration-200 text-sm sm:text-base font-normal"
          />
        </div>
      </div>
      
      {(peopleLoading && popularPeopleList.length === 0 && !peopleSearchTerm.trim()) || (peopleSearchLoading && peopleSearchTerm.trim()) ? (
        <div className="text-center py-12 md:py-16">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-300 dark:border-slate-700 border-t-cyan-500"></div>
          <p className="text-slate-600 dark:text-gray-400 mt-4 font-medium">
            {peopleSearchTerm.trim() ? "Buscando pessoas..." : "Carregando pessoas..."}
          </p>
        </div>
      ) : filteredPeople.length === 0 && peopleSearchTerm.trim() ? (
        <div className="text-center py-12 md:py-16 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-slate-700/50 shadow-2xl">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-slate-200/20 to-slate-300/20 dark:from-slate-700/20 dark:to-slate-800/20 mb-6 ring-4 ring-slate-300/10 dark:ring-slate-600/10">
            <User size={48} className="text-slate-400 dark:text-gray-500" />
          </div>
          <p className="text-slate-900 dark:text-white text-xl font-bold mb-2">Nenhuma pessoa encontrada</p>
          <p className="text-slate-600 dark:text-slate-400">Tente ajustar sua busca</p>
        </div>
      ) : filteredPeople.length === 0 ? (
        <div className="text-center py-12 md:py-16 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-slate-700/50 shadow-2xl">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-slate-200/20 to-slate-300/20 dark:from-slate-700/20 dark:to-slate-800/20 mb-6 ring-4 ring-slate-300/10 dark:ring-slate-600/10">
            <User size={48} className="text-slate-400 dark:text-gray-500" />
          </div>
          <p className="text-slate-900 dark:text-white text-xl font-bold mb-2">Nenhuma pessoa encontrada</p>
          <p className="text-slate-600 dark:text-slate-400">Os dados estão sendo carregados...</p>
        </div>
      ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {filteredPeople.map((person: any) => (
              <Link
                key={person.id}
                to={`/person/${person.id}`}
                className="group bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-500 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4">
                  <div className="flex-shrink-0 mx-auto sm:mx-0">
                  {person.profile_path ? (
                    <img
                        src={`https://image.tmdb.org/t/p/w300${person.profile_path}`}
                      alt={person.name}
                        className="w-20 h-28 sm:w-24 sm:h-32 md:w-28 md:h-40 rounded-lg object-cover object-center shadow-md group-hover:scale-105 transition-transform duration-300"
                      style={{ aspectRatio: "2/3" }}
                      onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://via.placeholder.com/300x450?text=No+Image";
                      }}
                    />
                  ) : (
                      <div className="w-20 h-28 sm:w-24 sm:h-32 md:w-28 md:h-40 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-lg flex items-center justify-center shadow-md" style={{ aspectRatio: "2/3" }}>
                        <User size={28} className="sm:w-8 sm:h-8 text-slate-400 dark:text-gray-600" />
                    </div>
                  )}
                </div>
                  
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-2">
                  {person.name}
                    </h3>
                    
                    {person.known_for_department && (
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-2">
                        <span className="font-semibold">Departamento:</span> {person.known_for_department}
                      </p>
                    )}
                    
                {person.known_for && person.known_for.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-500 mb-1">Conhecido por:</p>
                        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 line-clamp-2 sm:line-clamp-3">
                    {person.known_for.map((kf: any) => kf.title || kf.name).join(", ")}
                        </p>
                  </div>
                )}
                    
                    {person.popularity && (
                      <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                        <TrendingUp size={12} className="sm:w-3.5 sm:h-3.5 text-cyan-500" />
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          Popularidade: {Math.round(person.popularity)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          {peopleTotalPages > 1 && !peopleSearchTerm.trim() && (
            <div className="mt-8">
            <Pagination
              currentPage={peoplePage}
              totalPages={peopleTotalPages}
              onPageChange={handlePeoplePageChange}
              loading={peopleLoading}
            />
            </div>
          )}
        </>
      )}
    </section>
  );

  // Modal de Edição de Perfil
  const ProfileEditModal: React.FC = () => {
    const [editFirstName, setEditFirstName] = useState("");
    const [editLastName, setEditLastName] = useState("");
    const [editAvatar, setEditAvatar] = useState<string | null>(user?.avatar_url || null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);
    const [showPasswords, setShowPasswords] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

   
    useEffect(() => {
      if (showProfileModal) {
        const fullName = user?.name || "";
        const nameParts = fullName.split(' ');
        setEditFirstName(nameParts[0] || "");
        setEditLastName(nameParts.slice(1).join(' ') || "");
        setEditAvatar(user?.avatar_url || null);
        setAvatarFile(null);
        setShowPasswordSection(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    }, [showProfileModal, user]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          pushToast({ message: "A imagem deve ter no máximo 5MB", tone: "err" });
          return;
        }
        if (!file.type.startsWith("image/")) {
          pushToast({ message: "Por favor, selecione uma imagem", tone: "err" });
          return;
        }
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setEditAvatar(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };

    const handleSave = async () => {
      if (!editFirstName.trim()) {
        pushToast({ message: "O nome é obrigatório", tone: "err" });
        return;
      }
      const fullName = editLastName.trim() 
        ? `${editFirstName.trim()} ${editLastName.trim()}`
        : editFirstName.trim();
      setSaving(true);
      try {
        await saveProfile({ name: fullName, avatar_url: editAvatar });
        pushToast({ message: "Perfil atualizado com sucesso!", tone: "ok" });
      } catch (e: any) {
        pushToast({ message: e?.message || "Erro ao salvar perfil", tone: "err" });
      } finally {
        setSaving(false);
      }
    };

    const handleChangePassword = async () => {
      if (!newPassword || !confirmPassword) {
        pushToast({ message: "Preencha todos os campos", tone: "err" });
        return;
      }
      if (newPassword.length < 8) {
        pushToast({ message: "A senha deve ter no mínimo 8 caracteres", tone: "err" });
        return;
      }
      if (newPassword !== confirmPassword) {
        pushToast({ message: "As senhas não coincidem", tone: "err" });
        return;
      }
      setChangingPassword(true);
      try {
        const idToken = localStorage.getItem('vetra:idToken');
        if (!idToken) {
          pushToast({ message: "Você precisa estar autenticado. Faça login novamente.", tone: "err" });
          setChangingPassword(false);
          return;
        }
        
        const result = await changePassword(newPassword, idToken);
        if (result.ok) {
          pushToast({ message: "Senha alterada com sucesso! Faça login novamente.", tone: "ok" });
          setShowPasswordSection(false);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          
         
          setIsLoggedIn(false);
          setUser(null);
          localStorage.removeItem('vetra:idToken');
          localStorage.removeItem('vetra:refreshToken');
        } else {
          const errorMsg = result.error || result.message || "Erro ao alterar senha";
          console.error("[handleChangePassword] Erro:", result);
      
          if (errorMsg.includes("Token") || errorMsg.includes("token") || errorMsg.includes("Reautentique")) {
            pushToast({ message: "Sua sessão expirou. Faça login novamente para alterar a senha.", tone: "err" });
          } else {
            pushToast({ message: errorMsg, tone: "err" });
          }
        }
      } catch (e: any) {
        console.error("[handleChangePassword] Exceção:", e);
        pushToast({ message: e?.message || e?.error || "Erro ao alterar senha. Verifique o console para mais detalhes.", tone: "err" });
      } finally {
        setChangingPassword(false);
      }
    };

   
    const stats = {
      favorites: favorites.length,
      lists: lists.length,
      watched: Object.values(userStates).filter(s => s.state === "watched").length,
      want: Object.values(userStates).filter(s => s.state === "want").length,
    };

    if (!showProfileModal) return null;

    return (
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-200 opacity-100" 
        onClick={() => setShowProfileModal(false)}
      >
        <div 
          className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl max-w-2xl w-full border border-slate-700/50 shadow-2xl transform transition-all duration-300 scale-100" 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-lime-400/20 p-6 rounded-t-2xl border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">Meu Perfil</h2>
                <p className="text-sm text-gray-400">Gerencie suas informações e preferências</p>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-white transition-all hover:bg-slate-700/50 rounded-lg p-2"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="flex flex-col items-center">
                  <label className="cursor-pointer group">
                    {editAvatar ? (
                      <div className="relative">
                        <img
                          src={editAvatar}
                          alt="Avatar"
                          className="w-32 h-32 rounded-full object-cover border-4 border-slate-700 shadow-xl group-hover:border-cyan-500/50 transition-all duration-300"
                        />
                        <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Pencil size={24} className="text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 via-purple-500 to-lime-400 flex items-center justify-center text-white font-bold text-2xl border-4 border-slate-700 shadow-xl group-hover:border-cyan-500/50 transition-all duration-300">
                        {editFirstName.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 px-4 py-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-all duration-200"
                  >
                    {editAvatar ? "Alterar foto" : "Adicionar foto"}
                  </button>
                  {editAvatar && (
                    <button
                      onClick={() => {
                        setEditAvatar(null);
                        setAvatarFile(null);
                      }}
                      className="mt-2 text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Remover foto
                    </button>
                  )}
                </div>

                {}
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Estatísticas</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-slate-900/50 rounded-lg border border-slate-700/30">
                      <div className="text-xl font-bold text-cyan-400">{stats.favorites}</div>
                      <div className="text-xs text-gray-400 mt-1">Favoritos</div>
                    </div>
                    <div className="text-center p-3 bg-slate-900/50 rounded-lg border border-slate-700/30">
                      <div className="text-xl font-bold text-purple-400">{stats.lists}</div>
                      <div className="text-xs text-gray-400 mt-1">Listas</div>
                    </div>
                    <div className="text-center p-3 bg-slate-900/50 rounded-lg border border-slate-700/30">
                      <div className="text-xl font-bold text-lime-400">{stats.watched}</div>
                      <div className="text-xs text-gray-400 mt-1">Assistidos</div>
                    </div>
                    <div className="text-center p-3 bg-slate-900/50 rounded-lg border border-slate-700/30">
                      <div className="text-xl font-bold text-yellow-400">{stats.want}</div>
                      <div className="text-xs text-gray-400 mt-1">Quero ver</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Nome <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full bg-slate-800/70 text-white px-4 py-3 rounded-xl border border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all duration-200"
                    placeholder="Seu nome"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Sobrenome
                  </label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full bg-slate-800/70 text-white px-4 py-3 rounded-xl border border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all duration-200"
                    placeholder="Seu sobrenome"
                  />
                </div>

                {}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="w-full bg-slate-800/30 text-gray-500 px-4 py-3 rounded-xl border border-slate-700/50 cursor-not-allowed"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Lock size={16} className="text-gray-600" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <Lock size={12} />
                    O email não pode ser alterado
                  </p>
                </div>

                {}
                <div className="border-t border-slate-700/50 pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-gray-300">
                      Senha
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPasswordSection(!showPasswordSection)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      {showPasswordSection ? "Cancelar" : "Alterar senha"}
                    </button>
                  </div>
                  {showPasswordSection && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5">Senha atual</label>
                        <div className="relative">
                          <input
                            type={showPasswords ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full bg-slate-800/70 text-white px-4 py-2.5 rounded-lg border border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all text-sm"
                            placeholder="Digite sua senha atual"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(!showPasswords)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5">Nova senha</label>
                        <input
                          type={showPasswords ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-slate-800/70 text-white px-4 py-2.5 rounded-lg border border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all text-sm"
                          placeholder="Mínimo 6 caracteres"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5">Confirmar nova senha</label>
                        <input
                          type={showPasswords ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-slate-800/70 text-white px-4 py-2.5 rounded-lg border border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all text-sm"
                          placeholder="Digite a senha novamente"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleChangePassword}
                        disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-700 dark:bg-slate-600 text-white font-semibold text-sm hover:bg-slate-600 dark:hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg border border-slate-600 dark:border-slate-500 hover:border-slate-500 dark:hover:border-slate-400"
                      >
                        {changingPassword ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Alterando...
                          </span>
                        ) : (
                          "Alterar senha"
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowProfileModal(false)}
                    className="flex-1 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-all duration-200 border border-slate-700 hover:border-slate-600"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !editFirstName.trim()}
                    className="flex-1 px-5 py-3 rounded-xl bg-slate-700 dark:bg-slate-600 text-white font-semibold hover:bg-slate-600 dark:hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg border border-slate-600 dark:border-slate-500 hover:border-slate-500 dark:hover:border-slate-400"
                  >
                    {saving ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Salvando...
                      </span>
                    ) : (
                      "Salvar alterações"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ProfileContent = (
    <section>
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 md:mb-4">{t("profile") ?? "Perfil"}</h2>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="text-lg font-semibold mb-4">Dados da conta</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Nome e Sobrenome</label>
              <input
                value={user?.name ?? ""}
                onChange={(e) => setUser((u) => ({ 
                  name: e.target.value, 
                  email: u?.email || "", 
                  avatar_url: u?.avatar_url ?? null, 
                  updatedAt: u?.updatedAt ?? null 
                }))}
                className="w-full bg-slate-800 text-white px-3 py-2 rounded-md border border-slate-700"
                placeholder="Seu nome completo"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                value={user?.email ?? ""}
                onChange={(e) => setUser((u) => ({ 
                  name: u?.name || "Usuário", 
                  email: e.target.value, 
                  avatar_url: u?.avatar_url ?? null, 
                  updatedAt: u?.updatedAt ?? null 
                }))}
                className="w-full bg-slate-800 text-white px-3 py-2 rounded-md border border-slate-700"
                placeholder="Seu email"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => saveProfile({ name: user?.name || "Usuário", avatar_url: user?.avatar_url })}
                disabled={profileLoading}
                className="px-4 py-2.5 rounded-xl bg-slate-700 dark:bg-slate-600 text-white font-semibold hover:bg-slate-600 dark:hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg border border-slate-600 dark:border-slate-500 hover:border-slate-500 dark:hover:border-slate-400"
              >
                {profileLoading ? "Salvando..." : "Salvar"}
              </button>
              <ThemeButton enabled={darkEnabled} onToggle={toggleDark} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="text-lg font-semibold mb-4">Exportar / Importar</h3>
          <div className="flex flex-wrap gap-3">
            <button onClick={exportJSON} className="px-4 py-2 rounded-md border border-slate-600 bg-slate-800 hover:bg-slate-700">
              Exportar JSON
            </button>
            <button onClick={exportCSV} className="px-4 py-2 rounded-md border border-slate-600 bg-slate-800 hover:bg-slate-700">
              Exportar CSV
            </button>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-slate-600 bg-slate-800 hover:bg-slate-700 cursor-pointer">
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.currentTarget.files?.[0];
                  if (f) importJSON(f);
                  e.currentTarget.value = ""; // permite reimportar o mesmo arquivo
                }}
              />
              Importar JSON
            </label>
          </div>

          <div className="mt-6 text-sm text-gray-300 space-y-1">
            <div>Backend/TMDb: <strong className="text-white">{apiStatus === "ok" ? (tmdb.apiBase ? "Backend OK" : "TMDb direto OK") : "Falhou"}</strong></div>
            <div>Auth TMDb: <span className="text-white">{tmdb.hasBearer ? "v4" : tmdb.hasV3 ? "v3" : "—"}</span></div>
            <div>Idioma TMDb: <span className="text-white">{tmdb.lang}</span></div>
          </div>
        </div>
      </div>
    </section>
  );

  // ---------- Tela principal ----------
  const HomeContent = (
    <>
      {/* Hero Section - Inspirado no TMDB - Full-bleed */}
      <section className="mb-6 md:mb-8 w-full">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 w-full">
          {/* Background sutil com filme em destaque */}
            {cats.trending?.items && cats.trending.items.length > 0 ? (
            <div className="absolute inset-0 overflow-hidden opacity-[0.03] dark:opacity-[0.08]">
                      <img
                src={cats.trending.items[0]?.image || poster(cats.trending.items[0]?.poster_path)}
                        alt=""
                className="w-full h-full object-cover scale-110"
                style={{ filter: 'blur(60px)' }}
                        loading="lazy"
                      />
                    </div>
          ) : null}
          
          <div className="relative px-6 sm:px-8 md:px-10 lg:px-12 xl:px-16 py-8 md:py-10 lg:py-12">
            {/* Conteúdo */}
            <div className="relative z-10 max-w-4xl mx-auto">
              <h2 className="text-[31px] sm:text-[37px] md:text-[43px] font-bold text-slate-900 dark:text-white mb-2 md:mb-3 tracking-tight">
                {user?.name ? (
                  <>{t("hello")}, <span className="bg-gradient-to-r from-cyan-500 via-purple-500 to-lime-500 bg-clip-text text-transparent">{user.name.split(' ')[0]}</span></>
                ) : (
                  <>{t("welcome")}.</>
                )}
                </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-6 md:mb-8 font-normal">
                {t("millions_movies")}
              </p>
              
              <div className="flex flex-col gap-3 max-w-2xl">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                      <Search className="text-slate-400 dark:text-slate-500" size={20} />
              </div>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={t("search_placeholder_full")}
                      className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 pl-12 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 focus:border-cyan-500 dark:focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:focus:ring-cyan-400/20 transition-all duration-200 text-base font-normal"
                      style={{ lineHeight: '1.6', minHeight: '48px' }}
                onKeyDown={(e) => e.key === "Enter" && runSearch(searchTerm)}
              />
            </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowSearchFilters(!showSearchFilters)}
                      className="px-4 py-3 rounded-lg font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 text-base whitespace-nowrap min-h-[48px] flex items-center gap-2"
                    >
                      <ChevronDown className={`transition-transform ${showSearchFilters ? 'rotate-180' : ''}`} size={18} />
                      {t("filters")}
                    </button>
            <button
              onClick={() => runSearch(searchTerm)}
                      className="px-6 py-3 rounded-lg font-semibold text-white bg-slate-700 dark:bg-slate-600 hover:bg-slate-600 dark:hover:bg-slate-500 transition-all duration-200 shadow-md hover:shadow-lg text-base whitespace-nowrap min-h-[48px] border border-slate-600 dark:border-slate-500"
            >
              {t("search_button")}
            </button>
          </div>
        </div>
                
                {/* Painel de Filtros Expandível */}
                {showSearchFilters && (
                  <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-600 p-4 shadow-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Tipo */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tipo</label>
                        <select
                          value={searchType}
                          onChange={(e) => setSearchType(e.target.value as "all" | "movie" | "tv" | "person")}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                        >
                          <option value="all">{t("tudo")}</option>
                          <option value="movie">{t("movies")}</option>
                          <option value="tv">{t("tv_series")}</option>
                          <option value="person">{t("people")}</option>
              </select>
            </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Ano De</label>
              <input
                type="number"
                value={searchYear}
                onChange={(e) => setSearchYear(e.target.value)}
                          placeholder="Ex: 2020"
                min="1900"
                max={new Date().getFullYear() + 1}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
              />
            </div>
                      
                      {/* Ano Até */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Ano Até</label>
                        <input
                          type="number"
                          value={searchYearTo}
                          onChange={(e) => setSearchYearTo(e.target.value)}
                          placeholder="Ex: 2024"
                          min="1900"
                          max={new Date().getFullYear() + 1}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                        />
                      </div>
                      
                      {/* Ordenar por */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Ordenar por</label>
                        <select
                          value={searchSort}
                          onChange={(e) => setSearchSort(e.target.value as "relevance" | "rating" | "year")}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                        >
                          <option value="relevance">Relevância</option>
                          <option value="rating">Avaliação</option>
                          <option value="year">Ano</option>
                        </select>
                      </div>
                      
                      {/* Mín. de Votos */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Mín. de Votos</label>
                        <input
                          type="number"
                          value={searchMinVotes}
                          onChange={(e) => setSearchMinVotes(e.target.value)}
                          placeholder="Ex: 100"
                          min="0"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                        />
                      </div>
                      
                      {/* Mín. de Avaliação */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Mín. de Avaliação</label>
              <input
                type="number"
                value={searchMinRating}
                onChange={(e) => setSearchMinRating(e.target.value)}
                placeholder="Ex: 7.0"
                min="0"
                max="10"
                step="0.1"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
              />
            </div>
                      
                      {/* Apenas com pôster */}
                      <div className="flex items-center">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={searchOnlyWithPoster}
                            onChange={(e) => setSearchOnlyWithPoster(e.target.checked)}
                            className="w-4 h-4 text-cyan-600 rounded border-slate-300 dark:border-slate-600 focus:ring-cyan-500"
                          />
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Apenas com pôster</span>
                        </label>
          </div>
        </div>
                    
                    {/* Botão Limpar */}
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => {
                          setSearchType("all");
                          setSearchYear("");
                          setSearchYearTo("");
                          setSearchMinRating("");
                          setSearchMinVotes("");
                          setSearchGenre([]);
                          setSearchOnlyWithPoster(true);
                          setSearchSort("relevance");
                        }}
                        className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-all"
                      >
                        {t("clear_filters")}
                      </button>
            </div>
          </div>
                )}
              </div>
            </div>
          </div>
          </div>
        </section>

      {/* Container para as outras seções */}
      <div className="container mx-auto px-3 sm:px-4 md:px-6">
        {/* Recomendações Personalizadas - apenas quando não há busca */}
        {!searchTerm && isLoggedIn && watchHistory.length > 0 && (
        <HorizontalCarousel
          title="Recomendados para você"
          subtitle="Baseado no seu histórico e favoritos"
          items={getPersonalizedRecommendations()}
          loading={false}
          renderItem={(m) => <MovieCard movie={m} />}
        />
      )}

      {searchTerm ? (
        <section className="mb-6 md:mb-8">
          <h2 className="text-base sm:text-lg md:text-xl font-bold mb-3 md:mb-4">{t("results_for", { q: searchTerm })}</h2>
          {loading ? (
            <div className="text-center py-6 md:mb-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-cyan-500 dark:border-slate-700" />
            </div>
          ) : (
            <>
              {/* Filmes e Séries - sempre mostrar TODOS quando houver busca ativa, independente do filtro */}
              {movies.length > 0 && (
                <>
                  <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">{t("movies_and_series")}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-10">
                    {movies.map((m) => (
                      <MovieCard key={`${m.media}-${m.id}`} movie={m} />
                    ))}
                  </div>
                </>
              )}
              
              {/* Pessoas - sempre mostrar quando houver busca, independente do filtro */}
              {people.length > 0 && (
                <>
                  <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">Pessoas</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-2 md:gap-3">
                    {people.map((p:any)=>(
                      <Link key={p.id} to={`/person/${p.id}`} className="group">
                        <div className="rounded-xl overflow-hidden bg-white dark:bg-slate-900/70 ring-1 ring-slate-200 dark:ring-white/10 shadow-lg dark:shadow-xl">
                          {p.profile_path ? (
                            <img 
                              src={`https://image.tmdb.org/t/p/w300${p.profile_path}`} 
                              alt={p.name} 
                              className="w-full object-cover object-center" 
                              style={{aspectRatio:"2/3", objectFit: 'cover', objectPosition: 'center top'}} 
                            />
                          ) : (
                            <div className="w-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center" style={{aspectRatio:"2/3"}}>
                              <User size={48} className="text-slate-400 dark:text-gray-600" />
                            </div>
                          )}
                          <div className="p-3 text-slate-900 dark:text-white/90 font-semibold group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{p.name}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
              
              {/* Mensagem quando não há resultados */}
              {!loading && movies.length === 0 && people.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-slate-600 dark:text-slate-400 text-lg">{t("no_results_found", { q: searchTerm })}</p>
                  <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">{t("try_adjust_filters")}</p>
                </div>
              )}
            </>
          )}
        </section>
      ) : (
        <>
          {/* Carrossel de Tendências */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{t("trending")}</h2>
              </div>
              <div className="flex gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-1 border border-slate-200 dark:border-slate-700 shadow-lg">
                <button
                  onClick={() => setTrendingWindow("day")}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
                    trendingWindow === "day"
                      ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/30"
                      : "text-slate-700 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                  }`}
                >
                  {t("today")}
                </button>
                <button
                  onClick={() => setTrendingWindow("week")}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
                    trendingWindow === "week"
                      ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/30"
                      : "text-slate-700 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                  }`}
                >
                  {t("this_week")}
                </button>
              </div>
            </div>
            <HorizontalCarousel
              title=""
              subtitle=""
              items={cats.trending?.items || []}
              loading={cats.trending?.loading && cats.trending.items.length === 0}
              renderItem={(m) => <MovieCard movie={m} />}
            />
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{t("cat_popular")}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {popularFilter === "streaming" ? t("movies_streaming") : 
                   popularFilter === "tv" ? t("series_tv") :
                   popularFilter === "rent" ? t("movies_rent") :
                   t("movies_theaters")}
                </p>
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-1 border border-slate-200 dark:border-slate-700 shadow-lg">
                <button
                  onClick={() => setPopularFilter("streaming")}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${
                    popularFilter === "streaming"
                      ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/30"
                      : "text-slate-700 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                  }`}
                >
                  Streaming
                </button>
                <button
                  onClick={() => setPopularFilter("tv")}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${
                    popularFilter === "tv"
                      ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/30"
                      : "text-slate-700 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                  }`}
                >
                  Na TV
                </button>
                <button
                  onClick={() => setPopularFilter("rent")}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${
                    popularFilter === "rent"
                      ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/30"
                      : "text-slate-700 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                  }`}
                >
                  Para Alugar
                </button>
                <button
                  onClick={() => setPopularFilter("cinema")}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${
                    popularFilter === "cinema"
                      ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/30"
                      : "text-slate-700 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                  }`}
                >
                  Nos Cinemas
                </button>
              </div>
            </div>
            <HorizontalCarousel
              title=""
              subtitle=""
              items={filteredPopular.items}
              loading={filteredPopular.loading && filteredPopular.items.length === 0}
              renderItem={(m) => <MovieCard movie={m} />}
            />
          </div>

          {cats.top_rated && (
            <HorizontalCarousel
              title={t(CAT_META.top_rated.title_key as string)}
              subtitle={t("best_movies")}
              items={cats.top_rated.items.slice(0, 20)}
              loading={cats.top_rated.loading && cats.top_rated.page === 0}
              renderItem={(m) => <MovieCard movie={m} />}
            />
          )}

          {cats.now_playing && (
            <HorizontalCarousel
              title={t(CAT_META.now_playing.title_key as string)}
              subtitle={t("movies_in_theaters")}
              items={cats.now_playing.items.slice(0, 20)}
              loading={cats.now_playing.loading && cats.now_playing.page === 0}
              renderItem={(m) => <MovieCard movie={m} />}
            />
          )}

          {cats.upcoming && (
            <HorizontalCarousel
              title={t(CAT_META.upcoming.title_key as string)}
              subtitle="Próximos lançamentos"
              items={cats.upcoming.items.slice(0, 20)}
              loading={cats.upcoming.loading && cats.upcoming.page === 0}
              renderItem={(m) => <MovieCard movie={m} />}
            />
          )}
        </>
      )}
      </div>
    </>
  );

  // Conteúdo da Watchlist (Quero ver, Assisti, Não assisti, Abandonei com notas)
  const WatchlistContent = (
    <section className="max-w-7xl mx-auto px-4 sm:px-6">
      {viewingShared && sharedCollection ? (
        <>
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">{sharedCollection.listName}</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">{sharedCollection.items.length} {sharedCollection.items.length === 1 ? 'item' : 'itens'}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sharedCollection.items.map(({ movie, meta }, idx) => (
              <div key={`${movie.media}-${movie.id}`} className="group animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  {/* Poster */}
                  <div className="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900">
                    <img
                      src={poster(movie.poster_path || movie.image, "w500")}
                      alt={movie.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Badge de nota */}
                    {meta.rating !== undefined && (
                      <div className="absolute top-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-lg">
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-slate-900 dark:text-white font-bold text-sm">{meta.rating}/10</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Conteúdo */}
                  <div className="p-5">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {movie.title}
                    </h3>
                    
                    <div className="flex items-center gap-3 mb-3">
                      {movie.year && (
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                          {movie.year}
                        </span>
                      )}
                    </div>
                    
                    {/* Descrição */}
                    {meta.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-3 leading-relaxed">
                        {meta.description}
                      </p>
                    )}
                    
                    <button
                      onClick={() => {
                        const mediaType = (movie.media || "movie") as "movie" | "tv";
                        navigate(`/${mediaType}/${movie.id}`);
                      }}
                      className="w-full py-2.5 rounded-xl bg-slate-700 dark:bg-slate-600 hover:bg-slate-600 dark:hover:bg-slate-500 text-white font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Ver detalhes
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">{t("collections")}</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">{t("organize_by_status")}</p>
              </div>
              <div className="flex items-center gap-3">
          {(() => {
            const currentState = activeTab === "watchlist" ? "want" : (activeTab.startsWith("watchlist-") ? activeTab.replace("watchlist-", "") : "want") as UserState;
            const stateLabels = { want: "Quero assistir", watched: "Assisti", not_watched: "Não assisti", abandoned: "Abandonei" };
            const itemsCount = Object.entries(userStates).filter(([_, meta]) => meta.state === currentState).length;
            
            if (itemsCount > 0 && !viewingShared) {
              return (
                <button
                  onClick={() => {
                    setConfirmModal({
                      show: true,
                      message: `Tem certeza que deseja remover todos os itens de "${stateLabels[currentState]}"?`,
                      onConfirm: () => {
                        const keysToRemove = Object.entries(userStates)
                          .filter(([_, meta]) => meta.state === currentState)
                          .map(([key]) => key);
                        
                        setUserStates((prev) => {
                          const updated = { ...prev };
                          keysToRemove.forEach(key => {
                            const meta = updated[key];
                            if (meta?.state === "watched") {
                              // Se estava marcado como assistido, remover do histórico também
                              removeFromWatchHistory({ id: Number(key.split(":")[1]), media: (key.split(":")[0] || "movie") as MediaT } as MovieT);
                            }
                            delete updated[key];
                          });
                          return updated;
                        });
                        
                        pushToast({ message: `Todos os itens de "${stateLabels[currentState]}" foram removidos`, tone: "ok" });
                        setConfirmModal({ show: false, message: "", onConfirm: () => {} });
                      }
                    });
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 dark:bg-rose-700 hover:bg-rose-700 dark:hover:bg-rose-800 text-white text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg border border-rose-700 dark:border-rose-800"
                  title="Limpar coleção"
                >
                  <Trash2 size={16} />
                  Limpar
                </button>
              );
            }
            return null;
          })()}
          <button
            onClick={async () => {
              try {
                const currentState = activeTab === "watchlist" ? "want" : (activeTab.startsWith("watchlist-") ? activeTab.replace("watchlist-", "") : "want") as UserState;
                const stateLabels = { want: "Quero assistir", watched: "Assisti", not_watched: "Não assisti", abandoned: "Abandonei" };
                
                // Buscar itens com todas as fontes disponíveis
                const allMovies = [
                  ...favorites,
                  ...watchHistory.map(h => h.movie),
                  ...(cats.trending?.items || []),
                  ...(cats.popular?.items || []),
                  ...(cats.top_rated?.items || []),
                  ...(cats.now_playing?.items || []),
                  ...(cats.upcoming?.items || []),
                ];
                
                const itemsWithMeta = Object.entries(userStates)
                  .filter(([_, meta]) => meta.state === currentState)
                  .map(([key, meta]) => {
                    const [media, idStr] = key.split(":");
                    const id = Number(idStr);
                    const mediaType = (media || "movie") as MediaT;
                    
                    // Buscar em todas as fontes
                    let found = allMovies.find(
                      m => m.id === id && (m.media || "movie") === mediaType
                    );
                    
                    // Se não encontrou, buscar nas listas
                    if (!found) {
                      for (const list of lists) {
                        found = list.items.find(
                          m => m.id === id && (m.media || "movie") === mediaType
                        );
                        if (found) break;
                      }
                    }
                    
                    // Se ainda não encontrou, usar cache
                    if (!found && meta.movieCache) {
                      found = {
                        id,
                        media: meta.movieCache.media || mediaType,
                        title: meta.movieCache.title,
                        image: meta.movieCache.image || "",
                        poster_path: meta.movieCache.poster_path || null,
                        year: meta.movieCache.year || null,
                        rating: null,
                        voteCount: null,
                        overview: ""
                      };
                    }
                    
                    if (!found) return null;
                    
                    return {
                      movie: { ...found, media: mediaType },
                      meta
                    };
                  })
                  .filter((item) => item !== null) as Array<{ movie: MovieT; meta: { state?: UserState; rating?: number; description?: string } }>;
                
                if (itemsWithMeta.length === 0) {
                  pushToast({ message: "Não há itens para compartilhar nesta coleção.", tone: "warn" });
                  return;
                }
                
                // Preparar payload com nota e descrição
                const payload = itemsWithMeta.map(({ movie, meta }) => ({
                  id: movie.id,
                  media: movie.media || "movie",
                  title: movie.title,
                  poster_path: movie.poster_path ?? toPosterPath(movie.image),
                  vote_average: meta.rating ?? null,
                  vote_count: movie.voteCount ?? null,
                  release_date: movie.year ? `${movie.year}-01-01` : null,
                  first_air_date: null,
                  overview: meta.description || movie.overview || "",
                  // Campos customizados para coleções
                  user_rating: meta.rating ?? null,
                  user_description: meta.description || null,
                }));
                
                console.log("[shareCollection] Criando compartilhamento:", { itemsCount: payload.length, type: 'collection', category: stateLabels[currentState] });
                const resp = await api.shareCreate(payload, 'collection', stateLabels[currentState]);
                
                if (!resp || !resp.url) {
                  throw new Error("Resposta inválida do servidor");
                }
                
                setShareUrl(resp.url);
                setShowShare(true);
                try {
                  await navigator.clipboard.writeText(resp.url);
                  pushToast({ message: "Link copiado para a área de transferência!", tone: "ok" });
                } catch {}
              } catch (e: any) {
                console.error("[shareCollection] Erro ao compartilhar:", e);
                const errorMsg = e?.message?.includes("listId_obrigatorio") 
                  ? "Erro ao gerar link. Tente novamente." 
                  : (e?.message || "Erro ao compartilhar coleção");
                pushToast({ message: errorMsg, tone: "err" });
              }
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 dark:bg-slate-600 hover:bg-slate-600 dark:hover:bg-slate-500 text-white text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg border border-slate-600 dark:border-slate-500"
        >
            <Share2 size={16} />
            Compartilhar
          </button>
              </div>
            </div>
          </div>
      
      {/* Abas - Ocultar quando visualizando coleção compartilhada */}
      {!viewingShared && (
        <div className="flex flex-wrap gap-3 mb-8 border-b-2 border-slate-200 dark:border-slate-800 pb-1">
          {(["want", "watched", "not_watched", "abandoned"] as const).map((state) => {
          const stateLabels = { want: "Quero ver", watched: "Assisti", not_watched: "Não assisti", abandoned: "Abandonei" };
          const items = Object.entries(userStates)
            .filter(([_, meta]) => meta.state === state)
            .map(([key]) => {
              const [media, idStr] = key.split(":");
              const id = Number(idStr);
              // Buscar em todas as fontes disponíveis
              const allMovies = [
                ...favorites,
                ...watchHistory.map(h => h.movie),
                ...(cats.trending?.items || []),
                ...(cats.popular?.items || []),
                ...(cats.top_rated?.items || []),
                ...(cats.now_playing?.items || []),
                ...(cats.upcoming?.items || []),
              ];
              
              let found = allMovies.find(
                m => m.id === id && (m.media || "movie") === (media || "movie")
              );
              
              // Se não encontrou, buscar nas listas do usuário
              if (!found) {
                for (const list of lists) {
                  found = list.items.find(
                    m => m.id === id && (m.media || "movie") === (media || "movie")
                  );
                  if (found) break;
                }
              }
              
              return found ? { ...found, media: (media || "movie") as MediaT } : null;
            })
            .filter((m) => m !== null);
          
          const isActive = activeTab === `watchlist-${state}` || (activeTab === "watchlist" && state === "want");
          
          return (
            <button
              key={state}
              onClick={() => setActiveTab(`watchlist-${state}` as TabKey)}
              className={`relative px-6 py-3 rounded-t-xl font-semibold text-sm transition-all duration-200 ${
                isActive
                  ? "bg-slate-700 dark:bg-slate-600 text-white shadow-lg"
                  : "bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
              }`}
            >
              <span className="flex items-center gap-2">
                {stateLabels[state]}
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  isActive 
                    ? "bg-white/20 text-white" 
                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                }`}>
                  {items.length}
                </span>
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 dark:bg-cyan-400 rounded-t-full" />
              )}
            </button>
          );
        })}
        </div>
      )}

      {/* Conteúdo das abas */}
      {(() => {
        const currentState = activeTab === "watchlist" ? "want" : (activeTab.startsWith("watchlist-") ? activeTab.replace("watchlist-", "") : "want") as UserState;
        const stateLabels = { want: "Quero ver", watched: "Assisti", not_watched: "Não assisti", abandoned: "Abandonei" };
        const items = Object.entries(userStates)
          .filter(([_, meta]) => meta.state === currentState)
          .map(([key, meta]) => {
            const [media, idStr] = key.split(":");
            const id = Number(idStr);
            const mediaType = (media || "movie") as MediaT;
            
            // Buscar em todas as fontes disponíveis
            const allMovies = [
              ...favorites,
              ...watchHistory.map(h => h.movie),
              ...(cats.trending?.items || []),
              ...(cats.popular?.items || []),
              ...(cats.top_rated?.items || []),
              ...(cats.now_playing?.items || []),
              ...(cats.upcoming?.items || []),
            ];
            
            let found = allMovies.find(
              m => m.id === id && (m.media || "movie") === mediaType
            );
            
            // Se não encontrou, buscar nas listas do usuário
            if (!found) {
              for (const list of lists) {
                found = list.items.find(
                  m => m.id === id && (m.media || "movie") === mediaType
                );
                if (found) break;
              }
            }
            
            // Se ainda não encontrou, usar o cache salvo ou criar um objeto básico
            if (!found) {
              const cached = meta.movieCache;
              if (cached) {
                found = {
                  id,
                  media: cached.media || mediaType,
                  title: cached.title || `Item ${id}`,
                  image: cached.image || "",
                  poster_path: cached.poster_path || null,
                  year: cached.year || null,
                  rating: null,
                  voteCount: null,
                  overview: ""
                };
              } else {
                found = {
                  id,
                  media: mediaType,
                  title: `Item ${id}`,
                  image: "",
                  poster_path: null,
                  year: null,
                  rating: null,
                  voteCount: null,
                  overview: ""
                };
              }
            }
            
            return { movie: { ...found, media: mediaType }, meta };
          })
          .filter((item) => item !== null)
          .sort((a, b) => (b.meta.rating || 0) - (a.meta.rating || 0)); // Ordenar por nota (maior primeiro)

        if (items.length === 0) {
          return (
            <div className="text-center py-16 md:py-20 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 mb-6">
                <Bookmark size={40} className="text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Nenhum item em "{stateLabels[currentState]}"</h3>
              <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">{t("add_movies_hint")}</p>
            </div>
          );
        }

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map(({ movie, meta }, idx) => (
              <div key={`${movie.media}-${movie.id}`} className="group animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  {/* Poster */}
                  <div className="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900">
                    <img
                      src={poster(movie.poster_path || movie.image, "w500")}
                      alt={movie.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Badge de nota */}
                    {meta.rating !== undefined && (
                      <div className="absolute top-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-lg">
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-slate-900 dark:text-white font-bold text-sm">{meta.rating}/10</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Conteúdo */}
                  <div className="p-5">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {movie.title}
                    </h3>
                    
                    <div className="flex items-center gap-3 mb-4">
                      {movie.year && (
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                          {movie.year}
                        </span>
                      )}
                    </div>
                    
                    {/* Campo de nota */}
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Minha nota
                      </label>
                      <div className="flex items-center gap-2">
                        <Star size={16} className="text-yellow-500" />
                        <input
                          type="number"
                          min={0}
                          max={10}
                          step={0.5}
                          value={meta.rating ?? ""}
                          onChange={(e) => setRatingFor(movie, e.target.value === "" ? undefined : Number(e.target.value))}
                          placeholder="0-10"
                          className="flex-1 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    
                    {/* Campo de descrição */}
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Minha descrição
                      </label>
                      <textarea
                        value={meta.description || ""}
                        onChange={(e) => setDescriptionFor(movie, e.target.value)}
                        placeholder="Adicione suas observações sobre este título..."
                        className="w-full text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                        rows={3}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    
                    {/* Botões de ação */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const mediaType = (movie.media || "movie") as "movie" | "tv";
                          navigate(`/${mediaType}/${movie.id}`);
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-slate-700 dark:bg-slate-600 hover:bg-slate-600 dark:hover:bg-slate-500 text-white font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        Ver detalhes
                      </button>
                      {!viewingShared && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmModal({
                              show: true,
                              message: `Tem certeza que deseja remover "${movie.title}" desta coleção?`,
                              onConfirm: () => {
                                const k = mediaKey(movie);
                                const prevState = userStates[k]?.state;
                                
                                if (prevState === "watched") {
                                  removeFromWatchHistory(movie);
                                }
                                
                                setUserStates((prev) => {
                                  const updated = { ...prev };
                                  delete updated[k];
                                  return updated;
                                });
                                
                                pushToast({ message: `"${movie.title}" removido da coleção`, tone: "ok" });
                                setConfirmModal({ show: false, message: "", onConfirm: () => {} });
                              }
                            });
                          }}
                          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all duration-200 shadow-md hover:shadow-lg"
                          title="Remover da coleção"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })()}
        </>
      )}
    </section>
  );

  const FavoritesContent = (
    <section>
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">{viewingShared ? t("shared_list") : t("my_favorites")}</h2>
        </div>

        {favorites.length > 0 && !viewingShared && (
          <button
            onClick={async () => {
              try {
                if (favorites.length === 0) {
                  pushToast({ message: "Não há favoritos para compartilhar", tone: "err" });
                  return;
                }
                const payload = favorites.map((m) => ({
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
                
                console.log("[shareFavorites] Criando compartilhamento:", { itemsCount: payload.length, type: 'favorites' });
                const resp = await api.shareCreate(payload, 'favorites');
                
                if (!resp || !resp.url) {
                  throw new Error("Resposta inválida do servidor");
                }
                
                setShareUrl(resp.url); 
                setShowShare(true);
                try { 
                  await navigator.clipboard.writeText(resp.url); 
                  pushToast({ message: "Link copiado para a área de transferência!", tone: "ok" }); 
                } catch {}
              } catch (e: any) { 
                console.error("[shareFavorites] Erro ao compartilhar:", e);
                const errorMsg = e?.message?.includes("listId_obrigatorio") 
                  ? "Erro ao gerar link. Tente novamente." 
                  : (e?.message || t("share_fail") || "Erro ao compartilhar favoritos");
                pushToast({ message: errorMsg, tone: "err" }); 
              }
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-800/80 backdrop-blur-sm hover:bg-slate-700 border border-slate-600/50 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 sm:hover:scale-105 text-white whitespace-nowrap"
            title="Compartilhar meus favoritos">
            <Clipboard size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Compartilhar meus favoritos</span>
            <span className="xs:hidden">Compartilhar</span>
          </button>
        )}
      </div>

      {favorites.length > 0 ? (
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2 sm:gap-3">
          {favorites.map((m, idx) => (
            <div key={`${m.media}-${m.id}`} className="animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
              <MovieCard movie={m} />
            </div>
          ))}
        </div>
        ) : (
          <div className="text-center py-12 md:py-16 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-md rounded-3xl border border-slate-700/50 shadow-2xl">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-red-500/20 via-pink-500/20 to-rose-500/20 mb-6 ring-4 ring-red-500/10">
              <Heart size={48} className="text-red-500" />
            </div>
            <p className="text-white text-xl font-bold mb-2">{t("none_in_list")}</p>
            <p className="text-gray-400">{t("add_favs_hint")}</p>
          </div>
        )}
    </section>
  );

  const listCover = (l: UserList) => l.items.find((m) => m.poster_path) || l.items[0];

  const ListsContent = (
    <section>
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {viewingShared && sharedList ? sharedList.listName : t("lists")}
          </h2>
        </div>
        {!viewingShared && (
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              const defaultName = `Minha lista ${lists.length + 1}`;
              const id = createList(defaultName); setActiveListId(id);
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-700 dark:bg-slate-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-600 dark:hover:bg-slate-500 shadow-md hover:shadow-lg border border-slate-600 dark:border-slate-500 hover:border-slate-500 dark:hover:border-slate-400 transition-all duration-200 active:scale-95 sm:hover:scale-105">
            <Plus size={16} className="sm:w-4.5 sm:h-4.5" />{t("new_list")}
          </button>
        </div>
        )}
      </div>

      {viewingShared && sharedList ? (
        // Mostrar lista compartilhada
        <ListDetail lst={{ id: 'shared', name: sharedList.listName, items: sharedList.items }} />
      ) : activeListId ? (() => {
        const lst = lists.find((l) => l.id === activeListId);
        if (!lst) return <div className="text-slate-600 dark:text-gray-400">{t("list_not_found")}</div>;
        return <ListDetail lst={lst} />;
      })() : (
        lists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {lists.map((l) => {
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
                  
                  if (!resp || !resp.url) {
                    throw new Error("Resposta inválida do servidor");
                  }
                  
                  setShareUrl(resp.url); 
                  setShowShare(true);
                  try { 
                    await navigator.clipboard.writeText(resp.url); 
                    pushToast({ message: "Link copiado para a área de transferência!", tone: "ok" }); 
                  } catch {}
                } catch (e: any) { 
                  console.error("[shareList] Erro ao compartilhar:", e);
                  const errorMsg = e?.message?.includes("listId_obrigatorio") 
                    ? "Erro ao gerar link. Tente novamente." 
                    : (e?.message || t("share_fail") || "Erro ao compartilhar lista");
                  pushToast({ message: errorMsg, tone: "err" }); 
                }
              };
              const cover = listCover(l);

              return (
                <div key={l.id} className="group relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  {/* Imagem de capa */}
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900">
                  {cover ? (
                      <>
                        <img 
                          src={cover.image} 
                          alt={cover.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ListIcon size={56} className="text-slate-400 dark:text-slate-600" />
                    </div>
                  )}
                    
                    {/* Overlay com informações no hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/60">
                      <button 
                        onClick={() => setActiveListId(l.id)}
                        className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white font-semibold hover:bg-white/20 transition-all duration-200"
                      >
                        Ver lista
                      </button>
                        </div>
                  </div>

                  {/* Conteúdo do card */}
                  <div className="p-5">
                    <button 
                      onClick={() => setActiveListId(l.id)} 
                      className="w-full text-left group/btn"
                      title="Abrir lista"
                    >
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5 line-clamp-2 group-hover/btn:text-cyan-600 dark:group-hover/btn:text-cyan-400 transition-colors">
                        {l.name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <ListIcon size={14} className="text-slate-400 dark:text-slate-500" />
                        <span>{l.items.length} {l.items.length === 1 ? 'item' : 'itens'}</span>
                      </p>
                      </button>

                    {/* Botões de ação */}
                      {!viewingShared && (
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                        <button 
                          onClick={shareList} 
                          disabled={l.items.length === 0}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-all duration-200"
                          title={t("share")}
                        >
                            <Share2 size={14} />
                            <span>Compartilhar</span>
                          </button>
                        <button 
                          onClick={() => { setRenameInput(l.name); setRenameModal({ show: true, listId: l.id, currentName: l.name }); }}
                          className="inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all duration-200"
                          title="Renomear"
                        >
                            <Pencil size={14} />
                          </button>
                        <button 
                          onClick={() => setConfirmModal({ show: true, message: `Excluir a lista "${l.name}"?`, onConfirm: () => { deleteList(l.id); setConfirmModal({ show: false, message: "", onConfirm: () => {} }); } })}
                          className="inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition-all duration-200"
                          title="Excluir"
                        >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
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

  // Calcular texto do badge da API (após todos os hooks)
  const apiBadgeText = apiStatus === "ok" ? (tmdb.apiBase ? t("api_badge_ok_backend") : t("api_badge_ok_tmdb")) : apiStatus;

  // ---------- Landing (pré-login) ----------
  // Verificar se há um compartilhamento na URL antes de decidir mostrar LandingScreen
  const urlParams = new URLSearchParams(window.location.search);
  const hasShareSlug = urlParams.get("share");
  
  if (!isLoggedIn && !viewingShared && !hasShareSlug) {
    return (
      <>
        <LandingScreen
          onSignIn={() => { setLoginType("signin"); setShowLogin(true); }}
          onSignUp={() => { setLoginType("signup"); setShowLogin(true); }}
          t={t} lang={lang} onChangeLang={(l) => setLang(l)}
        />
        {showLogin && <LoginModal
          formData={formData}
          loginType={loginType}
          showPassword={showPassword}
          emailError={emailError}
          passwordError={passwordError}
          loginError={loginError}
          passwordErrors={passwordErrors}
          authLoading={authLoading}
          showForgotPassword={showForgotPassword}
          forgotPasswordEmail={forgotPasswordEmail}
          forgotPasswordLoading={forgotPasswordLoading}
          forgotPasswordMessage={forgotPasswordMessage}
          forgotPasswordError={forgotPasswordError}
          t={t}
          handleInputChange={handleInputChange}
          handleInputBlur={handleInputBlur}
          handleSubmit={handleSubmit}
          setShowLogin={setShowLogin}
          setLoginError={setLoginError}
          setEmailError={setEmailError}
          setPasswordError={setPasswordError}
          setShowPassword={setShowPassword}
          setFormData={setFormData}
          setShowForgotPassword={setShowForgotPassword}
          setForgotPasswordEmail={setForgotPasswordEmail}
          setForgotPasswordError={setForgotPasswordError}
          setForgotPasswordMessage={setForgotPasswordMessage}
          setForgotPasswordStep={setForgotPasswordStep}
          setForgotPasswordNewPassword={setForgotPasswordNewPassword}
          setForgotPasswordConfirmPassword={setForgotPasswordConfirmPassword}
          setForgotPasswordShowPassword={setForgotPasswordShowPassword}
          forgotPasswordStep={forgotPasswordStep}
          forgotPasswordNewPassword={forgotPasswordNewPassword}
          forgotPasswordConfirmPassword={forgotPasswordConfirmPassword}
          forgotPasswordShowPassword={forgotPasswordShowPassword}
          emailVerified={emailVerified}
          handleForgotPasswordCheckEmail={handleForgotPasswordCheckEmail}
          handleForgotPasswordReset={handleForgotPasswordReset}
        />}
        <ToastHost toasts={toasts} onClose={removeToast} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-white">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-white/95 dark:bg-slate-950/95 border-b border-slate-200 dark:border-white/10 shadow-lg safe-area-inset-top" style={{ paddingTop: 'max(env(safe-area-inset-top), 0px)' }}>
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 md:gap-8 min-w-0 flex-1">
              {isLoggedIn && (
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                  aria-label="Menu"
                >
                  <Menu size={24} className="text-slate-900 dark:text-white" />
                </button>
              )}
              <div className="flex items-center gap-2 sm:gap-3 cursor-pointer flex-shrink-0" onClick={() => { setActiveTab("home"); setActiveCategory("home"); setShowMobileMenu(false); }}>
                <svg width="32" height="32" className="sm:w-10 sm:h-10" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 8 L8 32 L20 20 Z" fill="#00BCD4" />
                  <path d="M12 12 L12 28 L24 20 Z" fill="#7B3FF2" />
                  <path d="M16 8 L32 20 L16 32 Z" fill="#C6D800" />
                </svg>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 bg-clip-text text-transparent whitespace-nowrap">VETRA</h1>
                <span
                  className={`hidden sm:inline-block ml-2 md:ml-4 text-xs px-2 py-1 rounded border flex-shrink-0 ${
                    apiStatus === "ok"
                      ? "bg-emerald-600/10 text-emerald-700 border-emerald-500/30 dark:bg-emerald-600/20 dark:text-emerald-200 dark:border-emerald-500/40"
                      : apiStatus === "falhou"
                      ? "bg-rose-600/10 text-rose-700 border-rose-500/30 dark:bg-rose-600/20 dark:text-rose-200 dark:border-rose-500/40"
                      : "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700/40 dark:text-slate-300 dark:border-slate-500/40"
                  }`}
                  title={`TMDB: ${tmdb.hasBearer ? "v4" : tmdb.hasV3 ? "v3" : "—"} · Lang: ${tmdb.lang} · ${tmdb.apiBase ? "com backend" : "TMDB direto"}`}>
                  {t("api_title")}: {apiBadgeText}
                </span>
              </div>

              <nav className="hidden md:flex gap-2">
                <button onClick={() => { setActiveTab("home"); setActiveCategory("home"); }}
                  className={`relative px-4 py-2 rounded-lg transition-all duration-200 ${
                    activeTab==="home" && activeCategory==="home"
                      ? "text-slate-900 dark:text-white font-semibold bg-slate-200 dark:bg-slate-800/50" 
                      : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/30"
                  }`}>
                  {t("home")}
                  {activeTab==="home" && activeCategory==="home" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 rounded-full" />
                  )}
                </button>
                <button onClick={() => { setActiveTab("home"); setActiveCategory("movies"); }}
                  className={`relative px-4 py-2 rounded-lg transition-all duration-200 ${
                    activeTab==="home" && activeCategory==="movies"
                      ? "text-slate-900 dark:text-white font-semibold bg-slate-200 dark:bg-slate-800/50" 
                      : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/30"
                  }`}>
                  {t("movies")}
                  {activeTab==="home" && activeCategory==="movies" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 rounded-full" />
                  )}
                </button>
                <button onClick={() => { setActiveTab("home"); setActiveCategory("tv"); }}
                  className={`relative px-4 py-2 rounded-lg transition-all duration-200 ${
                    activeTab==="home" && activeCategory==="tv"
                      ? "text-slate-900 dark:text-white font-semibold bg-slate-200 dark:bg-slate-800/50" 
                      : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/30"
                  }`}>
                  {t("tv_series")}
                  {activeTab==="home" && activeCategory==="tv" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 rounded-full" />
                  )}
                </button>
                <button onClick={() => setActiveTab("favorites")}
                  className={`relative px-4 py-2 rounded-lg transition-all duration-200 ${
                    activeTab==="favorites" 
                      ? "text-slate-900 dark:text-white font-semibold bg-slate-200 dark:bg-slate-800/50" 
                      : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/30"
                  }`}>
                  {viewingShared ? t("shared_list") : t("favorites")}
                  {activeTab==="favorites" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 rounded-full" />
                  )}
                </button>
                <button onClick={() => setActiveTab("lists")}
                  className={`relative px-4 py-2 rounded-lg transition-all duration-200 ${
                    activeTab==="lists" 
                      ? "text-slate-900 dark:text-white font-semibold bg-slate-200 dark:bg-slate-800/50" 
                      : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/30"
                  }`}>
                  {t("lists")}
                  {activeTab==="lists" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 rounded-full" />
                  )}
                </button>
                <button onClick={() => setActiveTab("watchlist")}
                  className={`relative px-4 py-2 rounded-lg transition-all duration-200 ${
                    activeTab==="watchlist" || activeTab.startsWith("watchlist-")
                      ? "text-slate-900 dark:text-white font-semibold bg-slate-200 dark:bg-slate-800/50" 
                      : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/30"
                  }`}>
                  Coleções
                  {(activeTab==="watchlist" || activeTab.startsWith("watchlist-")) && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 rounded-full" />
                  )}
                </button>
                <button onClick={() => setActiveTab("people")}
                  className={`relative px-4 py-2 rounded-lg transition-all duration-200 ${
                    activeTab==="people" 
                      ? "text-slate-900 dark:text-white font-semibold bg-slate-200 dark:bg-slate-800/50" 
                      : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/30"
                  }`}>
                  {t("people")}
                  {activeTab==="people" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 rounded-full" />
                  )}
                </button>
              </nav>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
              <LanguageMenu lang={lang as Lang} onChange={(l) => setLang(l)} />
              {isLoggedIn && <ThemeButton enabled={darkEnabled} onToggle={toggleDark} />}
              {isLoggedIn && !viewingShared && (
                <div className="relative" ref={setProfileMenuRef}>
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-300 dark:border-slate-700"
                  >
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name || "Usuário"}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-cyan-400 via-purple-500 to-lime-400 flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    )}
                    <ChevronDown size={14} className={`hidden sm:block transition-transform ${showProfileMenu ? "rotate-180" : ""}`} />
                  </button>
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-300 dark:border-slate-700 py-2 z-50">
                      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          {user?.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.name || "Usuário"}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 via-purple-500 to-lime-400 flex items-center justify-center text-white font-semibold">
                              {user?.name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-slate-900 dark:text-white font-semibold truncate">{user?.name || "Usuário"}</div>
                            <div className="text-slate-600 dark:text-gray-400 text-sm truncate">{user?.email || ""}</div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowProfileModal(true);
                          setShowProfileMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                      >
                        <Settings size={16} />
                        Editar Perfil
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab("history");
                          setShowProfileMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                      >
                        <Clock size={16} />
                        <span>Histórico</span>
                        {watchHistory.length > 0 && (
                          <span className="ml-auto text-xs bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded-full">
                            {watchHistory.length}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab("stats");
                          setShowProfileMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                      >
                        <BarChart3 size={16} />
                        <span>Estatísticas</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsLoggedIn(false);
                          setViewingShared(false);
                          setSharedList(null);
                          setSharedCollection(null);
                          setUser(null);
                          setShowProfileMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                      >
                        <LogOut size={16} />
                        {t("signout")}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {isLoggedIn && showMobileMenu && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)}>
            <div className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Menu</h2>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Fechar menu"
                >
                  <X size={20} className="text-slate-900 dark:text-white" />
                </button>
              </div>
              <nav className="p-2">
                <button
                  onClick={() => { setActiveTab("home"); setActiveCategory("home"); setShowMobileMenu(false); }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                    activeTab === "home" && activeCategory === "home"
                      ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Home size={20} />
                  <span>{t("home")}</span>
                </button>
                <button
                  onClick={() => { setActiveTab("home"); setActiveCategory("movies"); setShowMobileMenu(false); }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                    activeTab === "home" && activeCategory === "movies"
                      ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Film size={20} />
                  <span>{t("movies")}</span>
                </button>
                <button
                  onClick={() => { setActiveTab("home"); setActiveCategory("tv"); setShowMobileMenu(false); }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                    activeTab === "home" && activeCategory === "tv"
                      ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Tv size={20} />
                  <span>{t("tv_series")}</span>
                </button>
                <button
                  onClick={() => { setActiveTab("favorites"); setShowMobileMenu(false); }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                    activeTab === "favorites"
                      ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Heart size={20} />
                  <span>{viewingShared ? t("shared_list") : t("favorites")}</span>
                </button>
                <button
                  onClick={() => { setActiveListId(null); setActiveTab("lists"); setShowMobileMenu(false); }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                    activeTab === "lists"
                      ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <ListIcon size={20} />
                  <span>{t("lists")}</span>
                </button>
                <button
                  onClick={() => { setActiveTab("watchlist"); setShowMobileMenu(false); }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                    activeTab === "watchlist" || activeTab.startsWith("watchlist-")
                      ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Bookmark size={20} />
                  <span>Coleções</span>
                </button>
                <button
                  onClick={() => { setActiveTab("people"); setShowMobileMenu(false); }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                    activeTab === "people"
                      ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Users size={20} />
                  <span>{t("people")}</span>
                </button>
                <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>
                <button
                  onClick={() => { setActiveTab("history"); setShowMobileMenu(false); }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                    activeTab === "history"
                      ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Clock size={20} />
                  <span>Histórico</span>
                  {watchHistory.length > 0 && (
                    <span className="ml-auto text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full">
                      {watchHistory.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => { setActiveTab("stats"); setShowMobileMenu(false); }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                    activeTab === "stats"
                      ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <BarChart3 size={20} />
                  <span>Estatísticas</span>
                </button>
                <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>
                <button
                  onClick={() => {
                    setShowProfileModal(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Settings size={20} />
                  <span>Editar Perfil</span>
                </button>
                <button
                  onClick={() => {
                    setIsLoggedIn(false);
                    setViewingShared(false);
                    setSharedList(null);
                    setSharedCollection(null);
                    setUser(null);
                    setShowMobileMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <LogOut size={20} />
                  <span>{t("signout")}</span>
                </button>
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* MAIN */}
      {/* Padding-top para header fixo, padding-bottom para navegação mobile */}
      <main className={`pt-16 sm:pt-20 md:pt-24 ${isLoggedIn ? "pb-16 sm:pb-20 md:pb-24" : "pb-12"}`}>
        {/* Conteúdo compartilhado é sempre exibido, mesmo sem login */}
        {!isLoggedIn && !viewingShared && !hasShareSlug ? (
          <div className="container mx-auto px-3 sm:px-4 md:px-6 text-center py-12 md:py-16 pt-20 sm:pt-24 px-4">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-4">Faça login para continuar</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm sm:text-base">Você precisa estar logado para acessar o conteúdo.</p>
            <button
              onClick={() => { setShowLogin(true); setLoginType("signin"); setLoginError(""); setEmailError(""); setPasswordError(""); }}
              className="min-h-[44px] px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 via-purple-600 to-lime-500 hover:opacity-90 active:opacity-80 transition-all touch-manipulation"
            >
              Fazer Login
            </button>
          </div>
        ) : (
          <>
              {activeTab === "home" && activeCategory === "home" && HomeContent}
              {activeTab === "home" && activeCategory !== "home" && (
                <div className="container mx-auto px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 md:pt-8">
                {activeTab === "home" && activeCategory === "movies" && (
                  <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                    {/* Filtros Laterais */}
                    <DiscoverFiltersPanel
                      media="movie"
                      filters={moviesFilters}
                      onFiltersChange={setMoviesFilters}
                      onReset={() => setMoviesFilters({ sortBy: "popularity.desc", region: "BR" })}
                    />
                    
                    {/* Grid de Resultados */}
                    <div className="flex-1 min-w-0">
                      <div className="mb-4 sm:mb-6">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">{t("movies")}</h2>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                          {discoverMovies.loading ? t("loading") : discoverMovies.items.length > 0 ? t("movies_found", { count: discoverMovies.items.length }) : t("no_movies_found")}
                        </p>
                      </div>

                      {discoverMovies.loading && discoverMovies.items.length === 0 ? (
                        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                          {[...Array(12)].map((_, i) => (
                            <div key={i} className="aspect-[2/3] bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
                          ))}
                        </div>
                      ) : discoverMovies.items.length > 0 ? (
                        <>
                          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                            {discoverMovies.items.map((movie) => (
                              <MovieCard key={mediaKey(movie)} movie={movie} />
                            ))}
                          </div>
                          {discoverMovies.totalPages > 1 && discoverMovies.page < discoverMovies.totalPages && (
                            <div className="mt-4 sm:mt-6 text-center">
                              <button
                                onClick={() => {
                                  const nextPage = discoverMovies.page + 1;
                                  api.discover("movie", moviesFilters, nextPage)
                                    .then((data) => {
                                      const results = (data?.results || []) as ApiMovie[];
                                      const filtered = results.filter((x: any) => {
                                        const hasImage = (x.poster_path && x.poster_path.trim() !== "") || 
                                                        (x.backdrop_path && x.backdrop_path.trim() !== "");
                                        const hasTitle = (x.title && x.title.trim() !== "") || 
                                                        (x.name && x.name.trim() !== "");
                                        const hasInfo = (x.overview && x.overview.trim() !== "") || 
                                                       x.release_date || 
                                                       x.first_air_date ||
                                                       x.vote_average !== null;
                                        return hasImage && hasTitle && hasInfo;
                                      });
                                      const mapped = mapRows(filtered);
                                      setDiscoverMovies({
                                        items: [...discoverMovies.items, ...mapped],
                                        loading: false,
                                        page: nextPage,
                                        totalPages: (data as any)?.total_pages ?? 1,
                                      });
                                    })
                                    .catch((e: any) => {
                                      console.error("Erro ao carregar mais filmes:", e);
                                      pushToast({ message: t("error_load_more_movies"), tone: "err" });
                                    });
                                }}
                                disabled={discoverMovies.loading}
                                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm sm:text-base font-semibold rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-all disabled:opacity-50 active:scale-95 sm:hover:scale-105"
                              >
                                {discoverMovies.loading ? "Carregando..." : "Carregar Mais"}
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            Nenhum filme encontrado
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {t("try_adjust_filters")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {activeTab === "home" && activeCategory === "tv" && (
                  <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                    {/* Filtros Laterais */}
                    <DiscoverFiltersPanel
                      media="tv"
                      filters={tvFilters}
                      onFiltersChange={setTvFilters}
                      onReset={() => setTvFilters({ sortBy: "popularity.desc", region: "BR" })}
                    />
                    
                    {/* Grid de Resultados */}
                    <div className="flex-1 min-w-0">
                      <div className="mb-4 sm:mb-6">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">{t("tv_series")}</h2>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                          {discoverTv.loading ? t("loading") : discoverTv.items.length > 0 ? t("series_found", { count: discoverTv.items.length }) : t("no_series_found")}
                        </p>
                      </div>

                      {discoverTv.loading && discoverTv.items.length === 0 ? (
                        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                          {[...Array(12)].map((_, i) => (
                            <div key={i} className="aspect-[2/3] bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
                          ))}
                        </div>
                      ) : discoverTv.items.length > 0 ? (
                        <>
                          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                            {discoverTv.items.map((series) => (
                              <MovieCard key={mediaKey(series)} movie={series} />
                            ))}
                          </div>
                          {discoverTv.totalPages > 1 && discoverTv.page < discoverTv.totalPages && (
                            <div className="mt-4 sm:mt-6 text-center">
                              <button
                                onClick={() => {
                                  const nextPage = discoverTv.page + 1;
                                  api.discover("tv", tvFilters, nextPage)
                                    .then((data) => {
                                      const results = (data?.results || []) as ApiMovie[];
                                      const filtered = results.filter((x: any) => {
                                        const hasImage = (x.poster_path && x.poster_path.trim() !== "") || 
                                                        (x.backdrop_path && x.backdrop_path.trim() !== "");
                                        const hasTitle = (x.title && x.title.trim() !== "") || 
                                                        (x.name && x.name.trim() !== "");
                                        const hasInfo = (x.overview && x.overview.trim() !== "") || 
                                                       x.release_date || 
                                                       x.first_air_date ||
                                                       x.vote_average !== null;
                                        return hasImage && hasTitle && hasInfo;
                                      });
                                      const mapped = mapRows(filtered);
                                      setDiscoverTv({
                                        items: [...discoverTv.items, ...mapped],
                                        loading: false,
                                        page: nextPage,
                                        totalPages: (data as any)?.total_pages ?? 1,
                                      });
                                    })
                                    .catch((e: any) => {
                                      console.error("Erro ao carregar mais séries:", e);
                                      pushToast({ message: t("error_load_more_series"), tone: "err" });
                                    });
                                }}
                                disabled={discoverTv.loading}
                                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm sm:text-base font-semibold rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-all disabled:opacity-50 active:scale-95 sm:hover:scale-105"
                              >
                                {discoverTv.loading ? "Carregando..." : "Carregar Mais"}
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            Nenhuma série encontrada
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {t("try_adjust_filters")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                </div>
              )}
            {activeTab === "favorites" && <div className="container mx-auto px-3 sm:px-4 md:px-6">{FavoritesContent}</div>}
            {activeTab === "lists" && <div className="container mx-auto px-3 sm:px-4 md:px-6">{ListsContent}</div>}
            {activeTab === "people" && <div className="container mx-auto px-3 sm:px-4 md:px-6">{PeopleContent}</div>}
            {activeTab === "history" && <div className="container mx-auto px-3 sm:px-4 md:px-6">{HistoryContent}</div>}
            {activeTab === "watchlist" && <div className="container mx-auto px-3 sm:px-4 md:px-6">{WatchlistContent}</div>}
            {(activeTab.startsWith("watchlist-")) && <div className="container mx-auto px-3 sm:px-4 md:px-6">{WatchlistContent}</div>}
            {activeTab === "stats" && <div className="container mx-auto px-3 sm:px-4 md:px-6">{StatsContent}</div>}
          </>
        )}
      </main>

      {/* Rodapés */}
      {isLoggedIn && <SiteFooter />}
      {isLoggedIn && <MobileFooter />}

      {/* Modal de Edição de Perfil */}
      {isLoggedIn && <ProfileEditModal />}

      {/* Banner discreto para login quando visualizando compartilhado sem login */}
      {/* Mobile: posiciona acima da navegação, Desktop: canto inferior direito */}
      {viewingShared && !isLoggedIn && (
        <div className="fixed bottom-20 md:bottom-6 right-3 md:right-6 left-3 md:left-auto z-40 max-w-sm md:max-w-sm mx-auto md:mx-0 animate-fade-in-up">
          <div className="bg-gradient-to-r from-cyan-500/90 via-purple-600/90 to-lime-500/90 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/20">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h4 className="text-white font-bold text-sm mb-1">{t("login_to_create_lists")}</h4>
                <p className="text-white/80 text-xs mb-3">{t("create_share_lists")}</p>
                <button
                  onClick={() => { setShowLogin(true); setLoginType("signin"); setLoginError(""); setEmailError(""); setPasswordError(""); }}
                  className="min-h-[44px] px-4 py-2.5 bg-white text-slate-900 font-semibold rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-all text-sm shadow-lg touch-manipulation"
                >
                  Fazer login
                </button>
              </div>
              <button
                onClick={() => {
                  setViewingShared(false);
                  setSharedList(null);
                  setSharedCollection(null);
                  // Limpar query string da URL
                  const url = new URL(window.location.href);
                  url.searchParams.delete('share');
                  window.history.replaceState({}, '', url.toString());
                }}
                className="text-white/80 hover:text-white transition-colors flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rotas para modais - renderiza sempre que a rota corresponder */}
      <Routes>
        <Route path="/" element={null} />
        <Route path="/movie/:id" element={<MovieRouteModal />} />
        <Route path="/tv/:id" element={<MovieRouteModal />} />
        <Route path="/person/:id" element={<PersonRouteModal />} />
        <Route path="*" element={null} />
      </Routes>

      {/* Modal de Compartilhamento */}
      {showShare && shareUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowShare(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Link de Compartilhamento</h3>
              <button onClick={() => setShowShare(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Compartilhe este link para que outras pessoas possam ver seu conteúdo. O link é público e não requer login para visualização.
            </p>
            <div className="flex gap-2 mb-4">
              <input 
                readOnly 
                value={shareUrl} 
                className="flex-1 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white font-mono break-all" 
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button 
                onClick={async () => { 
                  try { 
                    await navigator.clipboard.writeText(shareUrl); 
                    pushToast({ message: "Link copiado para a área de transferência!", tone: "ok" }); 
                  } catch (e) {
                    pushToast({ message: "Erro ao copiar link", tone: "err" });
                  }
                }}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                <Clipboard size={16} />Copiar
              </button>
            </div>
            <div className="flex gap-2">
              <a 
                href={shareUrl} 
                className="flex-1 px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-900 dark:text-white font-semibold text-center transition-colors text-sm" 
                target="_blank" 
                rel="noreferrer"
              >
                Abrir em nova aba
              </a>
              <button
                onClick={() => setShowShare(false)}
                className="px-4 py-2.5 rounded-lg bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-900 dark:text-white font-semibold transition-colors text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {showListPickerFor && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowListPickerFor(null)} className="absolute top-3 right-3 text-gray-400 hover:text-white">
              <X size={20} />
            </button>
            <h3 className="text-lg font-semibold mb-4">{t("add_to_list")}</h3>

            {lists.length > 0 ? (
              <div className="space-y-2 mb-4">
                {lists.map((l) => (
                  <button key={l.id} className="w-full text-left px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-600"
                    onClick={() => { addToList(l.id, showListPickerFor); setShowListPickerFor(null); }}>
                    {l.name} <span className="text-xs text-gray-400">({l.items.length})</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 mb-3">{t("none_list_created")}</p>
            )}

            <div className="mt-4">
              <label className="block text-sm text-gray-300 mb-1">{t("list_name")}</label>
              <div className="flex gap-2">
                <input id="newlistname" placeholder={t("list_name")}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-white" />
                <button
                  onClick={() => {
                    const el = document.getElementById("newlistname") as HTMLInputElement;
                    const name = (el?.value || "").trim();
                    if (!name) return;
                    const id = createList(name);
                    addToList(id, showListPickerFor!);
                    setShowListPickerFor(null);
                    setActiveTab("lists");
                    setActiveListId(id);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-700 dark:bg-slate-600 text-white text-sm font-semibold hover:bg-slate-600 dark:hover:bg-slate-500 shadow-md hover:shadow-lg border border-slate-600 dark:border-slate-500 hover:border-slate-500 dark:hover:border-slate-400 transition-all duration-200">
                  Criar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCollectionPickerFor && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowCollectionPickerFor(null)} className="absolute top-3 right-3 text-gray-400 hover:text-white">
              <X size={20} />
            </button>
            <h3 className="text-lg font-semibold mb-4 text-white">{t("add_to_collection")}</h3>

            <div className="space-y-2">
              {(["want", "watched", "not_watched", "abandoned"] as const).map((state) => {
                const stateLabels = { want: "Quero assistir", watched: "Assisti", not_watched: "Não assisti", abandoned: "Abandonei" };
                const currentState = getUserMeta(showCollectionPickerFor).state;
                const isActive = currentState === state;
                
                return (
                  <button
                    key={state}
                    onClick={() => {
                      try {
                        if (!showCollectionPickerFor || !showCollectionPickerFor.id) return;
                        if (isActive) {
                          setStateFor(showCollectionPickerFor, undefined);
                          pushToast({ message: `Removido de '${stateLabels[state]}'`, tone: "ok" });
                        } else {
                          setStateFor(showCollectionPickerFor, state);
                          pushToast({ message: `Adicionado a '${stateLabels[state]}'`, tone: "ok" });
                        }
                        setShowCollectionPickerFor(null);
                      } catch (error) {
                        console.error("Erro ao salvar coleção:", error);
                        pushToast({ message: "Erro ao salvar coleção", tone: "err" });
                        setShowCollectionPickerFor(null);
                      }
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-cyan-500/20 dark:bg-cyan-900/30 text-cyan-400 border-2 border-cyan-500/50"
                        : "bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{stateLabels[state]}</span>
                      {isActive && <Bookmark size={16} className="text-cyan-400" fill="currentColor" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Renomear Lista */}
      {renameModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setRenameModal({ show: false, listId: null, currentName: "" }); setRenameInput(""); }} />
          <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-6 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Renomear Lista</h3>
              <button 
                onClick={() => { setRenameModal({ show: false, listId: null, currentName: "" }); setRenameInput(""); }}
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
                  value={renameInput}
                  onChange={(e) => setRenameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && renameInput.trim() && renameModal.listId) {
                      renameList(renameModal.listId, renameInput.trim());
                      setRenameModal({ show: false, listId: null, currentName: "" });
                      setRenameInput("");
                    }
                    if (e.key === "Escape") {
                      setRenameModal({ show: false, listId: null, currentName: "" });
                      setRenameInput("");
                    }
                  }}
                  autoFocus
                  className="w-full bg-slate-800/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  placeholder="Digite o novo nome..."
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setRenameModal({ show: false, listId: null, currentName: "" }); setRenameInput(""); }}
                  className="px-5 py-2.5 rounded-xl font-semibold text-white bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (renameInput.trim() && renameModal.listId) {
                      renameList(renameModal.listId, renameInput.trim());
                      setRenameModal({ show: false, listId: null, currentName: "" });
                      setRenameInput("");
                    }
                  }}
                  disabled={!renameInput.trim()}
                  className="px-5 py-2.5 rounded-xl font-semibold text-white bg-slate-700 dark:bg-slate-600 hover:bg-slate-600 dark:hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg border border-slate-600 dark:border-slate-500 hover:border-slate-500 dark:hover:border-slate-400"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setConfirmModal({ show: false, message: "", onConfirm: () => {} })} />
          <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-6 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 via-rose-500/20 to-pink-500/20 flex items-center justify-center ring-4 ring-red-500/10">
                <Trash2 size={32} className="text-red-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white text-center mb-4">Confirmar ação</h3>
            <p className="text-gray-300 text-center mb-6">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal({ show: false, message: "", onConfirm: () => {} })}
                className="flex-1 px-5 py-2.5 rounded-xl font-semibold text-white bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                }}
                className="flex-1 px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastHost toasts={toasts} onClose={removeToast} />
      {showLogin && <LoginModal
        formData={formData}
        loginType={loginType}
        showPassword={showPassword}
        emailError={emailError}
        passwordError={passwordError}
        loginError={loginError}
        passwordErrors={passwordErrors}
        authLoading={authLoading}
        showForgotPassword={showForgotPassword}
        forgotPasswordEmail={forgotPasswordEmail}
        forgotPasswordLoading={forgotPasswordLoading}
        forgotPasswordMessage={forgotPasswordMessage}
        forgotPasswordError={forgotPasswordError}
        t={t}
        handleInputChange={handleInputChange}
        handleInputBlur={handleInputBlur}
        handleSubmit={handleSubmit}
        setShowLogin={setShowLogin}
        setLoginError={setLoginError}
        setEmailError={setEmailError}
        setPasswordError={setPasswordError}
        setShowPassword={setShowPassword}
        setFormData={setFormData}
        setShowForgotPassword={setShowForgotPassword}
        setForgotPasswordEmail={setForgotPasswordEmail}
        setForgotPasswordError={setForgotPasswordError}
        setForgotPasswordMessage={setForgotPasswordMessage}
        setForgotPasswordStep={setForgotPasswordStep}
        setForgotPasswordNewPassword={setForgotPasswordNewPassword}
        setForgotPasswordConfirmPassword={setForgotPasswordConfirmPassword}
        setForgotPasswordShowPassword={setForgotPasswordShowPassword}
        forgotPasswordStep={forgotPasswordStep}
        forgotPasswordNewPassword={forgotPasswordNewPassword}
        forgotPasswordConfirmPassword={forgotPasswordConfirmPassword}
        forgotPasswordShowPassword={forgotPasswordShowPassword}
        emailVerified={emailVerified}
        handleForgotPasswordCheckEmail={handleForgotPasswordCheckEmail}
        handleForgotPasswordReset={handleForgotPasswordReset}
      />}
    </div>
  );
};

// export padrão
export default function App() {
  return <AppShell />;
}
