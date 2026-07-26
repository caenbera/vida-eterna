import React, { forwardRef, useState } from 'react';
import { FIELD_LABELS, LINK_CATEGORIES } from '../../lib/annotationKinds';
import { readListField } from '../../lib/annotationData';
import AnnotationCardFrame from '../annotations/AnnotationCardFrame';
import AnnotationFieldsReadOnly from '../annotations/AnnotationFieldsReadOnly';

const fieldIsTextarea = (field) => ['note', 'other', 'question'].includes(field);
const legacyFieldFor = (field) => (field === 'links' ? 'refs' : undefined);

// Tarjeta anclada cerca de la palabra/frase anotada (no un modal centrado ni un
// tooltip de hover). Varias pueden estar abiertas a la vez. El marco visual y el
// posicionamiento vienen del padre (BlockEditor); esta tarjeta solo maneja edición.
const AnnotationCard = forwardRef(({ card, kind, onSave, onDelete, onClose, onStartEdit, style }, ref) => {
  const [draft, setDraft] = useState(card.data || {});
  const isEditing = card.mode === 'edit';

  if (!kind) return null;

  const setField = (field, value) => setDraft((d) => ({ ...d, [field]: value }));

  const setRows = (field, rows) => setField(field, JSON.stringify(rows));

  const addRow = (field) => setRows(field, [...readListField(draft, field, legacyFieldFor(field)), { category: LINK_CATEGORIES[0], reference: '' }]);
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
          {kind.fields.map((field) => (
            <div className="form-group" key={field} style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '0.72rem' }}>{FIELD_LABELS[field]}</label>
              {(kind.listFields || []).includes(field) ? (
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
