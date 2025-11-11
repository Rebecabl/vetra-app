import React from "react";
import { Home, Heart, List as ListIcon, Bookmark, Users } from "lucide-react";
import type { TabKey } from "../types/movies";

export interface MobileFooterProps {
  useBottomNav: boolean;
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  setActiveListId: (id: string | null) => void;
  t: (key: string) => string;
}

export const MobileFooter: React.FC<MobileFooterProps> = ({
  useBottomNav,
  activeTab,
  setActiveTab,
  setActiveListId,
  t,
}) => {
  if (!useBottomNav) return null;
  
  // Função para verificar se um tab está ativo
  const isActive = (tab: TabKey) => {
    if (tab === "watchlist") {
      return activeTab === "watchlist" || activeTab.startsWith("watchlist-");
    }
    return activeTab === tab;
  };
  
  // Componente de botão de navegação com indicador visual (listra)
  const NavButton: React.FC<{
    tab: TabKey;
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
  }> = ({ tab, icon, label, onClick }) => {
    const active = isActive(tab);
    
    return (
      <button
        onClick={onClick}
        className="relative flex flex-col items-center justify-center gap-1 flex-1 min-w-0 h-full min-h-[56px] touch-manipulation transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-inset focus-visible:ring-offset-0"
        style={{ 
          minHeight: '56px', 
          minWidth: '44px',
          paddingTop: '8px', 
          paddingBottom: '8px',
          paddingLeft: '4px',
          paddingRight: '4px',
        }}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        title={label}
      >
        {/* Indicador visual (listra) para item ativo */}
        {active && (
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-cyan-500 via-purple-600 to-lime-500 rounded-b-full transition-all duration-200 nav-indicator-active"
            aria-hidden="true"
          />
        )}
        
        {/* Ícone - garantindo área de toque adequada */}
        <div 
          className={`transition-colors duration-200 flex items-center justify-center ${active ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-gray-400"}`}
          style={{ minWidth: '20px', minHeight: '20px' }}
        >
          {icon}
        </div>
        
        {/* Label */}
        <span 
          className={`text-[10px] sm:text-[11px] font-medium leading-tight text-center truncate w-full px-1 transition-colors duration-200 ${active ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-gray-400"}`}
          style={{ lineHeight: '1.2', minHeight: '12px' }}
        >
          {label}
        </span>
      </button>
    );
  };
  
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/90 dark:supports-[backdrop-filter]:bg-slate-900/90 shadow-lg" 
      aria-label="Navegação inferior"
      style={{ 
        paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
        height: 'max(56px, calc(56px + env(safe-area-inset-bottom)))',
        minHeight: '56px'
      }}
    >
      <div className="flex items-stretch justify-center h-full w-full max-w-screen-xl mx-auto">
        <NavButton
          tab="home"
          icon={<Home size={20} className="shrink-0" />}
          label={t("home")}
          onClick={() => setActiveTab("home")}
        />
        <NavButton
          tab="favorites"
          icon={<Heart size={20} className="shrink-0" />}
          label={t("nav.favorites")}
          onClick={() => setActiveTab("favorites")}
        />
        <NavButton
          tab="lists"
          icon={<ListIcon size={20} className="shrink-0" />}
          label={t("lists")}
          onClick={() => { setActiveListId(null); setActiveTab("lists"); }}
        />
        <NavButton
          tab="watchlist"
          icon={<Bookmark size={20} className="shrink-0" />}
          label={t("collections")}
          onClick={() => setActiveTab("watchlist")}
        />
        <NavButton
          tab="people"
          icon={<Users size={20} className="shrink-0" />}
          label={t("people")}
          onClick={() => setActiveTab("people")}
        />
      </div>
      
    </nav>
  );
};

