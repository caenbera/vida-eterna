import { getValidAccessToken } from './_egwAuth.js';

const EGW_API_BASE = 'https://a.egwwritings.org';

// GET /api/egw-paragraph?book=&para= — trae un párrafo puntual y lo
// devuelve ya en el mismo formato que espera un bloque tipo "cita"
// (author/work/citation/sourceUrl/text), listo para autocompletar el
// formulario del editor.
export default async function handler(req, res) {
  const book = (req.query.book || '').toString();
  const para = (req.query.para || '').toString();
  if (!book || !para) {
    res.status(400).json({ error: 'Faltan los parámetros "book" y "para".' });
    return;
  }
  try {
    const token = await getValidAccessToken();
    const url = `${EGW_API_BASE}/content/books/${book}/content/${para}`;
    const apiRes = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!apiRes.ok) throw new Error(`EGW API respondió ${apiRes.status}`);
    const data = await apiRes.json();
    const first = Array.isArray(data) ? data[0] : data;
    if (!first) {
      res.status(404).json({ error: 'No se encontró el párrafo.' });
      return;
    }
    res.status(200).json({
      author: 'Elena G. de White',
      work: (first.refcode_long || '').replace(/\(.*\)/, '').trim(),
      citation: first.refcode_short || '',
      sourceUrl: `https://egwwritings.org/read?panels=p${book}.${para}&index=0`,
      text: first.content || '',
    });
  } catch (err) {
    console.error('EGW paragraph error:', err);
    res.status(502).json({ error: 'No se pudo obtener el párrafo de EGW Writings.' });
  }
}
