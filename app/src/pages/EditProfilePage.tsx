import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Pencil, Lock, Eye, EyeOff, Mail } from "lucide-react";
import { changePassword, resendVerificationEmail } from "../api";
import type { UserProfile } from "../api";
import type { MovieT, UserList, UserStateMap, TabKey } from "../types/movies";

interface EditProfilePageProps {
  user: UserProfile | null;
  isLoggedIn: boolean;
  favorites: MovieT[];
  lists: UserList[];
  userStates: UserStateMap;
  pushToast: (toast: { message: string; tone: "ok" | "err" | "info" }) => void;
  pushBanner?: (banner: { message: string; tone: "success" | "error" | "warning" | "info" }) => void;
  saveProfile: (data: { name: string; avatar_url: string | null }) => Promise<void>;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  setEditProfileHasChanges: React.Dispatch<React.SetStateAction<boolean>>;
  editProfileHasChanges: boolean;
  setShowExitEditProfileConfirm: React.Dispatch<React.SetStateAction<boolean>>;
}

export const EditProfilePage: React.FC<EditProfilePageProps> = ({
  user,
  isLoggedIn,
  favorites,
  lists,
  userStates,
  pushToast,
  pushBanner,
  saveProfile,
  setIsLoggedIn,
  setUser,
  setEditProfileHasChanges,
  editProfileHasChanges,
  setShowExitEditProfileConfirm,
}) => {
  const navigate = useNavigate();
  
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
  
  // Refs para evitar re-inicialização quando user muda
  const initializedForEmailRef = useRef<string | null>(null);
  const originalValuesRef = useRef<{ firstName: string; lastName: string; avatar: string | null } | null>(null);
  
  // Inicializa valores apenas uma vez quando user.email carrega
  useEffect(() => {
    const email = user?.email;
    if (!email || !user) {
      return;
    }
    
    if (initializedForEmailRef.current === email) {
      return;
    }
    
    const fullName = user.name || "";
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(' ') || "";
    const avatar = user.avatar_url || null;
    
    originalValuesRef.current = {
      firstName,
      lastName,
      avatar,
    };
    
    initializedForEmailRef.current = email;
    setEditFirstName(firstName);
    setEditLastName(lastName);
    setEditAvatar(avatar);
  }, [user?.email]);
  
  // Detecta alterações comparando estados locais com valores originais
  useEffect(() => {
    if (!originalValuesRef.current) {
      return;
    }
    
    const original = originalValuesRef.current;
    
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
      if (pushBanner) {
        pushBanner({ message: "Perfil atualizado com sucesso!", tone: "success" });
      } else {
        pushToast({ message: "Perfil atualizado com sucesso!", tone: "ok" });
      }
      setEditProfileHasChanges(false);
      
      if (originalValuesRef.current) {
        originalValuesRef.current = {
          firstName,
          lastName,
          avatar: editAvatar,
        };
      }
      
      navigate("/profile"); // Volta para a página de perfil
    } catch (e: any) {
      if (pushBanner) {
        pushBanner({ message: "Não foi possível atualizar seu perfil. Tente novamente.", tone: "error" });
      } else {
        pushToast({ message: "Não foi possível atualizar seu perfil. Tente novamente.", tone: "err" });
      }
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
        if (pushBanner) {
          pushBanner({ message: "Senha alterada com sucesso.", tone: "success" });
        } else {
          pushToast({ message: "Senha alterada com sucesso! Faça login novamente.", tone: "ok" });
        }
        setShowPasswordSection(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setIsLoggedIn(false);
        setUser(null);
        localStorage.removeItem('vetra:idToken');
        localStorage.removeItem('vetra:refreshToken');
        localStorage.removeItem('vetra:last_email');
        localStorage.removeItem('vetra:activeTab');
        localStorage.removeItem('vetra:activeCategory');
        navigate("/");
      } else {
        const errorMsg = result.error || result.message || "Não foi possível alterar a senha. Confira os dados e tente novamente.";
        if (errorMsg.includes("Token") || errorMsg.includes("token") || errorMsg.includes("Reautentique")) {
          if (pushBanner) {
            pushBanner({ message: "Sua sessão expirou. Faça login novamente para alterar a senha.", tone: "error" });
          } else {
            pushToast({ message: "Sua sessão expirou. Faça login novamente para alterar a senha.", tone: "err" });
          }
        } else {
          if (pushBanner) {
            pushBanner({ message: errorMsg, tone: "error" });
          } else {
            pushToast({ message: errorMsg, tone: "err" });
          }
        }
      }
    } catch (e: any) {
      if (pushBanner) {
        pushBanner({ message: e?.message || e?.error || "Não foi possível alterar a senha. Confira os dados e tente novamente.", tone: "error" });
      } else {
        pushToast({ message: e?.message || e?.error || "Não foi possível alterar a senha. Confira os dados e tente novamente.", tone: "err" });
      }
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

