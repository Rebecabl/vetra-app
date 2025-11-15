import 'dotenv/config';
import { execSync } from 'child_process';
import { platform } from 'os';

// Função para encerrar processo na porta 4001 (Windows)
function killProcessOnPort(port) {
  if (platform() !== 'win32') return;
  
  try {
    const result = execSync(`netstat -ano | findstr ":${port}" | findstr "LISTENING"`, { encoding: 'utf-8' });
    const lines = result.trim().split('\n').filter(Boolean);
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && !isNaN(pid)) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
          console.log(`[start-server] Processo anterior encerrado (PID: ${pid})`);
        } catch (e) {
          // Ignora erros ao encerrar processo
        }
      }
    }
    
    // Aguarda um pouco para a porta ser liberada (síncrono)
    if (lines.length > 0) {
      const start = Date.now();
      while (Date.now() - start < 1000) {
        // Espera 1 segundo
      }
    }
  } catch (e) {
    // Nenhum processo encontrado, continua normalmente
  }
}

const port = Number(process.env.API_PORT || process.env.PORT || 4001);

// Encerra processos anteriores na porta antes de iniciar
killProcessOnPort(port);

let firebaseReady = false;
try {
  const hasServiceJson = !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const hasTriplet = !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);

  if (hasServiceJson || hasTriplet) {
    const { initFirebase } = await import('./src/config/firebase.config.js');
    const result = initFirebase();
    if (result) {
      firebaseReady = true;
      console.log('[firebase] Admin inicializado.');
    } else {
      console.warn('[firebase] Firebase não inicializado (mas servidor continuará funcionando).');
    }
  } else {
    console.log('[firebase] Credenciais não encontradas — pulando init (ok em dev).');
  }
} catch (e) {
  console.error('[firebase] Falha ao inicializar:', e?.message || e);
  console.warn('[firebase] Servidor continuará funcionando, mas autenticação não estará disponível.');
}

let app;
try {
  const mod = await import('./index.js');
  app = mod.default || mod.app || mod;
  if (typeof app !== 'function' || !app.use) {
    throw new Error('index.js não exporta um Express app válido (export default app).');
  }
} catch (e) {
  console.error('[api] Falha ao importar ./index.js:', e?.message || e);
  process.exit(1);
}

const host = process.env.API_HOST || '127.0.0.1';

const hasBearer = !!(process.env.TMDB_BEARER || process.env.TMDB_TOKEN);
const hasV3 = !!(process.env.TMDB_V3 || process.env.TMDB_API_KEY);
const lang = process.env.TMDB_LANG || 'pt-BR';
const shareBase = process.env.SHARE_BASE || 'http://localhost:5173';

// Adicionar tratamento de erros não capturados
process.on('uncaughtException', (err) => {
  console.error('\n[FATAL] Erro não capturado:', err);
  console.error('Stack:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n[FATAL] Promise rejeitada não tratada:', reason);
  console.error('Promise:', promise);
});

const server = app.listen(port, host, () => {
  console.log(`\nVETRA API — ouvindo em http://${host}:${port}`);
  console.log(`   Health:            http://${host}:${port}/api/health`);
  console.log(`   Health (alt):      http://localhost:${port}/api/health`);
  console.log(`   TMDB v4 Bearer?    ${hasBearer ? 'SIM' : 'NÃO'}`);
  console.log(`   TMDB v3 Key?       ${hasV3 ? 'SIM' : 'NÃO'}`);
  console.log(`   TMDB Lang:         ${lang}`);
  console.log(`   Share Base:        ${shareBase}`);
  console.log(`   Firebase Admin:    ${firebaseReady ? 'OK' : '— (não inicializado)'}`);
  console.log(`\n   Servidor PRONTO para receber requisições!\n`);
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`\n[api] Erro: Porta ${port} já está em uso após tentativa de encerrar processos.`);
    console.error('Tente encerrar manualmente:');
    console.error(`  > netstat -ano | findstr :${port}`);
    console.error('  (anote o PID) e depois:');
    console.error('  > taskkill /PID <PID> /F\n');
  } else {
    console.error('[api] Erro no servidor:', err?.message || err);
  }
  process.exit(1);
});
