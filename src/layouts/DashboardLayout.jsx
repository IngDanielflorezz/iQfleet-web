import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import useTheme from '../theme/useTheme';
import { clearSession } from '../services/authService';

export default function DashboardLayout() {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  return (
    <div className="bg-dark-app min-vh-100 d-flex">
      {/* 1. Sidebar fijo lateral */}
      <Sidebar onLogout={handleLogout} />

      {/* 2. Envoltorio principal */}
      <div className="main-wrapper flex-grow-1 d-flex flex-column">
        {/* Topbar Header */}
        <header className="topbar-iq d-flex align-items-center justify-content-between px-4">
          <div className="d-flex align-items-center gap-3 flex-grow-1 max-w-lg">
            <div className="input-dark-group w-100">
              <span className="material-symbols-outlined input-dark-icon">search</span>
              <input
                type="text"
                className="form-control form-control-dark"
                placeholder="Buscar por placa, conductor, SOAT..."
              />
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            <span className="badge badge-dark-subtle d-none d-md-inline-flex align-items-center gap-2 px-3 py-2">
              <span className="status-dot bg-success"></span>
              <span className="text-light-muted fs-7">18 En ruta (90%)</span>
            </span>
            <button
              type="button"
              className="btn btn-outline-dark-custom theme-toggle"
              onClick={toggleTheme}
              title={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
              aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            >
              <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <button className="btn btn-outline-dark-custom btn-sm">
              <span className="material-symbols-outlined fs-6">calendar_today</span> 24 Octubre 2024
            </button>
            <button className="btn btn-orange-cta" id="btnRegistrarNovedad">
              <span className="material-symbols-outlined fs-5">add</span>
              <span> Registrar Novedad</span>
            </button>
          </div>
        </header>

        {/* 3. Aquí se inyecta la página que corresponda según la URL */}
        <main className="content-area flex-grow-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}