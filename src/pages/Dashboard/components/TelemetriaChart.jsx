import { useMemo, useState } from 'react';
import { formatCOP } from '../../../utils/format';
import { computeTelemetriaSemanal } from '../dashboardMetrics';

const MODOS = {
  DESPACHOS: 'despachos',
  DINERO: 'dinero',
};

export default function TelemetriaChart({ despachos, periodo }) {
  const [modo, setModo] = useState(MODOS.DESPACHOS);
  const [semanaActiva, setSemanaActiva] = useState(null);

  const semanas = useMemo(() => computeTelemetriaSemanal(despachos, periodo), [despachos, periodo]);
  const totalDespachos = semanas.reduce((suma, punto) => suma + punto.despachos, 0);

  return (
    <div className="card-dark p-4 h-100">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h2 className="fs-6 text-white fw-bold mb-0">Rendimiento y Telemetría Semanal</h2>
          <span className="text-light-muted fs-8">
            {totalDespachos > 0
              ? `${totalDespachos} despacho(s) distribuidos por semana del mes`
              : 'Sin despachos registrados en el período'}
          </span>
        </div>
        <div className="d-flex align-items-center gap-2 no-print">
          <div className="d-flex bg-input p-1 rounded border-dark-custom" style={{ backgroundColor: 'var(--bg-input)' }}>
            <button
              type="button"
              className={`btn btn-sm fs-8 ${modo === MODOS.DESPACHOS ? 'btn-orange-cta py-1' : 'btn-link btn-toggle-inactive text-decoration-none py-1'}`}
              onClick={() => setModo(MODOS.DESPACHOS)}
            >
              Despachos
            </button>
            <button
              type="button"
              className={`btn btn-sm fs-8 ${modo === MODOS.DINERO ? 'btn-orange-cta py-1' : 'btn-link btn-toggle-inactive text-decoration-none py-1'}`}
              onClick={() => setModo(MODOS.DINERO)}
            >
              Dinero
            </button>
          </div>
        </div>
      </div>

      <div className="telemetria-chart pt-3 pb-2">
        <div className="d-flex align-items-end justify-content-around h-100 position-relative telemetria-axis">
          {semanas.map((punto, indice) => {
            const activa = semanaActiva === indice;
            const alturaA = modo === MODOS.DESPACHOS ? punto.alturaDespachos : punto.alturaIngresos;
            const alturaB = modo === MODOS.DESPACHOS ? 0 : punto.alturaCostos;
            const valorA = modo === MODOS.DESPACHOS ? `${punto.despachos}` : formatCOP(punto.ingresos);

            return (
              <div
                key={punto.semana}
                className="d-flex flex-column align-items-center gap-2 h-100 justify-content-end telemetria-slot"
                onMouseEnter={() => setSemanaActiva(indice)}
                onMouseLeave={() => setSemanaActiva(null)}
              >
                {activa && (
                  <div className="telemetria-tooltip">
                    <strong>{punto.etiqueta}</strong>
                    <span>{punto.despachos} despacho(s)</span>
                    {modo === MODOS.DINERO && (
                      <>
                        <span className="text-success">Ingresos {formatCOP(punto.ingresos)}</span>
                        <span className="text-primary">Costos {formatCOP(punto.costos)}</span>
                      </>
                    )}
                  </div>
                )}
                <div className="d-flex align-items-end gap-1 h-100">
                  <div
                    className={`telemetria-bar ${modo === MODOS.DESPACHOS ? 'bg-orange' : 'bg-success'} ${alturaA <= 0 ? 'is-empty' : ''}`}
                    style={{ height: `${Math.max(alturaA, 2)}%`, width: '22px' }}
                    title={valorA}
                  ></div>
                  {modo === MODOS.DINERO && (
                    <div
                      className={`telemetria-bar bg-primary ${punto.costos <= 0 ? 'is-empty' : ''}`}
                      style={{ height: `${Math.max(alturaB, 2)}%`, width: '22px' }}
                      title={formatCOP(punto.costos)}
                    ></div>
                  )}
                </div>
                <span className={`badge fs-8 ${punto.despachos > 0 ? 'badge-dark-subtle' : 'badge-plate-inactive'}`}>
                  {punto.etiqueta}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
