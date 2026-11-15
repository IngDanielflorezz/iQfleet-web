import { formatFechaHora } from '../../../utils/dateUtils';

export default function DashboardHeader({ periodo, periodos, onPeriodoChange, onNuevoDespacho, onExportar }) {
  return (
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
      <div>
        <div className="d-flex align-items-center gap-2 mb-1">
          <span className="badge badge-orange-subtle text-uppercase fw-bold">CENTRO DE OPERACIONES</span>
          <span className="text-light-muted fs-8">Despacho Sabana &amp; Bogotá D.C.</span>
        </div>
        <h1 className="h3 fw-bold text-white mb-0">Consola de Control Operativo</h1>
        <span className="text-light-muted fs-8">Corte: {formatFechaHora(new Date())} COT</span>
      </div>

      <div className="d-flex align-items-center gap-2 flex-wrap no-print">
        {periodos.length > 0 && (
          <select
            className="select-dark"
            value={periodo}
            onChange={(event) => onPeriodoChange(event.target.value)}
            aria-label="Período de liquidación"
          >
            {periodos.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </select>
        )}
        <button type="button" className="btn btn-outline-dark-custom" onClick={onExportar}>
          <span className="material-symbols-outlined fs-5">picture_as_pdf</span> Exportar Reporte PDF
        </button>
        <button type="button" className="btn btn-orange-cta" onClick={onNuevoDespacho}>
          <span className="material-symbols-outlined fs-5">add</span> Registrar Despacho
        </button>
      </div>
    </div>
  );
}
