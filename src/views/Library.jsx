import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import InstallPrompt from '../components/InstallPrompt';

const CATEGORIES = [
  { id: 'deidad', name: 'La Deidad y la Persona de Cristo', icon: 'fa-crown' },
  { id: 'salvacion', name: 'Salvación y Justicia por la Fe', icon: 'fa-cross' },
  { id: 'profecia', name: 'Estudios Proféticos y Eventos Finales', icon: 'fa-fire' }
];

const Library = () => {
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('deidad');
  const navigate = useNavigate();

  useEffect(() => {
    const loadStudies = async () => {
      try {
        if (db) {
          // Attempt loading from Firestore if Firebase is active
          const q = query(collection(db, 'studies'), orderBy('title'));
          const querySnapshot = await getDocs(q);
          const list = [];
          querySnapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() });
          });
          if (list.length > 0) {
            setStudies(list);
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error("Error fetching studies from Firestore: ", error);
      }

      // Fallback: load from public/studies.json
      try {
        const response = await fetch('/studies.json');
        const data = await response.json();
        setStudies(data);
      } catch (error) {
        console.error("Error loading local studies JSON: ", error);
      }
      setLoading(false);
    };

    loadStudies();
  }, []);

  const handleStudyClick = (study) => {
    if (study.status === 'proximamente') return;
    navigate(`/study/${study.id}`);
  };

  const toggleCategory = (catId) => {
    setActiveCategory(activeCategory === catId ? null : catId);
  };

  // Filter studies based on search query
  const filteredStudies = studies.filter(s => {
    const q = searchQuery.toLowerCase();
    const titleMatch = s.title?.toLowerCase().includes(q);
    const subtitleMatch = s.subtitle?.toLowerCase().includes(q);
    return titleMatch || subtitleMatch;
  });

  return (
    <div>
      <header>
        <img src="/logo.png" alt="Vida Eterna Logo" className="logo-header" />
        <p className="subtitle">Biblioteca de Estudios Bíblicos Sistemáticos</p>
      </header>

      <div className="search-container">
        <input
          type="text"
          className="search-box"
          placeholder="Buscar estudios por tema... (ej: 'Justicia', 'Hijo', 'Consolador')"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="main-container">
        <InstallPrompt />

        {/* Sección Destacados */}
        {!searchQuery && (
          <div className="featured-section">
            <h2 style={{ fontFamily: 'Cinzel, serif', color: 'var(--oro)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.6rem' }}>
              <i className="fa-solid fa-star"></i> Estudios Fundamentales
            </h2>
            <p style={{ opacity: 0.9, fontStyle: 'italic', marginBottom: '20px' }}>Comienza aquí tu viaje de descubrimiento.</p>
            
            <div className="featured-grid">
              <div className="featured-card" onClick={() => navigate('/study/la-divinidad---copia')}>
                <h3>La Divinidad</h3>
                <p style={{ fontSize: '0.9rem', color: '#eee' }}>Clarificando la relación eterna entre el Padre y el Hijo. Respuestas a objeciones tradicionales.</p>
              </div>
              <div className="featured-card" onClick={() => navigate('/study/otro-consolador')}>
                <h3>El Otro Consolador</h3>
                <p style={{ fontSize: '0.9rem', color: '#eee' }}>Estudio por descubrimiento sobre el Espíritu de Cristo en nosotros según Juan 14-17.</p>
              </div>
              <div className="featured-card" onClick={() => navigate('/study/la-identidad-del-hijo')}>
                <h3>La Identidad del Hijo</h3>
                <p style={{ fontSize: '0.9rem', color: '#eee' }}>Análisis exegético sobre el significado del anticristo y la filiación divina literal.</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'Cinzel, serif', fontSize: '1.2rem', color: 'var(--azul-real)' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
            Cargando Biblioteca...
          </div>
        ) : (
          CATEGORIES.map((cat) => {
            const catStudies = filteredStudies.filter(s => s.category === cat.id);
            const isCategoryActive = activeCategory === cat.id;

            if (searchQuery && catStudies.length === 0) return null;

            return (
              <div key={cat.id} className={`category-section ${isCategoryActive ? 'active' : ''}`}>
                <div className="category-header" onClick={() => toggleCategory(cat.id)}>
                  <span>
                    <i className={`fa-solid ${cat.icon}`} style={{ marginRight: '12px' }}></i>
                    {cat.name}
                  </span>
                  <i className={`fa-solid fa-chevron-down chevron`} style={{ fontSize: '1.1rem' }}></i>
                </div>
                
                {isCategoryActive && (
                  <div className="category-content">
                    <div className="studies-grid">
                      {catStudies.map((study) => (
                        <div
                          key={study.id}
                          className={`study-card-item ${study.status === 'proximamente' ? 'coming-soon' : ''}`}
                          onClick={() => handleStudyClick(study)}
                        >
                          {study.status === 'proximamente' && (
                            <span className="badge-soon">PRÓXIMAMENTE</span>
                          )}
                          <span className="study-icon">
                            <i className={`fa-solid ${study.icon || 'fa-book'}`}></i>
                          </span>
                          <div className="study-title">{study.title}</div>
                          <div className="study-desc">{study.subtitle}</div>
                          <span className="study-tag">
                            {study.category.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <footer>
        <p>Vida Eterna - Biblioteca de Investigación Bíblica</p>
        <p style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--oro)' }}>
          "Y esta es la vida eterna: que te conozcan a ti, el único Dios verdadero, y a Jesucristo, a quien has enviado." - Juan 17:3
        </p>
      </footer>
    </div>
  );
};

export default Library;
