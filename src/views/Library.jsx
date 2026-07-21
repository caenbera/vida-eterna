import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import InstallPrompt from '../components/InstallPrompt';

const CATEGORIES = [
  { id: 'deidad', name: 'La Deidad y la Persona de Cristo', icon: 'fa-crown' },
  { id: 'salvacion', name: 'Salvación y Justicia', icon: 'fa-cross' },
  { id: 'ley', name: 'La Ley y los Dos Pactos', icon: 'fa-scroll' },
  { id: 'cruz', name: 'Cristo y el Significado de la Cruz', icon: 'fa-cross' },
  { id: 'profecia', name: 'Profecía y Eventos Finales', icon: 'fa-cloud-sun' },
  { id: 'vida', name: 'Vida y Crecimiento Cristiano', icon: 'fa-seedling' },
  { id: 'doctrinas', name: 'Doctrinas y Administración Divina', icon: 'fa-university' },
  { id: 'reino', name: 'El Reino y el Evangelio', icon: 'fa-crown' }
];

const TEMPLATE_STUDIES = [
  // 1. Deidad y Persona de Cristo
  { id: 'la-divinidad', title: 'La Divinidad (The Godhead)', subtitle: 'Clarificando los temas fundamentales sobre la naturaleza de Dios y la identidad del Hijo.', icon: 'fa-infinity', category: 'deidad', status: 'proximamente', tag: 'FUNDAMENTAL' },
  { id: 'los-dos-adanes', title: 'Los Dos Adanes', subtitle: 'Adán terrenal vs. Adán celestial. La naturaleza humana y divina en Cristo.', icon: 'fa-users', category: 'deidad', status: 'proximamente', tag: 'CRISTOLOGÍA' },
  { id: 'por-que-jesus-nunca-peco', title: '¿Por qué Jesús Nunca Pecó?', subtitle: 'La naturaleza pecaminosa vs. la naturaleza divina en la humanidad de Cristo.', icon: 'fa-question-circle', category: 'deidad', status: 'proximamente' },
  { id: 'totalmente-humano-totalmente-divino', title: 'Totalmente Humano, Totalmente Divino', subtitle: 'La unión hipostática y la realidad de la encarnación.', icon: 'fa-balance-scale', category: 'deidad', status: 'proximamente' },
  { id: 'el-espiritu-de-god', title: 'El Espíritu de Dios / El Espíritu Santo', subtitle: 'La presencia y poder del Creador, no una tercera persona separada.', icon: 'fa-dove', category: 'deidad', status: 'proximamente' },
  { id: 'raices-de-la-trinidad', title: 'Raíces de la Trinidad', subtitle: 'Origen histórico de la doctrina trinitaria y sus implicaciones proféticas.', icon: 'fa-tree', category: 'deidad', status: 'proximamente' },
  { id: 'el-espiritu-del-anticristo', title: 'El Espíritu del Anticristo', subtitle: 'Identificando el sistema que niega la relación real entre Padre e Hijo.', icon: 'fa-exclamation-triangle', category: 'deidad', status: 'proximamente' },
  { id: 'la-omega', title: 'La Omega', subtitle: 'Los eventos finales y la culminación del conflicto entre Cristo y Satanás.', icon: 'fa-clock', category: 'deidad', status: 'proximamente' },
  
  // 2. Salvacion y Justicia
  { id: 'la-naturaleza-de-la-salvacion', title: 'La Naturaleza de la Salvación', subtitle: 'Salvación como transformación real, no solo declaración legal.', icon: 'fa-heart', category: 'salvacion', status: 'proximamente' },
  { id: 'justicia-por-la-fe', title: 'Justicia por la Fe', subtitle: 'La imputación vs. la impartición. Cristo en nosotros, nuestra justicia.', icon: 'fa-sun', category: 'salvacion', status: 'proximamente', tag: 'ESENCIAL' },
  { id: 'justicia-en-cristo', title: 'Justicia en Cristo', subtitle: 'Vivir la vida del Hijo mediante fe.', icon: 'fa-award', category: 'salvacion', status: 'proximamente' },
  { id: 'la-naturaleza-del-pecado', title: 'La Naturaleza del Pecado', subtitle: 'Entendiendo el origen y la realidad del pecado desde la perspectiva bíblica.', icon: 'fa-ban', category: 'salvacion', status: 'proximamente' },
  { id: 'la-naturaleza-de-la-justicia', title: 'La Naturaleza de la Justicia', subtitle: 'Cumplimiento de la ley mediante el Espíritu.', icon: 'fa-check-circle', category: 'salvacion', status: 'proximamente' },
  { id: 'entrega-surrender', title: 'Entrega (Surrender)', subtitle: 'La condición para recibir el Espíritu y la victoria.', icon: 'fa-hand-holding-heart', category: 'salvacion', status: 'proximamente', tag: 'PRÁCTICO' },
  { id: 'el-perdon-y-la-justicia', title: 'El Perdón y la Justicia', subtitle: 'Cómo Dios puede ser justo y justificador al mismo tiempo.', icon: 'fa-gavel', category: 'salvacion', status: 'proximamente' },
  { id: 'el-fruto-del-evangelio', title: 'El Fruto del Evangelio', subtitle: 'Manifestaciones prácticas del Evangelio vivido.', icon: 'fa-apple-alt', category: 'salvacion', status: 'proximamente' },
  { id: 'sin-pecado-o-con-menos-pecado', title: '¿Sin Pecado o Con Menos Pecado?', subtitle: 'La santificación y la victoria sobre el pecado en la vida cristiana.', icon: 'fa-tint', category: 'salvacion', status: 'proximamente' },

  // 3. Ley y Pactos
  { id: 'la-maldicion-de-la-ley', title: 'La Maldición de la Ley', subtitle: 'Cómo la ley del pecado y muerte fue quebrada en la cruz.', icon: 'fa-link', category: 'ley', status: 'proximamente' },
  { id: 'el-cristiano-y-la-ley', title: 'El Cristiano y la Ley', subtitle: 'La relación del creyente con la ley moral de Dios bajo el Nuevo Pacto.', icon: 'fa-book-open', category: 'ley', status: 'proximamente' },
  { id: 'los-dos-pactos', title: 'Los Dos Pactos', subtitle: 'Contraste entre el pacto de obras (Sinaí) y el pacto de gracia (Cristo).', icon: 'fa-columns', category: 'ley', status: 'proximamente', tag: 'FUNDAMENTAL' },
  { id: 'la-ley-del-espiritu', title: 'La Ley del Espíritu', subtitle: 'Libertad en Cristo vs. la esclavitud de la letra.', icon: 'fa-wind', category: 'ley', status: 'proximamente' },
  { id: 'el-dominio-de-la-ley', title: 'El Dominio de la Ley', subtitle: 'Hasta cuando tiene jurisdicción la ley sobre el hombre.', icon: 'fa-crown', category: 'ley', status: 'proximamente' },
  { id: 'el-uso-legitimo-de-la-ley', title: 'El Uso Legítimo de la Ley', subtitle: '1 Timoteo 1:8 - El uso correcto de la Torah para el creyente justificado.', icon: 'fa-balance-scale-right', category: 'ley', status: 'proximamente' },
  { id: 'el-objetivo-de-la-ley', title: 'El Objetivo de la Ley', subtitle: 'Cristo como cumplimiento y fin de la ley para justicia.', icon: 'fa-bullseye', category: 'ley', status: 'proximamente' },
  { id: 'la-maldicion-rota', title: 'La Maldición Rota', subtitle: 'Redención de la maldición de la ley por medio de Cristo.', icon: 'fa-unlink', category: 'ley', status: 'proximamente' },

  // 4. Cristo y la Cruz
  { id: 'por-que-jesus-tenia-que-morir', title: '¿Por qué Jesús Tenía que Morir?', subtitle: 'La necesidad soteriológica de la muerte vicaria.', icon: 'fa-question', category: 'cruz', status: 'proximamente', tag: 'CRUZ' },
  { id: 'el-significado-de-la-cruz', title: 'El Significado de la Cruz', subtitle: 'Más allá del perdón: la cruz como revelación del carácter de Dios.', icon: 'fa-plus', category: 'cruz', status: 'proximamente' },
  { id: 'la-gloria-de-la-cruz', title: 'La Gloria de la Cruz', subtitle: 'El poder del evangelio manifestado en el escándalo de la cruz.', icon: 'fa-star', category: 'cruz', status: 'proximamente' },
  { id: 'tipo-versus-antitipo', title: 'Tipo versus Antitipo', subtitle: 'Cumplimiento de las sombras del Antiguo Testamento en Cristo.', icon: 'fa-yin-yang', category: 'cruz', status: 'proximamente' },
  { id: 'el-santuario-en-hebreos-9', title: 'El Santuario en Hebreos 9', subtitle: 'El ministerio celestial de Cristo y la expiación final.', icon: 'fa-church', category: 'cruz', status: 'proximamente', tag: 'SANTUARIO' },

  // 5. Profecia
  { id: 'las-virgenes-insensatas', title: 'Las Vírgenes Insensatas', subtitle: 'La preparación para la venida del Esposo y la crisis final.', icon: 'fa-lightbulb', category: 'profecia', status: 'proximamente' },
  { id: 'no-otros-dioses', title: 'No Otros Dioses', subtitle: 'El primer mandamiento en el contexto de los últimos días.', icon: 'fa-ban', category: 'profecia', status: 'proximamente' },
  { id: 'el-retorno-del-4to-angel', title: 'El Retorno del 4to Ángel', subtitle: 'El mensaje de los cuatro ángeles y su culminación.', icon: 'fa-fire', category: 'profecia', status: 'proximamente' },
  { id: 'sodoma-y-la-bestia', title: 'Sodoma y la Bestia', subtitle: 'Apocalipsis 13 y 17: identificando la bestia que sube del abismo y su conexión con Sodoma.', icon: 'fa-dragon', category: 'profecia', status: 'proximamente', tag: 'PROFECÍA' },

  // 6. Vida Cristiana
  { id: 'justo-lo-que-necesitamos', title: 'Justo lo que Necesitamos', subtitle: 'Provisiones divinas para la vida diaria.', icon: 'fa-gift', category: 'vida', status: 'proximamente' },
  { id: 'el-corazon-de-god', title: 'El Corazón de Dios', subtitle: 'Conociendo el carácter amoroso del Padre.', icon: 'fa-heart', category: 'vida', status: 'proximamente' },
  { id: 'vida-eternal', title: 'Vida', subtitle: 'La vida eterna como conocimiento de Dios.', icon: 'fa-heartbeat', category: 'vida', status: 'proximamente' },
  { id: 'el-conocimiento-del-bien-y-del-mal', title: 'El Conocimiento del Bien y del Mal', subtitle: 'Las consecuencias de la independencia humana.', icon: 'fa-tree', category: 'vida', status: 'proximamente' },
  { id: 'perfeccion-relativa', title: 'Perfección Relativa', subtitle: 'Crecimiento continuo en la gracia.', icon: 'fa-chart-line', category: 'vida', status: 'proximamente' },
  { id: 'que-debo-hacer', title: '¿Qué Debo Hacer?', subtitle: 'Pasos prácticos para la salvación y santificación.', icon: 'fa-walking', category: 'vida', status: 'proximamente' },
  { id: 'la-nueva-creacion', title: 'La Nueva Creación', subtitle: '2 Corintios 5:17 - Vida en el Espíritu.', icon: 'fa-leaf', category: 'vida', status: 'proximamente' },
  { id: 'la-meta-verdadera-de-la-vida', title: 'La Meta Verdadera de la Vida', subtitle: 'Descubriendo el propósito eterno.', icon: 'fa-mountain', category: 'vida', status: 'proximamente' },

  // 7. Doctrinas y Administracion
  { id: 'clarificando-los-temas', title: 'Clarificando los Temas', subtitle: 'Respuestas a confusiones doctrinales comunes.', icon: 'fa-lightbulb', category: 'doctrinas', status: 'proximamente' },
  { id: 'respuestas-a-objeciones-trinitarias', title: 'Respuestas a Objeciones Trinitarias', subtitle: 'Defensa bíblica de la unidad de Dios.', icon: 'fa-comments', category: 'doctrinas', status: 'proximamente' },
  { id: 'el-apellido-de-god', title: 'El Apellido de Dios', subtitle: 'El significado del nombre divino y su revelación.', icon: 'fa-signature', category: 'doctrinas', status: 'proximamente' },
  { id: 'en-cristo', title: 'En Cristo', subtitle: 'La posición del creyente en el Mediador.', icon: 'fa-anchor', category: 'doctrinas', status: 'proximamente' },
  { id: 'el-dios-de-la-biblia', title: 'El Dios de la Biblia', subtitle: 'Revelación del carácter divino.', icon: 'fa-book', category: 'doctrinas', status: 'proximamente' },
  { id: 'la-administracion-de-god', title: 'La Administración de Dios', subtitle: 'El gobierno divino en la iglesia y el mundo.', icon: 'fa-sitemap', category: 'doctrinas', status: 'proximamente' },
  { id: 'principios-fundamentales', title: 'Principios Fundamentales', subtitle: 'Doctrinas básicas del cristianismo bíblico.', icon: 'fa-cube', category: 'doctrinas', status: 'proximamente' },
  { id: 'un-pueblo-sin-rey', title: 'Un Pueblo sin Rey', subtitle: 'Judges 17:6 - Las consecuencias del relativismo.', icon: 'fa-users-slash', category: 'doctrinas', status: 'proximamente' },
  { id: 'el-juicio-de-cristo', title: 'El Juicio de Cristo', subtitle: 'El tribunal de Cristo y la recompensa del creyente.', icon: 'fa-gavel', category: 'doctrinas', status: 'proximamente' },

  // 8. Reino y Evangelio
  { id: 'el-reino-de-god', title: 'El Reino de Dios', subtitle: 'La soberanía divina establecida en el corazón.', icon: 'fa-crown', category: 'reino', status: 'proximamente' },
  { id: 'el-evangelio-eterno', title: 'El Evangelio Eterno', subtitle: 'El mensaje que perdura desde la caída hasta el fin.', icon: 'fa-globe', category: 'reino', status: 'proximamente', tag: 'APOCALIPSIS 14' },
  { id: 'los-tres-evangelios', title: 'Los Tres Evangelios', subtitle: 'Distinciones entre los evangelios del reino, de la gracia, y de la gloria.', icon: 'fa-th', category: 'reino', status: 'proximamente' },
  { id: 'la-verdad-del-evangelio', title: 'La Verdad del Evangelio', subtitle: 'Defendiendo el evangelio de la gracia contra las distorsiones legales.', icon: 'fa-check-double', category: 'reino', status: 'proximamente' },
  { id: 'un-camino-mas-excelente', title: 'Un Camino más Excelente', subtitle: '1 Corintios 12:31 - El camino del amor.', icon: 'fa-road', category: 'reino', status: 'proximamente' }
];

// Helper to normalize strings for robust comparison
const cleanString = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // removes accents
    .replace(/[^a-z0-9]/g, '');      // keeps only alphanumeric
};

const Library = () => {
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null); // All closed by default
  const navigate = useNavigate();

  // Maps database IDs to template IDs
  const ID_MAPPINGS = {
    'la-divinidad---copia': 'la-divinidad',
    'sodoma-bestia': 'sodoma-y-la-bestia',
    'otro-consolador': 'el-espiritu-de-god',
    'la-identidad-del-hijo': 'el-espiritu-del-anticristo'
  };

  useEffect(() => {
    const loadStudies = async () => {
      let dbStudies = [];
      try {
        if (db) {
          const q = query(collection(db, 'studies'), orderBy('title'));
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            dbStudies.push({ id: doc.id, ...doc.data() });
          });
        }
      } catch (error) {
        console.error("Error fetching studies from Firestore: ", error);
      }

      // Load local JSON if Firestore is empty or inactive
      if (dbStudies.length === 0) {
        try {
          const response = await fetch('/studies.json');
          dbStudies = await response.json();
        } catch (error) {
          console.error("Error loading local studies JSON: ", error);
        }
      }

      // Merge Predefined Template with Loaded Studies
      const mergedList = [...TEMPLATE_STUDIES].map(tpl => {
        // Find matching study by ID mapping, direct ID, or title
        const dbMatch = dbStudies.find(dbS => {
          const mappedTplId = ID_MAPPINGS[dbS.id];
          return (
            dbS.id === tpl.id ||
            mappedTplId === tpl.id ||
            cleanString(dbS.title) === cleanString(tpl.title)
          );
        });

        if (dbMatch) {
          // Keep template details but unlock study
          return {
            ...tpl,
            id: dbMatch.id, // Use actual DB id for routing
            status: 'publicado',
            title: dbMatch.title || tpl.title,
            subtitle: dbMatch.subtitle || tpl.subtitle
          };
        }
        return tpl;
      });

      // Also append any extra studies from DB that don't match any template card
      dbStudies.forEach(dbS => {
        const isMatched = TEMPLATE_STUDIES.some(tpl => {
          const mappedTplId = ID_MAPPINGS[dbS.id];
          return (
            dbS.id === tpl.id ||
            mappedTplId === tpl.id ||
            cleanString(dbS.title) === cleanString(tpl.title)
          );
        });

        if (!isMatched) {
          mergedList.push({
            id: dbS.id,
            title: dbS.title,
            subtitle: dbS.subtitle || 'Estudio bíblico adicional.',
            icon: dbS.icon || 'fa-book',
            category: dbS.category || 'deidad',
            status: 'publicado'
          });
        }
      });

      setStudies(mergedList);
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
                          {study.tag && (
                            <span className="study-tag">
                              {study.tag}
                            </span>
                          )}
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
