import React from 'react';
import { parseMarkdownLinks } from '../LinkTooltip';

const TextoBlock = ({ block }) => (
  <div className="se-block se-block-texto">
    {block.title && <h4>{block.title}</h4>}
    <div dangerouslySetInnerHTML={{ __html: parseMarkdownLinks(block.content) }} />
  </div>
);

export default TextoBlock;
