import { formatPercent } from '../../../utils/format';

export default function ConductoresMetricCards({ resumen }) {
  const { licencias } = resumen;
  return (
    <div className="row g-3 mb-4">
      <div className="col-12 col-md-4">
        <div className="card-dark-metric p-3 d-flex justify-content-between align-items-start">
          <div>
            <span className="form-label-dark">TOTAL CONDUCTORES</span>
            <div className="d-flex align-items-baseline gap-2 my-1">
              <span className="metric-number text-white fw-bold">{resumen.total}</span>
              <span className="text-light-muted fs-8">registrados</span>
            </div>
            <small className="text-success d-flex align-items-center gap-1 fs-8">
              <span className="material-symbols-outlined fs-6">check_circle</span>
              {formatPercent(resumen.habilitadosPorcentaje)} activos para servicio
            </small>
          </div>
          <div className="icon-shield-check">
            <span className="material-symbols-outlined">badge</span>
          </div>
        </div>
      </div>

      <div className="col-12 col-md-4">
        <div className="card-dark-metric p-3 d-flex justify-content-between align-items-start">
          <div>
            <span className="form-label-dark">DISPONIBILIDAD</span>
            <div className="d-flex align-items-baseline gap-2 my-1">
              <span className="metric-number text-white fw-bold">{resumen.activos}</span>
              <span className="text-light-muted fs-8">activos</span>
            </div>
            <small className="text-warning d-flex align-items-center gap-1 fs-8">
              <span className="material-symbols-outlined fs-6">sync</span>
              {resumen.enRelevo} en relevo · {resumen.inactivos} inactivos
            </small>
          </div>
          <div className="icon-shield-check">
            <span className="material-symbols-outlined">query_stats</span>
          </div>
        </div>
      </div>

      <div className="col-12 col-md-4">
        <div className="card-dark-metric p-3 d-flex justify-content-between align-items-start">
          <div>
            <span className="form-label-dark">LICENCIAS POR VENCER</span>
            <div className="d-flex align-items-baseline gap-2 my-1">
              <span className="metric-number text-white fw-bold">{licencias.criticas + licencias.vencidas}</span>
              <span className="text-light-muted fs-8">críticas</span>
            </div>
            <small className="text-warning d-flex align-items-center gap-1 fs-8">
              <span className="material-symbols-outlined fs-6">warning</span>
              {licencias.proximas} próximas · {licencias.vencidas} vencidas
            </small>
          </div>
          <div className="icon-shield-check">
            <span className="material-symbols-outlined">subtitles</span>
          </div>
        </div>
      </div>
    </div>
  );
}
