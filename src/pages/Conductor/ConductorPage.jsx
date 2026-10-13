import { getSession } from '../../services/authService';
import './Conductor.css';

export default function ConductorPage() {
  const session = getSession();
  const nombre = session ? `${session.nombres} ${session.apellidos}` : 'Conductor';

  return (
    <div className="container-fluid max-w-container">
      <div className="mb-4">
        <div className="d-flex align-items-center gap-2 mb-1">
          <span className="badge badge-orange-subtle text-uppercase fw-bold">PANEL DEL CONDUCTOR</span>
        </div>
        <h1 className="h3 fw-bold text-white mb-0">Hola, {nombre}</h1>
        <span className="text-light-muted fs-8">Tu espacio de trabajo estará disponible próximamente.</span>
      </div>

      <div className="row g-3">
        <div className="col-12 col-md-4">
          <div className="card-iq p-4 h-100">
            <div className="d-flex align-items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-orange fs-3">directions_bus</span>
              <h2 className="h6 fw-bold text-white mb-0">Vehículo asignado</h2>
            </div>
            <p className="text-light-muted fs-8 mb-0">Aún no tienes un vehículo asignado.</p>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card-iq p-4 h-100">
            <div className="d-flex align-items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-orange fs-3">route</span>
              <h2 className="h6 fw-bold text-white mb-0">Ruta del día</h2>
            </div>
            <p className="text-light-muted fs-8 mb-0">Sin despachos programados por ahora.</p>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card-iq p-4 h-100">
            <div className="d-flex align-items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-orange fs-3">fact_check</span>
              <h2 className="h6 fw-bold text-white mb-0">Checklist preoperacional</h2>
            </div>
            <p className="text-light-muted fs-8 mb-0">Pendiente por diligenciar.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
