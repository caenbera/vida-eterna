// Lectura/escritura de datos de anotación desde/hacia el dataset de un span `.word-tag`.
// Existen 3 formatos históricos guardados en estudios reales, y ninguno se migra
// destructivamente: los spans viejos se siguen leyendo correctamente hasta que un
// admin los reabre y guarda, momento en el que naturalmente pasan al formato nuevo.
//   A) sin data-kind (anterior al primer rediseño): campos léxicos sueltos.
//   B) data-kind presente, campos de lista como string plano (uno por línea o con ";").
//   C) data-kind presente, campos de lista como JSON (array de objetos).

export function readAnnotation(dataset) {
  const kindId = dataset?.kind || 'lexico';
  return { kindId, fields: { ...dataset } };
}

// Convierte un string legado (separado por saltos de línea o ";") en filas
// { category: 'Referencia', reference: linea }, para que se vea sensato en el
// editor de filas nuevo sin perder los datos ya guardados.
function legacyStringToRows(str) {
  return (str || '')
    .split(/[\n;]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((reference) => ({ category: 'Referencia', reference }));
}

// Lee un campo de tipo lista (array de objetos) desde el dataset, con fallback a
// legacyField (nombre de atributo anterior, ej. "refs" antes de renombrarse a "links").
export function readListField(dataset, field, legacyField) {
  const raw = dataset?.[field];
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return legacyStringToRows(raw);
    }
  }
  if (legacyField && dataset?.[legacyField]) {
    return legacyStringToRows(dataset[legacyField]);
  }
  return [];
}

export function writeListField(span, field, rows) {
  span.dataset[field] = JSON.stringify(rows || []);
}
