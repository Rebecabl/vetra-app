import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { TabKey } from "../types/movies";

export interface UseNavigationReturn {
  activeTab: TabKey;
  activeCategory: "movies" | "tv" | "people" | "home";
  setActiveTab: (tab: TabKey) => void;
  setActiveCategory: (category: "movies" | "tv" | "people" | "home") => void;
  handleTabChange: (newTab: TabKey) => void;
  handleCategoryChange: (newCategory: "movies" | "tv" | "people" | "home") => void;
  showExitEditProfileConfirm: boolean;
  setShowExitEditProfileConfirm: (show: boolean) => void;
  confirmExitEditProfile: () => void;
  cancelExitEditProfile: () => void;
  editProfileHasChanges: boolean;
  setEditProfileHasChanges: (hasChanges: boolean) => void;
}

export function useNavigation(): UseNavigationReturn {
  const location = useLocation();
  const navigate = useNavigate();

  // Restaura tab salva apenas se houver token e não for novo login (detectado via flag)
  const [activeTab, setActiveTabState] = useState<TabKey>(() => {
    try {
      const hasToken = localStorage.getItem('vetra:idToken');
      const wasJustLoggedOut = sessionStorage.getItem('vetra:justLoggedOut');
      
      if (wasJustLoggedOut) {
        sessionStorage.removeItem('vetra:justLoggedOut');
        return "home";
      }
      
      if (hasToken && !wasJustLoggedOut) {
        const saved = localStorage.getItem('vetra:activeTab');
        if (saved && (saved === "home" || saved === "favorites" || saved === "lists" || saved === "watchlist" || saved === "people")) {
          return saved as TabKey;
        }
      }
    } catch {}
    return "home";
  });

  const [activeCategory, setActiveCategoryState] = useState<"movies" | "tv" | "people" | "home">(() => {
    try {
      const hasToken = localStorage.getItem('vetra:idToken');
      const wasJustLoggedOut = sessionStorage.getItem('vetra:justLoggedOut');
      
      if (wasJustLoggedOut) {
        return "home";
      }
      
      if (hasToken && !wasJustLoggedOut) {
        const saved = localStorage.getItem('vetra:activeCategory');
        if (saved && (saved === "movies" || saved === "tv" || saved === "people" || saved === "home")) {
          return saved as "movies" | "tv" | "people" | "home";
        }
      }
    } catch {}
    return "home";
  });

  // Intercepta navegação quando há alterações não salvas no perfil
  const [showExitEditProfileConfirm, setShowExitEditProfileConfirm] = useState(false);
  const [pendingTabChange, setPendingTabChange] = useState<TabKey | null>(null);
  const [pendingCategoryChange, setPendingCategoryChange] = useState<"movies" | "tv" | "people" | "home" | null>(null);
  const [editProfileHasChanges, setEditProfileHasChanges] = useState(false);

  const handleTabChange = (newTab: TabKey) => {
    const isOnEditProfile = location.pathname === "/profile/edit" || location.pathname === "/edit-profile";
    const isOnViewProfile = location.pathname === "/profile" || location.pathname === "/me";
    const isOnHistory = location.pathname === "/history";
    
    // Se está apenas visualizando o perfil, permitir navegação normal
    if (isOnViewProfile) {
      setActiveTabState(newTab);
      navigate("/");
      return;
    }
    
    if (isOnHistory) {
      setActiveTabState(newTab);
      navigate("/");
      return;
    }
    
    // Se está na página de edição e há alterações, mostrar modal de confirmação
    if (isOnEditProfile && editProfileHasChanges) {
      setPendingTabChange(newTab);
      setPendingCategoryChange(null);
      setShowExitEditProfileConfirm(true);
      return;
    }
    
    setActiveTabState(newTab);
    if (isOnEditProfile) {
      navigate("/");
    }
  };

  const handleCategoryChange = (newCategory: "movies" | "tv" | "people" | "home") => {
    const isOnEditProfile = location.pathname === "/profile/edit" || location.pathname === "/edit-profile";
    const isOnViewProfile = location.pathname === "/profile" || location.pathname === "/me";
    const isOnHistory = location.pathname === "/history";
    
    // Se está apenas visualizando o perfil, permitir navegação normal
    if (isOnViewProfile) {
      setActiveCategoryState(newCategory);
      navigate("/");
      return;
    }
    
    if (isOnHistory) {
      setActiveCategoryState(newCategory);
      navigate("/");
      return;
    }

    // Se está na página de edição e há alterações, mostrar modal de confirmação
    if (isOnEditProfile && editProfileHasChanges) {
      setPendingTabChange(null);
      setPendingCategoryChange(newCategory);
      setShowExitEditProfileConfirm(true);
      return;
    }
    
    setActiveCategoryState(newCategory);
    if (isOnEditProfile) {
      navigate("/");
    }
  };

  const confirmExitEditProfile = () => {
    setShowExitEditProfileConfirm(false);
    setEditProfileHasChanges(false);
    
    if (pendingTabChange) {
      setActiveTabState(pendingTabChange);
      setPendingTabChange(null);
    }
    if (pendingCategoryChange) {
      setActiveCategoryState(pendingCategoryChange);
      setPendingCategoryChange(null);
    }
    
    navigate("/");
  };

  const cancelExitEditProfile = () => {
    setShowExitEditProfileConfirm(false);
    setPendingTabChange(null);
    setPendingCategoryChange(null);
  };

  // Reseta navegação quando não há token (logout ou sessão expirada)
  useEffect(() => {
    const hasToken = localStorage.getItem('vetra:idToken');
    if (!hasToken) {
      setActiveTabState("home");
      setActiveCategoryState("home");
    }
  }, [location.pathname, navigate]);
  
  // Salva estado de navegação apenas se houver token
  useEffect(() => { 
    try {
      const hasToken = localStorage.getItem('vetra:idToken');
      if (hasToken) {
        localStorage.setItem('vetra:activeTab', activeTab);
      }
    } catch {} 
  }, [activeTab]);

  useEffect(() => { 
    try {
      const hasToken = localStorage.getItem('vetra:idToken');
      if (hasToken) {
        localStorage.setItem('vetra:activeCategory', activeCategory);
      }
    } catch {} 
  }, [activeCategory]);

  return {
    activeTab,
    activeCategory,
    setActiveTab: setActiveTabState,
    setActiveCategory: setActiveCategoryState,
    handleTabChange,
    handleCategoryChange,
    showExitEditProfileConfirm,
    setShowExitEditProfileConfirm,
    confirmExitEditProfile,
    cancelExitEditProfile,
    editProfileHasChanges,
    setEditProfileHasChanges,
  };
}

