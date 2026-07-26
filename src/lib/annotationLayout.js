// Posicionamiento de tarjetas de anotación ancladas a una palabra/frase del texto.
// Generaliza el clamp que antes vivía duplicado en AnnotationCard.jsx y
// SelectionToolbar.jsx, y agrega colocación multi-tarjeta sin solape (varias
// tarjetas pueden estar abiertas a la vez, como en la vista de lectura).

export const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

export function clampLeft(left, width, margin = 10) {
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  return clamp(left, margin, viewportWidth - width - margin);
}

export function clampTop(top, height, margin = 10) {
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 900;
  return clamp(top, margin, viewportHeight - height - margin);
}

const GAP = 12;

// cards: [{ id, anchorRect: DOMRect-like, width, height }]
// Devuelve un Map(id -> { top, left }), evitando que dos tarjetas se solapen
// verticalmente cuando sus rangos horizontales se cruzan (empuja hacia abajo).
export function placeCards(cards) {
  const placed = [];
  const positions = new Map();

  const sorted = [...cards].sort((a, b) => a.anchorRect.bottom - b.anchorRect.bottom);

  sorted.forEach(({ id, anchorRect, width, height }) => {
    let left = clampLeft(anchorRect.left, width);
    let top = clampTop(anchorRect.bottom + 10, height);

    let moved = true;
    let guard = 0;
    while (moved && guard < 50) {
      moved = false;
      guard += 1;
      for (const box of placed) {
        const horizontalOverlap = left < box.left + box.width && left + width > box.left;
        const verticalOverlap = top < box.top + box.height + GAP && top + height > box.top;
        if (horizontalOverlap && verticalOverlap) {
          top = box.top + box.height + GAP;
          moved = true;
        }
      }
    }

    placed.push({ left, top, width, height });
    positions.set(id, { top, left });
  });

  return positions;
}
