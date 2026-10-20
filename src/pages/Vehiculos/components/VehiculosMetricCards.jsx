import { formatPercent } from '../../../utils/format';

export default function VehiculosMetricCards({ resumen }) {
  return (
    <div className="row g-3 mb-4">
      <div className="col-12 col-md-6 col-xl-3">
        <div className="card-dark-metric p-3 d-flex justify-content-between align-items-start h-100">
          <div>
            <span className="form-label-dark">FLOTA TOTAL</span>
            <div className="d-flex align-items-baseline gap-2 my-1">
              <span className="metric-number text-white fw-bold">{resumen.total}</span>
              <span className="text-light-muted fs-8">unidades</span>
            </div>
            <small className="text-success d-flex align-items-center gap-1 fs-8">
              <span className="material-symbols-outlined fs-6">directions_bus</span> Parque registrado
            </small>
          </div>
          <div className="icon-shield-check">
            <span className="material-symbols-outlined">garage</span>
          </div>
        </div>
      </div>

      <div className="col-12 col-md-6 col-xl-3">
        <div className="card-dark-metric p-3 d-flex justify-content-between align-items-start h-100">
          <div>
            <span className="form-label-dark">DISPONIBILIDAD</span>
            <div className="d-flex align-items-baseline gap-2 my-1">
              <span className="metric-number text-white fw-bold">{formatPercent(resumen.disponibilidad)}</span>
              <span className="text-light-muted fs-8">{resumen.operativos}/{resumen.total}</span>
            </div>
            <small className="text-success d-flex align-items-center gap-1 fs-8">
              <span className="material-symbols-outlined fs-6">check_circle</span> Listos para despacho
            </small>
          </div>
          <div className="icon-shield-check">
            <span className="material-symbols-outlined">task_alt</span>
          </div>
        </div>
      </div>

      <div className="col-12 col-md-6 col-xl-3">
        <div className="card-dark-metric p-3 d-flex justify-content-between align-items-start h-100">
          <div>
            <span className="form-label-dark">EN TALLER</span>
            <div className="d-flex align-items-baseline gap-2 my-1">
              <span className="metric-number text-white fw-bold">{resumen.mantenimiento}</span>
              <span className="text-light-muted fs-8">unidades</span>
            </div>
            <small className="text-warning d-flex align-items-center gap-1 fs-8">
              <span className="material-symbols-outlined fs-6">build</span> {resumen.fueraServicio} fuera de servicio
            </small>
          </div>
          <div className="icon-shield-check">
            <span className="material-symbols-outlined">construction</span>
          </div>
        </div>
      </div>

      <div className="col-12 col-md-6 col-xl-3">
        <div className="card-dark-metric p-3 d-flex justify-content-between align-items-start h-100">
          <div>
            <span className="form-label-dark">ALERTAS LEGALES</span>
            <div className="d-flex align-items-baseline gap-2 my-1">
              <span className="metric-number text-white fw-bold">{resumen.alertasLegales}</span>
              <span className="text-light-muted fs-8">por vencer</span>
            </div>
            <small className={`${resumen.alertasLegales > 0 ? 'text-danger' : 'text-success'} d-flex align-items-center gap-1 fs-8`}>
              <span className="material-symbols-outlined fs-6">{resumen.alertasLegales > 0 ? 'error' : 'verified'}</span>
              {resumen.alertasLegales > 0 ? 'SOAT / RTM críticos' : 'Documentación al día'}
            </small>
          </div>
          <div className="icon-shield-check">
            <span className="material-symbols-outlined">gpp_maybe</span>
          </div>
        </div>
      </div>
    </div>
  );
}
