import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (auth) {
      // Firebase authentication mode
      try {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/admin');
      } catch (err) {
        console.error("Login error: ", err);
        setError('Error al iniciar sesión: Credenciales incorrectas.');
      }
    } else {
      // Fallback local password mode
      const localPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'vidaeterna2026';
      if (password === localPassword) {
        // Authenticate locally using sessionStorage
        sessionStorage.setItem('vida_eterna_admin_auth', 'true');
        navigate('/admin');
      } else {
        setError('Contraseña local incorrecta.');
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="admin-login-card">
        <h2>Super Administrador</h2>
        
        {error && (
          <div style={{ color: 'var(--rojo-advertencia)', marginBottom: '15px', fontSize: '0.9rem', textAlign: 'center', fontWeight: 'bold' }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '8px' }}></i>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          {auth ? (
            <div className="form-group">
              <label htmlFor="email">Correo Electrónico</label>
              <input
                id="email"
                type="email"
                className="form-input"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
              />
            </div>
          ) : (
            <div style={{ backgroundColor: '#fff9eb', border: '1px solid #e9d7a7', padding: '15px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px', color: '#666' }}>
              <i className="fa-solid fa-circle-info" style={{ marginRight: '8px', color: 'var(--oro)' }}></i>
              <strong>Modo Base de Datos Local Activo.</strong><br />
              Inicia sesión ingresando únicamente la contraseña del administrador.
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              className="form-input"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? (
              <span><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Ingresando...</span>
            ) : (
              <span><i className="fa-solid fa-key" style={{ marginRight: '8px' }}></i> Ingresar</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
