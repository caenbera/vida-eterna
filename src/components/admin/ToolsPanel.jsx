import React, { useState } from 'react';
import { ANNOTATION_KIND_LIST } from '../../lib/annotationKinds';
import ColorPicker from '../annotations/ColorPicker';

// Panel fijo de herramientas de anotación (reemplaza la barra flotante tipo
// tooltip). Siempre visible debajo del texto del versículo; los tiles se ven
// atenuados hasta que hay una selección de texto activa.
const ToolsPanel = ({ hasSelection, onPickInstant, onPickForm }) => {
  const [colorFor, setColorFor] = useState(null);

  const handleTileClick = (kind) => {
    if (!hasSelection) return;
    if (kind.instant) {
      setColorFor((prev) => (prev === kind.id ? null : kind.id));
    } else {
      onPickForm(kind.id);
    }
  };

  return (
    <div className="tools-panel">
      <div className="tools-panel-title">Herramientas del estudio</div>
      <div className="tools-panel-grid">
        {ANNOTATION_KIND_LIST.map((kind) => (
          <div key={kind.id} className="tools-panel-tile-wrap">
            <button
              type="button"
              className={`tools-panel-tile${hasSelection ? '' : ' is-inactive'}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleTileClick(kind)}
              title={hasSelection ? kind.label : 'Selecciona texto primero'}
            >
              <i className={`fa-solid ${kind.icon}`} style={{ color: kind.color }}></i>
              <span>{kind.label}</span>
            </button>
            {colorFor === kind.id && (
              <div className="tools-panel-color-popover">
                <ColorPicker
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
    </div>
  );
};

export default ToolsPanel;
