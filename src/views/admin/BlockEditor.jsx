import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { loadStudy, saveStudy } from '../../services/studiesService';
import { BLOCK_TYPES } from '../../lib/blocks';
import { AdminBreadcrumbs } from './AdminLayout';
import RichTextToolbar from '../../components/admin/RichTextToolbar';

const TRANSLATIONS = ['RVR60', 'RVR95', 'NVI', 'LBLA', 'NTV'];

const BlockEditor = () => {
  const { id, blockId } = useParams();
  const [searchParams] = useSearchParams();
  const sectionId = searchParams.get('section');
  const subtopicId = searchParams.get('subtopic');
  const navigate = useNavigate();

  const [study, setStudy] = useState(null);
  const [block, setBlock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wordForm, setWordForm] = useState(null);
  const textRef = useRef(null);

  useEffect(() => {
    (async () => {
      const s = await loadStudy(id);
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

  const handleTagSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !textRef.current || !textRef.current.contains(sel.anchorNode)) {
      window.alert('Selecciona primero una palabra o frase dentro del texto del versículo.');
      return;
    }
    const range = sel.getRangeAt(0);
    const word = sel.toString();
    const tempId = `wtag_${Date.now()}`;

    // Insertamos el span inmediatamente (mientras el Range todavía es válido) y lo
    // referenciamos luego por id. Esperar a que el admin llene el formulario del modal
    // antes de mutar el DOM deja el Range obsoleto tras los re-renders de React.
    const span = document.createElement('span');
    span.className = 'word-tag';
    span.id = tempId;
    span.textContent = word;
    range.deleteContents();
    range.insertNode(span);
    sel.removeAllRanges();

    patchBlock({ text: textRef.current.innerHTML });
    setWordForm({ tempId, word, hebrew: '', translit: '', strong: '', meaning: '', note: '', refs: '', other: '' });
  };

  const applyWordTag = () => {
    const { tempId, ...rest } = wordForm;
    const span = textRef.current?.querySelector(`#${tempId}`);
    if (span) {
      span.removeAttribute('id');
      Object.entries(rest).forEach(([k, v]) => { if (v && k !== 'word') span.dataset[k] = v; });
      patchBlock({ text: textRef.current.innerHTML });
    }
    setWordForm(null);
  };

  const cancelWordTag = () => {
    const span = wordForm?.tempId && textRef.current?.querySelector(`#${wordForm.tempId}`);
    if (span) {
      span.replaceWith(document.createTextNode(span.textContent));
      textRef.current.normalize();
      patchBlock({ text: textRef.current.innerHTML });
    }
    setWordForm(null);
  };

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

          {block.type === 'versiculo' && (
            <>
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

              <div className="form-group">
                <label>Contenido del versículo</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <button type="button" className="btn-outline" onClick={handleTagSelection} style={{ fontSize: '0.78rem', padding: '7px 12px' }}>
                    <i className="fa-solid fa-tag"></i> Etiquetar palabra seleccionada
                  </button>
                </div>
                <RichTextToolbar targetRef={textRef} onChanged={(html) => patchBlock({ text: html })} />
                <div
                  ref={textRef}
                  className="rich-editable"
                  contentEditable
                  suppressContentEditableWarning
                  dangerouslySetInnerHTML={{ __html: block.text || '' }}
                  onBlur={(e) => patchBlock({ text: e.currentTarget.innerHTML })}
                />
                <div style={{ fontSize: '0.75rem', color: '#9aa4b5', marginTop: '6px' }}>
                  Selecciona una palabra dentro del texto y pulsa "Etiquetar palabra" para añadirle hebreo/griego, Strong's, nota y referencias.
                </div>
              </div>

              <div className="form-group">
                <label>Contexto exegético (opcional)</label>
                <textarea className="admin-textarea" value={block.context || ''} onChange={(e) => patchBlock({ context: e.target.value })} />
              </div>
            </>
          )}

          {'content' in block && block.type !== 'versiculo' && (
            <div className="form-group">
              <label>Contenido</label>
              <RichTextToolbar targetRef={textRef} onChanged={(html) => patchBlock({ content: html })} />
              <div
                ref={textRef}
                className="rich-editable"
                contentEditable
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: block.content || '' }}
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

      {wordForm && (
        <div className="modal" onClick={cancelWordTag}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">Etiquetar palabra: "{wordForm.word}"</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Hebreo / Griego</label>
                <input className="admin-input" value={wordForm.hebrew} onChange={(e) => setWordForm({ ...wordForm, hebrew: e.target.value })} placeholder="ראשית" />
              </div>
              <div className="form-group">
                <label>Transliteración</label>
                <input className="admin-input" value={wordForm.translit} onChange={(e) => setWordForm({ ...wordForm, translit: e.target.value })} placeholder="reshit" />
              </div>
            </div>
            <div className="form-group">
              <label>Número de Strong</label>
              <input className="admin-input" value={wordForm.strong} onChange={(e) => setWordForm({ ...wordForm, strong: e.target.value })} placeholder="H7225" />
            </div>
            <div className="form-group">
              <label>Significado</label>
              <input className="admin-input" value={wordForm.meaning} onChange={(e) => setWordForm({ ...wordForm, meaning: e.target.value })} placeholder="Principio, primero, cabeza..." />
            </div>
            <div className="form-group">
              <label>Nota del estudio</label>
              <textarea className="admin-textarea" value={wordForm.note} onChange={(e) => setWordForm({ ...wordForm, note: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Referencias relacionadas (separadas por ;)</label>
              <input className="admin-input" value={wordForm.refs} onChange={(e) => setWordForm({ ...wordForm, refs: e.target.value })} placeholder="Juan 1:14; Hebreos 1:5" />
            </div>
            <div className="form-group">
              <label>Otras apariciones (separadas por ;)</label>
              <input className="admin-input" value={wordForm.other} onChange={(e) => setWordForm({ ...wordForm, other: e.target.value })} placeholder="Salmo 2:7; Juan 3:16" />
            </div>
            <div className="modal-buttons">
              <button className="modal-btn modal-close" onClick={cancelWordTag}>Cancelar</button>
              <button className="modal-btn modal-save" onClick={applyWordTag}>Aplicar etiqueta</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockEditor;
