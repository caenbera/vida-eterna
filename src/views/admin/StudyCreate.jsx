import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { saveStudy, loadTemplate } from '../../services/studiesService';
import { createStudy, createSection, createSubtopic, createBlock, ICON_OPTIONS, COVER_IMAGE_RECOMMENDATION } from '../../lib/blocks';
import { CATEGORIES } from '../../lib/categories';
import { AdminBreadcrumbs } from './AdminLayout';

const StudyCreate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('plantilla');

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState(searchParams.get('categoria') || CATEGORIES[0].id);
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('fa-book');
  const [coverImage, setCoverImage] = useState('');
  const [status, setStatus] = useState('borrador');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState(null);

  useEffect(() => {
    if (templateId) loadTemplate(templateId).then(setTemplate);
  }, [templateId]);

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) return;
    setSaving(true);

    let sections;
    if (template?.blocks?.length) {
      const section = createSection('Unidad 1');
      const subtopic = createSubtopic('Unidad 1');
      subtopic.blocks = template.blocks.map((tplBlock) => {
        const block = createBlock(tplBlock.type);
        block.title = tplBlock.title || block.title;
        return block;
      });
      section.subtopics = [subtopic];
      sections = [section];
    }

    const study = createStudy({
      title,
      subtitle,
      category,
      description,
      icon,
      coverImage,
      status,
      templateId: template?.id || null,
      sections,
    });
    await saveStudy(study);
    setSaving(false);
    navigate(`/admin/estudios/${study.id}/constructor`);
  };

  const categoryName = CATEGORIES.find((c) => c.id === category)?.name;

  return (
    <div>
      <AdminBreadcrumbs
        items={[
          { label: 'Panel de administración', to: '/admin' },
          { label: 'Biblioteca de estudios', to: '/admin/estudios' },
          { label: 'Crear estudio' },
        ]}
      />

      <div className="admin-page-title">Crear estudio <i className="fa-solid fa-book-open" style={{ color: 'var(--oro)', fontSize: '1.2rem' }}></i></div>
      <div className="admin-page-subtitle">
        {template ? `Basado en la plantilla "${template.title}".` : 'Completa la información básica para crear tu nuevo estudio bíblico.'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px', alignItems: 'start' }}>
        <div className="admin-card">
          <div className="admin-card-title"><i className="fa-regular fa-file-lines"></i> Información básica</div>

          <div className="form-group">
            <label>Título del estudio *</label>
            <input className="admin-input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="Ej: Engendrado pero no Creado" />
            <div style={{ fontSize: '0.72rem', color: '#9aa4b5', textAlign: 'right' }}>{title.length} / 100</div>
          </div>

          <div className="form-group">
            <label>Subtítulo (opcional)</label>
            <input className="admin-input" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} maxLength={150} placeholder="Un subtítulo corto que describa el enfoque del estudio." />
            <div style={{ fontSize: '0.72rem', color: '#9aa4b5', textAlign: 'right' }}>{subtitle.length} / 150</div>
          </div>

          <div className="form-group">
            <label>Categoría *</label>
            <select className="admin-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Descripción corta *</label>
            <textarea className="admin-textarea" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} placeholder="Breve descripción que aparecerá en las tarjetas de la biblioteca." />
            <div style={{ fontSize: '0.72rem', color: '#9aa4b5', textAlign: 'right' }}>{description.length} / 300</div>
          </div>

          <div className="form-group">
            <label>Icono del estudio</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '10px', background: '#fff6e6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--oro)', fontSize: '1.4rem' }}>
                <i className={`fa-solid ${icon}`}></i>
              </div>
              <button type="button" className="btn-outline" onClick={() => setShowIconPicker((v) => !v)}>
                <i className="fa-solid fa-shapes"></i> Elegir ícono
              </button>
            </div>
            {showIconPicker && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                {ICON_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => { setIcon(opt); setShowIconPicker(false); }}
                    style={{
                      width: '38px', height: '38px', borderRadius: '8px', border: opt === icon ? '2px solid var(--oro)' : '1.5px solid #dde2ec',
                      background: '#fff', cursor: 'pointer', color: 'var(--azul-real)',
                    }}
                  >
                    <i className={`fa-solid ${opt}`}></i>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Imagen de portada (enlace, opcional)</label>
            <input
              className="admin-input"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://ejemplo.com/mi-imagen.jpg"
            />
            <div style={{ fontSize: '0.72rem', color: '#9aa4b5', marginTop: '4px' }}>
              Tamaño recomendado: {COVER_IMAGE_RECOMMENDATION}. Si la dejas vacía, se usa el ícono de arriba.
            </div>
          </div>

          <div className="form-group">
            <label>Estado del estudio *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { id: 'borrador', label: 'Borrador', desc: 'Solo visible para administradores.' },
                { id: 'publicado', label: 'Publicado', desc: 'Visible para todos los usuarios.' },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setStatus(opt.id)}
                  style={{
                    border: status === opt.id ? '2px solid var(--oro)' : '1.5px solid #dde2ec',
                    background: status === opt.id ? '#fffaf0' : '#fff',
                    borderRadius: '10px', padding: '14px', cursor: 'pointer',
                  }}
                >
                  <strong style={{ color: 'var(--azul-real)' }}>{opt.label}</strong>
                  <div style={{ fontSize: '0.78rem', color: '#6b7688', marginTop: '4px' }}>{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button className="btn-outline" onClick={() => navigate('/admin/estudios')}>Cancelar</button>
            <button className="btn-solid-navy" onClick={handleCreate} disabled={!title.trim() || !description.trim() || saving}>
              {saving ? <><i className="fa-solid fa-spinner fa-spin"></i> Creando...</> : <><i className="fa-regular fa-floppy-disk"></i> Crear estudio</>}
            </button>
          </div>
        </div>

        <div>
          <div className="admin-card" style={{ marginBottom: '18px' }}>
            <div className="admin-card-title"><i className="fa-regular fa-eye"></i> Vista previa</div>
            <div style={{ background: '#fff8e6', borderRadius: '10px', padding: '22px', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', margin: '0 auto 14px', borderRadius: '10px', background: '#fdefc7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--oro)', fontSize: '1.4rem', overflow: 'hidden' }}>
                {coverImage ? (
                  <img src={coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <i className={`fa-solid ${icon}`}></i>
                )}
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', color: 'var(--azul-real)', fontWeight: 'bold' }}>
                {title || 'Título del estudio'}
              </div>
              {subtitle && <div style={{ color: '#6b7688', marginTop: '6px', fontSize: '0.9rem' }}>{subtitle}</div>}
              <span className="admin-pill" style={{ background: '#fdefc7', color: '#a5710e', marginTop: '10px', display: 'inline-block' }}>
                {categoryName}
              </span>
              {description && <p style={{ marginTop: '14px', fontSize: '0.85rem', color: '#555' }}>{description}</p>}
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-title"><i className="fa-regular fa-lightbulb"></i> Consejos</div>
            <ul style={{ fontSize: '0.85rem', color: '#556', lineHeight: '1.9', paddingLeft: '18px' }}>
              <li>Usa un título claro y específico que refleje el tema central.</li>
              <li>El subtítulo ayuda a comunicar el enfoque del estudio.</li>
              <li>Elige la categoría correcta para facilitar la organización.</li>
              <li>La descripción corta aparecerá en la biblioteca de estudios.</li>
              <li>Puedes cambiar el ícono más adelante desde el Constructor.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyCreate;
