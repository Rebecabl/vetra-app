import React from "react";
import type { MovieT } from "../types/movies";
import { Pagination } from "./Pagination";

interface CategorySectionProps {
  title: string;
  items: MovieT[];
  loading: boolean;
  error?: string;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  renderCard: (m: MovieT) => React.ReactNode;
  sectionKey?: string;
  subtitle?: string;
}

export const CategorySection: React.FC<CategorySectionProps> = ({ 
  title, 
  items, 
  loading, 
  error, 
  currentPage, 
  totalPages, 
  onPageChange, 
  renderCard, 
  sectionKey, 
  subtitle 
}) => (
  <section className="mb-12 md:mb-16">
    <div className="mb-6">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
      )}
    </div>
    {loading && items.length === 0 ? (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-cyan-500 dark:border-slate-700" />
      </div>
    ) : items.length > 0 ? (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 min-[1201px]:grid-cols-6 gap-2 sm:gap-2 md:gap-3 lg:gap-4">
          {items.slice(0, 12).map((m, idx) => (
            <div key={`${sectionKey || title}-${m.media}-${m.id}-${idx}`} className="animate-fade-in-up" style={{ animationDelay: `${idx * 30}ms` }}>
              {renderCard(m)}
            </div>
          ))}
        </div>
        {currentPage && totalPages && totalPages > 1 && onPageChange && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            loading={loading}
          />
        )}
      </>
    ) : (
      <div className="text-center py-12 text-slate-500 dark:text-gray-400">
        {error ? `Falha ao carregar: ${error}` : "Sem resultados"}
      </div>
    )}
  </section>
);

