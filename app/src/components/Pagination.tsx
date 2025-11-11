import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  loading 
}) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex justify-center items-center gap-1.5 mt-10 flex-wrap">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || loading}
        className="px-3 py-2 rounded-lg bg-white/5 dark:bg-slate-800/50 hover:bg-white/10 dark:hover:bg-slate-700/70 text-slate-700 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm border border-slate-200/20 dark:border-slate-700/50"
        aria-label="Página anterior"
      >
        ‹
      </button>
      {pages.map((page, idx) => {
        if (page === "...") {
          return (
            <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 dark:text-slate-500 text-sm">
              ...
            </span>
          );
        }
        const pageNum = page as number;
        const isActive = currentPage === pageNum;
        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-600"
                : "bg-white/5 dark:bg-slate-800/50 hover:bg-white/10 dark:hover:bg-slate-700/70 text-slate-600 dark:text-slate-300 border border-slate-200/20 dark:border-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed"
            }`}
            aria-label={`Ir para página ${pageNum}`}
            aria-current={isActive ? "page" : undefined}
          >
            {pageNum}
          </button>
        );
      })}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || loading}
        className="px-3 py-2 rounded-lg bg-white/5 dark:bg-slate-800/50 hover:bg-white/10 dark:hover:bg-slate-700/70 text-slate-700 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm border border-slate-200/20 dark:border-slate-700/50"
        aria-label="Próxima página"
      >
        ›
      </button>
    </div>
  );
};

