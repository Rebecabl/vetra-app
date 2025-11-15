import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronUp } from "lucide-react";
import type { TabKey } from "../types/movies";
import type { CatKey } from "../lib/media.utils";

export interface SiteFooterProps {
  goToHomeCategory: (cat: CatKey) => void;
  handleFooterLink: (action: () => void, route: string | null, requiresAuth: boolean) => void;
  setActiveTab: (tab: TabKey) => void;
  setShowProfileModal: (show: boolean) => void;
  t: (key: string) => string;
}

export const SiteFooter: React.FC<SiteFooterProps> = ({
  goToHomeCategory,
  handleFooterLink,
  setActiveTab,
  setShowProfileModal,
  t,
}) => {
  const navigate = useNavigate();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <footer className="mt-20 border-t border-slate-300 dark:border-slate-800/50 bg-white dark:bg-slate-950 pb-20 md:pb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Logo */}
            <div className="flex items-center gap-2.5 cursor-pointer shrink-0" onClick={() => { setActiveTab("home"); navigate("/"); }}>
              <svg width="32" height="32" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <path d="M8 8 L8 32 L20 20 Z" fill="#22D3EE" />
                <path d="M12 12 L12 28 L24 20 Z" fill="#8B5CF6" />
                <path d="M16 8 L32 20 L16 32 Z" fill="#A3E635" />
              </svg>
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 bg-clip-text text-transparent">VETRA</span>
            </div>
            
            {/* Links de navegação */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-slate-600 dark:text-gray-400">
              <Link 
                to="/about" 
                className="hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded px-2 py-1 whitespace-nowrap"
              >
                Sobre o VETRA
              </Link>
              <Link 
                to="/privacy" 
                className="hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded px-2 py-1 whitespace-nowrap"
              >
                Política de Privacidade
              </Link>
              <Link 
                to="/terms" 
                className="hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded px-2 py-1 whitespace-nowrap"
              >
                Termos de Uso
              </Link>
            </div>
          </div>
          
          {/* Linha divisória */}
          <div className="pt-4 sm:pt-6 border-t border-slate-300 dark:border-slate-800/50">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
                {/* Copyright */}
                <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-500 text-center md:text-left">
                  © {new Date().getFullYear()} VETRA. Todos os direitos reservados.
                </p>
                
                {/* Dados por TMDB - lado direito */}
                <p className="text-xs text-slate-600 dark:text-gray-500 text-center md:text-right">
                  Dados fornecidos por{" "}
                  <a 
                    href="https://www.themoviedb.org/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-slate-700 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors underline focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded"
                  >
                    TMDB
                  </a>
                </p>
              </div>
              
              {/* Créditos - sempre visível, centralizado, pode quebrar linha em qualquer resolução */}
              <p className="text-xs text-slate-600 dark:text-gray-400 text-center w-full py-1" style={{ display: 'block', visibility: 'visible', opacity: 1 }}>
                Desenvolvido por <span className="font-medium text-slate-700 dark:text-gray-300">Rebeca Barbosa Lourenço</span>
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Botão Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 bg-slate-700/80 hover:bg-slate-600/90 dark:bg-slate-800/80 dark:hover:bg-slate-700/90 backdrop-blur-sm border border-slate-600/50 dark:border-slate-700/50 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
          aria-label="Voltar ao topo"
        >
          <ChevronUp size={24} />
        </button>
      )}
    </>
  );
};

