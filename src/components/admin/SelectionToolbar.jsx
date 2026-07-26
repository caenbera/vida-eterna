import React, { useState } from 'react';
import { ANNOTATION_KIND_LIST } from '../../lib/annotationKinds';
import ColorSwatchPicker from './ColorSwatchPicker';

const clampLeft = (left, width = 340) => Math.max(10, Math.min(left, (typeof window !== 'undefined' ? window.innerWidth : 1000) - width - 10));

// Barra flotante tipo "Medium/Google Docs" que aparece sobre el texto seleccionado
// dentro de un bloque de versículo, con una herramienta por tipo de anotación.
const SelectionToolbar = ({ rect, onPickInstant, onPickForm }) => {
  const [colorFor, setColorFor] = useState(null);

  if (!rect) return null;

  const style = {
    top: Math.max(10, rect.top - 54),
    left: clampLeft(rect.left + rect.width / 2 - 170),
  };

  return (
    <div className="selection-toolbar" style={style} onMouseDown={(e) => e.preventDefault()}>
      {ANNOTATION_KIND_LIST.map((kind) => (
        <div key={kind.id} style={{ position: 'relative' }}>
          <button
            type="button"
            className="selection-toolbar-btn"
            title={kind.label}
            onClick={() => (kind.instant ? setColorFor(colorFor === kind.id ? null : kind.id) : onPickForm(kind.id))}
          >
            <i className={`fa-solid ${kind.icon}`} style={{ color: kind.color }}></i>
          </button>
          {colorFor === kind.id && (
            <div style={{ position: 'absolute', top: '110%', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
              <ColorSwatchPicker
                allowNone={false}
                onPick={(hex) => {
                  onPickInstant(kind.id, hex);
                  setColorFor(null);
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SelectionToolbar;
