import React, { forwardRef, useEffect, useState } from 'react';
import { FIELD_LABELS, LINK_CATEGORIES } from '../../lib/annotationKinds';
import { TRANSLATIONS } from '../../lib/blocks';
import { readListField } from '../../lib/annotationData';
import { lookupByStrong, searchByText } from '../../lib/strongsLexicon';
import AnnotationCardFrame from '../annotations/AnnotationCardFrame';
import AnnotationFieldsReadOnly from '../annotations/AnnotationFieldsReadOnly';

const fieldIsTextarea = (field) => ['note', 'other', 'question'].includes(field);
const legacyFieldFor = (field) => (field === 'links' ? 'refs' : undefined);
const emptyRowFor = (field) => (field === 'translations' ? { translation: TRANSLATIONS[0], text: '' } : { category: LINK_CATEGORIES[0], reference: '' });
const LEXICON_KINDS = ['lexico', 'diccionario'];

// Tarjeta anclada cerca de la palabra/frase anotada (no un modal centrado ni un
// tooltip de hover). Varias pueden estar abiertas a la vez. El marco visual y el
// posicionamiento vienen del padre (BlockEditor); esta tarjeta solo maneja edición.
const AnnotationCard = forwardRef(({ card, kind, onSave, onDelete, onClose, onStartEdit, style }, ref) => {
  const [draft, setDraft] = useState(card.data || {});
  const [lexQuery, setLexQuery] = useState('');
  const [lexResults, setLexResults] = useState([]);
  const isEditing = card.mode === 'edit';
  const isLexiconKind = kind && LEXICON_KINDS.includes(kind.id);

  useEffect(() => {
    if (!isLexiconKind) return;
    const q = lexQuery.trim();
    if (q.length < 2) { setLexResults([]); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const direct = /^[HG]\d+$/i.test(q) ? await lookupByStrong(q) : null;
      const list = direct ? [direct] : await searchByText(q);
      if (!cancelled) setLexResults(list);
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [lexQuery, isLexiconKind]);

  if (!kind) return null;

  const setField = (field, value) => setDraft((d) => ({ ...d, [field]: value }));

  const applyLexResult = (entry) => {
    setDraft((d) => ({ ...d, hebrew: entry.hebrew, translit: entry.translit, strong: entry.strong, meaning: entry.meaning }));
    setLexQuery('');
    setLexResults([]);
  };

  const setRows = (field, rows) => setField(field, JSON.stringify(rows));

  const addRow = (field) => setRows(field, [...readListField(draft, field, legacyFieldFor(field)), emptyRowFor(field)]);
  const removeRow = (field, i) => setRows(field, readListField(draft, field, legacyFieldFor(field)).filter((_, idx) => idx !== i));
  const updateRow = (field, i, row) => setRows(field, readListField(draft, field, legacyFieldFor(field)).map((r, idx) => (idx === i ? row : r)));

  const actions = !isEditing && (
    <>
      <button type="button" title="Editar" onClick={() => onStartEdit(card.cardId)}><i className="fa-solid fa-pen"></i></button>
      <button type="button" title="Eliminar" onClick={() => onDelete(card.cardId)}><i className="fa-solid fa-trash-can"></i></button>
    </>
  );

  return (
    <AnnotationCardFrame ref={ref} kind={kind} onClose={() => onClose(card.cardId, card.isNew)} actions={actions} style={style}>
      {isEditing ? (
        <>
          {isLexiconKind && (
            <div className="form-group annotation-lexicon-search" style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '0.72rem' }}>Buscar en el léxico (número de Strong's o palabra)</label>
              <input
                className="admin-input"
                placeholder="Ej. H430, agape, dios..."
                value={lexQuery}
                onChange={(e) => setLexQuery(e.target.value)}
              />
              {lexResults.length > 0 && (
                <ul className="annotation-lexicon-results">
                  {lexResults.map((entry) => (
                    <li key={entry.strong}>
                      <button type="button" onClick={() => applyLexResult(entry)}>
                        <strong>{entry.hebrew}</strong> <span className="annotation-lexicon-translit">{entry.translit}</span>
                        <span className="annotation-lexicon-strong">{entry.strong}</span>
                        <span className="annotation-lexicon-meaning">{entry.meaning}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {kind.fields.map((field) => (
            <div className="form-group" key={field} style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '0.72rem' }}>{FIELD_LABELS[field]}</label>
              {field === 'translations' ? (
                <div className="annotation-link-rows">
                  {readListField(draft, field).map((row, i) => (
                    <div className="annotation-translation-edit-row" key={i}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <select
                          className="admin-select"
                          style={{ flex: '0 0 110px' }}
                          value={row.translation}
                          onChange={(e) => updateRow(field, i, { ...row, translation: e.target.value })}
                        >
                          {TRANSLATIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button type="button" className="annotation-link-row-remove" title="Quitar" onClick={() => removeRow(field, i)}>
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                      <textarea
                        className="admin-textarea"
                        style={{ minHeight: '50px' }}
                        placeholder="Texto de esta traducción..."
                        value={row.text}
                        onChange={(e) => updateRow(field, i, { ...row, text: e.target.value })}
                      />
                    </div>
                  ))}
                  <button type="button" className="btn-outline" style={{ fontSize: '0.75rem', padding: '5px 10px' }} onClick={() => addRow(field)}>
                    <i className="fa-solid fa-plus"></i> Agregar traducción
                  </button>
                </div>
              ) : (kind.listFields || []).includes(field) ? (
                <div className="annotation-link-rows">
                  {readListField(draft, field, legacyFieldFor(field)).map((row, i) => (
                    <div className="annotation-link-row" key={i}>
                      <select
                        className="admin-select"
                        value={row.category}
                        onChange={(e) => updateRow(field, i, { ...row, category: e.target.value })}
                      >
                        {LINK_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                      <input
                        className="admin-input"
                        placeholder="Ej. Colosenses 1:15"
                        value={row.reference}
                        onChange={(e) => updateRow(field, i, { ...row, reference: e.target.value })}
                      />
                      <button type="button" className="annotation-link-row-remove" title="Quitar" onClick={() => removeRow(field, i)}>
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  ))}
                  <button type="button" className="btn-outline" style={{ fontSize: '0.75rem', padding: '5px 10px' }} onClick={() => addRow(field)}>
                    <i className="fa-solid fa-plus"></i> Agregar referencia
                  </button>
                </div>
              ) : fieldIsTextarea(field) ? (
                <textarea
                  className="admin-textarea"
                  style={{ minHeight: '60px' }}
                  value={draft[field] || ''}
                  onChange={(e) => setField(field, e.target.value)}
                />
              ) : (
                <input
                  className="admin-input"
                  value={draft[field] || ''}
                  onChange={(e) => setField(field, e.target.value)}
                />
              )}
            </div>
          ))}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.78rem' }} onClick={() => onClose(card.cardId, card.isNew)}>
              Cancelar
            </button>
            <button className="btn-solid-navy" style={{ padding: '6px 12px', fontSize: '0.78rem' }} onClick={() => onSave(card.cardId, draft)}>
              Guardar
            </button>
          </div>
        </>
      ) : (
        <AnnotationFieldsReadOnly kind={kind} dataset={draft} />
      )}
    </AnnotationCardFrame>
  );
});

export default AnnotationCard;
