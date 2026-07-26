import React, { useRef, useState } from 'react';
import { parseMarkdownLinks } from '../LinkTooltip';
import ReadOnlyAnnotationCard from './ReadOnlyAnnotationCard';
import ConnectorOverlay from '../annotations/ConnectorOverlay';
import { ANNOTATION_KINDS } from '../../lib/annotationKinds';
import { placeCards } from '../../lib/annotationLayout';

const CARD_WIDTH = 320;
const CARD_HEIGHT_ESTIMATE = 220;

const VersiculoBlock = ({ block }) => {
  const containerRef = useRef(null);
  const [cards, setCards] = useState([]); // { cardId, dataset }
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
    <div className="se-block bible-verse" ref={containerRef} onClick={handleClick}>
      <strong className="verse-ref">
        {block.reference}
        {block.translation && (
          <span style={{ fontSize: '0.75rem', color: '#888', marginLeft: '10px', fontFamily: "'Lora', serif" }}>
            {block.translation}
          </span>
        )}
      </strong>
      <div dangerouslySetInnerHTML={{ __html: parseMarkdownLinks(block.text) }} />
      {block.context && (
        <span className="verse-context">
          <div dangerouslySetInnerHTML={{ __html: parseMarkdownLinks(block.context) }} />
        </span>
      )}

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

export default VersiculoBlock;
