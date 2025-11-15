import React from "react";
import { Link } from "react-router-dom";
import { Search, User } from "lucide-react";
import { Pagination } from "../components/Pagination";

interface PeoplePageProps {
  peopleSearchTerm: string;
  setPeopleSearchTerm: (term: string) => void;
  peopleLoading: boolean;
  peopleSearchLoading: boolean;
  popularPeopleList: any[];
  searchedPeople: any[];
  filteredPeople: any[];
  peopleTotalPages: number;
  peoplePage: number;
  handlePeoplePageChange: (page: number) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export const PeoplePage: React.FC<PeoplePageProps> = ({
  peopleSearchTerm,
  setPeopleSearchTerm,
  peopleLoading,
  peopleSearchLoading,
  popularPeopleList,
  searchedPeople,
  filteredPeople,
  peopleTotalPages,
  peoplePage,
  handlePeoplePageChange,
  t,
}) => {
  return (
    <section>
      <div className="mb-4 sm:mb-6 md:mb-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">{t("people")}</h2>
        <div className="h-1 w-16 sm:w-20 bg-gradient-to-r from-cyan-500 via-purple-500 to-lime-400 rounded-full" />
      </div>
      
      <div className="mb-4 sm:mb-6">
        <div className="relative">
          <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <Search className="text-slate-400 dark:text-slate-500 w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <input
            value={peopleSearchTerm}
            onChange={(e) => setPeopleSearchTerm(e.target.value)}
            placeholder={t("search_by_name")}
            className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-lg border border-slate-300 dark:border-slate-600 focus:border-cyan-500 dark:focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:focus:ring-cyan-400/20 transition-all duration-200 text-sm sm:text-base font-normal"
          />
        </div>
      </div>
      
      {(peopleLoading && popularPeopleList.length === 0 && !peopleSearchTerm.trim()) || (peopleSearchLoading && peopleSearchTerm.trim()) ? (
        <div className="text-center py-12 md:py-16">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-300 dark:border-slate-700 border-t-cyan-500"></div>
          <p className="text-slate-600 dark:text-gray-400 mt-4 font-medium">
            {peopleSearchTerm.trim() ? "Buscando pessoas..." : "Carregando pessoas..."}
          </p>
        </div>
      ) : filteredPeople.length === 0 && peopleSearchTerm.trim() ? (
        <div className="text-center py-12 md:py-16 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-slate-700/50 shadow-2xl">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-slate-200/20 to-slate-300/20 dark:from-slate-700/20 dark:to-slate-800/20 mb-6 ring-4 ring-slate-300/10 dark:ring-slate-600/10">
            <User size={48} className="text-slate-400 dark:text-gray-500" />
          </div>
          <p className="text-slate-900 dark:text-white text-xl font-bold mb-2">Nenhuma pessoa encontrada</p>
          <p className="text-slate-600 dark:text-slate-400">Tente ajustar sua busca</p>
        </div>
      ) : filteredPeople.length === 0 ? (
        <div className="text-center py-12 md:py-16 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-slate-700/50 shadow-2xl">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-slate-200/20 to-slate-300/20 dark:from-slate-700/20 dark:to-slate-800/20 mb-6 ring-4 ring-slate-300/10 dark:ring-slate-600/10">
            <User size={48} className="text-slate-400 dark:text-gray-500" />
          </div>
          <p className="text-slate-900 dark:text-white text-xl font-bold mb-2">Nenhuma pessoa encontrada</p>
          <p className="text-slate-600 dark:text-slate-400">Os dados estão sendo carregados...</p>
        </div>
      ) : (
        <>
          {/* Grid responsivo: 2 colunas no mobile, 3 no tablet, 4 no desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {filteredPeople.map((person: any) => (
              <Link
                key={person.id}
                to={`/person/${person.id}`}
                className="group bg-white dark:bg-slate-800 rounded-xl overflow-hidden relative transition-all duration-300 shadow-md hover:shadow-xl"
              >
                {/* Container da imagem */}
                <div className="relative w-full overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800" style={{ aspectRatio: "2/3" }}>
                  {person.profile_path ? (
                    <>
                      <img
                        src={person.profile_path ? `https://image.tmdb.org/t/p/w185/${person.profile_path.replace(/^\//, '')}` : undefined}
                        srcSet={person.profile_path ? `
                          https://image.tmdb.org/t/p/w185/${person.profile_path.replace(/^\//, '')} 185w,
                          https://image.tmdb.org/t/p/w300/${person.profile_path.replace(/^\//, '')} 300w,
                          https://image.tmdb.org/t/p/w500/${person.profile_path.replace(/^\//, '')} 500w
                        ` : undefined}
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                        alt={person.name || "Pessoa"}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        decoding="async"
                        fetchPriority="low"
                        onError={(e) => {
                          console.error('[PeopleContent] Erro ao carregar imagem:', person.profile_path);
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) {
                            fallback.style.display = 'flex';
                            fallback.classList.remove('hidden');
                          }
                        }}
                        onLoad={() => {
                          console.log('[PeopleContent] Imagem carregada:', person.profile_path);
                        }}
                      />
                      <div className="absolute inset-0 w-full h-full flex items-center justify-center hidden bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800" style={{ aspectRatio: "2/3" }}>
                        <User size={48} className="text-slate-400 dark:text-gray-600" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ aspectRatio: "2/3" }}>
                      <User size={48} className="text-slate-400 dark:text-gray-600" />
                    </div>
                  )}
                </div>
                  
                {/* Informações abaixo da imagem */}
                <div className="p-3 sm:p-4 text-center">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-2">
                    {person.name}
                  </h3>
                  
                  {person.known_for_department && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1 line-clamp-1">
                      {person.known_for_department}
                    </p>
                  )}
                  
                  {person.known_for && person.known_for.length > 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-500 line-clamp-2 mt-1">
                      {person.known_for.map((kf: any) => kf.title || kf.name).slice(0, 2).join(", ")}
                      {person.known_for.length > 2 && "..."}
                    </p>
                  )}
                </div>
                
                {/* Traço colorido embaixo no hover */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-lime-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            ))}
          </div>
          
          {peopleTotalPages > 1 && !peopleSearchTerm.trim() && (
            <div className="mt-8">
              <Pagination
                currentPage={peoplePage}
                totalPages={peopleTotalPages}
                onPageChange={handlePeoplePageChange}
                loading={peopleLoading}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
};

