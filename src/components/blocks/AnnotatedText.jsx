import React, { useRef, useState } from 'react';
import { parseMarkdownLinks } from '../LinkTooltip';
import ReadOnlyAnnotationCard from './ReadOnlyAnnotationCard';
import ConnectorOverlay from '../annotations/ConnectorOverlay';
import { ANNOTATION_KINDS } from '../../lib/annotationKinds';
import { placeCards } from '../../lib/annotationLayout';

const CARD_WIDTH = 320;
const CARD_HEIGHT_ESTIMATE = 220;

// Interacción de anotaciones (clic en una palabra anotada -> tarjeta de
// lectura + línea conectora) compartida entre cualquier bloque con texto
// anotable (versículo, cita de escrito, etc.). No sabe nada de la
// "carátula" propia de cada tipo de bloque (referencia bíblica, autor de
// una cita...) — eso se pasa como `before`/`after` para que quede DENTRO
// del mismo contenedor y los selectores CSS existentes (ej. ".bible-verse
// strong.verse-ref") sigan funcionando igual que antes de esta extracción.
const AnnotatedText = ({ html, className, before, after }) => {
  const containerRef = useRef(null);
  const [cards, setCards] = useState([]);
  const spanElsRef = useRef({});
  const cardElsRef = useRef({});

  const handleClick = (e) => {
    const tag = e.target.closest('.word-tag');
    if (!tag || !containerRef.current?.contains(tag)) return;
    if (!tag.id) tag.id = `wtag_pub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const cardId = tag.id;
    spanElsRef.current[cardId] = tag;
    setCards((prev) => (prev.some((c) => c.cardId === cardId) ? prev : [...prev, { cardId, dataset: { ...tag.dataset } }]));
  };

  const closeCard = (cardId) => {
    setCards((prev) => prev.filter((c) => c.cardId !== cardId));
    delete spanElsRef.current[cardId];
    delete cardElsRef.current[cardId];
  };

  const positions = placeCards(
    cards
      .filter((c) => spanElsRef.current[c.cardId])
      .map((c) => ({
        id: c.cardId,
        anchorRect: spanElsRef.current[c.cardId].getBoundingClientRect(),
        width: CARD_WIDTH,
        height: CARD_HEIGHT_ESTIMATE,
      }))
  );

  return (
    <div className={className} ref={containerRef} onClick={handleClick}>
      {before}
      <div dangerouslySetInnerHTML={{ __html: parseMarkdownLinks(html) }} />
      {after}

      {cards.map((card) => {
        const pos = positions.get(card.cardId);
        if (!pos) return null;
        return (
          <ReadOnlyAnnotationCard
            key={card.cardId}
            ref={(el) => { if (el) cardElsRef.current[card.cardId] = el; }}
            card={card}
            onClose={() => closeCard(card.cardId)}
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: CARD_WIDTH }}
          />
        );
      })}

      <ConnectorOverlay
        cards={cards.map((c) => ({
          id: c.cardId,
          sourceEl: spanElsRef.current[c.cardId],
          cardEl: cardElsRef.current[c.cardId],
          color: (ANNOTATION_KINDS[c.dataset.kind || 'lexico'] || {}).color || '#0a192f',
        }))}
      />
    </div>
  );
};

export default AnnotatedText;
