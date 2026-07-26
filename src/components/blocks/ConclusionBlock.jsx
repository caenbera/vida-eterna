import React from 'react';
import { parseMarkdownLinks } from '../LinkTooltip';

const ConclusionBlock = ({ block }) => (
  <div className="se-block se-block-conclusion">
    <div className="se-block-label">
      <i className="fa-solid fa-circle-check"></i>
      {block.title || 'Conclusión'}
    </div>
    <div dangerouslySetInnerHTML={{ __html: parseMarkdownLinks(block.content) }} />
  </div>
);

export default ConclusionBlock;
