// GET /api/egw-authorize — redirige al admin a la pantalla de autorización
// de EGW Writings. Solo hace falta visitarlo una vez (o cuando el refresh
// token deje de servir); el resultado vuelve a /api/egw-callback.
export default function handler(req, res) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.EGW_CLIENT_ID,
    redirect_uri: process.env.EGW_REDIRECT_URI,
  });
  res.writeHead(302, { Location: `https://cpanel.egwwritings.org/o/authorize/?${params}` });
  res.end();
}
