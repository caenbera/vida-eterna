import React, { useRef, useState } from 'react';
import { parseMarkdownLinks } from '../LinkTooltip';
import WordTagPopover from './WordTagPopover';

const VersiculoBlock = ({ block }) => {
  const containerRef = useRef(null);
  const [popover, setPopover] = useState(null);

  const handleClick = (e) => {
    const tag = e.target.closest('.word-tag');
    if (!tag || !containerRef.current?.contains(tag)) {
      setPopover(null);
      return;
    }
    const rect = tag.getBoundingClientRect();
    setPopover({
      position: { x: rect.left, y: rect.bottom },
      data: {
        word: tag.textContent,
        hebrew: tag.dataset.hebrew,
        translit: tag.dataset.translit,
        strong: tag.dataset.strong,
        meaning: tag.dataset.meaning,
        note: tag.dataset.note,
        refs: tag.dataset.refs,
        other: tag.dataset.other,
      },
    });
  };

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
      {popover && (
        <WordTagPopover data={popover.data} position={popover.position} onClose={() => setPopover(null)} />
      )}
    </div>
  );
};

export default VersiculoBlock;
