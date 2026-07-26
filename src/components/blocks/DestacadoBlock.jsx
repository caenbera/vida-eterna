import React from 'react';
import { parseMarkdownLinks } from '../LinkTooltip';

const DestacadoBlock = ({ block }) => (
  <div className="se-block se-block-destacado">
    <div className="se-block-label">
      <i className="fa-solid fa-thumbtack"></i>
      {block.title || 'Idea fundamental'}
    </div>
    <div dangerouslySetInnerHTML={{ __html: parseMarkdownLinks(block.content) }} />
  </div>
);

export default DestacadoBlock;
