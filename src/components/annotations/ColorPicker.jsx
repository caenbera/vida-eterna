import React, { useEffect, useRef, useState } from 'react';
import { ANNOTATION_COLORS } from '../../lib/annotationKinds';

function hsvToHex(h, s, v) {
  const c = (v / 100) * (s / 100);
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v / 100 - c;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (n) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHsv(hex) {
  const clean = (hex || '').replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return { h: 210, s: 60, v: 80 };
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : (d / max) * 100;
  const v = max * 100;
  return { h, s, v };
}

// Selector de color completo (matiz + saturación/brillo + hex + swatches rápidos),
// sin dependencias externas. Contrato: onPick(hex) se llama al soltar el arrastre,
// al confirmar el hex escrito, o al hacer clic en un swatch (mismo contrato que
// el ColorSwatchPicker anterior, así los llamadores no necesitan cambiar nada más).
const ColorPicker = ({ onPick, allowNone = true, initialHex = '#3498db' }) => {
  const [{ h, s, v }, setHsv] = useState(() => hexToHsv(initialHex));
  const [hexInput, setHexInput] = useState(initialHex);
  const squareRef = useRef(null);
  const draggingRef = useRef(false);

  const hex = hsvToHex(h, s, v);

  useEffect(() => setHexInput(hex), [hex]);

  const updateFromPointer = (clientX, clientY) => {
    const rect = squareRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    setHsv((prev) => ({ ...prev, s: x * 100, v: (1 - y) * 100 }));
  };

  const stopDrag = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    onPick(hsvToHex(h, s, v));
  };

  useEffect(() => {
    const onMove = (e) => { if (draggingRef.current) updateFromPointer(e.clientX, e.clientY); };
    const onUp = () => stopDrag();
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
  });

  const startDrag = (e) => {
    draggingRef.current = true;
    updateFromPointer(e.clientX, e.clientY);
  };

  const commitHex = () => {
    const clean = hexInput.startsWith('#') ? hexInput : `#${hexInput}`;
    if (/^#[0-9a-fA-F]{6}$/.test(clean)) {
      setHsv(hexToHsv(clean));
      onPick(clean);
    } else {
      setHexInput(hex);
    }
  };

  return (
    <div className="color-picker" onMouseDown={(e) => e.preventDefault()}>
      <div
        ref={squareRef}
        className="color-picker-sat-square"
        style={{ background: `hsl(${h}, 100%, 50%)` }}
        onPointerDown={startDrag}
      >
        <div className="color-picker-sat-overlay-white" />
        <div className="color-picker-sat-overlay-black" />
        <div
          className="color-picker-sat-thumb"
          style={{ left: `${s}%`, top: `${100 - v}%`, background: hex }}
        />
      </div>

      <input
        type="range"
        min="0"
        max="360"
        value={h}
        className="color-picker-hue-slider"
        onChange={(e) => setHsv((prev) => ({ ...prev, h: Number(e.target.value) }))}
        onPointerUp={() => onPick(hsvToHex(h, s, v))}
      />

      <div className="color-picker-hex-row">
        <span className="color-picker-hex-preview" style={{ background: hex }} />
        <input
          type="text"
          className="color-picker-hex-input"
          value={hexInput}
          onChange={(e) => setHexInput(e.target.value)}
          onBlur={commitHex}
          onKeyDown={(e) => { if (e.key === 'Enter') commitHex(); }}
        />
      </div>

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
};

export default ColorPicker;
