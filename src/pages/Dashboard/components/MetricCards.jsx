import { formatCOP, formatPercent } from '../../../utils/format';

export default function MetricCards({ resumen }) {
  const { disponibilidad, personal, cumplimiento, margen } = resumen;
  const margenPositivo = margen !== null && margen.margen >= 0;
  const hayCriticos = cumplimiento.criticosTotales > 0;

  return (
    <div className="row g-3 mb-4">
      <div className="col-12 col-md-6 col-xl-3">
        <div className="card-dark-metric p-3 d-flex justify-content-between align-items-start h-100">
          <div>
            <span className="form-label-dark">DISPONIBILIDAD FLOTA</span>
            <div className="d-flex align-items-baseline gap-2 my-1">
              <span className="metric-number text-white fw-bold">{disponibilidad.operativos}</span>
              <span className="text-light-muted fs-8">/{disponibilidad.total}</span>
            </div>
            <small className="text-success d-flex align-items-center gap-1 fs-8">
              <span className="material-symbols-outlined fs-6">check_circle</span>
              {formatPercent(disponibilidad.porcentaje)} Operativos
            </small>
          </div>
          <div className="icon-shield-check">
            <span className="material-symbols-outlined">directions_bus</span>
          </div>
        </div>
      </div>

      <div className="col-12 col-md-6 col-xl-3">
        <div className="card-dark-metric p-3 d-flex justify-content-between align-items-start h-100">
          <div>
            <span className="form-label-dark">PERSONAL RODANTE</span>
            <div className="d-flex align-items-baseline gap-2 my-1">
              <span className="metric-number text-white fw-bold">{personal.total}</span>
              <span className="text-light-muted fs-8">activos</span>
            </div>
            <small className="text-warning d-flex align-items-center gap-1 fs-8">
              <span className="material-symbols-outlined fs-6">navigation</span>
              {personal.enRuta} en ruta
            </small>
          </div>
          <div className="icon-shield-check">
            <span className="material-symbols-outlined">badge</span>
          </div>
        </div>
      </div>

      <div className="col-12 col-md-6 col-xl-3">
        <div className="card-dark-metric p-3 d-flex justify-content-between align-items-start h-100">
          <div>
            <span className="form-label-dark">CUMPLIMIENTO LEGAL</span>
            <div className="d-flex align-items-baseline gap-2 my-1">
              <span className="metric-number text-white fw-bold">{formatPercent(cumplimiento.porcentaje)}</span>
            </div>
            <small className={`${hayCriticos ? 'text-danger' : 'text-success'} d-flex align-items-center gap-1 fs-8`}>
              <span className="material-symbols-outlined fs-6">{hayCriticos ? 'error' : 'verified'}</span>
              {cumplimiento.criticosTotales} Docs Críticos
            </small>
          </div>
          <div className="icon-shield-check">
            <span className="material-symbols-outlined">folder_open</span>
          </div>
        </div>
      </div>

      <div className="col-12 col-md-6 col-xl-3">
        <div className="card-dark-metric p-3 d-flex justify-content-between align-items-start h-100">
          <div>
            <span className="form-label-dark">MARGEN NETO</span>
            <div className="d-flex align-items-baseline gap-2 my-1">
              <span className="metric-number text-white fw-bold">{margen ? formatPercent(margen.porcentaje) : '—'}</span>
            </div>
            {margen ? (
              <small className={`${margenPositivo ? 'text-success' : 'text-danger'} d-flex align-items-center gap-1 fs-8`}>
                <span className="material-symbols-outlined fs-6">{margenPositivo ? 'trending_up' : 'trending_down'}</span>
                {margenPositivo ? 'Superávit' : 'Déficit'} {formatCOP(margen.margen)}
              </small>
            ) : (
              <small className="text-light-muted d-flex align-items-center gap-1 fs-8">
                <span className="material-symbols-outlined fs-6">info</span> Sin despachos facturables
              </small>
            )}
          </div>
          <div className="icon-shield-check">
            <span className="material-symbols-outlined">payments</span>
          </div>
        </div>
      </div>
    </div>
  );
}
