import React, { useState } from 'react';
import { parseMarkdownLinks } from '../LinkTooltip';
import ReflectionBox from '../ReflectionBox';

const PreguntaBlock = ({ block, studyId, contextId }) => {
  const [showChild, setShowChild] = useState(false);

  return (
    <div className="se-block question-block">
      <div className="question-title">
        <span>❓ {block.title}</span>
        {block.badge && <span className={`level-badge ${block.badgeType || 'level-semilla'}`}>{block.badge}</span>}
      </div>

      <div className="answer-section">
        <div dangerouslySetInnerHTML={{ __html: parseMarkdownLinks(block.explanation) }} />
      </div>

      {block.childExplanation && (
        <div className="accordion">
          <div className="accordion-header" onClick={() => setShowChild((s) => !s)}>
            🎨 Ver Explicación Sencilla (para niños)
            <i className={`fa-solid ${showChild ? 'fa-minus' : 'fa-plus'}`}></i>
          </div>
          {showChild && (
            <div className="accordion-content">
              <div className="illustration-box">
                <h4>👦 Para Niños:</h4>
                <div dangerouslySetInnerHTML={{ __html: parseMarkdownLinks(block.childExplanation) }} />
              </div>
            </div>
          )}
        </div>
      )}

      {(block.reflectionAdult || block.reflectionChild) && (
        <ReflectionBox
          studyId={studyId}
          unitId={contextId}
          questionId={block.id}
          reflectionAdult={block.reflectionAdult}
          reflectionChild={block.reflectionChild}
        />
      )}

      {block.connection && (
        <div className="connection-box">
          <strong>🔗 Análisis de Conexión:</strong>
          <div dangerouslySetInnerHTML={{ __html: parseMarkdownLinks(block.connection) }} />
        </div>
      )}
    </div>
  );
};

export default PreguntaBlock;
