// Módulo interno (no es una ruta pública de Vercel: empieza con "_").
// Maneja el intercambio/renovación del token OAuth2 de EGW Writings y lo
// persiste en Firestore vía el SDK admin (bypassa las reglas de seguridad
// del cliente), para sobrevivir a los "cold starts" de la función
// serverless sin que el admin tenga que volver a autorizar la app cada vez.
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const EGW_TOKEN_URL = 'https://cpanel.egwwritings.org/o/token/';
const TOKEN_DOC_PATH = ['_serverTokens', 'egwWritings'];

function getAdminApp() {
  if (getApps().length) return getApps()[0];
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}

function tokenDocRef() {
  const db = getFirestore(getAdminApp());
  return db.collection(TOKEN_DOC_PATH[0]).doc(TOKEN_DOC_PATH[1]);
}

async function saveTokens({ access_token, refresh_token, expires_in }) {
  const doc = {
    accessToken: access_token,
    // Renovamos 60s antes de que expire de verdad, para no fallar por poco.
    expiresAt: Date.now() + (Number(expires_in) - 60) * 1000,
  };
  // Firestore rechaza "undefined" — si el proveedor no devolvió refresh_token
  // en esta respuesta, no tocamos el campo (set con merge conserva el que ya
  // hubiera, si es que hay uno guardado de antes).
  if (refresh_token) doc.refreshToken = refresh_token;
  await tokenDocRef().set(doc, { merge: true });
}

async function requestToken(params) {
  const res = await fetch(EGW_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.EGW_CLIENT_ID,
      client_secret: process.env.EGW_CLIENT_SECRET,
      ...params,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`EGW Writings token endpoint respondió ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

export async function handleAuthCallback(code) {
  const tokens = await requestToken({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.EGW_REDIRECT_URI,
  });
  // Diagnóstico temporal: solo los NOMBRES de campo (nunca los valores) para
  // confirmar si EGW Writings realmente no manda refresh_token en este grant.
  console.log('EGW token response fields:', Object.keys(tokens));
  await saveTokens(tokens);
  return tokens;
}

export async function getValidAccessToken() {
  const snap = await tokenDocRef().get();
  if (!snap.exists) {
    throw new Error('EGW Writings todavía no está autorizado. Visita /api/egw-authorize para conectar la cuenta.');
  }
  const data = snap.data();
  if (Date.now() < data.expiresAt) {
    return data.accessToken;
  }
  if (!data.refreshToken) {
    throw new Error('El token de EGW Writings expiró y no hay refresh token guardado. Visita /api/egw-authorize para volver a autorizar.');
  }
  const refreshed = await requestToken({
    grant_type: 'refresh_token',
    refresh_token: data.refreshToken,
  });
  await saveTokens({
    access_token: refreshed.access_token,
    // Algunos proveedores no devuelven un refresh_token nuevo; si no viene, reusamos el actual.
    refresh_token: refreshed.refresh_token || data.refreshToken,
    expires_in: refreshed.expires_in,
  });
  return refreshed.access_token;
}
