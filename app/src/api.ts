
const env = import.meta.env as any;


const API_BASE: string = (env.VITE_API_BASE || "").trim() || "http://localhost:4001";
const TMDB_BEARER: string | undefined = (env.VITE_TMDB_BEARER || "").trim() || undefined; // v4
const TMDB_V3: string | undefined = (env.VITE_TMDB_V3 || "").trim() || undefined;        // v3
const LANG: string = (env.VITE_TMDB_LANG || "pt-BR").trim();

const TMDB_BASE = "https://api.themoviedb.org/3";

export type ApiMovie = {
  id: number;
  title?: string;
  name?: string;
  media?: "movie" | "tv";
  media_type?: "movie" | "tv" | "person";
  poster_path?: string | null;
  backdrop_path?: string | null;
  overview?: string;
  release_date?: string | null;
  first_air_date?: string | null;
  vote_average?: number | null;
  vote_count?: number | null;
  popularity?: number | null;
  image?: string;
};

export type ApiBrowseResp = {
  page?: number;
  total_pages?: number;
  total_results?: number;
  results?: ApiMovie[];
  items?: ApiMovie[];
};

export type ApiDetails = {
  id: number;
  media: "movie" | "tv";

  media_type?: "movie" | "tv";
  title: string;
  original_title?: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string | null;
  year: string | null;
  runtime?: number | null;
  vote_average: number | null;
  vote_count: number | null;

  rating?: number | null;
  genres?: string[];
  directors?: string[];
  cast?: Array<{ id: number; name: string; character?: string; profile_path?: string | null }>;
  recommendations?: ApiMovie[];

  videos?: Array<{ key: string; site: string; type: string; name: string; official?: boolean; id?: string }>;

  trailers?: Array<{ id: string; name: string; key: string; official?: boolean }>;
  trailer_url?: string | null;
  release_date?: string | null;
  status?: string | null;
  budget?: number | null;
  revenue?: number | null;
  production_companies?: Array<{ id: number; name: string; logo_path?: string | null }>;
  production_countries?: string[];
  spoken_languages?: string[];
  tagline?: string | null;
  homepage?: string | null;
  imdb_id?: string | null;
  watch_providers?: {
    streaming?: Array<{ provider_id: number; provider_name: string; logo_path?: string | null }>;
    rent?: Array<{ provider_id: number; provider_name: string; logo_path?: string | null }>;
    buy?: Array<{ provider_id: number; provider_name: string; logo_path?: string | null }>;
  };

  writers?: Array<{ name: string; job: string }>;
  producers?: Array<{ name: string; job: string }>;
  cinematographers?: string[];
  composers?: string[];
  editors?: string[];
  keywords?: string[];
  belongs_to_collection?: {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
  } | null;
  certification?: string | null;
  numberOfSeasons?: number | null;
  numberOfEpisodes?: number | null;
  lastAirDate?: string | null;
  nextEpisodeToAir?: any | null;
  networks?: Array<{ id: number; name: string; logo_path: string | null }>;
  external_ids?: {
    imdb_id?: string | null;
    facebook_id?: string | null;
    instagram_id?: string | null;
    twitter_id?: string | null;
    wikidata_id?: string | null;
  };
  images?: {
    backdrops?: Array<{ file_path: string; width?: number; height?: number; aspect_ratio?: number }>;
    posters?: Array<{ file_path: string; width?: number; height?: number; aspect_ratio?: number }>;
  };
  allVideos?: Array<{
    id: string;
    key: string;
    name: string;
    site: string;
    type: string;
    official?: boolean;
    published_at?: string | null;
  }>;
  seasons?: Array<{
    id: number;
    name: string;
    overview?: string | null;
    poster_path?: string | null;
    season_number: number;
    air_date?: string | null;
    episode_count: number;
  }> | null;
};

export type ApiPersonDetails = {
  id: number;
  name: string;
  biography: string | null;
  profile_path: string | null;
  known_for_department?: string | null;
  birthday?: string | null;
  place_of_birth?: string | null;
  deathday?: string | null;
  gender?: number | null;
  popularity?: number | null;
  imdb_id?: string | null;
  combined_credits?: {
    cast?: ApiMovie[];
    crew?: ApiMovie[];
  };
  images?: {
    profiles?: Array<{
      file_path: string;
      width: number;
      height: number;
      aspect_ratio: number;
    }>;
  };
};

export type UserProfile = {
  name: string;
  email: string;
  uid?: string;
  avatar_url?: string | null;
  updatedAt?: string | null;
  status?: string;
  deletedAt?: string;
  deletionScheduledFor?: string;
  emailVerified?: boolean;
};


const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchJSON(url: string, opts: RequestInit = {}, timeoutMs = 12000): Promise<any> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort("timeout"), timeoutMs);
  try {
    const resp = await fetch(url, { ...opts, signal: ac.signal });
    if (!resp.ok) {
      const errorText = await resp.text().catch(() => resp.statusText);

      try {
        const errorJson = JSON.parse(errorText);

        if (errorJson && typeof errorJson === 'object') {
          return { ok: false, ...errorJson };
        }
      } catch {

      }
      throw new Error(`HTTP ${resp.status}: ${errorText || resp.statusText}`);
    }
    const data = await resp.json();
    return data;
  } catch (e: any) {
    if (e.name === "AbortError" || e.message === "timeout") {
      throw new Error("Timeout: A requisição demorou muito para responder");
    }
    throw e;
  } finally {
    clearTimeout(t);
  }
}

let backendOK: boolean | null = null;
let lastHealthCheck: number = 0;
const HEALTH_CHECK_CACHE_MS = 5000;

async function ensureBackendHealth(forceCheck = false): Promise<boolean> {
  if (!API_BASE || API_BASE.trim() === "") {
    console.warn("[ensureBackendHealth] API_BASE não configurado");
    return false;
  }
  

  const now = Date.now();
  if (!forceCheck && backendOK !== null && (now - lastHealthCheck) < HEALTH_CHECK_CACHE_MS) {
    return backendOK;
  }
  
  try {
    console.log("[ensureBackendHealth] Verificando backend em:", API_BASE);

    let r;
    try {
      r = await fetchJSON(`${API_BASE}/health`, {}, 3000);
      console.log("[ensureBackendHealth] /health respondeu:", r);
    } catch (e1) {
      console.log("[ensureBackendHealth] /health falhou, tentando /api/health");
      try {
        r = await fetchJSON(`${API_BASE}/api/health`, {}, 3000);
        console.log("[ensureBackendHealth] /api/health respondeu:", r);
      } catch (e2) {
        console.error("[ensureBackendHealth] Ambos os endpoints falharam:", e1, e2);
        backendOK = false;
        lastHealthCheck = now;
        return false;
      }
    }
    backendOK = !!(r && (r.ok === true || r.status === "ok"));
    lastHealthCheck = now;
    console.log("[ensureBackendHealth] Backend está:", backendOK ? "OK" : "INDISPONÍVEL");
    return backendOK;
  } catch (e) {
    console.error("[ensureBackendHealth] Erro ao verificar backend:", e);
    backendOK = false;
    lastHealthCheck = now;
    return false;
  }
}


export function resetBackendHealthCache() {
  backendOK = null;
  lastHealthCheck = 0;
  console.log("[resetBackendHealthCache] Cache resetado");
}


if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => {

    resetBackendHealthCache();
  });
}

function tmdbHeaders() {
  if (TMDB_BEARER) {
    return { headers: { Authorization: `Bearer ${TMDB_BEARER}` } };
  }
  if (TMDB_V3) {
    return {};
  }
  return {};
}
function tmdbUrl(path: string, params: Record<string, any> = {}) {
  const usp = new URLSearchParams({ language: LANG, ...params });
  if (!TMDB_BEARER && TMDB_V3) usp.set("api_key", TMDB_V3);
  return `${TMDB_BASE}${path}?${usp.toString()}`;
}



export function tmdbAuthStatus() {
  const status = {
    hasBearer: !!TMDB_BEARER,
    hasV3: !!TMDB_V3,
    lang: LANG,
    apiBase: API_BASE || "",
  };

  console.log("[TMDb] Status da API:", {
    hasBearer: status.hasBearer,
    hasV3: status.hasV3,
    lang: status.lang,
    bearerLength: TMDB_BEARER?.length || 0,
  });
  if (!status.hasBearer && !status.hasV3) {
    console.warn("[TMDb] API não configurada. Configure VITE_TMDB_BEARER ou VITE_TMDB_V3 no .env");
  }
  return status;
}

export async function health() {
  if (!API_BASE) return { ok: false, reason: "no-backend" };
  try {
  
    let r;
    try {
      r = await fetchJSON(`${API_BASE}/health`, {}, 3000);
    } catch {
      r = await fetchJSON(`${API_BASE}/api/health`, {}, 3000);
    }
    return r;
  } catch (e: any) {
    return { ok: false, reason: e?.message || "fail" };
  }
}


export async function browse(cat: "trending" | "popular" | "top_rated" | "now_playing" | "upcoming", page = 1): Promise<ApiBrowseResp> {
  if (await ensureBackendHealth()) {
    return fetchJSON(`${API_BASE}/api/browse/${cat}?page=${page}&lang=${encodeURIComponent(LANG)}`, {}, 12000);
  }


  let path = "";
  switch (cat) {
    case "trending":
      path = `/trending/all/day`;
      break;
    case "popular":
      path = `/movie/popular`;
      break;
    case "top_rated":
      path = `/movie/top_rated`;
      break;
    case "now_playing":
      path = `/movie/now_playing`;
      break;
    case "upcoming":
      path = `/movie/upcoming`;
      break;
  }
  const url = tmdbUrl(path, { page });
  const data = await fetchJSON(url, tmdbHeaders(), 12000);
  return data;
}


export async function browsePopularWithFilter(
  filter: "streaming" | "rent" | "cinema" | "tv", 
  page = 1
): Promise<ApiBrowseResp> {
  if (await ensureBackendHealth()) {
    return fetchJSON(
      `${API_BASE}/api/browse/popular/filter?filter=${filter}&page=${page}&region=BR&lang=${encodeURIComponent(LANG)}`, 
      {}, 
      12000
    );
  }


  let path = "";
  const params: any = { page };
  
  switch (filter) {
    case "streaming":
      path = `/discover/movie`;
      params.with_watch_monetization_types = "flatrate";
      params.watch_region = "BR";
      params.sort_by = "popularity.desc";
      break;
    case "rent":
      path = `/discover/movie`;
      params.with_watch_monetization_types = "rent";
      params.watch_region = "BR";
      params.sort_by = "popularity.desc";
      break;
    case "cinema":
      path = `/movie/now_playing`;
      params.region = "BR";
      break;
    case "tv":
      path = `/tv/popular`;
      break;
  }
  
  const url = tmdbUrl(path, params);
  const data = await fetchJSON(url, tmdbHeaders(), 12000);
  return data;
}


export async function search(query: string, page = 1, filters?: { year?: number; minRating?: number; genre?: string }): Promise<ApiBrowseResp> {
  if (await ensureBackendHealth()) {
    const params = new URLSearchParams();
    params.set("q", query);
    params.set("page", String(page));
    params.set("lang", LANG);
    if (filters?.year) params.set("year", String(filters.year));
    if (filters?.minRating) params.set("min_rating", String(filters.minRating));
    if (filters?.genre) params.set("genre", filters.genre);
    return fetchJSON(`${API_BASE}/api/search?${params.toString()}`, {}, 12000);
  }
  const url = tmdbUrl(`/search/multi`, { query, page, include_adult: false });
  const data = await fetchJSON(url, tmdbHeaders(), 12000);
  return data;
}


export async function details(media: "movie" | "tv", id: number, lang?: string): Promise<ApiDetails> {
  const language = (lang || LANG);


  if (await ensureBackendHealth()) {
    try {
      const d = await fetchJSON(`${API_BASE}/api/details/${media}/${id}?lang=${encodeURIComponent(language)}`, {}, 15000);
      return normalizeDetailsFromBackend(d);
    } catch (e: any) {
      console.warn("Backend falhou, tentando TMDb direto:", e?.message);
    
    }
  }


  if (!TMDB_BEARER && !TMDB_V3) {
    throw new Error("TMDb API não configurada. Adicione VITE_TMDB_BEARER ou VITE_TMDB_V3 no arquivo .env");
  }


  const url = tmdbUrl(`/${media}/${id}`, {
    append_to_response: "videos,credits,recommendations",
    language,
  });
  
  console.log("Buscando detalhes do TMDb:", url);
  try {
    const raw = await fetchJSON(url, tmdbHeaders(), 15000);
    return normalizeDetailsFromTMDb(media, raw);
  } catch (e: any) {
    console.error("Erro ao buscar detalhes do TMDb:", e);
    throw new Error(`Erro ao buscar detalhes: ${e?.message || "Erro desconhecido"}`);
  }
}

function mapVideosToTrailers(vids: any[]): Array<{ id: string; name: string; key: string; official?: boolean }> {
  return (Array.isArray(vids) ? vids : [])
    .filter((v) => v && v.site === "YouTube" && v.key)
    .map((v) => ({
      id: String(v.id || v.key),
      name: String(v.name || "Trailer"),
      key: String(v.key),
      official: !!v.official,
    }));
}

function normalizeDetailsFromBackend(d: any): ApiDetails {
  const media = (d.media || d.media_type || "movie") as "movie" | "tv";
  const year =
    (d.year as string) ||
    (d.release_date || d.first_air_date ? String(d.release_date || d.first_air_date).slice(0, 4) : null);

  let trailer: string | null = d.trailer_url || null;
  const vids = Array.isArray(d.videos) ? d.videos : [];
  if (!trailer && vids.length) {
    const yt = vids.find((v: any) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")) || vids.find((v: any) => v.site === "YouTube");
    if (yt?.key) trailer = `https://www.youtube.com/watch?v=${yt.key}`;
  }

  const trailers = d.trailers && d.trailers.length ? d.trailers : mapVideosToTrailers(vids);

  return {
    id: Number(d.id),
    media,
    media_type: media,
    title: d.title || d.name || "",
    poster_path: d.poster_path ?? null,
    backdrop_path: d.backdrop_path ?? null,
    overview: d.overview ?? null,
    year,
    runtime: typeof d.runtime === "number" ? d.runtime : undefined,
    vote_average: d.vote_average ?? null,
    vote_count: d.vote_count ?? null,
    rating: d.vote_average ?? null,
    genres: d.genres || [],
    directors: d.directors || [],
    cast: d.cast || [],
    recommendations: d.recommendations || [],
    videos: vids,
    trailers,
    trailer_url: trailer,
    writers: d.writers || [],
    producers: d.producers || [],
    cinematographers: d.cinematographers || [],
    composers: d.composers || [],
    editors: d.editors || [],
    keywords: d.keywords || [],
    belongs_to_collection: d.belongs_to_collection || null,
    certification: d.certification || null,
    numberOfSeasons: d.numberOfSeasons || null,
    numberOfEpisodes: d.numberOfEpisodes || null,
    lastAirDate: d.lastAirDate || null,
    nextEpisodeToAir: d.nextEpisodeToAir || null,
    networks: d.networks || [],
    external_ids: d.external_ids || {},
    release_date: d.release_date || null,
    status: d.status || null,
    budget: d.budget || null,
    revenue: d.revenue || null,
    production_companies: d.production_companies || [],
    production_countries: d.production_countries || [],
    spoken_languages: d.spoken_languages || [],
    tagline: d.tagline || null,
    homepage: d.homepage || null,
    imdb_id: d.imdb_id || null,
    watch_providers: d.watch_providers || {},
    original_title: d.original_title || null,
    images: d.images || { backdrops: [], posters: [] },
    allVideos: d.allVideos || [],
    seasons: d.seasons || null,
  };
}

function normalizeDetailsFromTMDb(media: "movie" | "tv", raw: any): ApiDetails {
  const title = media === "movie" ? raw.title : raw.name;
  const date = media === "movie" ? raw.release_date : raw.first_air_date;
  const year = date ? String(date).slice(0, 4) : null;

  const genres: string[] = Array.isArray(raw.genres) ? raw.genres.map((g: any) => g.name).filter(Boolean) : [];

  const directors: string[] = Array.isArray(raw?.credits?.crew)
    ? raw.credits.crew.filter((c: any) => c.job === "Director").map((c: any) => c.name)
    : [];

  const cast =
    Array.isArray(raw?.credits?.cast)
      ? raw.credits.cast.slice(0, 24).map((c: any) => ({
          id: c.id,
          name: c.name,
          character: c.character,
          profile_path: c.profile_path ?? null,
        }))
      : [];

  const recommendations = Array.isArray(raw?.recommendations?.results) ? raw.recommendations.results : [];

  const vids = Array.isArray(raw?.videos?.results) ? raw.videos.results : [];
  const trailers = mapVideosToTrailers(vids);

  let trailer: string | null = null;
  const ytTrailer =
    vids.find((v: any) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")) ||
    vids.find((v: any) => v.site === "YouTube");
  if (ytTrailer?.key) trailer = `https://www.youtube.com/watch?v=${ytTrailer.key}`;

  return {
    id: Number(raw.id),
    media,
    media_type: media,
    title: title || "",
    poster_path: raw.poster_path ?? null,
    backdrop_path: raw.backdrop_path ?? null,
    overview: raw.overview ?? null,
    year,
    runtime:
      typeof raw.runtime === "number"
        ? raw.runtime
        : typeof raw.episode_run_time?.[0] === "number"
        ? raw.episode_run_time[0]
        : undefined,
    vote_average: raw.vote_average ?? null,
    vote_count: raw.vote_count ?? null,
    rating: raw.vote_average ?? null,
    genres,
    directors,
    cast,
    recommendations,
    videos: vids,
    trailers,
    trailer_url: trailer,
  };
}

export async function personDetails(id: number, lang?: string): Promise<ApiPersonDetails> {
  const language = (lang || LANG);

  if (await ensureBackendHealth()) {
    return fetchJSON(`${API_BASE}/api/people/${id}?lang=${encodeURIComponent(language)}`, {}, 12000);
  }
  const url = tmdbUrl(`/person/${id}`, {
    append_to_response: "combined_credits,images,external_ids",
    language,
  });
  const p = await fetchJSON(url, tmdbHeaders(), 12000);
  
  const cast = (p.combined_credits?.cast || []).map((credit: any) => ({
    id: credit.id,
    media: credit.media_type || (credit.first_air_date ? "tv" : "movie"),
    media_type: credit.media_type || (credit.first_air_date ? "tv" : "movie"),
    title: credit.title || credit.name || "",
    name: credit.name || credit.title || "",
    character: credit.character || null,
    poster_path: credit.poster_path || null,
    backdrop_path: credit.backdrop_path || null,
    release_date: credit.release_date || null,
    first_air_date: credit.first_air_date || null,
    vote_average: credit.vote_average ?? null,
    vote_count: credit.vote_count ?? null,
    popularity: credit.popularity ?? null,
    overview: credit.overview || null,
  }));
  
  const crew = (p.combined_credits?.crew || []).map((credit: any) => ({
    id: credit.id,
    media: credit.media_type || (credit.first_air_date ? "tv" : "movie"),
    media_type: credit.media_type || (credit.first_air_date ? "tv" : "movie"),
    title: credit.title || credit.name || "",
    name: credit.name || credit.title || "",
    job: credit.job || null,
    department: credit.department || null,
    poster_path: credit.poster_path || null,
    backdrop_path: credit.backdrop_path || null,
    release_date: credit.release_date || null,
    first_air_date: credit.first_air_date || null,
    vote_average: credit.vote_average ?? null,
    vote_count: credit.vote_count ?? null,
    popularity: credit.popularity ?? null,
    overview: credit.overview || null,
  }));
  
  return {
    id: Number(p.id),
    name: p.name || "",
    biography: p.biography ?? null,
    profile_path: p.profile_path ?? null,
    known_for_department: p.known_for_department ?? null,
    birthday: p.birthday ?? null,
    place_of_birth: p.place_of_birth ?? null,
    deathday: p.deathday ?? null,
    gender: p.gender ?? null,
    popularity: p.popularity ?? null,
    imdb_id: p.external_ids?.imdb_id || null,
    combined_credits: {
      cast,
      crew,
    },
    images: {
      profiles: (p.images?.profiles || []).map((img: any) => ({
        file_path: img.file_path,
        width: img.width,
        height: img.height,
        aspect_ratio: img.aspect_ratio,
      })),
    },
  };
}

export async function popularPeople(page = 1, lang?: string): Promise<ApiBrowseResp> {
  const language = (lang || LANG);

  if (await ensureBackendHealth()) {
    return fetchJSON(`${API_BASE}/api/people/popular?page=${page}&lang=${encodeURIComponent(language)}`, {}, 12000);
  }
  const url = tmdbUrl(`/person/popular`, { page, language });
  const data = await fetchJSON(url, tmdbHeaders(), 12000);
  return data;
}

export async function searchPeople(query: string, page = 1, lang?: string): Promise<ApiBrowseResp> {
  const language = (lang || LANG);

  if (await ensureBackendHealth()) {
    const params = new URLSearchParams();
    params.set("query", query);
    params.set("page", String(page));
    params.set("lang", language);
    return fetchJSON(`${API_BASE}/api/people/search?${params.toString()}`, {}, 12000);
  }
  const url = tmdbUrl(`/search/person`, { query, page, include_adult: false, language });
  const data = await fetchJSON(url, tmdbHeaders(), 12000);
  return data;
}

function localShareKey(slug: string) {
  return `vetra:share:${slug}`;
}

// Base58 sem caracteres ambíguos (0, O, l, I)
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function randomSlug(len = 10) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function generateShareCode(): string {
  const randomPart = Array.from({ length: 9 }, () => 
    BASE58_ALPHABET[Math.floor(Math.random() * BASE58_ALPHABET.length)]
  ).join("");
  
  const blocks = [
    randomPart.slice(0, 3),
    randomPart.slice(3, 6),
    randomPart.slice(6, 9)
  ];
  
  // Checksum: soma dos índices dos caracteres mod 58
  let checksum = 0;
  for (const char of randomPart) {
    checksum = (checksum + BASE58_ALPHABET.indexOf(char)) % 58;
  }
  const checksumChar = BASE58_ALPHABET[checksum];
  
  return `V9-${blocks[0]}-${blocks[1]}-${blocks[2]}${checksumChar}`;
}

export function validateAndExtractSlug(input: string): string | null {
  const cleaned = input.trim().toUpperCase().replace(/\s+/g, "");
  let code = cleaned;
  
  if (code.startsWith("V9-")) {
    code = code.slice(3);
  }
  
  code = code.replace(/-/g, "");
  
  if (code.length !== 10) {
    // Tenta extrair de URL ou path
    const urlMatch = input.match(/[?&#]share=([^&?#]+)/i);
    if (urlMatch) {
      return urlMatch[1];
    }
    const pathMatch = input.match(/\/share\/([^\/]+)/i);
    if (pathMatch) {
      return pathMatch[1];
    }
    return null;
  }
  
  const dataPart = code.slice(0, 9);
  const checksumChar = code.slice(9);
  
  let checksum = 0;
  for (const char of dataPart) {
    const idx = BASE58_ALPHABET.indexOf(char);
    if (idx === -1) return null;
    checksum = (checksum + idx) % 58;
  }
  
  if (BASE58_ALPHABET[checksum] !== checksumChar) {
    // Checksum inválido, mas pode ser slug antigo sem validação
    return code;
  }
  
  return code;
}

export async function shareCreate(items: any[], type: 'favorites' | 'list' | 'collection' = 'favorites', listName: string | null = null) {
  if (await ensureBackendHealth()) {
    const resp = await fetchJSON(
      `${API_BASE}/api/share`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, type, listName }),
      },
      12000
    );
    // Normaliza resposta do backend para sempre ter code
    if (resp.slug) {
      const code = resp.slug.length === 10 && resp.slug.match(/^[A-Za-z0-9]+$/) 
        ? `V9-${resp.slug.slice(0, 3)}-${resp.slug.slice(3, 6)}-${resp.slug.slice(6, 9)}${resp.slug.slice(9)}`
        : generateShareCode();
      return { code, slug: resp.slug, type: resp.type || type };
    }
    return { code: generateShareCode(), slug: resp.slug || generateShareCode().replace(/V9-|-/g, ""), type: resp.type || type };
  }
  const code = generateShareCode();
  const slug = code.replace(/V9-|-/g, "").slice(0, 10);
  const payload = { items, type, listName, createdAt: Date.now() };
  localStorage.setItem(localShareKey(slug), JSON.stringify(payload));
  return { code, slug, type };
}

export async function shareGet(slugOrCode: string) {
  const slug = validateAndExtractSlug(slugOrCode) || slugOrCode;
  
  if (await ensureBackendHealth()) {
    return fetchJSON(`${API_BASE}/api/share/${encodeURIComponent(slug)}`, {}, 12000);
  }
  const txt = localStorage.getItem(localShareKey(slug));
  if (!txt) throw new Error("Share não encontrado");
  return JSON.parse(txt);
}

export async function authSignup(name: string, email: string, password: string): Promise<{ ok: boolean; user?: any; customToken?: string; error?: string }> {
  const normalizedEmail = email?.trim().toLowerCase() || "";
  const normalizedName = name?.trim() || "Usuário";
  const trimmedPassword = password?.trim() || "";
  
  if (!normalizedEmail || !trimmedPassword) {
    return { ok: false, error: "Email e senha são obrigatórios" };
  }
  
  if (await ensureBackendHealth()) {
    try {
      return await fetchJSON(
        `${API_BASE}/api/auth/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            name: normalizedName, 
            email: normalizedEmail, 
            password: trimmedPassword 
          }),
        },
        15000
      );
    } catch (e: any) {
      console.error("[authSignup] Erro:", e);
      return { ok: false, error: e?.message || "Erro ao criar conta" };
    }
  }
  // Fallback local quando backend não disponível
  return { ok: true, user: { name: normalizedName, email: normalizedEmail, uid: `local_${Date.now()}` } };
}

export async function resendVerificationEmail(email: string): Promise<{ ok: boolean; error?: string }> {
  const normalizedEmail = email?.trim().toLowerCase() || "";
  
  if (!normalizedEmail) {
    return { ok: false, error: "E-mail é obrigatório" };
  }
  
  const API_BASE = (import.meta.env.VITE_API_BASE || "").trim() || "http://localhost:4001";
  const backendHealthy = await ensureBackendHealth();
  
  if (!backendHealthy) {
    return { ok: false, error: "Backend não disponível" };
  }
  
  try {
    const token = localStorage.getItem('vetra:idToken');
    if (!token) {
      return { ok: false, error: "Você precisa estar autenticado" };
    }
    
    return await fetchJSON(
      `${API_BASE}/api/auth/resend-verification-email`,
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ email: normalizedEmail }),
      },
      15000
    );
  } catch (e: any) {
    console.error("[resendVerificationEmail] Erro:", e);
    return { ok: false, error: e?.message || "Erro ao reenviar e-mail de verificação" };
  }
}

export async function authSignin(email: string, password: string): Promise<{ ok: boolean; user?: any; customToken?: string; idToken?: string; refreshToken?: string; error?: string }> {
  const normalizedEmail = email?.trim().toLowerCase() || "";
  const trimmedPassword = password?.trim() || "";
  
  if (!normalizedEmail || !trimmedPassword) {
    return { ok: false, error: "Email e senha são obrigatórios" };
  }
  
  console.log("[authSignin] Tentando fazer login para:", normalizedEmail.substring(0, 3) + "***");
  console.log("[authSignin] API_BASE:", API_BASE);
  
  // Força verificação do backend ignorando cache
  const backendHealthy = await ensureBackendHealth(true);
  console.log("[authSignin] Backend health check:", backendHealthy);
  
  if (!backendHealthy) {
    console.error("[authSignin] Backend não está disponível!");
    console.error("[authSignin] Verifique se o servidor está rodando e acesse:", API_BASE + "/api/health");
    return { 
      ok: false, 
      error: "Backend não disponível. Verifique se o servidor está rodando na porta 4001." 
    };
  }
  
  try {
    console.log("[authSignin] Fazendo requisição para:", `${API_BASE}/api/auth/signin`);
    const result = await fetchJSON(
        `${API_BASE}/api/auth/signin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: normalizedEmail, 
          password: trimmedPassword 
        }),
        },
        15000
      );
    console.log("[authSignin] Resposta do backend:", { ok: result.ok, hasUser: !!result.user, hasIdToken: !!result.idToken });
    return result;
    } catch (e: any) {
    console.error("[authSignin] Erro na requisição:", e);
    const errorMessage = e?.message || "Erro ao fazer login. Verifique se o backend está rodando.";
    // Tenta extrair JSON do erro se possível
    if (typeof errorMessage === "string" && errorMessage.includes("{")) {
      try {
        const jsonMatch = errorMessage.match(/\{.*\}/);
        if (jsonMatch) {
          const parsedError = JSON.parse(jsonMatch[0]);
          return { ok: false, ...parsedError };
        }
      } catch {
        // Ignora erro de parsing e usa mensagem original
      }
    }
    return { ok: false, error: errorMessage };
    }
}

export async function checkEmailExists(email: string): Promise<{ ok: boolean; exists?: boolean; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  
  if (!normalizedEmail) {
    return { 
      ok: false, 
      error: "Email é obrigatório" 
    };
  }
  
  const backendHealthy = await ensureBackendHealth();
  if (!backendHealthy) {
    return { 
      ok: false, 
      error: "Backend não disponível" 
    };
  }
  
  if (!API_BASE) {
    return { 
      ok: false, 
      error: "API_BASE não configurado" 
    };
  }
  
  try {
    const url = `${API_BASE}/api/auth/check-email`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email: normalizedEmail
      }),
    });
    
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("[checkEmailExists] Erro:", error);
    return { 
      ok: false, 
      error: error?.message || "Erro ao verificar email" 
    };
  }
}

export async function resetPassword(email: string, newPassword: string): Promise<{ ok: boolean; message?: string; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  
  if (!normalizedEmail || !newPassword) {
    return { 
      ok: false, 
      error: "Email e senha são obrigatórios" 
    };
  }
  
  const backendHealthy = await ensureBackendHealth();
  if (!backendHealthy) {
    return { 
      ok: false, 
      error: "Backend não disponível" 
    };
  }
  
  if (!API_BASE) {
    return { 
      ok: false, 
      error: "API_BASE não configurado" 
    };
  }
  
  try {
    const url = `${API_BASE}/api/auth/reset-password`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email: normalizedEmail,
        newPassword: newPassword
      }),
    });
    
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("[resetPassword] Erro:", error);
    return { 
      ok: false, 
      error: error?.message || "Erro ao redefinir senha" 
    };
  }
}

export async function forgotPassword(email: string): Promise<{ ok: boolean; message?: string; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  
  if (!normalizedEmail) {
    return { 
      ok: false, 
      error: "Email é obrigatório" 
    };
  }
  
  console.log("[forgotPassword] Solicitando reset de senha para:", normalizedEmail.substring(0, 3) + "***");
  console.log("[forgotPassword] API_BASE:", API_BASE);
  
  const backendHealthy = await ensureBackendHealth();
  console.log("[forgotPassword] Backend health check:", backendHealthy);
  
  if (!backendHealthy) {
    return { 
      ok: false, 
      error: "Backend não disponível. Certifique-se de que o servidor está rodando na porta 4001." 
    };
  }
  
  if (!API_BASE) {
    return { 
      ok: false, 
      error: "API_BASE não configurado. Verifique o arquivo .env do frontend." 
    };
  }
  
  try {
    const url = `${API_BASE}/api/auth/forgot-password`;
    console.log("[forgotPassword] Fazendo requisição para:", url);
    
    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        email: normalizedEmail
      }),
    });
    
    console.log("[forgotPassword] Resposta recebida, status:", response.status);
    
    let data;
    try {
      data = await response.json();
      console.log("[forgotPassword] Dados da resposta:", { ok: data.ok, error: data.error, message: data.message });
    } catch (parseError) {
      const text = await response.text();
      console.error("[forgotPassword] Erro ao parsear JSON:", text);
      return { 
        ok: false, 
        error: `Erro ${response.status}: ${response.statusText}` 
      };
    }
    
    // O endpoint sempre retorna ok: true com mensagem genérica (por segurança)
    return data;
  } catch (error: any) {
    console.error("[forgotPassword] Erro na requisição:", error);
    if (error?.message?.includes("Failed to fetch") || error?.message?.includes("ERR_CONNECTION_REFUSED")) {
      return { 
        ok: false, 
        error: "Não foi possível conectar ao servidor. Verifique se o backend está rodando." 
      };
    }
    return { 
      ok: false, 
      error: error?.message || "Erro ao conectar com o servidor." 
    };
  }
}

export async function authVerify(idToken: string): Promise<{ ok: boolean; user?: any; error?: string }> {
  if (await ensureBackendHealth()) {
    try {
      return await fetchJSON(
        `${API_BASE}/api/auth/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        },
        10000
      );
    } catch (e: any) {
      return { ok: false, error: e?.message || "Token inválido" };
    }
  }
  return { ok: false, error: "Backend não disponível" };
}

export async function profileGet(email: string): Promise<UserProfile> {
  const normalizedEmail = email?.trim().toLowerCase() || "";
  
  if (!normalizedEmail) {
    throw new Error("Email é obrigatório para buscar o perfil");
  }
  
  if (await ensureBackendHealth()) {
    try {
      return await fetchJSON(`${API_BASE}/api/profile/${encodeURIComponent(normalizedEmail)}`, {}, 8000);
    } catch (e: any) {
      console.error("[profileGet] Erro ao buscar perfil:", e);
      const raw = localStorage.getItem(`vetra:profile:${normalizedEmail}`);
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {
          // Ignora erro de parse
        }
      }
      return { name: "Usuário", email: normalizedEmail, avatar_url: null, updatedAt: null };
    }
  }
  // Fallback para localStorage quando backend não disponível
  const raw = localStorage.getItem(`vetra:profile:${normalizedEmail}`);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // Ignora erro de parse
    }
  }
  return { name: "Usuário", email: normalizedEmail, avatar_url: null, updatedAt: null };
}

export async function profileUpdate(p: UserProfile): Promise<UserProfile> {
  if (!p.email) {
    throw new Error("Email é obrigatório para atualizar o perfil");
  }
  
  if (await ensureBackendHealth()) {
    try {
      const result = await fetchJSON(
        `${API_BASE}/api/profile`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: p.email.trim().toLowerCase(),
            name: p.name,
            avatar_url: p.avatar_url || null,
          }),
      },
      8000
    );
      return result;
    } catch (e: any) {
      console.error("[profileUpdate] Erro ao atualizar perfil:", e);
      const updated = { ...p, updatedAt: new Date().toISOString() };
      localStorage.setItem(`vetra:profile:${p.email}`, JSON.stringify(updated));
      return updated;
    }
  }
  // Usa localStorage quando backend não disponível
  const updated = { ...p, updatedAt: new Date().toISOString() };
  localStorage.setItem(`vetra:profile:${p.email}`, JSON.stringify(updated));
  return updated;
}

export async function reEnableAccount(email: string): Promise<{ ok: boolean; message?: string; error?: string }> {
  const backendHealthy = await ensureBackendHealth();
  if (!backendHealthy) {
    return { 
      ok: false, 
      error: "Backend não disponível" 
    };
  }

  if (!API_BASE) {
    return { 
      ok: false, 
      error: "API_BASE não configurado" 
    };
  }

  try {
    const url = `${API_BASE}/api/auth/re-enable-account`;
    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { 
        ok: false, 
        error: data.error || data.message || "Erro ao reabilitar conta" 
      };
    }

    return { 
      ok: true, 
      message: data.message || "Conta reabilitada com sucesso!" 
    };
  } catch (error: any) {
    console.error("[reEnableAccount] Erro:", error);
    return { 
      ok: false, 
      error: error?.message || "Erro ao reabilitar conta" 
    };
  }
}

export async function reactivateAccount(): Promise<{ ok: boolean; message?: string; error?: string }> {
  const backendHealthy = await ensureBackendHealth();
  if (!backendHealthy) {
    return { 
      ok: false, 
      error: "Backend não disponível" 
    };
  }

  if (!API_BASE) {
    return { 
      ok: false, 
      error: "API_BASE não configurado" 
    };
  }

  try {
    const idToken = localStorage.getItem("vetra:idToken");
    if (!idToken) {
      return { 
        ok: false, 
        error: "Token de autenticação não encontrado. Faça login novamente." 
      };
    }

    const url = `${API_BASE}/api/auth/reactivate-account`;
    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { 
        ok: false, 
        error: data.error || data.message || "Erro ao reativar conta" 
      };
    }

    return { 
      ok: true, 
      message: data.message || "Conta reativada com sucesso!" 
    };
  } catch (error: any) {
    console.error("[reactivateAccount] Erro:", error);
    return { 
      ok: false, 
      error: error?.message || "Erro ao reativar conta" 
    };
  }
}

export async function changePassword(newPassword: string, idToken?: string): Promise<{ ok: boolean; message?: string; error?: string }> {
  // Usa idToken do localStorage se não fornecido
  const token = idToken || localStorage.getItem('vetra:idToken') || '';
  
  if (!token) {
    return { 
      ok: false, 
      error: "Você precisa estar autenticado para alterar a senha. Faça login novamente." 
    };
  }
  
  if (!newPassword || newPassword.length < 8) {
    return { 
      ok: false, 
      error: "A nova senha deve ter no mínimo 8 caracteres" 
    };
  }
  
  console.log("[changePassword] Iniciando mudança de senha");
  console.log("[changePassword] API_BASE:", API_BASE);
  
  const backendHealthy = await ensureBackendHealth();
  console.log("[changePassword] Backend health check:", backendHealthy);
  
  if (!backendHealthy) {
    return { 
      ok: false, 
      error: "Backend não disponível. Certifique-se de que o servidor está rodando na porta 4001. Execute: cd api && npm run dev" 
    };
  }
  
  if (!API_BASE) {
    return { 
      ok: false, 
      error: "API_BASE não configurado. Verifique o arquivo .env do frontend." 
    };
  }
  
  try {
    const url = `${API_BASE}/api/profile/change-password`;
    console.log("[changePassword] Fazendo requisição para:", url);
    
    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ 
        newPassword: newPassword.trim() 
      }),
    });
    
    console.log("[changePassword] Resposta recebida, status:", response.status);
    
    let data;
    try {
      data = await response.json();
      console.log("[changePassword] Dados da resposta:", { ok: data.ok, error: data.error, message: data.message });
    } catch (parseError) {
      const text = await response.text();
      console.error("[changePassword] Erro ao parsear JSON:", text);
      return { 
        ok: false, 
        error: `Erro ${response.status}: ${response.statusText}. Resposta: ${text.substring(0, 100)}` 
      };
    }
    
    if (!response.ok) {
      // Retorna erro com mensagem do backend
      return { 
        ok: false, 
        error: data.message || data.error || `Erro ${response.status}: ${response.statusText}` 
      };
    }
    
    // Limpa tokens após mudança de senha (logout global)
    if (data.ok) {
      localStorage.removeItem('vetra:idToken');
      localStorage.removeItem('vetra:refreshToken');
    }
    
    return data;
  } catch (error: any) {
    console.error("[changePassword] Erro na requisição:", error);
    if (error?.message?.includes("Failed to fetch") || error?.message?.includes("ERR_CONNECTION_REFUSED")) {
      return { 
        ok: false, 
        error: "Não foi possível conectar ao servidor. Verifique se o backend está rodando. Execute: cd api && npm run dev" 
      };
    }
    return { 
      ok: false, 
      error: error?.message || "Erro ao conectar com o servidor. Verifique se o backend está rodando." 
    };
  }
}

export type Comment = {
  id: string;
  mediaKey: string;
  media: "movie" | "tv";
  mediaId: number;
  userId: string;
  userName: string;
  userAvatar: string | null;
  text: string;
  rating: number | null;
  likes: string[];
  reactions: Record<string, string[]>;
  createdAt: string;
  updatedAt: string;
};

export async function getComments(media: "movie" | "tv", id: number): Promise<Comment[]> {
  if (!API_BASE) {
    return [];
  }
  try {
    const res = await fetch(`${API_BASE}/api/comments/${media}/${id}`, {
      credentials: "include",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.comments || [];
  } catch {
    return [];
  }
}

export async function createComment(media: "movie" | "tv", id: number, text: string, rating?: number): Promise<{ ok: boolean; comment?: Comment; error?: string }> {
  if (!API_BASE) {
    return { ok: false, error: "API_BASE não configurada" };
  }
  try {
    const idToken = localStorage.getItem('vetra:idToken') || '';
    if (!idToken) {
      return { ok: false, error: "Usuário não autenticado. Faça login novamente." };
    }
    
    const res = await fetch(`${API_BASE}/api/comments/${media}/${id}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      },
      credentials: "include",
      body: JSON.stringify({ text, rating }),
    });
    const data = await res.json();
    console.log("[createComment] Resposta da API:", { status: res.status, data });
    if (!res.ok) {
      return { ok: false, error: data.error || data.message || "Erro ao criar comentário" };
    }
    // Valida estrutura do comentário retornado
    if (!data.comment || !data.comment.id) {
      console.error("[createComment] Comentário retornado sem ID:", data.comment);
      return { ok: false, error: "Comentário criado mas estrutura inválida" };
    }
    console.log("[createComment] Comentário válido retornado:", { id: data.comment.id, text: data.comment.text?.substring(0, 50) });
    return { ok: true, comment: data.comment };
  } catch (error: any) {
    return { ok: false, error: error.message || "Erro ao criar comentário" };
  }
}

export async function likeComment(commentId: string): Promise<{ ok: boolean; liked?: boolean; likesCount?: number; error?: string }> {
  if (!API_BASE) {
    return { ok: false, error: "API_BASE não configurada" };
  }
  try {
    const idToken = localStorage.getItem('vetra:idToken') || '';
    if (!idToken) {
      return { ok: false, error: "Usuário não autenticado. Faça login novamente." };
    }
    
    const res = await fetch(`${API_BASE}/api/comments/${commentId}/like`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${idToken}`
      },
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error || data.message || "Erro ao curtir comentário" };
    }
    return { ok: true, liked: data.liked, likesCount: data.likesCount };
  } catch (error: any) {
    return { ok: false, error: error.message || "Erro ao curtir comentário" };
  }
}

export async function reactToComment(commentId: string, reaction: "like" | "love" | "laugh" | "wow" | "sad" | "angry"): Promise<{ ok: boolean; reactions?: Record<string, string[]>; error?: string }> {
  if (!API_BASE) {
    return { ok: false, error: "API_BASE não configurada" };
  }
  try {
    const idToken = localStorage.getItem('vetra:idToken') || '';
    if (!idToken) {
      return { ok: false, error: "Usuário não autenticado. Faça login novamente." };
    }
    
    const res = await fetch(`${API_BASE}/api/comments/${commentId}/reaction`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      },
      credentials: "include",
      body: JSON.stringify({ reaction }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error || data.message || "Erro ao reagir ao comentário" };
    }
    return { ok: true, reactions: data.reactions };
  } catch (error: any) {
    return { ok: false, error: error.message || "Erro ao reagir ao comentário" };
  }
}

export async function deleteComment(commentId: string): Promise<{ ok: boolean; error?: string }> {
  if (!API_BASE) {
    return { ok: false, error: "API_BASE não configurada" };
  }
  try {
    const idToken = localStorage.getItem('vetra:idToken') || '';
    if (!idToken) {
      return { ok: false, error: "Usuário não autenticado. Faça login novamente." };
    }
    
    const res = await fetch(`${API_BASE}/api/comments/${commentId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${idToken}`
      },
      credentials: "include",
    });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error || data.message || "Erro ao deletar comentário" };
    }
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error.message || "Erro ao deletar comentário" };
  }
}

/**
 * Remove um item de uma lista do usuário
 * 
 * @param userId - ID do usuário
 * @param listId - ID da lista
 * @param itemId - ID do item (formato: "movie:123" ou "tv:456" ou apenas "123")
 * @returns { ok: boolean, error?: string }
 */
export async function removeListItem(userId: string, listId: string, itemId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    if (await ensureBackendHealth()) {
      const encodedUserId = encodeURIComponent(userId);
      const encodedListId = encodeURIComponent(listId);
      const encodedItemId = encodeURIComponent(itemId);
      
      const res = await fetch(`${API_BASE}/api/lists/${encodedUserId}/${encodedListId}/${encodedItemId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { ok: false, error: data.error || data.message || "Erro ao remover item da lista" };
      }
      
      return { ok: true };
    }
    // Retorna ok sem sincronização quando backend não disponível
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error.message || "Erro ao remover item da lista" };
  }
}

/**
 * Adiciona um item a uma lista do usuário
 * 
 * @param userId - ID do usuário
 * @param listId - ID da lista
 * @param item - Item a ser adicionado
 * @returns { ok: boolean, error?: string }
 */
export async function addListItem(userId: string, listId: string, item: { id: number; title?: string; image?: string; rating?: number; year?: string; media?: "movie" | "tv" }): Promise<{ ok: boolean; error?: string }> {
  try {
    if (await ensureBackendHealth()) {
      const encodedUserId = encodeURIComponent(userId);
      
      const res = await fetch(`${API_BASE}/api/lists/${encodedUserId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId, item }),
        credentials: "include",
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { ok: false, error: data.error || data.message || "Erro ao adicionar item à lista" };
      }
      
      return { ok: true };
    }
    // Retorna ok sem sincronização quando backend não disponível
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error.message || "Erro ao adicionar item à lista" };
  }
}

/* =========================
   ALIASES p/ compat com o front
   ========================= */

// getDetails -> details
export const getDetails = details;

// getTrending("day" | "week", page)
export async function getTrending(window: "day" | "week" = "day", page = 1): Promise<ApiBrowseResp> {
  if (await ensureBackendHealth()) {
    // Backend suporta parâmetro window para day/week
    return fetchJSON(`${API_BASE}/api/browse/trending?window=${window}&page=${page}&lang=${encodeURIComponent(LANG)}`, {}, 12000);
  }
  const path = `/trending/all/${window}`;
  const url = tmdbUrl(path, { page });
  return fetchJSON(url, tmdbHeaders(), 12000);
}

export async function getCategory(
  media: "movie" | "tv",
  cat: "popular" | "top_rated",
  page = 1
): Promise<ApiBrowseResp> {
  if (await ensureBackendHealth()) {
    return fetchJSON(
      `${API_BASE}/api/category/${media}/${cat}?page=${page}&lang=${encodeURIComponent(LANG)}`,
      {},
      12000
    );
  }
  const url = tmdbUrl(`/${media}/${cat}`, { page });
  return fetchJSON(url, tmdbHeaders(), 12000);
}

export interface DiscoverFilters {
  sortBy?: string;
  genres?: number[];
  year?: number;
  releaseDateFrom?: string;
  releaseDateTo?: string;
  airDateFrom?: string;
  airDateTo?: string;
  voteAverageGte?: number;
  voteCountGte?: number;
  watchProviders?: number[];
  watchMonetizationTypes?: string[];
  region?: string;
  runtimeGte?: number;
  runtimeLte?: number;
  withPoster?: boolean;
}

export async function discover(
  media: "movie" | "tv",
  filters: DiscoverFilters = {},
  page = 1,
  perPage?: number
): Promise<ApiBrowseResp> {
  if (await ensureBackendHealth()) {
    const params = new URLSearchParams();
    params.set("media", media);
    params.set("page", String(page));
    if (perPage) params.set("per_page", String(perPage));
    if (filters.sortBy) params.set("sortBy", filters.sortBy);
    if (filters.genres && filters.genres.length > 0) params.set("genres", filters.genres.join(","));
    if (filters.year) params.set("year", String(filters.year));
    if (filters.releaseDateFrom) params.set("releaseDateFrom", filters.releaseDateFrom);
    if (filters.releaseDateTo) params.set("releaseDateTo", filters.releaseDateTo);
    if (filters.airDateFrom) params.set("airDateFrom", filters.airDateFrom);
    if (filters.airDateTo) params.set("airDateTo", filters.airDateTo);
    if (filters.voteAverageGte) params.set("voteAverageGte", String(filters.voteAverageGte));
    if (filters.voteCountGte) params.set("voteCountGte", String(filters.voteCountGte));
    if (filters.watchProviders && filters.watchProviders.length > 0) params.set("watchProviders", filters.watchProviders.join(","));
    if (filters.watchMonetizationTypes && filters.watchMonetizationTypes.length > 0) params.set("watchMonetizationTypes", filters.watchMonetizationTypes.join(","));
    if (filters.region) params.set("region", filters.region);
    if (filters.runtimeGte) params.set("runtimeGte", String(filters.runtimeGte));
    if (filters.runtimeLte) params.set("runtimeLte", String(filters.runtimeLte));
    if (filters.withPoster !== undefined) params.set("withPoster", String(filters.withPoster));

    return fetchJSON(
      `${API_BASE}/api/browse/discover?${params.toString()}`,
      {},
      12000
    );
  }

  // Usa discover direto do TMDB quando backend não disponível
  const params: any = {
    page,
    language: LANG,
    region: filters.region || "BR",
    sort_by: filters.sortBy || "popularity.desc",
  };

  if (filters.genres && filters.genres.length > 0) {
    params.with_genres = filters.genres.join(",");
  }

  if (media === "movie") {
    if (filters.year) params.primary_release_year = filters.year;
    if (filters.releaseDateFrom) params["primary_release_date.gte"] = filters.releaseDateFrom;
    if (filters.releaseDateTo) params["primary_release_date.lte"] = filters.releaseDateTo;
  } else {
    if (filters.year) params.first_air_date_year = filters.year;
    if (filters.airDateFrom) params["first_air_date.gte"] = filters.airDateFrom;
    if (filters.airDateTo) params["first_air_date.lte"] = filters.airDateTo;
  }

  if (filters.voteAverageGte) params["vote_average.gte"] = filters.voteAverageGte;
  if (filters.voteCountGte) params["vote_count.gte"] = filters.voteCountGte;

  if (filters.watchProviders && filters.watchProviders.length > 0) {
    params.with_watch_providers = filters.watchProviders.join(",");
    params.watch_region = filters.region || "BR";
  }

  if (filters.watchMonetizationTypes && filters.watchMonetizationTypes.length > 0) {
    params.with_watch_monetization_types = filters.watchMonetizationTypes.join(",");
    params.watch_region = filters.region || "BR";
  }

  const url = tmdbUrl(`/discover/${media}`, params);
  return fetchJSON(url, tmdbHeaders(), 12000);
}

export interface Genre {
  id: number;
  name: string;
}

export async function getGenres(media: "movie" | "tv"): Promise<Genre[]> {
  if (await ensureBackendHealth()) {
    return fetchJSON(
      `${API_BASE}/api/browse/genres?media=${media}`,
      {},
      12000
    );
  }

  const url = tmdbUrl(`/genre/${media}/list`, { language: LANG });
  const data = await fetchJSON(url, tmdbHeaders(), 12000);
  return data.genres || [];
}

export interface WatchProvider {
  display_priority: number;
  logo_path: string;
  provider_id: number;
  provider_name: string;
}

export async function getWatchProviders(region = "BR"): Promise<WatchProvider[]> {
  if (await ensureBackendHealth()) {
    return fetchJSON(
      `${API_BASE}/api/browse/watch-providers?region=${region}`,
      {},
      12000
    );
  }

  const url = tmdbUrl("/watch/providers/movie", { watch_region: region });
  const data = await fetchJSON(url, tmdbHeaders(), 12000);
  return data.results || [];
}

const api = {
  health,
  browse,
  search,
  details,          // (media, id, lang?)
  personDetails,    // (id, lang?)
  shareCreate,
  shareGet,
  profileGet,
  profileUpdate,
  tmdbAuthStatus,
  
  // auth
  authSignup,
  authSignin,
  authVerify,
  reactivateAccount,
  reEnableAccount,
  resendVerificationEmail,

  getDetails,
  getTrending,
  getCategory,
  browsePopularWithFilter,
  discover,
  getGenres,
  getWatchProviders,
  
  searchPeople,
  
  getComments,
  createComment,
  likeComment,
  reactToComment,
  deleteComment,
  addListItem,
  removeListItem,
  
  forgotPassword,
  checkEmailExists,
  resetPassword,
};
export default api;
