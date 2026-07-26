// Búsqueda del léxico hebreo/griego de Strong's para autocompletar las
// anotaciones de Palabra clave / Léxico y Diccionario. Los datos se cargan
// bajo demanda desde public/data/ (nunca entran al bundle principal, ya que
// son ~1-2MB combinados) y se cachean en memoria tras la primera carga.
// Fuentes y licencias en public/data/SOURCES.md.

const cache = {};

function testamentFor(strongNumber) {
  return strongNumber?.trim().toUpperCase().startsWith('G') ? 'greek' : 'hebrew';
}

function fileFor(testament) {
  return testament === 'greek' ? '/data/strongs-greek.json' : '/data/strongs-hebrew.json';
}

async function loadLexicon(testament) {
  if (cache[testament]) return cache[testament];
  try {
    const res = await fetch(fileFor(testament));
    if (!res.ok) return {};
    const data = await res.json();
    cache[testament] = data;
    return data;
  } catch {
    return {};
  }
}

// Devuelve { strong, hebrew, translit, meaning } o null si no existe la entrada.
// El campo se llama "hebrew" tanto para entradas hebreas como griegas, para
// coincidir con el nombre de campo que ya usan los tipos de anotación lexico/diccionario.
export async function lookupByStrong(strongNumber) {
  if (!strongNumber) return null;
  const normalized = strongNumber.trim().toUpperCase();
  const lexicon = await loadLexicon(testamentFor(normalized));
  return lexicon[normalized] || null;
}

// Búsqueda simple por substring (transliteración, palabra original o
// significado). Sin fuzzy-search: a este tamaño de datos (~14,000 entradas)
// un escaneo directo es suficiente para autocompletar en el admin.
export async function searchByText(query, { testament = 'both', limit = 15 } = {}) {
  const raw = (query || '').trim();
  const q = raw.toLowerCase();
  if (q.length < 2) return [];

  const testaments = testament === 'both' ? ['hebrew', 'greek'] : [testament];
  const results = [];
  for (const t of testaments) {
    const lexicon = await loadLexicon(t);
    for (const entry of Object.values(lexicon)) {
      const matches =
        entry.translit?.toLowerCase().includes(q) ||
        entry.hebrew?.includes(raw) ||
        entry.meaning?.toLowerCase().includes(q);
      if (matches) {
        results.push(entry);
        if (results.length >= limit) return results;
      }
    }
  }
  return results;
}
