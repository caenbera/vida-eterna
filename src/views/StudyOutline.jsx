import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loadStudy } from '../services/studiesService';
import { countVerses, countReferences } from '../lib/blocks';
import { getStudyProgress, computeSectionPercent, isSubtopicComplete } from '../lib/progress';
import StudyFlowHeader from '../components/StudyFlowHeader';

const countSubtopicVerses = (subtopic) => (subtopic.blocks || []).filter((b) => b.type === 'versiculo').length;
const subtopicRefs = (subtopic) =>
  (subtopic.blocks || []).filter((b) => b.type === 'versiculo' && b.reference).map((b) => b.reference).join('; ');

const StudyOutline = () => {
  const { studyId } = useParams();
  const navigate = useNavigate();
  const [study, setStudy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState({});

  useEffect(() => {
    (async () => {
      const s = await loadStudy(studyId);
      if (!s) { navigate('/'); return; }
      setStudy(s);
      const initialOpen = {};
      (s.sections || []).forEach((sec, idx) => { initialOpen[sec.id] = idx === 0; });
      setOpenSections(initialOpen);
      setLoading(false);
    })();
  }, [studyId, navigate]);

  if (loading || !study) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', fontFamily: "'Cinzel', serif", color: 'var(--azul-real)' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '10px' }}></i> Cargando bosquejo...
      </div>
    );
  }

  const progress = getStudyProgress(studyId);
  const toggleSection = (id) => setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  const allOpen = Object.values(openSections).every(Boolean);
  const toggleAll = () => {
    const next = {};
    study.sections.forEach((s) => { next[s.id] = !allOpen; });
    setOpenSections(next);
  };

  return (
    <div>
      <StudyFlowHeader
        crumbs={[
          { label: 'Biblioteca', to: '/' },
          { label: study.title, to: `/study/${studyId}` },
          { label: 'Bosquejo del estudio' },
        ]}
      />

      <div className="outline-header-card">
        <div className="outline-header-icon">
          {study.coverImage ? <img src={study.coverImage} alt={study.title} /> : <i className={`fa-solid ${study.icon || 'fa-book'}`}></i>}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', color: 'var(--azul-real)', fontWeight: 'bold' }}>{study.title}</div>
          <div style={{ color: '#8894a8' }}>{study.subtitle}</div>
        </div>
        <div className="cover-hero-stats" style={{ color: 'var(--azul-real)' }}>
          <div className="cover-hero-stat" style={{ color: 'var(--azul-real)' }}>
            <i className="fa-solid fa-layer-group" style={{ color: 'var(--oro)' }}></i>
            <div><strong style={{ color: 'var(--azul-real)' }}>{study.sections?.length || 0}</strong><span className="label">Unidades</span></div>
          </div>
          <div className="cover-hero-stat" style={{ color: 'var(--azul-real)' }}>
            <i className="fa-solid fa-book" style={{ color: 'var(--oro)' }}></i>
            <div><strong style={{ color: 'var(--azul-real)' }}>{countVerses(study)}</strong><span className="label">Versículos</span></div>
          </div>
          <div className="cover-hero-stat" style={{ color: 'var(--azul-real)' }}>
            <i className="fa-solid fa-link" style={{ color: 'var(--oro)' }}></i>
            <div><strong style={{ color: 'var(--azul-real)' }}>{countReferences(study)}</strong><span className="label">Referencias</span></div>
          </div>
        </div>
      </div>

      <div className="outline-list">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ fontFamily: "'Cinzel', serif", color: 'var(--azul-real)' }}>Bosquejo del estudio</h3>
          <button className="btn-primary" onClick={toggleAll} style={{ padding: '8px 16px', fontSize: '0.78rem' }}>
            {allOpen ? 'Colapsar todo' : 'Expandir todo'}
          </button>
        </div>

        {(study.sections || []).map((section, idx) => {
          const pct = computeSectionPercent(section, progress);
          const isOpen = !!openSections[section.id];
          return (
            <div className="outline-section" key={section.id}>
              <div className="outline-section-header" onClick={() => toggleSection(section.id)}>
                <span className="num">{idx + 1}.</span>
                <span className="title">{section.title}</span>
                <span className="meta">{section.subtopics?.length || 0} temas &middot; {section.subtopics?.reduce((a, st) => a + countSubtopicVerses(st), 0)} versículos</span>
                <div className="bar-bg"><div className="bar-fill" style={{ width: `${pct}%` }}></div></div>
                <span className="pct">{pct}%</span>
                <i className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
              </div>

              {isOpen && (
                <div className="outline-subtopics">
                  {(section.subtopics || []).map((sub, subIdx) => {
                    const done = isSubtopicComplete(studyId, section.id, sub.id);
                    return (
                      <div className="outline-subtopic-row" key={sub.id}>
                        <span className={`outline-subtopic-status ${done ? 'completed' : 'pending'}`}>
                          <i className={`fa-solid ${done ? 'fa-circle-check' : 'fa-circle'}`}></i>
                        </span>
                        <span className="outline-subtopic-num">{idx + 1}.{subIdx + 1}</span>
                        <div style={{ flex: 1 }}>
                          <div className="outline-subtopic-title">{sub.title}</div>
                          {subtopicRefs(sub) && (
                            <div className="outline-subtopic-refs"><i className="fa-solid fa-book" style={{ marginRight: '5px' }}></i>{subtopicRefs(sub)}</div>
                          )}
                        </div>
                        <button
                          className="btn-primary"
                          style={{ padding: '8px 16px', fontSize: '0.78rem' }}
                          onClick={() => navigate(`/study/${studyId}/tema/${section.id}/${sub.id}`)}
                        >
                          Estudiar <i className="fa-solid fa-chevron-right"></i>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <footer>
        <p>Vida Eterna - Biblioteca de Investigación Bíblica</p>
      </footer>
    </div>
  );
};

export default StudyOutline;
