import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';

const AdminDashboard = () => {
  const [studies, setStudies] = useState([]);
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rawJson, setRawJson] = useState('');
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [notification, setNotification] = useState('');
  
  // States for metadata editing
  const [metaTitle, setMetaTitle] = useState('');
  const [metaSubtitle, setMetaSubtitle] = useState('');
  const [metaCategory, setMetaCategory] = useState('deidad');
  const [metaIcon, setMetaIcon] = useState('fa-book');
  const [metaStatus, setMetaStatus] = useState('publicado');

  // Tooltip & Link insertion helpers
  const [selectedText, setSelectedText] = useState('');
  const [tooltipDef, setTooltipDef] = useState('');
  const [tooltipType, setTooltipType] = useState('highlight-divine');
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [activeEditorField, setActiveEditorField] = useState({ unitIdx: null, elemIdx: null, field: null });

  const navigate = useNavigate();

  // Guard to verify login
  useEffect(() => {
    if (auth) {
      // Firebase auth check
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (!user) {
          navigate('/login');
        }
      });
      return () => unsubscribe();
    } else {
      // Session storage check
      const authLocal = sessionStorage.getItem('vida_eterna_admin_auth');
      if (authLocal !== 'true') {
        navigate('/login');
      }
    }
  }, [navigate]);

  // Load studies
  useEffect(() => {
    loadStudies();
  }, []);

  const loadStudies = async () => {
    setLoading(true);
    try {
      const response = await fetch('/studies.json');
      const data = await response.json();
      setStudies(data);
    } catch (error) {
      console.error("Error loading local studies JSON: ", error);
      setNotification('Error al cargar la base de datos local.');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    if (auth) {
      auth.signOut();
    } else {
      sessionStorage.removeItem('vida_eterna_admin_auth');
    }
    navigate('/login');
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  // 1. Database level: Save changes (Firestore or JSON download)
  const saveDatabase = async (updatedStudies = studies) => {
    setStudies(updatedStudies);
    
    // Attempt Firebase sync
    if (db) {
      try {
        for (const study of updatedStudies) {
          await setDoc(doc(db, 'studies', study.id), study);
        }
        showNotification('Base de datos sincronizada con Firebase Firestore.');
      } catch (err) {
        console.error("Firestore sync error: ", err);
        showNotification('Guardado localmente. Error al sincronizar con Firebase.');
      }
    } else {
      // Download updated JSON file helper
      downloadJson(updatedStudies);
    }
  };

  const downloadJson = (data) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonToString(data));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "studies.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification('Cambios aplicados. Descarga del archivo studies.json iniciada.');
  };

  const jsonToString = (obj) => {
    return JSON.stringify(obj, null, 2);
  };

  // 2. Study Management (Create, Edit Metadata, Delete)
  const handleCreateStudy = () => {
    const newId = `nuevo-estudio-${Date.now()}`;
    const newStudy = {
      id: newId,
      title: 'Nuevo Estudio Bíblico',
      subtitle: 'Descripción corta del estudio.',
      icon: 'fa-book',
      category: 'deidad',
      status: 'publicado',
      units: [
        {
          id: 'u1',
          title: 'Unidad 1',
          logicBase: '',
          thesis: '',
          whyMatters: '',
          elements: []
        }
      ]
    };
    
    const updated = [...studies, newStudy];
    saveDatabase(updated);
    setSelectedStudy(newStudy);
    showNotification('Estudio creado.');
  };

  const handleDeleteStudy = async (studyId) => {
    if (!window.confirm('¿Está seguro de eliminar este estudio permanentemente?')) return;
    
    const updated = studies.filter(s => s.id !== studyId);
    
    if (db) {
      try {
        await deleteDoc(doc(db, 'studies', studyId));
      } catch (err) {
        console.error("Error deleting from Firestore: ", err);
      }
    }
    
    saveDatabase(updated);
    if (selectedStudy && selectedStudy.id === studyId) {
      setSelectedStudy(null);
    }
    showNotification('Estudio eliminado.');
  };

  const openMetadataEditor = (study) => {
    setMetaTitle(study.title);
    setMetaSubtitle(study.subtitle);
    setMetaCategory(study.category);
    setMetaIcon(study.icon || 'fa-book');
    setMetaStatus(study.status || 'publicado');
    setIsEditingMetadata(true);
  };

  const handleSaveMetadata = () => {
    const updated = studies.map(s => {
      if (s.id === selectedStudy.id) {
        const updatedStudy = {
          ...s,
          title: metaTitle,
          subtitle: metaSubtitle,
          category: metaCategory,
          icon: metaIcon,
          status: metaStatus
        };
        setSelectedStudy(updatedStudy);
        return updatedStudy;
      }
      return s;
    });
    
    saveDatabase(updated);
    setIsEditingMetadata(false);
    showNotification('Metadatos actualizados.');
  };

  // 3. JSON Import/Export
  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(rawJson);
      // Validate
      const toImport = Array.isArray(parsed) ? parsed : [parsed];
      
      let updated = [...studies];
      toImport.forEach(newStudy => {
        if (!newStudy.id || !newStudy.title) {
          throw new Error('Estructura de estudio inválida (falta id o título).');
        }
        // Remove existing if duplicate
        updated = updated.filter(s => s.id !== newStudy.id);
        updated.push(newStudy);
      });
      
      saveDatabase(updated);
      setRawJson('');
      showNotification('Estudio(s) importado(s) con éxito.');
      if (toImport.length === 1) {
        setSelectedStudy(toImport[0]);
      }
    } catch (e) {
      alert('Error en formato JSON: ' + e.message);
    }
  };

  // 4. Element Level Editing
  const updateStudyInDb = (updatedStudy) => {
    setSelectedStudy(updatedStudy);
    const updatedStudies = studies.map(s => s.id === updatedStudy.id ? updatedStudy : s);
    setStudies(updatedStudies);
  };

  // Add Unit
  const handleAddUnit = () => {
    const newUnitId = `u${(selectedStudy.units || []).length + 1}`;
    const newUnit = {
      id: newUnitId,
      title: `Nueva Unidad ${newUnitId.toUpperCase()}`,
      logicBase: '',
      thesis: '',
      whyMatters: '',
      elements: []
    };
    
    const updatedStudy = {
      ...selectedStudy,
      units: [...(selectedStudy.units || []), newUnit]
    };
    updateStudyInDb(updatedStudy);
  };

  // Delete Unit
  const handleDeleteUnit = (unitId) => {
    if (!window.confirm('¿Eliminar esta unidad y todos sus elementos?')) return;
    const updatedStudy = {
      ...selectedStudy,
      units: selectedStudy.units.filter(u => u.id !== unitId)
    };
    updateStudyInDb(updatedStudy);
  };

  // Add Block Element inside Unit
  const handleAddElement = (unitIdx, type) => {
    const newElement = { type };
    if (type === 'paragraph') {
      newElement.content = 'Escribe aquí tu párrafo de texto...';
    } else if (type === 'bible-verse') {
      newElement.reference = 'Juan 3:16';
      newElement.text = 'Escribe el texto del versículo aquí...';
      newElement.context = 'Introduce el contexto cursivo...';
    } else if (type === 'question') {
      newElement.title = '¿Cuál es la pregunta?';
      newElement.badge = 'Semilla';
      newElement.badgeType = 'level-semilla';
      newElement.explanation = 'Escribe el punto de vista explicado...';
      newElement.childExplanation = '';
      newElement.reflectionAdult = '';
      newElement.reflectionChild = '';
      newElement.connection = '';
    } else if (type === 'accordion') {
      newElement.title = 'Título del Acordeón';
      newElement.content = '<p>Contenido del acordeón...</p>';
    }

    const updatedUnits = [...selectedStudy.units];
    updatedUnits[unitIdx].elements = [...(updatedUnits[unitIdx].elements || []), newElement];
    
    updateStudyInDb({ ...selectedStudy, units: updatedUnits });
  };

  // Delete Element
  const handleDeleteElement = (unitIdx, elemIdx) => {
    if (!window.confirm('¿Eliminar este bloque?')) return;
    const updatedUnits = [...selectedStudy.units];
    updatedUnits[unitIdx].elements = updatedUnits[unitIdx].elements.filter((_, idx) => idx !== elemIdx);
    
    updateStudyInDb({ ...selectedStudy, units: updatedUnits });
  };

  // Update specific element value
  const handleElementChange = (unitIdx, elemIdx, field, val) => {
    const updatedUnits = [...selectedStudy.units];
    updatedUnits[unitIdx].elements[elemIdx][field] = val;
    updateStudyInDb({ ...selectedStudy, units: updatedUnits });
  };

  // Update unit text fields (logicBase, thesis, whyMatters, title)
  const handleUnitTextChange = (unitIdx, field, val) => {
    const updatedUnits = [...selectedStudy.units];
    updatedUnits[unitIdx][field] = val;
    updateStudyInDb({ ...selectedStudy, units: updatedUnits });
  };

  // Move element position (ordering)
  const handleMoveElement = (unitIdx, elemIdx, direction) => {
    const updatedUnits = [...selectedStudy.units];
    const arr = [...updatedUnits[unitIdx].elements];
    if (direction === 'up' && elemIdx > 0) {
      [arr[elemIdx], arr[elemIdx - 1]] = [arr[elemIdx - 1], arr[elemIdx]];
    } else if (direction === 'down' && elemIdx < arr.length - 1) {
      [arr[elemIdx], arr[elemIdx + 1]] = [arr[elemIdx + 1], arr[elemIdx]];
    }
    updatedUnits[unitIdx].elements = arr;
    updateStudyInDb({ ...selectedStudy, units: updatedUnits });
  };

  // Helper Tooltip Inserter
  const handleInsertTooltip = () => {
    if (!selectedText || !tooltipDef) return;
    const tooltipHtml = `<span class="tooltip ${tooltipType}">${selectedText}<span class="tooltiptext">${tooltipDef}</span></span>`;
    
    const { unitIdx, elemIdx, field } = activeEditorField;
    if (unitIdx !== null && elemIdx !== null && field !== null) {
      const updatedUnits = [...selectedStudy.units];
      const currentValue = updatedUnits[unitIdx].elements[elemIdx][field] || '';
      // Simple insertion helper
      updatedUnits[unitIdx].elements[elemIdx][field] = currentValue + tooltipHtml;
      updateStudyInDb({ ...selectedStudy, units: updatedUnits });
      
      // Reset states
      setSelectedText('');
      setTooltipDef('');
      showNotification('Tooltip insertado.');
    }
  };

  // Helper Footnote Link Inserter
  const handleInsertLink = () => {
    if (!linkText || !linkUrl) return;
    const linkMd = `[${linkText}](${linkUrl})`;
    
    const { unitIdx, elemIdx, field } = activeEditorField;
    if (unitIdx !== null && elemIdx !== null && field !== null) {
      const updatedUnits = [...selectedStudy.units];
      const currentValue = updatedUnits[unitIdx].elements[elemIdx][field] || '';
      updatedUnits[unitIdx].elements[elemIdx][field] = currentValue + linkMd;
      updateStudyInDb({ ...selectedStudy, units: updatedUnits });
      
      // Reset states
      setLinkText('');
      setLinkUrl('');
      showNotification('Enlace insertado.');
    }
  };

  return (
    <div className="main-container" style={{ marginTop: '40px' }}>
      
      {/* Cabecera del Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '3px solid var(--oro)', paddingBottom: '15px' }}>
        <div>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: '2rem', color: 'var(--azul-real)' }}>
            Panel de Administración - Vida Eterna
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>
            Gestiona la biblioteca de estudios y edita las citas de manera interactiva.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-primary" onClick={() => navigate('/')} style={{ padding: '10px 18px', fontSize: '0.8rem' }}>
            <i className="fa-solid fa-house"></i> Ir a la Web
          </button>
          <button className="btn-primary" onClick={handleLogout} style={{ padding: '10px 18px', fontSize: '0.8rem', background: '#ccc', color: 'var(--azul-real)' }}>
            <i className="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
          </button>
        </div>
      </div>

      {notification && (
        <div style={{ backgroundColor: '#f0f7f0', border: '2px solid var(--verde-ninos)', color: 'var(--texto)', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
          <i className="fa-solid fa-circle-check" style={{ marginRight: '8px', color: 'var(--verde-ninos)' }}></i>
          {notification}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
          <p style={{ marginTop: '10px', fontFamily: 'Cinzel, serif' }}>Cargando Panel...</p>
        </div>
      ) : (
        <div className="editor-layout">
          
          {/* FASE 1: Lista de Estudios Disponibles */}
          {!selectedStudy ? (
            <div className="admin-dashboard">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ border: 'none', margin: 0, padding: 0 }}>Listado de Estudios Bíblicos</h2>
                <button className="btn-primary" onClick={handleCreateStudy}>
                  <i className="fa-solid fa-plus"></i> Crear Nueva Tarjeta
                </button>
              </div>

              <div style={{ marginBottom: '30px' }}>
                {studies.map(study => (
                  <div key={study.id} className="admin-list-item">
                    <div>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--azul-real)' }}>{study.title}</strong>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>{study.subtitle}</div>
                      <span className="study-tag" style={{ marginTop: '5px' }}>{study.category}</span>
                    </div>
                    <div className="admin-list-actions">
                      <button className="btn-icon" title="Editar Contenido" onClick={() => setSelectedStudy(study)}>
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button className="btn-icon" title="Editar Metadatos" onClick={() => { setSelectedStudy(study); openMetadataEditor(study); }}>
                        <i className="fa-solid fa-gears"></i>
                      </button>
                      <button className="btn-icon delete" title="Eliminar" onClick={() => handleDeleteStudy(study.id)}>
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Importador/Exportador JSON */}
              <div style={{ borderTop: '2.5px solid var(--oro)', paddingTop: '25px' }}>
                <h3 style={{ fontFamily: 'Cinzel, serif', color: 'var(--azul-real)', marginBottom: '15px' }}>
                  <i className="fa-solid fa-file-import" style={{ marginRight: '8px' }}></i> Importar Estudio Completo (.JSON)
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '15px' }}>
                  Pega el código JSON de un estudio estructurado en el cuadro de abajo para subirlo o actualizarlo.
                </p>
                <textarea
                  className="form-input"
                  style={{ minHeight: '150px', fontFamily: 'monospace', fontSize: '0.85rem', marginBottom: '15px' }}
                  placeholder='Pega tu código JSON aquí...'
                  value={rawJson}
                  onChange={(e) => setRawJson(e.target.value)}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-primary" onClick={handleImportJson}>
                    Importar JSON
                  </button>
                  <button className="btn-primary" onClick={() => saveDatabase()} style={{ background: 'var(--azul-real)', color: 'var(--oro)' }}>
                    <i className="fa-solid fa-download"></i> Descargar Todo como studies.json
                  </button>
                </div>
              </div>
            </div>
          ) : (
            
            // FASE 2: Editor Interno del Estudio Seleccionado
            <div className="admin-dashboard">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid var(--oro)', paddingBottom: '10px' }}>
                <div>
                  <button className="btn-primary" onClick={() => { setSelectedStudy(null); setIsEditingMetadata(false); }} style={{ padding: '6px 14px', fontSize: '0.75rem', marginBottom: '10px', background: '#eee', color: 'var(--azul-real)' }}>
                    <i className="fa-solid fa-chevron-left"></i> Volver a la Lista
                  </button>
                  <h2 style={{ border: 'none', margin: 0, padding: 0 }}>
                    Editando: {selectedStudy.title}
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-primary" onClick={() => openMetadataEditor(selectedStudy)}>
                    <i className="fa-solid fa-gears"></i> Metadatos
                  </button>
                  <button className="btn-primary" onClick={() => saveDatabase()} style={{ background: 'var(--verde-ninos)', color: '#fff' }}>
                    <i className="fa-solid fa-floppy-disk"></i> Guardar Cambios
                  </button>
                </div>
              </div>

              {/* Modal de Metadatos */}
              {isEditingMetadata && (
                <div className="modal">
                  <div className="modal-content">
                    <div className="modal-header">Editar Metadatos del Estudio</div>
                    
                    <div className="form-group">
                      <label htmlFor="title">Título del Estudio</label>
                      <input id="title" type="text" className="form-input" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
                    </div>

                    <div className="form-group">
                      <label htmlFor="sub">Subtítulo</label>
                      <input id="sub" type="text" className="form-input" value={metaSubtitle} onChange={(e) => setMetaSubtitle(e.target.value)} />
                    </div>

                    <div className="form-group">
                      <label htmlFor="cat">Categoría</label>
                      <select id="cat" className="form-input" value={metaCategory} onChange={(e) => setMetaCategory(e.target.value)}>
                        <option value="deidad">La Deidad y Persona de Cristo</option>
                        <option value="salvacion">Salvación y Justicia por la Fe</option>
                        <option value="profecia">Estudios Proféticos</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="icon">Icono (FontAwesome Class)</label>
                      <input id="icon" type="text" className="form-input" value={metaIcon} onChange={(e) => setMetaIcon(e.target.value)} />
                    </div>

                    <div className="form-group">
                      <label htmlFor="status">Estado</label>
                      <select id="status" className="form-input" value={metaStatus} onChange={(e) => setMetaStatus(e.target.value)}>
                        <option value="publicado">Publicado</option>
                        <option value="proximamente">Próximamente</option>
                      </select>
                    </div>

                    <div className="modal-buttons">
                      <button className="modal-btn modal-close" onClick={() => setIsEditingMetadata(false)}>Cancelar</button>
                      <button className="modal-btn modal-save" onClick={handleSaveMetadata}>Actualizar</button>
                    </div>
                  </div>
                </div>
              )}

              {/* EDITOR DE UNIDADES */}
              <div style={{ marginTop: '25px' }}>
                <h3 style={{ fontFamily: 'Cinzel, serif', color: 'var(--azul-real)', marginBottom: '15px' }}>
                  Unidades del Estudio
                </h3>
                
                {selectedStudy.units && selectedStudy.units.map((unit, uIdx) => (
                  <div key={unit.id} style={{ border: '2px solid var(--oro)', borderRadius: '10px', padding: '25px', marginBottom: '30px', backgroundColor: 'var(--crema)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--oro)', paddingBottom: '8px' }}>
                      <strong style={{ fontSize: '1.2rem', fontFamily: 'Cinzel, serif', color: 'var(--azul-real)' }}>
                        Unidad {uIdx + 1}: {unit.title}
                      </strong>
                      <button className="save-note-btn" onClick={() => handleDeleteUnit(unit.id)} style={{ borderColor: 'var(--rojo-advertencia)', color: 'var(--rojo-advertencia)' }}>
                        <i className="fa-solid fa-trash"></i> Eliminar Unidad
                      </button>
                    </div>

                    {/* Unit fields */}
                    <div className="form-group">
                      <label>Título de la Unidad</label>
                      <input type="text" className="form-input" value={unit.title || ''} onChange={(e) => handleUnitTextChange(uIdx, 'title', e.target.value)} />
                    </div>

                    <div className="form-group">
                      <label>Base Lógica (opcional)</label>
                      <textarea className="form-input" style={{ minHeight: '80px' }} value={unit.logicBase || ''} onChange={(e) => handleUnitTextChange(uIdx, 'logicBase', e.target.value)} />
                    </div>

                    <div className="form-group">
                      <label>Tesis Central (opcional)</label>
                      <textarea className="form-input" style={{ minHeight: '80px' }} value={unit.thesis || ''} onChange={(e) => handleUnitTextChange(uIdx, 'thesis', e.target.value)} />
                    </div>

                    <div className="form-group">
                      <label>Síntesis Final / Por qué es fundamental (opcional)</label>
                      <textarea className="form-input" style={{ minHeight: '80px' }} value={unit.whyMatters || ''} onChange={(e) => handleUnitTextChange(uIdx, 'whyMatters', e.target.value)} />
                    </div>

                    {/* ELEMENTS LIST */}
                    <div style={{ marginTop: '20px', borderTop: '2px dashed var(--oro)', paddingTop: '20px' }}>
                      <h4 style={{ fontFamily: 'Cinzel, serif', color: 'var(--azul-real)', marginBottom: '15px' }}>
                        Bloques de Contenido de la Unidad
                      </h4>

                      {unit.elements && unit.elements.map((elem, eIdx) => (
                        <div key={eIdx} className="editor-block-item">
                          <span className="editor-block-type-badge">{elem.type.toUpperCase()}</span>
                          
                          <div className="editor-block-actions">
                            <button className="btn-icon" onClick={() => handleMoveElement(uIdx, eIdx, 'up')} title="Subir">
                              <i className="fa-solid fa-arrow-up"></i>
                            </button>
                            <button className="btn-icon" onClick={() => handleMoveElement(uIdx, eIdx, 'down')} title="Bajar">
                              <i className="fa-solid fa-arrow-down"></i>
                            </button>
                            <button className="btn-icon delete" onClick={() => handleDeleteElement(uIdx, eIdx)} title="Borrar bloque">
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </div>

                          <div style={{ marginTop: '15px' }}>
                            {/* paragraph block */}
                            {elem.type === 'paragraph' && (
                              <div className="form-group">
                                <label>Contenido del Párrafo (Soporta [Nombre](Enlace))</label>
                                <textarea 
                                  className="form-input" 
                                  style={{ minHeight: '100px' }} 
                                  value={elem.content || ''} 
                                  onChange={(e) => handleElementChange(uIdx, eIdx, 'content', e.target.value)}
                                  onFocus={() => setActiveEditorField({ unitIdx: uIdx, elemIdx: eIdx, field: 'content' })}
                                />
                              </div>
                            )}

                            {/* bible-verse block */}
                            {elem.type === 'bible-verse' && (
                              <div>
                                <div className="form-group">
                                  <label>Cita Bíblica Referencia (ej: Juan 14:16)</label>
                                  <input type="text" className="form-input" value={elem.reference || ''} onChange={(e) => handleElementChange(uIdx, eIdx, 'reference', e.target.value)} />
                                </div>
                                <div className="form-group">
                                  <label>Texto del Versículo (Soporta Glosarios HTML)</label>
                                  <textarea 
                                    className="form-input" 
                                    style={{ minHeight: '80px' }} 
                                    value={elem.text || ''} 
                                    onChange={(e) => handleElementChange(uIdx, eIdx, 'text', e.target.value)}
                                    onFocus={() => setActiveEditorField({ unitIdx: uIdx, elemIdx: eIdx, field: 'text' })}
                                  />
                                </div>
                                <div className="form-group">
                                  <label>Contexto exegético (cursiva inferior)</label>
                                  <textarea className="form-input" style={{ minHeight: '60px' }} value={elem.context || ''} onChange={(e) => handleElementChange(uIdx, eIdx, 'context', e.target.value)} />
                                </div>
                              </div>
                            )}

                            {/* question block */}
                            {elem.type === 'question' && (
                              <div>
                                <div className="form-group">
                                  <label>Pregunta / Título</label>
                                  <input type="text" className="form-input" value={elem.title || ''} onChange={(e) => handleElementChange(uIdx, eIdx, 'title', e.target.value)} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                  <div className="form-group">
                                    <label>Texto de la Etiqueta (Badge)</label>
                                    <input type="text" className="form-input" value={elem.badge || ''} onChange={(e) => handleElementChange(uIdx, eIdx, 'badge', e.target.value)} />
                                  </div>
                                  <div className="form-group">
                                    <label>Estilo de la Etiqueta</label>
                                    <select className="form-input" value={elem.badgeType || 'level-semilla'} onChange={(e) => handleElementChange(uIdx, eIdx, 'badgeType', e.target.value)}>
                                      <option value="level-semilla">Nivel Semilla (Verde)</option>
                                      <option value="level-raiz">Nivel Raíz (Azul)</option>
                                      <option value="level-fruto">Nivel Fruto (Púrpura)</option>
                                      <option value="level-tecnico">Nivel Técnico (Oro/Azul)</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="form-group">
                                  <label>Explicación (Punto de Vista)</label>
                                  <textarea 
                                    className="form-input" 
                                    style={{ minHeight: '100px' }} 
                                    value={elem.explanation || ''} 
                                    onChange={(e) => handleElementChange(uIdx, eIdx, 'explanation', e.target.value)}
                                    onFocus={() => setActiveEditorField({ unitIdx: uIdx, elemIdx: eIdx, field: 'explanation' })}
                                  />
                                </div>
                                <div className="form-group">
                                  <label>Explicación Infantil (Ilustración niños)</label>
                                  <textarea className="form-input" style={{ minHeight: '80px' }} value={elem.childExplanation || ''} onChange={(e) => handleElementChange(uIdx, eIdx, 'childExplanation', e.target.value)} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                  <div className="form-group">
                                    <label>Reflexión Adultos</label>
                                    <textarea className="form-input" style={{ minHeight: '70px' }} value={elem.reflectionAdult || ''} onChange={(e) => handleElementChange(uIdx, eIdx, 'reflectionAdult', e.target.value)} />
                                  </div>
                                  <div className="form-group">
                                    <label>Reflexión Niños</label>
                                    <textarea className="form-input" style={{ minHeight: '70px' }} value={elem.reflectionChild || ''} onChange={(e) => handleElementChange(uIdx, eIdx, 'reflectionChild', e.target.value)} />
                                  </div>
                                </div>
                                <div className="form-group">
                                  <label>Análisis de Conexión</label>
                                  <textarea className="form-input" style={{ minHeight: '60px' }} value={elem.connection || ''} onChange={(e) => handleElementChange(uIdx, eIdx, 'connection', e.target.value)} />
                                </div>
                              </div>
                            )}

                            {/* accordion block */}
                            {elem.type === 'accordion' && (
                              <div>
                                <div className="form-group">
                                  <label>Título del Acordeón</label>
                                  <input type="text" className="form-input" value={elem.title || ''} onChange={(e) => handleElementChange(uIdx, eIdx, 'title', e.target.value)} />
                                </div>
                                <div className="form-group">
                                  <label>Contenido del Acordeón (HTML/Texto)</label>
                                  <textarea 
                                    className="form-input" 
                                    style={{ minHeight: '100px' }} 
                                    value={elem.content || ''} 
                                    onChange={(e) => handleElementChange(uIdx, eIdx, 'content', e.target.value)}
                                    onFocus={() => setActiveEditorField({ unitIdx: uIdx, elemIdx: eIdx, field: 'content' })}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Add block buttons */}
                      <div style={{ backgroundColor: '#fff', border: '1.5px dashed var(--oro)', borderRadius: '8px', padding: '15px', display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 'bold', display: 'flex', alignItems: 'center', marginRight: '10px', fontSize: '0.85rem' }}>
                          Añadir Bloque:
                        </span>
                        <button className="save-note-btn" onClick={() => handleAddElement(uIdx, 'paragraph')} style={{ margin: 0 }}>
                          <i className="fa-solid fa-paragraph"></i> Párrafo
                        </button>
                        <button className="save-note-btn" onClick={() => handleAddElement(uIdx, 'bible-verse')} style={{ margin: 0 }}>
                          <i className="fa-solid fa-book-open"></i> Versículo (+)
                        </button>
                        <button className="save-note-btn" onClick={() => handleAddElement(uIdx, 'question')} style={{ margin: 0 }}>
                          <i className="fa-solid fa-circle-question"></i> Pregunta/Examen
                        </button>
                        <button className="save-note-btn" onClick={() => handleAddElement(uIdx, 'accordion')} style={{ margin: 0 }}>
                          <i className="fa-solid fa-box-archive"></i> Acordeón
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Unit Button */}
                <button className="btn-primary" onClick={handleAddUnit} style={{ width: '100%', justifyContent: 'center', border: '3px dashed var(--oro)' }}>
                  <i className="fa-solid fa-circle-plus"></i> Añadir Nueva Unidad
                </button>
              </div>

              {/* PANEL FLOTANTE DE INSERCIÓN DE TOOLTIPS / ENLACES */}
              {activeEditorField.unitIdx !== null && (
                <div style={{ marginTop: '40px', backgroundColor: '#fcfcfc', border: '2.5px solid var(--oro)', padding: '25px', borderRadius: '12px' }}>
                  <h3 style={{ fontFamily: 'Cinzel, serif', color: 'var(--azul-real)', marginBottom: '20px' }}>
                    <i className="fa-solid fa-toolbox" style={{ marginRight: '8px' }}></i> Herramientas de Inserción Rápida
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                    
                    {/* Tooltip Form */}
                    <div style={{ borderRight: '1px dashed var(--oro)', paddingRight: '25px' }}>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--azul-real)' }}>Añadir Glosario (Tooltip)</strong>
                      <div className="form-group" style={{ marginTop: '10px' }}>
                        <label>Palabra a Resaltar</label>
                        <input type="text" className="form-input" placeholder="ej: anticristo" value={selectedText} onChange={(e) => setSelectedText(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Definición del Glosario</label>
                        <input type="text" className="form-input" placeholder="ej: G500: antichristos" value={tooltipDef} onChange={(e) => setTooltipDef(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Estilo de Resaltado</label>
                        <select className="form-input" value={tooltipType} onChange={(e) => setTooltipType(e.target.value)}>
                          <option value="highlight-divine">Divino (Azul)</option>
                          <option value="highlight-relationship">Relación (Oro)</option>
                          <option value="highlight-warning">Advertencia (Rojo)</option>
                          <option value="highlight-anti">Anticristo (Rojo Oscuro)</option>
                        </select>
                      </div>
                      <button className="btn-primary" onClick={handleInsertTooltip} disabled={!selectedText || !tooltipDef}>
                        Insertar Tooltip
                      </button>
                    </div>

                    {/* Footnote Link Form */}
                    <div>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--azul-real)' }}>Añadir Enlace Footnote (Superscript)</strong>
                      <div className="form-group" style={{ marginTop: '10px' }}>
                        <label>Nombre o Referencia de Fuente</label>
                        <input type="text" className="form-input" placeholder="ej: Comentario Strong" value={linkText} onChange={(e) => setLinkText(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Enlace URL</label>
                        <input type="text" className="form-input" placeholder="ej: https://..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
                      </div>
                      <button className="btn-primary" onClick={handleInsertLink} disabled={!linkText || !linkUrl} style={{ marginTop: '62px' }}>
                        Insertar Enlace Footnote
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
