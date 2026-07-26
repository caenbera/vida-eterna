import React, { useEffect, useState } from 'react';

// Dibuja una línea punteada por cada tarjeta de anotación abierta, del color de
// su tipo, desde la palabra anotada hasta la tarjeta. Recalcula en scroll/resize
// y cuando cambia el tamaño de la fuente o la tarjeta (ResizeObserver).
const ConnectorOverlay = ({ cards }) => {
  const [, forceRecalc] = useState(0);

  useEffect(() => {
    const recalc = () => forceRecalc((t) => t + 1);
    window.addEventListener('scroll', recalc, true);
    window.addEventListener('resize', recalc);
    const ro = new ResizeObserver(recalc);
    cards.forEach(({ sourceEl, cardEl }) => {
      if (sourceEl) ro.observe(sourceEl);
      if (cardEl) ro.observe(cardEl);
    });
    return () => {
      window.removeEventListener('scroll', recalc, true);
      window.removeEventListener('resize', recalc);
      ro.disconnect();
    };
  }, [cards]);

  const visible = cards.filter((c) => c.sourceEl && c.cardEl);
  if (!visible.length) return null;

  return (
    <svg className="annotation-connector-overlay">
      {visible.map(({ id, sourceEl, cardEl, color }) => {
        const s = sourceEl.getBoundingClientRect();
        const c = cardEl.getBoundingClientRect();
        const x1 = s.left + s.width / 2;
        const y1 = s.bottom;
        const x2 = c.left + Math.min(24, c.width / 2);
        const y2 = c.top;
        const midY = (y1 + y2) / 2;
        return (
          <path
            key={id}
            d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeDasharray="5 4"
          />
        );
      })}
    </svg>
  );
};

export default ConnectorOverlay;
