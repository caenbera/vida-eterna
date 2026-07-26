// Migra public/studies.json del esquema plano antiguo (units -> elements)
// al nuevo esquema (sections -> subtopics -> blocks).
//
// Regla de migración (1:1, sin pérdida de contenido):
//   cada "unit" antigua se convierte en una "section" nueva con UN solo
//   "subtopic" (mismo id/título) que contiene todos los bloques de esa unidad.
//   El admin puede dividir esa sección en más subtemas después desde el Constructor.
//
// Uso:
//   node scripts/migrate-studies-schema.js
// Escribe public/studies.migrated.json (NO sobreescribe studies.json).
// Revisa el reporte de conteos y el diff antes de reemplazar el archivo real.

import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_PATH = path.join(__dirname, '..', 'public', 'studies.json');
const OUT_PATH = path.join(__dirname, '..', 'public', 'studies.migrated.json');

const LEGACY_TYPE_MAP = {
  paragraph: 'texto',
  'bible-verse': 'versiculo',
  question: 'pregunta',
  accordion: 'acordeon',
};

function slugPart(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function migrateElementToBlock(elem, studyId, unitId, idx) {
  const newType = LEGACY_TYPE_MAP[elem.type] || elem.type;
  const id = `blk_${slugPart(studyId)}_${slugPart(unitId)}_${idx}`;
  const block = { id, type: newType };

  if (newType === 'texto') {
    block.title = '';
    block.content = elem.content || '';
  } else if (newType === 'versiculo') {
    block.title = elem.reference || '';
    block.reference = elem.reference || '';
    block.translation = 'RVR60';
    block.text = elem.text || '';
    block.context = elem.context || '';
    block.showPerVerse = false;
    block.notes = '';
  } else if (newType === 'pregunta') {
    block.title = elem.title || '';
    block.badge = elem.badge || '';
    block.badgeType = elem.badgeType || 'level-semilla';
    block.explanation = elem.explanation || '';
    block.childExplanation = elem.childExplanation || '';
    block.reflectionAdult = elem.reflectionAdult || '';
    block.reflectionChild = elem.reflectionChild || '';
    block.connection = elem.connection || '';
  } else if (newType === 'acordeon') {
    block.title = elem.title || '';
    block.icon = 'fa-book-open';
    block.color = 'azul';
    block.description = '';
    block.openByDefault = false;
    // El acordeón antiguo tenía contenido HTML libre, no bloques hijos.
    // Se envuelve como un único bloque de texto hijo para no perder contenido.
    block.blocks = elem.content
      ? [{ id: `${id}_child_0`, type: 'texto', title: '', content: elem.content }]
      : [];
  } else {
    // tipo desconocido: se conserva tal cual dentro de un bloque de texto para no perder datos
    block.title = elem.title || '';
    block.content = JSON.stringify(elem);
  }

  return block;
}

function migrateUnitToSection(unit, studyId, sectionIdx) {
  const sectionId = unit.id || `sec_${sectionIdx}`;
  const blocks = [];

  // logicBase / thesis / whyMatters de la unidad antigua se convierten en
  // bloques de nota/destacado al inicio/fin del único subtema, para no perder ese contenido.
  if (unit.logicBase) {
    blocks.push({ id: `${sectionId}_logicbase`, type: 'nota', title: 'Base lógica', content: unit.logicBase });
  }
  if (unit.thesis) {
    blocks.push({ id: `${sectionId}_thesis`, type: 'destacado', title: 'Idea fundamental', content: unit.thesis });
  }

  (unit.elements || []).forEach((elem, idx) => {
    blocks.push(migrateElementToBlock(elem, studyId, sectionId, idx));
  });

  if (unit.whyMatters) {
    blocks.push({ id: `${sectionId}_whymatters`, type: 'conclusion', title: '¿Por qué esto es fundamental?', content: unit.whyMatters });
  }

  return {
    id: sectionId,
    title: unit.title || `Unidad ${sectionIdx + 1}`,
    icon: 'fa-book',
    color: 'azul',
    subtopics: [
      {
        id: `${sectionId}_sub1`,
        title: unit.title || `Unidad ${sectionIdx + 1}`,
        blocks,
      },
    ],
  };
}

function migrateStudy(study) {
  const sections = (study.units || []).map((unit, idx) => migrateUnitToSection(unit, study.id, idx));
  return {
    id: study.id,
    title: study.title,
    subtitle: study.subtitle || '',
    description: study.subtitle || '',
    icon: study.icon || 'fa-book',
    coverImage: '',
    category: study.category || 'deidad',
    status: study.status === 'proximamente' ? 'borrador' : study.status || 'publicado',
    templateId: null,
    sections,
  };
}

function countOldElements(study) {
  return (study.units || []).reduce((acc, u) => acc + (u.elements || []).length, 0);
}

function countNewBlocksInBlocks(blocks) {
  return (blocks || []).reduce((acc, b) => acc + 1 + (b.type === 'acordeon' ? countNewBlocksInBlocks(b.blocks) : 0), 0);
}

function countNewBlocks(study) {
  return (study.sections || []).reduce(
    (acc, s) => acc + (s.subtopics || []).reduce((acc2, st) => acc2 + countNewBlocksInBlocks(st.blocks), 0),
    0
  );
}

async function main() {
  const raw = await readFile(SRC_PATH, 'utf-8');
  const studies = JSON.parse(raw);

  const migrated = studies.map(migrateStudy);

  console.log('Reporte de migración (verificación de que no se pierde contenido):');
  console.log('-'.repeat(70));
  studies.forEach((study, idx) => {
    const oldCount = countOldElements(study);
    // los bloques nuevos incluyen los "extra" (logicBase/thesis/whyMatters convertidos), por eso pueden ser >= oldCount
    const newCount = countNewBlocks(migrated[idx]);
    const oldUnits = (study.units || []).length;
    const newSections = migrated[idx].sections.length;
    const status = newCount >= oldCount && newSections === oldUnits ? 'OK' : 'REVISAR';
    console.log(
      `${status.padEnd(8)} ${study.id.padEnd(30)} unidades ${oldUnits}->${newSections}  elementos ${oldCount}->bloques ${newCount}`
    );
  });
  console.log('-'.repeat(70));

  await writeFile(OUT_PATH, JSON.stringify(migrated, null, 2), 'utf-8');
  console.log(`\nEscrito: ${OUT_PATH}`);
  console.log('Revisa el archivo y, si todo está correcto, reemplaza public/studies.json manualmente.');
}

main().catch((err) => {
  console.error('Error en la migración:', err);
  process.exit(1);
});
