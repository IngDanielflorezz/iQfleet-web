export default function DocumentosHeader({ sincronizando, onSincronizar, onNuevo }) {
  return (
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
      <div>
        <div className="d-flex align-items-center gap-2 mb-1">
          <span className="badge badge-orange-subtle text-uppercase fs-8">RUNT &amp; CDA API SYNCED</span>
          <small className="text-light-muted fs-8">• Conexión Bogotá Central Activa</small>
        </div>
        <h1 className="fs-3 fw-bold text-white m-0">Control Documental &amp; Auditoría RUNT / CDA</h1>
        <p className="text-light-muted fs-7 mb-0">
          Monitoreo preventivo y sincronización automática de vigencias legales de flota y personal en tiempo real.
        </p>
      </div>
      <div className="d-flex align-items-center gap-2 no-print">
        <button type="button" className="btn btn-outline-dark-custom" onClick={onSincronizar} disabled={sincronizando}>
          <span className={`material-symbols-outlined text-warning ${sincronizando ? 'spin-icon' : ''}`}>sync</span>
          {sincronizando ? 'Sincronizando...' : 'Sincronizar RUNT'}
        </button>
        <button type="button" className="btn btn-orange-cta" onClick={onNuevo}>
          <span className="material-symbols-outlined">upload_file</span> + Cargar Documento / Póliza
        </button>
      </div>
    </div>
  );
}
