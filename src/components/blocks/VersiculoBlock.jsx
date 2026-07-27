import React from 'react';
import { parseMarkdownLinks } from '../LinkTooltip';
import AnnotatedText from './AnnotatedText';

const VersiculoBlock = ({ block }) => (
  <AnnotatedText
    className="se-block bible-verse"
    html={block.text}
    before={
      <strong className="verse-ref">
        {block.reference}
        {block.translation && (
          <span style={{ fontSize: '0.75rem', color: '#888', marginLeft: '10px', fontFamily: "'Lora', serif" }}>
            {block.translation}
          </span>
        )}
      </strong>
    }
    after={
      block.context && (
        <span className="verse-context">
          <div dangerouslySetInnerHTML={{ __html: parseMarkdownLinks(block.context) }} />
        </span>
      )
    }
  />
);

export default VersiculoBlock;
