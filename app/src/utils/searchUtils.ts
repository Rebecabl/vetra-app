/**
 * Utilitários para busca e ordenação de resultados
 */

import type { ApiMovie } from "../api";
import type { SearchFilters } from "../components/SearchFiltersPanel";

/**
 * Ordena resultados por rating (vote_average)
 */
export function sortByRating(a: ApiMovie, b: ApiMovie): number {
  const ratingA = a.vote_average || 0;
  const ratingB = b.vote_average || 0;
  if (ratingB !== ratingA) return ratingB - ratingA;
  
  const votesA = a.vote_count || 0;
  const votesB = b.vote_count || 0;
  if (votesB !== votesA) return votesB - votesA;
  
  const yearA = parseInt((a.release_date || (a as any).first_air_date || "").slice(0, 4) || "0");
  const yearB = parseInt((b.release_date || (b as any).first_air_date || "").slice(0, 4) || "0");
  return yearB - yearA;
}

/**
 * Ordena resultados por ano (release_date/first_air_date)
 */
export function sortByYear(a: ApiMovie, b: ApiMovie): number {
  const yearA = parseInt((a.release_date || (a as any).first_air_date || "").slice(0, 4) || "0");
  const yearB = parseInt((b.release_date || (b as any).first_air_date || "").slice(0, 4) || "0");
  if (yearB !== yearA) return yearB - yearA;
  
  const ratingA = a.vote_average || 0;
  const ratingB = b.vote_average || 0;
  if (ratingB !== ratingA) return ratingB - ratingA;
  
  const votesA = a.vote_count || 0;
  const votesB = b.vote_count || 0;
  return votesB - votesA;
}

/**
 * Aplica ordenação client-side baseada no tipo de ordenação
 */
export function applyClientSort(results: ApiMovie[], sortType: string): ApiMovie[] {
  if (sortType === "rating") {
    return [...results].sort(sortByRating);
  } else if (sortType === "year") {
    return [...results].sort(sortByYear);
  }
  return results;
}

/**
 * Verifica se há filtros não-padrão ativos
 */
export function hasNonDefaultFilters(
  filters: SearchFilters,
  defaults: SearchFilters
): boolean {
  return (
    filters.type !== defaults.type ||
    filters.sort !== defaults.sort ||
    filters.yearGte !== defaults.yearGte ||
    filters.yearLte !== defaults.yearLte ||
    filters.voteAvgGte > defaults.voteAvgGte ||
    filters.voteCntGte > defaults.voteCntGte ||
    filters.withPoster !== defaults.withPoster
  );
}

/**
 * Filtra resultados removendo itens sem poster
 */
export function filterByPoster<T extends { poster_path?: string | null }>(
  results: T[],
  withPoster: boolean
): T[] {
  if (!withPoster) return results;
  return results.filter((x) => x.poster_path);
}

