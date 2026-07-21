import React from 'react';

const SideMap = ({ units, currentUnitId, onSelectUnit, readUnits = {} }) => {
  return (
    <div className="progress-map">
      <h4>Tu Progreso</h4>
      {units.map((unit, index) => {
        const isCurrent = unit.id === currentUnitId;
        const isCompleted = readUnits[unit.id] === true;
        
        let statusClass = "pending";
        let statusIcon = <i className="fa-regular fa-circle-notch"></i>;

        if (isCurrent) {
          statusClass = "current";
          statusIcon = <i className="fa-solid fa-play"></i>;
        } else if (isCompleted) {
          statusClass = "completed";
          statusIcon = <i className="fa-solid fa-check"></i>;
        } else {
          statusIcon = <i className="fa-regular fa-circle"></i>;
        }

        // Display unit name: remove index prefix if it exists in the name
        let displayName = unit.title;
        
        return (
          <div
            key={unit.id}
            className={`progress-item ${statusClass}`}
            onClick={() => onSelectUnit(unit.id)}
          >
            <span className="status-icon">{statusIcon}</span>
            <span>
              {unit.id === 'integrado' ? '' : `${index + 1}. `}
              {displayName}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default SideMap;
