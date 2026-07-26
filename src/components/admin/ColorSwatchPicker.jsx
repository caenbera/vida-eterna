import React from 'react';
import { ANNOTATION_COLORS } from '../../lib/annotationKinds';

// Selector de color real (no prompt de texto). El padre lo posiciona (position: relative + absolute).
const ColorSwatchPicker = ({ onPick, allowNone = true }) => (
  <div className="color-swatch-popover" onMouseDown={(e) => e.preventDefault()}>
    <div className="color-swatch-row">
      {ANNOTATION_COLORS.map((c) => (
        <button
          key={c.id}
          type="button"
          className="color-swatch"
          style={{ background: c.hex }}
          onClick={() => onPick(c.hex)}
          title={c.id}
        />
      ))}
      {allowNone && (
        <button type="button" className="color-swatch color-swatch-none" onClick={() => onPick(null)} title="Quitar color">
          <i className="fa-solid fa-slash"></i>
        </button>
      )}
    </div>
  </div>
);

export default ColorSwatchPicker;
