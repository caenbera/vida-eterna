import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadAllStudies, loadAllTemplates } from '../../services/studiesService';
import { CATEGORIES } from '../../lib/categories';
import { countVerses, countReferences } from '../../lib/blocks';

const timeAgo = (ts) => {
  if (!ts) return '';
  const diffMs = Date.now() - ts;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'Hace un momento';
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `Hace ${days} d`;
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const [studies, setStudies] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [s, t] = await Promise.all([loadAllStudies(), loadAllTemplates()]);
      setStudies(s);
      setTemplates(t);
      setLoading(false);
    })();
  }, []);

  const published = studies.filter((s) => s.status === 'publicado').length;
  const totalVerses = studies.reduce((acc, s) => acc + countVerses(s), 0);
  const totalRefs = studies.reduce((acc, s) => acc + countReferences(s), 0);

  const recent = [...studies]
    .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))
    .slice(0, 5);

  const stats = [
    { label: 'Estudios', value: studies.length, sub: `${published} publicados`, subColor: '#1e8a4a', icon: 'fa-book-open', bg: '#eaf1fd', color: '#3b82f6' },
    { label: 'Categorías', value: CATEGORIES.length, sub: 'Activas', subColor: '#1e8a4a', icon: 'fa-folder', bg: '#eafaf0', color: '#22c55e' },
    { label: 'Plantillas', value: templates.length, sub: 'Disponibles', subColor: '#7c3aed', icon: 'fa-file-lines', bg: '#f3ecfd', color: '#a855f7' },
    { label: 'Versículos', value: totalVerses, sub: 'En total', subColor: '#c2760f', icon: 'fa-book', bg: '#fef2e2', color: '#f97316' },
    { label: 'Referencias', value: totalRefs, sub: 'En total', subColor: '#0e9488', icon: 'fa-link', bg: '#e7f8f6', color: '#14b8a6' },
  ];

  return (
    <div>
      <div className="admin-header-row">
        <div>
          <div className="admin-page-title">¡Bienvenido, Administrador!</div>
          <div className="admin-page-subtitle">Gestiona y organiza los estudios bíblicos de Vida Eterna.</div>
        </div>
        <button className="btn-solid-navy" onClick={() => navigate('/admin/estudios/nuevo')}>
          <i className="fa-solid fa-plus"></i> Crear nuevo estudio
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9aa4b5' }}>
          <i className="fa-solid fa-spinner fa-spin"></i> Cargando panel...
        </div>
      ) : (
        <>
          <div className="admin-stats-grid">
            {stats.map((s) => (
              <div className="admin-stat-card" key={s.label}>
                <div className="admin-stat-icon" style={{ background: s.bg, color: s.color }}>
                  <i className={`fa-solid ${s.icon}`}></i>
                </div>
                <div className="admin-stat-value">{s.value}</div>
                <div className="admin-stat-label">{s.label}</div>
                <div className="admin-stat-sub" style={{ color: s.subColor }}>{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="admin-panels-row">
            <div className="admin-card">
              <div className="admin-card-title">
                <i className="fa-regular fa-clock"></i> Actividad reciente
              </div>
              {recent.length === 0 ? (
                <div className="admin-empty-state">
                  <i className="fa-regular fa-folder-open"></i>
                  <div>Todavía no hay estudios creados.</div>
                </div>
              ) : (
                recent.map((s) => (
                  <div className="admin-activity-item" key={s.id}>
                    <div className="admin-activity-icon">
                      <i className="fa-solid fa-file-lines"></i>
                    </div>
                    <div className="admin-activity-text">
                      Estudio actualizado: <strong>&ldquo;{s.title}&rdquo;</strong>
                    </div>
                    <div className="admin-activity-time">{timeAgo(s.updatedAt || s.createdAt)}</div>
                  </div>
                ))
              )}
            </div>

            <div className="admin-card">
              <div className="admin-card-title">
                <i className="fa-solid fa-bolt"></i> Accesos rápidos
              </div>
              <NavQuickLink icon="fa-book-open" label="Ver todos los estudios" onClick={() => navigate('/admin/estudios')} />
              <NavQuickLink icon="fa-file-lines" label="Mis plantillas" onClick={() => navigate('/admin/plantillas')} />
              <NavQuickLink icon="fa-gear" label="Configuración general" onClick={() => navigate('/admin/configuracion')} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const NavQuickLink = ({ icon, label, onClick }) => (
  <button className="admin-quicklink" onClick={onClick} style={{ width: '100%', cursor: 'pointer' }}>
    <span><i className={`fa-solid ${icon}`} style={{ marginRight: '10px' }}></i>{label}</span>
    <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.7rem' }}></i>
  </button>
);

export default AdminPanel;
