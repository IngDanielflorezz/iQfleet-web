import { formatCOP } from '../../../utils/format';
import { balancePorUnidad } from '../finanzasMetrics';

const TOPE_UNIDADES = 6;

function formatoMillones(valor) {
  const millones = valor / 1000000;
  return `$${millones >= 10 ? millones.toFixed(0) : millones.toFixed(1)}M`;
}

export default function BalanceChart({ movimientos, periodo }) {
  const unidades = balancePorUnidad(movimientos, periodo).slice(0, TOPE_UNIDADES);
  const maximo = Math.max(1, ...unidades.map((unidad) => Math.max(unidad.ingresos, unidad.egresos)));

  const totalIngresos = unidades.reduce((suma, unidad) => suma + unidad.ingresos, 0);
  const totalEgresos = unidades.reduce((suma, unidad) => suma + unidad.egresos, 0);
  const margen = totalIngresos - totalEgresos;
  const rentabilidad = totalIngresos > 0 ? (margen / totalIngresos) * 100 : 0;

  return (
    <div className="card-dark p-3 h-100 d-flex flex-column justify-content-between">
      <div>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h2 className="fs-6 text-white fw-bold mb-0">Balance Comparativo por Unidad</h2>
            <span className="text-light-muted fs-8">Ingresos brutos vs costos totales operados (Cifras en millones COP)</span>
          </div>
          <div className="d-flex align-items-center gap-3 fs-8">
            <span className="d-flex align-items-center gap-1 text-white">
              <span className="status-dot bg-orange"></span> Ingreso Generado
            </span>
            <span className="d-flex align-items-center gap-1 text-white">
              <span className="status-dot bg-primary"></span> Costo Operativo
            </span>
          </div>
        </div>

        {unidades.length === 0 ? (
          <div className="text-center text-light-muted py-5">
            <span className="material-symbols-outlined fs-2 d-block mb-2">bar_chart</span>
            Sin movimientos por unidad en este período.
          </div>
        ) : (
          <div className="fin-chart-container pt-4 pb-2 px-2">
            <div className="d-flex align-items-end justify-content-around h-100 border-bottom border-dark position-relative pb-2">
              <div className="chart-y-axis" style={{ bottom: '75%' }}><span className="fs-8 text-light-muted">{formatoMillones(maximo * 0.75)}</span></div>
              <div className="chart-y-axis" style={{ bottom: '50%' }}><span className="fs-8 text-light-muted">{formatoMillones(maximo * 0.5)}</span></div>
              <div className="chart-y-axis" style={{ bottom: '25%' }}><span className="fs-8 text-light-muted">{formatoMillones(maximo * 0.25)}</span></div>
              <div className="chart-y-axis" style={{ bottom: '0%' }}><span className="fs-8 text-light-muted">$0</span></div>

              {unidades.map((unidad) => (
                <div key={unidad.placa} className="d-flex flex-column align-items-center gap-2 h-100 justify-content-end">
                  <div className="d-flex align-items-end gap-1 h-100">
                    <div
                      className="fin-bar bg-orange"
                      style={{ height: `${(unidad.ingresos / maximo) * 100}%`, width: '20px' }}
                      title={formatCOP(unidad.ingresos)}
                    ></div>
                    <div
                      className="fin-bar bg-primary"
                      style={{ height: `${(unidad.egresos / maximo) * 100}%`, width: '20px' }}
                      title={formatCOP(unidad.egresos)}
                    ></div>
                  </div>
                  <span className="badge badge-dark-subtle fs-8">{unidad.placa}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="user-card p-2 rounded fs-8 text-light-muted d-flex align-items-center justify-content-between mt-3">
        <span>Tarifas actualizadas según Resolución MinTransporte 2024</span>
        <span>Total Ingresos: <strong className="text-white">{formatCOP(totalIngresos)}</strong> | Margen: <strong className="text-orange">{rentabilidad.toFixed(1)}%</strong></span>
      </div>
    </div>
  );
}
