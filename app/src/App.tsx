import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Heart, Search, Star, Play, X, Mail, Lock, User, Eye, EyeOff, Clipboard, Plus,
  List as ListIcon, Share2, Pencil, Trash2, Home, ChevronDown, Settings, LogOut,
  BarChart3, Clock, TrendingUp, Film, Users, Calendar, Globe, DollarSign, Building2,
  PenTool, Video, Music, Scissors, Award, Tag, Tv, Link as LinkIcon, ThumbsUp,
  MessageCircle, Smile, Send, Bookmark, ChevronLeft, ChevronRight, Menu, Sparkles as Dice, Check, MoreVertical, FileText, CheckCircle2, Image as ImageIcon
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
  discover,
  changePassword,
  getComments,
  createComment,
  likeComment,
  reactToComment,
  deleteComment,
  type Comment,
  type DiscoverFilters,
  validateAndExtractSlug,
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
import { SearchFiltersPanel, SearchFilters, DEFAULT_FILTERS, getDefaultFilters } from "./components/SearchFiltersPanel";
import { FilterChips } from "./components/FilterChips";
import { ListCover, getListCoverImageUrl, getListFallbackPosters } from "./components/ListCover";
import { useListCover } from "./hooks/useListCover";
import { CoverSelectorModal } from "./components/CoverSelectorModal";
import { Pagination } from "./components/Pagination";
import { CategorySection } from "./components/CategorySection";
import { PrivacyPage } from "./pages/PrivacyPage";
import { TermsPage } from "./pages/TermsPage";
import { AboutPage } from "./pages/AboutPage";
import { HelpPage } from "./pages/HelpPage";
import { LoginModal } from "./components/LoginModal";
import type { LoginModalProps } from "./components/LoginModal";
import { MobileFooter } from "./components/MobileFooter";
import { SiteFooter } from "./components/SiteFooter";
import { PersonRouteModal } from "./components/PersonRouteModal";
import type { MediaT, MovieT, UserState, UserStateMap, CatState, UserList, ApiStatus, TabKey } from "./types/movies";
import { KEY_FAVS, KEY_LISTS, KEY_STATES, KEY_HISTORY, KEY_STATS } from "./constants/storage";
import { mediaKey } from "./types/movies";
import { poster, toPosterPath, CAT_META, type CatKey } from "./lib/media.utils";
import { formatDate, formatDateShort } from "./utils/date";

// Re-export types that might be used elsewhere in App.tsx
export type { MediaT, MovieT, UserState, UserStateMap, CatState, UserList, ApiStatus, TabKey } from "./types/movies";


// ======================= EditProfilePage =======================
interface EditProfilePageProps {
  user: UserProfile | null;
  isLoggedIn: boolean;
  favorites: MovieT[];
  lists: UserList[];
  userStates: UserStateMap;
  pushToast: (toast: { message: string; tone: "ok" | "err" | "info" }) => void;
  saveProfile: (data: { name: string; avatar_url: string | null }) => Promise<void>;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  setEditProfileHasChanges: React.Dispatch<React.SetStateAction<boolean>>;
  editProfileHasChanges: boolean;
  setPendingTabChange: React.Dispatch<React.SetStateAction<TabKey | null>>;
  setPendingCategoryChange: React.Dispatch<React.SetStateAction<"movies" | "tv" | "people" | "home" | null>>;
  setShowExitEditProfileConfirm: React.Dispatch<React.SetStateAction<boolean>>;
}

const EditProfilePage: React.FC<EditProfilePageProps> = ({
  user,
  isLoggedIn,
  favorites,
  lists,
  userStates,
  pushToast,
  saveProfile,
  setIsLoggedIn,
  setUser,
  setEditProfileHasChanges,
  editProfileHasChanges,
  setPendingTabChange,
  setPendingCategoryChange,
  setShowExitEditProfileConfirm,
}) => {
  const navigate = useNavigate();
  
  // Estados locais do formulário - SEMPRE começam vazios
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editAvatar, setEditAvatar] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Refs para controlar inicialização
  const initializedForEmailRef = useRef<string | null>(null);
  const originalValuesRef = useRef<{ firstName: string; lastName: string; avatar: string | null } | null>(null);
  
  // Inicializar valores APENAS UMA VEZ quando o user.email carregar
  useEffect(() => {
    const email = user?.email;
    if (!email || !user) {
      return;
    }
    
    // Se já foi inicializado para este email, NUNCA fazer nada
    if (initializedForEmailRef.current === email) {
      return;
    }
    
    // Primeira vez - inicializar TUDO
    const fullName = user.name || "";
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(' ') || "";
    const avatar = user.avatar_url || null;
    
    // Armazenar valores originais
    originalValuesRef.current = {
      firstName,
      lastName,
      avatar,
    };
    
    // Marcar como inicializado ANTES de setar os estados
    initializedForEmailRef.current = email;
    
    // Preencher os campos apenas uma vez
    setEditFirstName(firstName);
    setEditLastName(lastName);
    setEditAvatar(avatar);
  }, [user?.email]); // APENAS email - nunca incluir outros campos
  
  // Verificar alterações usando estados locais - muito mais simples e confiável
  useEffect(() => {
    if (!originalValuesRef.current) {
      return;
    }
    
    const original = originalValuesRef.current;
    
    // Comparar estados locais com valores originais
    const hasNameChange = Boolean(
      editFirstName.trim() !== original.firstName.trim() || 
      editLastName.trim() !== original.lastName.trim()
    );
    const hasAvatarChange = Boolean(editAvatar !== original.avatar || avatarFile !== null);
    const hasPasswordChange = Boolean(showPasswordSection && (newPassword || confirmPassword));
    
    const hasChanges = hasNameChange || hasAvatarChange || hasPasswordChange;
    setEditProfileHasChanges(hasChanges);
  }, [editFirstName, editLastName, editAvatar, avatarFile, showPasswordSection, newPassword, confirmPassword, setEditProfileHasChanges]);

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
    // Usar estados locais do formulário
    const firstName = editFirstName.trim();
    const lastName = editLastName.trim();
    
    if (!firstName) {
      pushToast({ message: "O nome é obrigatório", tone: "err" });
      return;
    }
    
    const fullName = lastName 
      ? `${firstName} ${lastName}`
      : firstName;
      
    setSaving(true);
    try {
      await saveProfile({ name: fullName, avatar_url: editAvatar });
      pushToast({ message: "Perfil atualizado com sucesso!", tone: "ok" });
      setEditProfileHasChanges(false); // Resetar flag de alterações após salvar
      
      // Atualizar valores originais após salvar
      if (originalValuesRef.current) {
        originalValuesRef.current = {
          firstName,
          lastName,
          avatar: editAvatar,
        };
      }
      
      navigate("/profile"); // Volta para a página de perfil
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
        navigate("/");
      } else {
        const errorMsg = result.error || result.message || "Erro ao alterar senha";
        if (errorMsg.includes("Token") || errorMsg.includes("token") || errorMsg.includes("Reautentique")) {
          pushToast({ message: "Sua sessão expirou. Faça login novamente para alterar a senha.", tone: "err" });
        } else {
          pushToast({ message: errorMsg, tone: "err" });
        }
      }
    } catch (e: any) {
      pushToast({ message: e?.message || e?.error || "Erro ao alterar senha.", tone: "err" });
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

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Acesso restrito</h1>
          <p className="text-slate-600 dark:text-gray-400 mb-6">Você precisa estar logado para editar seu perfil.</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Voltar para o início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-lime-400/20 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-1">Editar Perfil</h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">Gerencie suas informações e preferências</p>
            </div>
            <button
              onClick={() => {
                if (editProfileHasChanges) {
                  setPendingTabChange(null);
                  setPendingCategoryChange(null);
                  setShowExitEditProfileConfirm(true);
                } else {
                  navigate(-1);
                }
              }}
              className="text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex-shrink-0 ml-2"
              aria-label="Fechar"
            >
              <X size={20} className="sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Avatar and Stats */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col items-center bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700">
              <label className="cursor-pointer group">
                {editAvatar ? (
                  <div className="relative">
                    <img
                      src={editAvatar}
                      alt="Avatar"
                      className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full object-cover border-4 border-slate-300 dark:border-slate-600 shadow-xl group-hover:border-cyan-500/50 transition-all duration-300"
                    />
                    <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Pencil size={20} className="sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full bg-gradient-to-br from-cyan-400 via-purple-500 to-lime-400 flex items-center justify-center text-white font-bold text-2xl sm:text-3xl border-4 border-slate-300 dark:border-slate-600 shadow-xl group-hover:border-cyan-500/50 transition-all duration-300">
                    {(editFirstName || user?.name || "U").charAt(0)?.toUpperCase() || "U"}
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
                className="mt-3 sm:mt-4 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-all duration-200"
              >
                {editAvatar ? "Alterar foto" : "Adicionar foto"}
              </button>
              {editAvatar && (
                <button
                  onClick={() => {
                    setEditAvatar(null);
                    setAvatarFile(null);
                  }}
                  className="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                >
                  Remover foto
                </button>
              )}
            </div>

            {/* Statistics */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-gray-400 mb-3 sm:mb-4 uppercase tracking-wide">Estatísticas</h3>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="text-center p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="text-xl sm:text-2xl font-bold text-cyan-600 dark:text-cyan-400">{stats.favorites}</div>
                  <div className="text-xs text-slate-600 dark:text-gray-400 mt-1">Favoritos</div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.lists}</div>
                  <div className="text-xs text-slate-600 dark:text-gray-400 mt-1">Listas</div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="text-xl sm:text-2xl font-bold text-lime-600 dark:text-lime-400">{stats.watched}</div>
                  <div className="text-xs text-slate-600 dark:text-gray-400 mt-1">Assistidos</div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.want}</div>
                  <div className="text-xs text-slate-600 dark:text-gray-400 mt-1">Quero ver</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mb-1.5 sm:mb-2">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                autoComplete="given-name"
                className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-slate-300 dark:border-slate-600 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 dark:focus:ring-cyan-400/20 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                placeholder="Seu nome"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mb-1.5 sm:mb-2">
                Sobrenome
              </label>
              <input
                type="text"
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
                autoComplete="family-name"
                className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-slate-300 dark:border-slate-600 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 dark:focus:ring-cyan-400/20 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                placeholder="Seu sobrenome"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mb-1.5 sm:mb-2">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-gray-500 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-slate-300 dark:border-slate-600 cursor-not-allowed text-sm sm:text-base"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Lock size={14} className="sm:w-4 sm:h-4 text-slate-400 dark:text-gray-600" />
                </div>
              </div>
              <p className="mt-1.5 sm:mt-2 text-xs text-slate-500 dark:text-gray-500 flex items-center gap-1">
                <Lock size={12} />
                O email não pode ser alterado
              </p>
            </div>

            {/* Password Section */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 sm:pt-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
                <label className="block text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                  className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors self-start sm:self-auto"
                >
                  {showPasswordSection ? "Cancelar" : "Alterar senha"}
                </button>
              </div>
              {showPasswordSection && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-gray-400 mb-1.5">Nova senha</label>
                    <div className="relative">
                      <input
                        type={showPasswords ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 sm:px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 dark:focus:ring-cyan-400/20 focus:outline-none transition-all text-sm"
                        placeholder="Mínimo 8 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300"
                      >
                        {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-gray-400 mb-1.5">Confirmar nova senha</label>
                    <input
                      type={showPasswords ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 sm:px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 dark:focus:ring-cyan-400/20 focus:outline-none transition-all text-sm"
                      placeholder="Digite a senha novamente"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={changingPassword || !newPassword || !confirmPassword}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-700 dark:bg-slate-600 text-white font-semibold text-sm hover:bg-slate-600 dark:hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-h-[44px]"
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

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
              <button
                onClick={() => navigate("/profile")}
                className="flex-1 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold transition-all duration-200 border border-slate-300 dark:border-slate-600 text-sm sm:text-base min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editFirstName.trim()}
                className="flex-1 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-blue-600 dark:bg-blue-500 text-white font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg text-sm sm:text-base min-h-[44px]"
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
  );
};

// ======================= App =======================
const AppShell: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true); // Estado para verificar se está checando a sessão
  const [viewingShared, setViewingShared] = useState(false);
  const [resolvingShare, setResolvingShare] = useState(false);
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
  

  // Initialize from URL params on mount
  const [searchTerm, setSearchTerm] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("q") || "";
  });
  const [appliedSearchFilters, setAppliedSearchFilters] = useState<SearchFilters>(() => {
    // Initialize from URL if available
    const params = new URLSearchParams(window.location.search);
    const filters: SearchFilters = { ...getDefaultFilters() };
    if (params.get("type")) filters.type = params.get("type") as SearchFilters["type"];
    if (params.get("sort")) {
      const sort = params.get("sort");
      if (sort === "popularity.desc" || sort === "rating") filters.sort = "popularity.desc";
      else if (sort === "relevance" || sort === "year") filters.sort = sort;
    }
    if (params.get("year_gte")) filters.yearGte = parseInt(params.get("year_gte") || "1870");
    if (params.get("year_lte")) filters.yearLte = parseInt(params.get("year_lte") || String(new Date().getFullYear()));
    if (params.get("vote_avg_gte")) filters.voteAvgGte = parseFloat(params.get("vote_avg_gte") || "0");
    if (params.get("vote_cnt_gte")) filters.voteCntGte = parseInt(params.get("vote_cnt_gte") || "0");
    if (params.get("with_poster") === "false") filters.withPoster = false;
    return filters;
  });
  const [showSearchFilters, setShowSearchFilters] = useState(false);
  const [searchPage, setSearchPage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get("page") || "1");
  });
  const [searchTotalResults, setSearchTotalResults] = useState(0);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

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
  const [listSearchQuery, setListSearchQuery] = useState("");
  const [listSortOrder, setListSortOrder] = useState<"recent" | "az" | "items" | "updated">("recent");

  // Hook para gerenciar capa de lista com atualização otimista e API
  const { setListCover: setListCoverWithApi, isUpdating } = useListCover(lists, setLists);
  
  // Função wrapper para manter compatibilidade com código existente
  const setListCover = async (listId: string, type: "item" | "upload" | "auto", itemId?: string, url?: string, focalPoint?: { x: number; y: number }) => {
    if (type === "item" && itemId) {
      // Extrair tipo de mídia do itemId (formato: "movie:123" ou "tv:456")
      if (itemId.includes(":")) {
      const [itemType, id] = itemId.split(":");
        if ((itemType === "movie" || itemType === "tv") && id) {
        return await setListCoverWithApi(listId, type, id, itemType as "movie" | "tv", itemId, url, focalPoint);
        }
      } else {
        // Se itemId não tem ":", tentar encontrar o item na lista para determinar o tipo
        const list = lists.find(l => l.id === listId);
        if (list) {
          const item = list.items.find(m => String(m.id) === itemId);
          if (item) {
            const itemMedia = item.media || "movie";
            const itemMediaKey = `${itemMedia}:${item.id}`;
            return await setListCoverWithApi(listId, type, itemId, itemMedia as "movie" | "tv", itemMediaKey, url, focalPoint);
          }
        }
      }
    }
    return await setListCoverWithApi(listId, type, itemId, undefined, undefined, url, focalPoint);
  };

  const [selectedMovie, setSelectedMovie] = useState<any | null>(null);
  // Restaurar estado de navegação do localStorage
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    try {
      const saved = localStorage.getItem('vetra:activeTab');
      if (saved && (saved === "home" || saved === "favorites" || saved === "lists" || saved === "watchlist" || saved === "people")) {
        return saved as TabKey;
      }
    } catch {}
    return "home";
  });
  const [activeCategory, setActiveCategory] = useState<"movies" | "tv" | "people" | "home">(() => {
    try {
      const saved = localStorage.getItem('vetra:activeCategory');
      if (saved && (saved === "movies" || saved === "tv" || saved === "people" || saved === "home")) {
        return saved as "movies" | "tv" | "people" | "home";
      }
    } catch {}
    return "home";
  });

  // Estados para interceptar navegação quando estiver na página de edição de perfil
  const [showExitEditProfileConfirm, setShowExitEditProfileConfirm] = useState(false);
  const [pendingTabChange, setPendingTabChange] = useState<TabKey | null>(null);
  const [pendingCategoryChange, setPendingCategoryChange] = useState<"movies" | "tv" | "people" | "home" | null>(null);
  const [editProfileHasChanges, setEditProfileHasChanges] = useState(false);

  const [cats, setCats] = useState<Record<CatKey, CatState>>({
    trending: { items: [], page: 0, loading: false, initialized: false },
    popular: { items: [], page: 0, loading: false, initialized: false },
    top_rated: { items: [], page: 0, loading: false, initialized: false },
    now_playing: { items: [], page: 0, loading: false, initialized: false },
    upcoming: { items: [], page: 0, loading: false, initialized: false },
  });

  // Estados para filtros
  // popularFilter removido - não usado mais
  const [freeWatchFilter, setFreeWatchFilter] = useState<"movie" | "tv">("movie");
  
  // Estados para seções da Home
  const [homeSections, setHomeSections] = useState<{
    recentReleases: { items: MovieT[]; loading: boolean; error?: string };
    comingSoon: { items: MovieT[]; loading: boolean; error?: string };
    popularMovies: { items: MovieT[]; loading: boolean; error?: string };
    byGenre: { items: MovieT[]; loading: boolean; error?: string; genre?: string }[];
  }>({
    recentReleases: { items: [], loading: false },
    comingSoon: { items: [], loading: false },
    popularMovies: { items: [], loading: false },
    byGenre: [],
  });
  
  // Estados para dados de "Mais bem avaliados" (apenas filmes)
  const [topRatedMovies, setTopRatedMovies] = useState<{ items: MovieT[]; loading: boolean; error?: string }>({
    items: [],
    loading: false,
  });
  
  // Estado para "Ver tudo"
  const [viewAllState, setViewAllState] = useState<{
    section: string;
    title: string;
    subtitle?: string;
    media?: "movie" | "tv" | "all";
    filters?: DiscoverFilters;
    initialItems?: MovieT[];
  } | null>(null);
  const [viewAllPage, setViewAllPage] = useState(1);
  const [viewAllItemsPerPage, setViewAllItemsPerPage] = useState(24);
  const [viewAllItems, setViewAllItems] = useState<MovieT[]>([]);
  const [viewAllLoading, setViewAllLoading] = useState(false);
  const [viewAllTotal, setViewAllTotal] = useState(0);
  const [viewAllTotalPages, setViewAllTotalPages] = useState(1);
  
  // Estados para as 12 fileiras inteligentes
  const [homeRows, setHomeRows] = useState<{
    trending: { items: MovieT[]; loading: boolean; error?: string; window: "day" | "week" };
    personalized: { items: MovieT[]; loading: boolean; error?: string };
    communityLoved: { items: MovieT[]; loading: boolean; error?: string };
    topRated: { items: MovieT[]; loading: boolean; error?: string; media: "movie" | "tv" };
    recentReleases: { items: MovieT[]; loading: boolean; error?: string };
    byGenre: { items: MovieT[]; loading: boolean; error?: string; genre: string; genreId: number }[];
    byDecade: { items: MovieT[]; loading: boolean; error?: string; decade: string }[];
    trendingLists: { items: any[]; loading: boolean; error?: string };
    recentComments: { items: MovieT[]; loading: boolean; error?: string };
    similarToFavorites: { items: MovieT[]; loading: boolean; error?: string };
    indieAcclaimed: { items: MovieT[]; loading: boolean; error?: string };
    shuffleDiscoveries: { items: MovieT[]; loading: boolean; error?: string };
  }>({
    trending: { items: [], loading: false, window: "day" },
    personalized: { items: [], loading: false },
    communityLoved: { items: [], loading: false },
    topRated: { items: [], loading: false, media: "movie" },
    recentReleases: { items: [], loading: false },
    byGenre: [],
    byDecade: [],
    trendingLists: { items: [], loading: false },
    recentComments: { items: [], loading: false },
    similarToFavorites: { items: [], loading: false },
    indieAcclaimed: { items: [], loading: false },
    shuffleDiscoveries: { items: [], loading: false },
  });
  
  // Cache simples em memória (pode ser melhorado com localStorage)
  const rowCache = useRef<Map<string, { data: MovieT[]; timestamp: number; ttl: number }>>(new Map());
  
  // Estado para filmes populares filtrados (removido - não usado mais)

  // Estados para discover (Filmes e Séries)
  const [moviesFilters, setMoviesFilters] = useState<DiscoverFilters>({
    sortBy: "popularity.desc",
    region: "BR",
    withPoster: true,
  });
  const [tvFilters, setTvFilters] = useState<DiscoverFilters>({
    sortBy: "popularity.desc",
    region: "BR",
    withPoster: true,
  });
  const [discoverMovies, setDiscoverMovies] = useState<{
    items: MovieT[];
    loading: boolean;
    page: number;
    totalPages: number;
    total: number;
  }>({
    items: [],
    loading: false,
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [discoverTv, setDiscoverTv] = useState<{
    items: MovieT[];
    loading: boolean;
    page: number;
    totalPages: number;
    total: number;
  }>({
    items: [],
    loading: false,
    page: 1,
    totalPages: 1,
    total: 0,
  });
  
  const [moviesPerPage, setMoviesPerPage] = useState<number>(() => {
    const saved = localStorage.getItem("vetra:moviesPerPage");
    return saved ? parseInt(saved, 10) : 24;
  });
  const [tvPerPage, setTvPerPage] = useState<number>(() => {
    const saved = localStorage.getItem("vetra:tvPerPage");
    return saved ? parseInt(saved, 10) : 24;
  });
  
  const [moviesFacets, setMoviesFacets] = useState<{ minYear?: number; maxYear?: number; genres?: any[] }>({});
  const [tvFacets, setTvFacets] = useState<{ minYear?: number; maxYear?: number; genres?: any[] }>({});
  
  const discoverAbortController = useRef<AbortController | null>(null);

  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "", acceptTerms: false });
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [passwordStrength, setPasswordStrength] = useState<"muito-fraca" | "fraca" | "boa" | "forte">("muito-fraca");
  const [showPasswordTips, setShowPasswordTips] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>("");
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareSlug, setShareSlug] = useState("");
  const [showSignupCTAHidden, setShowSignupCTAHidden] = useState(() => {
    const hidden = localStorage.getItem("vetra:signupCTAHidden");
    return hidden ? new Date().getTime() - parseInt(hidden, 10) < 30 * 24 * 60 * 60 * 1000 : false;
  });
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileMenuRef, setProfileMenuRef] = useState<HTMLDivElement | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");
  const [deleteAccountError, setDeleteAccountError] = useState("");
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [deleteAccountConfirmCheckbox, setDeleteAccountConfirmCheckbox] = useState(false);
  
  const [useBottomNav, setUseBottomNav] = useState(false);
  const headerNavRef = useRef<HTMLDivElement | null>(null);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  
  // Modais modernos
  const [renameModal, setRenameModal] = useState<{ show: boolean; listId: string | null; currentName: string }>({ show: false, listId: null, currentName: "" });
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; message: string; onConfirm: () => void }>({ show: false, message: "", onConfirm: () => {} });
  const [showCoverSelector, setShowCoverSelector] = useState(false);
  const [coverSelectorListId, setCoverSelectorListId] = useState<string | null>(null);
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
  };

  const handleDeleteAccount = async () => {
    if (!deleteAccountPassword.trim() || !deleteAccountConfirmCheckbox) {
      setDeleteAccountError("Preencha todos os campos obrigatórios.");
      return;
    }

    setDeleteAccountLoading(true);
    setDeleteAccountError("");
    
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Não autenticado");

      const API_BASE = (import.meta.env.VITE_API_BASE || "").trim() || "http://localhost:4001";
      const response = await fetch(`${API_BASE}/api/auth/delete-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ password: deleteAccountPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setDeleteAccountError("Senha incorreta. Tente novamente.");
        } else {
          setDeleteAccountError(data.message || "Não foi possível excluir a conta. Tente novamente.");
        }
        return;
      }

      pushToast({ 
        message: "Sua conta foi marcada para exclusão e será removida permanentemente em 30 dias, a menos que você a reative.", 
        tone: "ok" 
      });

      setIsLoggedIn(false);
      setUser(null);
      // Limpar todos os tokens
      localStorage.removeItem("authToken");
      localStorage.removeItem('vetra:idToken');
      localStorage.removeItem('vetra:refreshToken');
      localStorage.removeItem('vetra:last_email');
      setShowDeleteAccountModal(false);
      setDeleteAccountPassword("");
      setDeleteAccountConfirmCheckbox(false);
    } catch (e: any) {
      setDeleteAccountError("Não foi possível excluir a conta. Tente novamente.");
    } finally {
      setDeleteAccountLoading(false);
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

  useEffect(() => {
    if (showSearchFilters && window.innerWidth < 768) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [showSearchFilters]);

  useEffect(() => {
    if (!isLoggedIn) {
      setUseBottomNav(false);
      return;
    }

    const checkNavMode = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Breakpoints responsivos seguindo o guia:
      // xs: < 480px, sm: 480-768px, md: 768-1024px, lg: 1024-1440px, xl: > 1440px
      
      // Regra 1: Mostrar Bottom Nav quando viewport < 900px (xs, sm, md estreito)
      if (viewportWidth < 900) {
        setUseBottomNav(true);
        return;
      }
      
      // Regra 2: Verificar "aspecto estreito" - largura < 60% da largura do monitor
      // Isso cobre casos de desktop em janela estreita (metade de tela)
      const screenWidth = window.screen?.width || viewportWidth;
      const isNarrowAspect = viewportWidth < screenWidth * 0.6;
      
      if (isNarrowAspect && viewportWidth < 1024) {
        setUseBottomNav(true);
        return;
      }
      
      // Regra 3: Em md (768-1024px), se a janela estiver estreita, ativar Bottom Nav
      if (viewportWidth >= 768 && viewportWidth < 1024) {
        // Verificar se há overflow no nav do header
        if (headerNavRef.current) {
          const nav = headerNavRef.current;
          const navContainer = nav.parentElement;
          if (navContainer) {
            const containerRect = navContainer.getBoundingClientRect();
            const navRect = nav.getBoundingClientRect();
            const availableWidth = containerRect.width;
            const navNeededWidth = nav.scrollWidth;
            const hasOverflow = navNeededWidth > availableWidth || navRect.width > availableWidth;
            
            if (hasOverflow || isNarrowAspect) {
              setUseBottomNav(true);
              return;
            }
          }
        }
      }
      
      // Regra 4: Desktop amplo (lg/xl) - verificar overflow do nav
      if (viewportWidth >= 1024) {
        if (headerNavRef.current) {
          const nav = headerNavRef.current;
          const navContainer = nav.parentElement;
          if (navContainer) {
            const containerRect = navContainer.getBoundingClientRect();
            const navRect = nav.getBoundingClientRect();
            const availableWidth = containerRect.width;
            const navNeededWidth = nav.scrollWidth;
            const hasOverflow = navNeededWidth > availableWidth || navRect.width > availableWidth;
            
            // Em desktop, só mostrar bottom nav se houver overflow E janela estreita
            if (hasOverflow && isNarrowAspect) {
              setUseBottomNav(true);
              return;
            }
          }
        }
      }
      
      // Desktop amplo sem necessidade: usar nav do header
      setUseBottomNav(false);
    };

    const timeoutId = setTimeout(checkNavMode, 100);
    window.addEventListener('resize', checkNavMode);
    
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(checkNavMode, 50);
    });
    
    if (headerNavRef.current) {
      resizeObserver.observe(headerNavRef.current);
      const container = headerNavRef.current.parentElement;
      if (container) {
        resizeObserver.observe(container);
      }
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkNavMode);
      resizeObserver.disconnect();
    };
  }, [isLoggedIn]);

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

  // Função para resolver e exibir compartilhamento
  const resolveShare = async (slugOrCode: string) => {
    const normalizedSlug = validateAndExtractSlug(slugOrCode) || slugOrCode;
    console.log('[resolveShare] Iniciando resolução do compartilhamento:', normalizedSlug);
    setResolvingShare(true);
    try {
      const data = await api.shareGet(normalizedSlug);
      console.log('[resolveShare] Dados recebidos:', data);
      
      if (Array.isArray(data.items)) {
        if (data.type === 'collection') {
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
          console.log('[resolveShare] Coleção compartilhada carregada:', mapped.length, 'itens');
        } else if (data.type === 'list') {
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
          console.log('[resolveShare] Lista compartilhada carregada:', mapped.length, 'itens', { listName, viewingShared: true, isLoggedIn });
        } else {
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
          console.log('[resolveShare] Favoritos compartilhados carregados:', mapped.length, 'itens');
        }
      } else {
        console.warn('[resolveShare] Resposta inválida: items não é um array');
        pushToast({ 
          message: "Formato de dados inválido.", 
          tone: "err" 
        });
      }
    } catch (error: any) {
      console.error('[resolveShare] Erro ao resolver compartilhamento:', error);
      const errorMessage = error?.message || error?.toString() || "";
      if (errorMessage.includes("404") || errorMessage.includes("não encontrado") || errorMessage.includes("not found")) {
        pushToast({ 
          message: "Não encontramos nenhuma lista para este código. Verifique e tente novamente.", 
          tone: "err" 
        });
      } else if (errorMessage.includes("403") || errorMessage.includes("privada") || errorMessage.includes("private")) {
        pushToast({ 
          message: "Esta lista é privada.", 
          tone: "err" 
        });
      } else {
        pushToast({ 
          message: "Erro ao carregar lista compartilhada. Tente novamente.", 
          tone: "err" 
        });
      }
      setViewingShared(false);
    } finally {
      setResolvingShare(false);
    }
  };
  
  // Deep-link handling: detecta ?share= na URL e resolve
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    let slug = searchParams.get("share");
    
    // Tenta extrair de path também
    if (!slug) {
      const pathMatch = location.pathname.match(/\/share\/([^\/]+)/);
      if (pathMatch) {
        slug = pathMatch[1];
        // Limpa o path e adiciona ?share= na query
        const newPath = location.pathname.replace(/\/share\/[^\/]+/, "");
        navigate(`${newPath}?share=${slug}`, { replace: true });
        return; // Retorna para evitar processar duas vezes
      }
    }
    
    if (!slug) return;
    
    // Resolve o compartilhamento
    resolveShare(slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, location.pathname]);
  
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
    (["popular", "top_rated", "now_playing", "upcoming"] as CatKey[]).forEach((k) => {
      loadCategory(k, 1);
     
      setTimeout(() => loadCategory(k, 2), 500);
    });
    
  }, [lang]);
  
  // Helper: limpar cache específico
  const clearCachedRow = (key: string) => {
    rowCache.current.delete(key);
  };
  
  // Helper: verificar cache
  const getCachedRow = (key: string): MovieT[] | null => {
    const cached = rowCache.current.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    return null;
  };
  
  // Helper: salvar no cache
  const setCachedRow = (key: string, data: MovieT[], ttl: number) => {
    rowCache.current.set(key, { data, timestamp: Date.now(), ttl });
  };
  
  // Helper: deduplicar itens entre fileiras (evitar repetição lado a lado)
  const dedupeItems = (newItems: MovieT[], existingItems: MovieT[]): MovieT[] => {
    const existingKeys = new Set(existingItems.map(m => `${m.media || "movie"}:${m.id}`));
    return newItems.filter(m => !existingKeys.has(`${m.media || "movie"}:${m.id}`));
  };
  
  // 1. Mais bem avaliados (top_rated) - Usar browse/getCategory com filtro vote_count >= 500
  const loadTopRatedSection = useCallback(async (page = 1, skipIds: Set<string> = new Set(), forceRefresh = false) => {
    const cacheKey = `top_rated_movies_${lang}_BR_${page}`;
    const cacheTTL = 15 * 60 * 1000; // 15 minutos
    
    // Limpar cache se forceRefresh
    if (forceRefresh) {
      clearCachedRow(cacheKey);
    }
    
    const cached = getCachedRow(cacheKey);
    
    if (cached && cached.length > 0 && !forceRefresh) {
      const filtered = cached.filter(m => !skipIds.has(`${m.media || "movie"}:${m.id}`));
      setTopRatedMovies({ items: filtered, loading: false });
      console.log(`[home_carousel_loaded] section=top_rated source=cache page=${page} items=${filtered.length}`);
      return filtered;
    }
    
    setTopRatedMovies(prev => ({ ...prev, loading: true }));
    const startTime = Date.now();
    
    try {
      let data: BrowseResp;
      let source = "tmdb";
      
      // Tentar usar browse do VETRA primeiro
      try {
        data = await api.browse("top_rated", page);
        source = "vetra";
      } catch (vetraError) {
        // Fallback para getCategory do TMDb
        console.log(`[api_fallback_used] endpoint=/browse/top_rated reason=${vetraError} status=fallback`);
        data = await api.getCategory("movie", "top_rated", page);
      }
      
      const results = (data?.results || []) as ApiMovie[];
      
      // Filtrar por vote_count >= 500 e ordenar por vote_average DESC, tie-break por vote_count DESC
      const filtered = results
        .filter(m => {
          const voteCount = (m as any).vote_count || 0;
          const hasPoster = m.poster_path || (m as any).image;
          return voteCount >= 500 && hasPoster;
        })
        .sort((a, b) => {
          const aVote = a.vote_average || 0;
          const bVote = b.vote_average || 0;
          if (bVote !== aVote) return bVote - aVote;
          const aCount = (a as any).vote_count || 0;
          const bCount = (b as any).vote_count || 0;
          return bCount - aCount;
        })
        .slice(0, 20);
      
      // Remover duplicados baseado em skipIds
      const deduplicated = filtered.filter(m => !skipIds.has(`${m.media || "movie"}:${m.id}`));
      
      // Se não temos itens suficientes após dedup, tentar próxima página (máx 3 tentativas)
      let finalItems = deduplicated;
      if (deduplicated.length < 10 && page < 3) {
        const nextPageItems = await loadTopRatedSection(page + 1, skipIds, false);
        finalItems = [...deduplicated, ...nextPageItems].slice(0, 20);
      } else if (deduplicated.length === 0 && page === 1) {
        // Se não encontrou nada na primeira página, logar
        console.log(`[home_carousel_dedup_skips] section=top_rated skipped_count=${filtered.length - deduplicated.length}`);
      }
      
      const mapped = mapRows(finalItems as ApiMovie[]);
      
      setCachedRow(cacheKey, mapped, cacheTTL);
      const duration = Date.now() - startTime;
      console.log(`[home_carousel_loaded] section=top_rated source=${source} page=${page} items=${mapped.length} duration_ms=${duration} forceRefresh=${forceRefresh}`);
      
      // Alertar se >30% dos itens têm vote_count < 500
      const lowVoteCount = mapped.filter(m => (m.voteCount || 0) < 500).length;
      if (lowVoteCount > mapped.length * 0.3) {
        console.warn(`[home_carousel_quality_alert] section=top_rated low_vote_count_items=${lowVoteCount} total=${mapped.length}`);
      }
      
      setTopRatedMovies({ items: mapped, loading: false });
      console.log('[home_sections] Estado topRatedMovies atualizado com', mapped.length, 'itens');
      return mapped;
    } catch (e: any) {
      const duration = Date.now() - startTime;
      console.error(`[home_carousel_error] section=top_rated error=${e?.message} duration_ms=${duration}`);
      setTopRatedMovies(prev => ({ ...prev, loading: false, error: e?.message }));
      return [];
    }
  }, [lang]);
 
  // Carregar fileiras inteligentes com deduplicação
  useEffect(() => {
    if (!searchTerm && !hasActiveFilters && activeTab === "home" && activeCategory === "home") {
      console.log('[home_sections] Carregando seções da home...');
      // Sempre recarregar para garantir dados atualizados (forceRefresh = true na primeira vez)
      loadTopRatedSection(1, new Set(), true).then((topRatedItems) => {
        console.log('[home_sections] Top rated carregado:', topRatedItems.length, 'itens');
        // Criar set de IDs já renderizados para deduplicação
        const renderedIds = new Set(topRatedItems.map(m => `${m.media || "movie"}:${m.id}`));
        
        // Carregar "Populares" pulando duplicados
        loadPopularSection(1, renderedIds, true).then((popularItems) => {
          console.log('[home_sections] Popular carregado:', popularItems.length, 'itens');
        });
      });
      loadPersonalizedRow();
      loadTopRatedRow("movie");
      loadRecentReleasesRow();
      loadShuffleDiscoveries();
      
      // Carregar gêneros mais comuns (se logado)
      if (isLoggedIn && favorites.length > 0) {
        const favoriteGenres = new Map<number, number>();
        favorites.forEach((m) => {
          const genres = (m as any).genres || [];
          genres.forEach((g: any) => {
            const genreId = typeof g === "object" ? g.id : g;
            if (genreId) favoriteGenres.set(genreId, (favoriteGenres.get(genreId) || 0) + 1);
          });
        });
        const topGenres = Array.from(favoriteGenres.entries()).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([id]) => id);
        topGenres.forEach((id, idx) => {
          const genreNames: Record<number, string> = { 28: "Ação", 35: "Comédia", 18: "Drama", 53: "Suspense", 16: "Animação", 99: "Documentário" };
          setTimeout(() => loadByGenreRow(id, genreNames[id] || `Gênero ${id}`), idx * 300);
        });
      } else {
        // Gêneros padrão
        setTimeout(() => loadByGenreRow(28, "Ação"), 0);
        setTimeout(() => loadByGenreRow(35, "Comédia"), 300);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, hasActiveFilters, activeTab, activeCategory, lang]);

 
  // loadFilteredPopular removido - não usado mais


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
          
          // Garantir que profile_path está presente
          const resultsWithImages = results.map((person: any) => ({
            ...person,
            profile_path: person.profile_path || null,
            name: person.name || "",
            known_for_department: person.known_for_department || null,
            known_for: person.known_for || [],
            popularity: person.popularity || 0,
          }));
          
          const filteredResults = resultsWithImages.filter((person: any) => {
            const hasName = person.name && person.name.trim() !== "";
            return hasName;
          });
          
          console.log("[PeopleContent] Após filtro:", filteredResults.length);
          console.log("[PeopleContent] Primeira pessoa:", filteredResults[0]);
          if (filteredResults[0]) {
            console.log("[PeopleContent] Profile path da primeira pessoa:", filteredResults[0].profile_path);
            console.log("[PeopleContent] URL da imagem:", filteredResults[0].profile_path ? `https://image.tmdb.org/t/p/w300${filteredResults[0].profile_path}` : "Sem imagem");
          }
          
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
    
  }, [activeTab, lang]);
  
  useEffect(() => {
    if (activeTab === "people" && peoplePage > 1 && !peopleLoading) {
      setPeopleLoading(true);
      popularPeople(peoplePage, lang)
        .then((data) => {
          const results = (data as any).results || [];
          
          // Garantir que profile_path está presente
          const resultsWithImages = results.map((person: any) => ({
            ...person,
            profile_path: person.profile_path || null,
            name: person.name || "",
            known_for_department: person.known_for_department || null,
            known_for: person.known_for || [],
            popularity: person.popularity || 0,
          }));
          
          const filteredResults = resultsWithImages.filter((person: any) => {
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

  const loadViewAllPage = async (page: number, media: "movie" | "tv" | "all", filters: DiscoverFilters) => {
    if (!viewAllState) return;
    setViewAllLoading(true);
    try {
      if (media === "all") {
        const [moviesData, tvData] = await Promise.all([
          api.discover("movie", filters, page, viewAllItemsPerPage),
          api.discover("tv", filters, page, viewAllItemsPerPage),
        ]);
        const allItems = [
          ...mapRows((moviesData?.results || moviesData?.items || []) as ApiMovie[]),
          ...mapRows((tvData?.results || tvData?.items || []) as ApiMovie[]),
        ];
        setViewAllItems(allItems);
        const total = ((moviesData as any)?.total_results || 0) + ((tvData as any)?.total_results || 0);
        setViewAllTotal(total);
        setViewAllTotalPages(Math.ceil(total / viewAllItemsPerPage));
      } else {
        const data = await api.discover(media, filters, page, viewAllItemsPerPage);
        const mapped = mapRows((data?.results || data?.items || []) as ApiMovie[]);
        setViewAllItems(mapped);
        setViewAllTotal((data as any)?.total_results || 0);
        setViewAllTotalPages((data as any)?.total_pages || Math.ceil(((data as any)?.total_results || 0) / viewAllItemsPerPage));
      }
    } catch (e: any) {
      pushToast({ message: "Erro ao carregar itens", tone: "err" });
      console.error("Erro ao carregar viewAll:", e);
    } finally {
      setViewAllLoading(false);
    }
  };
  
  // 2. Para você (Personalizado)
  const loadPersonalizedRow = async () => {
    if (!isLoggedIn || (favorites.length === 0 && Object.keys(userStates).length === 0)) {
      const popularData = await api.discover("movie", { sortBy: "popularity.desc", withPoster: true }, 1, 20);
      const popularItems = mapRows((popularData?.results || []) as ApiMovie[]);
      setHomeRows(s => ({ ...s, personalized: { items: popularItems, loading: false } }));
      return;
    }
    
    const cacheKey = `personalized_${user?.email || "guest"}_${lang}_${new Date().toISOString().split('T')[0]}`;
    const cached = getCachedRow(cacheKey);
    if (cached) {
      setHomeRows(s => ({ ...s, personalized: { ...s.personalized, items: cached, loading: false } }));
      return;
    }
    
    setHomeRows(s => ({ ...s, personalized: { ...s.personalized, loading: true } }));
    try {
      const favoriteGenres = new Map<number, number>();
      const favoriteCast = new Map<number, number>();
      const favoriteIds = new Set<string>();
      
      favorites.forEach((m) => {
        favoriteIds.add(mediaKey(m));
        const genres = (m as any).genres || [];
        genres.forEach((g: any) => {
          const genreId = typeof g === "object" ? g.id : g;
          if (genreId) favoriteGenres.set(genreId, (favoriteGenres.get(genreId) || 0) + 1);
        });
      });
      
      const topGenres = Array.from(favoriteGenres.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id);
      if (topGenres.length === 0) {
        const popularData = await api.discover("movie", { sortBy: "popularity.desc", withPoster: true }, 1, 20);
        const popularItems = mapRows((popularData?.results || []) as ApiMovie[]);
        setHomeRows(s => ({ ...s, personalized: { items: popularItems, loading: false } }));
        return;
      }
      
      const [moviesData, tvData] = await Promise.all([
        api.discover("movie", { genres: topGenres, sortBy: "popularity.desc", withPoster: true }, 1, 20),
        api.discover("tv", { genres: topGenres, sortBy: "popularity.desc", withPoster: true }, 1, 20),
      ]);
      
      const allItems = [
        ...mapRows((moviesData?.results || []) as ApiMovie[]),
        ...mapRows((tvData?.results || []) as ApiMovie[]),
      ].filter(m => !favoriteIds.has(mediaKey(m)))
        .map((m: any) => {
          let score = 0.1 * (m.popularity || 0);
          const genres = m.genres || [];
          genres.forEach((g: any) => {
            if (topGenres.includes(typeof g === "object" ? g.id : g)) score += 0.6 / topGenres.length;
          });
          return { movie: m, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 20)
        .map(({ movie }) => movie);
      
      if (allItems.length < 10) {
        const popularData = await api.discover("movie", { sortBy: "popularity.desc", withPoster: true }, 1, 20);
        const popularItems = mapRows((popularData?.results || []) as ApiMovie[]);
        allItems.push(...popularItems.slice(0, 10 - allItems.length));
      }
      
      setCachedRow(cacheKey, allItems, 24 * 60 * 60 * 1000); // 24h
      setHomeRows(s => ({ ...s, personalized: { items: allItems, loading: false } }));
    } catch (e: any) {
      setHomeRows(s => ({ ...s, personalized: { ...s.personalized, loading: false, error: e?.message } }));
    }
  };
  
  // 4. Altíssima avaliação
  const loadTopRatedRow = async (media: "movie" | "tv") => {
    const cacheKey = `top_rated_${media}_${lang}_${new Date().toISOString().split('T')[0]}`;
    const cached = getCachedRow(cacheKey);
    if (cached) {
      setHomeRows(s => ({ ...s, topRated: { ...s.topRated, items: cached, loading: false, media } }));
      return;
    }
    
    setHomeRows(s => ({ ...s, topRated: { ...s.topRated, loading: true, media } }));
    try {
      const data = await api.discover(media, {
        sortBy: "vote_average.desc",
        voteCountGte: 1000,
        voteAverageGte: 8.0,
        withPoster: true,
      }, 1, 20);
      
      let mapped = mapRows((data?.results || []) as ApiMovie[]);
      if (mapped.length < 12) {
        const fallbackData = await api.discover(media, {
          sortBy: "vote_average.desc",
          voteCountGte: 1000,
          voteAverageGte: 7.5,
          withPoster: true,
        }, 1, 20);
        mapped = mapRows((fallbackData?.results || []) as ApiMovie[]);
      }
      
      setCachedRow(cacheKey, mapped, 24 * 60 * 60 * 1000); // 24h
      setHomeRows(s => ({ ...s, topRated: { items: mapped, loading: false, media } }));
    } catch (e: any) {
      setHomeRows(s => ({ ...s, topRated: { ...s.topRated, loading: false, error: e?.message } }));
    }
  };
  
  // 5. Lançados recentemente
  const loadRecentReleasesRow = async () => {
    const cacheKey = `recent_releases_${lang}_${new Date().toISOString().split('T')[0]}`;
    const cached = getCachedRow(cacheKey);
    if (cached) {
      setHomeRows(s => ({ ...s, recentReleases: { ...s.recentReleases, items: cached, loading: false } }));
      return;
    }
    
    setHomeRows(s => ({ ...s, recentReleases: { ...s.recentReleases, loading: true } }));
    try {
      const today = new Date();
      const sixtyDaysAgo = new Date(today);
      sixtyDaysAgo.setDate(today.getDate() - 60);
      const dateFrom = sixtyDaysAgo.toISOString().split('T')[0];
      const dateTo = today.toISOString().split('T')[0];
      
      const [moviesData, tvData] = await Promise.all([
        api.discover("movie", {
          releaseDateFrom: dateFrom,
          releaseDateTo: dateTo,
          sortBy: "primary_release_date.desc",
          withPoster: true,
        }, 1, 20),
        api.discover("tv", {
          airDateFrom: dateFrom,
          airDateTo: dateTo,
          sortBy: "first_air_date.desc",
          withPoster: true,
        }, 1, 20),
      ]);
      
      const allItems = [
        ...mapRows((moviesData?.results || []) as ApiMovie[]),
        ...mapRows((tvData?.results || []) as ApiMovie[]),
      ].sort((a, b) => {
        const aDate = a.year ? parseInt(a.year) : 0;
        const bDate = b.year ? parseInt(b.year) : 0;
        return bDate - aDate;
      }).slice(0, 20);
      
      if (allItems.length < 10) {
        const ninetyDaysAgo = new Date(today);
        ninetyDaysAgo.setDate(today.getDate() - 90);
        const dateFrom90 = ninetyDaysAgo.toISOString().split('T')[0];
        const [moviesData90, tvData90] = await Promise.all([
          api.discover("movie", {
            releaseDateFrom: dateFrom90,
            releaseDateTo: dateTo,
            sortBy: "primary_release_date.desc",
            withPoster: true,
          }, 1, 20),
          api.discover("tv", {
            airDateFrom: dateFrom90,
            airDateTo: dateTo,
            sortBy: "first_air_date.desc",
            withPoster: true,
          }, 1, 20),
        ]);
        const allItems90 = [
          ...mapRows((moviesData90?.results || []) as ApiMovie[]),
          ...mapRows((tvData90?.results || []) as ApiMovie[]),
        ].sort((a, b) => {
          const aDate = a.year ? parseInt(a.year) : 0;
          const bDate = b.year ? parseInt(b.year) : 0;
          return bDate - aDate;
        }).slice(0, 20);
        setHomeRows(s => ({ ...s, recentReleases: { items: allItems90, loading: false } }));
        setCachedRow(cacheKey, allItems90, 24 * 60 * 60 * 1000);
        return;
      }
      
      setCachedRow(cacheKey, allItems, 24 * 60 * 60 * 1000); // 24h
      setHomeRows(s => ({ ...s, recentReleases: { items: allItems, loading: false } }));
    } catch (e: any) {
      setHomeRows(s => ({ ...s, recentReleases: { ...s.recentReleases, loading: false, error: e?.message } }));
    }
  };
  
  // 6. Explorar por gênero
  const loadByGenreRow = async (genreId: number, genreName: string) => {
    const cacheKey = `by_genre_${genreId}_${lang}_${new Date().toISOString().split('T')[0]}`;
    const cached = getCachedRow(cacheKey);
    if (cached) {
      const existing = homeRows.byGenre.find(g => g.genreId === genreId);
      if (!existing) {
        setHomeRows(s => ({
          ...s,
          byGenre: [...s.byGenre, { items: cached, loading: false, genre: genreName, genreId }],
        }));
      }
      return;
    }
    
    const existing = homeRows.byGenre.find(g => g.genreId === genreId);
    if (existing) {
      setHomeRows(s => ({
        ...s,
        byGenre: s.byGenre.map(g => g.genreId === genreId ? { ...g, loading: true } : g),
      }));
    } else {
      setHomeRows(s => ({
        ...s,
        byGenre: [...s.byGenre, { items: [], loading: true, genre: genreName, genreId }],
      }));
    }
    
    try {
      const [moviesData, tvData] = await Promise.all([
        api.discover("movie", {
          genres: [genreId],
          sortBy: "popularity.desc",
          voteCountGte: 300,
          withPoster: true,
        }, 1, 15),
        api.discover("tv", {
          genres: [genreId],
          sortBy: "popularity.desc",
          voteCountGte: 300,
          withPoster: true,
        }, 1, 15),
      ]);
      
      const allItems = [
        ...mapRows((moviesData?.results || []) as ApiMovie[]),
        ...mapRows((tvData?.results || []) as ApiMovie[]),
      ].slice(0, 15);
      
      setCachedRow(cacheKey, allItems, 24 * 60 * 60 * 1000); // 24h
      setHomeRows(s => ({
        ...s,
        byGenre: s.byGenre.map(g => g.genreId === genreId ? { ...g, items: allItems, loading: false } : g),
      }));
    } catch (e: any) {
      setHomeRows(s => ({
        ...s,
        byGenre: s.byGenre.map(g => g.genreId === genreId ? { ...g, loading: false, error: e?.message } : g),
      }));
    }
  };
  
  // 12. Descobertas rápidas (Shuffle)
  const loadShuffleDiscoveries = async () => {
    setHomeRows(s => ({ ...s, shuffleDiscoveries: { ...s.shuffleDiscoveries, loading: true } }));
    try {
      const favoriteIds = new Set(favorites.map(m => mediaKey(m)));
      const seed = user?.email ? parseInt(user.email.slice(-4), 16) || 0 : Math.floor(Math.random() * 10000);
      
      const data = await api.discover("movie", {
        sortBy: "popularity.desc",
        withPoster: true,
      }, Math.floor(seed % 10) + 1, 20);
      
      const mapped = mapRows((data?.results || []) as ApiMovie[])
        .filter(m => !favoriteIds.has(mediaKey(m)))
        .sort(() => Math.random() - 0.5)
        .slice(0, 20);
      
      setHomeRows(s => ({ ...s, shuffleDiscoveries: { items: mapped, loading: false } }));
    } catch (e: any) {
      setHomeRows(s => ({ ...s, shuffleDiscoveries: { ...s.shuffleDiscoveries, loading: false, error: e?.message } }));
    }
  };
  
  const loadDiscoverMovies = useCallback(async (page: number = 1, filters: DiscoverFilters = moviesFilters) => {
    if (discoverAbortController.current) {
      discoverAbortController.current.abort();
    }
    discoverAbortController.current = new AbortController();
    
    setDiscoverMovies((prev) => ({ ...prev, loading: true }));
    
    try {
      const data = await api.discover("movie", { ...filters, withPoster: filters.withPoster !== false }, page, moviesPerPage);
      const results = (data?.results || []) as ApiMovie[];
      const filtered = results.filter((x: any) => {
        if (filters.withPoster !== false) {
          const hasImage = (x.poster_path && x.poster_path.trim() !== "") || 
                          (x.backdrop_path && x.backdrop_path.trim() !== "");
          if (!hasImage) return false;
        }
        const hasTitle = (x.title && x.title.trim() !== "") || 
                        (x.name && x.name.trim() !== "");
        const hasInfo = (x.overview && x.overview.trim() !== "") || 
                       x.release_date || 
                       x.first_air_date ||
                       x.vote_average !== null;
        return hasTitle && hasInfo;
      });
      const mapped = mapRows(filtered);
      setDiscoverMovies({
        items: mapped,
        loading: false,
        page: page,
        totalPages: (data as any)?.total_pages ?? 1,
        total: (data as any)?.total_results ?? 0,
      });
      
      if ((data as any)?.facets) {
        setMoviesFacets((data as any).facets);
      }
    } catch (e: any) {
      if (e.name === "AbortError") return;
      console.error("[loadDiscoverMovies] Erro:", e);
      setDiscoverMovies((prev) => ({ ...prev, loading: false }));
      pushToast({ message: t("error_load_movies"), tone: "err" });
    }
  }, [moviesFilters, moviesPerPage, t, pushToast]);

  const discoverMoviesDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    if (activeCategory === "movies" && activeTab === "home") {
      if (discoverMoviesDebounce.current) {
        clearTimeout(discoverMoviesDebounce.current);
      }
      discoverMoviesDebounce.current = setTimeout(() => {
        setDiscoverMovies((prev) => ({ ...prev, page: 1, total: 0 }));
        loadDiscoverMovies(1, moviesFilters);
      }, 350);
      
      return () => {
        if (discoverMoviesDebounce.current) {
          clearTimeout(discoverMoviesDebounce.current);
        }
      };
    }
  }, [activeCategory, activeTab, moviesFilters, loadDiscoverMovies]);


  const loadDiscoverTv = useCallback(async (page: number = 1, filters: DiscoverFilters = tvFilters) => {
    if (discoverAbortController.current) {
      discoverAbortController.current.abort();
    }
    discoverAbortController.current = new AbortController();
    
    setDiscoverTv((prev) => ({ ...prev, loading: true }));
    
    try {
      const data = await api.discover("tv", { ...filters, withPoster: filters.withPoster !== false }, page, tvPerPage);
      const results = (data?.results || []) as ApiMovie[];
      const filtered = results.filter((x: any) => {
        if (filters.withPoster !== false) {
          const hasImage = (x.poster_path && x.poster_path.trim() !== "") || 
                          (x.backdrop_path && x.backdrop_path.trim() !== "");
          if (!hasImage) return false;
        }
        const hasTitle = (x.title && x.title.trim() !== "") || 
                        (x.name && x.name.trim() !== "");
        const hasInfo = (x.overview && x.overview.trim() !== "") || 
                       x.release_date || 
                       x.first_air_date ||
                       x.vote_average !== null;
        return hasTitle && hasInfo;
      });
      const mapped = mapRows(filtered);
      setDiscoverTv({
        items: mapped,
        loading: false,
        page: page,
        totalPages: (data as any)?.total_pages ?? 1,
        total: (data as any)?.total_results ?? 0,
      });
      
      if ((data as any)?.facets) {
        setTvFacets((data as any).facets);
      }
    } catch (e: any) {
      if (e.name === "AbortError") return;
      console.error("[loadDiscoverTv] Erro:", e);
      setDiscoverTv((prev) => ({ ...prev, loading: false }));
      pushToast({ message: t("error_load_series"), tone: "err" });
    }
  }, [tvFilters, tvPerPage, t, pushToast]);

  const discoverTvDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    if (activeCategory === "tv" && activeTab === "home") {
      if (discoverTvDebounce.current) {
        clearTimeout(discoverTvDebounce.current);
      }
      discoverTvDebounce.current = setTimeout(() => {
        setDiscoverTv((prev) => ({ ...prev, page: 1, total: 0 }));
        loadDiscoverTv(1, tvFilters);
      }, 350);
      
      return () => {
        if (discoverTvDebounce.current) {
          clearTimeout(discoverTvDebounce.current);
        }
      };
    }
  }, [activeCategory, activeTab, tvFilters, loadDiscoverTv]);

  // Carregar dados para seção "Populares" - Usar browse/getCategory com ordenação por popularity DESC
  const loadPopularSection = useCallback(async (page = 1, skipIds: Set<string> = new Set(), forceRefresh = false) => {
    const cacheKey = `popular_movies_${lang}_BR_${page}`;
    const cacheTTL = 15 * 60 * 1000; // 15 minutos
    
    // Limpar cache se forceRefresh
    if (forceRefresh) {
      clearCachedRow(cacheKey);
    }
    
    const cached = getCachedRow(cacheKey);
    
    if (cached && cached.length > 0 && !forceRefresh) {
      const filtered = cached.filter(m => !skipIds.has(`${m.media || "movie"}:${m.id}`));
      setHomeSections(s => ({
        ...s,
        popularMovies: { items: filtered, loading: false }
      }));
      console.log(`[home_carousel_loaded] section=popular source=cache page=${page} items=${filtered.length}`);
      return filtered;
    }
    
    setHomeSections(s => ({
      ...s,
      popularMovies: { ...s.popularMovies, loading: true }
    }));
    
    const startTime = Date.now();
    
    try {
      let data: BrowseResp;
      let source = "tmdb";
      
      // Tentar usar browse do VETRA primeiro
      try {
        data = await api.browse("popular", page);
        source = "vetra";
      } catch (vetraError) {
        // Fallback para getCategory do TMDb
        console.log(`[api_fallback_used] endpoint=/browse/popular reason=${vetraError} status=fallback`);
        data = await api.getCategory("movie", "popular", page);
      }
      
      const results = (data?.results || []) as ApiMovie[];
      
      // Filtrar apenas itens com poster
      const withPoster = results.filter(m => {
        const hasPoster = m.poster_path || (m as any).image;
        return hasPoster;
      });
      
      // Ordenar por popularity DESC (a API já vem ordenada, mas garantimos)
      const sorted = withPoster.sort((a, b) => {
        const aPop = a.popularity ?? (a as any).popularity ?? 0;
        const bPop = b.popularity ?? (b as any).popularity ?? 0;
        return bPop - aPop;
      });
      
      const filtered = sorted.slice(0, 20);
      
      console.log('[popular_debug] Primeiros 5 após ordenação:', filtered.slice(0, 5).map(m => ({
        id: m.id,
        title: m.title || m.name,
        popularity: m.popularity ?? (m as any).popularity
      })));
      
      // Remover duplicados baseado em skipIds
      const deduplicated = filtered.filter(m => !skipIds.has(`${m.media || "movie"}:${m.id}`));
      
      // Se não temos itens suficientes após dedup, tentar próxima página (máx 3 tentativas)
      let finalItems = deduplicated;
      if (deduplicated.length < 10 && page < 3) {
        const nextPageItems = await loadPopularSection(page + 1, skipIds, false);
        finalItems = [...deduplicated, ...nextPageItems].slice(0, 20);
      } else if (deduplicated.length === 0 && page === 1) {
        // Se não encontrou nada na primeira página, logar
        console.log(`[home_carousel_dedup_skips] section=popular skipped_count=${filtered.length - deduplicated.length}`);
      }
      
      const mapped = mapRows(finalItems as ApiMovie[]);
      setCachedRow(cacheKey, mapped, cacheTTL);
      const duration = Date.now() - startTime;
      console.log(`[home_carousel_loaded] section=popular source=${source} page=${page} items=${mapped.length} duration_ms=${duration} forceRefresh=${forceRefresh}`);
      
      setHomeSections(s => ({
        ...s,
        popularMovies: { items: mapped, loading: false }
      }));
      console.log('[home_sections] Estado popularMovies atualizado com', mapped.length, 'itens');
      return mapped;
    } catch (e: any) {
      const duration = Date.now() - startTime;
      console.error(`[home_carousel_error] section=popular error=${e?.message} duration_ms=${duration}`);
      setHomeSections(s => ({
        ...s,
        popularMovies: { ...s.popularMovies, loading: false, error: e?.message }
      }));
      return [];
    }
  }, [lang]);

  // Removido - agora carregado junto com top_rated para deduplicação

  const normalizeNumber = (value: string): string => {
    return value.replace(',', '.');
  };

  const snapRating = (value: number): number => {
    return Math.round(value * 10) / 10;
  };

  const snapVotes = (value: number): number => {
    return Math.max(0, Math.round(value));
  };

  const logToLinear = (value: number, min: number, max: number): number => {
    const logMin = Math.log10(min || 1);
    const logMax = Math.log10(max);
    const logValue = logMin + (value / 100) * (logMax - logMin);
    return Math.pow(10, logValue);
  };

  const linearToLog = (value: number, min: number, max: number): number => {
    const safeValue = Math.max(min || 1, value);
    const logMin = Math.log10(min || 1);
    const logMax = Math.log10(max);
    const logValue = Math.log10(safeValue);
    return ((logValue - logMin) / (logMax - logMin)) * 100;
  };

  // Sync URL with filters
  const updateURL = useCallback((filters: SearchFilters, term: string, page: number) => {
    const params = new URLSearchParams();
    const defaults = getDefaultFilters();
    if (term) params.set("q", term);
    if (filters.type !== defaults.type) params.set("type", filters.type);
    // Map internal sort to URL param
    if (filters.sort !== defaults.sort) {
      const sortValue = filters.sort === "popularity.desc" ? "rating" : filters.sort;
      params.set("sort", sortValue);
    }
    if (filters.yearGte !== defaults.yearGte && filters.yearGte !== null) params.set("year_gte", String(filters.yearGte));
    if (filters.yearLte !== defaults.yearLte && filters.yearLte !== null) params.set("year_lte", String(filters.yearLte));
    if (filters.voteAvgGte > defaults.voteAvgGte) params.set("vote_avg_gte", String(filters.voteAvgGte));
    if (filters.voteCntGte > defaults.voteCntGte) params.set("vote_cnt_gte", String(filters.voteCntGte));
    if (!filters.withPoster) params.set("with_poster", "false");
    if (page > 1) params.set("page", String(page));
    
    const newURL = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, "", newURL);
  }, []);

  const runSearch = async (query?: string, filters?: SearchFilters, page?: number) => {
    const searchQuery = query !== undefined ? query : searchTerm;
    const hasSearchTerm = searchQuery.trim().length > 0;
    const activeFilters = filters || appliedSearchFilters;
    const currentPage = page !== undefined ? page : searchPage;
    
    // Se o campo de busca estiver vazio, limpar resultados e voltar ao estado padrão
    if (!hasSearchTerm && !hasActiveFilters) {
      setMovies([]);
      setPeople([]);
      setSearchTotalResults(0);
      setHasActiveFilters(false);
      setSearchPage(1);
      // Limpar parâmetros de busca da URL
      const params = new URLSearchParams(window.location.search);
      params.delete("q");
      params.delete("page");
      const newURL = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
      window.history.replaceState({}, "", newURL);
      return;
    }
    
    setLoading(true);
    try {
      // Determine effective sort
      let effectiveSort = activeFilters.sort;
      if (effectiveSort === "relevance" && !hasSearchTerm) {
        effectiveSort = "popularity.desc";
      }
      
      const uiSort = effectiveSort === "popularity.desc" ? "rating" : effectiveSort;
      const yearFrom = activeFilters.yearGte !== null ? activeFilters.yearGte : undefined;
      const yearTo = activeFilters.yearLte !== null ? activeFilters.yearLte : undefined;
      const minVotes = activeFilters.voteCntGte;
      const minRating = activeFilters.voteAvgGte;
      
      // Update URL
      updateURL(activeFilters, searchQuery, currentPage);
      
      if (!hasSearchTerm) {
        // Filter without search term - use discover API
        if (activeFilters.type === "all") {
          const discoverFilters: DiscoverFilters = {
            voteCountGte: minVotes,
            voteAverageGte: minRating > 0 ? minRating : undefined,
            releaseDateFrom: yearFrom ? `${yearFrom}-01-01` : undefined,
            releaseDateTo: yearTo ? `${yearTo}-12-31` : undefined,
            airDateFrom: yearFrom ? `${yearFrom}-01-01` : undefined,
            airDateTo: yearTo ? `${yearTo}-12-31` : undefined,
            sortBy: uiSort === "rating" ? "vote_average.desc" : uiSort === "year" ? "primary_release_date.desc" : "popularity.desc"
          };
          
          const [moviesData, tvData] = await Promise.all([
            discover("movie", discoverFilters, currentPage),
            discover("tv", {
              ...discoverFilters,
              sortBy: uiSort === "rating" ? "vote_average.desc" : uiSort === "year" ? "first_air_date.desc" : "popularity.desc"
            }, currentPage)
          ]);
          
          let allResults = [
            ...(moviesData.results || moviesData.items || []),
            ...(tvData.results || tvData.items || [])
          ];
          
          if (activeFilters.withPoster) {
            allResults = allResults.filter((x: any) => x.poster_path);
          }
          
          // Client-side sorting if needed
          if (uiSort === "rating") {
            allResults.sort((a: any, b: any) => {
              const ratingA = a.vote_average || 0;
              const ratingB = b.vote_average || 0;
              if (ratingB !== ratingA) return ratingB - ratingA;
              const votesA = a.vote_count || 0;
              const votesB = b.vote_count || 0;
              if (votesB !== votesA) return votesB - votesA;
              const yearA = parseInt((a.release_date || a.first_air_date || "").slice(0, 4) || "0");
              const yearB = parseInt((b.release_date || b.first_air_date || "").slice(0, 4) || "0");
              return yearB - yearA;
            });
          } else if (uiSort === "year") {
            allResults.sort((a: any, b: any) => {
              const yearA = parseInt((a.release_date || a.first_air_date || "").slice(0, 4) || "0");
              const yearB = parseInt((b.release_date || b.first_air_date || "").slice(0, 4) || "0");
              if (yearB !== yearA) return yearB - yearA;
              const ratingA = a.vote_average || 0;
              const ratingB = b.vote_average || 0;
              if (ratingB !== ratingA) return ratingB - ratingA;
              const votesA = a.vote_count || 0;
              const votesB = b.vote_count || 0;
              return votesB - votesA;
            });
          }
          
          const mapped = mapRows(allResults);
          setMovies(mapped);
          setPeople([]);
          setSearchTotalResults(mapped.length);
          // Check if we have active filters (non-default)
          const defaults = getDefaultFilters();
          const hasNonDefaultFilters = 
            activeFilters.type !== defaults.type ||
            activeFilters.sort !== defaults.sort ||
            activeFilters.yearGte !== defaults.yearGte ||
            activeFilters.yearLte !== defaults.yearLte ||
            activeFilters.voteAvgGte > defaults.voteAvgGte ||
            activeFilters.voteCntGte > defaults.voteCntGte ||
            activeFilters.withPoster !== defaults.withPoster;
          setHasActiveFilters(hasNonDefaultFilters || hasSearchTerm);
        } else if (activeFilters.type === "movie" || activeFilters.type === "tv") {
          const discoverFilters: DiscoverFilters = {
            voteCountGte: minVotes,
            voteAverageGte: minRating > 0 ? minRating : undefined,
            releaseDateFrom: activeFilters.type === "movie" && yearFrom ? `${yearFrom}-01-01` : undefined,
            releaseDateTo: activeFilters.type === "movie" && yearTo ? `${yearTo}-12-31` : undefined,
            airDateFrom: activeFilters.type === "tv" && yearFrom ? `${yearFrom}-01-01` : undefined,
            airDateTo: activeFilters.type === "tv" && yearTo ? `${yearTo}-12-31` : undefined,
            sortBy: uiSort === "rating" ? "vote_average.desc" : uiSort === "year" ? (activeFilters.type === "movie" ? "primary_release_date.desc" : "first_air_date.desc") : "popularity.desc"
          };
          
          const data = await discover(activeFilters.type, discoverFilters, currentPage);
          let results = data.results || data.items || [];
          
          if (activeFilters.withPoster) {
            results = results.filter((x: any) => x.poster_path);
          }
          
          // Client-side sorting if needed
          if (uiSort === "rating") {
            results.sort((a: any, b: any) => {
              const ratingA = a.vote_average || 0;
              const ratingB = b.vote_average || 0;
              if (ratingB !== ratingA) return ratingB - ratingA;
              const votesA = a.vote_count || 0;
              const votesB = b.vote_count || 0;
              if (votesB !== votesA) return votesB - votesA;
              const yearA = parseInt((a.release_date || a.first_air_date || "").slice(0, 4) || "0");
              const yearB = parseInt((b.release_date || b.first_air_date || "").slice(0, 4) || "0");
              return yearB - yearA;
            });
          } else if (uiSort === "year") {
            results.sort((a: any, b: any) => {
              const yearA = parseInt((a.release_date || a.first_air_date || "").slice(0, 4) || "0");
              const yearB = parseInt((b.release_date || b.first_air_date || "").slice(0, 4) || "0");
              if (yearB !== yearA) return yearB - yearA;
              const ratingA = a.vote_average || 0;
              const ratingB = b.vote_average || 0;
              if (ratingB !== ratingA) return ratingB - ratingA;
              const votesA = a.vote_count || 0;
              const votesB = b.vote_count || 0;
              return votesB - votesA;
            });
          }
          
          const mapped = mapRows(results);
          setMovies(mapped);
          setPeople([]);
          setSearchTotalResults(data.total_results || mapped.length);
          // Check if we have active filters (non-default)
          const defaults = getDefaultFilters();
          const hasNonDefaultFilters = 
            activeFilters.type !== defaults.type ||
            activeFilters.sort !== defaults.sort ||
            activeFilters.yearGte !== defaults.yearGte ||
            activeFilters.yearLte !== defaults.yearLte ||
            activeFilters.voteAvgGte > defaults.voteAvgGte ||
            activeFilters.voteCntGte > defaults.voteCntGte ||
            activeFilters.withPoster !== defaults.withPoster;
          setHasActiveFilters(hasNonDefaultFilters || hasSearchTerm);
        } else if (activeFilters.type === "person") {
          const data = await popularPeople(currentPage, lang);
          let results = data.results || data.items || [];
          
          const filteredResults = results.filter((p: any) => {
            const hasName = p.name && p.name.trim() !== "";
            return hasName;
          });
          
          setMovies([]);
          setPeople(filteredResults);
          setSearchTotalResults(data.total_results || filteredResults.length);
          // Check if we have active filters (non-default)
          const defaults = getDefaultFilters();
          const hasNonDefaultFilters = 
            activeFilters.type !== defaults.type ||
            activeFilters.sort !== defaults.sort ||
            activeFilters.yearGte !== defaults.yearGte ||
            activeFilters.yearLte !== defaults.yearLte ||
            activeFilters.voteAvgGte > defaults.voteAvgGte ||
            activeFilters.voteCntGte > defaults.voteCntGte ||
            activeFilters.withPoster !== defaults.withPoster;
          setHasActiveFilters(hasNonDefaultFilters || hasSearchTerm);
        }
      } else {
        // Search with term
        const filters: { year?: number; minRating?: number } = {};
        if (yearFrom) filters.year = yearFrom;
        if (minRating > 0) filters.minRating = minRating;
        
        // Função para normalizar texto (remover acentos e converter para minúsculas)
        const normalizeText = (text: string): string => {
          if (!text) return "";
          return text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remove acentos
            .trim();
        };
        
        // Função para verificar se um texto contém o termo de busca
        const matchesSearch = (text: string, searchTerm: string): boolean => {
          const normalizedText = normalizeText(text);
          const normalizedSearch = normalizeText(searchTerm);
          return normalizedText.includes(normalizedSearch);
        };
        
        // Coletar todos os filmes/séries já carregados no site para busca local
        const allLocalMovies: any[] = [];
        
        // Adicionar filmes das seções da home
        Object.values(homeRows).forEach((section: any) => {
          if (Array.isArray(section)) {
            section.forEach((item: any) => {
              if (item.items && Array.isArray(item.items)) {
                allLocalMovies.push(...item.items);
              }
            });
          } else if (section.items && Array.isArray(section.items)) {
            allLocalMovies.push(...section.items);
          }
        });
        
        // Adicionar filmes das categorias
        Object.values(cats).forEach((cat: any) => {
          if (cat.items && Array.isArray(cat.items)) {
            allLocalMovies.push(...cat.items);
          }
        });
        
        // Adicionar favoritos
        if (favorites && Array.isArray(favorites)) {
          allLocalMovies.push(...favorites);
        }
        
        // Adicionar filmes das listas
        lists.forEach((list: any) => {
          if (list.items && Array.isArray(list.items)) {
            allLocalMovies.push(...list.items);
          }
        });
        
        // Fazer busca local nos dados já carregados
        const localResults = allLocalMovies.filter((item: any) => {
          const title = item.title || item.name || "";
          return matchesSearch(title, searchQuery);
        });
        
        // Remover duplicatas dos resultados locais (por ID e tipo de mídia)
        const seenIds = new Set<string>();
        const uniqueLocalResults = localResults.filter((item: any) => {
          const mediaType = item.media || item.media_type || "movie";
          const id = `${mediaType}:${item.id}`;
          if (seenIds.has(id)) return false;
          seenIds.add(id);
          return true;
        });
        
        // Buscar na API
        const data = await api.search(searchQuery, currentPage, filters);
        const mixed = (data as any).items || (data as any).results || [];
        
        // Combinar resultados da API com resultados locais, removendo duplicatas
        const apiIds = new Set<string>();
        mixed.forEach((item: any) => {
          const mediaType = item.media_type || item.media || "movie";
          const id = `${mediaType}:${item.id}`;
          apiIds.add(id);
        });
        
        // Adicionar resultados locais que não estão na API
        const additionalLocalResults = uniqueLocalResults.filter((item: any) => {
          const mediaType = item.media || item.media_type || "movie";
          const id = `${mediaType}:${item.id}`;
          return !apiIds.has(id);
        });
        
        // Combinar: resultados da API primeiro, depois resultados locais adicionais
        const combinedResults = [...mixed, ...additionalLocalResults];
      
        let moviesPart = combinedResults.filter((x: any) => {
          const mediaType = x.media_type || x.media;
          if (activeFilters.type === "movie" && mediaType !== "movie") return false;
          if (activeFilters.type === "tv" && mediaType !== "tv") return false;
          if (activeFilters.type === "person" && mediaType !== "person") return false;
          
          if (mediaType === "movie" || mediaType === "tv") {
            if (activeFilters.withPoster && !x.poster_path) return false;
            const hasTitle = (x.title && x.title.trim() !== "") || (x.name && x.name.trim() !== "");
            return hasTitle;
          }
          
          return true;
        });
        
        if (activeFilters.type !== "person") {
          // Apply year filter
          if (yearFrom || yearTo) {
            moviesPart = moviesPart.filter((x: any) => {
              const releaseYear = x.release_date || x.first_air_date;
              if (!releaseYear) return false;
              const year = parseInt(releaseYear.slice(0, 4));
              if (yearFrom && year < yearFrom) return false;
              if (yearTo && year > yearTo) return false;
              return true;
            });
          }
          
          // Apply vote filters
          if (minVotes > 0) {
            moviesPart = moviesPart.filter((x: any) => (x.vote_count || 0) >= minVotes);
          }
          
          if (minRating > 0) {
            moviesPart = moviesPart.filter((x: any) => (x.vote_average || 0) >= minRating);
          }
          
          // Apply sorting
          if (uiSort === "rating") {
            moviesPart.sort((a: any, b: any) => {
              const ratingA = a.vote_average || 0;
              const ratingB = b.vote_average || 0;
              if (ratingB !== ratingA) return ratingB - ratingA;
              const votesA = a.vote_count || 0;
              const votesB = b.vote_count || 0;
              if (votesB !== votesA) return votesB - votesA;
              const yearA = parseInt((a.release_date || a.first_air_date || "").slice(0, 4) || "0");
              const yearB = parseInt((b.release_date || b.first_air_date || "").slice(0, 4) || "0");
              return yearB - yearA;
            });
          } else if (uiSort === "year") {
            moviesPart.sort((a: any, b: any) => {
              const yearA = parseInt((a.release_date || a.first_air_date || "").slice(0, 4) || "0");
              const yearB = parseInt((b.release_date || b.first_air_date || "").slice(0, 4) || "0");
              if (yearB !== yearA) return yearB - yearA;
              const ratingA = a.vote_average || 0;
              const ratingB = b.vote_average || 0;
              if (ratingB !== ratingA) return ratingB - ratingA;
              const votesA = a.vote_count || 0;
              const votesB = b.vote_count || 0;
              return votesB - votesA;
            });
          }
        }
        
        const peoplePart = mixed.filter((x: any) => {
          const mediaType = x.media_type || x.media;
          const isPerson = mediaType === "person" || (x.profile_path && !x.poster_path) || (x.known_for_department && !x.title && !x.name);
          if (!isPerson) return false;
          if (activeFilters.type === "movie" || activeFilters.type === "tv") return false;
          return x.name && x.name.trim() !== "";
        });
  
        const mapped = mapRows(moviesPart);
        setMovies(mapped);
        setPeople(peoplePart);
        setSearchTotalResults((data as any).total_results || (mapped.length + peoplePart.length));
        // Check if we have active filters (non-default)
        const defaults = getDefaultFilters();
        const hasNonDefaultFilters = 
          activeFilters.type !== defaults.type ||
          activeFilters.sort !== defaults.sort ||
          activeFilters.yearGte !== defaults.yearGte ||
          activeFilters.yearLte !== defaults.yearLte ||
          activeFilters.voteAvgGte > defaults.voteAvgGte ||
          activeFilters.voteCntGte > defaults.voteCntGte ||
          activeFilters.withPoster !== defaults.withPoster;
        setHasActiveFilters(hasNonDefaultFilters || hasSearchTerm);
      }
    } catch (e: any) {
      console.error('Search error:', e);
      setMovies([]); 
      setPeople([]);
      pushToast({ message: t("search_fail") || "Erro ao buscar. Tente novamente.", tone: "err" });
    } finally { setLoading(false); }
  };


  // Initial load from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasSearchTerm = params.has("q") && params.get("q")?.trim().length > 0;
    const hasFilterParams = params.has("type") || params.has("sort") || 
                           params.has("year_gte") || params.has("year_lte") || 
                           params.has("vote_avg_gte") || params.has("vote_cnt_gte") || 
                           params.has("with_poster");
    const hasPageParam = params.has("page");
    
    // If URL has search term or filter params, run search
    // (state is already initialized from URL in useState initializers)
    if (hasSearchTerm || hasFilterParams || hasPageParam) {
      // Check if filters differ from defaults (state is already set from URL)
      const defaults = getDefaultFilters();
      const hasNonDefaultFilters = 
        appliedSearchFilters.type !== defaults.type ||
        appliedSearchFilters.sort !== defaults.sort ||
        appliedSearchFilters.yearGte !== defaults.yearGte ||
        appliedSearchFilters.yearLte !== defaults.yearLte ||
        appliedSearchFilters.voteAvgGte > defaults.voteAvgGte ||
        appliedSearchFilters.voteCntGte > defaults.voteCntGte ||
        appliedSearchFilters.withPoster !== defaults.withPoster;
      
      const shouldRunSearch = hasSearchTerm || hasNonDefaultFilters || hasPageParam;
      
      if (shouldRunSearch) {
        // Run search with URL params (state is already initialized from URL)
        runSearch(searchTerm, appliedSearchFilters, searchPage);
        setHasActiveFilters(hasNonDefaultFilters || hasSearchTerm);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - state is initialized from URL synchronously

  // Debounced search for text input only (not for filters)
  useEffect(() => {
    if (searchTerm.trim().length === 0 && !hasActiveFilters) {
      // Clear results when no search term and no filters
      const defaults = getDefaultFilters();
      const hasNonDefaultFilters = 
        appliedSearchFilters.type !== defaults.type ||
        appliedSearchFilters.sort !== defaults.sort ||
        appliedSearchFilters.yearGte !== defaults.yearGte ||
        appliedSearchFilters.yearLte !== defaults.yearLte ||
        appliedSearchFilters.voteAvgGte > defaults.voteAvgGte ||
        appliedSearchFilters.voteCntGte > defaults.voteCntGte ||
        appliedSearchFilters.withPoster !== defaults.withPoster;
      
      if (!hasNonDefaultFilters) {
        setMovies([]);
        setPeople([]);
        setHasActiveFilters(false);
        setSearchTotalResults(0);
        return;
      }
    }

    const tmo = setTimeout(() => {
      if (searchTerm.trim().length > 0) {
        // Only auto-search when there's text (debounced)
        runSearch(searchTerm, appliedSearchFilters, 1);
        setSearchPage(1);
      }
    }, 400);
    return () => clearTimeout(tmo);
  }, [searchTerm, lang]);
  
  // Handlers for filter panel
  const handleApplyFilters = useCallback((filters: SearchFilters) => {
    setAppliedSearchFilters(filters);
    setSearchPage(1);
    runSearch(searchTerm, filters, 1);
    // Removido scroll automático para o topo
  }, [searchTerm]);

  const handleClearAllFilters = useCallback(() => {
    const defaults = getDefaultFilters();
    // Adjust sort based on search term
    if (!searchTerm.trim() && defaults.sort === "relevance") {
      defaults.sort = "popularity.desc";
    }
    setAppliedSearchFilters(defaults);
    setSearchPage(1);
    runSearch(searchTerm, defaults, 1);
    // Removido scroll automático para o topo
  }, [searchTerm]);

  const handleRemoveFilter = useCallback((key: keyof SearchFilters) => {
    const newFilters = { ...appliedSearchFilters };
    const defaults = getDefaultFilters();
    
    // Reset the specific filter to default
    if (key === "yearGte" || key === "yearLte") {
      // Handle year range specially - reset both if removing one
      newFilters.yearGte = defaults.yearGte;
      newFilters.yearLte = defaults.yearLte;
    } else {
      (newFilters as any)[key] = (defaults as any)[key];
    }
    
    // Adjust sort if needed
    if (key === "sort" && !searchTerm.trim() && newFilters.sort === "relevance") {
      newFilters.sort = "popularity.desc";
    }
    
    setAppliedSearchFilters(newFilters);
    setSearchPage(1);
    runSearch(searchTerm, newFilters, 1);
  }, [appliedSearchFilters, searchTerm]);
  
  // Apply filters when they change (manual trigger via Apply button)
  // This effect is intentionally minimal - filters are applied via onApply callback

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
  
  // Função wrapper para setActiveTab que intercepta quando está na página de edição
  const handleTabChange = (newTab: TabKey) => {
    const isOnEditProfile = location.pathname === "/profile/edit" || location.pathname === "/edit-profile";
    const isOnViewProfile = location.pathname === "/profile" || location.pathname === "/me";
    
    // Se está apenas visualizando o perfil, permitir navegação normal
    if (isOnViewProfile) {
      setActiveTab(newTab);
      navigate("/");
      return;
    }
    
    // Se está na página de edição e há alterações, mostrar modal de confirmação
    if (isOnEditProfile && editProfileHasChanges) {
      setPendingTabChange(newTab);
      setPendingCategoryChange(null);
      setShowExitEditProfileConfirm(true);
      return; // Importante: retornar para não executar o código abaixo
    }
    
    // Caso contrário, mudar o tab normalmente
    setActiveTab(newTab);
    // Se estava na página de edição (sem alterações), navegar de volta
    if (isOnEditProfile) {
      navigate("/");
    }
  };

  // Função wrapper para setActiveCategory que intercepta quando está na página de edição
  const handleCategoryChange = (newCategory: "movies" | "tv" | "people" | "home") => {
    const isOnEditProfile = location.pathname === "/profile/edit" || location.pathname === "/edit-profile";
    const isOnViewProfile = location.pathname === "/profile" || location.pathname === "/me";
    
    // Se está apenas visualizando o perfil, permitir navegação normal
    if (isOnViewProfile) {
      setActiveCategory(newCategory);
      navigate("/");
      return;
    }
    
    // Se está na página de edição e há alterações, mostrar modal de confirmação
    if (isOnEditProfile && editProfileHasChanges) {
      setPendingTabChange(null);
      setPendingCategoryChange(newCategory);
      setShowExitEditProfileConfirm(true);
      return; // Importante: retornar para não executar o código abaixo
    }
    
    // Caso contrário, mudar a categoria normalmente
    setActiveCategory(newCategory);
    // Se estava na página de edição (sem alterações), navegar de volta
    if (isOnEditProfile) {
      navigate("/");
    }
  };

  // Função para confirmar saída da página de edição
  const confirmExitEditProfile = () => {
    setShowExitEditProfileConfirm(false);
    setEditProfileHasChanges(false);
    
    // Aplicar mudanças pendentes
    if (pendingTabChange) {
      setActiveTab(pendingTabChange);
      setPendingTabChange(null);
    }
    if (pendingCategoryChange) {
      setActiveCategory(pendingCategoryChange);
      setPendingCategoryChange(null);
    }
    
    // Navegar de volta
    navigate("/");
  };

  // Função para cancelar saída da página de edição
  const cancelExitEditProfile = () => {
    setShowExitEditProfileConfirm(false);
    setPendingTabChange(null);
    setPendingCategoryChange(null);
  };

  // Salvar estado de navegação no localStorage
  useEffect(() => { 
    try { 
      localStorage.setItem('vetra:activeTab', activeTab); 
    } catch {} 
  }, [activeTab]);
  useEffect(() => { 
    try { 
      localStorage.setItem('vetra:activeCategory', activeCategory); 
    } catch {} 
  }, [activeCategory]);


  const toggleFavorite = (movie: MovieT, skipConfirm = false) => {
    if (!isLoggedIn) { 
      setPendingAction(() => () => toggleFavorite(movie, skipConfirm));
      setShowActionSheet(true);
      return; 
    }
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
    pushToast({ message: wasFav ? "Removido dos favoritos" : "Adicionado aos favoritos ✔", tone: "ok" });
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
    if (!isLoggedIn || (favorites.length === 0 && Object.keys(userStates).length === 0)) {
      return [];
    }
    
    const favoriteGenres = new Map<string, number>();
    const favoriteIds = new Set<string>();
    
    favorites.forEach((m) => {
      favoriteIds.add(mediaKey(m));
      const genres = (m as any).genres || [];
      genres.forEach((g: any) => {
        favoriteGenres.set(g.name || g, (favoriteGenres.get(g.name || g) || 0) + 1);
      });
    });
    
    Object.values(userStates).forEach((meta) => {
      if (meta.rating && meta.rating >= 7) {
        const movie = meta.movieCache;
        if (movie && movie.id) {
          favoriteIds.add(`${movie.media || "movie"}:${movie.id}`);
        }
      }
    });
    
    const allItems = [
      ...(cats.trending?.items || []),
      ...(cats.popular?.items || []),
      ...(cats.top_rated?.items || []),
    ];
    
    const scored = allItems
      .filter((m) => {
        const key = mediaKey(m);
        if (favoriteIds.has(key)) return false;
        return true;
      })
      .map((m) => {
        let score = 0;
        const genres = (m as any).genres || [];
        genres.forEach((g: any) => {
          score += favoriteGenres.get(g.name || g) || 0;
        });
        if (favorites.some((f) => {
          const fGenres = (f as any).genres || [];
          return fGenres.some((fg: any) => genres.some((g: any) => (g.name || g) === (fg.name || fg)));
        })) {
          score += 2;
        }
        return { movie: m, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(({ movie }) => movie);
    
    if (scored.length < 10) {
      const fallback = cats.popular?.items?.slice(0, 20 - scored.length) || [];
      return [...scored, ...fallback].slice(0, 20);
    }
    
    return scored;
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
      
   
      const movieCache: {
        id: number;
        title: string;
        poster_path?: string;
        image?: string;
        year?: string;
        media: MediaT;
      } = {
        id: m.id,
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
    const newList: UserList = {
      id,
      name,
      items: [],
      cover: undefined, // Sem capa inicial - será definida quando adicionar o primeiro item
      updatedAt: new Date().toISOString(),
    };
    
    setLists((prev) => [...prev, newList]);
    pushToast({ message: t("created_list_ok", { name }), tone: "ok" });
    return id;
  };

  const handleCoverSelect = async (cover: {
    type: "none" | "first_item" | "item" | "upload" | "tmdb";
    itemId?: string;
    url?: string;
  }, listName?: string) => {
    if (coverSelectorListId === "new") {
      // Criar nova lista (sem capa inicial - será definida quando adicionar o primeiro item)
      const name = listName || `Minha lista ${lists.length + 1}`;
      const id = createList(name);
      setActiveListId(id);
      setShowCoverSelector(false);
      setCoverSelectorListId(null);
      return;
    }

    if (!coverSelectorListId) return;

    const listId = coverSelectorListId;
    
    try {
      if (cover.type === "none") {
        await setListCover(listId, "auto");
        pushToast({ message: "Capa removida", tone: "ok" });
      } else if (cover.type === "first_item") {
        // Aplicar quando o primeiro item for adicionado
        setLists((prev) =>
          prev.map((l) =>
            l.id === listId
              ? { ...l, cover: { type: "auto" }, updatedAt: new Date().toISOString() }
              : l
          )
        );
        pushToast({ message: "Capa será definida automaticamente pelo primeiro item", tone: "ok" });
      } else if (cover.type === "item" && cover.itemId) {
        console.log("[handleCoverSelect] Definindo capa:", { listId, itemId: cover.itemId });
        const result = await setListCover(listId, "item", cover.itemId);
        console.log("[handleCoverSelect] Resultado:", result);
        
        // Forçar atualização do estado para garantir que a lista seja recalculada
        setLists((prev) => {
          const updated = prev.map((l) => {
            if (l.id === listId) {
              console.log("[handleCoverSelect] Lista antes:", l.cover);
              // Se o resultado foi bem-sucedido, garantir que a capa está atualizada
              if (result?.success !== false) {
                return {
                  ...l,
                  updatedAt: new Date().toISOString(),
                };
              }
            }
            return l;
          });
          const updatedList = updated.find(l => l.id === listId);
          console.log("[handleCoverSelect] Lista depois:", updatedList?.cover);
          return updated;
        });
        
        if (result?.success !== false) {
        pushToast({ message: "Capa definida", tone: "ok" });
        } else {
          pushToast({ message: result?.error || "Erro ao definir capa", tone: "err" });
        }
      } else if (cover.type === "upload" && cover.url) {
        await setListCover(listId, "upload", undefined, cover.url);
        pushToast({ message: "Capa atualizada", tone: "ok" });
      }
    } catch (error: any) {
      pushToast({ message: error?.message || "Erro ao definir capa", tone: "err" });
    }
    
    setShowCoverSelector(false);
    setCoverSelectorListId(null);
  };
  const addToList = async (listId: string, movie: MovieT) => {
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
              // Se não tem capa e está adicionando o primeiro item, definir como capa
              cover: (!l.cover && l.items.length === 0) 
                ? { type: "item", itemId: mediaKey(movie) }
                : l.cover,
              updatedAt: new Date().toISOString(),
            }
          : l
      )
    );
    
    // Sincronizar com a API se o usuário estiver logado
    if (isLoggedIn && user?.email) {
      try {
        await api.addListItem(user.email, listId, {
          id: movie.id,
          title: movie.title,
          image: movie.image || movie.poster_path,
          rating: movie.rating,
          year: movie.year,
          media: movie.media || "movie",
        });
      } catch (error) {
        console.error("[addToList] Erro ao sincronizar com API:", error);
        // Continua mesmo se falhar
      }
    }
    
    // Se a lista não tinha capa e agora tem o primeiro item, atualizar via API
    const list = lists.find(l => l.id === listId);
    if (list && !list.cover && list.items.length === 0) {
      setListCover(listId, "item", mediaKey(movie)).catch(() => {
        // Se falhar, apenas atualiza localmente
      });
    }
    pushToast({ message: t("added_list_ok"), tone: "ok" });
  };
  const removeFromList = async (listId: string, movieId: number, media?: MediaT) => {
    const itemKey = mediaKey({ id: movieId, media: media || "movie" } as MovieT);
    
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== listId) return l;
        
        const wasCover = l.cover?.type === "item" && (l.cover.itemId === itemKey || l.cover.itemId === String(movieId));
        
        const newItems = l.items.filter((m) => !(m.id === movieId && (m.media || "movie") === (media || "movie")));
        
        // Se o item removido era a capa, definir fallback (primeiro item ou undefined)
        let newCover = l.cover;
        if (wasCover) {
          if (newItems.length > 0) {
            // Usar o primeiro item como capa
            const firstItemKey = mediaKey(newItems[0]);
            newCover = { type: "item", itemId: firstItemKey };
            // Atualizar a capa via API também
            setListCover(listId, "item", firstItemKey).catch(() => {
              // Se falhar, apenas atualiza localmente
            });
          } else {
            // Lista vazia, remover capa
            newCover = undefined;
            setListCover(listId, "auto").catch(() => {
              // Se falhar, apenas atualiza localmente
            });
          }
        }
        
        return {
          ...l,
          items: newItems,
          cover: newCover,
          updatedAt: new Date().toISOString(),
        };
      })
    );
    
    // Sincronizar com a API se o usuário estiver logado
    if (isLoggedIn && user?.email) {
      try {
        await api.removeListItem(user.email, listId, itemKey);
      } catch (error) {
        console.error("[removeFromList] Erro ao sincronizar com API:", error);
        // Continua mesmo se falhar
      }
    }
    
    pushToast({ message: t("removed_list_ok"), tone: "ok" });
  };
  const renameList = (listId: string, newName: string) => {
    setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, name: newName, updatedAt: new Date().toISOString() } : l)));
    pushToast({ message: t("renamed_list_ok", { name: newName }), tone: "ok" });
  };
  const clearList = (listId: string) => {
    setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, items: [], cover: undefined, updatedAt: new Date().toISOString() } : l)));
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
  }, []); 

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
  }, []);
  
 
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);
  
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

  const validatePasswordInRealTime = () => {
    const errors: string[] = [];
    const pwd = formData.password;
    const fullName = formData.lastName?.trim() 
      ? `${formData.firstName.trim()} ${formData.lastName.trim()}`
      : formData.firstName.trim();
    const email = formData.email.trim().toLowerCase();
    
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
  };
  
  const validateEmailInRealTime = (email: string) => {
    if (!email) {
      setEmailError("");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setEmailError("Informe um e-mail válido");
    } else {
      setEmailError("");
    }
  };

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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações do cadastro
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
        
        // Executar ação pendente após login bem-sucedido
        if (pendingAction) {
          setTimeout(() => {
            pendingAction();
            setPendingAction(null);
            pushToast({ message: "Ação concluída!", tone: "ok" });
          }, 300);
        }
        
        setShowLogin(false);
        
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


  // Verificar sessão persistente ao carregar a aplicação
  useEffect(() => {
    const checkPersistedSession = async () => {
      try {
        const idToken = localStorage.getItem('vetra:idToken');
        const lastEmail = localStorage.getItem('vetra:last_email');
        
        if (idToken && lastEmail) {
          console.log("[checkPersistedSession] Token encontrado, verificando sessão...");
          
          // Verificar se o token ainda é válido
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
            // Carregar perfil completo
            await loadProfile(verifyResult.user.email || lastEmail);
          } else {
            console.log("[checkPersistedSession] Token inválido ou expirado, limpando...");
            // Limpar tokens inválidos
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
        // Em caso de erro, limpar tokens e manter usuário deslogado
        localStorage.removeItem('vetra:idToken');
        localStorage.removeItem('vetra:refreshToken');
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        // Sempre marcar como finalizado a verificação, mesmo em caso de erro
        setIsCheckingSession(false);
      }
    };
    
    // Executar verificação apenas uma vez ao montar
    checkPersistedSession();
  }, []); // Array vazio = executa apenas uma vez ao montar

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
    // Removido scroll automático para o topo
  };

  const navigateWithAuth = (route: string, requiresAuth: boolean = false) => {
    if (requiresAuth && !isLoggedIn) {
      setPendingRoute(route);
      setShowLogin(true);
      setLoginType("signin");
      return;
    }
    navigate(route);
  };

  const handleFooterLink = (action: () => void, route: string | null = null, requiresAuth: boolean = false) => {
    if (requiresAuth && !isLoggedIn) {
      if (route) {
        setPendingRoute(route);
      }
      setShowLogin(true);
      setLoginType("signin");
      return;
    }
    action();
  };


  const MovieCard: React.FC<{ movie: MovieT }> = ({ movie }) => {
    const [isAnimating, setIsAnimating] = useState<string | null>(null);
    const openDetails = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      const mediaType = (movie.media || "movie") as "movie" | "tv";
      const path = `/${mediaType}/${movie.id}`;
      navigate(path);
    };

    const handleFav = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isLoggedIn) {
        setPendingAction(() => () => {
          setIsAnimating("fav");
          setTimeout(() => setIsAnimating(null), 150);
          toggleFavorite(movie, true);
        });
        setShowActionSheet(true);
        return;
      }
      setIsAnimating("fav");
      setTimeout(() => setIsAnimating(null), 150);
      toggleFavorite(movie, true);
    };

    const handleAddToList = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isLoggedIn) {
        setPendingAction(() => () => setShowListPickerFor(movie));
        setShowActionSheet(true);
        return;
      }
      setShowListPickerFor(movie);
    };

    const handleCollection = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isLoggedIn) {
        setPendingAction(() => () => {
          setShowCollectionPickerFor(movie);
          setIsAnimating("collection");
          setTimeout(() => setIsAnimating(null), 150);
          if (!getUserMeta(movie).state) {
            pushToast({ 
              message: "Salvo em coleção ✔", 
              tone: "ok" 
            });
          }
        });
        setShowActionSheet(true);
        return;
      }
      setShowCollectionPickerFor(movie);
      setIsAnimating("collection");
      setTimeout(() => setIsAnimating(null), 150);
      if (!getUserMeta(movie).state) {
        pushToast({ 
          message: "Salvo em coleção ✔", 
          tone: "ok" 
        });
      }
    };

    const score = typeof movie.rating === "number" ? Math.round((movie.rating + Number.EPSILON) * 10) / 10 : null;
    const meta = getUserMeta(movie);
    const hasPoster = movie.image || movie.poster_path;
    const isWatched = meta?.state === "watched";
    const isFavoriteMovie = isFavorite(movie);
    const hasCollectionState = !!getUserMeta(movie).state;

    return (
      <div 
        onClick={openDetails} 
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetails(); } }}
        role="button"
        tabIndex={0}
        className={`group relative text-left w-full select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 rounded-[16px] sm:rounded-[20px] ${isWatched ? "ring-2 ring-green-500/50" : ""}`}
        title={movie.title}
      >
        <div className="relative rounded-[16px] sm:rounded-[20px] overflow-hidden bg-slate-900/70 backdrop-blur-sm border border-slate-800/50 dark:border-slate-700/50 shadow-sm hover:shadow-lg transition-shadow duration-300">
          <div className="relative w-full" style={{ aspectRatio: "2/3" }}>
            {hasPoster ? (
              <img 
                src={movie.image || poster(movie.poster_path)} 
                alt={movie.title} 
                className="w-full h-full object-cover" 
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const placeholder = target.nextElementSibling as HTMLElement;
                  if (placeholder) placeholder.style.display = "flex";
                }}
              />
            ) : null}
            <div 
              className={`absolute inset-0 bg-slate-800 flex items-center justify-center ${hasPoster ? "hidden" : "flex"}`}
            >
              <Film size={32} className="text-slate-600 dark:text-slate-500" />
            </div>
            
            {isWatched && (
              <div 
                className="absolute bottom-2 right-2 w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] rounded-full bg-green-500/90 backdrop-blur-sm flex items-center justify-center shadow-lg ring-2 ring-white/30"
                title="Assistido"
                aria-label="Assistido"
              >
                <Check size={12} className="sm:w-[14px] sm:h-[14px] text-white" strokeWidth={3} />
              </div>
            )}
            
            {score !== null && (
              <div className="absolute top-2 left-2 z-10">
                <div className="flex items-center gap-0.5 rounded-full bg-black/80 backdrop-blur-sm px-1.5 py-0.5 text-xs font-semibold ring-1 ring-white/20">
                  <Star size={12} className="shrink-0" color="#FFD700" fill="#FFD700" />
                  <span className="tabular-nums text-white">{score}</span>
                </div>
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 md:hidden">
              <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-8 pb-2 px-2">
                <div className="flex gap-2 justify-center items-center">
                  <button
                    onClick={handleAddToList}
                    className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white flex items-center justify-center transition-all duration-150 border border-white/30 hover:border-cyan-400/70 touch-manipulation active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    title="Mais opções"
                    aria-label="Mais opções"
                  >
                    <ListIcon size={18} />
                  </button>
                  <button
                    onClick={handleFav}
                    className={`min-w-[44px] min-h-[44px] w-11 h-11 rounded-full flex items-center justify-center transition-all duration-150 border touch-manipulation active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                      isFavoriteMovie
                        ? "bg-white/20 hover:bg-white/30 text-red-400 border-white/30 hover:border-red-400/70"
                        : "bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-cyan-400/70"
                    } ${isAnimating === "fav" ? "animate-bounce" : ""}`}
                    title={isFavoriteMovie ? "Remover dos favoritos" : "Favoritar"}
                    aria-label={isFavoriteMovie ? "Remover dos favoritos" : "Favoritar"}
                  >
                    <Heart size={18} fill={isFavoriteMovie ? "currentColor" : "none"} />
                  </button>
                  <button
                    onClick={handleCollection}
                    className={`min-w-[44px] min-h-[44px] w-11 h-11 rounded-full backdrop-blur-sm text-white flex items-center justify-center transition-all duration-150 border touch-manipulation active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                      hasCollectionState
                        ? "bg-cyan-500/40 hover:bg-cyan-500/50 border-cyan-400/70"
                        : "bg-white/20 hover:bg-white/30 border-white/30 hover:border-cyan-400/70"
                    } ${isAnimating === "collection" ? "animate-bounce" : ""}`}
                    title="Salvar em coleção"
                    aria-label="Salvar em coleção"
                  >
                    <Bookmark size={18} fill={hasCollectionState ? "currentColor" : "none"} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-2 sm:p-3 flex flex-col bg-slate-900/70">
            <h3 className="font-semibold text-white leading-tight line-clamp-2 mb-1.5 text-sm sm:text-base min-h-[2.5em] sm:min-h-[3em]">
              {movie.title}
            </h3>
            <div className="text-[12px] sm:text-[13px] text-gray-400 flex items-center gap-1 line-clamp-1 min-h-[1.25em] mb-2">
              {movie.year ? <span>{movie.year}</span> : <span>—</span>}
              {movie.voteCount && movie.year && <span>•</span>}
              {movie.voteCount && <span>({movie.voteCount.toLocaleString('pt-BR')})</span>}
            </div>
            
            <div className="hidden md:flex gap-2 sm:gap-3 justify-center min-h-[36px] sm:min-h-[44px] items-center">
              <button
                onClick={handleAddToList}
                className="min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px] w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-slate-300 dark:text-slate-400 hover:text-white flex items-center justify-center transition-all duration-150 border border-white/20 hover:border-cyan-400/50 touch-manipulation active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                title="Mais opções"
                aria-label="Mais opções"
              >
                <ListIcon size={16} className="sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={handleFav}
                className={`min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px] w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-150 border touch-manipulation active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                  isFavoriteMovie
                    ? "bg-white/10 hover:bg-white/20 text-red-400 border-white/20 hover:border-red-400/50"
                    : "bg-white/10 hover:bg-white/20 text-slate-300 dark:text-slate-400 hover:text-white border-white/20 hover:border-cyan-400/50"
                } ${isAnimating === "fav" ? "animate-bounce" : ""}`}
                title={isFavoriteMovie ? "Remover dos favoritos" : "Favoritar"}
                aria-label={isFavoriteMovie ? "Remover dos favoritos" : "Favoritar"}
              >
                <Heart size={16} className="sm:w-5 sm:h-5" fill={isFavoriteMovie ? "currentColor" : "none"} />
              </button>
              <button
                onClick={handleCollection}
                className={`min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px] w-9 h-9 sm:w-11 sm:h-11 rounded-full backdrop-blur-sm text-white flex items-center justify-center transition-all duration-150 border touch-manipulation active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                  hasCollectionState
                    ? "bg-cyan-500/30 hover:bg-cyan-500/40 border-cyan-400/50"
                    : "bg-white/10 hover:bg-white/20 text-slate-300 dark:text-slate-400 hover:text-white border-white/20 hover:border-cyan-400/50"
                } ${isAnimating === "collection" ? "animate-bounce" : ""}`}
                title="Salvar em coleção"
                aria-label="Salvar em coleção"
              >
                <Bookmark size={16} className="sm:w-5 sm:h-5" fill={hasCollectionState ? "currentColor" : "none"} />
              </button>
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
    const [commentError, setCommentError] = useState<string>("");
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const ratingChipsRef = useRef<HTMLDivElement>(null);
    const [activeMediaTab, setActiveMediaTab] = useState<"videos" | "backdrops" | "posters">("videos");
    const [openAccordions, setOpenAccordions] = useState<Set<string>>(() => {
      if (typeof window !== "undefined" && window.innerWidth >= 897) {
        return new Set(["sobre", "creditos"]);
      }
      return new Set(["sobre"]);
    });
    const [activeTab, setActiveTab] = useState<"sobre" | "info" | "elenco" | "episodios" | "reviews">("sobre");
    const [synopsisExpanded, setSynopsisExpanded] = useState(false);
    const [showDock, setShowDock] = useState(false);
    const [commentsToShow, setCommentsToShow] = useState(3);
    
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
    
    const toggleAccordion = (key: string) => {
      setOpenAccordions(prev => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        return next;
      });
    };
    
    const getCountryCode = (countryName: string): string => {
      const codes: Record<string, string> = {
        "United States of America": "US",
        "United States": "US",
        "Brazil": "BR",
        "United Kingdom": "GB",
        "France": "FR",
        "Germany": "DE",
        "Spain": "ES",
        "Italy": "IT",
        "Canada": "CA",
        "Australia": "AU",
        "Japan": "JP",
        "China": "CN",
        "India": "IN",
        "Mexico": "MX",
        "Argentina": "AR",
      };
      return codes[countryName] || countryName.substring(0, 3).toUpperCase();
    };
    
    const getCountryFlag = (countryName: string): string => {
      const flags: Record<string, string> = {
        "United States of America": "🇺🇸",
        "United States": "🇺🇸",
        "Brazil": "🇧🇷",
        "United Kingdom": "🇬🇧",
        "France": "🇫🇷",
        "Germany": "🇩🇪",
        "Spain": "🇪🇸",
        "Italy": "🇮🇹",
        "Canada": "🇨🇦",
        "Australia": "🇦🇺",
        "Japan": "🇯🇵",
        "China": "🇨🇳",
        "India": "🇮🇳",
        "Mexico": "🇲🇽",
        "Argentina": "🇦🇷",
      };
      return flags[countryName] || "🌍";
    };
    
    const formatDateShort = (dateStr: string | Date): string => {
      if (!dateStr) return "";
      const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
      return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
    };

  
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


    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        const newHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 72), 192);
        textareaRef.current.style.height = `${newHeight}px`;
      }
    }, [newCommentText]);

    useEffect(() => {
      const handleScroll = () => {
        const modalContent = document.querySelector('.bg-white.dark\\:bg-gray-900.rounded-lg.max-w-6xl');
        if (modalContent) {
          const scrollTop = modalContent.scrollTop || 0;
          setShowDock(scrollTop > 200);
        } else {
          setShowDock(window.scrollY > 200);
        }
      };
      const modalContent = document.querySelector('.bg-white.dark\\:bg-gray-900.rounded-lg.max-w-6xl');
      if (modalContent) {
        modalContent.addEventListener('scroll', handleScroll);
        return () => modalContent.removeEventListener('scroll', handleScroll);
      } else {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
      }
    }, []);

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setNewCommentText(e.target.value);
      setCommentError("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        const newHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 72), 192);
        textareaRef.current.style.height = `${newHeight}px`;
      }
    };

    const handleCreateComment = async () => {
      if (!isLoggedIn) {
        setCommentError("Você precisa estar logado para comentar");
        setShowLogin(true);
        return;
      }
      if (!newCommentText.trim()) {
        setCommentError("Digite um comentário");
        return;
      }
      if (newCommentText.trim().length > 500) {
        setCommentError("Comentário muito longo (máx. 500 caracteres)");
        return;
      }
      if (!mediaType || !id) return;
      
      const movieId = parseInt(id);
      if (isNaN(movieId)) return;

      // Capturar posição de scroll ANTES de qualquer ação para evitar scroll automático
      const savedScrollY = window.scrollY;
      const savedScrollX = window.scrollX;
      
      // Prevenir scroll IMEDIATAMENTE antes de qualquer setState
      let scrollLocked = true;
      const scrollHandler = (e: Event) => {
        if (scrollLocked) {
          e.preventDefault();
          e.stopPropagation();
          window.scrollTo({ top: savedScrollY, left: savedScrollX, behavior: "auto" });
          return false;
        }
      };
      
      // Adicionar listener ANTES de qualquer setState
      window.addEventListener("scroll", scrollHandler, { passive: false, capture: true });
      window.addEventListener("wheel", scrollHandler, { passive: false, capture: true });
      window.addEventListener("touchmove", scrollHandler, { passive: false, capture: true });
      
      // Forçar posição imediatamente
      window.scrollTo({ top: savedScrollY, left: savedScrollX, behavior: "auto" });
      
      setSubmittingComment(true);
      setCommentError("");
      
      try {
        const result = await createComment(mediaType, movieId, newCommentText.trim(), newCommentRating);
        
        // Manter scroll bloqueado durante atualização de estado
        window.scrollTo({ top: savedScrollY, left: savedScrollX, behavior: "auto" });
        
        if (result.ok && result.comment) {
          setComments([result.comment, ...comments]);
          setNewCommentText("");
          setNewCommentRating(undefined);
          if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
          }
          pushToast({ message: "Comentário publicado", tone: "ok" });
        } else {
          const errorMsg = result.error || "Não foi possível publicar agora. Tente novamente.";
          if (errorMsg.includes("rápido") || errorMsg.includes("rate limit")) {
            setCommentError("Você comentou muito rápido. Tente novamente em alguns segundos.");
          } else {
            setCommentError(errorMsg);
          }
        }
      } finally {
        setSubmittingComment(false);
        
        // Manter scroll bloqueado por mais tempo para garantir que não role
        setTimeout(() => {
          window.scrollTo({ top: savedScrollY, left: savedScrollX, behavior: "auto" });
        }, 0);
        
        setTimeout(() => {
          window.scrollTo({ top: savedScrollY, left: savedScrollX, behavior: "auto" });
        }, 50);
        
        setTimeout(() => {
          window.scrollTo({ top: savedScrollY, left: savedScrollX, behavior: "auto" });
          scrollLocked = false;
          window.removeEventListener("scroll", scrollHandler, { capture: true });
          window.removeEventListener("wheel", scrollHandler, { capture: true });
          window.removeEventListener("touchmove", scrollHandler, { capture: true });
        }, 300);
      }
    };

    const toggleCommentExpand = (commentId: string) => {
      setExpandedComments(prev => {
        const next = new Set(prev);
        if (next.has(commentId)) {
          next.delete(commentId);
        } else {
          next.add(commentId);
        }
        return next;
      });
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

    const handleShareMovie = async () => {
      try {
        if (!selectedMovie) return;
        const payload = [{
          id: selectedMovie.id,
          media: (selectedMovie.media || d?.media || "movie") as "movie" | "tv",
          title: selectedMovie.title,
          poster_path: selectedMovie.poster_path || d?.poster_path || "",
          vote_average: d?.vote_average ?? null,
          vote_count: d?.vote_count ?? null,
          release_date: d?.release_date || null,
          overview: selectedMovie.overview || d?.overview || ""
        }];
        const resp = await api.shareCreate(payload, "favorites", selectedMovie.title);
        if (!resp || !resp.slug) {
          throw new Error("Resposta inválida do servidor");
        }
        setShareSlug(resp.slug || (resp.code ? resp.code.replace(/V9-|-/g, "").slice(0, 10) : ""));
        setShowShare(true);
      } catch (e: any) {
        const errorMsg = e?.message || "Erro ao compartilhar";
        pushToast({ message: errorMsg, tone: "err" });
      }
    };

    const handleRateMovie = () => {
      if (!isLoggedIn) {
        setShowLogin(true);
        return;
      }
      const rating = prompt("Digite sua nota de 1 a 10:");
      if (rating) {
        const numRating = parseFloat(rating);
        if (numRating >= 1 && numRating <= 10) {
          pushToast({ message: `Você avaliou com ${numRating}/10`, tone: "ok" });
        } else {
          pushToast({ message: "Nota inválida. Use um valor entre 1 e 10.", tone: "err" });
        }
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
            <div className="relative w-full max-h-[40vh] sm:max-h-[35vh] md:max-h-[400px] overflow-hidden" style={{ aspectRatio: "16/9" }}>
              <img 
                src={d?.backdrop_path ? `https://image.tmdb.org/t/p/w1280${d.backdrop_path}` : (selectedMovie.image || poster(selectedMovie.poster_path))} 
                alt={selectedMovie.title} 
                className="w-full h-full object-cover"
                style={{ 
                  objectPosition: 'center 30%',
                  minHeight: '100%',
                  minWidth: '100%'
                }}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 to-transparent dark:from-gray-900 dark:via-gray-900/60" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/98 to-transparent dark:from-gray-900 dark:via-gray-900/98 p-3 sm:p-4 md:p-6">
              <button 
                onClick={() => navigate(-1)} 
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-[100] min-h-[44px] flex items-center gap-2 bg-black/80 dark:bg-black/80 backdrop-blur-md px-3 sm:px-4 py-2 rounded-full hover:bg-black/90 active:bg-black transition shadow-lg touch-manipulation group" 
                aria-label="Voltar para filmes"
              >
                <ChevronLeft size={20} className="sm:w-6 sm:h-6 text-white" />
                <span className="text-white text-sm font-medium hidden sm:inline group-hover:text-cyan-300 transition-colors">
                  Voltar
                </span>
              </button>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2 break-words leading-tight">
                {selectedMovie.title} {selectedMovie.year ? `(${selectedMovie.year})` : ""}
              </h2>
              <div className="mb-3 overflow-x-auto -mx-3 px-3 pb-2 scrollbar-hide">
                <div className="flex gap-2 min-w-max">
                  {d?.certification ? (
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap flex items-center gap-1">
                      🔞 {d.certification}
                    </span>
                  ) : null}
                  {d?.genres?.slice(0, 2).map((genre: string, idx: number) => (
                    <span key={idx} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      🎭 {genre}
                    </span>
                  ))}
                  {runtimeStr ? (
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap flex items-center gap-1">
                      ⏱ {runtimeStr}
                    </span>
                  ) : null}
                  {d?.vote_average !== null && d?.vote_average !== undefined ? (
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap flex items-center gap-1">
                      ⭐ {d.vote_average.toFixed(1)}
                      {d.vote_count ? ` (${d.vote_count.toLocaleString('pt-BR')})` : ""}
                    </span>
                  ) : null}
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap flex items-center gap-1">
                    📺 {(selectedMovie.media || d?.media) === "tv" ? "Série" : "Filme"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-4 md:p-6 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
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
            </div>

            <div className="px-3 sm:px-4 md:px-6 pb-4 sm:pb-6">
              <div className="overflow-x-auto -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 pb-2 scrollbar-hide border-b border-slate-200 dark:border-slate-700 mb-4">
                <div className="flex gap-1 min-w-max">
                  {(["sobre", "info", "elenco", ...(d?.numberOfSeasons || d?.numberOfEpisodes ? ["episodios"] : []), "reviews"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as "sobre" | "info" | "elenco" | "episodios" | "reviews")}
                      className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap min-h-[44px] ${
                        activeTab === tab
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-b-2 border-cyan-500"
                          : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                      aria-selected={activeTab === tab}
                    >
                      {tab === "sobre" ? "Sobre" : tab === "info" ? "Info" : tab === "elenco" ? "Elenco" : tab === "episodios" ? "Episódios" : "Reviews"}
                    </button>
                  ))}
                </div>
              </div>

              {activeTab === "sobre" && (
                <div className="space-y-3">
                  {d?.tagline && (
                    <div className="text-sm italic text-slate-600 dark:text-gray-400 border-l-4 border-cyan-500 pl-3 py-2">
                      "{d.tagline}"
                    </div>
                  )}
                  <div>
                    <p className={`text-slate-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base ${!synopsisExpanded ? "line-clamp-6" : ""}`}>
                      {selectedMovie.overview || d?.overview || "—"}
                    </p>
                    {(selectedMovie.overview || d?.overview) && (selectedMovie.overview || d?.overview || "").length > 200 && (
                      <button
                        onClick={() => setSynopsisExpanded(!synopsisExpanded)}
                        className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline mt-2"
                      >
                        {synopsisExpanded ? "Ver menos" : "Ver mais"}
                      </button>
                    )}
                  </div>
                  {d?.original_title && d.original_title !== selectedMovie.title && (
                    <div className="text-sm">
                      <span className="font-semibold text-slate-700 dark:text-gray-300">Título original: </span>
                      <span className="text-slate-900 dark:text-white">{d.original_title}</span>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "info" && (
                <div className="space-y-2 text-sm">
                  {d?.release_date && (
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-slate-500 dark:text-gray-400 flex-shrink-0" />
                      <span className="text-slate-700 dark:text-gray-300">Data de lançamento:</span>
                      <span className="text-slate-900 dark:text-white">{formatDate(d.release_date, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                  )}
                  {d?.certification && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-gray-400">🔞</span>
                      <span className="text-slate-700 dark:text-gray-300">Classificação:</span>
                      <span className="text-slate-900 dark:text-white">{d.certification}</span>
                    </div>
                  )}
                  {d?.production_countries?.length ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Globe size={16} className="text-slate-500 dark:text-gray-400 flex-shrink-0" />
                      <span className="text-slate-700 dark:text-gray-300">Países:</span>
                      <div className="flex items-center gap-1 flex-wrap">
                        {d.production_countries.slice(0, 3).map((country: string, idx: number) => (
                          <span key={idx} className="text-slate-900 dark:text-white flex items-center gap-1" title={country}>
                            {getCountryFlag(country)} {getCountryCode(country)}
                          </span>
                        ))}
                        {d.production_countries.length > 3 && (
                          <span className="text-slate-600 dark:text-gray-400">+{d.production_countries.length - 3}</span>
                        )}
                      </div>
                    </div>
                  ) : null}
                  {d?.spoken_languages?.length ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-500 dark:text-gray-400">🌐</span>
                      <span className="text-slate-700 dark:text-gray-300">Idiomas:</span>
                      <span className="text-slate-900 dark:text-white">{d.spoken_languages.slice(0, 3).join(", ")}{d.spoken_languages.length > 3 ? ` +${d.spoken_languages.length - 3}` : ""}</span>
                    </div>
                  ) : null}
                  {(d?.homepage || d?.imdb_id) && (
                    <div className="flex items-center gap-2 flex-wrap pt-2">
                      {d?.homepage && (
                        <a
                          href={d.homepage}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium text-slate-900 dark:text-white transition-colors min-h-[44px]"
                        >
                          <LinkIcon size={14} />
                          Site oficial
                        </a>
                      )}
                      {d?.imdb_id && (
                        <a
                          href={`https://www.imdb.com/title/${d.imdb_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium text-slate-900 dark:text-white transition-colors min-h-[44px]"
                        >
                          <LinkIcon size={14} />
                          IMDb
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "elenco" && (
                <div>
                  {d?.cast?.length ? (
                    <HorizontalCarousel
                      title={`Elenco principal (${d.cast.length})`}
                      items={d.cast}
                      loading={false}
                      renderItem={(actor: any, idx: number) => (
                        <Link
                          key={actor.id || idx}
                          to={`/person/${actor.id}`}
                          className="group block w-[140px] sm:w-[160px] flex-shrink-0"
                        >
                          <div className="bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-500 transition-all hover:shadow-lg">
                            <div className="w-full aspect-[2/3] bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                            {actor.profile_path ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                                  alt={actor.name || "Ator"}
                                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <User size={48} className="text-slate-400 dark:text-slate-500" />
                              </div>
                            )}
                            </div>
                            <div className="p-3">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate mb-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                {actor.name || "Nome não disponível"}
                              </p>
                              {actor.character && (
                                <p className="text-xs text-slate-600 dark:text-gray-400 truncate">
                                  {actor.character}
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>
                      )}
                      limit={d.cast.length}
                    />
                  ) : (
                    <p className="text-slate-600 dark:text-gray-400 text-sm">—</p>
                  )}
                </div>
              )}

              {activeTab === "episodios" && (d?.numberOfSeasons || d?.numberOfEpisodes || d?.lastAirDate) && (
                <div className="space-y-2 text-sm">
                  {(d?.numberOfSeasons || d?.numberOfEpisodes) && (
                    <div className="flex items-center gap-2">
                      <Tv size={16} className="text-slate-500 dark:text-gray-400 flex-shrink-0" />
                      <span className="text-slate-700 dark:text-gray-300">Temporadas/Episódios:</span>
                      <span className="text-slate-900 dark:text-white">
                        {d.numberOfSeasons ? `${d.numberOfSeasons} temp` : ''}
                        {d.numberOfSeasons && d.numberOfEpisodes ? ' • ' : ''}
                        {d.numberOfEpisodes ? `${d.numberOfEpisodes} eps` : ''}
                      </span>
                    </div>
                  )}
                  {d?.lastAirDate && (
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-slate-500 dark:text-gray-400 flex-shrink-0" />
                      <span className="text-slate-700 dark:text-gray-300">Último episódio:</span>
                      <span className="text-slate-900 dark:text-white">{formatDateShort(d.lastAirDate)}</span>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "reviews" && (
                <div>
                  {isLoggedIn ? (
                    <div className="bg-white dark:bg-slate-800/50 rounded-lg p-3 mb-4 border border-slate-200 dark:border-slate-700">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                            {user?.avatar_url ? (
                              <img src={user.avatar_url} alt={user.name || ""} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <User size={16} className="text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <textarea
                              ref={textareaRef}
                              value={newCommentText}
                              onChange={handleTextareaChange}
                              placeholder="Compartilhe sua opinião…"
                              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none min-h-[72px] max-h-[192px]"
                              rows={3}
                              aria-label="Seu comentário"
                            />
                            <div className="flex items-center justify-between mt-2">
                              <span className={`text-xs ${newCommentText.length > 500 ? "text-red-500 dark:text-red-400" : "text-slate-500 dark:text-gray-400"}`}>
                                {newCommentText.length}/500
                              </span>
                            </div>
                            {commentError && (
                              <p className="text-xs text-red-500 dark:text-red-400 mt-2" role="alert">{commentError}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <label className="block text-xs font-medium text-slate-700 dark:text-gray-300 mb-1.5">Sua nota:</label>
                            <div
                              ref={ratingChipsRef}
                              className="overflow-x-auto -mx-3 px-3 pb-2 scrollbar-hide scroll-smooth"
                              role="group"
                              aria-label="Selecione uma nota de 1 a 10"
                            >
                              <div className="flex gap-2 min-w-max">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                  <button
                                    key={num}
                                    onClick={() => setNewCommentRating(newCommentRating === num ? undefined : num)}
                                    data-rating={num}
                                    className={`min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                                      newCommentRating === num
                                        ? "bg-cyan-500 text-white"
                                        : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-gray-400 hover:bg-slate-300 dark:hover:bg-slate-600"
                                    }`}
                                    aria-label={`Nota ${num}${newCommentRating === num ? ", selecionado" : ""}`}
                                    aria-pressed={newCommentRating === num}
                                  >
                                    {num}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={handleCreateComment}
                            disabled={submittingComment || !newCommentText.trim() || newCommentText.length > 500}
                            className="w-full sm:w-auto min-h-[44px] px-4 sm:px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            aria-label="Enviar comentário"
                          >
                            {submittingComment ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Publicando...</span>
                              </>
                            ) : (
                              <>
                                <Send size={18} />
                                <span>Enviar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 mb-4 border border-slate-200 dark:border-slate-700 text-center">
                      <p className="text-sm text-slate-600 dark:text-gray-400 mb-3">Entre para comentar e avaliar.</p>
                      <button
                        onClick={() => {
                          setShowLogin(true);
                          setTimeout(() => {
                            textareaRef.current?.focus();
                          }, 500);
                        }}
                        className="min-h-[44px] px-6 py-2.5 rounded-lg bg-slate-700 dark:bg-slate-600 text-white font-semibold hover:bg-slate-600 dark:hover:bg-slate-500 transition-colors"
                      >
                        Entrar
                      </button>
                    </div>
                  )}

                  {commentsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700 animate-pulse">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-gray-400">
                      <MessageCircle size={40} className="mx-auto mb-3 opacity-50" />
                      <p className="text-sm mb-3">Nenhum comentário ainda. Seja o primeiro a comentar!</p>
                      {!isLoggedIn && (
                        <button
                          onClick={() => setShowLogin(true)}
                          className="min-h-[44px] px-6 py-2.5 rounded-lg bg-slate-700 dark:bg-slate-600 text-white font-semibold hover:bg-slate-600 dark:hover:bg-slate-500 transition-colors text-sm"
                        >
                          Comentar
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {comments.slice(0, commentsToShow).map((comment) => {
                        const isLiked = isLoggedIn && user?.email && comment.likes?.includes(user.email);
                        const isOwner = isLoggedIn && user?.email && comment.userId === user.email;
                        const isLongText = comment.text.length > 300;
                        const isExpanded = expandedComments.has(comment.id);
                        const displayText = isLongText && !isExpanded ? comment.text.substring(0, 300) + "..." : comment.text;

                        return (
                          <div key={comment.id} className="bg-white dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                {comment.userAvatar ? (
                                  <img src={comment.userAvatar} alt={comment.userName || ""} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  <User size={20} className="text-white" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                  <span className="font-semibold text-sm text-slate-900 dark:text-white">{comment.userName}</span>
                                  {comment.rating !== null && comment.rating !== undefined && (
                                    <div className="flex items-center gap-1 text-yellow-500 dark:text-yellow-400" aria-label={`Avaliação ${comment.rating} de 10`}>
                                      <Star size={12} fill="currentColor" />
                                      <span className="text-xs font-semibold">{comment.rating}</span>
                                    </div>
                                  )}
                                  <span className="text-xs text-slate-500 dark:text-gray-400">
                                    {formatDate(comment.createdAt, { day: 'numeric', month: 'short', year: 'numeric' }, lang)}
                                  </span>
                                  {isOwner && (
                                    <button
                                      onClick={() => {
                                        if (confirm("Tem certeza que deseja excluir este comentário?")) {
                                          handleDeleteComment(comment.id);
                                        }
                                      }}
                                      className="ml-auto min-w-[36px] min-h-[36px] flex items-center justify-center text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                      title="Excluir comentário"
                                      aria-label="Excluir comentário"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                                </div>
                                <p className="text-sm text-slate-700 dark:text-gray-300 mb-2 whitespace-pre-wrap leading-relaxed">{displayText}</p>
                                {isLongText && (
                                  <button
                                    onClick={() => toggleCommentExpand(comment.id)}
                                    className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline mb-2"
                                  >
                                    {isExpanded ? "Ver menos" : "Ver mais"}
                                  </button>
                                )}
                                <button
                                  onClick={() => handleLikeComment(comment.id)}
                                  className={`min-h-[36px] flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs ${
                                    isLiked
                                      ? "bg-cyan-500/20 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30"
                                      : "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600"
                                  }`}
                                  aria-label={`${isLiked ? "Remover" : "Adicionar"} curtida`}
                                  aria-pressed={isLiked}
                                >
                                  <ThumbsUp size={14} fill={isLiked ? "currentColor" : "none"} />
                                  <span className="font-semibold">{comment.likes?.length || 0}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {comments.length > commentsToShow && (
                        <button
                          onClick={() => setCommentsToShow(comments.length)}
                          className="w-full min-h-[44px] px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
                        >
                          Carregar mais ({comments.length - commentsToShow})
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

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
                                      {formatDate(season.air_date, { month: 'long', year: 'numeric' }, lang)}
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
                <HorizontalCarousel
                  title={`${t("cast")} (${d.cast.length})`}
                  items={d.cast}
                  loading={false}
                  renderItem={(actor: any, idx: number) => (
                    <Link
                      key={actor.id || idx}
                      to={`/person/${actor.id}`}
                      className="group block w-[140px] sm:w-[160px] flex-shrink-0"
                    >
                      <div className="bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-500 transition-all hover:shadow-lg">
                        <div className="w-full aspect-[2/3] bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                          {actor.profile_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                              alt={actor.name || "Ator"}
                              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                              <User size={48} className="text-slate-400 dark:text-slate-500" />
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate mb-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                            {actor.name || "Nome não disponível"}
                          </p>
                          {actor.character && (
                            <p className="text-xs text-slate-600 dark:text-gray-400 truncate">
                              {actor.character}
                            </p>
                          )}
                          </div>
                        </div>
                      </Link>
                  )}
                  limit={d.cast.length}
                />
              ) : null}

              <div className="border-t border-slate-300 dark:border-slate-700 pt-6 md:pt-8">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 md:mb-6">Avaliações e Comentários</h3>
                
                {isLoggedIn ? (
                  <div className="bg-white dark:bg-slate-800/50 rounded-lg p-3 md:p-4 mb-6 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
                    <div className="flex flex-col md:grid md:grid-cols-2 lg:flex lg:flex-row items-start gap-3 md:gap-4">
                      <div className="flex items-start gap-3 md:gap-4 w-full md:col-span-2 lg:flex-1 lg:col-span-1">
                        <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                          {user?.avatar_url ? (
                            <img src={user.avatar_url} alt={user.name || ""} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <User size={16} className="md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <textarea
                            ref={textareaRef}
                            value={newCommentText}
                            onChange={handleTextareaChange}
                            onFocus={() => {
                              setTimeout(() => {
                                ratingChipsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                              }, 300);
                            }}
                            placeholder="Compartilhe sua opinião…"
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none min-h-[72px] max-h-[192px]"
                            rows={3}
                            aria-label="Seu comentário"
                          />
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-xs ${newCommentText.length > 500 ? "text-red-500 dark:text-red-400" : "text-slate-500 dark:text-gray-400"}`}>
                              {newCommentText.length}/500
                            </span>
                          </div>
                          {commentError && (
                            <p className="text-xs text-red-500 dark:text-red-400 mt-2" role="alert">{commentError}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="w-full md:col-span-2 lg:flex lg:flex-col lg:items-end lg:gap-3 lg:w-auto">
                        <div className="w-full lg:w-auto">
                          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2" htmlFor="rating-chips">
                            Sua nota:
                          </label>
                          <div
                            id="rating-chips"
                            ref={ratingChipsRef}
                            className="overflow-x-auto -mx-3 px-3 pb-2 scrollbar-hide scroll-smooth md:overflow-x-visible md:mx-0 md:px-0"
                            role="group"
                            aria-label="Selecione uma nota de 1 a 10"
                          >
                            <div className="flex gap-2 min-w-max md:min-w-0 md:flex-wrap md:max-w-[280px] lg:max-w-none lg:flex-nowrap">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                <button
                                  key={num}
                                  onClick={() => setNewCommentRating(newCommentRating === num ? undefined : num)}
                                  onKeyDown={(e) => {
                                    if (e.key === "ArrowLeft" && num > 1) {
                                      e.preventDefault();
                                      const prev = document.querySelector(`[data-rating="${num - 1}"]`) as HTMLButtonElement;
                                      prev?.focus();
                                    } else if (e.key === "ArrowRight" && num < 10) {
                                      e.preventDefault();
                                      const next = document.querySelector(`[data-rating="${num + 1}"]`) as HTMLButtonElement;
                                      next?.focus();
                                    }
                                  }}
                                  data-rating={num}
                                  className={`min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 ${
                                    newCommentRating === num
                                      ? "bg-cyan-500 text-white"
                                      : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-gray-400 hover:bg-slate-300 dark:hover:bg-slate-600"
                                  }`}
                                  aria-label={`Nota ${num}${newCommentRating === num ? ", selecionado" : ""}`}
                                  aria-pressed={newCommentRating === num}
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={handleCreateComment}
                          disabled={submittingComment || !newCommentText.trim() || newCommentText.length > 500}
                          className="w-full md:w-auto lg:w-auto min-h-[44px] px-4 md:px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-3 md:mt-0"
                          aria-label="Enviar comentário"
                        >
                          {submittingComment ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>Publicando...</span>
                            </>
                          ) : (
                            <>
                              <Send size={18} />
                              <span className="hidden md:inline">Enviar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 md:p-6 mb-6 border border-slate-200 dark:border-slate-700 text-center shadow-sm dark:shadow-none">
                    <p className="text-slate-600 dark:text-gray-400 mb-4">Entre para comentar e avaliar.</p>
                    <button
                      onClick={() => {
                        setShowLogin(true);
                        setTimeout(() => {
                          textareaRef.current?.focus();
                        }, 500);
                      }}
                      className="min-h-[44px] px-6 py-2.5 rounded-lg bg-slate-700 dark:bg-slate-600 text-white font-semibold hover:bg-slate-600 dark:hover:bg-slate-500 transition-colors"
                    >
                      Entrar
                    </button>
                  </div>
                )}

                {commentsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700 animate-pulse">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-gray-400">
                    <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="mb-4">Nenhum comentário ainda. Seja o primeiro a comentar!</p>
                    {!isLoggedIn && (
                      <button
                        onClick={() => setShowLogin(true)}
                        className="min-h-[44px] px-6 py-2.5 rounded-lg bg-slate-700 dark:bg-slate-600 text-white font-semibold hover:bg-slate-600 dark:hover:bg-slate-500 transition-colors"
                      >
                        Comentar
                      </button>
                    )}
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
                      const isLongText = comment.text.length > 300;
                      const isExpanded = expandedComments.has(comment.id);
                      const displayText = isLongText && !isExpanded ? comment.text.substring(0, 300) + "..." : comment.text;

                      return (
                        <div key={comment.id} className="bg-white dark:bg-slate-800/50 rounded-lg p-3 md:p-4 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
                          <div className="flex items-start gap-3 md:gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                              {comment.userAvatar ? (
                                <img src={comment.userAvatar} alt={comment.userName || ""} className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <User size={20} className="text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="font-semibold text-slate-900 dark:text-white">{comment.userName}</span>
                                {comment.rating !== null && comment.rating !== undefined && (
                                  <div className="flex items-center gap-1 text-yellow-500 dark:text-yellow-400" aria-label={`Avaliação ${comment.rating} de 10`}>
                                    <Star size={14} fill="currentColor" />
                                    <span className="text-sm font-semibold">{comment.rating}</span>
                                  </div>
                                )}
                                <span className="text-xs text-slate-500 dark:text-gray-400">
                                  {formatDate(comment.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                                {isOwner && (
                                  <div className="ml-auto flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        if (confirm("Tem certeza que deseja excluir este comentário?")) {
                                          handleDeleteComment(comment.id);
                                        }
                                      }}
                                      className="min-w-[44px] min-h-[44px] md:min-w-[36px] md:min-h-[36px] flex items-center justify-center text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                      title="Excluir comentário"
                                      aria-label="Excluir comentário"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                )}
                              </div>
                              <p className="text-slate-700 dark:text-gray-300 mb-3 whitespace-pre-wrap leading-relaxed">{displayText}</p>
                              {isLongText && (
                                <button
                                  onClick={() => toggleCommentExpand(comment.id)}
                                  className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline mb-3"
                                >
                                  {isExpanded ? "Ver menos" : "Ver mais"}
                                </button>
                              )}
                              <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                                <button
                                  onClick={() => handleLikeComment(comment.id)}
                                  className={`min-h-[44px] md:min-h-[36px] flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                                    isLiked
                                      ? "bg-cyan-500/20 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30"
                                      : "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600"
                                  }`}
                                  aria-label={`${isLiked ? "Remover" : "Adicionar"} curtida`}
                                  aria-pressed={isLiked}
                                >
                                  <ThumbsUp size={16} fill={isLiked ? "currentColor" : "none"} />
                                  <span className="text-sm font-semibold">{comment.likes?.length || 0}</span>
                                </button>
                                {Object.keys(reactionCounts).length > 0 && (
                                  <div className="flex items-center gap-2 flex-wrap">
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

        {showDock && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 shadow-lg sm:hidden">
            <div className="flex items-center justify-around px-2 py-2 max-w-screen-sm mx-auto">
              <button
                onClick={() => toggleFavorite(selectedMovie)}
                className="flex flex-col items-center justify-center gap-1 min-w-[60px] min-h-[60px] px-3 py-2 rounded-lg transition-colors touch-manipulation active:scale-95"
                aria-label={isFavorite(selectedMovie) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              >
                <Heart size={20} fill={isFavorite(selectedMovie) ? "currentColor" : "none"} className={isFavorite(selectedMovie) ? "text-red-500" : "text-slate-700 dark:text-gray-300"} />
                <span className="text-xs font-medium text-slate-700 dark:text-gray-300">Favoritar</span>
              </button>
              <button
                onClick={() => {
                  if (!isLoggedIn) { setShowLogin(true); return; }
                  setShowListPickerFor(selectedMovie);
                }}
                className="flex flex-col items-center justify-center gap-1 min-w-[60px] min-h-[60px] px-3 py-2 rounded-lg transition-colors touch-manipulation active:scale-95"
                aria-label="Adicionar à lista"
              >
                <ListIcon size={20} className="text-slate-700 dark:text-gray-300" />
                <span className="text-xs font-medium text-slate-700 dark:text-gray-300">Lista</span>
              </button>
              <button
                onClick={handleRateMovie}
                className="flex flex-col items-center justify-center gap-1 min-w-[60px] min-h-[60px] px-3 py-2 rounded-lg transition-colors touch-manipulation active:scale-95"
                aria-label="Avaliar"
              >
                <Star size={20} className="text-slate-700 dark:text-gray-300" />
                <span className="text-xs font-medium text-slate-700 dark:text-gray-300">Avaliar</span>
              </button>
              <button
                onClick={handleShareMovie}
                className="flex flex-col items-center justify-center gap-1 min-w-[60px] min-h-[60px] px-3 py-2 rounded-lg transition-colors touch-manipulation active:scale-95"
                aria-label="Compartilhar"
              >
                <Share2 size={20} className="text-slate-700 dark:text-gray-300" />
                <span className="text-xs font-medium text-slate-700 dark:text-gray-300">Compartilhar</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };



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
    // Estado local para o nome da lista durante edição
    const [localListName, setLocalListName] = useState(lst.name);
    const listIdRef = useRef(lst.id);
    const inputRef = useRef<HTMLInputElement>(null);
    const isEditingRef = useRef(false);
    
    // Atualizar estado local apenas se a lista mudou (não apenas o nome)
    // Mas não atualizar se o usuário estiver editando
    useEffect(() => {
      if (listIdRef.current !== lst.id) {
        listIdRef.current = lst.id;
        setLocalListName(lst.name);
      } else if (!isEditingRef.current && lst.name !== localListName) {
        // Só atualizar se não estiver editando e o nome mudou externamente
        setLocalListName(lst.name);
      }
    }, [lst.id, lst.name, localListName]);
    const [order, setOrder] = useState<"recent" | "year" | "rating">("recent");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(() => {
      const saved = localStorage.getItem(`vetra:listItemsPerPage:${lst.id}`);
      return saved ? parseInt(saved, 10) : 24;
    });

    const filteredAndSortedItems = useMemo(() => {
      let filtered = [...lst.items];
      
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filtered = filtered.filter((m) => 
          m.title?.toLowerCase().includes(query) ||
          m.overview?.toLowerCase().includes(query)
        );
      }
      
      if (order === "year") {
        filtered.sort((a, b) => parseInt(b.year || "0") - parseInt(a.year || "0"));
      } else if (order === "rating") {
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      }
      
      return filtered;
    }, [lst.items, order, searchQuery]);

    const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage);
    const paginatedItems = useMemo(() => {
      const start = (currentPage - 1) * itemsPerPage;
      return filteredAndSortedItems.slice(start, start + itemsPerPage);
    }, [filteredAndSortedItems, currentPage, itemsPerPage]);

    useEffect(() => {
      setCurrentPage(1);
    }, [searchQuery, order, itemsPerPage]);

    const coverImageUrl = getListCoverImageUrl(lst, mediaKey, toPosterPath);
    const fallbackPosters = getListFallbackPosters(lst, 4, toPosterPath);
    
    // Debug: log quando a capa é calculada
    useEffect(() => {
      if (lst.cover) {
        console.log("[ListDetail] Capa calculada:", JSON.stringify({
          listId: lst.id,
          cover: lst.cover,
          coverImageUrl,
          itemsCount: lst.items.length,
          itemKeys: lst.items.map(m => mediaKey(m)),
          coverItem: lst.items.find(m => mediaKey(m) === lst.cover?.itemId) ? {
            id: lst.items.find(m => mediaKey(m) === lst.cover?.itemId)!.id,
            media: lst.items.find(m => mediaKey(m) === lst.cover?.itemId)!.media,
            poster_path: lst.items.find(m => mediaKey(m) === lst.cover?.itemId)!.poster_path,
            image: lst.items.find(m => mediaKey(m) === lst.cover?.itemId)!.image
          } : null
        }, null, 2));
      }
    }, [lst.id, lst.cover, coverImageUrl, lst.items.length]);

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
        const resp = await api.shareCreate(payload, 'list', lst.name);
        if (!resp || !resp.slug) {
          throw new Error("Resposta inválida do servidor");
        }
        setShareSlug(resp.slug || (resp.code ? resp.code.replace(/V9-|-/g, "").slice(0, 10) : ""));
        setShowShare(true);
      } catch (e: any) {
        console.error("[shareListDetail] Erro ao compartilhar:", e);
        const errorMsg = e?.message || "Não foi possível gerar o link agora. Tente novamente.";
        pushToast({ message: errorMsg, tone: "err" });
      }
    };

    return (
      <div>
        {/* Cabeçalho compacto da lista */}
        <div className="mb-6 sm:mb-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Título e contagem */}
            <div className="flex-1 min-w-0">
              <input
                ref={inputRef}
                className="w-full bg-transparent text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white outline-none border-b-2 border-transparent focus:border-cyan-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 mb-1"
                value={localListName}
                onChange={(e) => {
                  isEditingRef.current = true;
                  setLocalListName(e.target.value);
                }}
                onFocus={() => {
                  isEditingRef.current = true;
                }}
                onBlur={() => {
                  isEditingRef.current = false;
                  if (localListName.trim() && localListName !== lst.name) {
                    renameList(lst.id, localListName.trim());
                  } else if (!localListName.trim()) {
                    setLocalListName(lst.name);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    isEditingRef.current = false;
                    e.currentTarget.blur();
                  }
                  if (e.key === "Escape") {
                    isEditingRef.current = false;
                    setLocalListName(lst.name);
                    e.currentTarget.blur();
                  }
                }}
                placeholder="Nome da lista"
              />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {lst.items.length} {lst.items.length === 1 ? 'item' : 'itens'}
              </p>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Botão de compartilhar - só aparece para listas do usuário (não compartilhadas) */}
              {lst.id !== 'shared' && (
                <button 
                  onClick={openShare} 
                  disabled={lst.items.length === 0}
                  className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 text-sm font-medium transition-all min-h-[44px] focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  title={lst.items.length === 0 ? "A lista está vazia" : "Compartilhar lista"}
                  aria-label="Compartilhar lista"
                >
                  <Share2 size={18} />
                  <span className="hidden sm:inline">Compartilhar</span>
                </button>
              )}
              {/* Menu Kebab - só aparece para listas do usuário (não compartilhadas) */}
              {lst.id !== 'shared' && (
                <KebabMenu
                  items={[
                    { key: "clear", label: "Limpar itens", icon: <Trash2 size={14} />, onClick: () => setConfirmModal({ show: true, message: "Limpar todos os itens desta lista?", onConfirm: () => { clearList(lst.id); setConfirmModal({ show: false, message: "", onConfirm: () => {} }); } }) },
                    { key: "delete", label: "Excluir lista", icon: <Trash2 size={14} />, tone: "danger",
                      onClick: () => setConfirmModal({ show: true, message: `Excluir a lista "${lst.name}"? Esta ação não pode ser desfeita.`, onConfirm: () => { deleteList(lst.id); setConfirmModal({ show: false, message: "", onConfirm: () => {} }); } }) },
                  ]}
                />
              )}
            </div>
          </div>
        </div>

        {/* Lista de itens */}
        {lst.items.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {paginatedItems.map((m, idx) => {
              return (
                <div key={`${m.media}-${m.id}`} className="relative group"
                     draggable
                     onDragStart={onDragStart(lst.id, idx)}
                     onDrop={onDrop(lst.id, idx)}>
                  <MovieCard movie={m} />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <KebabMenu
                      items={[
                        { 
                          key: "setCover", 
                          label: "Definir como capa", 
                          icon: <ImageIcon size={14} />,
                          onClick: async () => {
                            const itemKey = mediaKey(m);
                            const result = await setListCover(lst.id, "item", itemKey);
                            if (result?.success !== false) {
                            pushToast({ message: "Capa definida", tone: "ok" });
                            } else {
                              pushToast({ message: result.error || "Erro ao definir capa", tone: "err" });
                            }
                          }
                        },
                        { 
                          key: "remove", 
                          label: "Remover da lista", 
                          icon: <Trash2 size={14} />, 
                          tone: "danger",
                          onClick: () => {
                            removeFromList(lst.id, m.id, m.media);
                          }
                        },
                      ]}
                    />
                  </div>
                </div>
              );
              })}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    setCurrentPage(prev => Math.max(1, prev - 1));
                    // Removido scroll automático para o topo
                  }}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <ChevronLeft size={18} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => {
                        setCurrentPage(pageNum);
                        // Removido scroll automático para o topo
                      }}
                      disabled={currentPage === pageNum}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                        currentPage === pageNum
                          ? "bg-cyan-600 text-white border-cyan-600"
                          : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => {
                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                    // Removido scroll automático para o topo
                  }}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 md:py-16 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-md rounded-3xl border border-slate-700/50 shadow-2xl">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-lime-400/20 mb-6 ring-4 ring-cyan-500/10">
              <ListIcon size={48} className="text-cyan-400" />
            </div>
            <p className="text-white text-xl font-bold mb-2">{t("lists.none_in_list")}</p>
            <p className="text-gray-400">{t("lists.list_empty")}</p>
          </div>
        )}

        <div className="mt-6 flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => {
              setActiveListId(null);
            }} 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium transition-all min-h-[44px] focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <ChevronLeft size={18} />
            <span>{t("back_all_lists")}</span>
          </button>
        </div>
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
                {formatDate(entry.watchedAt, { day: 'numeric', month: 'short', year: 'numeric' }, lang)}
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
        

        // Garantir que profile_path está presente
        const allResultsWithImages = allResults.map((person: any) => ({
          ...person,
          profile_path: person.profile_path || null,
          name: person.name || "",
          known_for_department: person.known_for_department || null,
          known_for: person.known_for || [],
          popularity: person.popularity || 0,
        }));
        
        let peopleResults = allResultsWithImages.filter((x: any) => {
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
            {/* Grid responsivo: 2 colunas no mobile, 3 no tablet, 4 no desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
              {filteredPeople.map((person: any) => (
              <Link
                key={person.id}
                to={`/person/${person.id}`}
                className="group bg-white dark:bg-slate-800 rounded-xl overflow-hidden relative transition-all duration-300 shadow-md hover:shadow-xl"
              >
                {/* Container da imagem */}
                <div className="relative w-full overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800" style={{ aspectRatio: "2/3" }}>
                  {person.profile_path ? (
                    <>
                      <img
                        src={person.profile_path ? `https://image.tmdb.org/t/p/w185/${person.profile_path.replace(/^\//, '')}` : undefined}
                        srcSet={person.profile_path ? `
                          https://image.tmdb.org/t/p/w185/${person.profile_path.replace(/^\//, '')} 185w,
                          https://image.tmdb.org/t/p/w300/${person.profile_path.replace(/^\//, '')} 300w,
                          https://image.tmdb.org/t/p/w500/${person.profile_path.replace(/^\//, '')} 500w
                        ` : undefined}
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                        alt={person.name || "Pessoa"}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        decoding="async"
                        fetchPriority="low"
                        onError={(e) => {
                          console.error('[PeopleContent] Erro ao carregar imagem:', person.profile_path);
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) {
                            fallback.style.display = 'flex';
                            fallback.classList.remove('hidden');
                          }
                        }}
                        onLoad={() => {
                          console.log('[PeopleContent] Imagem carregada:', person.profile_path);
                        }}
                      />
                      <div className="absolute inset-0 w-full h-full flex items-center justify-center hidden bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800" style={{ aspectRatio: "2/3" }}>
                        <User size={48} className="text-slate-400 dark:text-gray-600" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ aspectRatio: "2/3" }}>
                      <User size={48} className="text-slate-400 dark:text-gray-600" />
                    </div>
                  )}
                </div>
                  
                {/* Informações abaixo da imagem */}
                <div className="p-3 sm:p-4 text-center">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-2">
                    {person.name}
                  </h3>
                  
                  {person.known_for_department && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1 line-clamp-1">
                      {person.known_for_department}
                    </p>
                  )}
                  
                  {person.known_for && person.known_for.length > 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-500 line-clamp-2 mt-1">
                      {person.known_for.map((kf: any) => kf.title || kf.name).slice(0, 2).join(", ")}
                      {person.known_for.length > 2 && "..."}
                    </p>
                  )}
                </div>
                
                {/* Traço colorido embaixo no hover */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
  const ProfilePageContent: React.FC<{
    user: UserProfile | null;
    setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
    profileLoading: boolean;
    saveProfile: (profileData: { name: string; avatar_url?: string | null }) => Promise<void>;
    pushToast: (toast: { message: string; tone: "ok" | "err" | "info" }) => void;
    t: (key: string, params?: any) => string;
    favorites: MovieT[];
    lists: Array<{ id: string; name: string; items: MovieT[] }>;
    userStates: UserStateMap;
    setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
    setShowDeleteAccountModal: React.Dispatch<React.SetStateAction<boolean>>;
    darkEnabled: boolean;
    toggleDark: () => void;
    lang: Lang;
    setLang: (lang: Lang) => void;
    changePassword: (newPassword: string, idToken: string) => Promise<any>;
    exportJSON: () => void;
    exportCSV: () => void;
    importJSON: (file: File) => void;
  }> = ({
    user, setUser, profileLoading, saveProfile, pushToast, t, favorites, lists, userStates,
    setIsLoggedIn, setShowDeleteAccountModal, darkEnabled, toggleDark, lang, setLang,
    changePassword, exportJSON, exportCSV, importJSON
  }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<"geral" | "preferencias" | "seguranca" | "dados">("geral");
    const [editFirstName, setEditFirstName] = useState("");
    const [editLastName, setEditLastName] = useState("");
    const [editNickname, setEditNickname] = useState("");
    const [editAvatar, setEditAvatar] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarUploadProgress, setAvatarUploadProgress] = useState(0);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);
    const [showPasswords, setShowPasswords] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const saveBarRef = useRef<HTMLDivElement>(null);
    const [lastToastMessage, setLastToastMessage] = useState<string>("");
    const [toastCount, setToastCount] = useState(0);

    useEffect(() => {
      if (user) {
        const fullName = user.name || "";
        const nameParts = fullName.split(' ');
        setEditFirstName(nameParts[0] || "");
        setEditLastName(nameParts.slice(1).join(' ') || "");
        setEditAvatar(user.avatar_url || null);
        setHasChanges(false);
        setFieldErrors({});
        setProfileError(null);
      }
    }, [user]);

    useEffect(() => {
      if (hasChanges && saveBarRef.current) {
        saveBarRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, [hasChanges]);

    const handleFieldChange = (field: string, value: string) => {
      if (field === "firstName") {
        setEditFirstName(value);
        if (value.trim()) {
          setFieldErrors((prev) => ({ ...prev, firstName: "" }));
        }
      } else if (field === "lastName") {
        setEditLastName(value);
      } else if (field === "nickname") {
        if (value.length <= 30) {
          setEditNickname(value);
        }
      }
      setHasChanges(true);
    };

    const validateField = (field: string, value: string): string => {
      if (field === "firstName" && !value.trim()) {
        return "Nome é obrigatório";
      }
      if (field === "nickname" && value.length > 30) {
        return "Apelido deve ter no máximo 30 caracteres";
      }
      return "";
    };

    const handleFieldBlur = (field: string, value: string) => {
      const error = validateField(field, value);
      if (error) {
        setFieldErrors((prev) => ({ ...prev, [field]: error }));
      } else {
        setFieldErrors((prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        }));
      }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        const msg = "Arquivo muito grande. Tamanho máximo: 5 MB.";
        if (lastToastMessage !== msg) {
          setLastToastMessage(msg);
          setToastCount(1);
          pushToast({ message: msg, tone: "err" });
        }
        return;
      }
      
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        const msg = "Formato não suportado. Escolha JPG, PNG ou WebP.";
        if (lastToastMessage !== msg) {
          setLastToastMessage(msg);
          setToastCount(1);
          pushToast({ message: msg, tone: "err" });
        }
        return;
      }

      setAvatarFile(file);
      setAvatarUploadProgress(0);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const size = 512;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, size, size);
            const cropped = canvas.toDataURL('image/jpeg', 0.9);
            setEditAvatar(cropped);
            setHasChanges(true);
            setAvatarUploadProgress(100);
            setTimeout(() => setAvatarUploadProgress(0), 1000);
          }
        };
        img.src = reader.result as string;
      };
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 50);
          setAvatarUploadProgress(percent);
        }
      };
      
      reader.readAsDataURL(file);
    };

    const handleRemoveAvatar = () => {
      if (window.confirm("Tem certeza que deseja remover sua foto?")) {
        setEditAvatar(null);
        setAvatarFile(null);
        setHasChanges(true);
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
          pushToast({ message: errorMsg, tone: "err" });
        }
      } catch (e: any) {
        pushToast({ message: e?.message || "Erro ao alterar senha", tone: "err" });
      } finally {
        setChangingPassword(false);
      }
    };

    const handleDiscard = () => {
      if (window.confirm("Descartar todas as alterações não salvas?")) {
        const fullName = user?.name || "";
        const nameParts = fullName.split(' ');
        setEditFirstName(nameParts[0] || "");
        setEditLastName(nameParts.slice(1).join(' ') || "");
        setEditAvatar(user?.avatar_url || null);
        setAvatarFile(null);
        setHasChanges(false);
        setFieldErrors({});
        setProfileError(null);
      }
    };

    const stats = {
      favorites: favorites.length,
      lists: lists.length,
      watched: Object.values(userStates).filter(s => s.state === "watched").length,
      want: Object.values(userStates).filter(s => s.state === "want").length,
    };

    if (profileLoading && !user) {
      return (
        <div className="min-h-screen bg-white dark:bg-slate-900 py-6 sm:py-8 md:py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: "1040px" }}>
            <div className="animate-pulse space-y-6 sm:space-y-8">
              {/* Header skeleton */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 pb-6 sm:pb-8 border-b border-slate-200 dark:border-slate-800">
                <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                <div className="flex-1 space-y-3 text-center sm:text-left">
                  <div className="h-6 sm:h-8 bg-slate-200 dark:bg-slate-800 rounded w-48 mx-auto sm:mx-0"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32 mx-auto sm:mx-0"></div>
                  <div className="flex gap-2 justify-center sm:justify-start mt-4">
                    <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-32"></div>
                    <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-32"></div>
                  </div>
                </div>
              </div>
              
              {/* Stats skeleton */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 sm:h-24 md:h-28 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                ))}
              </div>
              
              {/* Tabs skeleton */}
              <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-slate-200 dark:bg-slate-800 rounded-t w-24"></div>
                ))}
              </div>
              
              {/* Form skeleton */}
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
                    <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    const handleSaveWithToast = async () => {
      const firstNameError = validateField("firstName", editFirstName);
      if (firstNameError) {
        setFieldErrors((prev) => ({ ...prev, firstName: firstNameError }));
        const msg = firstNameError;
        if (lastToastMessage !== msg) {
          setLastToastMessage(msg);
          setToastCount(1);
          pushToast({ message: msg, tone: "err" });
        }
        return;
      }

      setSaving(true);
      setProfileError(null);
      try {
        const fullName = editLastName.trim() 
          ? `${editFirstName.trim()} ${editLastName.trim()}`
          : editFirstName.trim();
        await saveProfile({ name: fullName, avatar_url: editAvatar });
        setHasChanges(false);
        const msg = "Perfil atualizado";
        if (lastToastMessage !== msg) {
          setLastToastMessage(msg);
          setToastCount(1);
          pushToast({ message: msg, tone: "ok" });
        }
      } catch (e: any) {
        const errorMsg = e?.message || "Erro ao salvar perfil";
        setProfileError(errorMsg);
        if (lastToastMessage !== errorMsg) {
          setLastToastMessage(errorMsg);
          setToastCount(1);
          pushToast({ message: errorMsg, tone: "err" });
        }
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 py-6 sm:py-8 md:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: "1040px" }}>
          {profileError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" role="alert" aria-live="polite">
              <div className="flex items-start gap-3">
                <X size={20} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                    Não conseguimos carregar seus dados.
                  </p>
                  <button
                    onClick={() => {
                      setProfileError(null);
                      window.location.reload();
                    }}
                    className="text-sm text-red-600 dark:text-red-400 hover:underline font-medium min-h-[44px] flex items-center"
                  >
                    Tentar novamente
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Header do Perfil */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 pb-6 sm:pb-8 mb-6 sm:mb-8 border-b border-slate-200 dark:border-slate-800">
            <label className="cursor-pointer group relative">
              {editAvatar ? (
                <div className="relative">
                  <img
                    src={editAvatar}
                    alt="Avatar"
                    className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-slate-300 dark:border-slate-700 shadow-lg group-hover:border-cyan-500/50 transition-all duration-300"
                  />
                  {avatarUploadProgress > 0 && avatarUploadProgress < 100 && (
                    <div className="absolute inset-0 rounded-full bg-black/60 flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mb-2" />
                      <span className="text-white text-xs font-medium">{avatarUploadProgress}%</span>
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Pencil size={24} className="text-white" />
                  </div>
                </div>
              ) : (
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-cyan-400 via-purple-500 to-lime-400 flex items-center justify-center text-white font-bold text-2xl sm:text-3xl md:text-4xl border-4 border-slate-300 dark:border-slate-700 shadow-lg group-hover:border-cyan-500/50 transition-all duration-300">
                  {avatarUploadProgress > 0 && avatarUploadProgress < 100 && (
                    <div className="absolute inset-0 rounded-full bg-black/60 flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mb-2" />
                      <span className="text-white text-xs font-medium">{avatarUploadProgress}%</span>
                    </div>
                  )}
                  {editFirstName.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
            
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-1 sm:mb-2">
                {editFirstName && editLastName ? `${editFirstName} ${editLastName}` : editFirstName || user?.name || "Usuário"}
              </h1>
              {editNickname && (
                <p className="text-sm sm:text-base text-slate-600 dark:text-gray-400 mb-2">@{editNickname}</p>
              )}
              <div className="flex flex-col sm:flex-row gap-2 justify-center sm:justify-start mt-3 sm:mt-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 bg-cyan-50 dark:bg-cyan-900/20 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 rounded-lg transition-all min-h-[44px]"
                >
                  <Pencil size={16} />
                  {editAvatar ? "Alterar foto" : "Adicionar foto"}
                </button>
                {editAvatar && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all min-h-[44px]"
                  >
                    <Trash2 size={16} />
                    Remover foto
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Cards de Estatísticas */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
              Estatísticas
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <button
                className="text-center p-4 sm:p-5 md:p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all min-h-[80px] sm:min-h-[100px] md:min-h-[120px] flex flex-col items-center justify-center"
                onClick={() => navigate("/favorites")}
              >
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-600 dark:text-purple-400">{stats.favorites}</div>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 mt-1">Favoritos</div>
              </button>
              <button
                className="text-center p-4 sm:p-5 md:p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all min-h-[80px] sm:min-h-[100px] md:min-h-[120px] flex flex-col items-center justify-center"
                onClick={() => navigate("/lists")}
              >
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-600 dark:text-purple-400">{stats.lists}</div>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 mt-1">Listas</div>
              </button>
              <button
                className="text-center p-4 sm:p-5 md:p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-green-400 dark:hover:border-green-500 transition-all min-h-[80px] sm:min-h-[100px] md:min-h-[120px] flex flex-col items-center justify-center"
              >
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400">{stats.watched}</div>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 mt-1">Assistidos</div>
              </button>
              <button
                className="text-center p-4 sm:p-5 md:p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-yellow-400 dark:hover:border-yellow-500 transition-all min-h-[80px] sm:min-h-[100px] md:min-h-[120px] flex flex-col items-center justify-center"
              >
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-yellow-600 dark:text-yellow-400">{stats.want}</div>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 mt-1">Quero ver</div>
              </button>
            </div>
          </div>

          <div className="grid min-[1280px]:grid-cols-[2fr_1fr] gap-6 sm:gap-8">
            <div className="space-y-6 sm:space-y-8">
              <div className="flex overflow-x-auto scrollbar-hide border-b border-slate-200 dark:border-slate-800 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory">
                {(["geral", "preferencias", "seguranca", "dados"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors min-h-[44px] flex items-center ${
                      activeTab === tab
                        ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
                        : "border-transparent text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {tab === "geral" && "Geral"}
                    {tab === "preferencias" && "Preferências"}
                    {tab === "seguranca" && "Segurança"}
                    {tab === "dados" && "Dados & Conta"}
                  </button>
                ))}
              </div>

              {activeTab === "geral" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Dados pessoais</h2>
                    <p className="text-sm text-slate-600 dark:text-gray-400 mb-6">
                      Atualize suas informações pessoais
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                        Nome <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        value={editFirstName}
                        onChange={(e) => handleFieldChange("firstName", e.target.value)}
                        onBlur={(e) => handleFieldBlur("firstName", e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px] ${
                          fieldErrors.firstName
                            ? "border-red-500 focus:ring-red-500"
                            : "border-slate-300 dark:border-slate-700"
                        }`}
                        placeholder="Seu nome"
                        aria-invalid={!!fieldErrors.firstName}
                        aria-describedby={fieldErrors.firstName ? "firstName-error" : undefined}
                      />
                      {fieldErrors.firstName && (
                        <p id="firstName-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert" aria-live="polite">
                          {fieldErrors.firstName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                        Sobrenome
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        value={editLastName}
                        onChange={(e) => handleFieldChange("lastName", e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px]"
                        placeholder="Seu sobrenome"
                      />
                    </div>

                    <div>
                      <label htmlFor="nickname" className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                        Apelido <span className="text-xs text-slate-500">(opcional)</span>
                      </label>
                      <input
                        id="nickname"
                        type="text"
                        value={editNickname}
                        onChange={(e) => handleFieldChange("nickname", e.target.value)}
                        onBlur={(e) => handleFieldBlur("nickname", e.target.value)}
                        maxLength={30}
                        className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px] ${
                          fieldErrors.nickname
                            ? "border-red-500 focus:ring-red-500"
                            : "border-slate-300 dark:border-slate-700"
                        }`}
                        placeholder="Seu apelido"
                        aria-invalid={!!fieldErrors.nickname}
                        aria-describedby={fieldErrors.nickname ? "nickname-error" : undefined}
                      />
                      {fieldErrors.nickname && (
                        <p id="nickname-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert" aria-live="polite">
                          {fieldErrors.nickname}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-slate-500 dark:text-gray-500">
                        {editNickname.length}/30 caracteres
                      </p>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                        Email
                      </label>
                      <div className="relative">
                        <input
                          id="email"
                          type="email"
                          value={user?.email || ""}
                          disabled
                          className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-gray-500 cursor-not-allowed min-h-[44px]"
                          aria-label="Email (somente leitura)"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Lock size={18} className="text-slate-400" />
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-slate-500 dark:text-gray-500 flex items-center gap-1">
                        <Lock size={12} />
                        O email não pode ser alterado
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "preferencias" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Preferências</h2>
                    <p className="text-sm text-slate-600 dark:text-gray-400 mb-6">
                      Personalize sua experiência
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-3">
                        Tema
                      </label>
                      <div className="flex gap-3">
                        {(["escuro", "claro", "sistema"] as const).map((theme) => (
                          <button
                            key={theme}
                            onClick={() => {
                              if (theme === "escuro") toggleDark();
                              else if (theme === "claro") {
                                if (darkEnabled) toggleDark();
                              }
                            }}
                            className={`px-4 py-2 rounded-lg border transition-all min-h-[44px] ${
                              (theme === "escuro" && darkEnabled) || (theme === "claro" && !darkEnabled)
                                ? "bg-cyan-600 text-white border-cyan-600"
                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-gray-300 border-slate-300 dark:border-slate-700 hover:border-cyan-500"
                            }`}
                          >
                            {theme === "escuro" && "Escuro"}
                            {theme === "claro" && "Claro"}
                            {theme === "sistema" && "Sistema"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-3">
                        {t("common.language")}
                      </label>
                      <div className="flex items-center">
                        <LanguageMenu lang={lang as Lang} onChange={(l) => setLang(l)} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "seguranca" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Segurança</h2>
                    <p className="text-sm text-slate-600 dark:text-gray-400 mb-6">
                      Gerencie sua senha e autenticação
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                        Email
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={user?.email || ""}
                          disabled
                          className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-gray-500 cursor-not-allowed min-h-[44px]"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Lock size={18} className="text-slate-400" />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">
                            Senha
                          </label>
                          <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">
                            Altere sua senha para manter sua conta segura
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowPasswordSection(!showPasswordSection)}
                          className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline font-medium min-h-[44px] flex items-center"
                        >
                          {showPasswordSection ? "Cancelar" : "Alterar senha"}
                        </button>
                      </div>
                      {showPasswordSection && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs text-slate-600 dark:text-gray-400 mb-2">
                              Senha atual
                            </label>
                            <div className="relative">
                              <input
                                type={showPasswords ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px]"
                                placeholder="Digite sua senha atual"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPasswords(!showPasswords)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 min-h-[44px] flex items-center"
                                aria-label={showPasswords ? "Ocultar senha" : "Mostrar senha"}
                              >
                                {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 dark:text-gray-400 mb-2">
                              Nova senha
                            </label>
                            <input
                              type={showPasswords ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px]"
                              placeholder="Mínimo 8 caracteres"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 dark:text-gray-400 mb-2">
                              Confirmar nova senha
                            </label>
                            <input
                              type={showPasswords ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px]"
                              placeholder="Digite a senha novamente"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleChangePassword}
                            disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                            className="w-full px-4 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[44px] flex items-center justify-center"
                          >
                            {changingPassword ? (
                              <span className="flex items-center gap-2">
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
                  </div>
                </div>
              )}

              {activeTab === "dados" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Dados & Conta</h2>
                    <p className="text-sm text-slate-600 dark:text-gray-400 mb-6">
                      Exporte seus dados ou exclua sua conta
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-3">
                        Exportar dados
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={exportJSON}
                          className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all min-h-[44px] flex items-center"
                        >
                          Exportar JSON
                        </button>
                        <button
                          onClick={exportCSV}
                          className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all min-h-[44px] flex items-center"
                        >
                          Exportar CSV
                        </button>
                        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer min-h-[44px]">
                          <input
                            type="file"
                            accept="application/json"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.currentTarget.files?.[0];
                              if (f) importJSON(f);
                              e.currentTarget.value = "";
                            }}
                          />
                          Importar JSON
                        </label>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                      <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-3">
                        Zona de Perigo
                      </h3>
                      <button
                        onClick={() => setShowDeleteAccountModal(true)}
                        className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-all min-h-[44px] flex items-center gap-2"
                      >
                        <Trash2 size={18} />
                        Excluir conta
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={handleDiscard}
                  disabled={!hasChanges || saving}
                  className="px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[44px] flex items-center"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveWithToast}
                  disabled={saving || !hasChanges || !editFirstName.trim()}
                  className="flex-1 px-6 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[44px] flex items-center justify-center"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
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

          {hasChanges && (
            <div
              ref={saveBarRef}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-lg z-40 p-4 md:hidden"
              style={{ paddingBottom: `max(env(safe-area-inset-bottom), 16px)` }}
            >
              <div className="container mx-auto px-4 max-w-6xl">
                <p className="text-sm text-slate-600 dark:text-gray-400 mb-3">
                  Você tem alterações não salvas
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDiscard}
                    disabled={saving}
                    className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[44px] flex items-center justify-center"
                  >
                    Descartar
                  </button>
                  <button
                    onClick={handleSaveWithToast}
                    disabled={saving || !editFirstName.trim()}
                    className="flex-1 px-4 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[44px] flex items-center justify-center"
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Salvando...
                      </span>
                    ) : (
                      "Salvar"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

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

      <div className="mt-8 pt-8 border-t border-slate-800">
        <h3 className="text-lg font-semibold mb-4 text-red-400">Zona de Perigo</h3>
        <button
          onClick={() => setShowDeleteAccountModal(true)}
          className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-all duration-200 shadow-md hover:shadow-lg border border-red-700 hover:border-red-800"
        >
          <Trash2 size={16} className="inline mr-2" />
          Excluir conta
        </button>
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
                {t("home.millions_movies")}
              </p>
              
              <div className="flex flex-col gap-3 max-w-2xl">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                      <Search className="text-slate-400 dark:text-slate-500" size={20} />
              </div>
              <input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  // Se o campo for limpo, limpar resultados imediatamente
                  if (e.target.value.trim() === "") {
                    // Verificar se há filtros realmente ativos (não padrão)
                    const defaults = getDefaultFilters();
                    const hasNonDefaultFilters = 
                      appliedSearchFilters.type !== defaults.type ||
                      appliedSearchFilters.sort !== defaults.sort ||
                      appliedSearchFilters.yearGte !== defaults.yearGte ||
                      appliedSearchFilters.yearLte !== defaults.yearLte ||
                      appliedSearchFilters.voteAvgGte > defaults.voteAvgGte ||
                      appliedSearchFilters.voteCntGte > defaults.voteCntGte ||
                      appliedSearchFilters.withPoster !== defaults.withPoster;
                    
                    // Se não há filtros ativos, limpar tudo
                    if (!hasNonDefaultFilters) {
                      setMovies([]);
                      setPeople([]);
                      setSearchTotalResults(0);
                      setHasActiveFilters(false);
                      setSearchPage(1);
                      // Limpar parâmetros de busca da URL
                      const params = new URLSearchParams(window.location.search);
                      params.delete("q");
                      params.delete("page");
                      const newURL = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
                      window.history.replaceState({}, "", newURL);
                    }
                  }
                }}
                      placeholder={t("home.search_placeholder_full")}
                      className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 pl-12 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 focus:border-cyan-500 dark:focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:focus:ring-cyan-400/20 transition-all duration-200 text-base font-normal"
                      style={{ lineHeight: '1.6', minHeight: '48px' }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    runSearch();
                  }
                }}
                      aria-label={t("home.search_placeholder_full")}
              />
            </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                    <button
                      onClick={() => setShowSearchFilters(!showSearchFilters)}
                      className="px-3 sm:px-4 py-3 rounded-lg font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 text-sm sm:text-base whitespace-nowrap min-h-[44px] sm:min-h-[48px] flex items-center justify-center gap-1.5 sm:gap-2"
                    >
                      <ChevronDown className={`transition-transform ${showSearchFilters ? 'rotate-180' : ''}`} size={16} />
                      <span className="hidden min-[361px]:inline">{t("filters")}</span>
                      <span className="min-[361px]:hidden">Filtros</span>
                    </button>
            <button
              onClick={() => runSearch()}
                      className="px-4 sm:px-6 py-3 rounded-lg font-semibold text-white bg-slate-700 dark:bg-slate-600 hover:bg-slate-600 dark:hover:bg-slate-500 transition-all duration-200 shadow-md hover:shadow-lg text-sm sm:text-base whitespace-nowrap min-h-[44px] sm:min-h-[48px] border border-slate-600 dark:border-slate-500"
            >
              {t("search_button")}
            </button>
          </div>
        </div>
                        </div>
                        </div>
                        </div>
                        </div>
        </section>
        
        {/* Search Filters Panel - Outside hero section */}
        <SearchFiltersPanel
          isOpen={showSearchFilters}
          onClose={() => setShowSearchFilters(false)}
          appliedFilters={appliedSearchFilters}
          onApply={handleApplyFilters}
          onClearAll={handleClearAllFilters}
          searchTerm={searchTerm}
          t={t}
          normalizeNumber={normalizeNumber}
          snapRating={snapRating}
          snapVotes={snapVotes}
          linearToLog={linearToLog}
          logToLinear={logToLinear}
        />

      {/* Container para as outras seções */}
      <div className="container mx-auto px-[var(--container-gutter-mobile)] md:px-[var(--container-gutter-desktop)] pb-16 md:pb-24" style={{ scrollMarginTop: useBottomNav ? 'calc(var(--appbar-h-mobile) + max(env(safe-area-inset-top), 0px))' : 'calc(var(--app-header-h) + max(env(safe-area-inset-top), 0px))' }}>
        {/* 1) Recomendados para você - apenas quando não há busca e há sinais do usuário */}
        {!searchTerm && !hasActiveFilters && isLoggedIn && (favorites.length > 0 || Object.keys(userStates).length > 0) && (
          <HorizontalCarousel
            title={t("home.recommended_for_you")}
            items={getPersonalizedRecommendations()}
            loading={false}
            renderItem={(m) => <MovieCard movie={m} />}
            limit={20}
          />
        )}

      {(searchTerm.trim() || hasActiveFilters) ? (
        <section className="mb-6 md:mb-8">
          <div className="flex flex-col gap-3 mb-3 md:mb-4">
            <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg md:text-xl font-bold">
                {searchTerm ? t("empty.no_results_for", { q: searchTerm }) : t("empty.no_results")}
            </h2>
            {!loading && searchTotalResults > 0 && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t("common.showing", { from: ((searchPage - 1) * 20) + 1, to: Math.min(searchPage * 20, searchTotalResults), total: searchTotalResults })}
              </p>
            )}
            </div>
            <FilterChips
              filters={appliedSearchFilters}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={handleClearAllFilters}
              t={t}
            />
          </div>
          {loading ? (
            <div className="text-center py-6 md:mb-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-cyan-500 dark:border-slate-700" />
            </div>
          ) : (
            <>
              {movies.length > 0 && (
                <>
                  <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">{t("movie.movies_and_series")}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 min-[1201px]:grid-cols-6 gap-2 sm:gap-2 md:gap-3 lg:gap-4 mb-10">
                    {movies.map((m) => (
                      <MovieCard key={`${m.media}-${m.id}`} movie={m} />
                    ))}
                  </div>
                </>
              )}
              
              {people.length > 0 && (
                <>
                  <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">{t("nav.people")}</h3>
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
              
              {!loading && movies.length === 0 && people.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-slate-900 dark:text-white text-lg font-semibold mb-2">{t("empty.no_results_filters")}</p>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                    {searchTerm 
                      ? t("empty.no_results_hint")
                      : t("empty.no_results_hint_no_search")}
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center">
                  <button
                      onClick={handleClearAllFilters}
                    className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-all"
                  >
                      {t("filters.clear_all")}
                    </button>
                    <button
                      onClick={() => setShowSearchFilters(true)}
                      className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-all"
                    >
                      {t("empty.edit_filters")}
                  </button>
                  </div>
                </div>
              )}
              
              {/* Pagination for search results */}
              {!loading && searchTotalResults > 0 && (
                <Pagination
                  currentPage={searchPage}
                  totalPages={Math.ceil(searchTotalResults / 20)}
                  onPageChange={(page) => {
                    setSearchPage(page);
                    runSearch(searchTerm, appliedSearchFilters, page);
                    // Removido scroll automático para o topo
                  }}
                  loading={loading}
                />
              )}
            </>
          )}
        </section>
      ) : (
        <>
          {/* 2) Mais bem avaliados */}
          <div className="mb-6">
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{t("nav.top_rated")}</h2>
            </div>
            {topRatedMovies.items.length > 0 ? (
              <HorizontalCarousel
                title=""
                subtitle=""
                items={(topRatedMovies.items || []).slice(0, 20)}
                loading={topRatedMovies.loading}
                renderItem={(m) => <MovieCard movie={m} />}
                limit={20}
                ariaLabel="Carrossel: Mais bem avaliados"
              />
            ) : topRatedMovies.loading ? (
              <div className="text-center py-6" role="status" aria-label="Carregando Mais bem avaliados">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-cyan-500 dark:border-slate-700" />
              </div>
            ) : topRatedMovies.error ? (
              <div className="text-center py-6 bg-slate-100 dark:bg-slate-800 rounded-lg" role="alert">
                <p className="text-slate-600 dark:text-slate-400 mb-2">Falha ao carregar Mais bem avaliados.</p>
                <button
                  onClick={() => loadTopRatedSection(1, new Set())}
                  className="text-cyan-600 dark:text-cyan-400 hover:underline min-h-[44px]"
                  aria-label="Recarregar Mais bem avaliados"
                >
                  Recarregar
                </button>
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <p className="text-slate-600 dark:text-slate-400 mb-2">Não encontramos títulos para esta seção agora.</p>
                <button
                  onClick={() => loadTopRatedSection(1, new Set())}
                  className="text-cyan-600 dark:text-cyan-400 hover:underline min-h-[44px]"
                  aria-label="Tentar novamente Mais bem avaliados"
                >
                  Tentar novamente
                </button>
              </div>
            )}
          </div>

          {/* 3) Populares */}
          <div className="mb-6">
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{t("nav.popular")}</h2>
            </div>
            {homeSections.popularMovies.items.length > 0 ? (
              <HorizontalCarousel
                title=""
                subtitle=""
                items={(homeSections.popularMovies.items || []).slice(0, 20)}
                loading={homeSections.popularMovies.loading}
                renderItem={(m) => <MovieCard movie={m} />}
                limit={20}
                ariaLabel="Carrossel: Populares"
              />
            ) : homeSections.popularMovies.loading ? (
              <div className="text-center py-6" role="status" aria-label="Carregando Populares">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-cyan-500 dark:border-slate-700" />
              </div>
            ) : homeSections.popularMovies.error ? (
              <div className="text-center py-6 bg-slate-100 dark:bg-slate-800 rounded-lg" role="alert">
                <p className="text-slate-600 dark:text-slate-400 mb-2">Falha ao carregar Populares.</p>
                <button
                  onClick={() => loadPopularSection(1, new Set())}
                  className="text-cyan-600 dark:text-cyan-400 hover:underline min-h-[44px]"
                  aria-label="Recarregar Populares"
                >
                  Recarregar
                </button>
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <p className="text-slate-600 dark:text-slate-400 mb-2">Não encontramos títulos para esta seção agora.</p>
                <button
                  onClick={() => loadPopularSection(1, new Set())}
                  className="text-cyan-600 dark:text-cyan-400 hover:underline min-h-[44px]"
                  aria-label="Tentar novamente Populares"
                >
                  Tentar novamente
                </button>
              </div>
            )}
          </div>

          {/* 4) Lançamentos recentes */}
          {homeSections.recentReleases.items.length > 0 && (
            <HorizontalCarousel
              title={t("home.recent_releases")}
              items={homeSections.recentReleases.items.slice(0, 20)}
              loading={homeSections.recentReleases.loading}
              renderItem={(m) => <MovieCard movie={m} />}
            />
          )}

          {/* 5) Em breve */}
          {homeSections.comingSoon.items.length > 0 && (
            <HorizontalCarousel
              title={t("home.coming_soon")}
              items={homeSections.comingSoon.items.slice(0, 20)}
              loading={homeSections.comingSoon.loading}
              renderItem={(m) => <MovieCard movie={m} />}
            />
          )}

          {/* 6) Por gênero (opcional, rotativo) */}
          {homeSections.byGenre.map((genreSection, idx) => (
            genreSection.items.length > 0 && (
              <HorizontalCarousel
                key={`genre-${idx}-${genreSection.genre}`}
                title={genreSection.genre || t("home.by_genre")}
                items={genreSection.items.slice(0, 15)}
                loading={genreSection.loading}
                renderItem={(m) => <MovieCard movie={m} />}
              />
            )
          ))}


        </>
      )}
      </div>
    </>
  );

  // Conteúdo da Watchlist (Quero ver, Assisti, Não assisti, Abandonei com notas)
  const WatchlistContent = (
    <section className="max-w-7xl mx-auto px-4 sm:px-6">
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
        
        if (itemsCount > 0) {
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
                
                if (!resp || !resp.slug) {
                  throw new Error("Resposta inválida do servidor");
                }
                
                setShareSlug(resp.slug || (resp.code ? resp.code.replace(/V9-|-/g, "").slice(0, 10) : ""));
                setShowShare(true);
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
      
      {/* Abas */}
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
    </section>
  );

  const FavoritesContent = (
    <section>
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">{t("nav.my_favorites")}</h2>
        </div>

        {favorites.length > 0 && (
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
                
                if (!resp || !resp.slug) {
                  throw new Error("Resposta inválida do servidor");
                }
                
                setShareSlug(resp.slug || (resp.code ? resp.code.replace(/V9-|-/g, "").slice(0, 10) : ""));
                setShowShare(true);
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
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 min-[1201px]:grid-cols-6 gap-2 sm:gap-2 md:gap-3 lg:gap-4">
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

  const listCover = (l: UserList): MovieT | null => {
    if (!l.items || l.items.length === 0) return null;
    
    if (l.cover?.type === "item" && l.cover.itemId) {
      const coverItem = l.items.find((m) => mediaKey(m) === l.cover!.itemId || String(m.id) === l.cover!.itemId);
      if (coverItem) return coverItem;
    }
    
    if (l.cover?.type === "upload" && l.cover.url) {
      return null;
    }
    
    const bestRated = l.items
      .filter((m) => m.rating && m.rating > 0)
      .slice(0, 10)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
    
    return bestRated || l.items.find((m) => m.poster_path) || l.items[0];
  };
  
  const getListCoverImage = (l: UserList): string | null => {
    if (l.cover?.type === "upload" && l.cover.url) {
      return l.cover.url;
    }
    const cover = listCover(l);
    if (cover) {
      return cover.image || poster(cover.poster_path);
    }
    return null;
  };
  
  const formatListUpdatedAt = (updatedAt?: string): string => {
    if (!updatedAt) return "";
    const date = new Date(updatedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `Há ${diffDays}d`;
    if (diffDays < 30) return `Há ${Math.floor(diffDays / 7)}sem`;
    if (diffDays < 365) return `Há ${Math.floor(diffDays / 30)}mes`;
    return `Há ${Math.floor(diffDays / 365)}a`;
  };
  
  const filteredAndSortedLists = useMemo(() => {
    let filtered = lists;
    
    if (listSearchQuery.trim()) {
      const query = listSearchQuery.toLowerCase().trim();
      filtered = filtered.filter((l) => l.name.toLowerCase().includes(query));
    }
    
    const sorted = [...filtered].sort((a, b) => {
      if (listSortOrder === "az") {
        return a.name.localeCompare(b.name);
      }
      if (listSortOrder === "items") {
        return b.items.length - a.items.length;
      }
      if (listSortOrder === "updated") {
        const aDate = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bDate = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bDate - aDate;
      }
      return 0;
    });
    
    return sorted;
  }, [lists, listSearchQuery, listSortOrder]);

  const ListsContent = (
    <section>
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {viewingShared && sharedList ? sharedList.listName : t("lists")}
          </h2>
        </div>
        {!viewingShared && (
        <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
          <button
            onClick={() => {
              const defaultName = `Minha lista ${lists.length + 1}`;
              const id = createList(defaultName);
              setActiveListId(id);
              pushToast({ message: t("created_list_ok", { name: defaultName }), tone: "ok" });
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 sm:hover:scale-105 min-h-[44px]"
          >
            <Plus size={16} className="sm:w-4.5 sm:h-4.5" />{t("new_list")}
          </button>
        </div>
        )}
      </div>

      {viewingShared && sharedList ? (
        <>
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs font-medium rounded-full border border-cyan-200 dark:border-cyan-800" title="Qualquer pessoa com o link pode ver.">
              <LinkIcon size={12} />
              Link público
            </span>
          </div>
          <ListDetail lst={{ id: 'shared', name: sharedList.listName, items: sharedList.items }} />
        </>
      ) : activeListId ? (() => {
        const lst = lists.find((l) => l.id === activeListId);
        if (!lst) return <div className="text-slate-600 dark:text-gray-400">{t("list_not_found")}</div>;
        return <ListDetail lst={lst} />;
      })() : (
        lists.length > 0 ? (
          <>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  placeholder="Buscar listas..."
                  value={listSearchQuery}
                  onChange={(e) => setListSearchQuery(e.target.value)}
                  className="w-full sm:w-auto sm:min-w-[200px] max-w-md px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={listSortOrder}
                  onChange={(e) => setListSortOrder(e.target.value as "recent" | "az" | "items" | "updated")}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px]"
                >
                  <option value="recent">Recentes</option>
                  <option value="az">A–Z</option>
                  <option value="items">Mais itens</option>
                  <option value="updated">Última atualização</option>
                </select>
              </div>
            </div>
            
            {filteredAndSortedLists.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 min-[1280px]:grid-cols-4 gap-6 sm:gap-8">
                {filteredAndSortedLists.map((l) => {
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
                  
                  if (!resp || !resp.slug) {
                    throw new Error("Resposta inválida do servidor");
                  }
                  
                  setShareSlug(resp.slug || (resp.code ? resp.code.replace(/V9-|-/g, "").slice(0, 10) : ""));
                  setShowShare(true);
                } catch (e: any) { 
                  console.error("[shareList] Erro ao compartilhar:", e);
                  const errorMsg = e?.message?.includes("listId_obrigatorio") 
                    ? "Erro ao gerar link. Tente novamente." 
                    : (e?.message || t("share_fail") || "Erro ao compartilhar lista");
                  pushToast({ message: errorMsg, tone: "err" }); 
                }
              };
              const coverImageUrl = getListCoverImageUrl(l, mediaKey, toPosterPath);
              const fallbackPosters = getListFallbackPosters(l, 4, toPosterPath);
              

              return (
                <div key={l.id} className="group relative bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 hover:scale-[1.03] backdrop-blur-sm">
                  {/* Capa da lista - destaque visual melhorado */}
                  <div className="relative aspect-[16/9] overflow-hidden bg-slate-200 dark:bg-slate-800">
                    <ListCover
                      title={l.name}
                      itemsCount={l.items.length}
                      imageUrl={coverImageUrl}
                      fallbackPosters={fallbackPosters}
                      focalPoint={l.cover?.focalPoint}
                      mode="grid"
                      showOverlay={true}
                      onClick={() => setActiveListId(l.id)}
                      onShare={l.items.length > 0 ? shareList : undefined}
                      onMore={() => {
                        setRenameInput(l.name);
                        setRenameModal({ show: true, listId: l.id, currentName: l.name });
                      }}
                      className="cursor-pointer h-full w-full"
                    />
                    {/* Overlay gradiente sutil no hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20" />
                  </div>
                  
                  {/* Informações da lista - design melhorado */}
                  <div className="p-5 sm:p-6 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3 line-clamp-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors duration-300">
                      {l.name}
                    </h3>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{l.items.length}</span>
                        <span className="text-slate-500 dark:text-slate-500">{l.items.length === 1 ? "item" : "itens"}</span>
                        {l.updatedAt && (
                          <>
                            <span className="text-slate-400 dark:text-slate-600">•</span>
                            <span className="text-slate-500 dark:text-slate-500">{formatListUpdatedAt(l.updatedAt)}</span>
                          </>
                        )}
                      </div>
                      {l.isPublic !== undefined && (
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                          l.isPublic 
                            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                            : "bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400"
                        }`}>
                          {l.isPublic ? "Pública" : "Privada"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ações no hover (para grid, mostrar em overlay) */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenameInput(l.name);
                          setRenameModal({ show: true, listId: l.id, currentName: l.name });
                        }}
                        className="p-2 rounded-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        title="Editar"
                        aria-label="Editar lista"
                      >
                        <Pencil size={18} />
                      </button>
                      <KebabMenu
                        items={[
                          { 
                            key: "chooseCover", 
                            label: "Escolher capa", 
                            icon: <ImageIcon size={14} />,
                            onClick: () => {
                              setCoverSelectorListId(l.id);
                              setShowCoverSelector(true);
                            }
                          },
                          { key: "delete", label: "Excluir", icon: <Trash2 size={14} />, tone: "danger",
                            onClick: () => setConfirmModal({ 
                              show: true, 
                              message: `Excluir a lista "${l.name}"? Esta ação não pode ser desfeita.`, 
                              onConfirm: () => { 
                                deleteList(l.id); 
                                setConfirmModal({ show: false, message: "", onConfirm: () => {} }); 
                              } 
                            }) 
                          },
                        ]}
                      />
                    </div>
                </div>
              );
            })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-600 dark:text-slate-400">Nenhuma lista encontrada.</p>
              </div>
            )}
          </>
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

  // Badge da API removido - não será mais exibido

  // Verificar se há um compartilhamento na URL antes de decidir mostrar LandingScreen
  const urlParams = new URLSearchParams(window.location.search);
  const hasShareSlug = urlParams.get("share");
  
  // Mostrar loading enquanto verifica a sessão para evitar flash da tela de login
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }
  
  if (!isLoggedIn && !viewingShared && !hasShareSlug && !resolvingShare) {
    return (
      <>
        <LandingScreen
          onSignIn={() => { setLoginType("signin"); setShowLogin(true); }}
          onSignUp={() => { setLoginType("signup"); setShowLogin(true); }}
        />
        {showLogin && <LoginModal
          formData={formData}
          loginType={loginType}
          showPassword={showPassword}
          emailError={emailError}
          passwordError={passwordError}
          loginError={loginError}
          passwordErrors={passwordErrors}
          passwordStrength={passwordStrength}
          showPasswordTips={showPasswordTips}
          confirmPasswordError={confirmPasswordError}
          confirmPasswordTouched={confirmPasswordTouched}
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
          setLoginType={setLoginType}
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
          generatePassword={generatePassword}
          setShowPasswordTips={setShowPasswordTips}
          setConfirmPasswordError={setConfirmPasswordError}
          setConfirmPasswordTouched={setConfirmPasswordTouched}
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

  // Página de Visualização do Perfil
  const ProfileViewPage: React.FC = () => {
    const navigate = useNavigate();
    
    // Calcular estatísticas
    const stats = useMemo(() => {
      const watched = Object.values(userStates || {}).filter(s => s?.state === "watched").length;
      const want = Object.values(userStates || {}).filter(s => s?.state === "want").length;
      const favoriteCount = favorites?.length || 0;
      const listCount = lists?.length || 0;
      
      return { watched, want, favorite: favoriteCount, lists: listCount };
    }, [userStates, favorites, lists]);
    
    const fullName = user?.name || "";
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(' ') || "";

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-1">Meu Perfil</h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">Visualize suas informações e estatísticas</p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
              aria-label="Voltar"
            >
              <X size={20} className="text-slate-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Mobile: Layout em 1 coluna */}
          <div className="flex flex-col lg:hidden space-y-4 sm:space-y-6">
            {/* Foto + Nome + Email */}
            <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
              <div className="flex flex-col items-center">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name || "Usuário"}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-cyan-500 dark:border-cyan-400 shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-cyan-400 via-purple-500 to-lime-400 flex items-center justify-center text-white text-2xl sm:text-4xl font-bold border-4 border-cyan-500 dark:border-cyan-400 shadow-lg">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-3 sm:mt-4 text-center">
                  {user?.name || "Usuário"}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 mt-1 text-center break-all">
                  {user?.email || ""}
                </p>
              </div>
            </div>

            {/* Botão Editar Perfil */}
            <button
              onClick={() => navigate("/profile/edit")}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Pencil size={18} />
              Editar Perfil
            </button>

            {/* Estatísticas */}
            <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">Estatísticas</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="text-center p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="text-xl sm:text-2xl font-bold text-cyan-600 dark:text-cyan-400">{stats.favorite}</div>
                  <div className="text-xs text-slate-600 dark:text-gray-400 mt-1">Favoritos</div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.lists}</div>
                  <div className="text-xs text-slate-600 dark:text-gray-400 mt-1">Listas</div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="text-xl sm:text-2xl font-bold text-lime-600 dark:text-lime-400">{stats.watched}</div>
                  <div className="text-xs text-slate-600 dark:text-gray-400 mt-1">Assistidos</div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.want}</div>
                  <div className="text-xs text-slate-600 dark:text-gray-400 mt-1">Quero ver</div>
                </div>
              </div>
            </div>

            {/* Informações Pessoais */}
            <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">Informações Pessoais</h3>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-600 dark:text-gray-400 mb-1">
                    Nome
                  </label>
                  <div className="text-sm sm:text-base text-slate-900 dark:text-white break-words">
                    {firstName || "—"}
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-600 dark:text-gray-400 mb-1">
                    Sobrenome
                  </label>
                  <div className="text-sm sm:text-base text-slate-900 dark:text-white break-words">
                    {lastName || "—"}
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-600 dark:text-gray-400 mb-1">
                    Email
                  </label>
                  <div className="text-sm sm:text-base text-slate-900 dark:text-white break-all">
                    {user?.email || "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: Layout em 2 colunas */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-6 xl:gap-8">
            {/* Coluna Esquerda - Informações do Usuário */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
                {/* Avatar */}
                <div className="flex flex-col items-center mb-6">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name || "Usuário"}
                      className="w-32 h-32 rounded-full object-cover border-4 border-cyan-500 dark:border-cyan-400 shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-400 via-purple-500 to-lime-400 flex items-center justify-center text-white text-4xl font-bold border-4 border-cyan-500 dark:border-cyan-400 shadow-lg">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-4 text-center">
                    {user?.name || "Usuário"}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-gray-400 mt-1 text-center break-words">
                    {user?.email || ""}
                  </p>
                </div>

                {/* Botão Editar Perfil */}
                <button
                  onClick={() => navigate("/profile/edit")}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Pencil size={18} />
                  Editar Perfil
                </button>
              </div>
            </div>

            {/* Coluna Direita - Estatísticas e Informações */}
            <div className="lg:col-span-2 space-y-6">
              {/* Estatísticas */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Estatísticas</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{stats.favorite}</div>
                    <div className="text-xs text-slate-600 dark:text-gray-400 mt-1">Favoritos</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.lists}</div>
                    <div className="text-xs text-slate-600 dark:text-gray-400 mt-1">Listas</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="text-2xl font-bold text-lime-600 dark:text-lime-400">{stats.watched}</div>
                    <div className="text-xs text-slate-600 dark:text-gray-400 mt-1">Assistidos</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.want}</div>
                    <div className="text-xs text-slate-600 dark:text-gray-400 mt-1">Quero ver</div>
                  </div>
                </div>
              </div>

              {/* Informações Pessoais */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Informações Pessoais</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 dark:text-gray-400 mb-1">
                      Nome
                    </label>
                    <div className="text-base text-slate-900 dark:text-white">
                      {firstName || "—"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 dark:text-gray-400 mb-1">
                      Sobrenome
                    </label>
                    <div className="text-base text-slate-900 dark:text-white">
                      {lastName || "—"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 dark:text-gray-400 mb-1">
                      Email
                    </label>
                    <div className="text-base text-slate-900 dark:text-white break-words">
                      {user?.email || "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-white" style={{ '--app-header-h': '64px', '--app-header-h-sm': '72px', '--app-header-h-md': '80px' } as React.CSSProperties}>
      {/* HEADER - Aparece quando logado OU quando visualizando conteúdo compartilhado */}
      {(isLoggedIn || viewingShared || hasShareSlug || resolvingShare) && (
        <>
          <header 
            className="fixed top-0 left-0 right-0 z-[1000] backdrop-blur-xl bg-white/95 dark:bg-slate-950/95 border-b border-slate-200 dark:border-white/10 shadow-lg" 
            style={{ 
              paddingTop: 'max(env(safe-area-inset-top), 0px)',
            }}
          >
            <div className="container mx-auto px-3 sm:px-4 md:px-6">
              {/* Linha 1: Logo e Utils */}
              <div className="flex items-center justify-between py-2 gap-3 min-h-[48px]">
                {/* Logo */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink">
                  {isLoggedIn && !useBottomNav && (
                    <button
                      onClick={() => setShowMobileMenu(!showMobileMenu)}
                      className="min-[760px]:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label="Menu"
                    >
                      <Menu size={24} className="text-slate-900 dark:text-white" />
                    </button>
                  )}
                  <div className="flex items-center gap-2 sm:gap-3 cursor-pointer flex-shrink-0" onClick={() => { handleTabChange("home"); handleCategoryChange("home"); setShowMobileMenu(false); }}>
                    <svg width="32" height="32" className="sm:w-9 sm:h-9 flex-shrink-0" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 8 L8 32 L20 20 Z" fill="#00BCD4" />
                      <path d="M12 12 L12 28 L24 20 Z" fill="#7B3FF2" />
                      <path d="M16 8 L32 20 L16 32 Z" fill="#C6D800" />
                    </svg>
                    <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 bg-clip-text text-transparent whitespace-nowrap">VETRA</h1>
                  </div>
                </div>

                {/* Utils */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                  <LanguageMenu lang={lang as Lang} onChange={(l) => setLang(l)} />
                  {(isLoggedIn || viewingShared || hasShareSlug) && <ThemeButton enabled={darkEnabled} onToggle={toggleDark} />}
                  {isLoggedIn && !viewingShared && (
                    <div className="relative" ref={setProfileMenuRef}>
                      <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-300 dark:border-slate-700 flex-shrink-0"
                      >
                        {user?.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.name || "Usuário"}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-cyan-400 via-purple-500 to-lime-400 flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0">
                            {user?.name?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                        )}
                        <ChevronDown size={14} className={`hidden sm:block transition-transform flex-shrink-0 ${showProfileMenu ? "rotate-180" : ""}`} />
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
                          navigate("/profile");
                          setShowProfileMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                      >
                        <User size={16} />
                        Meu perfil
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
                      <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>
                      <Link
                        to="/privacy"
                        target="_blank"
                        onClick={() => setShowProfileMenu(false)}
                        className="w-full px-4 py-2 text-left text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                      >
                        <Lock size={16} />
                        Privacidade
                      </Link>
                      <Link
                        to="/terms"
                        target="_blank"
                        onClick={() => setShowProfileMenu(false)}
                        className="w-full px-4 py-2 text-left text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                      >
                        <FileText size={16} />
                        Termos de Uso
                      </Link>
                      <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>
                      <button
                        onClick={() => {
                          setShowDeleteAccountModal(true);
                          setShowProfileMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                      >
                        <Trash2 size={16} />
                        Excluir conta
                      </button>
                      <button
                        onClick={() => {
                          setIsLoggedIn(false);
                          setUser(null);
                          setShowProfileMenu(false);
                          // Limpar tokens ao fazer logout
                          localStorage.removeItem('vetra:idToken');
                          localStorage.removeItem('vetra:refreshToken');
                          localStorage.removeItem('vetra:last_email');
                          pushToast({ message: "Logout realizado com sucesso", tone: "ok" });
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

              {/* Linha 2: Navegação */}
              {!useBottomNav && (
                <nav 
                  ref={headerNavRef} 
                  style={{ 
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  } as React.CSSProperties & { WebkitOverflowScrolling?: string; scrollbarWidth?: string; msOverflowStyle?: string }}
                  className="hidden min-[760px]:flex items-center gap-2 md:gap-3 w-full overflow-x-auto scrollbar-hide pb-2 shrink-0"
                  role="tablist"
                  aria-label={t("nav.main_navigation")}
                >
                  <button 
                    onClick={() => { handleTabChange("home"); handleCategoryChange("home"); }}
                    role="tab"
                    aria-selected={activeTab==="home" && activeCategory==="home"}
                    aria-controls="home-content"
                    className={`nav-tab-button relative px-3 py-2 pb-3 transition-all duration-200 flex items-center justify-center gap-1.5 min-h-[40px] shrink-0 font-medium text-sm md:text-base ${
                      activeTab==="home" && activeCategory==="home"
                        ? "text-slate-900 dark:text-white font-semibold" 
                        : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                    } focus:outline-none focus-visible:outline-none`}
                  >
                    <Home size={16} className="min-[900px]:hidden flex-shrink-0" />
                    <span className="hidden min-[900px]:inline">{t("home")}</span>
                    <span className="min-[900px]:hidden">{t("home").substring(0, 3)}</span>
                    {activeTab==="home" && activeCategory==="home" && (
                      <div className="nav-tab-indicator-active absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 rounded-full transition-all duration-200" />
                    )}
                    {!(activeTab==="home" && activeCategory==="home") && (
                      <div className="nav-tab-indicator-focus absolute bottom-0 left-0 right-0 h-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 rounded-full transition-all duration-200 pointer-events-none" />
                    )}
                  </button>
                  <button 
                    onClick={() => { handleTabChange("home"); handleCategoryChange("movies"); }}
                    role="tab"
                    aria-selected={activeTab==="home" && activeCategory==="movies"}
                    aria-controls="movies-content"
                    className={`nav-tab-button relative px-3 py-2 pb-3 transition-all duration-200 flex items-center justify-center gap-1.5 min-h-[40px] shrink-0 font-medium text-sm md:text-base ${
                      activeTab==="home" && activeCategory==="movies"
                        ? "text-slate-900 dark:text-white font-semibold" 
                        : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                    } focus:outline-none focus-visible:outline-none`}
                  >
                    <Film size={16} className="min-[900px]:hidden flex-shrink-0" />
                    <span className="hidden min-[900px]:inline">{t("movies")}</span>
                    <span className="min-[900px]:hidden">{t("movies").substring(0, 4)}</span>
                    {activeTab==="home" && activeCategory==="movies" && (
                      <div className="nav-tab-indicator-active absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 rounded-full transition-all duration-200" />
                    )}
                    {!(activeTab==="home" && activeCategory==="movies") && (
                      <div className="nav-tab-indicator-focus absolute bottom-0 left-0 right-0 h-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 rounded-full transition-all duration-200 pointer-events-none" />
                    )}
                  </button>
                  <button 
                    onClick={() => { handleTabChange("home"); handleCategoryChange("tv"); }}
                    role="tab"
                    aria-selected={activeTab==="home" && activeCategory==="tv"}
                    aria-controls="tv-content"
                    className={`nav-tab-button relative px-3 py-2 pb-3 transition-all duration-200 flex items-center justify-center gap-1.5 min-h-[40px] shrink-0 font-medium text-sm md:text-base ${
                      activeTab==="home" && activeCategory==="tv"
                        ? "text-slate-900 dark:text-white font-semibold" 
                        : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                    } focus:outline-none focus-visible:outline-none`}
                  >
                    <Tv size={16} className="min-[900px]:hidden flex-shrink-0" />
                    <span className="hidden min-[900px]:inline">{t("tv_series")}</span>
                    <span className="min-[900px]:hidden">{t("tv_series").substring(0, 4)}</span>
                    {activeTab==="home" && activeCategory==="tv" && (
                      <div className="nav-tab-indicator-active absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 rounded-full transition-all duration-200" />
                    )}
                    {!(activeTab==="home" && activeCategory==="tv") && (
                      <div className="nav-tab-indicator-focus absolute bottom-0 left-0 right-0 h-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 rounded-full transition-all duration-200 pointer-events-none" />
                    )}
                  </button>
                  <button 
                    onClick={() => { handleTabChange("favorites"); }}
                    role="tab"
                    aria-selected={activeTab==="favorites"}
                    aria-controls="favorites-content"
                    className={`nav-tab-button relative px-3 py-2 pb-3 transition-all duration-200 flex items-center justify-center gap-1.5 min-h-[40px] shrink-0 font-medium text-sm md:text-base ${
                      activeTab==="favorites" 
                        ? "text-slate-900 dark:text-white font-semibold" 
                        : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                    } focus:outline-none focus-visible:outline-none`}
                  >
                    <Heart size={16} className="min-[900px]:hidden flex-shrink-0" />
                    <span className="hidden min-[900px]:inline">{t("nav.favorites")}</span>
                    <span className="hidden min-[520px]:inline min-[900px]:hidden">{t("nav.favorites").substring(0, 4)}</span>
                    <span className="min-[520px]:hidden">{t("nav.favorites").substring(0, 3)}</span>
                    {activeTab==="favorites" && (
                      <div className="nav-tab-indicator-active absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 rounded-full transition-all duration-200" />
                    )}
                    {activeTab!=="favorites" && (
                      <div className="nav-tab-indicator-focus absolute bottom-0 left-0 right-0 h-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 rounded-full transition-all duration-200 pointer-events-none" />
                    )}
                  </button>
                  <button 
                    onClick={() => { handleTabChange("lists"); }}
                    role="tab"
                    aria-selected={activeTab==="lists"}
                    aria-controls="lists-content"
                    className={`nav-tab-button relative px-3 py-2 pb-3 transition-all duration-200 flex items-center justify-center gap-1.5 min-h-[40px] shrink-0 font-medium text-sm md:text-base ${
                      activeTab==="lists" 
                        ? "text-slate-900 dark:text-white font-semibold" 
                        : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                    } focus:outline-none focus-visible:outline-none`}
                  >
                    {t("lists")}
                    {activeTab==="lists" && (
                      <div className="nav-tab-indicator-active absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 rounded-full transition-all duration-200" />
                    )}
                    {activeTab!=="lists" && (
                      <div className="nav-tab-indicator-focus absolute bottom-0 left-0 right-0 h-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 rounded-full transition-all duration-200 pointer-events-none" />
                    )}
                  </button>
                  <button 
                    onClick={() => { handleTabChange("watchlist"); }}
                    role="tab"
                    aria-selected={activeTab==="watchlist" || activeTab.startsWith("watchlist-")}
                    aria-controls="watchlist-content"
                    className={`nav-tab-button relative px-3 py-2 pb-3 transition-all duration-200 flex items-center justify-center gap-1.5 min-h-[40px] shrink-0 font-medium text-sm md:text-base ${
                      activeTab==="watchlist" || activeTab.startsWith("watchlist-")
                        ? "text-slate-900 dark:text-white font-semibold" 
                        : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                    } focus:outline-none focus-visible:outline-none`}
                  >
                    Coleções
                    {(activeTab==="watchlist" || activeTab.startsWith("watchlist-")) && (
                      <div className="nav-tab-indicator-active absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 rounded-full transition-all duration-200" />
                    )}
                    {!(activeTab==="watchlist" || activeTab.startsWith("watchlist-")) && (
                      <div className="nav-tab-indicator-focus absolute bottom-0 left-0 right-0 h-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 rounded-full transition-all duration-200 pointer-events-none" />
                    )}
                  </button>
                  <button 
                    onClick={() => { handleTabChange("people"); }}
                    role="tab"
                    aria-selected={activeTab==="people"}
                    aria-controls="people-content"
                    className={`nav-tab-button relative px-3 py-2 pb-3 transition-all duration-200 flex items-center justify-center gap-1.5 min-h-[40px] shrink-0 font-medium text-sm md:text-base ${
                      activeTab==="people" 
                        ? "text-slate-900 dark:text-white font-semibold" 
                        : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                    } focus:outline-none focus-visible:outline-none`}
                  >
                    {t("people")}
                    {activeTab==="people" && (
                      <div className="nav-tab-indicator-active absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 rounded-full transition-all duration-200" />
                    )}
                    {activeTab!=="people" && (
                      <div className="nav-tab-indicator-focus absolute bottom-0 left-0 right-0 h-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 rounded-full transition-all duration-200 pointer-events-none" />
                    )}
                  </button>
                </nav>
              )}
            </div>
          </header>
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
                  onClick={() => { handleTabChange("home"); handleCategoryChange("home"); setShowMobileMenu(false); }}
                  className={`relative w-full text-left px-4 py-3 transition-colors flex items-center gap-3 ${
                    activeTab === "home" && activeCategory === "home"
                      ? "text-slate-900 dark:text-white font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Home size={20} />
                  <span>{t("home")}</span>
                  {activeTab === "home" && activeCategory === "home" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => { handleTabChange("home"); handleCategoryChange("movies"); setShowMobileMenu(false); }}
                  className={`relative w-full text-left px-4 py-3 transition-colors flex items-center gap-3 ${
                    activeTab === "home" && activeCategory === "movies"
                      ? "text-slate-900 dark:text-white font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Film size={20} />
                  <span>{t("movies")}</span>
                  {activeTab === "home" && activeCategory === "movies" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => { handleTabChange("home"); handleCategoryChange("tv"); setShowMobileMenu(false); }}
                  className={`relative w-full text-left px-4 py-3 transition-colors flex items-center gap-3 ${
                    activeTab === "home" && activeCategory === "tv"
                      ? "text-slate-900 dark:text-white font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Tv size={20} />
                  <span>{t("tv_series")}</span>
                  {activeTab === "home" && activeCategory === "tv" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => { handleTabChange("favorites"); setShowMobileMenu(false); }}
                  className={`relative w-full text-left px-4 py-3 transition-colors flex items-center gap-3 ${
                    activeTab === "favorites"
                      ? "text-slate-900 dark:text-white font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Heart size={20} />
                  <span>{t("nav.favorites")}</span>
                  {activeTab === "favorites" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => { setActiveListId(null); handleTabChange("lists"); setShowMobileMenu(false); }}
                  className={`relative w-full text-left px-4 py-3 transition-colors flex items-center gap-3 ${
                    activeTab === "lists"
                      ? "text-slate-900 dark:text-white font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <ListIcon size={20} />
                  <span>{t("lists")}</span>
                  {activeTab === "lists" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => { handleTabChange("watchlist"); setShowMobileMenu(false); }}
                  className={`relative w-full text-left px-4 py-3 transition-colors flex items-center gap-3 ${
                    activeTab === "watchlist" || activeTab.startsWith("watchlist-")
                      ? "text-slate-900 dark:text-white font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Bookmark size={20} />
                  <span>Coleções</span>
                  {(activeTab === "watchlist" || activeTab.startsWith("watchlist-")) && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => { handleTabChange("people"); setShowMobileMenu(false); }}
                  className={`relative w-full text-left px-4 py-3 transition-colors flex items-center gap-3 ${
                    activeTab === "people"
                      ? "text-slate-900 dark:text-white font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Users size={20} />
                  <span>{t("people")}</span>
                  {activeTab === "people" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 rounded-full" />
                  )}
                </button>
                <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>
                <button
                  onClick={() => { setActiveTab("history"); setShowMobileMenu(false); }}
                  className={`relative w-full text-left px-4 py-3 transition-colors flex items-center gap-3 ${
                    activeTab === "history"
                      ? "text-slate-900 dark:text-white font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Clock size={20} />
                  <span>Histórico</span>
                  {watchHistory.length > 0 && (
                    <span className="ml-auto text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full">
                      {watchHistory.length}
                    </span>
                  )}
                  {activeTab === "history" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => { setActiveTab("stats"); setShowMobileMenu(false); }}
                  className={`relative w-full text-left px-4 py-3 transition-colors flex items-center gap-3 ${
                    activeTab === "stats"
                      ? "text-slate-900 dark:text-white font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <BarChart3 size={20} />
                  <span>Estatísticas</span>
                  {activeTab === "stats" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 rounded-full" />
                  )}
                </button>
                <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>
                <button
                  onClick={() => {
                    navigate("/profile");
                    setShowMobileMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <User size={20} />
                  <span>Meu perfil</span>
                </button>
                <button
                  onClick={() => {
                    setIsLoggedIn(false);
                    setUser(null);
                    setShowMobileMenu(false);
                    // Limpar tokens ao fazer logout
                    localStorage.removeItem('vetra:idToken');
                    localStorage.removeItem('vetra:refreshToken');
                    localStorage.removeItem('vetra:last_email');
                    pushToast({ message: "Logout realizado com sucesso", tone: "ok" });
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
        </>
      )}

      {/* MAIN */}
      {/* Padding-top para header fixo, padding-bottom para navegação mobile */}
      {(isLoggedIn || viewingShared || hasShareSlug || resolvingShare) && (
        <main 
          className={`${isLoggedIn && useBottomNav ? "pb-20" : isLoggedIn ? "pb-16 sm:pb-20 md:pb-24" : "pb-12"}`} 
          style={{
            paddingTop: isLoggedIn && !useBottomNav 
              ? 'calc(112px + max(env(safe-area-inset-top), 0px))' // Header com navegação: ~64px (linha 1) + ~48px (linha 2)
              : 'calc(64px + max(env(safe-area-inset-top), 0px))', // Header sem navegação: ~64px
            scrollMarginTop: isLoggedIn && !useBottomNav 
              ? 'calc(112px + max(env(safe-area-inset-top), 0px))'
              : 'calc(64px + max(env(safe-area-inset-top), 0px))',
            ...(isLoggedIn && useBottomNav ? { paddingBottom: `calc(56px + max(env(safe-area-inset-bottom), 0px))` } : {})
          }}
        >
          {/* Se estiver na página de perfil ou edição de perfil, renderizar APENAS ela, sem conteúdo adicional */}
          {location.pathname === "/profile" || location.pathname === "/me" ? (
            <ProfileViewPage />
          ) : (location.pathname === "/profile/edit" || location.pathname === "/edit-profile") ? (
            <EditProfilePage
              user={user}
              isLoggedIn={isLoggedIn}
              favorites={favorites}
              lists={lists}
              userStates={userStates}
              pushToast={pushToast}
              saveProfile={saveProfile}
              setIsLoggedIn={setIsLoggedIn}
              setUser={setUser}
              setEditProfileHasChanges={setEditProfileHasChanges}
              editProfileHasChanges={editProfileHasChanges}
              setPendingTabChange={setPendingTabChange}
              setPendingCategoryChange={setPendingCategoryChange}
              setShowExitEditProfileConfirm={setShowExitEditProfileConfirm}
            />
          ) : (
            <>
              {activeTab === "home" && activeCategory === "home" && HomeContent}
              {activeTab === "home" && activeCategory !== "home" && (
            <div className={`container mx-auto px-3 sm:px-4 md:px-6 pt-12 sm:pt-14 md:pt-16 lg:pt-20 ${viewingShared && !isLoggedIn ? "pt-20 sm:pt-24" : ""}`}>
                {activeTab === "home" && activeCategory === "movies" && (
                  <div className="flex flex-col min-[1280px]:flex-row gap-4 sm:gap-6">
                    {/* Filtros Laterais */}
                    <DiscoverFiltersPanel
                      media="movie"
                      filters={moviesFilters}
                      onFiltersChange={(newFilters) => {
                        setMoviesFilters(newFilters);
                        setDiscoverMovies((prev) => ({ ...prev, page: 1 }));
                        loadDiscoverMovies(1, newFilters);
                      }}
                      onReset={() => {
                        const defaultFilters = { sortBy: "popularity.desc", region: "BR", withPoster: true };
                        setMoviesFilters(defaultFilters);
                        setDiscoverMovies((prev) => ({ ...prev, page: 1 }));
                        loadDiscoverMovies(1, defaultFilters);
                      }}
                      onApply={() => {
                        setDiscoverMovies((prev) => ({ ...prev, page: 1 }));
                        loadDiscoverMovies(1, moviesFilters);
                        // Removido scroll automático para o topo
                      }}
                      facets={moviesFacets}
                    />
                    
                    {/* Grid de Resultados */}
                    <div className="flex-1 min-w-0">
                      <div className="mb-4 sm:mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                          <div>
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">{t("movies")}</h2>
                            {discoverMovies.total > 0 && (
                              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                {discoverMovies.total} resultados • Mostrando {((discoverMovies.page - 1) * moviesPerPage) + 1}–{Math.min(discoverMovies.page * moviesPerPage, discoverMovies.total)} de {discoverMovies.total}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">Itens por página:</label>
                            <select
                              value={moviesPerPage}
                              onChange={(e) => {
                                const newPerPage = parseInt(e.target.value, 10);
                                setMoviesPerPage(newPerPage);
                                localStorage.setItem("vetra:moviesPerPage", String(newPerPage));
                                setDiscoverMovies((prev) => ({ ...prev, page: 1 }));
                                loadDiscoverMovies(1, moviesFilters);
                              }}
                              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px]"
                            >
                              <option value="12">12</option>
                              <option value="24">24</option>
                              <option value="36">36</option>
                              <option value="48">48</option>
                            </select>
                          </div>
                        </div>
                        
                        {discoverMovies.totalPages > 1 && (
                          <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                            <button
                              onClick={() => {
                                const prevPage = discoverMovies.page - 1;
                                if (prevPage >= 1) {
                                  loadDiscoverMovies(prevPage, moviesFilters);
                                  // Removido scroll automático para o topo
                                }
                              }}
                              disabled={discoverMovies.page === 1 || discoverMovies.loading}
                              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                            >
                              <ChevronLeft size={18} />
                            </button>
                            {Array.from({ length: Math.min(5, discoverMovies.totalPages) }, (_, i) => {
                              let pageNum;
                              if (discoverMovies.totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (discoverMovies.page <= 3) {
                                pageNum = i + 1;
                              } else if (discoverMovies.page >= discoverMovies.totalPages - 2) {
                                pageNum = discoverMovies.totalPages - 4 + i;
                              } else {
                                pageNum = discoverMovies.page - 2 + i;
                              }
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => {
                                    loadDiscoverMovies(pageNum, moviesFilters);
                                    // Removido scroll automático para o topo
                                  }}
                                  disabled={discoverMovies.loading}
                                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                                    discoverMovies.page === pageNum
                                      ? "bg-cyan-600 text-white border-cyan-600"
                                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                            <button
                              onClick={() => {
                                const nextPage = discoverMovies.page + 1;
                                if (nextPage <= discoverMovies.totalPages) {
                                  loadDiscoverMovies(nextPage, moviesFilters);
                                  // Removido scroll automático para o topo
                                }
                              }}
                              disabled={discoverMovies.page === discoverMovies.totalPages || discoverMovies.loading}
                              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                            >
                              <ChevronRight size={18} />
                            </button>
                          </div>
                        )}
                      </div>

                      {discoverMovies.loading && discoverMovies.items.length === 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 min-[1280px]:grid-cols-5 min-[1536px]:grid-cols-6 gap-3 sm:gap-4">
                          {[...Array(12)].map((_, i) => (
                            <div key={i} className="aspect-[2/3] bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
                          ))}
                        </div>
                      ) : discoverMovies.items.length > 0 ? (
                        <>
                          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 min-[1201px]:grid-cols-6 gap-2 sm:gap-2 md:gap-3 lg:gap-4">
                            {discoverMovies.items.map((movie) => (
                              <MovieCard key={mediaKey(movie)} movie={movie} />
                            ))}
                          </div>
                        {discoverMovies.totalPages > 1 && (
                          <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
                            <button
                              onClick={() => {
                                const prevPage = discoverMovies.page - 1;
                                if (prevPage >= 1) {
                                  loadDiscoverMovies(prevPage, moviesFilters);
                                  // Removido scroll automático para o topo
                                }
                              }}
                              disabled={discoverMovies.page === 1 || discoverMovies.loading}
                              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                            >
                              <ChevronLeft size={18} />
                            </button>
                            {Array.from({ length: Math.min(5, discoverMovies.totalPages) }, (_, i) => {
                              let pageNum;
                              if (discoverMovies.totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (discoverMovies.page <= 3) {
                                pageNum = i + 1;
                              } else if (discoverMovies.page >= discoverMovies.totalPages - 2) {
                                pageNum = discoverMovies.totalPages - 4 + i;
                              } else {
                                pageNum = discoverMovies.page - 2 + i;
                              }
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => {
                                    loadDiscoverMovies(pageNum, moviesFilters);
                                    // Removido scroll automático para o topo
                                  }}
                                  disabled={discoverMovies.loading}
                                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                                    discoverMovies.page === pageNum
                                      ? "bg-cyan-600 text-white border-cyan-600"
                                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                            <button
                              onClick={() => {
                                const nextPage = discoverMovies.page + 1;
                                if (nextPage <= discoverMovies.totalPages) {
                                  loadDiscoverMovies(nextPage, moviesFilters);
                                  // Removido scroll automático para o topo
                                }
                              }}
                              disabled={discoverMovies.page === discoverMovies.totalPages || discoverMovies.loading}
                              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                            >
                              <ChevronRight size={18} />
                            </button>
                          </div>
                        )}
                        </>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            Nenhum título encontrado para estes filtros.
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-4">
                            <button
                              onClick={() => setMoviesFilters({ sortBy: "popularity.desc", region: "BR", withPoster: true })}
                              className="px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 transition-colors min-h-[44px]"
                            >
                              Limpar filtros
                            </button>
                            <button
                              onClick={() => {
                                setMoviesFilters({ sortBy: "popularity.desc", region: "BR", withPoster: true });
                                loadDiscoverMovies(1, { sortBy: "popularity.desc", region: "BR", withPoster: true });
                              }}
                              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors min-h-[44px]"
                            >
                              Voltar para populares
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {activeTab === "home" && activeCategory === "tv" && (
                  <div className="flex flex-col min-[1280px]:flex-row gap-4 sm:gap-6">
                    {/* Filtros Laterais */}
                    <DiscoverFiltersPanel
                      media="tv"
                      filters={tvFilters}
                      onFiltersChange={(newFilters) => {
                        setTvFilters(newFilters);
                        setDiscoverTv((prev) => ({ ...prev, page: 1 }));
                        loadDiscoverTv(1, newFilters);
                      }}
                      onReset={() => {
                        const defaultFilters = { sortBy: "popularity.desc", region: "BR", withPoster: true };
                        setTvFilters(defaultFilters);
                        setDiscoverTv((prev) => ({ ...prev, page: 1 }));
                        loadDiscoverTv(1, defaultFilters);
                      }}
                      onApply={() => {
                        setDiscoverTv((prev) => ({ ...prev, page: 1 }));
                        loadDiscoverTv(1, tvFilters);
                        // Removido scroll automático para o topo
                      }}
                      facets={tvFacets}
                    />
                    
                    {/* Grid de Resultados */}
                    <div className="flex-1 min-w-0">
                      <div className="mb-4 sm:mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                          <div>
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">{t("tv_series")}</h2>
                            {discoverTv.total > 0 && (
                              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                {discoverTv.total} resultados • Mostrando {((discoverTv.page - 1) * tvPerPage) + 1}–{Math.min(discoverTv.page * tvPerPage, discoverTv.total)} de {discoverTv.total}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">Itens por página:</label>
                            <select
                              value={tvPerPage}
                              onChange={(e) => {
                                const newPerPage = parseInt(e.target.value, 10);
                                setTvPerPage(newPerPage);
                                localStorage.setItem("vetra:tvPerPage", String(newPerPage));
                                setDiscoverTv((prev) => ({ ...prev, page: 1 }));
                                loadDiscoverTv(1, tvFilters);
                              }}
                              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px]"
                            >
                              <option value="12">12</option>
                              <option value="24">24</option>
                              <option value="36">36</option>
                              <option value="48">48</option>
                            </select>
                          </div>
                        </div>
                        
                        {discoverTv.totalPages > 1 && (
                          <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                            <button
                              onClick={() => {
                                const prevPage = discoverTv.page - 1;
                                if (prevPage >= 1) {
                                  loadDiscoverTv(prevPage, tvFilters);
                                  // Removido scroll automático para o topo
                                }
                              }}
                              disabled={discoverTv.page === 1 || discoverTv.loading}
                              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                            >
                              <ChevronLeft size={18} />
                            </button>
                            {Array.from({ length: Math.min(5, discoverTv.totalPages) }, (_, i) => {
                              let pageNum;
                              if (discoverTv.totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (discoverTv.page <= 3) {
                                pageNum = i + 1;
                              } else if (discoverTv.page >= discoverTv.totalPages - 2) {
                                pageNum = discoverTv.totalPages - 4 + i;
                              } else {
                                pageNum = discoverTv.page - 2 + i;
                              }
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => {
                                    loadDiscoverTv(pageNum, tvFilters);
                                    // Removido scroll automático para o topo
                                  }}
                                  disabled={discoverTv.loading}
                                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                                    discoverTv.page === pageNum
                                      ? "bg-cyan-600 text-white border-cyan-600"
                                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                            <button
                              onClick={() => {
                                const nextPage = discoverTv.page + 1;
                                if (nextPage <= discoverTv.totalPages) {
                                  loadDiscoverTv(nextPage, tvFilters);
                                  // Removido scroll automático para o topo
                                }
                              }}
                              disabled={discoverTv.page === discoverTv.totalPages || discoverTv.loading}
                              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                            >
                              <ChevronRight size={18} />
                            </button>
                          </div>
                        )}
                      </div>

                      {discoverTv.loading && discoverTv.items.length === 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 min-[1280px]:grid-cols-5 min-[1536px]:grid-cols-6 gap-3 sm:gap-4">
                          {[...Array(12)].map((_, i) => (
                            <div key={i} className="aspect-[2/3] bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
                          ))}
                        </div>
                      ) : discoverTv.items.length > 0 ? (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 min-[1280px]:grid-cols-5 min-[1536px]:grid-cols-6 gap-2 sm:gap-2 md:gap-3 lg:gap-4">
                            {discoverTv.items.map((series) => (
                              <MovieCard key={mediaKey(series)} movie={series} />
                            ))}
                          </div>
                        {discoverTv.totalPages > 1 && (
                          <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
                            <button
                              onClick={() => {
                                const prevPage = discoverTv.page - 1;
                                if (prevPage >= 1) {
                                  loadDiscoverTv(prevPage, tvFilters);
                                  // Removido scroll automático para o topo
                                }
                              }}
                              disabled={discoverTv.page === 1 || discoverTv.loading}
                              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                            >
                              <ChevronLeft size={18} />
                            </button>
                            {Array.from({ length: Math.min(5, discoverTv.totalPages) }, (_, i) => {
                              let pageNum;
                              if (discoverTv.totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (discoverTv.page <= 3) {
                                pageNum = i + 1;
                              } else if (discoverTv.page >= discoverTv.totalPages - 2) {
                                pageNum = discoverTv.totalPages - 4 + i;
                              } else {
                                pageNum = discoverTv.page - 2 + i;
                              }
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => {
                                    loadDiscoverTv(pageNum, tvFilters);
                                    // Removido scroll automático para o topo
                                  }}
                                  disabled={discoverTv.loading}
                                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                                    discoverTv.page === pageNum
                                      ? "bg-cyan-600 text-white border-cyan-600"
                                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                            <button
                              onClick={() => {
                                const nextPage = discoverTv.page + 1;
                                if (nextPage <= discoverTv.totalPages) {
                                  loadDiscoverTv(nextPage, tvFilters);
                                  // Removido scroll automático para o topo
                                }
                              }}
                              disabled={discoverTv.page === discoverTv.totalPages || discoverTv.loading}
                              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                            >
                              <ChevronRight size={18} />
                            </button>
                          </div>
                        )}
                        </>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            Nenhum título encontrado para estes filtros.
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-4">
                            <button
                              onClick={() => setTvFilters({ sortBy: "popularity.desc", region: "BR", withPoster: true })}
                              className="px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 transition-colors min-h-[44px]"
                            >
                              Limpar filtros
                            </button>
                            <button
                              onClick={() => {
                                setTvFilters({ sortBy: "popularity.desc", region: "BR", withPoster: true });
                                loadDiscoverTv(1, { sortBy: "popularity.desc", region: "BR", withPoster: true });
                              }}
                              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors min-h-[44px]"
                            >
                              Voltar para populares
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                </div>
              )}
            {activeTab === "favorites" && (
              viewingShared && !isLoggedIn ? (
                <div className="flex flex-col lg:flex-row gap-0 lg:gap-6">
                  {/* Conteúdo principal - Desktop à esquerda, Mobile abaixo */}
                  <div className="flex-1 order-2 lg:order-1">
                    <div className="container mx-auto px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 md:pt-12 lg:pt-16 lg:pt-20">{FavoritesContent}</div>
                  </div>
                  {/* Sidebar com CTA - Desktop à direita (sticky), Mobile no topo - Compacta */}
                  <div className="lg:sticky lg:top-[80px] lg:self-start order-1 lg:order-2 w-full lg:w-64 xl:w-72 flex-shrink-0">
                    <div className="bg-gradient-to-b from-cyan-500/95 via-purple-600/95 to-lime-500/95 backdrop-blur-md border-b lg:border-b-0 lg:border-l border-white/20 shadow-lg lg:rounded-l-xl p-3 lg:p-4">
                      <div className="flex flex-col gap-3">
                        <div>
                          <h3 className="text-white text-base font-bold mb-2">💡 Gostou desta lista?</h3>
                          <p className="text-white text-xs font-medium mb-3 leading-snug">
                            <strong>Crie sua conta no VETRA</strong> para favoritar, comentar e criar suas próprias listas!
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => { setShowLogin(true); setLoginType("signup"); setLoginError(""); setEmailError(""); setPasswordError(""); }}
                            className="w-full px-3 py-2 bg-white text-slate-900 font-semibold rounded-lg hover:bg-gray-100 transition-all text-xs min-h-[40px] flex items-center justify-center whitespace-nowrap shadow-md"
                          >
                            Criar conta
                          </button>
                          <button
                            onClick={() => { setShowLogin(true); setLoginType("signin"); setLoginError(""); setEmailError(""); setPasswordError(""); }}
                            className="w-full px-3 py-2 text-white hover:text-white/80 underline text-xs font-medium min-h-[40px] flex items-center justify-center whitespace-nowrap"
                          >
                            Entrar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="container mx-auto px-3 sm:px-4 md:px-6 pt-12 sm:pt-14 md:pt-16 lg:pt-20">{FavoritesContent}</div>
              )
            )}
            {activeTab === "lists" && (() => {
              const shouldShowSidebar = viewingShared && sharedList && !isLoggedIn;
              if (shouldShowSidebar) {
                console.log('[ListsContent] Renderizando com sidebar:', { viewingShared, hasSharedList: !!sharedList, isLoggedIn });
              }
              return shouldShowSidebar ? (
                <div className="flex flex-col lg:flex-row gap-0 lg:gap-6">
                  {/* Conteúdo principal - Desktop à esquerda, Mobile abaixo */}
                  <div className="flex-1 order-2 lg:order-1">
                    <div className="container mx-auto px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 md:pt-12 lg:pt-16 lg:pt-20">{ListsContent}</div>
                  </div>
                  {/* Sidebar com CTA - Desktop à direita (sticky), Mobile no topo - Compacta */}
                  <div className="lg:sticky lg:top-[80px] lg:self-start order-1 lg:order-2 w-full lg:w-64 xl:w-72 flex-shrink-0">
                    <div className="bg-gradient-to-b from-cyan-500/95 via-purple-600/95 to-lime-500/95 backdrop-blur-md border-b lg:border-b-0 lg:border-l border-white/20 shadow-lg lg:rounded-l-xl p-3 lg:p-4">
                      <div className="flex flex-col gap-3">
                        <div>
                          <h3 className="text-white text-base font-bold mb-2">💡 Gostou desta lista?</h3>
                          <p className="text-white text-xs font-medium mb-3 leading-snug">
                            <strong>Crie sua conta no VETRA</strong> para favoritar, comentar e criar suas próprias listas!
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => { setShowLogin(true); setLoginType("signup"); setLoginError(""); setEmailError(""); setPasswordError(""); }}
                            className="w-full px-3 py-2 bg-white text-slate-900 font-semibold rounded-lg hover:bg-gray-100 transition-all text-xs min-h-[40px] flex items-center justify-center whitespace-nowrap shadow-md"
                          >
                            Criar conta
                          </button>
                          <button
                            onClick={() => { setShowLogin(true); setLoginType("signin"); setLoginError(""); setEmailError(""); setPasswordError(""); }}
                            className="w-full px-3 py-2 text-white hover:text-white/80 underline text-xs font-medium min-h-[40px] flex items-center justify-center whitespace-nowrap"
                          >
                            Entrar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="container mx-auto px-3 sm:px-4 md:px-6 pt-12 sm:pt-14 md:pt-16 lg:pt-20">{ListsContent}</div>
              );
            })()}
            {activeTab === "people" && <div className="container mx-auto px-3 sm:px-4 md:px-6 pt-12 sm:pt-14 md:pt-16 lg:pt-20">{PeopleContent}</div>}
            {activeTab === "history" && <div className="container mx-auto px-3 sm:px-4 md:px-6 pt-12 sm:pt-14 md:pt-16 lg:pt-20">{HistoryContent}</div>}
            {activeTab === "watchlist" && (
              viewingShared && !isLoggedIn ? (
                <div className="flex flex-col lg:flex-row gap-0 lg:gap-6">
                  {/* Conteúdo principal - Desktop à esquerda, Mobile abaixo */}
                  <div className="flex-1 order-2 lg:order-1">
                    <div className="container mx-auto px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 md:pt-12 lg:pt-16 lg:pt-20">{WatchlistContent}</div>
                  </div>
                  {/* Sidebar com CTA - Desktop à direita (sticky), Mobile no topo - Compacta */}
                  <div className="lg:sticky lg:top-[80px] lg:self-start order-1 lg:order-2 w-full lg:w-64 xl:w-72 flex-shrink-0">
                    <div className="bg-gradient-to-b from-cyan-500/95 via-purple-600/95 to-lime-500/95 backdrop-blur-md border-b lg:border-b-0 lg:border-l border-white/20 shadow-lg lg:rounded-l-xl p-3 lg:p-4">
                      <div className="flex flex-col gap-3">
                        <div>
                          <h3 className="text-white text-base font-bold mb-2">💡 Gostou desta lista?</h3>
                          <p className="text-white text-xs font-medium mb-3 leading-snug">
                            <strong>Crie sua conta no VETRA</strong> para favoritar, comentar e criar suas próprias listas!
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => { setShowLogin(true); setLoginType("signup"); setLoginError(""); setEmailError(""); setPasswordError(""); }}
                            className="w-full px-3 py-2 bg-white text-slate-900 font-semibold rounded-lg hover:bg-gray-100 transition-all text-xs min-h-[40px] flex items-center justify-center whitespace-nowrap shadow-md"
                          >
                            Criar conta
                          </button>
                          <button
                            onClick={() => { setShowLogin(true); setLoginType("signin"); setLoginError(""); setEmailError(""); setPasswordError(""); }}
                            className="w-full px-3 py-2 text-white hover:text-white/80 underline text-xs font-medium min-h-[40px] flex items-center justify-center whitespace-nowrap"
                          >
                            Entrar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="container mx-auto px-3 sm:px-4 md:px-6 pt-12 sm:pt-14 md:pt-16 lg:pt-20">{WatchlistContent}</div>
              )
            )}
            {(activeTab.startsWith("watchlist-")) && (
              viewingShared && !isLoggedIn ? (
                <div className="flex flex-col lg:flex-row gap-0 lg:gap-6">
                  {/* Conteúdo principal - Desktop à esquerda, Mobile abaixo */}
                  <div className="flex-1 order-2 lg:order-1">
                    <div className="container mx-auto px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 md:pt-12 lg:pt-16 lg:pt-20">{WatchlistContent}</div>
                  </div>
                  {/* Sidebar com CTA - Desktop à direita (sticky), Mobile no topo - Compacta */}
                  <div className="lg:sticky lg:top-[80px] lg:self-start order-1 lg:order-2 w-full lg:w-64 xl:w-72 flex-shrink-0">
                    <div className="bg-gradient-to-b from-cyan-500/95 via-purple-600/95 to-lime-500/95 backdrop-blur-md border-b lg:border-b-0 lg:border-l border-white/20 shadow-lg lg:rounded-l-xl p-3 lg:p-4">
                      <div className="flex flex-col gap-3">
                        <div>
                          <h3 className="text-white text-base font-bold mb-2">💡 Gostou desta lista?</h3>
                          <p className="text-white text-xs font-medium mb-3 leading-snug">
                            <strong>Crie sua conta no VETRA</strong> para favoritar, comentar e criar suas próprias listas!
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => { setShowLogin(true); setLoginType("signup"); setLoginError(""); setEmailError(""); setPasswordError(""); }}
                            className="w-full px-3 py-2 bg-white text-slate-900 font-semibold rounded-lg hover:bg-gray-100 transition-all text-xs min-h-[40px] flex items-center justify-center whitespace-nowrap shadow-md"
                          >
                            Criar conta
                          </button>
                          <button
                            onClick={() => { setShowLogin(true); setLoginType("signin"); setLoginError(""); setEmailError(""); setPasswordError(""); }}
                            className="w-full px-3 py-2 text-white hover:text-white/80 underline text-xs font-medium min-h-[40px] flex items-center justify-center whitespace-nowrap"
                          >
                            Entrar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="container mx-auto px-3 sm:px-4 md:px-6 pt-12 sm:pt-14 md:pt-16 lg:pt-20">{WatchlistContent}</div>
              )
            )}
            {activeTab === "stats" && <div className="container mx-auto px-3 sm:px-4 md:px-6 pt-12 sm:pt-14 md:pt-16 lg:pt-20">{StatsContent}</div>}
            </>
          )}
        </main>
      )}

      {/* Rodapés */}
      {isLoggedIn && <SiteFooter 
        goToHomeCategory={goToHomeCategory}
        handleFooterLink={handleFooterLink}
        setActiveTab={setActiveTab}
        setShowProfileModal={setShowProfileModal}
        t={t}
      />}
      {isLoggedIn && <MobileFooter 
        useBottomNav={useBottomNav}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        setActiveListId={setActiveListId}
        t={t}
      />}

      {/* Modal de confirmação para sair da página de edição de perfil */}
      {showExitEditProfileConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Alterações não salvas
            </h3>
            <p className="text-slate-600 dark:text-gray-400 mb-6">
              Você tem alterações não salvas no seu perfil. Deseja sair e descartar essas alterações?
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelExitEditProfile}
                className="flex-1 px-4 py-2.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold transition-colors"
              >
                Continuar editando
              </button>
              <button
                onClick={confirmExitEditProfile}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 via-purple-500 to-lime-400 text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Sair sem salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Perfil */}
      {/* Modal de edição de perfil removido - agora é uma página própria em /profile/edit */}

      {/* Sheet para ações bloqueadas (sem login) */}
      {showActionSheet && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowActionSheet(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-200 dark:border-slate-800 animate-fade-in-up max-h-[90vh] overflow-y-auto" style={{ paddingBottom: `max(env(safe-area-inset-bottom), 24px)` }}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Entre para favoritar e guardar tudo</h3>
                <button
                  onClick={() => setShowActionSheet(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Fechar"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowActionSheet(false);
                    setShowLogin(true);
                    setLoginType("signup");
                    setLoginError("");
                    setEmailError("");
                    setPasswordError("");
                  }}
                  className="w-full px-4 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold transition-colors min-h-[44px] flex items-center justify-center"
                >
                  Criar conta
                </button>
                <button
                  onClick={() => {
                    setShowActionSheet(false);
                    setShowLogin(true);
                    setLoginType("signin");
                    setLoginError("");
                    setEmailError("");
                    setPasswordError("");
                  }}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors min-h-[44px] flex items-center justify-center"
                >
                  Entrar
                </button>
                <button
                  onClick={() => {
                    setShowActionSheet(false);
                    setPendingAction(null);
                  }}
                  className="w-full px-4 py-3 rounded-lg text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors min-h-[44px] flex items-center justify-center text-sm"
                >
                  Agora não
                </button>
              </div>
            </div>
          </div>
        </>
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
      {showShare && shareSlug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowShare(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Compartilhar</h3>
              <button 
                onClick={() => setShowShare(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            {!isLoggedIn && (
              <div className="mb-4 p-4 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg">
                <p className="text-sm text-cyan-800 dark:text-cyan-200">
                  <strong>Gostou desta lista?</strong> Entre no VETRA para salvar a sua.
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              {/* Link compartilhável */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Link compartilhável
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={(() => {
                      const fullUrl = `${window.location.origin}${window.location.pathname}?share=${shareSlug}`;
                      // Se for localhost, substituir por um texto genérico para exibição
                      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                        return fullUrl.replace(/https?:\/\/localhost:\d+/, 'vetra.app').replace(/https?:\/\/127\.0\.0\.1:\d+/, 'vetra.app');
                      }
                      return fullUrl;
                    })()}
                    readOnly
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <button
                    onClick={async () => {
                      try {
                        // Sempre copiar a URL completa real (mesmo que seja localhost)
                        const shareUrl = `${window.location.origin}${window.location.pathname}?share=${shareSlug}`;
                        await navigator.clipboard.writeText(shareUrl);
                        pushToast({ message: t("toasts.copied"), tone: "ok" });
                        // Navega para o link compartilhado após copiar (abre direto em ?share=slug)
                        navigate(`?share=${shareSlug}`, { replace: true });
                      } catch {
                        pushToast({ message: t("common.share_fail"), tone: "err" });
                      }
                    }}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors min-h-[44px] flex items-center gap-2 flex-shrink-0"
                  >
                    <Clipboard size={18} />
                    <span className="hidden sm:inline">Copiar link</span>
                    <span className="sm:hidden">Copiar</span>
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                  {t("common.send_link_hint")}
                </p>
              </div>
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

      {showDeleteAccountModal && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteAccountModal(false);
              setDeleteAccountPassword("");
              setDeleteAccountError("");
              setDeleteAccountConfirmCheckbox(false);
            }
          }}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 sm:p-8 border border-slate-300 dark:border-slate-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Excluir conta</h2>
              <button
                onClick={() => {
                  setShowDeleteAccountModal(false);
                  setDeleteAccountPassword("");
                  setDeleteAccountError("");
                  setDeleteAccountConfirmCheckbox(false);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <p className="text-slate-700 dark:text-slate-300 mb-6">
              Esta ação removerá seu perfil, listas e favoritos. Você poderá reativar a conta dentro de 30 dias. Após esse prazo, a exclusão é permanente. Para mais informações sobre retenção de dados, consulte nossa <Link to="/privacy" target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline">Política de Privacidade</Link>.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Digite sua senha para confirmar
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="password"
                    value={deleteAccountPassword}
                    onChange={(e) => {
                      setDeleteAccountPassword(e.target.value);
                      setDeleteAccountError("");
                    }}
                    placeholder="••••••••"
                    className={`w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white pl-10 pr-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 ${
                      deleteAccountError
                        ? "border-red-500 focus:ring-red-500"
                        : "border-slate-300 dark:border-slate-600 focus:ring-cyan-500 focus:border-cyan-500"
                    }`}
                    autoFocus
                  />
                </div>
                {deleteAccountError && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{deleteAccountError}</p>
                )}
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="deleteConfirmCheckbox"
                  checked={deleteAccountConfirmCheckbox}
                  onChange={(e) => setDeleteAccountConfirmCheckbox(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="deleteConfirmCheckbox" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer flex-1">
                  Entendo que esta ação não pode ser desfeita após 30 dias.
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteAccountModal(false);
                  setDeleteAccountPassword("");
                  setDeleteAccountError("");
                  setDeleteAccountConfirmCheckbox(false);
                }}
                className="flex-1 px-4 py-2.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteAccountLoading || !deleteAccountPassword.trim() || !deleteAccountConfirmCheckbox}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleteAccountLoading ? (
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
        passwordStrength={passwordStrength}
        showPasswordTips={showPasswordTips}
        confirmPasswordError={confirmPasswordError}
        confirmPasswordTouched={confirmPasswordTouched}
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
        setLoginType={setLoginType}
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
        generatePassword={generatePassword}
        setShowPasswordTips={setShowPasswordTips}
        setConfirmPasswordError={setConfirmPasswordError}
        setConfirmPasswordTouched={setConfirmPasswordTouched}
        forgotPasswordStep={forgotPasswordStep}
        forgotPasswordNewPassword={forgotPasswordNewPassword}
        forgotPasswordConfirmPassword={forgotPasswordConfirmPassword}
        forgotPasswordShowPassword={forgotPasswordShowPassword}
        emailVerified={emailVerified}
        handleForgotPasswordCheckEmail={handleForgotPasswordCheckEmail}
        handleForgotPasswordReset={handleForgotPasswordReset}
      />}

      {showCoverSelector && (
        <CoverSelectorModal
          isOpen={showCoverSelector}
          onClose={() => {
            setShowCoverSelector(false);
            setCoverSelectorListId(null);
          }}
          onSelect={(cover, listName) => handleCoverSelect(cover, listName)}
          listItems={coverSelectorListId && coverSelectorListId !== "new" 
            ? lists.find(l => l.id === coverSelectorListId)?.items || []
            : []}
          currentCover={coverSelectorListId && coverSelectorListId !== "new"
            ? lists.find(l => l.id === coverSelectorListId)?.cover
            : undefined}
          isNewList={coverSelectorListId === "new"}
          listName={coverSelectorListId === "new" ? `Minha lista ${lists.length + 1}` : undefined}
        />
      )}
    </div>
  );
};

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser, profileLoading, saveProfile, pushToast, t, favorites, lists, userStates, isLoggedIn, setIsLoggedIn, setShowDeleteAccountModal, darkEnabled, toggleDark, lang, setLang, changePassword, exportJSON, exportCSV, importJSON } = (window as any).__APP_SHELL_PROPS__ || {};
  
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Acesso restrito</h1>
          <p className="text-slate-600 dark:text-gray-400 mb-6">Você precisa estar logado para acessar seu perfil.</p>
        </div>
      </div>
    );
  }
  
  return <PlaceholderPage title="Meu Perfil" route="/me" />;
};

const PlaceholderPage: React.FC<{ title: string; route: string }> = ({ title, route }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-4xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Voltar</span>
        </button>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">{title}</h1>
        <p className="text-slate-600 dark:text-gray-400">Em breve</p>
      </div>
    </div>
  );
};

// export padrão
export default function App() {
  const location = useLocation();
  
  // Rotas que devem ser renderizadas fora do AppShell
  if (location.pathname === "/privacy") return <PrivacyPage />;
  if (location.pathname === "/terms") return <TermsPage />;
  if (location.pathname === "/about") return <AboutPage />;
  if (location.pathname === "/help") return <HelpPage />;
  if (location.pathname === "/lists") return <PlaceholderPage title="Listas" route="/lists" />;
  if (location.pathname === "/collections") return <PlaceholderPage title="Coleções" route="/collections" />;
  if (location.pathname === "/history") return <PlaceholderPage title="Histórico" route="/history" />;
  if (location.pathname === "/stats") return <PlaceholderPage title="Estatísticas" route="/stats" />;
  if (location.pathname === "/favorites") return <PlaceholderPage title="Favoritos" route="/favorites" />;
  if (location.pathname === "/trending" || location.pathname === "/popular" || location.pathname === "/top-rated" || location.pathname === "/now-playing" || location.pathname === "/upcoming") {
    return <PlaceholderPage title="Explorar" route={location.pathname} />;
  }
  
  // A rota /profile/edit será tratada dentro do AppShell, mas precisa garantir que não renderize conteúdo adicional
  return <AppShell />;
}

