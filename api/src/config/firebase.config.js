import admin from "firebase-admin";

let appInitialized = false;
let cachedDb = null;
let cachedAuth = null;

export function initFirebase() {
  if (appInitialized) {
    return admin.app();
  }

  const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL } = process.env;
  let { FIREBASE_PRIVATE_KEY } = process.env;

  // Prioriza JSON completo (melhor para produção)
  if (svcJson && svcJson.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(svcJson);
      admin.initializeApp({
        credential: admin.credential.cert(parsed),
        projectId: parsed.project_id || FIREBASE_PROJECT_ID,
      });
      appInitialized = true;
      return admin.app();
    } catch (error) {
      console.warn("[Firebase] Erro ao parsear FIREBASE_SERVICE_ACCOUNT_JSON:", error.message);
    }
  }

  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    // Normaliza private key (remove aspas e converte \n)
    FIREBASE_PRIVATE_KEY = FIREBASE_PRIVATE_KEY
      .replace(/^"(.*)"$/s, "$1")
      .replace(/\\n/g, "\n");

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY,
      }),
      projectId: FIREBASE_PROJECT_ID,
    });

    appInitialized = true;
    return admin.app();
  }

  // Fallback: credenciais padrão do GCP
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    appInitialized = true;
    return admin.app();
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn("[Firebase] Firebase não configurado. Algumas funcionalidades não estarão disponíveis.");
      console.warn("[Firebase] Configure FIREBASE_SERVICE_ACCOUNT_JSON ou FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY");
      return null;
    }
    throw new Error(
      "Firebase não configurado. Configure FIREBASE_SERVICE_ACCOUNT_JSON ou " +
      "FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY"
    );
  }
}

export function getAuth() {
  if (!appInitialized) {
    try {
      initFirebase();
    } catch (error) {
      console.error("[getAuth] Erro ao inicializar Firebase:", error.message);
      throw new Error("Firebase não está configurado. Configure as credenciais no .env");
    }
  }
  if (!cachedAuth) {
    try {
      cachedAuth = admin.auth();
    } catch (error) {
      console.error("[getAuth] Erro ao obter instância do Auth:", error.message);
      throw error;
    }
  }
  return cachedAuth;
}

export function getFirestore() {
  if (!appInitialized) {
    try {
      initFirebase();
    } catch (error) {
      console.error("[getFirestore] Erro ao inicializar Firebase:", error.message);
      throw new Error("Firebase não está configurado. Configure as credenciais no .env");
    }
  }
  if (!cachedDb) {
    try {
      cachedDb = admin.firestore();
    } catch (error) {
      console.error("[getFirestore] Erro ao obter instância do Firestore:", error.message);
      throw error;
    }
  }
  return cachedDb;
}

export function isInitialized() {
  return appInitialized;
}

