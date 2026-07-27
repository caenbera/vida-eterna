import React from 'react';
import { FIELD_LABELS } from '../../lib/annotationKinds';
import { readListField } from '../../lib/annotationData';

// Cuerpo de solo lectura de una anotación, compartido entre la tarjeta editable
// del admin (modo vista) y la tarjeta de solo lectura del sitio público, para que
// ambas se vean idénticas y no diverjan con el tiempo.
const AnnotationFieldsReadOnly = ({ kind, dataset }) => {
  const fields = kind.fields || [];
  const isListField = (field) => (kind.listFields || []).includes(field);
  const legacyFieldFor = (field) => (field === 'links' ? 'refs' : undefined);

  const hasAny = fields.some((field) =>
    isListField(field)
      ? readListField(dataset, field, legacyFieldFor(field)).length > 0
      : !!dataset[field]
  );

  if (!hasAny) {
    return <p style={{ color: '#9aa4b5', fontSize: '0.85rem' }}>Sin datos todavía.</p>;
  }

  return (
    <>
      {fields.map((field) => {
        if (isListField(field)) {
          const rows = readListField(dataset, field, legacyFieldFor(field));
          if (!rows.length) return null;
          if (field === 'translations') {
            return (
              <div key={field} style={{ marginBottom: '8px' }}>
                <div className="wt-label">{FIELD_LABELS[field]}</div>
                <div className="annotation-translation-list">
                  {rows.map((row, i) => (
                    <div key={i} className="annotation-translation-row">
                      <span className="annotation-translation-code">{row.translation}</span>
                      <p style={{ whiteSpace: 'pre-line', margin: 0 }}>{row.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          return (
            <div key={field} style={{ marginBottom: '8px' }}>
              <div className="wt-label">{FIELD_LABELS[field]}</div>
              <ul className="annotation-link-list">
                {rows.map((row, i) => (
                  <li key={i}>
                    <strong>{row.category}</strong> <i className="fa-solid fa-arrow-right"></i> {row.reference}
                  </li>
                ))}
              </ul>
            </div>
          );
        }
        if (!dataset[field]) return null;
        return (
          <div key={field} style={{ marginBottom: '8px' }}>
            <div className="wt-label">{FIELD_LABELS[field]}</div>
            {field === 'dicturl' ? (
              <a href={dataset[field]} target="_blank" rel="noopener noreferrer">
                Ver diccionario <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.7rem' }}></i>
              </a>
            ) : (
              <p style={{ whiteSpace: 'pre-line' }}>{dataset[field]}</p>
            )}
          </div>
        );
      })}
    </>
  );
};

export default AnnotationFieldsReadOnly;
