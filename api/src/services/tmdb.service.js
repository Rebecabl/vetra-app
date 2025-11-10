import fetch from "node-fetch";
const V3_KEY = process.env.TMDB_V3_API_KEY || process.env.TMDB_API_KEY || process.env.TMDB_API || null;
const V4_BEARER = process.env.TMDB_V4_TOKEN || process.env.TMDB_TOKEN || null;
const API_BASE = "https://api.themoviedb.org/3";
const DEFAULT_LANG = process.env.TMDB_LANG || "pt-BR";

function buildUrl(path, params = {}) {
  const url = new URL(API_BASE + path);
  
  if (V3_KEY) {
    url.searchParams.set("api_key", V3_KEY);
  }
  
  if (!params.language) {
    url.searchParams.set("language", DEFAULT_LANG);
  }
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  
  return url.toString();
}

async function tmdbFetch(path, params = {}, retries = 3) {
  if (!V3_KEY && !V4_BEARER) {
    throw new Error("TMDB_V3_API_KEY ou TMDB_TOKEN não configurados");
  }

  const url = buildUrl(path, params);
  const headers = V4_BEARER && !V3_KEY 
    ? { Authorization: `Bearer ${V4_BEARER}` } 
    : {};

  try {
    const response = await fetch(url, { 
      headers,
      timeout: 15000,
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `TMDB API Error ${response.status} ${response.statusText}: ${errorText}`
      );
    }
    
    return response.json();
  } catch (error) {
    // Retry apenas para erros de conectividade
    const isRetryableError = 
      error.code === 'ENOTFOUND' || 
      error.code === 'ETIMEDOUT' || 
      error.code === 'ECONNREFUSED' ||
      error.message?.includes('getaddrinfo') ||
      error.message?.includes('ENOTFOUND') ||
      error.type === 'system';
    
    if (retries > 0 && isRetryableError) {
      const delay = 1000 * (4 - retries);
      console.warn(`[tmdbFetch] Erro de conectividade (${error.code || error.type || 'unknown'}), tentando novamente em ${delay}ms... (${retries} tentativas restantes)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return tmdbFetch(path, params, retries - 1);
    }
    
    console.error(`[tmdbFetch] Erro ao acessar ${url}:`, {
      code: error.code,
      type: error.type,
      message: error.message,
    });
    throw error;
  }
}

export function normalizeMovie(item) {
  const media = item.media_type === "tv" || item.first_air_date ? "tv" : "movie";
  const release = item.release_date || item.first_air_date || null;
  const year = release ? release.slice(0, 4) : null;

  return {
    id: item.id,
    media,
    title: item.title || item.name || "",
    overview: item.overview || "",
    poster_path: item.poster_path || null,
    backdrop_path: item.backdrop_path || null,
    vote_average: item.vote_average ?? null,
    vote_count: item.vote_count ?? null,
    release_date: release,
    year,
    genres: Array.isArray(item.genres) 
      ? item.genres.map(g => g.name || g).filter(Boolean)
      : [],
  };
}

export async function searchMulti(query, options = {}) {
  const q = String(query || "").trim();
  if (!q) {
    return { results: [], page: 1, total_pages: 0, total_results: 0 };
  }

  const params = {
    query: q,
    include_adult: "false",
    language: DEFAULT_LANG,
    ...options,
  };

  return tmdbFetch("/search/multi", params);
}

export async function getDetails(media, id) {
  if (!["movie", "tv"].includes(media)) {
    throw new Error(`Tipo de mídia inválido: ${media}`);
  }

  const path = `/${media}/${encodeURIComponent(id)}`;
  const data = await tmdbFetch(path, {
    append_to_response: "credits,videos,recommendations,watch/providers,keywords,external_ids,release_dates,content_ratings,images",
  });

  const release = data.release_date || data.first_air_date || null;
  const year = release ? release.slice(0, 4) : null;

  let trailer_url = null;
  const videos = data.videos?.results || [];
  const officialTrailer = videos.find(
    (v) =>
      v.site === "YouTube" &&
      (v.type === "Trailer" || v.type === "Teaser") &&
      v.official
  );
  const anyTrailer = videos.find(
    (v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
  );
  
  if (officialTrailer?.key || anyTrailer?.key) {
    trailer_url = `https://www.youtube.com/watch?v=${officialTrailer?.key || anyTrailer.key}`;
  }

  const cast = (data.credits?.cast || []).map((person) => ({
    id: person.id,
    name: person.name,
    character: person.character || null,
    profile_path: person.profile_path || null,
    order: person.order || null,
  }));

  let directors = [];
  const crew = data.credits?.crew || [];
  const isTv = media === "tv";
  
  if (!isTv) {
    directors = crew
      .filter((p) => p.job === "Director")
      .map((p) => p.name)
      .slice(0, 3);
  } else if (Array.isArray(data.created_by) && data.created_by.length) {
    directors = data.created_by.map((p) => p.name).slice(0, 3);
  }

  const writers = crew
    .filter((p) => p.job === "Writer" || p.job === "Screenplay" || p.job === "Story")
    .map((p) => ({ name: p.name, job: p.job }))
    .slice(0, 5);
  
  const producers = crew
    .filter((p) => p.job === "Producer" || p.job === "Executive Producer")
    .map((p) => ({ name: p.name, job: p.job }))
    .slice(0, 5);
  
  const cinematographers = crew
    .filter((p) => p.job === "Director of Photography" || p.job === "Cinematography")
    .map((p) => p.name)
    .slice(0, 3);
  
  const composers = crew
    .filter((p) => p.job === "Original Music Composer" || p.job === "Music")
    .map((p) => p.name)
    .slice(0, 3);
  
  const editors = crew
    .filter((p) => p.job === "Editor")
    .map((p) => p.name)
    .slice(0, 3);

  const keywords = Array.isArray(data.keywords?.keywords) 
    ? data.keywords.keywords.map((k) => k.name).slice(0, 10)
    : Array.isArray(data.keywords?.results)
    ? data.keywords.results.map((k) => k.name).slice(0, 10)
    : [];

  const belongs_to_collection = data.belongs_to_collection ? {
    id: data.belongs_to_collection.id,
    name: data.belongs_to_collection.name,
    poster_path: data.belongs_to_collection.poster_path,
    backdrop_path: data.belongs_to_collection.backdrop_path,
  } : null;

  let certification = null;
  if (!isTv && data.release_dates?.results) {
    const brRelease = data.release_dates.results.find((r) => r.iso_3166_1 === "BR");
    if (brRelease?.release_dates?.[0]?.certification) {
      certification = brRelease.release_dates[0].certification;
    }
  } else if (isTv && data.content_ratings?.results) {
    const brRating = data.content_ratings.results.find((r) => r.iso_3166_1 === "BR");
    if (brRating?.rating) {
      certification = brRating.rating;
    }
  }

  const numberOfSeasons = isTv ? data.number_of_seasons : null;
  const numberOfEpisodes = isTv ? data.number_of_episodes : null;
  const lastAirDate = isTv ? data.last_air_date : null;
  const nextEpisodeToAir = isTv ? data.next_episode_to_air : null;
  const networks = isTv && Array.isArray(data.networks)
    ? data.networks.map((n) => ({
        id: n.id,
        name: n.name,
        logo_path: n.logo_path || null,
      }))
    : [];

  const external_ids = data.external_ids || {};

  const images = {
    backdrops: Array.isArray(data.images?.backdrops) 
      ? data.images.backdrops.slice(0, 20).map((img) => ({
          file_path: img.file_path,
          width: img.width,
          height: img.height,
          aspect_ratio: img.aspect_ratio,
        }))
      : [],
    posters: Array.isArray(data.images?.posters)
      ? data.images.posters.slice(0, 20).map((img) => ({
          file_path: img.file_path,
          width: img.width,
          height: img.height,
          aspect_ratio: img.aspect_ratio,
        }))
      : [],
  };

  const allVideos = (data.videos?.results || []).map((v) => ({
    id: v.id,
    key: v.key,
    name: v.name,
    site: v.site,
    type: v.type,
    official: v.official || false,
    published_at: v.published_at || null,
  }));

  let seasons = null;
  if (isTv && Array.isArray(data.seasons)) {
    seasons = data.seasons.map((s) => ({
      id: s.id,
      name: s.name,
      overview: s.overview || null,
      poster_path: s.poster_path || null,
      season_number: s.season_number,
      air_date: s.air_date || null,
      episode_count: s.episode_count || 0,
    }));
  }

  const recommendations = (data.recommendations?.results || [])
    .map(normalizeMovie)
    .slice(0, 20);

  const genres = Array.isArray(data.genres)
    ? data.genres.map((g) => g.name).filter(Boolean)
    : [];

  const runtime = isTv
    ? Array.isArray(data.episode_run_time) && data.episode_run_time[0]
      ? Number(data.episode_run_time[0])
      : null
    : Number.isFinite(data.runtime)
    ? data.runtime
    : null;

  return {
    id: data.id,
    media: isTv ? "tv" : "movie",
    title: data.title || data.name || "",
    overview: data.overview || "",
    poster_path: data.poster_path || null,
    backdrop_path: data.backdrop_path || null,
    vote_average: data.vote_average ?? null,
    vote_count: data.vote_count ?? null,
    release_date: release,
    year,
    genres,
    runtime,
    cast,
    directors,
    trailer_url,
    recommendations,
    original_title: data.original_title || data.original_name || null,
    status: data.status || null,
    budget: data.budget || null,
    revenue: data.revenue || null,
    production_companies: Array.isArray(data.production_companies)
      ? data.production_companies.map((c) => ({
          id: c.id,
          name: c.name,
          logo_path: c.logo_path || null,
        }))
      : [],
    production_countries: Array.isArray(data.production_countries)
      ? data.production_countries.map((c) => c.name || c.iso_3166_1).filter(Boolean)
      : [],
    spoken_languages: Array.isArray(data.spoken_languages)
      ? data.spoken_languages.map((l) => l.name || l.iso_639_1).filter(Boolean)
      : [],
    tagline: data.tagline || null,
    homepage: data.homepage || null,
    imdb_id: data.imdb_id || null,
    watch_providers: processWatchProviders(data["watch/providers"]),
    // Novos campos adicionados
    writers,
    producers,
    cinematographers,
    composers,
    editors,
    keywords,
    belongs_to_collection,
    certification,
    numberOfSeasons,
    numberOfEpisodes,
    lastAirDate,
    nextEpisodeToAir,
    networks,
    external_ids: {
      imdb_id: external_ids.imdb_id || null,
      facebook_id: external_ids.facebook_id || null,
      instagram_id: external_ids.instagram_id || null,
      twitter_id: external_ids.twitter_id || null,
      wikidata_id: external_ids.wikidata_id || null,
    },
    images,
    allVideos,
    seasons,
  };
}

function processWatchProviders(providers) {
  if (!providers || !providers.results) {
    return { flatrate: [], rent: [], buy: [], free: [] };
  }

  const br = providers.results.BR || {};
  return {
    flatrate: (br.flatrate || []).map((p) => ({
      id: p.provider_id,
      name: p.provider_name,
      logo_path: p.logo_path,
    })),
    rent: (br.rent || []).map((p) => ({
      id: p.provider_id,
      name: p.provider_name,
      logo_path: p.logo_path,
    })),
    buy: (br.buy || []).map((p) => ({
      id: p.provider_id,
      name: p.provider_name,
      logo_path: p.logo_path,
    })),
    free: (br.free || []).map((p) => ({
      id: p.provider_id,
      name: p.provider_name,
      logo_path: p.logo_path,
    })),
  };
}

export async function getTrending(window = "day", page = 1) {
  const path = `/trending/all/${window}`;
  const data = await tmdbFetch(path, { page });
  return {
    results: (data.results || []).map(normalizeMovie),
    page: data.page || page,
    total_pages: data.total_pages || 1,
    total_results: data.total_results || 0,
  };
}

export async function getPopularWithFilter(filter, page = 1, region = "BR") {
  try {
    let path = "";
    const params = {
      page,
      language: DEFAULT_LANG,
      region: region,
      sort_by: "popularity.desc",
    };

    switch (filter) {
      case "streaming":
        // Filmes disponíveis em streaming (flatrate) no Brasil
        path = "/discover/movie";
        params.with_watch_monetization_types = "flatrate";
        params.watch_region = region;
        break;
      
      case "rent":
        // Filmes disponíveis para alugar
        path = "/discover/movie";
        params.with_watch_monetization_types = "rent";
        params.watch_region = region;
        break;
      
      case "cinema":
        // Filmes em cartaz nos cinemas
        path = "/movie/now_playing";
        // Remover parâmetros desnecessários para now_playing
        delete params.sort_by;
        break;
      
      case "tv":
        // Séries populares na TV
        path = "/tv/popular";
        // Remover parâmetros desnecessários para tv/popular
        delete params.sort_by;
        delete params.region;
        break;
      
      default:
        path = "/movie/popular";
        delete params.sort_by;
    }

    const data = await tmdbFetch(path, params);
    
    return {
      results: (data.results || []).map(normalizeMovie),
      page: data.page || page,
      total_pages: data.total_pages || 1,
      total_results: data.total_results || 0,
    };
  } catch (error) {
    console.error(`[getPopularWithFilter] Erro ao buscar ${filter}:`, error);
    throw error;
  }
}

export async function getByCategory(media, category, page = 1) {
  const validMedia = ["movie", "tv"];
  const validCategories = {
    movie: ["popular", "top_rated", "now_playing", "upcoming"],
    tv: ["popular", "top_rated", "on_the_air", "airing_today"],
  };

  if (!validMedia.includes(media)) {
    throw new Error(`Mídia inválida: ${media}`);
  }
  if (!validCategories[media].includes(category)) {
    throw new Error(`Categoria inválida para ${media}: ${category}`);
  }

  const data = await tmdbFetch(`/${media}/${category}`, { page });
  return {
    results: (data.results || []).map(normalizeMovie),
    page: data.page || page,
    total_pages: data.total_pages || 1,
    total_results: data.total_results || 0,
  };
}

export async function discover(media, filters = {}, page = 1) {
  if (!["movie", "tv"].includes(media)) {
    throw new Error(`Mídia inválida: ${media}`);
  }

  const params = {
    page,
    language: DEFAULT_LANG,
    region: filters.region || "BR",
    sort_by: filters.sortBy || "popularity.desc",
  };

  if (filters.genres && filters.genres.length > 0) {
    params.with_genres = Array.isArray(filters.genres) 
      ? filters.genres.join(",") 
      : String(filters.genres);
  }

  if (media === "movie") {
    if (filters.releaseDateFrom) {
      params["primary_release_date.gte"] = filters.releaseDateFrom;
    }
    if (filters.releaseDateTo) {
      params["primary_release_date.lte"] = filters.releaseDateTo;
    }
    if (filters.year) {
      params.primary_release_year = filters.year;
    }
  } else {
    if (filters.airDateFrom) {
      params["first_air_date.gte"] = filters.airDateFrom;
    }
    if (filters.airDateTo) {
      params["first_air_date.lte"] = filters.airDateTo;
    }
    if (filters.year) {
      params.first_air_date_year = filters.year;
    }
  }

  if (filters.voteAverageGte) {
    params["vote_average.gte"] = filters.voteAverageGte;
  }
  if (filters.voteCountGte) {
    params["vote_count.gte"] = filters.voteCountGte;
  }

  if (filters.watchProviders && filters.watchProviders.length > 0) {
    params.with_watch_providers = Array.isArray(filters.watchProviders)
      ? filters.watchProviders.join(",")
      : String(filters.watchProviders);
    params.watch_region = filters.region || "BR";
  }

  if (filters.watchMonetizationTypes && filters.watchMonetizationTypes.length > 0) {
    params.with_watch_monetization_types = Array.isArray(filters.watchMonetizationTypes)
      ? filters.watchMonetizationTypes.join(",")
      : String(filters.watchMonetizationTypes);
    params.watch_region = filters.region || "BR";
  }

  if (media === "movie") {
    if (filters.runtimeGte) {
      params["with_runtime.gte"] = filters.runtimeGte;
    }
    if (filters.runtimeLte) {
      params["with_runtime.lte"] = filters.runtimeLte;
    }
  }

  const path = `/discover/${media}`;
  const data = await tmdbFetch(path, params);
  
  return {
    results: (data.results || []).map(normalizeMovie),
    page: data.page || page,
    total_pages: data.total_pages || 1,
    total_results: data.total_results || 0,
  };
}

export async function getGenres(media) {
  if (!["movie", "tv"].includes(media)) {
    throw new Error(`Mídia inválida: ${media}`);
  }

  const data = await tmdbFetch(`/genre/${media}/list`);
  return data.genres || [];
}

export async function getWatchProviders(region = "BR") {
  const data = await tmdbFetch("/watch/providers/movie", { watch_region: region });
  return data.results || [];
}

export async function getPopularPeople(page = 1, lang = "pt-BR") {
  const data = await tmdbFetch("/person/popular", { page, language: lang });
  return {
    results: data.results || [],
    page: data.page || page,
    total_pages: data.total_pages || 1,
    total_results: data.total_results || 0,
  };
}

export async function searchPerson(query, page = 1, lang = "pt-BR") {
  const q = String(query || "").trim();
  if (!q) {
    return { results: [], page: 1, total_pages: 0, total_results: 0 };
  }

  const params = {
    query: q,
    include_adult: "false",
    language: lang,
    page: page,
  };

  return tmdbFetch("/search/person", params);
}

export async function getPersonDetails(id, lang = "pt-BR") {
  const data = await tmdbFetch(`/person/${encodeURIComponent(id)}`, {
    append_to_response: "combined_credits,images,external_ids",
    language: lang,
  });

  // Normalizar créditos combinados
  const cast = (data.combined_credits?.cast || []).map((credit) => ({
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

  const crew = (data.combined_credits?.crew || []).map((credit) => ({
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
    id: Number(data.id),
    name: data.name || "",
    biography: data.biography || null,
    profile_path: data.profile_path || null,
    known_for_department: data.known_for_department || null,
    birthday: data.birthday || null,
    place_of_birth: data.place_of_birth || null,
    deathday: data.deathday || null,
    gender: data.gender || null,
    popularity: data.popularity || null,
    imdb_id: data.external_ids?.imdb_id || null,
    combined_credits: {
      cast,
      crew,
    },
    images: {
      profiles: (data.images?.profiles || []).map((img) => ({
        file_path: img.file_path,
        width: img.width,
        height: img.height,
        aspect_ratio: img.aspect_ratio,
      })),
    },
  };
}
