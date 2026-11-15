export default function ConductoresHeader({ resumen, onNuevo, onExportar, onControlFatiga }) {
  return (
    <div className="page-header-border pb-3 mb-4">
      <div className="d-flex align-items-center gap-2 mb-2">
        <span className="badge badge-orange-subtle fw-bold">OPERACIONES &amp; LOGÍSTICA URBANA</span>
        <span className="text-light-muted fs-8">ID Sistema: IQ-DRV-01</span>
      </div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <h1 className="page-module-title mb-1">Gestión de Conductores y Personal Operativo</h1>
          <p className="text-light-muted fs-7 mb-0">
            <strong className="text-white">{resumen.total}</strong> Conductores registrados •{' '}
            <span className="text-success fw-semibold">{resumen.activos} Activos</span> •{' '}
            <span className="text-warning fw-semibold">{resumen.enRelevo} En Relevo</span>
          </p>
        </div>
        <div className="d-flex gap-2 no-print">
          <button type="button" className="btn-outline-dark-custom" onClick={onControlFatiga}>
            <span className="material-symbols-outlined">bedtime</span> Control Fatiga
          </button>
          <button type="button" className="btn-outline-dark-custom" onClick={onExportar}>
            <span className="material-symbols-outlined">download</span> Exportar Lista
          </button>
          <button type="button" className="btn-orange-cta" onClick={onNuevo}>
            <span className="material-symbols-outlined">person_add</span> Vincular Conductor
          </button>
        </div>
      </div>
    </div>
  );
}
