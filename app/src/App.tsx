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
import { BannerHost, useBanner } from "./ui/Banner";

import { KebabMenu } from "./ui/KebabMenu";
import { LanguageMenu } from "./components/LanguageMenu";
import LandingScreen from "./landing/LandingScreen";
import { HorizontalCarousel } from "./components/HorizontalCarousel";
import { DiscoverFiltersPanel } from "./components/DiscoverFilters";
import { SearchFiltersPanel, SearchFilters, DEFAULT_FILTERS, getDefaultFilters } from "./components/SearchFiltersPanel";
import { FilterChips } from "./components/FilterChips";
import { ListCover, getListCoverImageUrl, getListFallbackPosters } from "./components/ListCover";
import { useListCover } from "./hooks/useListCover";
import { useAuth } from "./hooks/useAuth";
import { useNavigation } from "./hooks/useNavigation";
import { CoverSelectorModal } from "./components/CoverSelectorModal";
import { Pagination } from "./components/Pagination";
import { CategorySection } from "./components/CategorySection";
import { PrivacyPage } from "./pages/PrivacyPage";
import { TermsPage } from "./pages/TermsPage";
import { AboutPage } from "./pages/AboutPage";
import { HelpPage } from "./pages/HelpPage";
import { EditProfilePage } from "./pages/EditProfilePage";
import { ProfileViewPage } from "./pages/ProfileViewPage";
import { HomePage } from "./pages/HomePage";
import { MoviesPage } from "./pages/MoviesPage";
import { TvPage } from "./pages/TvPage";
import { ActivityHistoryPage } from "./pages/ActivityHistoryPage";
import { PeoplePage } from "./pages/PeoplePage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { ListsPage } from "./pages/ListsPage";
import { WatchlistPage } from "./pages/WatchlistPage";
import { VerificationCodePage } from "./pages/VerificationCodePage";
import { LoginModal } from "./components/LoginModal";
import type { LoginModalProps } from "./components/LoginModal";
import { VerificationEmailModal } from "./components/VerificationEmailModal";
import { MobileFooter } from "./components/MobileFooter";
import { SiteFooter } from "./components/SiteFooter";
import { Header } from "./components/layout/Header";
import { PersonRouteModal } from "./components/PersonRouteModal";
import { ConfirmModal } from "./components/ConfirmModal";
import { DeleteAccountModal } from "./components/DeleteAccountModal";
import { RenameListModal } from "./components/RenameListModal";
import { MovieCardInline } from "./components/MovieCardInline";
import { ListDetail } from "./components/ListDetail";
import type { MediaT, MovieT, UserState, UserStateMap, CatState, UserList, ApiStatus, TabKey } from "./types/movies";

const TMDB_BLACKLIST_IDS = new Set<number>([]);

const isBlacklisted = (movie: { id: number; title?: string; name?: string }): boolean => {
  if (TMDB_BLACKLIST_IDS.has(movie.id)) {
    return true;
  }
  const title = (movie.title || movie.name || "").toLowerCase();
  const blacklistedTitles = [
    "자매의 스와핑",
    "sisters' swapping",
    "sisters swapping",
  ];
  return blacklistedTitles.some(blacklisted => title.includes(blacklisted.toLowerCase()));
};

const filterBlacklisted = <T extends { id: number; title?: string; name?: string }>(movies: T[]): T[] => {
  return movies.filter(m => !isBlacklisted(m));
};
import { KEY_FAVS, KEY_LISTS, KEY_STATES, KEY_HISTORY, KEY_STATS, getStorageKey, clearUserData } from "./constants/storage";
import { mediaKey } from "./types/movies";
import { addHistoryEntry } from "./utils/history.utils";
import { poster, toPosterPath, CAT_META, type CatKey } from "./lib/media.utils";
import { formatDate, formatDateShort } from "./utils/date";
import { mapRows, normalizeNumber, snapRating, snapVotes, logToLinear, linearToLog } from "./utils/movieUtils";
import { dedupeItems } from "./utils/cacheUtils";
import { applyClientSort, hasNonDefaultFilters, filterByPoster } from "./utils/searchUtils";
import { getCountryCode, getCountryFlag } from "./utils/countryUtils";

const AppShell = (): JSX.Element => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);
  
  const { toasts, pushToast, removeToast } = useToast();
  const { banners, pushBanner, removeBanner } = useBanner();
  const auth = useAuth(pushToast, pushBanner);
  
  const {
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
    firstNameError,
    setFirstNameError,
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
    forgotPasswordError,
    setForgotPasswordError,
    forgotPasswordStep,
    setForgotPasswordStep,
    forgotPasswordCode,
    setForgotPasswordCode,
    forgotPasswordNewPassword,
    setForgotPasswordNewPassword,
    forgotPasswordConfirmPassword,
    setForgotPasswordConfirmPassword,
    forgotPasswordShowPassword,
    setForgotPasswordShowPassword,
    forgotPasswordStrength,
    forgotPasswordErrors,
    forgotPasswordShowTips,
    setForgotPasswordShowTips,
    handleForgotPasswordConfirmCode,
    handleForgotPasswordReset,
    emailVerified,
    setEmailVerified,
    showVerificationEmailModal,
    setShowVerificationEmailModal,
    verificationEmail,
    setVerificationEmail,
    handleInputChange,
    handleInputBlur,
    handleSubmit,
    loadProfile,
    saveProfile,
    generatePassword,
    handleForgotPasswordCheckEmail,
    pendingAction,
    setPendingAction,
    pendingRoute,
    setPendingRoute,
  } = auth;
  
  const [showLogin, setShowLogin] = useState(false);
  const [viewingShared, setViewingShared] = useState(false);
  const [resolvingShare, setResolvingShare] = useState(false);
  const [sharedCollection, setSharedCollection] = useState<{ items: Array<{ movie: MovieT; meta: { rating?: number; description?: string } }>; listName: string; category?: string } | null>(null);
  const [sharedList, setSharedList] = useState<{ items: MovieT[]; listName: string } | null>(null);

  const [apiStatus, setApiStatus] = useState<ApiStatus>("carregando");
  const [tmdb, setTmdb] = useState(() => tmdbAuthStatus());

  const { enabled: darkEnabled, toggle: toggleDark } = useDarkMode();
  const { lang, t, setLang } = useLang();
  
  const [searchTerm, setSearchTerm] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("q") || "";
  });
  const [appliedSearchFilters, setAppliedSearchFilters] = useState<SearchFilters>(() => {
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

  const [favorites, setFavorites] = useState<MovieT[]>([]);
  const [lists, setLists] = useState<UserList[]>([]);
  const [userStates, setUserStates] = useState<UserStateMap>({});
  const [watchHistory, setWatchHistory] = useState<Array<{ movie: MovieT; watchedAt: string }>>([]);
  const [userStats, setUserStats] = useState<{
    totalWatched?: number;
    totalFavorites?: number;
    totalLists?: number;
    watchedThisMonth?: number;
    lastWatched?: { movie: MovieT; watchedAt: string } | null;
  }>({});

  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [showListPickerFor, setShowListPickerFor] = useState<MovieT | null>(null);
  const [showCollectionPickerFor, setShowCollectionPickerFor] = useState<MovieT | null>(null);
  const [listSearchQuery, setListSearchQuery] = useState("");
  const [listSortOrder, setListSortOrder] = useState<"recent" | "az" | "items" | "updated">("recent");

  const { setListCover: setListCoverWithApi, isUpdating } = useListCover(lists, setLists);
  
  const clearSearchState = useCallback(() => {
    setSearchTerm("");
    setAppliedSearchFilters(getDefaultFilters());
    setSearchPage(1);
    setMovies([]);
    setPeople([]);
    setSearchTotalResults(0);
    setHasActiveFilters(false);
    setPeopleSearchTerm("");
    setSearchedPeople([]);
    if (window.location.search) {
      window.history.replaceState({}, "", window.location.pathname);
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Função estável que não depende de nenhum estado externo
  
  const setListCover = async (listId: string, type: "item" | "upload" | "auto", itemId?: string, url?: string, focalPoint?: { x: number; y: number }) => {
    if (type === "item" && itemId) {
      if (itemId.includes(":")) {
      const [itemType, id] = itemId.split(":");
        if ((itemType === "movie" || itemType === "tv") && id) {
        return await setListCoverWithApi(listId, type, id, itemType as "movie" | "tv", itemId, url, focalPoint);
        }
      } else {
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
  
  const navigation = useNavigation();
  const {
    activeTab,
    activeCategory,
    setActiveTab,
    setActiveCategory,
    handleTabChange,
    handleCategoryChange,
    showExitEditProfileConfirm,
    setShowExitEditProfileConfirm,
    confirmExitEditProfile,
    cancelExitEditProfile,
    editProfileHasChanges,
    setEditProfileHasChanges,
  } = navigation;

  const [cats, setCats] = useState<Record<CatKey, CatState>>({
    trending: { items: [], page: 0, loading: false, initialized: false },
    popular: { items: [], page: 0, loading: false, initialized: false },
    top_rated: { items: [], page: 0, loading: false, initialized: false },
    now_playing: { items: [], page: 0, loading: false, initialized: false },
    upcoming: { items: [], page: 0, loading: false, initialized: false },
  });

  const [freeWatchFilter, setFreeWatchFilter] = useState<"movie" | "tv">("movie");
  
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
  
  const [topRatedMovies, setTopRatedMovies] = useState<{ items: MovieT[]; loading: boolean; error?: string }>({
    items: [],
    loading: false,
  });
  
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
  
  const rowCache = useRef<Map<string, { data: MovieT[]; timestamp: number; ttl: number }>>(new Map());

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

  const [showShare, setShowShare] = useState(false);
  const [shareSlug, setShareSlug] = useState("");
  const [showSignupCTAHidden, setShowSignupCTAHidden] = useState(() => {
    const hidden = localStorage.getItem("vetra:signupCTAHidden");
    return hidden ? new Date().getTime() - parseInt(hidden, 10) < 30 * 24 * 60 * 60 * 1000 : false;
  });
  const [showActionSheet, setShowActionSheet] = useState(false);
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
  
  const [renameModal, setRenameModal] = useState<{ show: boolean; listId: string | null; currentName: string }>({ show: false, listId: null, currentName: "" });
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; message: string; onConfirm: () => void }>({ show: false, message: "", onConfirm: () => {} });
  const [showCoverSelector, setShowCoverSelector] = useState(false);
  const [coverSelectorListId, setCoverSelectorListId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState("");

  const location = useLocation();
  const navigate = useNavigate();
  const background = (location.state as any)?.background;

  const handleDeleteAccount = async () => {
    if (!deleteAccountPassword.trim() || !deleteAccountConfirmCheckbox) {
      setDeleteAccountError("Preencha todos os campos obrigatórios.");
      return;
    }

    setDeleteAccountLoading(true);
    setDeleteAccountError("");
    
    try {
      const token = localStorage.getItem('vetra:idToken');
      if (!token) {
        setDeleteAccountError("Sessão expirada. Faça login novamente.");
        setDeleteAccountLoading(false);
        return;
      }

      const API_BASE = (import.meta.env.VITE_API_BASE || "").trim() || "http://localhost:4001";
      const url = `${API_BASE}/api/auth/delete-account`;
      console.log("[handleDeleteAccount] Fazendo requisição para:", url);
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ password: deleteAccountPassword })
      });
      
      console.log("[handleDeleteAccount] Resposta recebida:", { 
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok 
      });

      if (response.status === 404) {
        console.error("[handleDeleteAccount] Endpoint não encontrado (404). O servidor backend precisa ser reiniciado.");
        setDeleteAccountError("Endpoint não encontrado. Verifique se o servidor backend está rodando e foi reiniciado após as atualizações.");
        setDeleteAccountLoading(false);
        return;
      }

      let data;
      try {
        data = await response.json();
        console.log("[handleDeleteAccount] Dados recebidos:", data);
      } catch (parseError) {
        console.error("[handleDeleteAccount] Erro ao parsear JSON:", parseError);
        setDeleteAccountError("Erro ao comunicar com o servidor. Verifique sua conexão e tente novamente.");
        setDeleteAccountLoading(false);
        return;
      }

      if (!response.ok) {
        const errorCode = data.error || "";
        const errorMessage = data.message || "";

        if (response.status === 401) {
          if (errorCode === "senha_incorreta" || errorCode === "credenciais_invalidas") {
            setDeleteAccountError("Senha incorreta. Verifique e tente novamente.");
          } else if (errorCode === "nao_autenticado" || errorCode === "invalid_token") {
            setDeleteAccountError("Sessão expirada. Faça login novamente.");
          } else if (errorCode === "erro_validacao_senha") {
            setDeleteAccountError(errorMessage || "Erro ao validar senha. Tente novamente.");
          } else {
            setDeleteAccountError(errorMessage || "Não foi possível autenticar. Faça login novamente.");
          }
        } else if (response.status === 400) {
          if (errorCode === "senha_obrigatoria") {
            setDeleteAccountError("Senha é obrigatória para confirmar a exclusão.");
          } else {
            setDeleteAccountError(errorMessage || "Dados inválidos. Verifique e tente novamente.");
          }
        } else if (response.status === 404) {
          if (errorCode === "usuario_nao_encontrado") {
            setDeleteAccountError("Perfil não encontrado. O sistema tentará criar automaticamente. Tente novamente.");
          } else {
            setDeleteAccountError("Recurso não encontrado. Tente novamente.");
          }
        } else if (response.status === 403) {
          setDeleteAccountError("Você não tem permissão para realizar esta ação.");
        } else if (response.status === 500) {
          setDeleteAccountError(errorMessage || "Erro interno do servidor. Tente novamente mais tarde.");
        } else {
          setDeleteAccountError(errorMessage || "Não foi possível excluir sua conta agora. Tente novamente.");
        }
        setDeleteAccountLoading(false);
        return;
      }

      const currentUserId = user?.uid;
      setIsLoggedIn(false);
      setUser(null);
      
      localStorage.removeItem('vetra:idToken');
      localStorage.removeItem('vetra:refreshToken');
      localStorage.removeItem('vetra:last_email');
      localStorage.removeItem('vetra:activeTab');
      localStorage.removeItem('vetra:activeCategory');
      
      if (currentUserId) {
        clearUserData(currentUserId);
      }
      
      sessionStorage.removeItem('vetra:justLoggedOut');
      sessionStorage.clear();
      clearSearchState();
      
      setShowDeleteAccountModal(false);
      setDeleteAccountPassword("");
      setDeleteAccountError("");
      setDeleteAccountConfirmCheckbox(false);
      setDeleteAccountLoading(false);
      
      navigate("/", { replace: true });
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      
      pushBanner({ 
        message: "Sua conta foi excluída. Obrigado por usar o VETRA.", 
        tone: "success" 
      });
    } catch (e: any) {
      console.error("[handleDeleteAccount] Erro inesperado:", e);
      if (e.message?.includes("fetch") || e.message?.includes("network") || e.message?.includes("Failed to fetch")) {
        setDeleteAccountError("Não foi possível excluir sua conta agora. Verifique sua conexão e tente novamente.");
      } else {
        setDeleteAccountError("Não foi possível excluir sua conta agora. Tente novamente.");
      }
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
    if (isLoggedIn && showLogin) {
      setShowLogin(false);
    }
  }, [isLoggedIn, showLogin]);

  useEffect(() => {
    if (!isLoggedIn) {
      setUseBottomNav(false);
      return;
    }

    const checkNavMode = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      if (viewportWidth < 900) {
        setUseBottomNav(true);
        return;
      }
      
      const screenWidth = window.screen?.width || viewportWidth;
      const isNarrowAspect = viewportWidth < screenWidth * 0.6;
      
      if (isNarrowAspect && viewportWidth < 1024) {
        setUseBottomNav(true);
        return;
      }
      
      if (viewportWidth >= 768 && viewportWidth < 1024) {
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
            
            if (hasOverflow && isNarrowAspect) {
              setUseBottomNav(true);
              return;
            }
          }
        }
      }
      
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
  
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    let slug = searchParams.get("share");
    
    if (!slug) {
      const pathMatch = location.pathname.match(/\/share\/([^\/]+)/);
      if (pathMatch) {
        slug = pathMatch[1];
        const newPath = location.pathname.replace(/\/share\/[^\/]+/, "");
        navigate(`${newPath}?share=${slug}`, { replace: true });
        return;
      }
    }
    
    if (isLoggedIn && slug) {
      const newSearchParams = new URLSearchParams(location.search);
      newSearchParams.delete("share");
      const newSearch = newSearchParams.toString();
      const newUrl = newSearch ? `${location.pathname}?${newSearch}` : location.pathname;
      if (newUrl !== location.pathname + location.search) {
        navigate(newUrl, { replace: true });
      }
      if (viewingShared) {
        setViewingShared(false);
        setSharedList(null);
        setSharedCollection(null);
      }
      return;
    }
    
    if (!slug) {
      if (viewingShared && !isLoggedIn) {
        setViewingShared(false);
        setSharedList(null);
        setSharedCollection(null);
      }
      return;
    }
    
    if (!isLoggedIn) {
      resolveShare(slug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, location.pathname, isLoggedIn]);
  
  useEffect(() => {
    const privateRoutes = ["/history", "/profile", "/favorites", "/lists", "/watchlist", "/people"];
    const isPrivateRoute = privateRoutes.some(route => location.pathname === route || location.pathname.startsWith(route + "/"));
    
    if (isPrivateRoute && !isLoggedIn && !viewingShared && !resolvingShare) {
      navigate("/", { replace: true });
    }
  }, [location.pathname, isLoggedIn, viewingShared, resolvingShare, navigate]);
  
  useEffect(() => {
    if (!isLoggedIn) {
      setActiveTab("home");
      setActiveCategory("home");
    }
  }, [isLoggedIn, setActiveTab, setActiveCategory]);
  
  useEffect(() => {
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      });
      
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }, 0);
    }
  }, [location.pathname, location.search, activeTab, activeCategory]);

  useEffect(() => {
    if (isLoggedIn && user && location.pathname === "/") {
      const params = new URLSearchParams(window.location.search);
      const hasSearchParams = params.has("q") || params.has("type") || params.has("sort") || 
                             params.has("year_gte") || params.has("year_lte") || 
                             params.has("vote_avg_gte") || params.has("vote_cnt_gte") || 
                             params.has("with_poster") || params.has("page");
      
      if (!hasSearchParams) {
        if (searchTerm.trim() && searchTerm.includes("@") && searchTerm.includes(".")) {
          clearSearchState();
        } else if (searchTerm.trim() && !hasActiveFilters && !hasSearchParams) {
          const timer = setTimeout(() => {
            if (!params.has("q") && !params.has("type") && !params.has("sort")) {
              clearSearchState();
            }
          }, 500);
          return () => clearTimeout(timer);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, user, location.pathname]);

 
  const loadTrending = async (window: "day" | "week", page: number = 1) => {
    setCats((s) => ({ ...s, trending: { ...s.trending, loading: true, error: undefined } }));
    try {
      const data = await api.getTrending(window, page) as BrowseResp;
      const rows = (data?.results || []) as ApiMovie[];
      
      const filteredBlacklist = filterBlacklisted(rows);
   
      const filteredRows = filteredBlacklist.filter((x: any) => {
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

  const loadCategory = async (key: CatKey, page: number = 1) => {
    setCats((s) => ({ ...s, [key]: { ...s[key], loading: true, error: undefined } }));
    try {
      const data = (await (api as any).browse(key, page)) as BrowseResp;
      const rows = (data?.results || []) as ApiMovie[];
      

      const filteredBlacklist = filterBlacklisted(rows);
      
      const filteredRows = filteredBlacklist.filter((x: any) => {
     
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
  
  const clearCachedRow = (key: string) => {
    rowCache.current.delete(key);
  };
  
  const getCachedRow = (key: string): MovieT[] | null => {
    const cached = rowCache.current.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    return null;
  };
  
  const setCachedRow = (key: string, data: MovieT[], ttl: number) => {
    rowCache.current.set(key, { data, timestamp: Date.now(), ttl });
  };
  
  
  const loadTopRatedSection = useCallback(async (page = 1, skipIds: Set<string> = new Set(), forceRefresh = false) => {
    const cacheKey = `top_rated_movies_${lang}_BR_${page}`;
    const cacheTTL = 15 * 60 * 1000; // 15 minutos
    
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
      
      try {
        data = await api.browse("top_rated", page);
        source = "vetra";
      } catch (vetraError) {
        console.log(`[api_fallback_used] endpoint=/browse/top_rated reason=${vetraError} status=fallback`);
        data = await api.getCategory("movie", "top_rated", page);
      }
      
      const results = (data?.results || []) as ApiMovie[];
      const filteredBlacklist = filterBlacklisted(results);
      
      const filtered = filteredBlacklist
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
      
      const deduplicated = filtered.filter(m => !skipIds.has(`${m.media || "movie"}:${m.id}`));
      
      let finalItems = deduplicated;
      if (deduplicated.length < 10 && page < 3) {
        const nextPageItems = await loadTopRatedSection(page + 1, skipIds, false);
        finalItems = [...deduplicated, ...nextPageItems].slice(0, 20);
      } else if (deduplicated.length === 0 && page === 1) {
        console.log(`[home_carousel_dedup_skips] section=top_rated skipped_count=${filtered.length - deduplicated.length}`);
      }
      
      const mapped = mapRows(finalItems as ApiMovie[]);
      
      setCachedRow(cacheKey, mapped, cacheTTL);
      const duration = Date.now() - startTime;
      console.log(`[home_carousel_loaded] section=top_rated source=${source} page=${page} items=${mapped.length} duration_ms=${duration} forceRefresh=${forceRefresh}`);
      
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
 
  useEffect(() => {
    if (!searchTerm && !hasActiveFilters && activeTab === "home" && activeCategory === "home") {
      console.log('[home_sections] Carregando seções da home...');
      loadTopRatedSection(1, new Set(), true).then((topRatedItems) => {
        console.log('[home_sections] Top rated carregado:', topRatedItems.length, 'itens');
        const renderedIds = new Set(topRatedItems.map(m => `${m.media || "movie"}:${m.id}`));
        
        loadPopularSection(1, renderedIds, true).then((popularItems) => {
          console.log('[home_sections] Popular carregado:', popularItems.length, 'itens');
        });
      });
      loadPersonalizedRow();
      loadTopRatedRow("movie");
      loadRecentReleasesRow();
      loadShuffleDiscoveries();
      
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
        setTimeout(() => loadByGenreRow(28, "Ação"), 0);
        setTimeout(() => loadByGenreRow(35, "Comédia"), 300);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, hasActiveFilters, activeTab, activeCategory, lang]);

 


  useEffect(() => {
    if (activeCategory !== "home" && activeTab === "home") {

    }
  }, [activeCategory, activeTab]);


  useEffect(() => {
    if (activeTab === "people" && !peopleLoading) {
      setPeopleLoading(true);
      setPopularPeopleList([]);
      popularPeople(1, lang)
        .then((data) => {
          console.log("[PeopleContent] Dados recebidos:", data);
          const results = (data as any).results || [];
          console.log("[PeopleContent] Total de resultados:", results.length);
          
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
  
  const loadPersonalizedRow = async () => {
    if (!isLoggedIn || (favorites.length === 0 && Object.keys(userStates).length === 0)) {
      const popularData = await api.discover("movie", { sortBy: "popularity.desc", withPoster: true }, 1, 20);
      const filteredResults = filterBlacklisted((popularData?.results || []) as ApiMovie[]);
      const popularItems = mapRows(filteredResults);
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
        ...mapRows(filterBlacklisted((moviesData?.results || []) as ApiMovie[])),
        ...mapRows(filterBlacklisted((tvData?.results || []) as ApiMovie[])),
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
      
      let mapped = mapRows(filterBlacklisted((data?.results || []) as ApiMovie[]));
      if (mapped.length < 12) {
        const fallbackData = await api.discover(media, {
          sortBy: "vote_average.desc",
          voteCountGte: 1000,
          voteAverageGte: 7.5,
          withPoster: true,
        }, 1, 20);
        mapped = mapRows(filterBlacklisted((fallbackData?.results || []) as ApiMovie[]));
      }
      
      setCachedRow(cacheKey, mapped, 24 * 60 * 60 * 1000); // 24h
      setHomeRows(s => ({ ...s, topRated: { items: mapped, loading: false, media } }));
    } catch (e: any) {
      setHomeRows(s => ({ ...s, topRated: { ...s.topRated, loading: false, error: e?.message } }));
    }
  };
  
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
        ...mapRows(filterBlacklisted((moviesData?.results || []) as ApiMovie[])),
        ...mapRows(filterBlacklisted((tvData?.results || []) as ApiMovie[])),
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
          ...mapRows(filterBlacklisted((moviesData90?.results || []) as ApiMovie[])),
          ...mapRows(filterBlacklisted((tvData90?.results || []) as ApiMovie[])),
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
        ...mapRows(filterBlacklisted((moviesData?.results || []) as ApiMovie[])),
        ...mapRows(filterBlacklisted((tvData?.results || []) as ApiMovie[])),
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
  
  const loadShuffleDiscoveries = async () => {
    setHomeRows(s => ({ ...s, shuffleDiscoveries: { ...s.shuffleDiscoveries, loading: true } }));
    try {
      const favoriteIds = new Set(favorites.map(m => mediaKey(m)));
      const seed = user?.email ? parseInt(user.email.slice(-4), 16) || 0 : Math.floor(Math.random() * 10000);
      
      const data = await api.discover("movie", {
        sortBy: "popularity.desc",
        withPoster: true,
      }, Math.floor(seed % 10) + 1, 20);
      
      const mapped = mapRows(filterBlacklisted((data?.results || []) as ApiMovie[]))
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
      const filteredBlacklist = filterBlacklisted(results);
      const filtered = filteredBlacklist.filter((x: any) => {
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
      const filteredBlacklist = filterBlacklisted(results);
      const filtered = filteredBlacklist.filter((x: any) => {
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

  const loadPopularSection = useCallback(async (page = 1, skipIds: Set<string> = new Set(), forceRefresh = false) => {
    const cacheKey = `popular_movies_${lang}_BR_${page}`;
    const cacheTTL = 15 * 60 * 1000;
    
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
      
      try {
        data = await api.browse("popular", page);
        source = "vetra";
      } catch (vetraError) {
        console.log(`[api_fallback_used] endpoint=/browse/popular reason=${vetraError} status=fallback`);
        data = await api.getCategory("movie", "popular", page);
      }
      
      const results = (data?.results || []) as ApiMovie[];
      
      const filteredBlacklist = filterBlacklisted(results);
      
      const withPoster = filteredBlacklist.filter(m => {
        const hasPoster = m.poster_path || (m as any).image;
        return hasPoster;
      });
      
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
      
      const deduplicated = filtered.filter(m => !skipIds.has(`${m.media || "movie"}:${m.id}`));
      
      let finalItems = deduplicated;
      if (deduplicated.length < 10 && page < 3) {
        const nextPageItems = await loadPopularSection(page + 1, skipIds, false);
        finalItems = [...deduplicated, ...nextPageItems].slice(0, 20);
      } else if (deduplicated.length === 0 && page === 1) {
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





  const updateURL = useCallback((filters: SearchFilters, term: string, page: number) => {
    const params = new URLSearchParams();
    const defaults = getDefaultFilters();
    if (term) params.set("q", term);
    if (filters.type !== defaults.type) params.set("type", filters.type);
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
    
    if (!hasSearchTerm && !hasActiveFilters) {
      setMovies([]);
      setPeople([]);
      setSearchTotalResults(0);
      setHasActiveFilters(false);
      setSearchPage(1);
      const params = new URLSearchParams(window.location.search);
      params.delete("q");
      params.delete("page");
      const newURL = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
      window.history.replaceState({}, "", newURL);
      return;
    }
    
    setLoading(true);
    try {
      let effectiveSort = activeFilters.sort;
      if (effectiveSort === "relevance" && !hasSearchTerm) {
        effectiveSort = "popularity.desc";
      }
      
      const uiSort = effectiveSort === "popularity.desc" ? "rating" : effectiveSort;
      const yearFrom = activeFilters.yearGte !== null ? activeFilters.yearGte : undefined;
      const yearTo = activeFilters.yearLte !== null ? activeFilters.yearLte : undefined;
      const minVotes = activeFilters.voteCntGte;
      const minRating = activeFilters.voteAvgGte;
      
      updateURL(activeFilters, searchQuery, currentPage);
      
      if (!hasSearchTerm) {
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
          
          allResults = filterBlacklisted(allResults);
          allResults = filterByPoster(allResults, activeFilters.withPoster);
          allResults = applyClientSort(allResults, uiSort);
          
          const mapped = mapRows(allResults);
          setMovies(mapped);
          setPeople([]);
          setSearchTotalResults(mapped.length);
          const defaults = getDefaultFilters();
          setHasActiveFilters(hasNonDefaultFilters(activeFilters, defaults) || hasSearchTerm);
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
          
          results = filterBlacklisted(results);
          results = filterByPoster(results, activeFilters.withPoster);
          results = applyClientSort(results, uiSort);
          
          const mapped = mapRows(results);
          setMovies(mapped);
          setPeople([]);
          setSearchTotalResults(data.total_results || mapped.length);
          const defaults = getDefaultFilters();
          setHasActiveFilters(hasNonDefaultFilters(activeFilters, defaults) || hasSearchTerm);
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
          const defaults = getDefaultFilters();
          setHasActiveFilters(hasNonDefaultFilters(activeFilters, defaults) || hasSearchTerm);
        }
      } else {
        const filters: { year?: number; minRating?: number } = {};
        if (yearFrom) filters.year = yearFrom;
        if (minRating > 0) filters.minRating = minRating;
        
        const normalizeText = (text: string): string => {
          if (!text) return "";
          return text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remove acentos
            .trim();
        };
        
        const matchesSearch = (text: string, searchTerm: string): boolean => {
          const normalizedText = normalizeText(text);
          const normalizedSearch = normalizeText(searchTerm);
          return normalizedText.includes(normalizedSearch);
        };
        
        const allLocalMovies: any[] = [];
        
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
        
        Object.values(cats).forEach((cat: any) => {
          if (cat.items && Array.isArray(cat.items)) {
            allLocalMovies.push(...cat.items);
          }
        });
        
        if (favorites && Array.isArray(favorites)) {
          allLocalMovies.push(...favorites);
        }
        
        lists.forEach((list: any) => {
          if (list.items && Array.isArray(list.items)) {
            allLocalMovies.push(...list.items);
          }
        });
        
        const localResults = allLocalMovies.filter((item: any) => {
          const title = item.title || item.name || "";
          return matchesSearch(title, searchQuery);
        });
        
        const seenIds = new Set<string>();
        const uniqueLocalResults = localResults.filter((item: any) => {
          const mediaType = item.media || item.media_type || "movie";
          const id = `${mediaType}:${item.id}`;
          if (seenIds.has(id)) return false;
          seenIds.add(id);
          return true;
        });
        
        const data = await api.search(searchQuery, currentPage, filters);
        const mixed = (data as any).items || (data as any).results || [];
      
        const apiIds = new Set<string>();
        mixed.forEach((item: any) => {
          const mediaType = item.media_type || item.media || "movie";
          const id = `${mediaType}:${item.id}`;
          apiIds.add(id);
        });
        
        const additionalLocalResults = uniqueLocalResults.filter((item: any) => {
          const mediaType = item.media || item.media_type || "movie";
          const id = `${mediaType}:${item.id}`;
          return !apiIds.has(id);
        });
        
        const combinedResults = [...mixed, ...additionalLocalResults];
        
        const filteredCombined = filterBlacklisted(combinedResults);
      
        let moviesPart = filteredCombined.filter((x: any) => {
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
          
          if (minVotes > 0) {
            moviesPart = moviesPart.filter((x: any) => (x.vote_count || 0) >= minVotes);
          }
          
          if (minRating > 0) {
            moviesPart = moviesPart.filter((x: any) => (x.vote_average || 0) >= minRating);
          }
          
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
  
  useEffect(() => {
    const justLoggedOut = sessionStorage.getItem('vetra:justLoggedOut');
    if (justLoggedOut === 'true') {
      sessionStorage.removeItem('vetra:justLoggedOut');
      clearSearchState();
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const hasSearchTerm = params.has("q") && params.get("q")?.trim().length > 0;
    const hasFilterParams = params.has("type") || params.has("sort") || 
                           params.has("year_gte") || params.has("year_lte") || 
                           params.has("vote_avg_gte") || params.has("vote_cnt_gte") || 
                           params.has("with_poster");
    const hasPageParam = params.has("page");
    
    if (hasSearchTerm || hasFilterParams || hasPageParam) {
      const searchQuery = params.get("q") || "";
      if (searchQuery.includes("@") && searchQuery.includes(".")) {
        clearSearchState();
        return;
      }

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
        runSearch(searchTerm, appliedSearchFilters, searchPage);
        setHasActiveFilters(hasNonDefaultFilters || hasSearchTerm);
      }
    } else {
      if (searchTerm.trim() || hasActiveFilters) {
        clearSearchState();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchTerm.trim().length === 0 && !hasActiveFilters) {
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
        runSearch(searchTerm, appliedSearchFilters, 1);
        setSearchPage(1);
      }
    }, 400);
    return () => clearTimeout(tmo);
  }, [searchTerm, lang]);
  
  const handleApplyFilters = useCallback((filters: SearchFilters) => {
    setAppliedSearchFilters(filters);
    setSearchPage(1);
    runSearch(searchTerm, filters, 1);
  }, [searchTerm]);

  const handleClearAllFilters = useCallback(() => {
    const defaults = getDefaultFilters();
    if (!searchTerm.trim() && defaults.sort === "relevance") {
      defaults.sort = "popularity.desc";
    }
    setAppliedSearchFilters(defaults);
    setSearchPage(1);
    runSearch(searchTerm, defaults, 1);
  }, [searchTerm]);

  const handleRemoveFilter = useCallback((key: keyof SearchFilters) => {
    const newFilters = { ...appliedSearchFilters };
    const defaults = getDefaultFilters();
    
    if (key === "yearGte" || key === "yearLte") {
      newFilters.yearGte = defaults.yearGte;
      newFilters.yearLte = defaults.yearLte;
    } else {
      (newFilters as any)[key] = (defaults as any)[key];
    }
    
    if (key === "sort" && !searchTerm.trim() && newFilters.sort === "relevance") {
      newFilters.sort = "popularity.desc";
    }
    
    setAppliedSearchFilters(newFilters);
    setSearchPage(1);
    runSearch(searchTerm, newFilters, 1);
  }, [appliedSearchFilters, searchTerm]);
  
  useEffect(() => {
    if (!isLoggedIn || !user?.uid) return;
    try {
      localStorage.setItem(getStorageKey(KEY_FAVS, user.uid), JSON.stringify(favorites));
    } catch {}
  }, [favorites, isLoggedIn, user?.uid]);
  
  useEffect(() => {
    if (!isLoggedIn || !user?.uid) return;
    try {
      localStorage.setItem(getStorageKey(KEY_LISTS, user.uid), JSON.stringify(lists));
    } catch {}
  }, [lists, isLoggedIn, user?.uid]);
  
  useEffect(() => {
    if (!isLoggedIn || !user?.uid) return;
    try {
      localStorage.setItem(getStorageKey(KEY_STATES, user.uid), JSON.stringify(userStates));
    } catch {}
  }, [userStates, isLoggedIn, user?.uid]);
  
  useEffect(() => {
    if (!isLoggedIn || !user?.uid) return;
    try {
      localStorage.setItem(getStorageKey(KEY_HISTORY, user.uid), JSON.stringify(watchHistory));
    } catch {}
  }, [watchHistory, isLoggedIn, user?.uid]);
  
  useEffect(() => {
    if (!isLoggedIn || !user?.uid) return;
    try {
      localStorage.setItem(getStorageKey(KEY_STATS, user.uid), JSON.stringify(userStats));
    } catch {}
  }, [userStats, isLoggedIn, user?.uid]);
  
  useEffect(() => {
    if (!isLoggedIn || !user?.uid) {
      setFavorites([]);
      setLists([]);
      setUserStates({});
      setWatchHistory([]);
      setUserStats({});
      return;
    }
    
    const loadUserData = async () => {
      try {
        const cachedFavs = localStorage.getItem(getStorageKey(KEY_FAVS, user.uid));
        const cachedLists = localStorage.getItem(getStorageKey(KEY_LISTS, user.uid));
        const cachedStates = localStorage.getItem(getStorageKey(KEY_STATES, user.uid));
        const cachedHistory = localStorage.getItem(getStorageKey(KEY_HISTORY, user.uid));
        const cachedStats = localStorage.getItem(getStorageKey(KEY_STATS, user.uid));
        
        if (cachedFavs) {
          try {
            setFavorites(JSON.parse(cachedFavs));
          } catch {}
        }
        if (cachedLists) {
          try {
            setLists(JSON.parse(cachedLists));
          } catch {}
        }
        if (cachedStates) {
          try {
            setUserStates(JSON.parse(cachedStates));
          } catch {}
        }
        if (cachedHistory) {
          try {
            setWatchHistory(JSON.parse(cachedHistory));
          } catch {}
        }
        if (cachedStats) {
          try {
            setUserStats(JSON.parse(cachedStats));
          } catch {}
        }
        
        const favsResult = await api.favoritesGet(user.uid);
        if (favsResult.items && favsResult.items.length > 0) {
          setFavorites(favsResult.items);
        }
      } catch (error) {
        console.error("[loadUserData] Erro ao carregar dados do usuário:", error);
      }
    };
    
    loadUserData();
  }, [isLoggedIn, user?.uid]);
  


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
          pushToast({ message: "Removido dos seus favoritos.", tone: "ok" });
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
    
    if (isLoggedIn) {
      addHistoryEntry({
        type: wasFav ? "favorite_removed" : "favorite_added",
        media: {
          id: movie.id,
          title: movie.title || "",
          year: movie.year ? parseInt(movie.year) : undefined,
          poster_path: movie.poster_path,
          media_type: (movie.media || "movie") as "movie" | "tv"
        },
        action: wasFav 
          ? `${movie.title || "Item"} – removido dos Favoritos`
          : `${movie.title || "Item"} – adicionado aos Favoritos`
      });
    }
    
    pushToast({ message: wasFav ? "Removido dos seus favoritos." : "Adicionado aos seus favoritos.", tone: "ok" });
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
    
    const filteredItems = filterBlacklisted(allItems);
    
    const scored = filteredItems
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
      
      setUserStates((prev) => {
        const newStates = { 
          ...prev, 
          [k]: { 
            ...(prev[k] || {}), 
            state,
            movieCache: movieCache
          } 
        };
        
        if (isLoggedIn && state) {
          const stateLabels: Record<string, string> = {
            want: "Quero ver",
            watched: "Assistido",
            not_watched: "Não assisti",
            abandoned: "Abandonei"
          };
          addHistoryEntry({
            type: "state_changed",
            media: {
              id: m.id,
              title: m.title || "",
              year: m.year ? parseInt(m.year) : undefined,
              poster_path: m.poster_path,
              media_type: (m.media || "movie") as "movie" | "tv"
            },
            state: state as "want_to_watch" | "watched" | "not_watched" | "abandoned",
            action: `${m.title || "Item"} – marcado como '${stateLabels[state] || state}'`
          });
        }
        
        return newStates;
      });
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
    pushToast({ message: "Lista criada com sucesso.", tone: "ok" });
    return id;
  };

  const handleCoverSelect = async (cover: {
    type: "none" | "first_item" | "item" | "upload" | "tmdb";
    itemId?: string;
    url?: string;
  }, listName?: string) => {
    if (coverSelectorListId === "new") {
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
        
        setLists((prev) => {
          const updated = prev.map((l) => {
            if (l.id === listId) {
              console.log("[handleCoverSelect] Lista antes:", l.cover);
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
    const list = lists.find(l => l.id === listId);
    const wasAlreadyInList = list?.items.some(
      (it) => it.id === movie.id && (it.media || "movie") === (movie.media || "movie")
    );
    
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
              cover: (!l.cover && l.items.length === 0) 
                ? { type: "item", itemId: mediaKey(movie) }
                : l.cover,
              updatedAt: new Date().toISOString(),
            }
          : l
      )
    );
    
    if (isLoggedIn && !wasAlreadyInList && list) {
      addHistoryEntry({
        type: "list_item_added",
        media: {
          id: movie.id,
          title: movie.title || "",
          year: movie.year ? parseInt(movie.year) : undefined,
          poster_path: movie.poster_path,
          media_type: (movie.media || "movie") as "movie" | "tv"
        },
        list: { id: listId, name: list.name },
        action: `${movie.title || "Item"} adicionado à lista '${list.name}'`
      });
    }
    
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
      }
    }
    
    const updatedList = lists.find(l => l.id === listId);
    if (updatedList && !updatedList.cover && updatedList.items.length === 0) {
      setListCover(listId, "item", mediaKey(movie)).catch(() => {});
    }
    pushToast({ message: "Título adicionado à lista.", tone: "ok" });
  };
  const removeFromList = async (listId: string, movieId: number, media?: MediaT) => {
    const itemKey = mediaKey({ id: movieId, media: media || "movie" } as MovieT);
    const list = lists.find(l => l.id === listId);
    const removedItem = list?.items.find(m => m.id === movieId && (m.media || "movie") === (media || "movie"));
    
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== listId) return l;
        
        const wasCover = l.cover?.type === "item" && (l.cover.itemId === itemKey || l.cover.itemId === String(movieId));
        
        const newItems = l.items.filter((m) => !(m.id === movieId && (m.media || "movie") === (media || "movie")));
        
        let newCover = l.cover;
        if (wasCover) {
          if (newItems.length > 0) {
            const firstItemKey = mediaKey(newItems[0]);
            newCover = { type: "item", itemId: firstItemKey };
            setListCover(listId, "item", firstItemKey).catch(() => {});
          } else {
            newCover = undefined;
            setListCover(listId, "auto").catch(() => {});
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
    
    if (isLoggedIn && removedItem && list) {
      addHistoryEntry({
        type: "list_item_removed",
        media: {
          id: removedItem.id,
          title: removedItem.title || "",
          year: removedItem.year ? parseInt(removedItem.year) : undefined,
          poster_path: removedItem.poster_path,
          media_type: (removedItem.media || "movie") as "movie" | "tv"
        },
        list: { id: listId, name: list.name },
        action: `${removedItem.title || "Item"} removido da lista '${list.name}'`
      });
    }
    
    if (isLoggedIn && user?.email) {
      try {
        await api.removeListItem(user.email, listId, itemKey);
      } catch (error) {
        console.error("[removeFromList] Erro ao sincronizar com API:", error);
      }
    }
    
    pushToast({ message: "Título removido da lista.", tone: "ok" });
  };
  const renameList = (listId: string, newName: string) => {
    const oldList = lists.find(l => l.id === listId);
    setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, name: newName, updatedAt: new Date().toISOString() } : l)));
    
    if (isLoggedIn && oldList) {
      addHistoryEntry({
        type: "list_renamed",
        list: { id: listId, name: newName },
        action: `Lista '${oldList.name}' renomeada para '${newName}'`
      });
    }
    
    pushToast({ message: "Alterações salvas na sua lista.", tone: "ok" });
  };
  const clearList = (listId: string) => {
    setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, items: [], cover: undefined, updatedAt: new Date().toISOString() } : l)));
    pushToast({ message: "Lista limpa com sucesso.", tone: "ok" });
  };
  const deleteList = (listId: string) => {
    const name = lists.find((l) => l.id === listId)?.name || "Lista";
    setLists((prev) => prev.filter((l) => l.id !== listId));
    setActiveListId((prev) => (prev === listId ? null : prev));
    
    if (isLoggedIn) {
      addHistoryEntry({
        type: "list_deleted",
        list: { id: listId, name },
        action: `Lista '${name}' excluída`
      });
    }
    
    pushToast({ message: "Lista excluída com sucesso.", tone: "ok" });
  };


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
  };

  const navigateWithAuth = (route: string, requiresAuth: boolean = false) => {
    if (requiresAuth && !isLoggedIn) {
      setPendingRoute(route);
      setShowLogin(true);
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
    if (route) {
      navigate(route);
    } else {
    action();
    }
  };

  const MovieCard: React.FC<{ movie: MovieT }> = ({ movie }) => (
    <MovieCardInline
      movie={movie}
      isLoggedIn={isLoggedIn}
      isFavorite={isFavorite}
      getUserMeta={getUserMeta}
      toggleFavorite={toggleFavorite}
      setShowListPickerFor={setShowListPickerFor}
      setShowCollectionPickerFor={setShowCollectionPickerFor}
      setPendingAction={setPendingAction}
      setShowActionSheet={setShowActionSheet}
      pushToast={pushToast}
    />
  );


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

      const savedScrollY = window.scrollY;
      const savedScrollX = window.scrollX;
      
      let scrollLocked = true;
      const scrollHandler = (e: Event) => {
        if (scrollLocked) {
          e.preventDefault();
          e.stopPropagation();
          window.scrollTo({ top: savedScrollY, left: savedScrollX, behavior: "auto" });
          return false;
        }
      };
      
      window.addEventListener("scroll", scrollHandler, { passive: false, capture: true });
      window.addEventListener("wheel", scrollHandler, { passive: false, capture: true });
      window.addEventListener("touchmove", scrollHandler, { passive: false, capture: true });
      
      window.scrollTo({ top: savedScrollY, left: savedScrollX, behavior: "auto" });
      
      setSubmittingComment(true);
      setCommentError("");
      
      try {
        const result = await createComment(mediaType, movieId, newCommentText.trim(), newCommentRating);
        
        window.scrollTo({ top: savedScrollY, left: savedScrollX, behavior: "auto" });
        
        if (result.ok && result.comment) {
          setComments([result.comment, ...comments]);
          setNewCommentText("");
          setNewCommentRating(undefined);
          if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
          }
          
          if (isLoggedIn && selectedMovie) {
            addHistoryEntry({
              type: "comment_created",
              media: {
                id: selectedMovie.id,
                title: selectedMovie.title || "",
                year: selectedMovie.year ? parseInt(selectedMovie.year) : undefined,
                poster_path: selectedMovie.poster_path,
                media_type: (selectedMovie.media || mediaType || "movie") as "movie" | "tv"
              },
              action: `Comentário adicionado em '${selectedMovie.title || "Item"}'`
            });
          }
          
          pushToast({ message: "Comentário publicado.", tone: "ok" });
        } else {
          const errorMsg = result.error || "Não foi possível publicar seu comentário. Tente novamente.";
          if (errorMsg.includes("rápido") || errorMsg.includes("rate limit")) {
            setCommentError("Você comentou muito rápido. Tente novamente em alguns segundos.");
          } else {
            setCommentError(errorMsg);
          }
        }
      } finally {
        setSubmittingComment(false);
        
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
        pushToast({ message: "Comentário removido.", tone: "ok" });
      } else {
        pushToast({ message: result.error || "Não foi possível remover o comentário. Tente novamente.", tone: "err" });
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
        const slug = resp.slug || (resp.code ? resp.code.replace(/V9-|-/g, "").slice(0, 10) : "");
        setShareSlug(slug);
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
        <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => navigate(-1)} style={{ zIndex: 9999 }}>
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
        <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => navigate(-1)} style={{ zIndex: 9999 }}>
          <div className="bg-gray-900 rounded-lg p-6 sm:p-8 text-center max-w-sm w-full mx-4">
            <div className="text-white text-lg sm:text-xl mb-4">Carregando informações do filme…</div>
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-cyan-500"></div>
            <div className="text-gray-400 text-sm mt-4">Aguarde...</div>
          </div>
        </div>
      );
    } else {
     
      return (
        <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => navigate(-1)} style={{ zIndex: 9999 }}>
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
      <div className="fixed inset-0 bg-black/80 dark:bg-black/90 z-[9999] flex items-center justify-center p-2 sm:p-3 md:p-4 backdrop-blur-sm" onClick={() => navigate(-1)} style={{ zIndex: 9999 }}>
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
                      {d.certification}
                    </span>
                  ) : null}
                  {d?.genres?.slice(0, 2).map((genre: string, idx: number) => (
                    <span key={idx} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {genre}
                    </span>
                  ))}
                  {runtimeStr ? (
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {runtimeStr}
                    </span>
                  ) : null}
                  {d?.vote_average !== null && d?.vote_average !== undefined ? (
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {d.vote_average.toFixed(1)}
                      {d.vote_count ? ` (${d.vote_count.toLocaleString('pt-BR')})` : ""}
                    </span>
                  ) : null}
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap flex items-center gap-1">
                    <Tv className="w-3 h-3" /> {(selectedMovie.media || d?.media) === "tv" ? "Série" : "Filme"}
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
                      <Globe className="w-4 h-4 text-slate-500 dark:text-gray-400" />
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
                    {filterBlacklisted(d.recommendations).slice(0, d.recommendations.length % 2 === 0 ? d.recommendations.length : d.recommendations.length - 1).map((rec: any) => (
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
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 shadow-lg sm:hidden">
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


  const ListDetailWrapper: React.FC<{ lst: UserList }> = ({ lst }) => (
    <ListDetail
      lst={lst}
      isLoggedIn={isLoggedIn}
      isFavorite={isFavorite}
      getUserMeta={getUserMeta}
      toggleFavorite={toggleFavorite}
      setShowListPickerFor={setShowListPickerFor}
      setShowCollectionPickerFor={setShowCollectionPickerFor}
      setPendingAction={setPendingAction}
      setShowActionSheet={setShowActionSheet}
      pushToast={pushToast}
      renameList={renameList}
      clearList={clearList}
      deleteList={deleteList}
      setListCover={setListCover}
      removeFromList={removeFromList}
      setConfirmModal={setConfirmModal}
      setShareSlug={setShareSlug}
      setShowShare={setShowShare}
      setActiveListId={setActiveListId}
      onDragStart={onDragStart}
      onDrop={onDrop}
      t={t}
    />
  );



  const handlePeoplePageChange = (page: number) => {
    setPeoplePage(page);
  };



 
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
          pushBanner({ message: "Senha alterada com sucesso.", tone: "success" });
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



  const urlParams = new URLSearchParams(window.location.search);
  const hasShareSlug = !!urlParams.get("share");
  
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
          firstNameError={firstNameError}
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
          forgotPasswordError={forgotPasswordError}
          forgotPasswordStep={forgotPasswordStep}
          setForgotPasswordStep={setForgotPasswordStep}
          forgotPasswordCode={forgotPasswordCode}
          setForgotPasswordCode={setForgotPasswordCode}
          forgotPasswordNewPassword={forgotPasswordNewPassword}
          setForgotPasswordNewPassword={setForgotPasswordNewPassword}
          forgotPasswordConfirmPassword={forgotPasswordConfirmPassword}
          setForgotPasswordConfirmPassword={setForgotPasswordConfirmPassword}
          forgotPasswordShowPassword={forgotPasswordShowPassword}
          setForgotPasswordShowPassword={setForgotPasswordShowPassword}
          forgotPasswordStrength={forgotPasswordStrength}
          forgotPasswordErrors={forgotPasswordErrors}
          forgotPasswordShowTips={forgotPasswordShowTips}
          setForgotPasswordShowTips={setForgotPasswordShowTips}
          handleForgotPasswordConfirmCode={handleForgotPasswordConfirmCode}
          handleForgotPasswordReset={handleForgotPasswordReset}
          t={t}
          handleInputChange={handleInputChange}
          handleInputBlur={handleInputBlur}
          handleSubmit={handleSubmit}
          setShowLogin={setShowLogin}
          setLoginType={setLoginType}
          setLoginError={setLoginError}
          setFirstNameError={setFirstNameError}
          setEmailError={setEmailError}
          setPasswordError={setPasswordError}
          setShowPassword={setShowPassword}
          setFormData={setFormData}
          setShowForgotPassword={setShowForgotPassword}
          setForgotPasswordEmail={setForgotPasswordEmail}
          setForgotPasswordError={setForgotPasswordError}
          generatePassword={generatePassword}
          setShowPasswordTips={setShowPasswordTips}
          setConfirmPasswordError={setConfirmPasswordError}
          setConfirmPasswordTouched={setConfirmPasswordTouched}
          emailVerified={emailVerified}
          handleForgotPasswordCheckEmail={handleForgotPasswordCheckEmail}
        />}
        <BannerHost banners={banners} onClose={removeBanner} />
        <ToastHost toasts={toasts} onClose={removeToast} />
      </>
    );
  }


  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-white" style={{ '--app-header-h': '64px', '--app-header-h-sm': '72px', '--app-header-h-md': '80px' } as React.CSSProperties}>
      <Header
        isLoggedIn={isLoggedIn}
        viewingShared={viewingShared}
        hasShareSlug={hasShareSlug}
        resolvingShare={resolvingShare}
        useBottomNav={useBottomNav}
        user={user}
        activeTab={activeTab}
        activeCategory={activeCategory}
        watchHistory={watchHistory}
        showMobileMenu={showMobileMenu}
        showProfileMenu={showProfileMenu}
        headerNavRef={headerNavRef}
        profileMenuRef={profileMenuRef}
        setShowMobileMenu={setShowMobileMenu}
        setShowProfileMenu={setShowProfileMenu}
        setProfileMenuRef={setProfileMenuRef}
        handleTabChange={handleTabChange}
        handleCategoryChange={handleCategoryChange}
        setActiveTab={setActiveTab}
        setActiveListId={setActiveListId}
        setIsLoggedIn={setIsLoggedIn}
        setUser={setUser}
        setShowDeleteAccountModal={setShowDeleteAccountModal}
        pushToast={pushToast}
        pushBanner={pushBanner}
        lang={lang}
        setLang={setLang}
        darkEnabled={darkEnabled}
        toggleDark={toggleDark}
        t={t}
        clearSearchState={clearSearchState}
      />

      {/* Banner de aviso para conta marcada para exclusão */}
      {isLoggedIn && user?.status === "pending_deletion" && (
        <div className="fixed left-0 right-0 z-[100] bg-amber-500 dark:bg-amber-600 text-white px-4 py-3 shadow-lg" style={{ 
          top: useBottomNav ? '64px' : '112px',
          zIndex: 100
        }}>
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1">
              <p className="font-semibold text-sm sm:text-base">
                Sua conta está marcada para exclusão
              </p>
              <p className="text-xs sm:text-sm text-amber-50 mt-1">
                {user?.deletionScheduledFor 
                  ? `Você tem até ${new Date(user.deletionScheduledFor).toLocaleDateString('pt-BR')} para reativar sua conta.`
                  : "Você tem até 30 dias para reativar sua conta."}
              </p>
            </div>
            <button
              onClick={async () => {
                try {
                  const result = await api.reactivateAccount();
                  if (result.ok) {
                    pushBanner({ message: result.message || "Conta reativada com sucesso!", tone: "success" });
                    if (user?.email) {
                      await loadProfile(user.email);
                    }
                  } else {
                    pushToast({ message: result.error || "Erro ao reativar conta", tone: "err" });
                  }
                } catch (error: any) {
                  pushToast({ message: error?.message || "Erro ao reativar conta", tone: "err" });
                }
              }}
              className="px-4 py-2 bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 font-semibold rounded-lg hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors text-sm sm:text-base whitespace-nowrap"
            >
              Reativar Conta
            </button>
          </div>
        </div>
      )}

      {(isLoggedIn || viewingShared || hasShareSlug || resolvingShare) && (
        <main 
          className={`${isLoggedIn && useBottomNav ? "pb-20" : isLoggedIn ? "pb-16 sm:pb-20 md:pb-24" : "pb-12"}`} 
          style={{
            paddingTop: isLoggedIn && !useBottomNav 
              ? (user?.status === "pending_deletion" 
                  ? 'calc(112px + 64px + max(env(safe-area-inset-top), 0px))'
                  : 'calc(112px + max(env(safe-area-inset-top), 0px))')
              : (user?.status === "pending_deletion"
                  ? 'calc(64px + 64px + max(env(safe-area-inset-top), 0px))'
                  : 'calc(64px + max(env(safe-area-inset-top), 0px))'),
            scrollMarginTop: isLoggedIn && !useBottomNav 
              ? (user?.status === "pending_deletion"
                  ? 'calc(112px + 64px + max(env(safe-area-inset-top), 0px))'
                  : 'calc(112px + max(env(safe-area-inset-top), 0px))')
              : (user?.status === "pending_deletion"
                  ? 'calc(64px + 64px + max(env(safe-area-inset-top), 0px))'
                  : 'calc(64px + max(env(safe-area-inset-top), 0px))'),
            ...(isLoggedIn && useBottomNav ? { paddingBottom: `calc(56px + max(env(safe-area-inset-bottom), 0px))` } : {})
          }}
        >
          {location.pathname === "/profile" || location.pathname === "/me" ? (
            <ProfileViewPage 
              user={user}
              favorites={favorites}
              lists={lists}
              userStates={userStates}
            />
          ) : (location.pathname === "/profile/edit" || location.pathname === "/edit-profile") ? (
            <EditProfilePage
              user={user}
              isLoggedIn={isLoggedIn}
              favorites={favorites}
              lists={lists}
              userStates={userStates}
              pushToast={pushToast}
              pushBanner={pushBanner}
              saveProfile={saveProfile}
              setIsLoggedIn={setIsLoggedIn}
              setUser={setUser}
              setEditProfileHasChanges={setEditProfileHasChanges}
              editProfileHasChanges={editProfileHasChanges}
              setShowExitEditProfileConfirm={setShowExitEditProfileConfirm}
            />
          ) : location.pathname === "/history" ? (
            <ActivityHistoryPage lang={lang} t={t} />
          ) : (
            <>
              {activeTab === "home" && activeCategory === "home" && (
                <HomePage
                  user={user}
                  isLoggedIn={isLoggedIn}
                  favorites={favorites}
                  userStates={userStates}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  showSearchFilters={showSearchFilters}
                  setShowSearchFilters={setShowSearchFilters}
                  appliedSearchFilters={appliedSearchFilters}
                  handleApplyFilters={handleApplyFilters}
                  handleClearAllFilters={handleClearAllFilters}
                  handleRemoveFilter={handleRemoveFilter}
                  loading={loading}
                  movies={movies}
                  people={people}
                  searchTotalResults={searchTotalResults}
                  searchPage={searchPage}
                  setSearchPage={setSearchPage}
                  hasActiveFilters={hasActiveFilters}
                  setMovies={setMovies}
                  setPeople={setPeople}
                  setSearchTotalResults={setSearchTotalResults}
                  setHasActiveFilters={setHasActiveFilters}
                  cats={cats}
                  topRatedMovies={topRatedMovies}
                  homeSections={homeSections}
                  runSearch={runSearch}
                  getPersonalizedRecommendations={getPersonalizedRecommendations}
                  loadTopRatedSection={loadTopRatedSection}
                  loadPopularSection={loadPopularSection}
                  normalizeNumber={normalizeNumber}
                  snapRating={snapRating}
                  snapVotes={snapVotes}
                  linearToLog={linearToLog}
                  logToLinear={logToLinear}
                  useBottomNav={useBottomNav}
                  t={t}
                  renderMovieCard={(m) => <MovieCard movie={m} />}
                />
              )}
          {activeTab === "home" && activeCategory !== "home" && (
            <div className={`container mx-auto px-3 sm:px-4 md:px-6 pt-12 sm:pt-14 md:pt-16 lg:pt-20 ${viewingShared && !isLoggedIn ? "pt-20 sm:pt-24" : ""}`}>
                {activeTab === "home" && activeCategory === "movies" && (
                    <MoviesPage
                      discoverMovies={discoverMovies}
                      moviesFilters={moviesFilters}
                      setMoviesFilters={setMoviesFilters}
                      moviesPerPage={moviesPerPage}
                      setMoviesPerPage={setMoviesPerPage}
                      moviesFacets={moviesFacets}
                      loadDiscoverMovies={loadDiscoverMovies}
                      setDiscoverMovies={setDiscoverMovies}
                      t={t}
                      renderMovieCard={(m) => <MovieCard movie={m} />}
                    />
                )}
                {activeTab === "home" && activeCategory === "tv" && (
                    <TvPage
                      discoverTv={discoverTv}
                      tvFilters={tvFilters}
                      setTvFilters={setTvFilters}
                      tvPerPage={tvPerPage}
                      setTvPerPage={setTvPerPage}
                      tvFacets={tvFacets}
                      loadDiscoverTv={loadDiscoverTv}
                      setDiscoverTv={setDiscoverTv}
                      t={t}
                      renderMovieCard={(m) => <MovieCard movie={m} />}
                    />
                )}
                </div>
              )}
            {activeTab === "favorites" && (
              viewingShared && !isLoggedIn ? (
                <div className="flex flex-col lg:flex-row gap-0 lg:gap-6">
                  {/* Conteúdo principal - Desktop à esquerda, Mobile abaixo */}
                  <div className="flex-1 order-2 lg:order-1">
                    <div className="container mx-auto px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 md:pt-12 lg:pt-16 lg:pt-20">
                      <FavoritesPage
                        favorites={favorites}
                        t={t}
                        pushToast={pushToast}
                        setShareSlug={setShareSlug}
                        setShowShare={setShowShare}
                        renderMovieCard={(m) => <MovieCard movie={m} />}
                      />
                    </div>
                  </div>
                  {/* Sidebar com CTA - Desktop à direita (sticky), Mobile no topo - Compacta */}
                  <div className="lg:sticky lg:top-[80px] lg:self-start order-1 lg:order-2 w-full lg:w-64 xl:w-72 flex-shrink-0">
                    <div className="bg-gradient-to-b from-cyan-500/95 via-purple-600/95 to-lime-500/95 backdrop-blur-md border-b lg:border-b-0 lg:border-l border-white/20 shadow-lg lg:rounded-l-xl p-3 lg:p-4">
                      <div className="flex flex-col gap-3">
                        <div>
                          <h3 className="text-white text-base font-bold mb-2">Gostou desta lista?</h3>
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
                <div className="container mx-auto px-3 sm:px-4 md:px-6 pt-12 sm:pt-14 md:pt-16 lg:pt-20">
                  <FavoritesPage
                    favorites={favorites}
                    t={t}
                    pushToast={pushToast}
                    setShareSlug={setShareSlug}
                    setShowShare={setShowShare}
                    renderMovieCard={(m) => <MovieCard movie={m} />}
                  />
                </div>
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
                    <div className="container mx-auto px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 md:pt-12 lg:pt-16 lg:pt-20">
                      <ListsPage
                        viewingShared={viewingShared}
                        sharedList={sharedList}
                        lists={lists}
                        activeListId={activeListId}
                        listSearchQuery={listSearchQuery}
                        setListSearchQuery={setListSearchQuery}
                        listSortOrder={listSortOrder}
                        setListSortOrder={setListSortOrder}
                        filteredAndSortedLists={filteredAndSortedLists}
                        createList={createList}
                        setActiveListId={setActiveListId}
                        pushToast={pushToast}
                        setShareSlug={setShareSlug}
                        setShowShare={setShowShare}
                        setRenameInput={setRenameInput}
                        setRenameModal={setRenameModal}
                        setCoverSelectorListId={setCoverSelectorListId}
                        setShowCoverSelector={setShowCoverSelector}
                        setConfirmModal={setConfirmModal}
                        deleteList={deleteList}
                        formatListUpdatedAt={formatListUpdatedAt}
                        t={t}
                        renderListDetail={(lst) => <ListDetailWrapper lst={lst} />}
                      />
                    </div>
                  </div>
                  {/* Sidebar com CTA - Desktop à direita (sticky), Mobile no topo - Compacta */}
                  <div className="lg:sticky lg:top-[80px] lg:self-start order-1 lg:order-2 w-full lg:w-64 xl:w-72 flex-shrink-0">
                    <div className="bg-gradient-to-b from-cyan-500/95 via-purple-600/95 to-lime-500/95 backdrop-blur-md border-b lg:border-b-0 lg:border-l border-white/20 shadow-lg lg:rounded-l-xl p-3 lg:p-4">
                      <div className="flex flex-col gap-3">
                        <div>
                          <h3 className="text-white text-base font-bold mb-2">Gostou desta lista?</h3>
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
                <div className="container mx-auto px-3 sm:px-4 md:px-6 pt-12 sm:pt-14 md:pt-16 lg:pt-20">
                  <ListsPage
                    viewingShared={viewingShared}
                    sharedList={sharedList}
                    lists={lists}
                    activeListId={activeListId}
                    listSearchQuery={listSearchQuery}
                    setListSearchQuery={setListSearchQuery}
                    listSortOrder={listSortOrder}
                    setListSortOrder={setListSortOrder}
                    filteredAndSortedLists={filteredAndSortedLists}
                    createList={createList}
                    setActiveListId={setActiveListId}
                    pushToast={pushToast}
                    setShareSlug={setShareSlug}
                    setShowShare={setShowShare}
                    setRenameInput={setRenameInput}
                    setRenameModal={setRenameModal}
                    setCoverSelectorListId={setCoverSelectorListId}
                    setShowCoverSelector={setShowCoverSelector}
                    setConfirmModal={setConfirmModal}
                    deleteList={deleteList}
                    formatListUpdatedAt={formatListUpdatedAt}
                    t={t}
                    renderListDetail={(lst) => <ListDetailWrapper lst={lst} />}
                  />
                </div>
              );
            })()}
            {activeTab === "people" && (
              <div className="container mx-auto px-3 sm:px-4 md:px-6 pt-12 sm:pt-14 md:pt-16 lg:pt-20">
                <PeoplePage
                  peopleSearchTerm={peopleSearchTerm}
                  setPeopleSearchTerm={setPeopleSearchTerm}
                  peopleLoading={peopleLoading}
                  peopleSearchLoading={peopleSearchLoading}
                  popularPeopleList={popularPeopleList}
                  searchedPeople={searchedPeople}
                  filteredPeople={filteredPeople}
                  peopleTotalPages={peopleTotalPages}
                  peoplePage={peoplePage}
                  handlePeoplePageChange={handlePeoplePageChange}
                  t={t}
                />
                  </div>
            )}
            {(activeTab === "watchlist" || activeTab.startsWith("watchlist-")) && (
              viewingShared && !isLoggedIn ? (
                <div className="flex flex-col lg:flex-row gap-0 lg:gap-6">
                  {/* Conteúdo principal - Desktop à esquerda, Mobile abaixo */}
                  <div className="flex-1 order-2 lg:order-1">
                    <div className="container mx-auto px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 md:pt-12 lg:pt-16 lg:pt-20">
                      <WatchlistPage
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        userStates={userStates}
                        setUserStates={setUserStates}
                        favorites={favorites}
                        watchHistory={watchHistory}
                        lists={lists}
                        cats={cats}
                        viewingShared={viewingShared}
                        setConfirmModal={setConfirmModal}
                        pushToast={pushToast}
                        setShareSlug={setShareSlug}
                        setShowShare={setShowShare}
                        removeFromWatchHistory={removeFromWatchHistory}
                        setRatingFor={setRatingFor}
                        setDescriptionFor={setDescriptionFor}
                        t={t}
                      />
                    </div>
                  </div>
                  {/* Sidebar com CTA - Desktop à direita (sticky), Mobile no topo - Compacta */}
                  <div className="lg:sticky lg:top-[80px] lg:self-start order-1 lg:order-2 w-full lg:w-64 xl:w-72 flex-shrink-0">
                    <div className="bg-gradient-to-b from-cyan-500/95 via-purple-600/95 to-lime-500/95 backdrop-blur-md border-b lg:border-b-0 lg:border-l border-white/20 shadow-lg lg:rounded-l-xl p-3 lg:p-4">
                      <div className="flex flex-col gap-3">
                        <div>
                          <h3 className="text-white text-base font-bold mb-2">Gostou desta lista?</h3>
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
                <div className="container mx-auto px-3 sm:px-4 md:px-6 pt-12 sm:pt-14 md:pt-16 lg:pt-20">
                  <WatchlistPage
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    userStates={userStates}
                    setUserStates={setUserStates}
                    favorites={favorites}
                    watchHistory={watchHistory}
                    lists={lists}
                    cats={cats}
                    viewingShared={viewingShared}
                    setConfirmModal={setConfirmModal}
                    pushToast={pushToast}
                    setShareSlug={setShareSlug}
                    setShowShare={setShowShare}
                    removeFromWatchHistory={removeFromWatchHistory}
                    setRatingFor={setRatingFor}
                    setDescriptionFor={setDescriptionFor}
                    t={t}
                  />
                </div>
              )
            )}
            {activeTab === "stats" && <div className="container mx-auto px-3 sm:px-4 md:px-6 pt-12 sm:pt-14 md:pt-16 lg:pt-20">{StatsContent}</div>}
            </>
          )}
        </main>
      )}

      {isLoggedIn && location.pathname !== "/history" && <SiteFooter 
        goToHomeCategory={goToHomeCategory}
        handleFooterLink={handleFooterLink}
        setActiveTab={setActiveTab}
        setShowProfileModal={setShowProfileModal}
        t={t}
      />}
      {isLoggedIn && location.pathname !== "/history" && <MobileFooter 
        useBottomNav={useBottomNav}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        setActiveListId={setActiveListId}
        t={t}
      />}

      {/* Modal de confirmação para sair da página de edição de perfil */}
      {showExitEditProfileConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ zIndex: 9999 }}>
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
            className="fixed inset-0 bg-black/50 z-[9999]"
            onClick={() => setShowActionSheet(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-200 dark:border-slate-800 animate-fade-in-up max-h-[90vh] overflow-y-auto" style={{ paddingBottom: `max(env(safe-area-inset-bottom), 24px)`, zIndex: 9999 }}>
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

      {/* Rotas para modais e páginas dedicadas */}
      {location.pathname.startsWith("/movie/") || location.pathname.startsWith("/tv/") || location.pathname.startsWith("/person/") ? (
        <Routes>
          <Route path="/movie/:id" element={<MovieRouteModal />} />
          <Route path="/tv/:id" element={<MovieRouteModal />} />
          <Route path="/person/:id" element={<PersonRouteModal />} />
        </Routes>
      ) : null}
      
      

      {/* Modal de Compartilhamento */}
      {showShare && shareSlug && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
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
                        const shareUrl = `${window.location.origin}${window.location.pathname}?share=${shareSlug}`;
                        await navigator.clipboard.writeText(shareUrl);
                        pushToast({ message: "Link copiado para a área de transferência.", tone: "ok" });
                        if (!isLoggedIn) {
                          navigate(`?share=${shareSlug}`, { replace: true });
                        }
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
        <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
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
        <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
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
      <RenameListModal
        show={renameModal.show}
        currentName={renameModal.currentName}
        inputValue={renameInput}
        onInputChange={setRenameInput}
        onConfirm={() => {
          if (renameInput.trim() && renameModal.listId) {
            renameList(renameModal.listId, renameInput.trim());
            setRenameModal({ show: false, listId: null, currentName: "" });
            setRenameInput("");
          }
        }}
        onCancel={() => {
          setRenameModal({ show: false, listId: null, currentName: "" });
          setRenameInput("");
        }}
      />

      <ConfirmModal
        show={confirmModal.show}
        message={confirmModal.message}
        onConfirm={() => {
          confirmModal.onConfirm();
          setConfirmModal({ show: false, message: "", onConfirm: () => {} });
        }}
        onCancel={() => setConfirmModal({ show: false, message: "", onConfirm: () => {} })}
      />

      <DeleteAccountModal
        show={showDeleteAccountModal}
        password={deleteAccountPassword}
        error={deleteAccountError}
        loading={deleteAccountLoading}
        confirmCheckbox={deleteAccountConfirmCheckbox}
        onClose={() => {
          setShowDeleteAccountModal(false);
          setDeleteAccountPassword("");
          setDeleteAccountError("");
          setDeleteAccountConfirmCheckbox(false);
        }}
        onPasswordChange={(password) => {
          setDeleteAccountPassword(password);
          setDeleteAccountError("");
        }}
        onCheckboxChange={setDeleteAccountConfirmCheckbox}
        onConfirm={handleDeleteAccount}
      />

      <VerificationEmailModal
        show={showVerificationEmailModal}
        email={verificationEmail}
        onClose={() => setShowVerificationEmailModal(false)}
        pushToast={pushToast}
      />

      <BannerHost banners={banners} onClose={removeBanner} />
      <ToastHost toasts={toasts} onClose={removeToast} />
      {showLogin && <LoginModal
        formData={formData}
        loginType={loginType}
        showPassword={showPassword}
        firstNameError={firstNameError}
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
        forgotPasswordError={forgotPasswordError}
        forgotPasswordStep={forgotPasswordStep}
        setForgotPasswordStep={setForgotPasswordStep}
        forgotPasswordCode={forgotPasswordCode}
        setForgotPasswordCode={setForgotPasswordCode}
        forgotPasswordNewPassword={forgotPasswordNewPassword}
        setForgotPasswordNewPassword={setForgotPasswordNewPassword}
        forgotPasswordConfirmPassword={forgotPasswordConfirmPassword}
        setForgotPasswordConfirmPassword={setForgotPasswordConfirmPassword}
        forgotPasswordShowPassword={forgotPasswordShowPassword}
        setForgotPasswordShowPassword={setForgotPasswordShowPassword}
        forgotPasswordStrength={forgotPasswordStrength}
        forgotPasswordErrors={forgotPasswordErrors}
        forgotPasswordShowTips={forgotPasswordShowTips}
        setForgotPasswordShowTips={setForgotPasswordShowTips}
        handleForgotPasswordConfirmCode={handleForgotPasswordConfirmCode}
        handleForgotPasswordReset={handleForgotPasswordReset}
        t={t}
        handleInputChange={handleInputChange}
        handleInputBlur={handleInputBlur}
        handleSubmit={handleSubmit}
        setShowLogin={setShowLogin}
        setLoginType={setLoginType}
        setLoginError={setLoginError}
        setFirstNameError={setFirstNameError}
        setEmailError={setEmailError}
        setPasswordError={setPasswordError}
        setShowPassword={setShowPassword}
        setFormData={setFormData}
        setShowForgotPassword={setShowForgotPassword}
        setForgotPasswordEmail={setForgotPasswordEmail}
        setForgotPasswordError={setForgotPasswordError}
        generatePassword={generatePassword}
        setShowPasswordTips={setShowPasswordTips}
        setConfirmPasswordError={setConfirmPasswordError}
        setConfirmPasswordTouched={setConfirmPasswordTouched}
        emailVerified={emailVerified}
        handleForgotPasswordCheckEmail={handleForgotPasswordCheckEmail}
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

export default function App(): JSX.Element {
  const location = useLocation();
  const { toasts, pushToast, removeToast } = useToast();
  const { banners, pushBanner, removeBanner } = useBanner();
  
  if (location.pathname === "/privacy") return <PrivacyPage />;
  if (location.pathname === "/terms") return <TermsPage />;
  if (location.pathname === "/about") return <AboutPage />;
  if (location.pathname === "/help") return <HelpPage />;
  if (location.pathname === "/verify-code") {
    return (
      <>
        <VerificationCodePage pushToast={pushToast} pushBanner={pushBanner} />
        <BannerHost banners={banners} onClose={removeBanner} />
        <ToastHost toasts={toasts} onClose={removeToast} />
      </>
    );
  }
  return <AppShell />;
}

