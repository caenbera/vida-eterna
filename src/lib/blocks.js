// Esquema compartido de bloques y estructura de estudio (Estudio -> Secciones -> Subtemas -> Bloques).
// Usado tanto por el Constructor de administrador como por el renderizador de usuario.

export const TRANSLATIONS = ['RVR60', 'RVR95', 'NVI', 'LBLA', 'NTV'];

let idCounter = 0;
export function generateId(prefix = 'id') {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}

export const BLOCK_TYPES = {
  texto: {
    id: 'texto',
    label: 'Texto',
    icon: 'fa-font',
    color: '#3b82f6',
    description: 'Bloque de texto normal con formato.',
  },
  versiculo: {
    id: 'versiculo',
    label: 'Versículo',
    icon: 'fa-book-open',
    color: '#22c55e',
    description: 'Cita bíblica con referencia.',
  },
  nota: {
    id: 'nota',
    label: 'Nota',
    icon: 'fa-note-sticky',
    color: '#f97316',
    description: 'Nota de estudio o interpretación.',
  },
  destacado: {
    id: 'destacado',
    label: 'Destacado',
    icon: 'fa-star',
    color: '#eab308',
    description: 'Idea importante o destacado.',
  },
  acordeon: {
    id: 'acordeon',
    label: 'Acordeón',
    icon: 'fa-layer-group',
    color: '#a855f7',
    description: 'Sección colapsable con contenido.',
  },
  pregunta: {
    id: 'pregunta',
    label: 'Pregunta',
    icon: 'fa-circle-question',
    color: '#a855f7',
    description: 'Pregunta para reflexión.',
  },
  conclusion: {
    id: 'conclusion',
    label: 'Conclusión',
    icon: 'fa-flag',
    color: '#a855f7',
    description: 'Conclusión del punto o sección.',
  },
  separador: {
    id: 'separador',
    label: 'Separador',
    icon: 'fa-minus',
    color: '#94a3b8',
    description: 'Separador visual o espacio.',
  },
};

export const BLOCK_TYPE_LIST = Object.values(BLOCK_TYPES);

export const ACCORDION_COLORS = {
  azul: '#0a192f',
  verde: '#22c55e',
  purpura: '#a855f7',
  naranja: '#f97316',
  gris: '#64748b',
};

// Mapea los tipos de "elemento" del esquema plano anterior a los tipos de bloque nuevos.
export const LEGACY_TYPE_MAP = {
  paragraph: 'texto',
  'bible-verse': 'versiculo',
  question: 'pregunta',
  accordion: 'acordeon',
};

export function createBlock(type) {
  const id = generateId('blk');
  switch (type) {
    case 'texto':
      return { id, type, title: '', content: '<p>Escribe aquí tu texto...</p>' };
    case 'versiculo':
      return {
        id,
        type,
        title: '',
        reference: '',
        translation: 'RVR60',
        text: '',
        context: '',
        showPerVerse: false,
        notes: '',
      };
    case 'nota':
      return { id, type, title: 'Nota de interpretación', content: '' };
    case 'destacado':
      return { id, type, title: 'Idea fundamental', content: '' };
    case 'acordeon':
      return {
        id,
        type,
        title: 'Nuevo acordeón',
        icon: 'fa-book-open',
        color: 'azul',
        description: '',
        openByDefault: false,
        blocks: [],
      };
    case 'pregunta':
      return {
        id,
        type,
        title: '¿Cuál es la pregunta?',
        badge: 'Semilla',
        badgeType: 'level-semilla',
        explanation: '',
        childExplanation: '',
        reflectionAdult: '',
        reflectionChild: '',
        connection: '',
      };
    case 'conclusion':
      return { id, type, title: 'Conclusión', content: '' };
    case 'separador':
      return { id, type };
    default:
      return { id, type };
  }
}

export function createSubtopic(title = 'Nuevo subtema') {
  return { id: generateId('sub'), title, blocks: [] };
}

export function createSection(title = 'Nueva unidad') {
  return {
    id: generateId('sec'),
    title,
    icon: 'fa-book',
    color: 'azul',
    subtopics: [createSubtopic(title)],
  };
}

export function createStudy(meta = {}) {
  return {
    id: meta.id || generateId('study'),
    title: meta.title || 'Nuevo Estudio Bíblico',
    subtitle: meta.subtitle || '',
    description: meta.description || '',
    icon: meta.icon || 'fa-book',
    coverImage: meta.coverImage || '',
    category: meta.category || 'deidad',
    status: meta.status || 'borrador',
    templateId: meta.templateId || null,
    createdAt: meta.createdAt || Date.now(),
    updatedAt: Date.now(),
    sections: meta.sections || [createSection('Unidad 1')],
  };
}

// -------- Helpers de conteo / navegación sobre la jerarquía --------

export function countVerses(study) {
  let count = 0;
  const walk = (blocks) => {
    (blocks || []).forEach((b) => {
      if (b.type === 'versiculo') count += 1;
      if (b.type === 'acordeon') walk(b.blocks);
    });
  };
  (study.sections || []).forEach((s) => (s.subtopics || []).forEach((st) => walk(st.blocks)));
  return count;
}

export function countReferences(study) {
  // Referencias = versículos + referencias cruzadas dentro de acordeones (aprox. por ahora: solo versículos con referencia no vacía)
  return countVerses(study);
}

export function countSubtopics(study) {
  return (study.sections || []).reduce((acc, s) => acc + (s.subtopics || []).length, 0);
}

// Devuelve una lista plana de { sectionId, subtopicId, sectionIndex, subtopicIndex, section, subtopic }
export function flattenSubtopics(study) {
  const flat = [];
  (study.sections || []).forEach((section, sectionIndex) => {
    (section.subtopics || []).forEach((subtopic, subtopicIndex) => {
      flat.push({ sectionId: section.id, subtopicId: subtopic.id, sectionIndex, subtopicIndex, section, subtopic });
    });
  });
  return flat;
}

export function findSubtopic(study, sectionId, subtopicId) {
  const section = (study.sections || []).find((s) => s.id === sectionId);
  if (!section) return { section: null, subtopic: null };
  const subtopic = (section.subtopics || []).find((st) => st.id === subtopicId);
  return { section, subtopic };
}

export function progressKey(sectionId, subtopicId) {
  return `${sectionId}__${subtopicId}`;
}

// Quita entradas nulas/indefinidas de sections/subtopics/blocks. Estudios guardados
// antes de corregir un bug de arrastrar-y-soltar podían terminar con un bloque
// "undefined" insertado en el arreglo, lo que rompe cualquier .find(b => b.id).
export function sanitizeStudy(study) {
  if (!study) return study;
  return {
    ...study,
    sections: (study.sections || []).filter(Boolean).map((sec) => ({
      ...sec,
      subtopics: (sec.subtopics || []).filter(Boolean).map((st) => ({
        ...st,
        blocks: (st.blocks || []).filter(Boolean),
      })),
    })),
  };
}
