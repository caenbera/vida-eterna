import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { loadStudy, saveStudy } from '../../services/studiesService';
import { BLOCK_TYPES, TRANSLATIONS, PIONEER_AUTHORS, sanitizeStudy } from '../../lib/blocks';
import { ANNOTATION_KINDS, applyAnnotationStyle } from '../../lib/annotationKinds';
import { placeCards } from '../../lib/annotationLayout';
import { AdminBreadcrumbs } from './AdminLayout';
import RichEditableField from '../../components/admin/RichEditableField';
import ToolsPanel from '../../components/admin/ToolsPanel';
import AnnotationCard from '../../components/admin/AnnotationCard';
import ConnectorOverlay from '../../components/annotations/ConnectorOverlay';

const CARD_WIDTH = 320;
const CARD_HEIGHT_ESTIMATE = 220;
const ANNOTATABLE_TYPES = ['versiculo', 'cita'];

const BlockEditor = () => {
  const { id, blockId } = useParams();
  const [searchParams] = useSearchParams();
  const sectionId = searchParams.get('section');
  const subtopicId = searchParams.get('subtopic');
  const navigate = useNavigate();

  const [study, setStudy] = useState(null);
  const [block, setBlock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectionRect, setSelectionRect] = useState(null);
  const [cards, setCards] = useState([]);
  const textRef = useRef(null);
  const pendingRangeRef = useRef(null);
  const cardElsRef = useRef({});

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

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (e.target.closest('.tools-panel')) return;
      if (textRef.current && textRef.current.contains(e.target)) return;
      setSelectionRect(null);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (loading || !study || !block) {
    return <div style={{ textAlign: 'center', padding: '60px', color: '#9aa4b5' }}><i className="fa-solid fa-spinner fa-spin"></i> Cargando bloque...</div>;
  }

  const meta = BLOCK_TYPES[block.type] || {};

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
    const updated = { ...study, sections };
    await saveStudy(updated);
    if (andClose) navigate(`/admin/estudios/${id}/constructor`);
  };

  const syncTextFromDom = () => patchBlock({ text: textRef.current.innerHTML });

  // ---- Selección de texto dentro del versículo -> barra flotante ----
  const handleEditableSelect = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !textRef.current || !textRef.current.contains(sel.anchorNode)) {
      setSelectionRect(null);
      return;
    }
    const range = sel.getRangeAt(0);
    pendingRangeRef.current = range.cloneRange();
    setSelectionRect(range.getBoundingClientRect());
  };

  const wrapPendingSelection = (kindId, extraData = {}) => {
    const range = pendingRangeRef.current;
    if (!range || range.collapsed) return null;
    const span = document.createElement('span');
    const spanId = `wtag_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    span.className = 'word-tag';
    span.id = spanId;
    span.dataset.kind = kindId;
    Object.entries(extraData).forEach(([k, v]) => { if (v) span.dataset[k] = v; });
    span.textContent = range.toString();
    applyAnnotationStyle(span, kindId, extraData.color);
    range.deleteContents();
    range.insertNode(span);
    window.getSelection()?.removeAllRanges();
    pendingRangeRef.current = null;
    syncTextFromDom();
    return spanId;
  };

  // Herramientas instantáneas: resaltar / subrayar / encerrar (eligen color y aplican de una vez)
  const handlePickInstant = (kindId, colorHex) => {
    wrapPendingSelection(kindId, { color: colorHex });
    setSelectionRect(null);
  };

  // Herramientas con formulario: nota / referencia / etiqueta / léxico / pregunta
  const handlePickForm = (kindId) => {
    const spanId = wrapPendingSelection(kindId, {});
    setSelectionRect(null);
    if (!spanId) return;
    const span = textRef.current.querySelector(`#${spanId}`);
    if (!span) return;
    openCard({ cardId: spanId, kindId, mode: 'edit', isNew: true, rect: span.getBoundingClientRect(), data: {} });
  };

  const openCard = (card) => {
    setCards((prev) => [...prev.filter((c) => c.cardId !== card.cardId), card]);
  };

  const handleEditableClick = (e) => {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) return; // fue un drag de selección, no un clic simple
    const tag = e.target.closest('.word-tag');
    if (!tag || !textRef.current.contains(tag)) return;
    if (!tag.id) tag.id = `wtag_${Date.now()}`;
    const kindId = tag.dataset.kind || 'lexico';
    openCard({
      cardId: tag.id,
      kindId,
      mode: 'view',
      isNew: false,
      rect: tag.getBoundingClientRect(),
      data: { ...tag.dataset },
    });
  };

  const handleStartEdit = (cardId) => {
    setCards((prev) => prev.map((c) => (c.cardId === cardId ? { ...c, mode: 'edit' } : c)));
  };

  const handleSaveCard = (cardId, fields) => {
    const span = textRef.current.querySelector(`#${cardId}`);
    if (span) {
      Object.keys(fields).forEach((k) => {
        if (k === 'color' || k === 'kind') return;
        if (fields[k]) span.dataset[k] = fields[k];
        else delete span.dataset[k];
      });
      // "links" reemplaza al viejo "refs": limpia el atributo legado tras guardar en el formato nuevo.
      if ('links' in fields) delete span.dataset.refs;
      syncTextFromDom();
    }
    delete cardElsRef.current[cardId];
    setCards((prev) => prev.filter((c) => c.cardId !== cardId));
  };

  const handleDeleteCard = (cardId) => {
    const span = textRef.current.querySelector(`#${cardId}`);
    if (span) {
      span.replaceWith(document.createTextNode(span.textContent));
      textRef.current.normalize();
      syncTextFromDom();
    }
    delete cardElsRef.current[cardId];
    setCards((prev) => prev.filter((c) => c.cardId !== cardId));
  };

  const handleCloseCard = (cardId, discardIfNew) => {
    if (discardIfNew) {
      handleDeleteCard(cardId);
      return;
    }
    delete cardElsRef.current[cardId];
    setCards((prev) => prev.filter((c) => c.cardId !== cardId));
  };

  const cardPositions = placeCards(
    cards
      .map((card) => {
        const span = textRef.current?.querySelector(`#${card.cardId}`);
        return span ? { id: card.cardId, anchorRect: span.getBoundingClientRect(), width: CARD_WIDTH, height: CARD_HEIGHT_ESTIMATE } : null;
      })
      .filter(Boolean)
  );

  return (
    <div>
      <AdminBreadcrumbs
        items={[
          { label: 'Panel de administración', to: '/admin' },
          { label: 'Biblioteca de estudios', to: '/admin/estudios' },
          { label: study.title, to: `/admin/estudios/${id}/constructor` },
          { label: 'Constructor', to: `/admin/estudios/${id}/constructor` },
          { label: 'Editor del bloque' },
        ]}
      />

      <div className="admin-header-row">
        <div className="admin-page-title">Editor del bloque</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-outline" onClick={() => navigate(`/admin/estudios/${id}/constructor`)}>Cancelar</button>
          <button className="btn-outline" onClick={() => persist(false)}><i className="fa-regular fa-floppy-disk"></i> Guardar cambios</button>
          <button className="btn-solid-navy" onClick={() => persist(true)}><i className="fa-solid fa-floppy-disk"></i> Guardar y cerrar</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span className="constructor-block-icon" style={{ background: meta.color }}>
              <i className={`fa-solid ${meta.icon}`}></i>
            </span>
            <div style={{ fontWeight: 'bold', color: 'var(--azul-real)' }}>{meta.label}</div>
          </div>

          {block.type !== 'separador' && (
            <div className="form-group">
              <label>Título del bloque</label>
              <input className="admin-input" value={block.title || ''} onChange={(e) => patchBlock({ title: e.target.value })} />
            </div>
          )}

          {ANNOTATABLE_TYPES.includes(block.type) && (
            <>
              {block.type === 'versiculo' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: '14px' }}>
                  <div className="form-group">
                    <label>Referencia bíblica</label>
                    <input className="admin-input" value={block.reference || ''} onChange={(e) => patchBlock({ reference: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Traducción</label>
                    <select className="admin-select" value={block.translation || 'RVR60'} onChange={(e) => patchBlock({ translation: e.target.value })}>
                      {TRANSLATIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {block.type === 'cita' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-group">
                      <label>Autor</label>
                      <input
                        className="admin-input"
                        list="pioneer-authors"
                        value={block.author || ''}
                        onChange={(e) => patchBlock({ author: e.target.value })}
                        placeholder="Ej. Elena G. de White"
                      />
                      <datalist id="pioneer-authors">
                        {PIONEER_AUTHORS.map((name) => <option key={name} value={name} />)}
                      </datalist>
                    </div>
                    <div className="form-group">
                      <label>Obra / publicación</label>
                      <input
                        className="admin-input"
                        value={block.work || ''}
                        onChange={(e) => patchBlock({ work: e.target.value })}
                        placeholder="Ej. Signs of the Times"
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '14px' }}>
                    <div className="form-group">
                      <label>Referencia</label>
                      <input
                        className="admin-input"
                        value={block.citation || ''}
                        onChange={(e) => patchBlock({ citation: e.target.value })}
                        placeholder="Ej. ST May 30, 1895, par. 3"
                      />
                    </div>
                    <div className="form-group">
                      <label>Enlace a la fuente</label>
                      <input
                        className="admin-input"
                        type="url"
                        value={block.sourceUrl || ''}
                        onChange={(e) => patchBlock({ sourceUrl: e.target.value })}
                        placeholder="https://egwwritings.org/..."
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="form-group">
                <label>{block.type === 'versiculo' ? 'Contenido del versículo' : 'Texto de la cita'}</label>
                <RichEditableField
                  ref={textRef}
                  html={block.text}
                  onToolbarChange={(html) => patchBlock({ text: html })}
                  onBlur={(e) => { patchBlock({ text: e.currentTarget.innerHTML }); }}
                  onMouseUp={handleEditableSelect}
                  onKeyUp={handleEditableSelect}
                  onClick={handleEditableClick}
                />
                <ToolsPanel hasSelection={!!selectionRect} onPickInstant={handlePickInstant} onPickForm={handlePickForm} />
              </div>

              {block.type === 'versiculo' && (
                <div className="form-group">
                  <label>Contexto exegético (opcional)</label>
                  <textarea className="admin-textarea" value={block.context || ''} onChange={(e) => patchBlock({ context: e.target.value })} />
                </div>
              )}
            </>
          )}

          {'content' in block && !ANNOTATABLE_TYPES.includes(block.type) && (
            <div className="form-group">
              <label>Contenido</label>
              <RichEditableField
                ref={textRef}
                html={block.content}
                onToolbarChange={(html) => patchBlock({ content: html })}
                onBlur={(e) => patchBlock({ content: e.currentTarget.innerHTML })}
              />
            </div>
          )}

          {block.type === 'pregunta' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label>Etiqueta (badge)</label>
                  <input className="admin-input" value={block.badge || ''} onChange={(e) => patchBlock({ badge: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Estilo de la etiqueta</label>
                  <select className="admin-select" value={block.badgeType || 'level-semilla'} onChange={(e) => patchBlock({ badgeType: e.target.value })}>
                    <option value="level-semilla">Semilla (verde)</option>
                    <option value="level-raiz">Raíz (azul)</option>
                    <option value="level-fruto">Fruto (púrpura)</option>
                    <option value="level-tecnico">Técnico (oro/azul)</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Explicación</label>
                <textarea className="admin-textarea" value={block.explanation || ''} onChange={(e) => patchBlock({ explanation: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Explicación infantil (opcional)</label>
                <textarea className="admin-textarea" value={block.childExplanation || ''} onChange={(e) => patchBlock({ childExplanation: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label>Reflexión adultos</label>
                  <textarea className="admin-textarea" value={block.reflectionAdult || ''} onChange={(e) => patchBlock({ reflectionAdult: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Reflexión niños</label>
                  <textarea className="admin-textarea" value={block.reflectionChild || ''} onChange={(e) => patchBlock({ reflectionChild: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Análisis de conexión (opcional)</label>
                <textarea className="admin-textarea" value={block.connection || ''} onChange={(e) => patchBlock({ connection: e.target.value })} />
              </div>
            </>
          )}
        </div>

        <div className="admin-card">
          <div className="admin-card-title" style={{ fontSize: '0.78rem', letterSpacing: '1px', color: '#9aa4b5' }}>PROPIEDADES</div>
          <p style={{ fontSize: '0.85rem', color: '#6b7688' }}>{meta.description}</p>
          {block.type === 'versiculo' && (
            <div style={{ marginTop: '14px' }}>
              <label className="properties-panel-label" style={{ marginTop: 0 }}>Mostrar versículo por versículo</label>
              <label className="admin-toggle">
                <input type="checkbox" checked={!!block.showPerVerse} onChange={(e) => patchBlock({ showPerVerse: e.target.checked })} />
                <span className="admin-toggle-slider"></span>
              </label>
              <label className="properties-panel-label">Notas internas (no visibles para el usuario)</label>
              <textarea className="admin-textarea" value={block.notes || ''} onChange={(e) => patchBlock({ notes: e.target.value })} />
            </div>
          )}
        </div>
      </div>

      {cards.map((card) => {
        const pos = cardPositions.get(card.cardId);
        if (!pos) return null;
        return (
          <AnnotationCard
            key={card.cardId}
            ref={(el) => { if (el) cardElsRef.current[card.cardId] = el; }}
            card={card}
            kind={ANNOTATION_KINDS[card.kindId]}
            onSave={handleSaveCard}
            onDelete={handleDeleteCard}
            onClose={handleCloseCard}
            onStartEdit={handleStartEdit}
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: CARD_WIDTH }}
          />
        );
      })}

      <ConnectorOverlay
        cards={cards.map((card) => ({
          id: card.cardId,
          sourceEl: textRef.current?.querySelector(`#${card.cardId}`),
          cardEl: cardElsRef.current[card.cardId],
          color: (ANNOTATION_KINDS[card.kindId] || {}).color || '#0a192f',
        }))}
      />
    </div>
  );
};

export default BlockEditor;
