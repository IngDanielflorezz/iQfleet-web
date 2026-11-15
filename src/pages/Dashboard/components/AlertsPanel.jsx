const MAX_ALERTAS_VISIBLES = 5;

const SEVERIDAD_ESTILO = {
  danger: { texto: 'text-danger', borde: 'rgba(184, 76, 67, 0.35)' },
  warning: { texto: 'text-warning', borde: 'rgba(214, 161, 61, 0.35)' },
  info: { texto: 'link-orange', borde: 'rgba(200, 117, 77, 0.3)' },
};

export default function AlertsPanel({ alertas }) {
  const visibles = alertas.slice(0, MAX_ALERTAS_VISIBLES);
  const activas = alertas.length;

  return (
    <div className="col-12 col-xl-4">
      <div className="card-dark p-4 h-100 d-flex flex-column">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="fs-6 text-white fw-bold mb-0">Alertas Críticas</h2>
          <span className={`badge fs-8 ${activas > 0 ? 'bg-danger-subtle text-danger' : 'badge-dark-subtle'}`}>
            {activas} {activas === 1 ? 'activa' : 'activas'}
          </span>
        </div>

        {visibles.length === 0 ? (
          <div
            className="flex-fill d-flex flex-column align-items-center justify-content-center text-center gap-1 rounded p-4"
            style={{ backgroundColor: 'var(--lp-input)', border: '1px dashed var(--lp-border)' }}
          >
            <span className="material-symbols-outlined text-success fs-3">verified</span>
            <span className="text-white fs-7 fw-semibold">Sin alertas activas</span>
            <span className="text-light-muted fs-8">Flota y documentación al día.</span>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3 alert-scroll">
            {visibles.map((alerta) => {
              const estilo = SEVERIDAD_ESTILO[alerta.severidad] ?? SEVERIDAD_ESTILO.info;
              return (
                <div
                  key={alerta.id}
                  className="p-3 rounded alert-item"
                  style={{ backgroundColor: 'var(--lp-input)', border: `1px solid ${estilo.borde}` }}
                >
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <strong className={`${estilo.texto} fs-8`}>{alerta.tipo}</strong>
                    <span className="text-light-muted fs-8 text-nowrap">{alerta.tiempo}</span>
                  </div>
                  <span className="text-white fs-7 d-block mt-1">{alerta.detalle}</span>
                </div>
              );
            })}
            {activas > visibles.length && (
              <span className="text-light-muted fs-8 text-center">+{activas - visibles.length} alertas adicionales</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
