import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";

import { initFirebase } from "./src/config/firebase.config.js";

import profileRouter from "./src/routes/profile.js";
import listsRouter from "./src/routes/lists.js";
import browseRouter from "./src/routes/browse.js";
import categoryRouter from "./src/routes/category.js";
import shareRouter from "./src/routes/share.js";
import favoritesRouter from "./src/routes/favorites.js";
import detailsRouter from "./src/routes/details.js";
import authRouter from "./src/routes/auth.js";
import peopleRouter from "./src/routes/people.js";
import commentsRouter from "./src/routes/comments.js";
import upcomingRouter from "./src/routes/upcoming.js";
import { searchHandler } from "./src/routes/movies.js";

try {
  const hasServiceJson = !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const hasTriplet = !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
  
  if (hasServiceJson || hasTriplet) {
    const result = initFirebase();
    if (result) {
      console.log("[api/index] Firebase inicializado com sucesso");
    } else {
      console.warn("[api/index] Firebase não inicializado (mas servidor continuará funcionando)");
    }
  } else {
    console.log("[api/index] Credenciais Firebase não encontradas — pulando init (ok em dev)");
  }
} catch (error) {
  console.error("[api/index] Erro ao inicializar Firebase:", error?.message || error);
  if (process.env.NODE_ENV === 'production') {
    console.warn("[api/index] Firebase não inicializado em produção. Algumas funcionalidades não estarão disponíveis.");
  }
}

const app = express();

const allowed = (process.env.FRONT_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Em desenvolvimento, permite localhost em qualquer porta
const corsOptions = {
  origin: (origin, callback) => {
    // Se FRONT_ORIGIN estiver definido, usa ele
    if (allowed.length > 0) {
      return callback(null, allowed.includes(origin));
    }
    // Em desenvolvimento, permite qualquer localhost
    if (process.env.NODE_ENV !== 'production') {
      if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
    }
    // Em produção, permite todas as origens se não especificado
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
};

// CORS PRIMEIRO - antes de qualquer rota
app.use(cors(corsOptions));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check (agora com CORS aplicado)
app.get("/health", (_req, res) => {
  console.log("[health] Requisição recebida em /health");
  res.json({
    ok: true,
    status: "ok",
    tmdb: !!(process.env.TMDB_V3_API_KEY || process.env.TMDB_API_KEY || process.env.TMDB_API || process.env.TMDB_V4_TOKEN || process.env.TMDB_TOKEN),
    firebase: !!(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY)),
    env: process.env.NODE_ENV || "development",
    ts: new Date().toISOString(),
  });
});

app.get("/api/health", (_req, res) => {
  console.log("[health] Requisição recebida em /api/health");
  res.json({
    ok: true,
    status: "ok",
    tmdb: !!(process.env.TMDB_V3_API_KEY || process.env.TMDB_API_KEY || process.env.TMDB_API || process.env.TMDB_V4_TOKEN || process.env.TMDB_TOKEN),
    firebase: !!(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY)),
    env: process.env.NODE_ENV || "development",
    ts: new Date().toISOString(),
  });
});

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    message: "VETRA API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      apiHealth: "/api/health",
      docs: "https://github.com/Rebecabl/vetra-app"
    }
  });
});

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(compression());
app.use(express.json({ limit: "1mb" }));

app.get("/api/search", searchHandler);
app.use("/api/details", detailsRouter);
app.use("/api/profile", profileRouter);
app.use("/api/auth", authRouter);
app.use("/api/browse", browseRouter);
app.use("/api/category", categoryRouter);
app.use("/api/people", peopleRouter);
app.use("/api/comments", commentsRouter);
app.use("/api/upcoming", upcomingRouter);
app.use("/api/share", shareRouter);  // Registrar shareRouter com caminho específico ANTES de listsRouter
app.use("/api", listsRouter);
app.use("/api", favoritesRouter);

app.use((req, res) => {
  res.status(404).json({ ok: false, error: "Not Found" });
});

app.use((err, req, res, _next) => {
  console.error("[API ERROR]", err);
  res.status(500).json({ ok: false, error: String(err?.message || err) });
});

export default app;
