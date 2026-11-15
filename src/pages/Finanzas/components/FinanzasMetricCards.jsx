import { formatCOP, desgloseEgresos } from '../finanzasMetrics';

function tendencia(valor) {
  if (valor === null) return { icono: 'remove', color: 'text-light-muted', texto: 'Sin base previa' };
  if (valor >= 0) return { icono: 'trending_up', color: 'text-success', texto: `${valor.toFixed(1)}% vs. mes anterior` };
  return { icono: 'trending_down', color: 'text-danger', texto: `${Math.abs(valor).toFixed(1)}% vs. mes anterior` };
}

export default function FinanzasMetricCards({ resumen, movimientos, periodo }) {
  const variacion = tendencia(resumen.variacionIngresos);
  const desglose = desgloseEgresos(movimientos, periodo).slice(0, 3);

  return (
    <div className="row g-3 mb-4">
      <div className="col-12 col-md-3">
        <div className="card-dark p-3 position-relative overflow-hidden">
          <div className="d-flex align-items-center justify-content-between mb-1">
            <span className="form-label-dark mb-0">INGRESOS BRUTOS MES</span>
            <span className="material-symbols-outlined text-success fs-5">account_balance_wallet</span>
          </div>
          <div className="d-flex align-items-baseline gap-1">
            <span className="fs-4 text-white fw-bold">{formatCOP(resumen.ingresos)}</span>
          </div>
          <div className={`d-flex align-items-center gap-1 fs-8 mt-1 ${variacion.color}`}>
            <span className="material-symbols-outlined fs-6">{variacion.icono}</span>
            <span>{variacion.texto}</span>
          </div>
          <div className="kpi-bottom-line bg-success"></div>
        </div>
      </div>

      <div className="col-12 col-md-3">
        <div className="card-dark p-3 position-relative overflow-hidden">
          <div className="d-flex align-items-center justify-content-between mb-1">
            <span className="form-label-dark mb-0">COSTOS OPERATIVOS</span>
            <span className="material-symbols-outlined text-primary fs-5">local_gas_station</span>
          </div>
          <div className="d-flex align-items-baseline gap-1">
            <span className="fs-4 text-white fw-bold">{formatCOP(resumen.egresos)}</span>
          </div>
          <div className="d-flex align-items-center gap-2 fs-8 text-light-muted mt-1 flex-wrap">
            {desglose.length === 0 ? (
              <span>Sin egresos registrados</span>
            ) : (
              desglose.map((item) => (
                <span key={item.concepto}>{item.concepto.split(' ')[0]} {item.porcentaje.toFixed(0)}%</span>
              ))
            )}
          </div>
          <div className="kpi-bottom-line bg-primary"></div>
        </div>
      </div>

      <div className="col-12 col-md-3">
        <div className="card-dark p-3 position-relative overflow-hidden">
          <div className="d-flex align-items-center justify-content-between mb-1">
            <span className="form-label-dark mb-0">MARGEN OPERATIVO NETO</span>
            <span className="material-symbols-outlined text-orange fs-5">pie_chart</span>
          </div>
          <div className="d-flex align-items-baseline gap-1">
            <span className="fs-4 text-white fw-bold">{formatCOP(resumen.margen)}</span>
          </div>
          <div className="d-flex align-items-center gap-1 fs-8 link-orange mt-1">
            <span className="material-symbols-outlined fs-6">analytics</span>
            <span className="fw-bold">{resumen.rentabilidad.toFixed(1)}% Rentabilidad</span>
            <span className="text-light-muted">• {resumen.margen >= 0 ? 'Superávit' : 'Déficit'}</span>
          </div>
          <div className="kpi-bottom-line bg-orange"></div>
        </div>
      </div>

      <div className="col-12 col-md-3">
        <div className="card-dark p-3 position-relative overflow-hidden">
          <div className="d-flex align-items-center justify-content-between mb-1">
            <span className="form-label-dark mb-0">COSTO PROMEDIO / KM</span>
            <span className="material-symbols-outlined text-success fs-5">speed</span>
          </div>
          <div className="d-flex align-items-baseline gap-1">
            <span className="fs-4 text-white fw-bold">{formatCOP(resumen.costoPorKm)}</span>
            <span className="fs-8 text-light-muted">COP / KM</span>
          </div>
          <div className="d-flex align-items-center gap-1 fs-8 text-success mt-1">
            <span className="material-symbols-outlined fs-6">
              {resumen.costoPorKm > 0 && resumen.costoPorKm <= 4500 ? 'check_circle' : 'info'}
            </span>
            <span>
              {resumen.kmTotales > 0
                ? `Sobre ${resumen.kmTotales.toLocaleString('es-CO')} km registrados`
                : 'Aún sin kilometraje registrado'}
            </span>
          </div>
          <div className="kpi-bottom-line bg-success"></div>
        </div>
      </div>
    </div>
  );
}
