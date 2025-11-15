import React from "react";
import { Clock } from "lucide-react";
import { formatDate } from "../utils/date";
import type { MovieT } from "../types/movies";
import { mediaKey } from "../types/movies";

interface HistoryPageProps {
  watchHistory: Array<{ movie: MovieT; watchedAt: string }>;
  t: (key: string, params?: Record<string, any>) => string;
  lang: string;
  renderMovieCard: (movie: MovieT) => React.ReactNode;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  watchHistory,
  t,
  lang,
  renderMovieCard,
}) => {
  return (
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
                {renderMovieCard(entry.movie)}
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
};

