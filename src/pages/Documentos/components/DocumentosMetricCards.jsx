import { diasRestantesLabel } from '../documentosMetrics';

export default function DocumentosMetricCards({ resumen }) {
  const { porGrupo } = resumen;
  const criticos = porGrupo.critico.slice(0, 2);
  const preventivos = porGrupo.preventivo.slice(0, 2);

  return (
    <div className="row g-3 mb-4">
      <div className="col-12 col-md-4">
        <div className="card-dark p-3 h-100 border-danger-subtle">
          <div className="d-flex align-items-center justify-content-between mb-1">
            <span className="doc-card-kpi-title text-danger">● VENCIDOS / CRÍTICOS (&lt; 7 DÍAS)</span>
            <div className="icon-kpi-badge bg-danger-subtle">
              <span className="material-symbols-outlined fs-6">shield_with_heart</span>
            </div>
          </div>
          <div className="d-flex align-items-baseline gap-2">
            <span className="fs-3 text-white fw-bold">{resumen.criticos}</span>
            <span className="doc-subtitle">Documentos urgentes</span>
          </div>
          <div className="doc-kpi-chips-dark mt-2">
            {criticos.length === 0 ? (
              <span className="fs-8 text-light-muted">Sin documentos críticos</span>
            ) : (
              criticos.map(({ documento, dias }) => (
                <div key={documento.id} className="d-flex justify-content-between fs-8 mb-1">
                  <span className="badge bg-danger-subtle text-danger p-1">{documento.tipo}: {documento.placa || documento.conductor}</span>
                  <span className="text-danger fw-bold fs-8">{diasRestantesLabel(dias)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="col-12 col-md-4">
        <div className="card-dark p-3 h-100 border-warning-subtle">
          <div className="d-flex align-items-center justify-content-between mb-1">
            <span className="doc-card-kpi-title text-warning">● PRÓXIMOS A VENCER (8 - 30 DÍAS)</span>
            <div className="icon-kpi-badge bg-warning-subtle">
              <span className="material-symbols-outlined fs-6">hourglass_top</span>
            </div>
          </div>
          <div className="d-flex align-items-baseline gap-2">
            <span className="fs-3 text-white fw-bold">{resumen.preventivos}</span>
            <span className="doc-subtitle">En alerta preventiva</span>
          </div>
          <div className="doc-kpi-chips-dark mt-2">
            {preventivos.length === 0 ? (
              <span className="fs-8 text-light-muted">Sin documentos por vencer</span>
            ) : (
              preventivos.map(({ documento, dias }) => (
                <div key={documento.id} className="d-flex justify-content-between fs-8 mb-1">
                  <span className="text-warning">{documento.tipo}: {documento.placa || documento.conductor}</span>
                  <span className="text-warning fw-bold fs-8">{diasRestantesLabel(dias)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="col-12 col-md-4">
        <div className="card-dark p-3 h-100 border-success-subtle">
          <div className="d-flex align-items-center justify-content-between mb-1">
            <span className="doc-card-kpi-title text-success">● VIGENTES Y AL DÍA (&gt; 30 DÍAS)</span>
            <div className="icon-kpi-badge bg-success-subtle">
              <span className="material-symbols-outlined fs-6">verified</span>
            </div>
          </div>
          <div className="d-flex align-items-baseline gap-2">
            <span className="fs-3 text-white fw-bold">{resumen.vigentes}</span>
            <span className="doc-subtitle">Auditados &amp; Validados RUNT</span>
          </div>
          <div className="doc-kpi-chips-dark mt-2 d-flex justify-content-between align-items-center fs-8">
            <span className="text-light-muted"><strong className="text-white">{resumen.conformidad.toFixed(1)}%</strong> de conformidad</span>
            <span className="badge bg-success-subtle text-success">{resumen.sincronizados}/{resumen.total} sincronizados</span>
          </div>
        </div>
      </div>
    </div>
  );
}
