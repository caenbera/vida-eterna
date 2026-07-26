import React from 'react';
import { parseMarkdownLinks } from '../LinkTooltip';

const NotaBlock = ({ block }) => (
  <div className="se-block se-block-nota">
    <div className="se-block-label">
      <i className="fa-solid fa-diagram-project"></i>
      {block.title || 'Nota'}
    </div>
    <div dangerouslySetInnerHTML={{ __html: parseMarkdownLinks(block.content) }} />
  </div>
);

export default NotaBlock;
