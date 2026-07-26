import React from 'react';
import { progressKey } from '../lib/blocks';

const SideMap = ({ sections, currentSectionId, currentSubtopicId, progress = {}, onSelect }) => {
  return (
    <div className="progress-map">
      <h4>Bosquejo del Estudio</h4>
      {sections.map((section, sIdx) => (
        <div key={section.id} style={{ marginBottom: '10px' }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--azul-real)', margin: '10px 0 4px' }}>
            {sIdx + 1}. {section.title}
          </div>
          {(section.subtopics || []).map((sub, subIdx) => {
            const isCurrent = section.id === currentSectionId && sub.id === currentSubtopicId;
            const isCompleted = !!progress[progressKey(section.id, sub.id)];

            let statusClass = 'pending';
            let statusIcon = <i className="fa-regular fa-circle"></i>;
            if (isCurrent) { statusClass = 'current'; statusIcon = <i className="fa-solid fa-play"></i>; }
            else if (isCompleted) { statusClass = 'completed'; statusIcon = <i className="fa-solid fa-check"></i>; }

            return (
              <div
                key={sub.id}
                className={`progress-item ${statusClass}`}
                onClick={() => onSelect(section.id, sub.id)}
                style={{ paddingLeft: '14px' }}
              >
                <span className="status-icon">{statusIcon}</span>
                <span>{sIdx + 1}.{subIdx + 1} {sub.title}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default SideMap;
