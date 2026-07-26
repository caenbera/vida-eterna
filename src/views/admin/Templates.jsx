import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadAllTemplates, saveTemplate, deleteTemplate } from '../../services/studiesService';
import { generateId, BLOCK_TYPE_LIST, BLOCK_TYPES } from '../../lib/blocks';
import { AdminBreadcrumbs } from './AdminLayout';

const DEFAULT_TEMPLATE = {
  id: 'estudio-doctrinal',
  title: 'Estudio doctrinal',
  description: 'Estructura clásica para estudios doctrinales profundos.',
  isDefault: true,
  blocks: [
    { id: 'tb1', type: 'texto', title: 'Introducción', description: 'Presentación del tema y su relevancia.' },
    { id: 'tb2', type: 'texto', title: 'Base lógica', description: 'Fundamentos y principios que sostienen el tema.' },
    { id: 'tb3', type: 'destacado', title: 'Idea principal', description: 'Declaración central o tesis del estudio.' },
    { id: 'tb4', type: 'versiculo', title: 'Versículo clave 1', description: 'Cita bíblica principal.' },
    { id: 'tb5', type: 'versiculo', title: 'Versículo clave 2', description: 'Cita bíblica relacionada.' },
    { id: 'tb6', type: 'versiculo', title: 'Versículo clave 3', description: 'Cita bíblica adicional.' },
    { id: 'tb7', type: 'acordeon', title: 'Análisis', description: 'Análisis detallado del pasaje o doctrina.' },
    { id: 'tb8', type: 'pregunta', title: '¿Por qué esto es fundamental?', description: 'Aplicación y relevancia práctica.' },
    { id: 'tb9', type: 'conclusion', title: 'Conclusión', description: 'Resumen y cierre del estudio.' },
  ],
};

const Templates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [showPalette, setShowPalette] = useState(false);

  const refresh = async () => {
    let all = await loadAllTemplates();
    if (all.length === 0) {
      await saveTemplate(DEFAULT_TEMPLATE);
      all = await loadAllTemplates();
    }
    setTemplates(all);
    return all;
  };

  useEffect(() => {
    (async () => {
      const all = await refresh();
      setSelectedId(all[0]?.id || null);
      setLoading(false);
    })();
  }, []);

  const selected = templates.find((t) => t.id === selectedId);

  const handleNewTemplate = async () => {
    const tpl = { id: generateId('tpl'), title: 'Nueva plantilla', description: '', isDefault: false, blocks: [] };
    await saveTemplate(tpl);
    await refresh();
    setSelectedId(tpl.id);
    setDraft(tpl);
    setEditing(true);
  };

  const handleDuplicate = async (tpl) => {
    const clone = { ...tpl, id: generateId('tpl'), title: `${tpl.title} (copia)`, isDefault: false };
    await saveTemplate(clone);
    await refresh();
    setSelectedId(clone.id);
  };

  const handleDelete = async (tpl) => {
    if (!window.confirm(`¿Eliminar la plantilla "${tpl.title}"?`)) return;
    await deleteTemplate(tpl.id);
    const all = await refresh();
    setSelectedId(all[0]?.id || null);
  };

  const startEdit = () => { setDraft(JSON.parse(JSON.stringify(selected))); setEditing(true); };

  const saveDraft = async () => {
    await saveTemplate(draft);
    await refresh();
    setEditing(false);
  };

  const addDraftBlock = (type) => {
    setDraft((d) => ({
      ...d,
      blocks: [...d.blocks, { id: generateId('tb'), type, title: BLOCK_TYPES[type]?.label || type, description: '' }],
    }));
    setShowPalette(false);
  };

  const updateDraftBlock = (blockId, patch) => {
    setDraft((d) => ({ ...d, blocks: d.blocks.map((b) => (b.id === blockId ? { ...b, ...patch } : b)) }));
  };

  const removeDraftBlock = (blockId) => {
    setDraft((d) => ({ ...d, blocks: d.blocks.filter((b) => b.id !== blockId) }));
  };

  const moveDraftBlock = (idx, dir) => {
    setDraft((d) => {
      const blocks = [...d.blocks];
      const target = idx + dir;
      if (target < 0 || target >= blocks.length) return d;
      [blocks[idx], blocks[target]] = [blocks[target], blocks[idx]];
      return { ...d, blocks };
    });
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px', color: '#9aa4b5' }}><i className="fa-solid fa-spinner fa-spin"></i> Cargando plantillas...</div>;
  }

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Panel de administración', to: '/admin' }, { label: 'Plantillas' }]} />

      <div className="admin-header-row">
        <div>
          <div className="admin-page-title">Plantillas <i className="fa-solid fa-file-lines" style={{ color: 'var(--oro)', fontSize: '1.2rem' }}></i></div>
          <div className="admin-page-subtitle">Crea y administra plantillas para acelerar la creación de estudios.</div>
        </div>
        <button className="btn-solid-navy" onClick={handleNewTemplate}><i className="fa-solid fa-plus"></i> Nueva plantilla</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 300px', gap: '22px', alignItems: 'start' }}>
        <div className="admin-card">
          <div className="admin-card-title" style={{ fontSize: '0.78rem', letterSpacing: '1px', color: '#9aa4b5' }}>MIS PLANTILLAS</div>
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className={`constructor-tree-unit ${tpl.id === selectedId ? 'active' : ''}`}
              onClick={() => { setSelectedId(tpl.id); setEditing(false); }}
            >
              <div className="constructor-tree-unit-title">{tpl.title}</div>
              <div className="constructor-tree-unit-sub">{tpl.description}</div>
              {tpl.isDefault && <span className="admin-pill published" style={{ marginTop: '6px', display: 'inline-block' }}>Predeterminada</span>}
            </div>
          ))}
        </div>

        {selected && !editing && (
          <>
            <div className="admin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--azul-real)' }}>
                    {selected.title} {selected.isDefault && <span className="admin-pill published" style={{ marginLeft: '8px' }}>Predeterminada</span>}
                  </div>
                  <div style={{ color: '#6b7688', marginTop: '4px' }}>{selected.description}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-outline" onClick={startEdit}><i className="fa-solid fa-pen"></i> Editar plantilla</button>
                  <button className="btn-outline" onClick={() => handleDuplicate(selected)}><i className="fa-regular fa-copy"></i> Duplicar</button>
                  <button className="btn-outline danger" onClick={() => handleDelete(selected)}><i className="fa-solid fa-trash-can"></i> Eliminar</button>
                </div>
              </div>

              <div className="properties-panel-label">VISTA PREVIA DE LA ESTRUCTURA</div>
              {selected.blocks.map((b, idx) => {
                const meta = BLOCK_TYPES[b.type] || {};
                return (
                  <div key={b.id} className="constructor-block-item" style={{ cursor: 'default' }}>
                    <span style={{ color: '#9aa4b5', fontWeight: 'bold', paddingTop: '4px' }}>{idx + 1}</span>
                    <span className="constructor-block-icon" style={{ background: meta.color }}>
                      <i className={`fa-solid ${meta.icon}`}></i>
                    </span>
                    <div className="constructor-block-body">
                      <div className="constructor-block-title-row"><span className="constructor-block-title-text">{b.title}</span></div>
                      <div className="constructor-block-preview">{b.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="admin-card">
              <div className="admin-card-title"><i className="fa-solid fa-wand-magic-sparkles"></i> Usar esta plantilla</div>
              <p style={{ fontSize: '0.85rem', color: '#6b7688', marginBottom: '16px' }}>
                Crea un nuevo estudio basado en esta estructura predefinida. Podrás editar, agregar o eliminar bloques después.
              </p>
              <button className="btn-solid-navy" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate(`/admin/estudios/nuevo?plantilla=${selected.id}`)}>
                Usar esta plantilla para nuevo estudio
              </button>
            </div>
          </>
        )}

        {selected && editing && draft && (
          <div className="admin-card" style={{ gridColumn: '2 / span 2' }}>
            <div className="admin-header-row">
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <input className="admin-input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} style={{ fontWeight: 'bold', fontSize: '1.1rem' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-outline" onClick={() => setEditing(false)}>Cancelar</button>
                <button className="btn-solid-navy" onClick={saveDraft}><i className="fa-regular fa-floppy-disk"></i> Guardar plantilla</button>
              </div>
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea className="admin-textarea" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </div>

            <div className="properties-panel-label">BLOQUES DE LA PLANTILLA</div>
            {draft.blocks.map((b, idx) => {
              const meta = BLOCK_TYPES[b.type] || {};
              return (
                <div key={b.id} className="constructor-block-item">
                  <span className="constructor-block-icon" style={{ background: meta.color }}>
                    <i className={`fa-solid ${meta.icon}`}></i>
                  </span>
                  <div className="constructor-block-body">
                    <input className="admin-input" style={{ marginBottom: '6px' }} value={b.title} onChange={(e) => updateDraftBlock(b.id, { title: e.target.value })} />
                    <input className="admin-input" placeholder="Descripción de este paso" value={b.description} onChange={(e) => updateDraftBlock(b.id, { description: e.target.value })} />
                  </div>
                  <div className="constructor-block-actions">
                    <button onClick={() => moveDraftBlock(idx, -1)}><i className="fa-solid fa-arrow-up"></i></button>
                    <button onClick={() => moveDraftBlock(idx, 1)}><i className="fa-solid fa-arrow-down"></i></button>
                    <button className="danger" onClick={() => removeDraftBlock(b.id)}><i className="fa-solid fa-trash-can"></i></button>
                  </div>
                </div>
              );
            })}

            <button className="add-block-btn" onClick={() => setShowPalette((v) => !v)}>
              <i className="fa-solid fa-plus"></i> Añadir bloque al final
            </button>
            {showPalette && (
              <div className="block-palette">
                {BLOCK_TYPE_LIST.map((t) => (
                  <div className="block-palette-item" key={t.id} onClick={() => addDraftBlock(t.id)}>
                    <div className="block-palette-icon" style={{ background: t.color }}>
                      <i className={`fa-solid ${t.icon}`}></i>
                    </div>
                    <div className="block-palette-label">{t.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Templates;
