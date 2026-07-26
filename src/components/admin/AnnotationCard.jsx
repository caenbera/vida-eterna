import React, { useState } from 'react';
import { ANNOTATION_KINDS, FIELD_LABELS } from '../../lib/annotationKinds';

const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

const fieldIsTextarea = (field) => ['note', 'refs', 'other', 'question'].includes(field);

// Tarjeta anclada cerca de la palabra/frase anotada (no un modal centrado ni un tooltip de hover).
// Varias pueden estar abiertas a la vez, igual que en un editor de anotaciones profesional.
const AnnotationCard = ({ card, onSave, onDelete, onClose, onStartEdit }) => {
  const kind = ANNOTATION_KINDS[card.kindId];
  const [draft, setDraft] = useState(card.data || {});
  const isEditing = card.mode === 'edit';

  if (!kind) return null;

  const style = {
    top: clamp(card.rect.bottom + 10, 10, (typeof window !== 'undefined' ? window.innerHeight : 900) - 60),
    left: clamp(card.rect.left, 10, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 350),
  };

  const setField = (field, value) => setDraft((d) => ({ ...d, [field]: value }));

  return (
    <div className="annotation-card" style={style} onMouseDown={(e) => e.stopPropagation()}>
      <div className="annotation-card-header" style={{ borderLeftColor: kind.color }}>
        <span className="annotation-card-header-title">
          <i className={`fa-solid ${kind.icon}`} style={{ color: kind.color }}></i>
          {kind.label.toUpperCase()}
        </span>
        <span className="annotation-card-header-actions">
          {!isEditing && (
            <>
              <button title="Editar" onClick={() => onStartEdit(card.cardId)}><i className="fa-solid fa-pen"></i></button>
              <button title="Eliminar" onClick={() => onDelete(card.cardId)}><i className="fa-solid fa-trash-can"></i></button>
            </>
          )}
          <button title="Cerrar" onClick={() => onClose(card.cardId)}><i className="fa-solid fa-xmark"></i></button>
        </span>
      </div>

      <div className="annotation-card-body">
        {isEditing ? (
          <>
            {kind.fields.map((field) => (
              <div className="form-group" key={field} style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '0.72rem' }}>{FIELD_LABELS[field]}</label>
                {fieldIsTextarea(field) ? (
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
          <>
            {kind.fields.map((field) =>
              draft[field] ? (
                <div key={field} style={{ marginBottom: '8px' }}>
                  <div className="wt-label">{FIELD_LABELS[field]}</div>
                  {field === 'dicturl' ? (
                    <a href={draft[field]} target="_blank" rel="noopener noreferrer">Ver diccionario <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.7rem' }}></i></a>
                  ) : (
                    <p style={{ whiteSpace: 'pre-line' }}>{draft[field]}</p>
                  )}
                </div>
              ) : null
            )}
            {kind.fields.every((f) => !draft[f]) && (
              <p style={{ color: '#9aa4b5', fontSize: '0.85rem' }}>Sin datos todavía. Pulsa editar para completarlos.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AnnotationCard;
