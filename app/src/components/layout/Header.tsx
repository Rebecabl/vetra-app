import React, { useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Home, Film, Tv, Heart, Users, Menu, X, User, Clock,
  Lock, FileText, Trash2, LogOut, Bookmark, List as ListIcon, ChevronDown
} from "lucide-react";
import { LanguageMenu } from "../LanguageMenu";
import { ThemeButton } from "../../theme";
import type { UserProfile } from "../../api";
import type { TabKey } from "../../types/movies";
import type { Lang } from "../../i18n";

export interface HeaderProps {
  isLoggedIn: boolean;
  viewingShared: boolean;
  hasShareSlug: boolean;
  resolvingShare: boolean;
  useBottomNav: boolean;
  user: UserProfile | null;
  activeTab: TabKey;
  activeCategory: "movies" | "tv" | "people" | "home";
  watchHistory: any[];
  showMobileMenu: boolean;
  showProfileMenu: boolean;
  headerNavRef: React.RefObject<HTMLDivElement>;
  profileMenuRef: HTMLDivElement | null;
  setShowMobileMenu: (show: boolean) => void;
  setShowProfileMenu: (show: boolean) => void;
  setProfileMenuRef: (el: HTMLDivElement | null) => void;
  handleTabChange: (tab: TabKey) => void;
  handleCategoryChange: (category: "movies" | "tv" | "people" | "home") => void;
  setActiveTab: (tab: TabKey) => void;
  setActiveListId: (id: string | null) => void;
  setIsLoggedIn: (loggedIn: boolean) => void;
  setUser: (user: UserProfile | null) => void;
  setShowDeleteAccountModal: (show: boolean) => void;
  pushToast: (toast: { message: string; tone: "ok" | "err" | "info" }) => void;
  lang: Lang;
  setLang: (lang: Lang) => void;
  darkEnabled: boolean;
  toggleDark: () => void;
  t: (key: string) => string;
}

export const Header: React.FC<HeaderProps> = ({
  isLoggedIn,
  viewingShared,
  hasShareSlug,
  resolvingShare,
  useBottomNav,
  user,
  activeTab,
  activeCategory,
  watchHistory,
  showMobileMenu,
  showProfileMenu,
  headerNavRef,
  profileMenuRef,
  setShowMobileMenu,
  setShowProfileMenu,
  setProfileMenuRef,
  handleTabChange,
  handleCategoryChange,
  setActiveTab,
  setActiveListId,
  setIsLoggedIn,
  setUser,
  setShowDeleteAccountModal,
  pushToast,
  lang,
  setLang,
  darkEnabled,
  toggleDark,
  t,
}) => {
  const navigate = useNavigate();

  if (!(isLoggedIn || viewingShared || hasShareSlug || resolvingShare)) {
    return null;
  }

  return (
    <>
      <header 
        className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-white/95 dark:bg-slate-950/95 border-b border-slate-200 dark:border-white/10 shadow-lg" 
        style={{ 
          paddingTop: 'max(env(safe-area-inset-top), 0px)',
        }}
      >
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="flex items-center justify-between py-2 gap-3 min-h-[48px]">
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
              <div 
                className="flex items-center gap-2 sm:gap-3 cursor-pointer flex-shrink-0" 
                onClick={() => { 
                  if (viewingShared && !isLoggedIn) return;
                  handleTabChange("home"); 
                  handleCategoryChange("home"); 
                  setShowMobileMenu(false); 
                }}
              >
                <svg width="32" height="32" className="sm:w-9 sm:h-9 flex-shrink-0" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 8 L8 32 L20 20 Z" fill="#00BCD4" />
                  <path d="M12 12 L12 28 L24 20 Z" fill="#7B3FF2" />
                  <path d="M16 8 L32 20 L16 32 Z" fill="#C6D800" />
                </svg>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 bg-clip-text text-transparent whitespace-nowrap">VETRA</h1>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <LanguageMenu lang={lang} onChange={(l) => setLang(l)} />
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
                    <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-300 dark:border-slate-700 py-2 z-40">
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
                          navigate("/history");
                          setShowProfileMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                      >
                        <Clock size={16} />
                        <span>Histórico</span>
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
                          localStorage.removeItem('vetra:idToken');
                          localStorage.removeItem('vetra:refreshToken');
                          localStorage.removeItem('vetra:last_email');
                          localStorage.removeItem('vetra:activeTab');
                          localStorage.removeItem('vetra:activeCategory');
                          sessionStorage.setItem('vetra:justLoggedOut', 'true');
                          pushToast({ message: "Logout realizado com sucesso", tone: "ok" });
                          navigate("/");
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

          {!useBottomNav && !(viewingShared && !isLoggedIn) && (
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
        <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)}>
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
                onClick={() => { 
                  navigate("/history");
                  setShowMobileMenu(false); 
                }}
                className="relative w-full text-left px-4 py-3 transition-colors flex items-center gap-3 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              >
                <Clock size={20} />
                <span>Histórico</span>
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
                  localStorage.removeItem('vetra:idToken');
                  localStorage.removeItem('vetra:refreshToken');
                  localStorage.removeItem('vetra:last_email');
                  localStorage.removeItem('vetra:activeTab');
                  localStorage.removeItem('vetra:activeCategory');
                  sessionStorage.setItem('vetra:justLoggedOut', 'true');
                  pushToast({ message: "Logout realizado com sucesso", tone: "ok" });
                  navigate("/");
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
  );
};

