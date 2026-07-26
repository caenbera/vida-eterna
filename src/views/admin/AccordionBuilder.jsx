import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { loadStudy, saveStudy } from '../../services/studiesService';
import { createBlock, BLOCK_TYPE_LIST, BLOCK_TYPES, ACCORDION_COLORS, sanitizeStudy } from '../../lib/blocks';
import { AdminBreadcrumbs } from './AdminLayout';
import BlockRenderer from '../../components/blocks/BlockRenderer';

const blockPreview = (b) => (b.content || b.text || b.explanation || '').replace(/<[^>]+>/g, '').slice(0, 90);

const AccordionBuilder = () => {
  const { id, blockId } = useParams();
  const [searchParams] = useSearchParams();
  const sectionId = searchParams.get('section');
  const subtopicId = searchParams.get('subtopic');
  const navigate = useNavigate();

  const [study, setStudy] = useState(null);
  const [block, setBlock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPalette, setShowPalette] = useState(false);

  useEffect(() => {
    (async () => {
      const s = sanitizeStudy(await loadStudy(id));
      if (!s) { navigate('/admin/estudios'); return; }
      const section = s.sections.find((sec) => sec.id === sectionId);
      const subtopic = section?.subtopics.find((st) => st.id === subtopicId);
      const found = subtopic?.blocks.find((b) => b.id === blockId);
      if (!found) { navigate(`/admin/estudios/${id}/constructor`); return; }
      setStudy(s);
      setBlock(found);
      setLoading(false);
    })();
  }, [id, blockId, sectionId, subtopicId, navigate]);

  if (loading || !study || !block) {
    return <div style={{ textAlign: 'center', padding: '60px', color: '#9aa4b5' }}><i className="fa-solid fa-spinner fa-spin"></i> Cargando acordeón...</div>;
  }

  const patchBlock = (patch) => setBlock((b) => ({ ...b, ...patch }));

  const persist = async (andClose) => {
    const sections = study.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        subtopics: sec.subtopics.map((st) => {
          if (st.id !== subtopicId) return st;
          return { ...st, blocks: st.blocks.map((b) => (b.id === block.id ? block : b)) };
        }),
      };
    });
    await saveStudy({ ...study, sections });
    if (andClose) navigate(`/admin/estudios/${id}/constructor`);
  };

  const addChild = (type) => {
    patchBlock({ blocks: [...(block.blocks || []), createBlock(type)] });
    setShowPalette(false);
  };

  const updateChild = (childId, patch) => {
    patchBlock({ blocks: block.blocks.map((c) => (c.id === childId ? { ...c, ...patch } : c)) });
  };

  const deleteChild = (childId) => {
    patchBlock({ blocks: block.blocks.filter((c) => c.id !== childId) });
  };

  return (
    <div>
      <AdminBreadcrumbs
        items={[
          { label: 'Panel de administración', to: '/admin' },
          { label: 'Biblioteca de estudios', to: '/admin/estudios' },
          { label: study.title, to: `/admin/estudios/${id}/constructor` },
          { label: 'Constructor', to: `/admin/estudios/${id}/constructor` },
          { label: 'Constructor de acordeón' },
        ]}
      />

      <div className="admin-header-row">
        <div className="admin-page-title">Constructor de acordeón</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-outline" onClick={() => navigate(`/admin/estudios/${id}/constructor`)}>Cancelar</button>
          <button className="btn-outline" onClick={() => persist(false)}><i className="fa-regular fa-floppy-disk"></i> Guardar cambios</button>
          <button className="btn-solid-navy" onClick={() => persist(true)}><i className="fa-solid fa-floppy-disk"></i> Guardar y cerrar</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 320px', gap: '22px', alignItems: 'start' }}>
        <div className="admin-card">
          <div className="admin-card-title" style={{ fontSize: '0.78rem', letterSpacing: '1px', color: '#9aa4b5' }}>CONFIGURACIÓN</div>
          <div className="form-group">
            <label>Título del acordeón *</label>
            <input className="admin-input" value={block.title || ''} onChange={(e) => patchBlock({ title: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Icono (clase FontAwesome)</label>
            <input className="admin-input" value={block.icon || ''} onChange={(e) => patchBlock({ icon: e.target.value })} placeholder="fa-book-open" />
          </div>
          <div className="form-group">
            <label>Color del acordeón</label>
            <div className="color-swatch-row">
              {Object.entries(ACCORDION_COLORS).map(([name, hex]) => (
                <div
                  key={name}
                  className={`color-swatch ${block.color === name ? 'selected' : ''}`}
                  style={{ background: hex }}
                  onClick={() => patchBlock({ color: name })}
                  title={name}
                />
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Descripción (opcional)</label>
            <textarea className="admin-textarea" value={block.description || ''} onChange={(e) => patchBlock({ description: e.target.value })} />
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Abierto inicialmente
              <label className="admin-toggle">
                <input type="checkbox" checked={!!block.openByDefault} onChange={(e) => patchBlock({ openByDefault: e.target.checked })} />
                <span className="admin-toggle-slider"></span>
              </label>
            </label>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-title" style={{ fontSize: '0.78rem', letterSpacing: '1px', color: '#9aa4b5' }}>CONTENIDO DEL ACORDEÓN</div>

          {(block.blocks || []).length === 0 && (
            <div className="admin-empty-state">
              <i className="fa-regular fa-square-plus"></i>
              <div>Este acordeón todavía no tiene bloques.</div>
            </div>
          )}

          {(block.blocks || []).map((child) => {
            const meta = BLOCK_TYPES[child.type] || {};
            return (
              <div key={child.id} className="constructor-block-item">
                <span className="constructor-block-icon" style={{ background: meta.color }}>
                  <i className={`fa-solid ${meta.icon}`}></i>
                </span>
                <div className="constructor-block-body">
                  <div className="constructor-block-title-row">
                    <span className="constructor-block-title-text">{child.title || meta.label}</span>
                    <span className="constructor-block-type-tag">{meta.label}</span>
                  </div>
                  {'content' in child && (
                    <textarea
                      className="admin-textarea"
                      style={{ marginTop: '8px', minHeight: '60px' }}
                      value={child.content || ''}
                      onChange={(e) => updateChild(child.id, { content: e.target.value })}
                    />
                  )}
                  {child.type === 'versiculo' && (
                    <>
                      <input
                        className="admin-input"
                        style={{ marginTop: '8px' }}
                        placeholder="Referencia"
                        value={child.reference || ''}
                        onChange={(e) => updateChild(child.id, { reference: e.target.value })}
                      />
                      <textarea
                        className="admin-textarea"
                        style={{ marginTop: '8px', minHeight: '60px' }}
                        value={child.text || ''}
                        onChange={(e) => updateChild(child.id, { text: e.target.value })}
                      />
                    </>
                  )}
                  {!('content' in child) && child.type !== 'versiculo' && (
                    <div className="constructor-block-preview">{blockPreview(child)}</div>
                  )}
                </div>
                <div className="constructor-block-actions">
                  <button className="danger" title="Eliminar" onClick={() => deleteChild(child.id)}>
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
              {BLOCK_TYPE_LIST.filter((t) => t.id !== 'acordeon').map((t) => (
                <div className="block-palette-item" key={t.id} onClick={() => addChild(t.id)}>
                  <div className="block-palette-icon" style={{ background: t.color }}>
                    <i className={`fa-solid ${t.icon}`}></i>
                  </div>
                  <div className="block-palette-label">{t.label}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: '0.75rem', color: '#9aa4b5', marginTop: '14px', textAlign: 'right' }}>
            {(block.blocks || []).length} bloques
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-title" style={{ fontSize: '0.78rem', letterSpacing: '1px', color: '#9aa4b5' }}>VISTA PREVIA</div>
          <BlockRenderer blocks={[block]} studyId={study.id} contextId={`${sectionId}__${subtopicId}`} />
        </div>
      </div>
    </div>
  );
};

export default AccordionBuilder;
