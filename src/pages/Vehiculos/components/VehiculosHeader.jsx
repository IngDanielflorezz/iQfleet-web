export default function VehiculosHeader({ resumen, onNuevo, onExportar }) {
  return (
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
      <div>
        <div className="d-flex align-items-center gap-2 mb-1">
          <span className="badge badge-orange-subtle text-uppercase fw-bold">GESTIÓN DE PARQUE AUTOMOTOR</span>
          <span className="text-light-muted fs-8">ID Sistema: IQ-FLT-01</span>
        </div>
        <h1 className="page-module-title mb-1">Administración de Flota &amp; Vehículos</h1>
        <p className="text-light-muted fs-7 mb-0">
          <strong className="text-white">{resumen.total}</strong> Vehículos registrados •{' '}
          <span className="text-success fw-semibold">{resumen.operativos} Operativos</span> •{' '}
          <span className="text-warning fw-semibold">{resumen.mantenimiento} En mantenimiento</span>
        </p>
      </div>
      <div className="d-flex gap-2 no-print">
        <button type="button" className="btn-outline-dark-custom" onClick={onExportar}>
          <span className="material-symbols-outlined">download</span> Exportar Flota
        </button>
        <button type="button" className="btn-orange-cta" onClick={onNuevo}>
          <span className="material-symbols-outlined">directions_bus</span> Registrar Vehículo
        </button>
      </div>
    </div>
  );
}
