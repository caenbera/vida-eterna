import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import SideMap from '../components/SideMap';
import ReflectionBox from '../components/ReflectionBox';
import LinkTooltip from '../components/LinkTooltip';

const StudyPlayer = () => {
  const { studyId } = useParams();
  const navigate = useNavigate();
  const [study, setStudy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeUnitId, setActiveUnitId] = useState('');
  const [readUnits, setReadUnits] = useState({});
  const [activeAccordion, setActiveAccordion] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load study from DB or local JSON
  useEffect(() => {
    const loadStudy = async () => {
      setLoading(true);
      try {
        if (db) {
          const docRef = doc(db, 'studies', studyId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setStudy({ id: studyId, ...data });
            initializeUnits(data);
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error("Firestore get error: ", error);
      }

      // Fallback
      try {
        const response = await fetch('/studies.json');
        const data = await response.json();
        const found = data.find(s => s.id === studyId);
        if (found) {
          setStudy(found);
          initializeUnits(found);
        } else {
          console.error("Study not found locally");
          navigate('/');
        }
      } catch (error) {
        console.error("Local JSON fetch error: ", error);
        navigate('/');
      }
      setLoading(false);
    };

    loadStudy();
  }, [studyId]);

  // Load progress from localStorage
  useEffect(() => {
    const progressKey = `vida_eterna_progress_${studyId}`;
    const saved = localStorage.getItem(progressKey);
    if (saved) {
      setReadUnits(JSON.parse(saved));
    } else {
      setReadUnits({});
    }
  }, [studyId]);

  const initializeUnits = (studyData) => {
    if (studyData.units && studyData.units.length > 0) {
      setActiveUnitId(studyData.units[0].id);
      
      // Auto mark first unit as read
      markUnitAsRead(studyData.units[0].id);
    }
  };

  const markUnitAsRead = (unitId) => {
    setReadUnits(prev => {
      const updated = { ...prev, [unitId]: true };
      const progressKey = `vida_eterna_progress_${studyId}`;
      localStorage.setItem(progressKey, JSON.stringify(updated));
      return updated;
    });
  };

  const handleSelectUnit = (unitId) => {
    setActiveUnitId(unitId);
    markUnitAsRead(unitId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleAccordion = (accKey) => {
    setActiveAccordion(prev => ({
      ...prev,
      [accKey]: !prev[accKey]
    }));
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', fontFamily: 'Cinzel, serif', fontSize: '1.2rem', color: 'var(--azul-real)' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
        Cargando Estudio...
      </div>
    );
  }

  if (!study) return null;

  // Add virtual Integrated view unit
  const unitsWithIntegrated = [...(study.units || [])];
  if (study.units && study.units.length > 1) {
    unitsWithIntegrated.push({
      id: 'integrado',
      title: 'Vista Integral',
      elements: study.units.reduce((acc, u) => [...acc, ...u.elements], [])
    });
  }

  const activeUnit = unitsWithIntegrated.find(u => u.id === activeUnitId);

  return (
    <div>
      <header>
        <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 100 }}>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/')}
            style={{ padding: '8px 16px', fontSize: '0.8rem' }}
          >
            <i className="fa-solid fa-arrow-left"></i>
            Biblioteca
          </button>
        </div>
        <h1>{study.title}</h1>
        <p className="subtitle">{study.subtitle}</p>
      </header>

      {/* Menú Hamburguesa Móvil */}
      <button 
        className={`menu-toggle ${mobileMenuOpen ? 'active' : ''}`} 
        onClick={toggleMobileMenu}
      >
        <span></span><span></span><span></span>
      </button>

      {/* Menú Móvil Drawer */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'active' : ''}`}>
        {unitsWithIntegrated.map((unit, index) => (
          <button
            key={unit.id}
            className={`study-nav-btn ${unit.id === activeUnitId ? 'active' : ''}`}
            onClick={() => handleSelectUnit(unit.id)}
          >
            {unit.id === 'integrado' ? '📜 ' : `${index + 1}. `}
            {unit.title}
          </button>
        ))}
      </div>

      <div className="main-container">
        {/* Navegación Superior Desktop */}
        <nav className="study-nav">
          {unitsWithIntegrated.map((unit, index) => (
            <button
              key={unit.id}
              className={`study-nav-btn ${unit.id === activeUnitId ? 'active' : ''}`}
              onClick={() => handleSelectUnit(unit.id)}
            >
              {unit.id === 'integrado' ? '📜 ' : `${index + 1}. `}
              {unit.title}
            </button>
          ))}
        </nav>

        <div className="player-layout">
          <div className="player-main">
            {activeUnit && (
              <div className="unit-card">
                <button 
                  className="btn-primary print-btn-top" 
                  onClick={() => window.print()}
                  style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                >
                  <i className="fa-solid fa-download"></i> Descargar PDF
                </button>

                <h2>{activeUnit.title}</h2>

                {activeUnit.logicBase && (
                  <div className="logic-base">
                    <strong>Base Lógica:</strong>
                    <LinkTooltip text={activeUnit.logicBase} />
                  </div>
                )}

                {activeUnit.thesis && (
                  <div className="thesis-box">
                    <LinkTooltip text={activeUnit.thesis} />
                  </div>
                )}

                {/* Render Elements */}
                {activeUnit.elements && activeUnit.elements.map((elem, idx) => {
                  const uniqueKey = `${activeUnitId}_elem_${idx}`;

                  if (elem.type === 'paragraph') {
                    return (
                      <p key={uniqueKey} style={{ marginBottom: '20px', textAlign: 'justify' }}>
                        <LinkTooltip text={elem.content} />
                      </p>
                    );
                  }

                  if (elem.type === 'bible-verse') {
                    return (
                      <div key={uniqueKey} className="bible-verse">
                        <strong className="verse-ref">{elem.reference}</strong>
                        <LinkTooltip text={elem.text} />
                        {elem.context && (
                          <span className="verse-context">
                            <LinkTooltip text={elem.context} />
                          </span>
                        )}
                      </div>
                    );
                  }

                  if (elem.type === 'question') {
                    return (
                      <div key={uniqueKey} className="question-block">
                        <div className="question-title">
                          <span>❓ {elem.title}</span>
                          {elem.badge && (
                            <span className={`level-badge ${elem.badgeType || 'level-semilla'}`}>
                              {elem.badge}
                            </span>
                          )}
                        </div>

                        <div className="answer-section">
                          <LinkTooltip text={elem.explanation} />
                        </div>

                        {elem.childExplanation && (
                          <div className="accordion">
                            <div 
                              className="accordion-header" 
                              onClick={() => toggleAccordion(`${uniqueKey}_kids`)}
                            >
                              🎨 Ver Explicación Sencilla (para niños)
                              <i className={`fa-solid ${activeAccordion[`${uniqueKey}_kids`] ? 'fa-minus' : 'fa-plus'}`}></i>
                            </div>
                            {activeAccordion[`${uniqueKey}_kids`] && (
                              <div className="accordion-content">
                                <div className="illustration-box">
                                  <h4>👦 Para Niños:</h4>
                                  <LinkTooltip text={elem.childExplanation} />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {(elem.reflectionAdult || elem.reflectionChild) && (
                          <ReflectionBox
                            studyId={studyId}
                            unitId={activeUnitId}
                            questionId={idx}
                            reflectionAdult={elem.reflectionAdult}
                            reflectionChild={elem.reflectionChild}
                          />
                        )}

                        {elem.connection && (
                          <div className="connection-box">
                            <strong>🔗 Análisis de Conexión:</strong>
                            <LinkTooltip text={elem.connection} />
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (elem.type === 'accordion') {
                    return (
                      <div key={uniqueKey} className="accordion">
                        <div 
                          className="accordion-header" 
                          onClick={() => toggleAccordion(uniqueKey)}
                          style={{ backgroundColor: 'var(--azul-real)', border: 'none', color: 'var(--oro)' }}
                        >
                          📚 {elem.title}
                          <i className={`fa-solid ${activeAccordion[uniqueKey] ? 'fa-minus' : 'fa-plus'}`}></i>
                        </div>
                        {activeAccordion[uniqueKey] && (
                          <div className="accordion-content" style={{ backgroundColor: 'var(--crema)' }}>
                            <LinkTooltip text={elem.content} />
                          </div>
                        )}
                      </div>
                    );
                  }

                  return null;
                })}

                {activeUnit.whyMatters && (
                  <div className="why-matters">
                    <strong>¿Por qué esto es fundamental?</strong>
                    <LinkTooltip text={activeUnit.whyMatters} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Menú de progreso lateral */}
          {activeUnitId !== 'integrado' && (
            <SideMap
              units={study.units || []}
              currentUnitId={activeUnitId}
              onSelectUnit={handleSelectUnit}
              readUnits={readUnits}
            />
          )}
        </div>
      </div>

      <footer>
        <p>Vida Eterna - Biblioteca de Investigación Bíblica</p>
      </footer>
    </div>
  );
};

export default StudyPlayer;
