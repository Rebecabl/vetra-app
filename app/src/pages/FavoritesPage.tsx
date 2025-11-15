import React from "react";
import { Clipboard, Heart } from "lucide-react";
import type { MovieT } from "../types/movies";
import { toPosterPath } from "../lib/media.utils";
import api from "../api";

interface FavoritesPageProps {
  favorites: MovieT[];
  t: (key: string, params?: Record<string, any>) => string;
  pushToast: (toast: { message: string; tone: "ok" | "err" | "info" }) => void;
  setShareSlug: (slug: string) => void;
  setShowShare: (show: boolean) => void;
  renderMovieCard: (movie: MovieT) => React.ReactNode;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  favorites,
  t,
  pushToast,
  setShareSlug,
  setShowShare,
  renderMovieCard,
}) => {
  return (
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
              {renderMovieCard(m)}
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
};

