export default function TelemetryDock({ summary, onHistorial, historialActivo }) {
  return (
    <div className="gps-dock card-dark px-3 py-2 d-flex align-items-center gap-4">
      <div className="gps-dock-metric">
        <span className="gps-dock-value">
          {summary.avgSpeed}
          <small> km/h</small>
        </span>
        <span className="gps-dock-label">Velocidad media</span>
      </div>

      <div className="gps-dock-sep" aria-hidden="true" />

      <div className="gps-dock-metric">
        <span className="gps-dock-value">
          {summary.moving}
          <small> / {summary.total}</small>
        </span>
        <span className="gps-dock-label">En movimiento</span>
      </div>

      <div className="gps-dock-sep" aria-hidden="true" />

      <div className="gps-dock-metric">
        <span className={`gps-dock-value ${summary.lost > 0 ? 'text-warning' : ''}`}>{summary.lost}</span>
        <span className="gps-dock-label">Sin señal</span>
      </div>

      <button
        type="button"
        className="btn-outline-dark-custom gps-dock-action ms-auto"
        onClick={onHistorial}
        aria-pressed={historialActivo}
        title="Ver historial de unidades"
      >
        <span className="material-symbols-outlined">{historialActivo ? 'visibility_off' : 'history'}</span>
        {historialActivo ? 'Ocultar historial' : 'Historial GPS'}
      </button>
    </div>
  );
}
