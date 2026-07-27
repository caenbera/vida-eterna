// Módulo interno (no es una ruta pública de Vercel: empieza con "_").
// Obtiene y cachea el token OAuth2 de EGW Writings vía el grant
// "client_credentials" (servidor-a-servidor, sin login ni redirect_uri):
// solo hace falta EGW_CLIENT_ID/EGW_CLIENT_SECRET. Se persiste en
// Firestore vía el SDK admin (bypassa las reglas de seguridad del
// cliente) para sobrevivir a los "cold starts" de la función serverless.
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

async function requestClientCredentialsToken() {
  const res = await fetch(EGW_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.EGW_CLIENT_ID,
      client_secret: process.env.EGW_CLIENT_SECRET,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`EGW Writings token endpoint respondió ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

export async function getValidAccessToken() {
  const ref = tokenDocRef();
  const snap = await ref.get();
  if (snap.exists) {
    const data = snap.data();
    if (Date.now() < data.expiresAt) return data.accessToken;
  }
  const { access_token, expires_in } = await requestClientCredentialsToken();
  await ref.set({
    accessToken: access_token,
    // Renovamos 60s antes de que expire de verdad, para no fallar por poco.
    expiresAt: Date.now() + (Number(expires_in) - 60) * 1000,
  });
  return access_token;
}
