import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loadStudy } from '../services/studiesService';
import { findSubtopic, flattenSubtopics } from '../lib/blocks';
import { getStudyProgress, markSubtopicComplete, isSubtopicComplete } from '../lib/progress';
import StudyFlowHeader from '../components/StudyFlowHeader';
import SideMap from '../components/SideMap';
import BlockRenderer from '../components/blocks/BlockRenderer';

const NOTES_KEY = (studyId, sectionId, subtopicId) => `vida_eterna_topic_notes_${studyId}_${sectionId}_${subtopicId}`;

const StudyTopic = () => {
  const { studyId, sectionId, subtopicId } = useParams();
  const navigate = useNavigate();
  const [study, setStudy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({});
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    (async () => {
      const s = await loadStudy(studyId);
      if (!s) { navigate('/'); return; }
      setStudy(s);
      setLoading(false);
    })();
  }, [studyId, navigate]);

  useEffect(() => {
    if (!study) return;
    setProgress(getStudyProgress(studyId));
    setNoteText(localStorage.getItem(NOTES_KEY(studyId, sectionId, subtopicId)) || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [study, studyId, sectionId, subtopicId]);

  if (loading || !study) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', fontFamily: "'Cinzel', serif", color: 'var(--azul-real)' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '10px' }}></i> Cargando tema...
      </div>
    );
  }

  const { section, subtopic } = findSubtopic(study, sectionId, subtopicId);
  if (!section || !subtopic) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        Tema no encontrado. <button className="btn-primary" onClick={() => navigate(`/study/${studyId}/bosquejo`)}>Volver al bosquejo</button>
      </div>
    );
  }

  const flat = flattenSubtopics(study);
  const currentIdx = flat.findIndex((f) => f.sectionId === sectionId && f.subtopicId === subtopicId);
  const prev = currentIdx > 0 ? flat[currentIdx - 1] : null;
  const next = currentIdx < flat.length - 1 ? flat[currentIdx + 1] : null;
  const sectionIdx = study.sections.findIndex((s) => s.id === sectionId);
  const subtopicIdx = section.subtopics.findIndex((s) => s.id === subtopicId);
  const completed = isSubtopicComplete(studyId, sectionId, subtopicId);
  const contextId = `${sectionId}__${subtopicId}`;

  const goTo = (sId, stId) => navigate(`/study/${studyId}/tema/${sId}/${stId}`);

  const handleMarkComplete = () => {
    const updated = markSubtopicComplete(studyId, sectionId, subtopicId);
    setProgress(updated);
  };

  const handleNoteChange = (val) => {
    setNoteText(val);
    if (val.trim()) localStorage.setItem(NOTES_KEY(studyId, sectionId, subtopicId), val);
    else localStorage.removeItem(NOTES_KEY(studyId, sectionId, subtopicId));
  };

  return (
    <div>
      <StudyFlowHeader
        crumbs={[
          { label: 'Biblioteca', to: '/' },
          { label: study.title, to: `/study/${studyId}` },
          { label: 'Bosquejo', to: `/study/${studyId}/bosquejo` },
          { label: `${sectionIdx + 1}.${subtopicIdx + 1} ${subtopic.title}` },
        ]}
      />

      <div className="topic-layout">
        <div className="topic-sidebar">
          <SideMap
            sections={study.sections}
            currentSectionId={sectionId}
            currentSubtopicId={subtopicId}
            progress={progress}
            onSelect={goTo}
          />
        </div>

        <div className="topic-main">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
            <button className="btn-primary" onClick={() => navigate(`/study/${studyId}/bosquejo`)} style={{ padding: '8px 16px', fontSize: '0.78rem', background: 'transparent', border: '2px solid var(--azul-real)', color: 'var(--azul-real)' }}>
              <i className="fa-solid fa-arrow-left"></i> Volver al bosquejo
            </button>
            <button className="btn-primary print-btn-top" onClick={() => window.print()} style={{ padding: '8px 16px', fontSize: '0.78rem', position: 'static' }}>
              <i className="fa-solid fa-download"></i> Descargar PDF
            </button>
          </div>

          <span className="topic-num-badge">{sectionIdx + 1}.{subtopicIdx + 1}</span>
          <h2 className="topic-title">{subtopic.title}</h2>

          <BlockRenderer blocks={subtopic.blocks} studyId={studyId} contextId={contextId} />

          <div className="topic-notes-box">
            <strong style={{ color: 'var(--azul-real)' }}><i className="fa-regular fa-pen-to-square" style={{ marginRight: '8px' }}></i>Mis notas de este tema</strong>
            <textarea
              placeholder="Escribe aquí tus notas personales..."
              value={noteText}
              onChange={(e) => handleNoteChange(e.target.value)}
            />
          </div>

          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <button className="btn-primary" onClick={handleMarkComplete} disabled={completed} style={{ background: completed ? 'var(--verde-ninos)' : undefined, color: completed ? '#fff' : undefined }}>
              <i className="fa-solid fa-circle-check"></i> {completed ? 'Tema completado' : 'Marcar como completado'}
            </button>
          </div>

          <div className="topic-nav-buttons">
            <button
              className="btn-primary"
              disabled={!prev}
              onClick={() => prev && goTo(prev.sectionId, prev.subtopicId)}
              style={{ opacity: prev ? 1 : 0.4 }}
            >
              <i className="fa-solid fa-arrow-left"></i> Tema anterior
            </button>
            <button
              className="btn-primary"
              disabled={!next}
              onClick={() => next && goTo(next.sectionId, next.subtopicId)}
              style={{ background: 'var(--azul-real)', color: 'var(--oro)', opacity: next ? 1 : 0.4 }}
            >
              Siguiente tema <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>

      <footer>
        <p>Vida Eterna - Biblioteca de Investigación Bíblica</p>
      </footer>
    </div>
  );
};

export default StudyTopic;
