import React, { useState } from 'react';

const TABS = [
  { id: 'nota', label: 'Nota' },
  { id: 'referencias', label: 'Referencias' },
  { id: 'significado', label: 'Significado' },
  { id: 'otros', label: 'Otros versículos' },
];

const splitList = (str) => (str || '').split(';').map((s) => s.trim()).filter(Boolean);

const WordTagPopover = ({ data, position, onClose }) => {
  const [tab, setTab] = useState('nota');
  if (!data) return null;

  const refs = splitList(data.refs);
  const other = splitList(data.other);

  const style = {
    top: Math.max(10, Math.min(position.y + 10, (typeof window !== 'undefined' ? window.innerHeight : 800) - 300)),
    left: Math.max(10, Math.min(position.x, (typeof window !== 'undefined' ? window.innerWidth : 1000) - 335)),
  };

  return (
    <div className="word-tag-popover" style={style} onClick={(e) => e.stopPropagation()}>
      <div className="word-tag-popover-header">
        <strong>{data.word}{data.translit ? ` — ${data.translit}` : ''}</strong>
        <button className="word-tag-popover-close" onClick={onClose} aria-label="Cerrar">
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div className="word-tag-popover-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`word-tag-popover-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="word-tag-popover-content">
        {tab === 'nota' &&
          (data.note ? <p>{data.note}</p> : <p style={{ color: '#999' }}>Sin nota para esta palabra.</p>)}
        {tab === 'referencias' &&
          (refs.length ? (
            <ul style={{ paddingLeft: '18px' }}>
              {refs.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#999' }}>Sin referencias relacionadas.</p>
          ))}
        {tab === 'significado' && (
          <>
            {data.hebrew && (
              <>
                <div className="wt-label">Hebreo / Griego</div>
                <p>{data.hebrew}</p>
              </>
            )}
            {data.strong && (
              <>
                <div className="wt-label">Strong's</div>
                <p>{data.strong}</p>
              </>
            )}
            {data.meaning && (
              <>
                <div className="wt-label">Significado</div>
                <p>{data.meaning}</p>
              </>
            )}
            {!data.hebrew && !data.strong && !data.meaning && (
              <p style={{ color: '#999' }}>Sin datos de significado.</p>
            )}
          </>
        )}
        {tab === 'otros' &&
          (other.length ? (
            <ul style={{ paddingLeft: '18px' }}>
              {other.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#999' }}>Sin otras apariciones registradas.</p>
          ))}
      </div>
    </div>
  );
};

export default WordTagPopover;
