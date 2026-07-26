import React, { useState } from 'react';
import BlockRenderer from './BlockRenderer';
import { ACCORDION_COLORS } from '../../lib/blocks';

const AcordeonBlock = ({ block, studyId, contextId }) => {
  const [open, setOpen] = useState(!!block.openByDefault);
  const headerColor = ACCORDION_COLORS[block.color] || ACCORDION_COLORS.azul;

  return (
    <div className="se-block se-block-accordion" style={{ borderColor: headerColor }}>
      <div className="se-block-accordion-header" style={{ background: headerColor }} onClick={() => setOpen((o) => !o)}>
        <span>
          <i className={`fa-solid ${block.icon || 'fa-book-open'}`} style={{ marginRight: '10px' }}></i>
          {block.title}
        </span>
        <i className={`fa-solid ${open ? 'fa-minus' : 'fa-plus'}`}></i>
      </div>
      {open && (
        <div className="se-block-accordion-body">
          {block.description && (
            <p style={{ marginBottom: '15px', fontStyle: 'italic', color: '#666' }}>{block.description}</p>
          )}
          <BlockRenderer blocks={block.blocks} studyId={studyId} contextId={`${contextId}_${block.id}`} />
        </div>
      )}
    </div>
  );
};

export default AcordeonBlock;
