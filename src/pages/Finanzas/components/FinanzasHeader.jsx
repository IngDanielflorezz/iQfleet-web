import { periodosDisponibles, periodoLabel } from '../finanzasMetrics';

export default function FinanzasHeader({ movimientos, periodo, onPeriodoChange, onNuevo }) {
  return (
    <div className="d-flex align-items-center justify-content-between mb-4">
      <div>
        <div className="d-flex align-items-center gap-2 mb-1">
          <span className="badge badge-orange-subtle fs-8 fw-bold">MÓDULO ECONÓMICO</span>
          <span className="text-light-muted fs-8">• Auditoría DIAN &amp; Facturación Electrónica</span>
        </div>
        <h1 className="fs-4 text-white fw-bold mb-1">Finanzas &amp; Rentabilidad de Flota</h1>
        <p className="text-light-muted fs-8 mb-0">Control de fletes, nómina operativa, combustible y balance neto consolidado en Pesos Colombianos (COP).</p>
      </div>

      <div className="d-flex align-items-center gap-2">
        <select
          className="select-dark py-2"
          value={periodo}
          onChange={(evento) => onPeriodoChange(evento.target.value)}
          aria-label="Período de liquidación"
        >
          {periodosDisponibles(movimientos).map((valorPeriodo) => (
            <option key={valorPeriodo} value={valorPeriodo}>
              {periodoLabel(valorPeriodo)}
            </option>
          ))}
        </select>
        <button type="button" className="btn-orange-cta" onClick={onNuevo}>
          <span className="material-symbols-outlined fs-6">add_circle</span>
          <span>Registrar Movimiento / Egreso</span>
        </button>
      </div>
    </div>
  );
}
