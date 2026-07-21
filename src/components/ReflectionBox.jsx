import React, { useState, useEffect } from 'react';

const ReflectionBox = ({ studyId, unitId, questionId, reflectionAdult, reflectionChild }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [hasSavedNote, setHasSavedNote] = useState(false);

  const storageKey = `vida_eterna_notes_${studyId}_${unitId}_${questionId}`;

  // Check if a note already exists
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setNoteText(saved);
      setHasSavedNote(true);
    } else {
      setNoteText('');
      setHasSavedNote(false);
    }
  }, [storageKey, isModalOpen]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (noteText.trim()) {
      localStorage.setItem(storageKey, noteText);
      setHasSavedNote(true);
    } else {
      localStorage.removeItem(storageKey);
      setHasSavedNote(false);
    }
    setIsModalOpen(false);
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="reflection-box">
      <div className="reflection-title">
        <i className="fa-solid fa-lightbulb" style={{ marginRight: '8px', color: 'var(--oro)' }}></i>
        Reflexiones de Aprendizaje
      </div>
      
      {reflectionAdult && (
        <div className="reflection-item">
          <strong>Adulto:</strong>
          <p>{reflectionAdult}</p>
        </div>
      )}
      
      {reflectionChild && (
        <div className="reflection-item">
          <strong>Niño:</strong>
          <p>{reflectionChild}</p>
        </div>
      )}

      <button className="save-note-btn" onClick={handleOpenModal}>
        <i className="fa-solid fa-floppy-disk"></i>
        {hasSavedNote ? 'Editar Reflexión Guardada' : 'Guardar Reflexión'}
      </button>

      {hasSavedNote && (
        <div style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--verde-ninos)', fontStyle: 'italic' }}>
          <i className="fa-solid fa-circle-check" style={{ marginRight: '5px' }}></i>
          Tienes una reflexión guardada para esta pregunta.
        </div>
      )}

      {/* Note taking Modal */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">Escribe tu Reflexión Personal</div>
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '10px' }}>
              Tus notas se guardan de forma segura y privada únicamente en tu dispositivo.
            </p>
            <textarea
              className="modal-textarea"
              placeholder="Escribe tus reflexiones, notas o pensamientos sobre este punto..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <div className="modal-buttons">
              <button className="modal-btn modal-close" onClick={handleClose}>
                Cancelar
              </button>
              <button className="modal-btn modal-save" onClick={handleSave}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReflectionBox;
