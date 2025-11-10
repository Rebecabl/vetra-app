/**
 * Servidor principal da API VETRA
 * 
 * Configura Express, middlewares, rotas e inicializa serviços.
 * 
 * @module server
 */

import express from 'express';
import cors from 'cors';
import { initFirebase } from './src/config/firebase.config.js';
import { tmdbGet, tmdbLang, tmdbAuthInfo } from './src/services/tmdb.service.js';

// Importar rotas
import authRoutes from './src/routes/auth.js';
import upcomingRoutes from './src/routes/upcoming.js';
import detailsRoutes from './src/routes/details.js';
import searchRoutes from './src/routes/search.js';
import browseRoutes from './src/routes/browse.js';
import shareRoutes from './src/routes/share.js';
import favoritesRoutes from './src/routes/favorites.js';
import listsRoutes from './src/routes/lists.js';
import profileRoutes from './src/routes/profile.js';
import commentsRoutes from './src/routes/comments.js';

const app = express();

// CORS configurado para aceitar requisições do frontend
const corsOptions = {
  origin: (origin, callback) => {
    // Em desenvolvimento, permite qualquer localhost
    if (process.env.NODE_ENV !== 'production') {
      if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
    }
    // Em produção, verifica FRONT_ORIGIN
    const allowed = (process.env.FRONT_ORIGIN || "").split(",").map(s => s.trim()).filter(Boolean);
    if (allowed.length > 0) {
      return callback(null, allowed.includes(origin));
    }
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

const PORT = Number(process.env.API_PORT || process.env.PORT || 4001);

(async () => {
  try {
    initFirebase();
    console.log('[Firebase] Inicializado com sucesso');
  } catch (error) {
    console.warn('[Firebase] Configuração ausente:', error.message);
  }
})();

const SHARE_DB = new Map();


/**
 * Mapeia dados brutos do TMDB para formato padronizado
 * @param {string} media - 'movie' ou 'tv'
 * @param {Object} raw - Dados brutos do TMDB
 * @returns {Object} Dados mapeados
 */
function mapDetails(media, raw) {
  const title = media === 'movie' 
    ? (raw.title || raw.name || '') 
    : (raw.name || raw.title || '');
  const year = (raw.release_date || raw.first_air_date || '')?.slice(0, 4) || null;

  // Diretores
  const directors = [];
  if (raw.credits?.crew?.length) {
    raw.credits.crew.forEach((c) => {
      if (c.job === 'Director' || c.known_for_department === 'Directing') {
        directors.push(c.name);
      }
    });
  }

  // Runtime (apenas movie com precisão)
  const runtime = media === 'movie' 
    ? (Number.isFinite(raw.runtime) ? raw.runtime : null) 
    : null;

  // Elenco
  const cast = (raw.credits?.cast || []).slice(0, 24).map((c) => ({
    id: c.id,
    name: c.name,
    character: c.character,
    profile_path: c.profile_path || null,
  }));

  // Trailer
  let trailer_url = null;
  const vids = raw.videos?.results || [];
  const yt = vids.find((v) => 
    v.site === 'YouTube' && 
    /trailer/i.test(v.type || '') && 
    v.key
  );
  if (yt) {
    trailer_url = `https://www.youtube.com/watch?v=${yt.key}`;
  }

  // Recomendações
  const recommendations = (raw.recommendations?.results || []).map((r) => ({
    id: r.id,
    media: r.media_type || media,
    title: r.title || r.name || '',
    poster_path: r.poster_path || null,
    vote_average: r.vote_average ?? null,
    vote_count: r.vote_count ?? null,
    release_date: r.release_date || null,
    first_air_date: r.first_air_date || null,
    overview: r.overview || '',
  }));

  const genres = (raw.genres || []).map((g) => g.name);

  return {
    id: raw.id,
    media,
    title,
    year,
    runtime,
    rating: raw.vote_average ?? null,
    vote_count: raw.vote_count ?? null,
    overview: raw.overview || '',
    poster_path: raw.poster_path || null,
    backdrop_path: raw.backdrop_path || null,
    genres,
    cast,
    directors,
    trailer_url,
    recommendations,
  };
}

// ==================== ROTAS ====================

/**
 * GET /health
 * Endpoint de health check
 */
app.get('/health', (_req, res) => {
  res.json({ 
    ok: true, 
    lang: tmdbLang(), 
    auth: tmdbAuthInfo() 
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/upcoming', upcomingRoutes);
app.use('/api/details', detailsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/browse', browseRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/lists', listsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/comments', commentsRoutes);


app.get('/browse/:cat', async (req, res, next) => {
  try {
    const cat = String(req.params.cat);
    const page = Number(req.query.page || 1);

    let path = '';
    if (cat === 'trending') path = '/trending/all/day';
    else if (cat === 'popular') path = '/movie/popular';
    else if (cat === 'top_rated') path = '/movie/top_rated';
    else if (cat === 'now_playing') path = '/movie/now_playing';
    else if (cat === 'upcoming') path = '/movie/upcoming';
    else {
      return res.status(400).json({ ok: false, error: 'categoria_inválida' });
    }

    const data = await tmdbGet(path, { page });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

app.get('/search', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const page = Number(req.query.page || 1);
    const lang = String(req.query.lang || tmdbLang());
    
    if (!q) {
      return res.json({ 
        page: 1, 
        results: [], 
        total_pages: 1, 
        total_results: 0 
      });
    }
    
    const data = await tmdbGet('/search/multi', { 
      query: q, 
      include_adult: false, 
      page,
      language: lang
    });
    
    let results = Array.isArray(data.results) ? data.results : [];
    
    // Filtro por ano
    const year = req.query.year ? Number(req.query.year) : null;
    if (year && !isNaN(year)) {
      results = results.filter((item) => {
        const itemYear = item.release_date || item.first_air_date;
        if (!itemYear) return false;
        const yearStr = String(itemYear).slice(0, 4);
        return yearStr === String(year);
      });
    }
    
    // Filtro por nota mínima
    const minRating = req.query.min_rating ? Number(req.query.min_rating) : null;
    if (minRating && !isNaN(minRating)) {
      results = results.filter((item) => {
        return item.vote_average != null && Number(item.vote_average) >= minRating;
      });
    }
    
    res.json({ 
      page: data.page || page,
      total_pages: data.total_pages || 1,
      total_results: data.total_results || results.length,
      results: results
    });
  } catch (error) {
    console.error('Search error:', error);
    next(error);
  }
});

app.get('/details/:media/:id', async (req, res, next) => {
  try {
    const media = String(req.params.media);
    const id = Number(req.params.id);
    
    if (!['movie', 'tv'].includes(media)) {
      return res.status(400).json({ ok: false, error: 'media_inválida' });
    }
    if (!id) {
      return res.status(400).json({ ok: false, error: 'id_inválido' });
    }

    const raw = await tmdbGet(`/${media}/${id}`, {
      append_to_response: 'credits,videos,recommendations',
    });
    res.json(mapDetails(media, raw));
  } catch (error) {
    next(error);
  }
});

app.get('/person/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ ok: false, error: 'id_inválido' });
    }
    
    const lang = String(req.query.lang || tmdbLang());
    const data = await tmdbGet(`/person/${id}`, {
      append_to_response: 'combined_credits',
      language: lang,
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /people/popular?page=1
 * Retorna pessoas populares
 */
app.get('/people/popular', async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const lang = String(req.query.lang || tmdbLang());
    const data = await tmdbGet('/person/popular', { page, language: lang });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

app.post('/share', (req, res, next) => {
  try {
    const { items, type = 'favorites', listName = null } = req.body || {};
    
    if (!Array.isArray(items)) {
      return res.status(400).json({ ok: false, error: 'items_deve_ser_array' });
    }
    if (items.length === 0) {
      return res.status(400).json({ ok: false, error: 'lista_vazia' });
    }
    
    const slug = Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15);
    
    SHARE_DB.set(slug, { 
      items, 
      type: type || 'favorites',
      listName: listName || null,
      created_at: Date.now() 
    });
    
    const base = process.env.SHARE_BASE_URL || 
                 process.env.SHARE_BASE || 
                 'http://localhost:5173';
    const url = `${base}/share/${slug}`;
    
    res.json({ ok: true, id: slug, slug, url, type });
  } catch (error) {
    next(error);
  }
});

app.get('/share/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    const data = SHARE_DB.get(slug);
    
    if (!data) {
      return res.status(404).json({ ok: false, error: 'não_encontrado' });
    }
    
    res.json({ ok: true, id: slug, ...data });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'erro_interno' });
  }
});

app.use((err, _req, res, _next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ 
    ok: false, 
    error: 'erro_interno',
    message: err.message 
  });
});


app.listen(PORT, () => {
  console.log(`[API] Servidor iniciado em http://localhost:${PORT}`);
  console.log(`[API] Health check disponível em http://localhost:${PORT}/health`);
});
