import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import logo from '../../assets/logo01.png';
import './admin.css';

const NAV_ITEMS = [
  { to: '/admin', end: true, icon: 'fa-house', label: 'Panel' },
  { to: '/admin/estudios', icon: 'fa-book-open', label: 'Estudios' },
  { to: '/admin/plantillas', icon: 'fa-file-lines', label: 'Plantillas' },
  { to: '/admin/configuracion', icon: 'fa-gear', label: 'Configuración' },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('vida_eterna_admin_sidebar_collapsed') === 'true');

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('vida_eterna_admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  useEffect(() => {
    if (auth) {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (!user) navigate('/login');
        else setCheckedAuth(true);
      });
      return () => unsubscribe();
    }
    const authLocal = sessionStorage.getItem('vida_eterna_admin_auth');
    if (authLocal !== 'true') navigate('/login');
    else setCheckedAuth(true);
  }, [navigate]);

  const handleLogout = () => {
    if (auth) auth.signOut();
    else sessionStorage.removeItem('vida_eterna_admin_auth');
    navigate('/login');
  };

  if (!checkedAuth) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', fontFamily: "'Cinzel', serif", color: 'var(--azul-real)' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
        Verificando sesión...
      </div>
    );
  }

  return (
    <div className={`admin-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="admin-sidebar">
        <button className="admin-sidebar-collapse-btn" onClick={toggleCollapsed} title={collapsed ? 'Expandir menú' : 'Colapsar menú'}>
          <i className={`fa-solid ${collapsed ? 'fa-angles-right' : 'fa-angles-left'}`}></i>
        </button>

        <div className="admin-sidebar-logo">
          <img src={logo} alt="Vida Eterna" />
          {!collapsed && (
            <div>
              <div className="brand-title">Vida Eterna</div>
              <div className="brand-sub">ESTUDIOS BÍBLICOS</div>
            </div>
          )}
        </div>

        {!collapsed && <div className="admin-nav-group-label">ADMINISTRACIÓN</div>}
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={item.label}
            className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
          >
            <i className={`fa-solid ${item.icon}`}></i>
            {!collapsed && item.label}
          </NavLink>
        ))}

        <div className="admin-sidebar-footer">
          <button className="admin-nav-link" onClick={() => navigate('/')} title="Ir a la web">
            <i className="fa-solid fa-arrow-up-right-from-square"></i>
            {!collapsed && 'Ir a la web'}
          </button>
          <div className="admin-sidebar-user">
            <div className="avatar" onClick={collapsed ? handleLogout : undefined} title={collapsed ? 'Cerrar sesión' : undefined} style={collapsed ? { cursor: 'pointer' } : undefined}>
              <i className="fa-solid fa-user"></i>
            </div>
            {!collapsed && (
              <div style={{ flex: 1 }}>
                <div>Administrador</div>
                <button
                  onClick={handleLogout}
                  style={{ background: 'none', border: 'none', color: '#9fb0c8', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="admin-main">
        <div className="admin-topbar">
          <div style={{ fontWeight: 'bold', color: 'var(--azul-real)' }}>Panel de administración</div>
          <div className="admin-topbar-actions">
            <i className="fa-regular fa-bell"></i>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '30px', height: '30px', borderRadius: '50%', background: 'var(--acento-suave)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--azul-real)',
                }}
              >
                <i className="fa-solid fa-user" style={{ fontSize: '0.8rem' }}></i>
              </div>
              Administrador
            </div>
          </div>
        </div>

        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export const AdminBreadcrumbs = ({ items }) => (
  <div className="admin-breadcrumbs" style={{ marginBottom: '18px' }}>
    {items.map((item, idx) => (
      <React.Fragment key={idx}>
        {idx > 0 && <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }}></i>}
        {item.to ? <NavLink to={item.to}>{item.label}</NavLink> : <span className="current">{item.label}</span>}
      </React.Fragment>
    ))}
  </div>
);

export default AdminLayout;
