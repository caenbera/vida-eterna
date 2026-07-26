import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loadStudy } from '../services/studiesService';
import { getCategoryName } from '../lib/categories';
import { countVerses, countReferences, countSubtopics, flattenSubtopics } from '../lib/blocks';
import { getStudyProgress, computeStudyPercent, computeSectionPercent, countCompletedSubtopics } from '../lib/progress';
import StudyFlowHeader from '../components/StudyFlowHeader';

const StudyCover = () => {
  const { studyId } = useParams();
  const navigate = useNavigate();
  const [study, setStudy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const s = await loadStudy(studyId);
      if (!s) { navigate('/'); return; }
      setStudy(s);
      setLoading(false);
    })();
  }, [studyId, navigate]);

  if (loading || !study) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', fontFamily: "'Cinzel', serif", color: 'var(--azul-real)' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '10px' }}></i> Cargando estudio...
      </div>
    );
  }

  const progress = getStudyProgress(studyId);
  const percent = computeStudyPercent(study, progress);
  const completedCount = countCompletedSubtopics(study, progress);
  const totalSubtopics = countSubtopics(study);
  const hasStarted = completedCount > 0;

  const flat = flattenSubtopics(study);

  const handleStart = () => {
    let target = flat.find(({ sectionId, subtopicId }) => !progress[`${sectionId}__${subtopicId}`]) || flat[0];
    if (!target) { navigate(`/study/${studyId}/bosquejo`); return; }
    navigate(`/study/${studyId}/tema/${target.sectionId}/${target.subtopicId}`);
  };

  return (
    <div>
      <StudyFlowHeader crumbs={[{ label: 'Biblioteca', to: '/' }, { label: getCategoryName(study.category), to: '/' }, { label: study.title }]} />

      <div className="cover-hero">
        <div className="cover-hero-icon">
          <i className={`fa-solid ${study.icon || 'fa-book'}`}></i>
        </div>
        <div>
          <div className="cover-hero-category"><i className={`fa-solid ${study.icon || 'fa-book'}`}></i> {getCategoryName(study.category)}</div>
          <h1>{study.title}</h1>
          {study.subtitle && <div className="cover-subtitle">{study.subtitle}</div>}
          {study.description && <p className="description">{study.description}</p>}

          <button className="btn-primary" onClick={handleStart}>
            <i className="fa-solid fa-book-open"></i> {hasStarted ? 'Continuar estudio' : 'Comenzar estudio'}
          </button>

          <div className="cover-hero-stats">
            <div className="cover-hero-stat">
              <i className="fa-solid fa-layer-group"></i>
              <div><strong>{study.sections?.length || 0}</strong><span className="label">Unidades</span></div>
            </div>
            <div className="cover-hero-stat">
              <i className="fa-solid fa-book"></i>
              <div><strong>{countVerses(study)}</strong><span className="label">Versículos</span></div>
            </div>
            <div className="cover-hero-stat">
              <i className="fa-solid fa-link"></i>
              <div><strong>{countReferences(study)}</strong><span className="label">Referencias</span></div>
            </div>
          </div>
        </div>
      </div>

      {hasStarted && (
        <div className="cover-progress-card">
          <div className="progress-ring" style={{ background: `conic-gradient(var(--oro) ${percent * 3.6}deg, #ece7d8 0deg)` }}>
            <div className="progress-ring-inner">
              <div className="progress-ring-value">{percent}%</div>
              <small>Completado</small>
            </div>
          </div>
          <div className="cover-progress-bar-track">
            <strong style={{ color: 'var(--azul-real)', fontFamily: "'Cinzel', serif", fontSize: '0.85rem' }}>TU PROGRESO</strong>
            <div>Has completado {completedCount} de {totalSubtopics} temas.</div>
            <div className="bar-bg"><div className="bar-fill" style={{ width: `${percent}%` }}></div></div>
          </div>
          <button className="btn-primary" onClick={handleStart}>
            Continuar donde lo dejaste <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      )}

      <div className="cover-sections-list">
        <h3 style={{ textAlign: 'center', fontFamily: "'Cinzel', serif", color: 'var(--azul-real)', marginBottom: '18px' }}>
          ¿Qué encontrarás en este estudio?
        </h3>
        {(study.sections || []).map((section, idx) => {
          const sectionPct = computeSectionPercent(section, progress);
          const firstSub = section.subtopics?.[0];
          let statusClass = 'locked';
          let statusLabel = 'No iniciada';
          let statusIcon = 'fa-lock';
          if (sectionPct === 100) { statusClass = 'done'; statusLabel = 'Completada'; statusIcon = 'fa-circle-check'; }
          else if (sectionPct > 0) { statusClass = 'progress'; statusLabel = 'En progreso'; statusIcon = 'fa-circle-dot'; }
          else if (idx === 0) { statusClass = 'progress'; statusLabel = 'Empezar'; statusIcon = 'fa-play'; }

          return (
            <div
              className="cover-section-row"
              key={section.id}
              style={{ cursor: firstSub ? 'pointer' : 'default' }}
              onClick={() => firstSub && navigate(`/study/${studyId}/tema/${section.id}/${firstSub.id}`)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                <span className="cover-section-num">{idx + 1}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--azul-real)' }}>{section.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#8894a8' }}>{(section.subtopics || []).length} temas</div>
                </div>
              </div>
              <span className={`cover-section-status ${statusClass}`}>
                <i className={`fa-solid ${statusIcon}`}></i> {statusLabel}
              </span>
              <i className="fa-solid fa-chevron-right" style={{ color: '#cbd2de' }}></i>
            </div>
          );
        })}

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button className="btn-primary" onClick={() => navigate(`/study/${studyId}/bosquejo`)} style={{ background: 'transparent', border: '2px solid var(--azul-real)', color: 'var(--azul-real)' }}>
            <i className="fa-solid fa-list"></i> Ver bosquejo completo
          </button>
        </div>
      </div>

      <footer>
        <p>Vida Eterna - Biblioteca de Investigación Bíblica</p>
      </footer>
    </div>
  );
};

export default StudyCover;
