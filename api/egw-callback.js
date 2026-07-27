import { handleAuthCallback } from './_egwAuth.js';

// GET /api/egw-callback?code=... — recibe el código de autorización tras
// que el admin aprueba el acceso en EGW Writings, lo intercambia por
// tokens, y los guarda. Solo pasa una vez por navegador; no requiere
// interacción del usuario final del sitio.
export default async function handler(req, res) {
  const { code, error } = req.query;
  if (error) {
    res.status(400).send(`Autorización rechazada por EGW Writings: ${error}`);
    return;
  }
  if (!code) {
    res.status(400).send('Falta el parámetro "code".');
    return;
  }
  try {
    await handleAuthCallback(code);
    res.status(200).send(
      '<html><body style="font-family:sans-serif;text-align:center;padding:60px">' +
      '<h1>Conectado correctamente</h1>' +
      '<p>Ya puedes cerrar esta pestaña y volver al editor de estudios.</p>' +
      '</body></html>'
    );
  } catch (err) {
    console.error('EGW callback error:', err);
    res.status(500).send('Error al conectar con EGW Writings: ' + err.message);
  }
}
