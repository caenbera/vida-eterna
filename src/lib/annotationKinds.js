// Herramientas de anotación de palabras/frases dentro de un bloque de versículo.
// "Color" se fusiona dentro de Resaltar/Subrayar/Encerrar (eligen color con el mismo picker).
// "Diccionario" se fusiona como un campo opcional dentro de Palabra clave / Léxico.
// "Conectar" y "Comparar" quedan fuera de alcance por ahora: requieren relacionar dos
// anotaciones entre sí o datos de múltiples traducciones, que no tenemos todavía.

export const ANNOTATION_COLORS = [
  { id: 'amarillo', hex: '#f1c40f' },
  { id: 'verde', hex: '#2ecc71' },
  { id: 'rosa', hex: '#ff8fab' },
  { id: 'rojo', hex: '#e74c3c' },
  { id: 'morado', hex: '#9b59b6' },
  { id: 'azul', hex: '#3498db' },
];

export const ANNOTATION_KINDS = {
  resaltar: { id: 'resaltar', label: 'Resaltar', icon: 'fa-highlighter', color: '#f1c40f', instant: true },
  subrayar: { id: 'subrayar', label: 'Subrayar', icon: 'fa-pen-nib', color: '#9b59b6', instant: true },
  encerrar: { id: 'encerrar', label: 'Encerrar', icon: 'fa-vector-square', color: '#e74c3c', instant: true },
  nota: { id: 'nota', label: 'Nota de interpretación', icon: 'fa-note-sticky', color: '#f97316', fields: ['note'] },
  referencia: { id: 'referencia', label: 'Referencia cruzada', icon: 'fa-link', color: '#3b82f6', fields: ['refs'] },
  etiqueta: { id: 'etiqueta', label: 'Etiqueta', icon: 'fa-tag', color: '#22c55e', fields: ['tag'] },
  lexico: { id: 'lexico', label: 'Palabra clave / Léxico', icon: 'fa-language', color: '#0a192f', fields: ['hebrew', 'translit', 'strong', 'meaning', 'other', 'dicturl'] },
  pregunta: { id: 'pregunta', label: 'Pregunta', icon: 'fa-circle-question', color: '#c026d3', fields: ['question'] },
};

export const ANNOTATION_KIND_LIST = Object.values(ANNOTATION_KINDS);

// Aplica el estilo visual de una anotación instantánea (resaltar/subrayar/encerrar) directamente
// como estilo inline del <span>, para que viaje con el HTML guardado y se vea igual en la
// vista de usuario sin depender de CSS externo que no puede leer colores desde data-*.
export function applyAnnotationStyle(span, kindId, color) {
  span.style.background = '';
  span.style.textDecoration = '';
  span.style.textDecorationColor = '';
  span.style.textDecorationThickness = '';
  span.style.textUnderlineOffset = '';
  span.style.border = '';
  span.style.borderRadius = '';
  span.style.padding = '';

  if (!color) return;

  if (kindId === 'resaltar') {
    span.style.background = `${color}55`;
    span.style.borderRadius = '3px';
    span.style.padding = '0 2px';
  } else if (kindId === 'subrayar') {
    span.style.textDecoration = 'underline';
    span.style.textDecorationColor = color;
    span.style.textDecorationThickness = '3px';
    span.style.textUnderlineOffset = '3px';
  } else if (kindId === 'encerrar') {
    span.style.border = `2px solid ${color}`;
    span.style.borderRadius = '4px';
    span.style.padding = '0 4px';
  }
}

export const FIELD_LABELS = {
  note: 'Nota de interpretación',
  refs: 'Referencias relacionadas (una por línea)',
  tag: 'Texto de la etiqueta',
  hebrew: 'Hebreo / Griego',
  translit: 'Transliteración',
  strong: 'Número de Strong',
  meaning: 'Significado',
  other: 'Otras apariciones (una por línea)',
  dicturl: 'Enlace a diccionario (opcional)',
  question: 'Pregunta de reflexión',
};
