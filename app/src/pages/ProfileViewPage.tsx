import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { X, Pencil } from "lucide-react";
import type { UserProfile } from "../api";
import type { MovieT, UserList, UserStateMap } from "../types/movies";

interface ProfileViewPageProps {
  user: UserProfile | null;
  favorites: MovieT[];
  lists: UserList[];
  userStates: UserStateMap;
}

export const ProfileViewPage: React.FC<ProfileViewPageProps> = ({
  user,
  favorites,
  lists,
  userStates,
}) => {
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

