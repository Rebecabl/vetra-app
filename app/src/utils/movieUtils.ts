import type { ApiMovie } from "../api";
import type { MovieT } from "../types/movies";
import { poster } from "../lib/media.utils";

/**
 * Mapeia resultados da API para o formato MovieT usado na aplicação
 */
export const mapRows = (rows: ApiMovie[]): MovieT[] =>
  rows.map((m) => ({
    id: m.id,
    media: (m as any).media || (m as any).media_type || "movie",
    title: (m as any).title || (m as any).name || "",
    rating: m.vote_average ?? null,
    voteCount: m.vote_count ?? null,
    year: (m as any).release_date || (m as any).first_air_date
      ? String((m as any).release_date || (m as any).first_air_date).slice(0, 4)
      : null,
    image: poster((m as any).poster_path),
    overview: (m as any).overview,
    poster_path: (m as any).poster_path ?? null,
  }));

/**
 * Normaliza número substituindo vírgula por ponto
 */
export const normalizeNumber = (value: string): string => {
  return value.replace(',', '.');
};

/**
 * Arredonda rating para 1 casa decimal
 */
export const snapRating = (value: number): number => {
  return Math.round(value * 10) / 10;
};

/**
 * Arredonda votos para número inteiro (mínimo 0)
 */
export const snapVotes = (value: number): number => {
  return Math.max(0, Math.round(value));
};

/**
 * Converte valor logarítmico para linear (usado em sliders de filtros)
 */
export const logToLinear = (value: number, min: number, max: number): number => {
  const logMin = Math.log10(min || 1);
  const logMax = Math.log10(max);
  const logValue = logMin + (value / 100) * (logMax - logMin);
  return Math.pow(10, logValue);
};

/**
 * Converte valor linear para logarítmico (usado em sliders de filtros)
 */
export const linearToLog = (value: number, min: number, max: number): number => {
  const safeValue = Math.max(min || 1, value);
  const logMin = Math.log10(min || 1);
  const logMax = Math.log10(max);
  const logValue = Math.log10(safeValue);
  return ((logValue - logMin) / (logMax - logMin)) * 100;
};

