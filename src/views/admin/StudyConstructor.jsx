import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loadStudy, saveStudy } from '../../services/studiesService';
import { createBlock, createSection, createSubtopic, BLOCK_TYPE_LIST, BLOCK_TYPES } from '../../lib/blocks';
import { AdminBreadcrumbs } from './AdminLayout';

const blockPreviewText = (block) => {
  if (block.type === 'versiculo') return block.text?.replace(/<[^>]+>/g, '') || block.reference;
  if (block.type === 'acordeon') return `${(block.blocks || []).length} bloques dentro`;
  return (block.content || '').replace(/<[^>]+>/g, '') || block.explanation?.replace(/<[^>]+>/g, '') || '';
};

const blockTitleText = (block) => {
  if (block.type === 'versiculo') return block.reference || 'Versículo';
  return block.title || BLOCK_TYPES[block.type]?.label || block.type;
};

const StudyConstructor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [study, setStudy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [activeSubtopicId, setActiveSubtopicId] = useState(null);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [showPalette, setShowPalette] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const dragIndex = useRef(null);

  useEffect(() => {
    (async () => {
      const s = await loadStudy(id);
      if (!s) { navigate('/admin/estudios'); return; }
      setStudy(s);
      if (s.sections?.[0]) {
        setActiveSectionId(s.sections[0].id);
        setActiveSubtopicId(s.sections[0].subtopics?.[0]?.id);
      }
      setLoading(false);
    })();
  }, [id, navigate]);

  const persist = async (updated) => {
    setStudy(updated);
    await saveStudy(updated);
    setSavedAt(Date.now());
  };

  if (loading || !study) {
    return <div style={{ textAlign: 'center', padding: '60px', color: '#9aa4b5' }}><i className="fa-solid fa-spinner fa-spin"></i> Cargando constructor...</div>;
  }

  const activeSection = study.sections.find((s) => s.id === activeSectionId);
  const activeSubtopic = activeSection?.subtopics.find((st) => st.id === activeSubtopicId);
  const selectedBlock = activeSubtopic?.blocks.find((b) => b.id === selectedBlockId);

  const updateSections = (mutator) => {
    const sections = study.sections.map((s) => ({ ...s, subtopics: s.subtopics.map((st) => ({ ...st, blocks: [...st.blocks] })) }));
    mutator(sections);
    persist({ ...study, sections });
  };

  const handleAddSection = () => {
    const newSection = createSection(`Unidad ${study.sections.length + 1}`);
    updateSections((sections) => sections.push(newSection));
    setActiveSectionId(newSection.id);
    setActiveSubtopicId(newSection.subtopics[0].id);
  };

  const handleDeleteSection = (sectionId) => {
    if (!window.confirm('¿Eliminar esta unidad y todos sus subtemas/bloques?')) return;
    updateSections((sections) => {
      const idx = sections.findIndex((s) => s.id === sectionId);
      if (idx >= 0) sections.splice(idx, 1);
    });
  };

  const handleRenameSection = (sectionId, title) => {
    updateSections((sections) => {
      const s = sections.find((sec) => sec.id === sectionId);
      if (s) s.title = title;
    });
  };

  const handleAddSubtopic = (sectionId) => {
    const newSub = createSubtopic('Nuevo subtema');
    updateSections((sections) => {
      const s = sections.find((sec) => sec.id === sectionId);
      if (s) s.subtopics.push(newSub);
    });
    setActiveSectionId(sectionId);
    setActiveSubtopicId(newSub.id);
  };

  const handleDeleteSubtopic = (sectionId, subtopicId) => {
    if (!window.confirm('¿Eliminar este subtema y sus bloques?')) return;
    updateSections((sections) => {
      const s = sections.find((sec) => sec.id === sectionId);
      if (s) s.subtopics = s.subtopics.filter((st) => st.id !== subtopicId);
    });
  };

  const handleRenameSubtopic = (sectionId, subtopicId, title) => {
    updateSections((sections) => {
      const s = sections.find((sec) => sec.id === sectionId);
      const st = s?.subtopics.find((sub) => sub.id === subtopicId);
      if (st) st.title = title;
    });
  };

  const withActiveBlocks = (sections, fn) => {
    const s = sections.find((sec) => sec.id === activeSectionId);
    const st = s?.subtopics.find((sub) => sub.id === activeSubtopicId);
    if (st) fn(st);
  };

  const handleAddBlock = (type) => {
    const block = createBlock(type);
    updateSections((sections) => withActiveBlocks(sections, (st) => st.blocks.push(block)));
    setSelectedBlockId(block.id);
    setShowPalette(false);
  };

  const handleUpdateBlock = (blockId, patch) => {
    updateSections((sections) =>
      withActiveBlocks(sections, (st) => {
        const idx = st.blocks.findIndex((b) => b.id === blockId);
        if (idx >= 0) st.blocks[idx] = { ...st.blocks[idx], ...patch };
      })
    );
  };

  const handleDeleteBlock = (blockId) => {
    if (!window.confirm('¿Eliminar este bloque?')) return;
    updateSections((sections) => withActiveBlocks(sections, (st) => { st.blocks = st.blocks.filter((b) => b.id !== blockId); }));
    if (selectedBlockId === blockId) setSelectedBlockId(null);
  };

  const handleDuplicateBlock = (blockId) => {
    updateSections((sections) =>
      withActiveBlocks(sections, (st) => {
        const idx = st.blocks.findIndex((b) => b.id === blockId);
        if (idx >= 0) {
          const clone = { ...JSON.parse(JSON.stringify(st.blocks[idx])), id: `${blockId}_copy_${Date.now()}` };
          st.blocks.splice(idx + 1, 0, clone);
        }
      })
    );
  };

  const handleDrop = (targetIdx) => {
    if (dragIndex.current === null || dragIndex.current === targetIdx) return;
    updateSections((sections) =>
      withActiveBlocks(sections, (st) => {
        const [moved] = st.blocks.splice(dragIndex.current, 1);
        st.blocks.splice(targetIdx, 0, moved);
      })
    );
    dragIndex.current = null;
  };

  const handlePublish = async () => {
    await persist({ ...study, status: 'publicado' });
  };

  return (
    <div>
      <AdminBreadcrumbs
        items={[
          { label: 'Panel de administración', to: '/admin' },
          { label: 'Biblioteca de estudios', to: '/admin/estudios' },
          { label: study.title },
          { label: 'Constructor' },
        ]}
      />

      <div className="admin-header-row">
        <div>
          <div className="admin-page-title">Constructor del estudio <i className="fa-solid fa-book-open" style={{ color: 'var(--oro)', fontSize: '1.2rem' }}></i></div>
          <div className="admin-page-subtitle">Edita y organiza el contenido de tu estudio por bloques.</div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-outline" onClick={() => window.open(`/study/${study.id}`, '_blank')}>
            <i className="fa-regular fa-eye"></i> Vista previa
          </button>
          <button className="btn-outline" onClick={() => persist({ ...study, status: 'borrador' })}>
            <i className="fa-regular fa-floppy-disk"></i> Guardar borrador
          </button>
          <button className="btn-solid-navy" onClick={handlePublish}>
            <i className="fa-solid fa-paper-plane"></i> Publicar estudio
          </button>
        </div>
      </div>

      <div className="constructor-grid">
        {/* Árbol de estructura */}
        <div className="admin-card">
          <div className="admin-card-title" style={{ fontSize: '0.78rem', letterSpacing: '1px', color: '#9aa4b5' }}>ESTRUCTURA DEL ESTUDIO</div>
          <div style={{ fontWeight: 'bold', color: 'var(--azul-real)', marginBottom: '10px' }}>
            <i className="fa-solid fa-book-open" style={{ marginRight: '8px', color: 'var(--oro)' }}></i>{study.title}
          </div>

          {study.sections.map((section) => (
            <div className="constructor-tree-section" key={section.id}>
              <div
                className={`constructor-tree-unit ${section.id === activeSectionId ? 'active' : ''}`}
                onClick={() => { setActiveSectionId(section.id); setActiveSubtopicId(section.subtopics[0]?.id); }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <input
                    className="constructor-tree-unit-title"
                    style={{ border: 'none', background: 'transparent', width: '100%' }}
                    value={section.title}
                    onChange={(e) => handleRenameSection(section.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    className="btn-icon delete"
                    style={{ fontSize: '0.75rem' }}
                    onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id); }}
                    title="Eliminar unidad"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>
              {section.subtopics.map((sub) => (
                <div
                  key={sub.id}
                  className={`constructor-tree-subtopic ${sub.id === activeSubtopicId && section.id === activeSectionId ? 'active' : ''}`}
                  onClick={() => { setActiveSectionId(section.id); setActiveSubtopicId(sub.id); setSelectedBlockId(null); }}
                >
                  <i className="fa-regular fa-circle" style={{ fontSize: '0.6rem' }}></i>
                  <input
                    style={{ border: 'none', background: 'transparent', flex: 1, fontSize: '0.82rem', color: 'inherit', fontWeight: 'inherit' }}
                    value={sub.title}
                    onChange={(e) => handleRenameSubtopic(section.id, sub.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    className="btn-icon delete"
                    style={{ fontSize: '0.68rem', width: '22px', height: '22px' }}
                    onClick={(e) => { e.stopPropagation(); handleDeleteSubtopic(section.id, sub.id); }}
                    title="Eliminar subtema"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              ))}
              <button
                className="admin-nav-link"
                style={{ fontSize: '0.78rem', color: '#9aa4b5', paddingLeft: '26px' }}
                onClick={() => handleAddSubtopic(section.id)}
              >
                <i className="fa-solid fa-plus"></i> Añadir subtema
              </button>
            </div>
          ))}

          <button className="add-block-btn" onClick={handleAddSection}>
            <i className="fa-solid fa-circle-plus"></i> Agregar unidad
          </button>
        </div>

        {/* Lista de bloques del subtema activo */}
        <div className="admin-card">
          {activeSubtopic ? (
            <>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--azul-real)' }}>{activeSection.title}</div>
              <div style={{ color: '#6b7688', marginBottom: '18px' }}>{activeSubtopic.title}</div>

              {activeSubtopic.blocks.length === 0 && (
                <div className="admin-empty-state">
                  <i className="fa-regular fa-square-plus"></i>
                  <div>Este subtema todavía no tiene bloques.</div>
                </div>
              )}

              {activeSubtopic.blocks.map((block, idx) => {
                const meta = BLOCK_TYPES[block.type] || {};
                return (
                  <div
                    key={block.id}
                    className={`constructor-block-item ${block.id === selectedBlockId ? 'selected' : ''}`}
                    draggable
                    onDragStart={() => { dragIndex.current = idx; }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(idx)}
                    onClick={() => setSelectedBlockId(block.id)}
                  >
                    <span className="constructor-block-drag"><i className="fa-solid fa-grip-vertical"></i></span>
                    <span className="constructor-block-icon" style={{ background: meta.color }}>
                      <i className={`fa-solid ${meta.icon}`}></i>
                    </span>
                    <div className="constructor-block-body">
                      <div className="constructor-block-title-row">
                        {blockTitleText(block)}
                        <span className="constructor-block-type-tag">{meta.label}</span>
                      </div>
                      <div className="constructor-block-preview">{blockPreviewText(block)}</div>
                    </div>
                    <div className="constructor-block-actions">
                      <button
                        title="Editar en pantalla completa"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(
                            block.type === 'acordeon'
                              ? `/admin/estudios/${study.id}/constructor/acordeon/${block.id}?section=${activeSectionId}&subtopic=${activeSubtopicId}`
                              : `/admin/estudios/${study.id}/constructor/bloque/${block.id}?section=${activeSectionId}&subtopic=${activeSubtopicId}`
                          );
                        }}
                      >
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button title="Duplicar" onClick={(e) => { e.stopPropagation(); handleDuplicateBlock(block.id); }}>
                        <i className="fa-regular fa-copy"></i>
                      </button>
                      <button className="danger" title="Eliminar" onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.id); }}>
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                );
              })}

              <button className="add-block-btn" onClick={() => setShowPalette((v) => !v)}>
                <i className="fa-solid fa-plus"></i> Añadir bloque
              </button>

              {showPalette && (
                <div className="block-palette">
                  {BLOCK_TYPE_LIST.map((t) => (
                    <div className="block-palette-item" key={t.id} onClick={() => handleAddBlock(t.id)}>
                      <div className="block-palette-icon" style={{ background: t.color }}>
                        <i className={`fa-solid ${t.icon}`}></i>
                      </div>
                      <div className="block-palette-label">{t.label}</div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ fontSize: '0.75rem', color: '#9aa4b5', marginTop: '14px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Arrastra los bloques para reordenarlos. Cada cambio se guarda automáticamente.</span>
                <span>{activeSubtopic.blocks.length} bloques en este subtema{savedAt ? ` · Guardado ${new Date(savedAt).toLocaleTimeString()}` : ''}</span>
              </div>
            </>
          ) : (
            <div className="admin-empty-state">
              <i className="fa-regular fa-hand-pointer"></i>
              <div>Selecciona o crea una unidad para empezar.</div>
            </div>
          )}
        </div>

        {/* Propiedades rápidas del bloque seleccionado */}
        <div className="admin-card">
          <div className="admin-card-title" style={{ fontSize: '0.78rem', letterSpacing: '1px', color: '#9aa4b5' }}>PROPIEDADES DEL BLOQUE</div>
          {selectedBlock ? (
            <QuickProperties block={selectedBlock} onChange={(patch) => handleUpdateBlock(selectedBlock.id, patch)} />
          ) : (
            <div className="admin-empty-state" style={{ padding: '30px 10px' }}>
              <i className="fa-regular fa-square-check"></i>
              <div>Selecciona un bloque para ver sus propiedades.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const QuickProperties = ({ block, onChange }) => {
  const meta = BLOCK_TYPES[block.type] || {};
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <span className="constructor-block-icon" style={{ background: meta.color }}>
          <i className={`fa-solid ${meta.icon}`}></i>
        </span>
        <div>
          <div style={{ fontWeight: 'bold', color: 'var(--azul-real)' }}>{meta.label}</div>
          <div style={{ fontSize: '0.75rem', color: '#9aa4b5' }}>{meta.description}</div>
        </div>
      </div>

      {block.type !== 'separador' && (
        <div className="form-group">
          <label className="properties-panel-label">Título del bloque</label>
          <input className="admin-input" value={block.title || ''} onChange={(e) => onChange({ title: e.target.value })} />
        </div>
      )}

      {block.type === 'versiculo' && (
        <div className="form-group">
          <label className="properties-panel-label">Referencia bíblica</label>
          <input className="admin-input" value={block.reference || ''} onChange={(e) => onChange({ reference: e.target.value })} />
        </div>
      )}

      {'content' in block && (
        <div className="form-group">
          <label className="properties-panel-label">Contenido</label>
          <textarea className="admin-textarea" value={block.content || ''} onChange={(e) => onChange({ content: e.target.value })} />
        </div>
      )}

      {'text' in block && (
        <div className="form-group">
          <label className="properties-panel-label">Texto del versículo</label>
          <textarea className="admin-textarea" value={block.text || ''} onChange={(e) => onChange({ text: e.target.value })} />
        </div>
      )}
    </div>
  );
};

export default StudyConstructor;
