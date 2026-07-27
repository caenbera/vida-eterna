import React, { memo, forwardRef } from 'react';
import RichTextToolbar from './RichTextToolbar';

// Aísla el contentEditable + su barra de formato en un componente memoizado
// que SOLO vuelve a renderizar cuando su propio "html" cambia. Sin esto,
// cualquier re-render de BlockEditor (seleccionar texto, escribir el título,
// abrir una tarjeta, etc.) hace que React vuelva a asignar innerHTML sobre
// el contentEditable, lo que colapsa cualquier selección de texto activa
// (confirmado con un MutationObserver: cada re-render de un estado ajeno
// producía una mutación childList sobre este div).
const RichEditableField = memo(
  forwardRef(({ html, onToolbarChange, onBlur, onMouseUp, onKeyUp, onClick }, ref) => (
    <div style={{ position: 'relative' }}>
      <RichTextToolbar targetRef={ref} onChanged={onToolbarChange} />
      <div
        ref={ref}
        className="rich-editable"
        contentEditable
        suppressContentEditableWarning
        data-gramm="false"
        data-gramm_editor="false"
        data-enable-grammarly="false"
        dangerouslySetInnerHTML={{ __html: html || '' }}
        onBlur={onBlur}
        onMouseUp={onMouseUp}
        onKeyUp={onKeyUp}
        onClick={onClick}
      />
    </div>
  )),
  (prev, next) => prev.html === next.html
);

export default RichEditableField;
