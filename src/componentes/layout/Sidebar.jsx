import { NavLink, Link } from 'react-router-dom';

export default function Sidebar({ onLogout }) {
  return (
    <aside className="sidebar-iq d-flex flex-column justify-content-between p-3">
      <div>
        {/* Cabecera / Logo */}
        <div className="d-flex align-items-center justify-content-between pb-3 border-dark-custom">
          <Link to="/app/dashboard" className="d-flex align-items-center gap-2 text-decoration-none">
            <div className="brand-logo-sq">iQ</div>
            <span className="fs-4 fw-bold text-white">
              iQ<span className="link-orange">Fleet</span>
            </span>
          </Link>
          <span className="badge badge-orange-subtle text-uppercase fw-bold">PRO</span>
        </div>

        {/* Sección: Módulos */}
        <div className="pt-3 pb-2">
          <p className="text-uppercase text-light-muted fs-8 fw-bold mb-0" style={{ letterSpacing: '0.05em' }}>
            MÓDULOS
          </p>
        </div>

        {/* Navegación */}
        <nav className="nav flex-column gap-1" id="mainSidebarNav">
          <NavLink 
            to="/app/dashboard" 
            className={({ isActive }) => `nav-link nav-link-dark text-decoration-none ${isActive ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined fs-5">dashboard</span> Dashboard Ejecutivo
          </NavLink>

          <NavLink 
            to="/app/vehiculos" 
            className={({ isActive }) => `nav-link nav-link-dark text-decoration-none ${isActive ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined fs-5">directions_bus</span> Flota &amp; Vehículos
          </NavLink>

          <NavLink 
            to="/app/conductores" 
            className={({ isActive }) => `nav-link nav-link-dark text-decoration-none ${isActive ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined fs-5">badge</span> Conductores
          </NavLink>

          {/* Sección: Gestión & Control */}
          <div className="pt-3 pb-2">
            <p className="text-uppercase text-light-muted fs-8 fw-bold mb-0" style={{ letterSpacing: '0.05em' }}>
              Gestión &amp; Control
            </p>
          </div>

          <NavLink 
            to="/app/documentos" 
            className={({ isActive }) => `nav-link nav-link-dark text-decoration-none d-flex justify-content-between align-items-center ${isActive ? 'active' : ''}`}
          >
            <span className="d-flex align-items-center gap-2">
              <span className="material-symbols-outlined fs-5">folder_open</span> Control Documental
            </span>
          </NavLink>

          <NavLink 
            to="/app/finanzas" 
            className={({ isActive }) => `nav-link nav-link-dark text-decoration-none ${isActive ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined fs-5">payments</span> Finanzas &amp; Rentabilidad
          </NavLink>
        </nav>
      </div>

      {/* Perfil Propietario y Logout */}
      <div className="user-card p-2 rounded-3 d-flex align-items-center justify-content-between mt-4">
        <div className="d-flex align-items-center gap-2 overflow-hidden">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4lVvETLz7Z9p4OysXFvp67JlfF56q4H4l3XWCw4UnOXpkQSRsHyx5V_dt-yk1_qxKiGE5r3coST_ibYWJYDlu5XS8TZ4Ch9y1fXuTI6qmLsnu4afXpz5YvpSal4722jaPJJeRjB38YjE2GZQ1OeTixbmmgpSjD3cJw3SfaO9YOz19aqXN5I5gTvhBcSnUzmu_JerDW8RgykY17OKYNYkWgGr7KWqprlXHO12w8HCYrNrx-CqBcgbI"
            className="rounded-circle avatar-sm"
            alt="Carlos Morales"
          />
          <div className="text-truncate">
            <p className="text-white fs-7 fw-semibold mb-0 text-truncate">Carlos Morales</p>
            <span className="text-light-muted fs-8">Propietario</span>
          </div>
        </div>
        <button 
          className="btn btn-link text-light-muted p-1 hover-orange border-0 bg-transparent" 
          title="Cerrar sesión" 
          onClick={onLogout}
        >
          <span className="material-symbols-outlined fs-5">logout</span>
        </button>
      </div>
    </aside>
  );
}