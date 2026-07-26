import React, { forwardRef } from 'react';

// Marco visual compartido entre la tarjeta editable del admin y la tarjeta de
// solo lectura del sitio público: borde de color según el tipo, encabezado con
// icono/etiqueta/acciones, y un slot de contenido.
const AnnotationCardFrame = forwardRef(({ kind, onClose, actions, style, children }, ref) => {
  if (!kind) return null;

  return (
    <div ref={ref} className="annotation-card" style={style} onMouseDown={(e) => e.stopPropagation()}>
      <div className="annotation-card-header" style={{ borderLeftColor: kind.color }}>
        <span className="annotation-card-header-title">
          <i className={`fa-solid ${kind.icon}`} style={{ color: kind.color }}></i>
          {kind.label.toUpperCase()}
        </span>
        <span className="annotation-card-header-actions">
          {actions}
          <button type="button" title="Cerrar" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        </span>
      </div>
      <div className="annotation-card-body">{children}</div>
    </div>
  );
});

export default AnnotationCardFrame;
