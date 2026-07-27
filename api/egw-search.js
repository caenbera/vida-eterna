import { getValidAccessToken } from './_egwAuth.js';

const EGW_API_BASE = 'https://a.egwwritings.org';

// GET /api/egw-search?q=... — proxy de búsqueda: el cliente nunca ve el
// token ni habla directo con a.egwwritings.org. Devuelve solo lo que el
// editor necesita para mostrar una lista de resultados.
export default async function handler(req, res) {
  const q = (req.query.q || '').toString().trim();
  if (q.length < 2) {
    res.status(200).json([]);
    return;
  }
  try {
    const token = await getValidAccessToken();
    const url = `${EGW_API_BASE}/search/advanced/book?${new URLSearchParams({ query: q, lang: 'en', limit: '15' })}`;
    const apiRes = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!apiRes.ok) {
      const body = await apiRes.text().catch(() => '');
      throw new Error(`EGW API respondió ${apiRes.status}: ${body.slice(0, 300)}`);
    }
    const data = await apiRes.json();
    const results = (data.results || []).map((r) => {
      const [bookId, para] = (r.para_id || '').split('.');
      return {
        title: (r.refcode_long || '').replace(/\(.*\)/, '').trim(),
        refcode: r.refcode_short || '',
        bookId,
        para,
        snippet: r.snippet || '',
      };
    });
    res.status(200).json(results);
  } catch (err) {
    console.error('EGW search error:', err);
    res.status(502).json({ error: 'No se pudo buscar en EGW Writings.' });
  }
}
