import React, { useState } from 'react';
import ColorSwatchPicker from './ColorSwatchPicker';

// Barra de formato simple basada en document.execCommand, aplicada sobre un contentEditable.
// onMouseDown={preventDefault} en cada botón evita que el navegador pierda la selección
// activa del contentEditable al hacer clic en la barra.
const RichTextToolbar = ({ targetRef, onChanged }) => {
  const [showColor, setShowColor] = useState(false);

  const exec = (cmd, value = null) => {
    targetRef.current?.focus();
    document.execCommand(cmd, false, value);
    onChanged?.(targetRef.current?.innerHTML || '');
  };

  const insertLink = () => {
    const url = window.prompt('URL del enlace:');
    if (url) exec('createLink', url);
  };

  const pickColor = (hex) => {
    exec('foreColor', hex || '#2c3e50');
    setShowColor(false);
  };

  const stop = (e) => e.preventDefault();

  return (
    <div className="rich-toolbar">
      <button type="button" onMouseDown={stop} onClick={() => exec('bold')} title="Negrita"><i className="fa-solid fa-bold"></i></button>
      <button type="button" onMouseDown={stop} onClick={() => exec('italic')} title="Cursiva"><i className="fa-solid fa-italic"></i></button>
      <button type="button" onMouseDown={stop} onClick={() => exec('underline')} title="Subrayado"><i className="fa-solid fa-underline"></i></button>
      <button type="button" onMouseDown={stop} onClick={() => exec('insertUnorderedList')} title="Lista"><i className="fa-solid fa-list-ul"></i></button>
      <button type="button" onMouseDown={stop} onClick={() => exec('insertOrderedList')} title="Lista numerada"><i className="fa-solid fa-list-ol"></i></button>
      <button type="button" onMouseDown={stop} onClick={insertLink} title="Enlace"><i className="fa-solid fa-link"></i></button>
      <div style={{ position: 'relative' }}>
        <button type="button" onMouseDown={stop} onClick={() => setShowColor((v) => !v)} title="Color de texto">
          <i className="fa-solid fa-font" style={{ color: 'var(--oro)' }}></i>
        </button>
        {showColor && (
          <div style={{ position: 'absolute', top: '110%', left: 0, zIndex: 20 }}>
            <ColorSwatchPicker onPick={pickColor} />
          </div>
        )}
      </div>
    </div>
  );
};

export default RichTextToolbar;
