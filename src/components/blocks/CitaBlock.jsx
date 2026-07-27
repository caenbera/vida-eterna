import React from 'react';
import AnnotatedText from './AnnotatedText';

const CitaBlock = ({ block }) => (
  <AnnotatedText
    className="se-block escrito-cita"
    html={block.text}
    before={
      <div className="escrito-cita-byline">
        <i className="fa-solid fa-quote-left"></i>
        {block.author && <strong>{block.author}</strong>}
        {block.work && <em>{block.work}</em>}
        {block.citation && <span className="escrito-cita-ref">{block.citation}</span>}
        {block.sourceUrl && (
          <a href={block.sourceUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
            Ver fuente <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.7rem' }}></i>
          </a>
        )}
      </div>
    }
  />
);

export default CitaBlock;
