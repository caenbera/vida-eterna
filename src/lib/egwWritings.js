// Cliente delgado hacia los endpoints /api/egw-* (funciones serverless de
// Vercel). El navegador nunca habla directo con a.egwwritings.org ni ve
// ningún token — mismo espíritu que src/lib/strongsLexicon.js.

export async function searchEgw(query) {
  const q = (query || '').trim();
  if (q.length < 2) return [];
  try {
    const res = await fetch(`/api/egw-search?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchEgwParagraph(bookId, para) {
  if (!bookId || !para) return null;
  try {
    const res = await fetch(`/api/egw-paragraph?book=${encodeURIComponent(bookId)}&para=${encodeURIComponent(para)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
