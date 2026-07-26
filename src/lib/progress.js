// Progreso de usuario por subtema, guardado en localStorage (mismo patrón que ReflectionBox.jsx).
import { progressKey } from './blocks';

const keyFor = (studyId) => `vida_eterna_progress_${studyId}`;

export function getStudyProgress(studyId) {
  try {
    const raw = localStorage.getItem(keyFor(studyId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function isSubtopicComplete(studyId, sectionId, subtopicId) {
  const progress = getStudyProgress(studyId);
  return !!progress[progressKey(sectionId, subtopicId)];
}

export function markSubtopicComplete(studyId, sectionId, subtopicId) {
  const progress = getStudyProgress(studyId);
  progress[progressKey(sectionId, subtopicId)] = true;
  localStorage.setItem(keyFor(studyId), JSON.stringify(progress));
  return progress;
}

export function unmarkSubtopicComplete(studyId, sectionId, subtopicId) {
  const progress = getStudyProgress(studyId);
  delete progress[progressKey(sectionId, subtopicId)];
  localStorage.setItem(keyFor(studyId), JSON.stringify(progress));
  return progress;
}

export function computeSectionPercent(section, progress) {
  const total = (section.subtopics || []).length;
  if (!total) return 0;
  const done = section.subtopics.filter((st) => progress[progressKey(section.id, st.id)]).length;
  return Math.round((done / total) * 100);
}

export function computeStudyPercent(study, progress) {
  const allSubtopics = (study.sections || []).flatMap((s) => (s.subtopics || []).map((st) => ({ sectionId: s.id, subtopicId: st.id })));
  if (!allSubtopics.length) return 0;
  const done = allSubtopics.filter((st) => progress[progressKey(st.sectionId, st.subtopicId)]).length;
  return Math.round((done / allSubtopics.length) * 100);
}

export function countCompletedSubtopics(study, progress) {
  const allSubtopics = (study.sections || []).flatMap((s) => (s.subtopics || []).map((st) => ({ sectionId: s.id, subtopicId: st.id })));
  return allSubtopics.filter((st) => progress[progressKey(st.sectionId, st.subtopicId)]).length;
}
