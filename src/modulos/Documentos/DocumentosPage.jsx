import './Documentos.css';

export default function DocumentosPage() {
  return (
    <div className="max-w-container mx-auto">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge badge-orange-subtle text-uppercase fs-8">RUNT &amp; CDA API SYNCED</span>
            <small className="text-light-muted fs-8">• Conexión Bogotá Central Activa</small>
          </div>
          <h1 className="fs-3 fw-bold text-white m-0">Control Documental &amp; Auditoría RUNT / CDA</h1>
          <p className="text-light-muted fs-7 mb-0">Monitoreo preventivo y sincronización automática de vigencias legales de flota y personal en tiempo real.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-outline-dark-custom" id="btnSyncRunt">
            <span className="material-symbols-outlined text-warning">sync</span> Sincronizar RUNT
          </button>
          <button className="btn btn-orange-cta">
            <span className="material-symbols-outlined">upload_file</span> + Cargar Documento / Póliza
          </button>
        </div>
      </div>

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
              <span className="fs-3 text-white fw-bold">3</span>
              <span className="doc-subtitle">Documentos urgentes</span>
            </div>
            <div className="doc-kpi-chips-dark mt-2">
              <div className="d-flex justify-content-between fs-8 mb-1">
                <span className="badge bg-danger-subtle text-danger p-1">SOAT: UVP-123</span>
                <span className="text-light-muted">Lic: Juan Pérez</span>
              </div>
              <div className="d-flex justify-content-between fs-8">
                <span className="badge bg-danger-subtle text-danger p-1">RTM: TRL-890</span>
                <span className="text-danger fw-bold fs-8">Paralización inminente →</span>
              </div>
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
              <span className="fs-3 text-white fw-bold">5</span>
              <span className="doc-subtitle">En alerta preventiva</span>
            </div>
            <div className="doc-kpi-chips-dark mt-2">
              <div className="d-flex justify-content-between fs-8 mb-1">
                <span className="text-warning">Tarjeta Op: WZA-456 (14d)</span>
              </div>
              <div className="d-flex justify-content-between fs-8">
                <span className="text-warning">Póliza RCC: EQZ-912 (21d)</span>
                <span className="text-warning fw-bold">Cotizaciones abiertas →</span>
              </div>
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
              <span className="fs-3 text-white fw-bold">50</span>
              <span className="doc-subtitle">Auditados &amp; Validados RUNT</span>
            </div>
            <div className="doc-kpi-chips-dark mt-2 d-flex justify-content-between align-items-center fs-8">
              <span className="text-light-muted"><strong className="text-white">96.2%</strong> de conformidad</span>
              <span className="badge bg-success-subtle text-success">20 Vehículos OK</span>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <button className="btn btn-orange-cta btn-sm filter-doc-btn active" data-filter="all">Todos los Documentos (58)</button>
        <button className="btn btn-outline-dark-custom btn-sm filter-doc-btn" data-filter="soat">SOAT (20)</button>
        <button className="btn btn-outline-dark-custom btn-sm filter-doc-btn" data-filter="rtm">Revisión Técnico-Mecánica (20)</button>
        <button className="btn btn-outline-dark-custom btn-sm filter-doc-btn" data-filter="to">Tarjetas de Operación (20)</button>
        <div className="ms-auto d-flex align-items-center gap-2 fs-8 text-light-muted">
          <button className="btn btn-link text-light-muted p-0 text-decoration-none fs-8" id="btnClearFilters">Limpiar filtros</button>
          <span>•</span>
          <span>Filtrando: <strong className="text-white" id="filterStatusText">Todos</strong></span>
        </div>
      </div>

      <div className="card-dark overflow-hidden">
        <div className="p-3 border-bottom border-dark-custom d-flex justify-content-between align-items-center">
          <h2 className="fs-6 text-white fw-bold mb-0 d-flex align-items-center gap-2">
            <span className="material-symbols-outlined text-warning fs-5">assignment</span> Registro Maestro de Conformidad y Habilitación Legal
          </h2>
          <small className="text-light-muted fs-8">● Validación RUNT ejecutada automáticamente cada 6 horas</small>
        </div>

        <div className="table-responsive">
          <table className="table table-dark-custom mb-0 align-middle">
            <thead>
              <tr>
                <th>DOCUMENTO / TIPO</th>
                <th>ENTIDAD EMISORA / PÓLIZA</th>
                <th>PLACA / CONDUCTOR</th>
                <th>EXPEDICIÓN</th>
                <th>VENCIMIENTO</th>
                <th>DÍAS RESTANTES</th>
                <th>AUDITORÍA RUNT</th>
                <th className="text-end">DIGITAL</th>
              </tr>
            </thead>
            <tbody id="documentTableBody">
              <tr data-type="soat">
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <span className="material-symbols-outlined text-danger fs-5">description</span>
                    <div>
                      <div className="fw-bold text-white fs-7">SOAT Obligatorio</div>
                      <small className="text-light-muted fs-8">Ley 2161 / Tráfico Pesado</small>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="d-block text-white fs-7">Seguros Bolívar S.A.</span>
                  <small className="text-light-muted fs-8">Pol. #8921-983210</small>
                </td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <div className="plate-box text-center">
                      <span className="plate-city">BOGOTA D.C.</span>
                      <span className="plate-code">UVP-123</span>
                      <span className="plate-country">COLOMBIA</span>
                    </div>
                    <small className="text-light-muted fs-8">Kenworth T800</small>
                  </div>
                </td>
                <td className="fs-7">25 Oct 2023</td>
                <td className="fs-7 text-danger fw-bold">25 Oct 2024</td>
                <td>
                  <span className="badge bg-danger text-white rounded-pill px-2 fs-8">1 día (Crítico)</span>
                </td>
                <td>
                  <span className="badge badge-orange-subtle d-inline-flex align-items-center gap-1 fs-8">
                    <span className="material-symbols-outlined fs-8">cloud_done</span> Sincronizado API RUNT
                  </span>
                </td>
                <td className="text-end">
                  <button className="btn btn-outline-dark-custom btn-sm p-1 me-1"><span className="material-symbols-outlined fs-6 text-warning">visibility</span></button>
                  <button className="btn btn-outline-dark-custom btn-sm p-1"><span className="material-symbols-outlined fs-6 text-light-muted">download</span></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}