import React from 'react';

// Barra de formato simple basada en document.execCommand, aplicada sobre un contentEditable.
const RichTextToolbar = ({ targetRef, onChanged }) => {
  const exec = (cmd, value = null) => {
    targetRef.current?.focus();
    document.execCommand(cmd, false, value);
    onChanged?.(targetRef.current?.innerHTML || '');
  };

  const insertLink = () => {
    const url = window.prompt('URL del enlace:');
    if (url) exec('createLink', url);
  };

  const setColor = () => {
    const color = window.prompt('Color (nombre o #hex):', '#0a192f');
    if (color) exec('foreColor', color);
  };

  return (
    <div className="rich-toolbar">
      <button type="button" onClick={() => exec('bold')} title="Negrita"><i className="fa-solid fa-bold"></i></button>
      <button type="button" onClick={() => exec('italic')} title="Cursiva"><i className="fa-solid fa-italic"></i></button>
      <button type="button" onClick={() => exec('underline')} title="Subrayado"><i className="fa-solid fa-underline"></i></button>
      <button type="button" onClick={() => exec('insertUnorderedList')} title="Lista"><i className="fa-solid fa-list-ul"></i></button>
      <button type="button" onClick={() => exec('insertOrderedList')} title="Lista numerada"><i className="fa-solid fa-list-ol"></i></button>
      <button type="button" onClick={insertLink} title="Enlace"><i className="fa-solid fa-link"></i></button>
      <button type="button" onClick={setColor} title="Color de texto"><i className="fa-solid fa-font" style={{ color: 'var(--oro)' }}></i></button>
    </div>
  );
};

export default RichTextToolbar;
