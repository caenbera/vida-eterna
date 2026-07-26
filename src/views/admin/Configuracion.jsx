import React from 'react';
import { AdminBreadcrumbs } from './AdminLayout';
import { isFirestoreEnabled } from '../../services/studiesService';

const Configuracion = () => (
  <div>
    <AdminBreadcrumbs items={[{ label: 'Panel de administración', to: '/admin' }, { label: 'Configuración' }]} />
    <div className="admin-page-title">Configuración</div>
    <div className="admin-page-subtitle">Ajustes generales de la plataforma.</div>

    <div className="admin-card" style={{ maxWidth: '560px' }}>
      <div className="admin-card-title"><i className="fa-solid fa-database"></i> Almacenamiento de datos</div>
      <p style={{ fontSize: '0.9rem', color: '#556', lineHeight: 1.7 }}>
        {isFirestoreEnabled()
          ? 'Firebase Firestore está configurado. Los estudios y plantillas se guardan en la nube.'
          : 'No hay Firebase configurado: la app funciona en modo local (los cambios se guardan en este navegador). Usa "Exportar JSON" en Biblioteca de estudios para respaldar tu contenido.'}
      </p>
    </div>
  </div>
);

export default Configuracion;
