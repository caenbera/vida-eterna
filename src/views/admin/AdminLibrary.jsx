import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadAllStudies, saveStudy, deleteStudy, downloadStudiesJson } from '../../services/studiesService';
import { createStudy } from '../../lib/blocks';
import { CATEGORIES } from '../../lib/categories';
import { AdminBreadcrumbs } from './AdminLayout';

const AdminLibrary = () => {
  const navigate = useNavigate();
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openCategories, setOpenCategories] = useState({ deidad: true });
  const [movingStudy, setMovingStudy] = useState(null);

  useEffect(() => {
    (async () => {
      setStudies(await loadAllStudies());
      setLoading(false);
    })();
  }, []);

  const refresh = async () => setStudies(await loadAllStudies());

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return studies.filter((s) => {
      const matchesSearch = !q || s.title?.toLowerCase().includes(q) || s.subtitle?.toLowerCase().includes(q);
      const matchesCategory = !categoryFilter || s.category === categoryFilter;
      const matchesStatus = !statusFilter || s.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [studies, search, categoryFilter, statusFilter]);

  const toggleCategory = (id) => setOpenCategories((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleDuplicate = async (study) => {
    const clone = { ...createStudy({ ...study, id: undefined, title: `${study.title} (copia)`, status: 'borrador' }), sections: study.sections };
    await saveStudy(clone);
    await refresh();
  };

  const handleToggleStatus = async (study) => {
    const updated = { ...study, status: study.status === 'publicado' ? 'borrador' : 'publicado' };
    await saveStudy(updated);
    await refresh();
  };

  const handleDelete = async (study) => {
    if (!window.confirm(`¿Eliminar el estudio "${study.title}" permanentemente?`)) return;
    await deleteStudy(study.id);
    await refresh();
  };

  const handleMove = async (newCategory) => {
    if (!movingStudy) return;
    await saveStudy({ ...movingStudy, category: newCategory });
    setMovingStudy(null);
    await refresh();
  };

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Panel de administración', to: '/admin' }, { label: 'Biblioteca de estudios' }]} />

      <div className="admin-header-row">
        <div>
          <div className="admin-page-title">Biblioteca de Estudios <i className="fa-solid fa-book-open" style={{ color: 'var(--oro)', fontSize: '1.2rem' }}></i></div>
          <div className="admin-page-subtitle">Gestiona todos los estudios bíblicos de Vida Eterna.</div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-outline" onClick={() => downloadStudiesJson(studies)}>
            <i className="fa-solid fa-download"></i> Exportar JSON
          </button>
          <button className="btn-solid-navy" onClick={() => navigate('/admin/estudios/nuevo')}>
            <i className="fa-solid fa-plus"></i> Nuevo estudio
          </button>
        </div>
      </div>

      <div className="admin-search-row">
        <input
          placeholder="Buscar estudios..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">Todas las categorías</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="publicado">Publicado</option>
          <option value="borrador">Borrador</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9aa4b5' }}>
          <i className="fa-solid fa-spinner fa-spin"></i> Cargando...
        </div>
      ) : (
        CATEGORIES.map((cat) => {
          const catStudies = filtered.filter((s) => s.category === cat.id);
          if ((search || categoryFilter || statusFilter) && catStudies.length === 0) return null;
          const publishedCount = catStudies.filter((s) => s.status === 'publicado').length;
          const draftCount = catStudies.length - publishedCount;
          const isOpen = !!openCategories[cat.id];

          return (
            <div className="admin-category-block" key={cat.id}>
              <div className="admin-category-header" onClick={() => toggleCategory(cat.id)}>
                <div className="admin-category-header-left">
                  <i className={`fa-solid ${cat.icon}`}></i>
                  {cat.name}
                  <span className="admin-category-count">{catStudies.length} estudios</span>
                </div>
                <div className="admin-category-badges">
                  {publishedCount > 0 && <span className="admin-pill published">{publishedCount} publicados</span>}
                  {draftCount > 0 && <span className="admin-pill draft">{draftCount} borradores</span>}
                  <i className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
                </div>
              </div>

              {isOpen && (
                <div className="admin-study-grid">
                  {catStudies.map((study) => (
                    <div className="admin-study-card" key={study.id}>
                      <div className="admin-study-card-icon" style={{ background: '#fef2e2', color: '#c2760f' }}>
                        <i className={`fa-solid ${study.icon || 'fa-book'}`}></i>
                      </div>
                      <div className="admin-study-card-title">{study.title}</div>
                      <div className="admin-study-card-desc">{study.subtitle}</div>
                      <span className={`admin-pill ${study.status === 'publicado' ? 'published' : 'draft'}`}>
                        {study.status === 'publicado' ? 'Publicado' : 'Borrador'}
                      </span>
                      <div className="admin-study-card-actions">
                        <button onClick={() => navigate(`/admin/estudios/${study.id}/constructor`)}>
                          <i className="fa-solid fa-pen"></i> Editar
                        </button>
                        <button onClick={() => handleDuplicate(study)}>
                          <i className="fa-regular fa-copy"></i> Duplicar
                        </button>
                        <button onClick={() => handleToggleStatus(study)}>
                          <i className={`fa-solid ${study.status === 'publicado' ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                          {study.status === 'publicado' ? ' Ocultar' : ' Publicar'}
                        </button>
                        <button onClick={() => setMovingStudy(study)}>
                          <i className="fa-solid fa-folder-tree"></i> Mover
                        </button>
                        <button className="danger" onClick={() => handleDelete(study)}>
                          <i className="fa-solid fa-trash-can"></i> Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="admin-add-study-card" onClick={() => navigate(`/admin/estudios/nuevo?categoria=${cat.id}`)}>
                    <i className="fa-solid fa-plus" style={{ marginRight: '8px' }}></i> Agregar estudio
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      {movingStudy && (
        <div className="modal" onClick={() => setMovingStudy(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">Mover "{movingStudy.title}" a otra categoría</div>
            <div className="form-group">
              <select className="admin-select" defaultValue={movingStudy.category} id="move-category-select">
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="modal-buttons">
              <button className="modal-btn modal-close" onClick={() => setMovingStudy(null)}>Cancelar</button>
              <button
                className="modal-btn modal-save"
                onClick={() => handleMove(document.getElementById('move-category-select').value)}
              >
                Mover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLibrary;
