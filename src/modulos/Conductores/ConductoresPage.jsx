import './Conductores.css';

export default function ConductoresPage() {
  return (
    <>
      <div className="page-header-border pb-3 mb-4">
        <div className="d-flex align-items-center gap-2 mb-2">
          <span className="badge badge-orange-subtle fw-bold">OPERACIONES &amp; LOGÍSTICA URBANA</span>
          <span className="text-light-muted fs-8">ID Sistema: IQ-DRV-01</span>
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="page-module-title mb-1">Gestión de Conductores y Personal Operativo</h1>
            <p className="text-light-muted fs-7 mb-0">
              <strong className="text-white">20</strong> Conductores registrados • <span className="text-success fw-semibold">18 Operativos</span> • <span className="text-warning fw-semibold">2 En Relevo</span>
            </p>
          </div>
          <div className="d-flex gap-2">
            <button className="btn-outline-dark-custom">
              <span className="material-symbols-outlined">bedtime</span> Control Fatiga
            </button>
            <button className="btn-orange-cta" data-bs-toggle="modal" data-bs-target="#modalVincular">
              <span className="material-symbols-outlined">person_add</span> Vincular Conductor
            </button>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card-dark-metric p-3 d-flex justify-content-between align-items-start">
            <div>
              <span className="form-label-dark">TOTAL CONDUCTORES</span>
              <div className="d-flex align-items-baseline gap-2 my-1">
                <span className="metric-number text-white fw-bold">24</span>
                <span className="text-light-muted fs-8">activos</span>
              </div>
              <small className="text-success d-flex align-items-center gap-1 fs-8">
                <span className="material-symbols-outlined">check_circle</span> 100% habilitados para servicio
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
              <span className="form-label-dark">PUNTAJE CONDUCCIÓN</span>
              <div className="d-flex align-items-baseline gap-2 my-1">
                <span className="metric-number text-white fw-bold">96.4</span>
                <span className="text-light-muted fs-8">/100</span>
              </div>
              <small className="text-success d-flex align-items-center gap-1 fs-8">
                <span className="material-symbols-outlined">speed</span> Eficiencia 96.4% meta
              </small>
            </div>
            <div class="icon-shield-check">
              <span className="material-symbols-outlined">query_stats</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card-dark-metric p-3 d-flex justify-content-between align-items-start">
            <div>
              <span className="form-label-dark">LICENCIAS POR VENCER</span>
              <div className="d-flex align-items-baseline gap-2 my-1">
                <span className="metric-number text-white fw-bold">2</span>
                <span className="text-light-muted fs-8">años prom.</span>
              </div>
              <small className="text-warning d-flex align-items-center gap-1 fs-8">
                <span className="material-symbols-outlined">warning</span> Alerta Semáforo RUNT
              </small>
            </div>
            <div className="icon-shield-check">
              <span className="material-symbols-outlined">subtitles</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card-dark p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="input-dark-group" style={{ width: '320px' }}>
            <span className="material-symbols-outlined input-dark-icon">search</span>
            <input type="text" className="form-control form-control-dark" placeholder="Buscar por Nombre o Cédula..." />
          </div>
          <button className="btn-outline-dark-custom">
            <span className="material-symbols-outlined">download</span> Exportar Lista
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-dark-custom align-middle mb-0">
            <thead>
              <tr>
                <th>CONDUCTOR</th>
                <th>CÉDULA</th>
                <th>CATEGORÍA</th>
                <th>VENC. LICENCIA</th>
                <th>MÓVIL ASIGNADO</th>
                <th>TURNO &amp; RUTA</th>
                <th>PUNTAJE TELEMÁTICO</th>
                <th className="text-end">ACCIONES</th>
              </tr>
            </thead>
            <tbody id="conductoresTableBody">
              {/* Aquí se mapeará el estado de los conductores */}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Vincular Conductor (Se puede extraer a un componente separado luego) */}
      <div className="modal fade" id="modalVincular" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content card-dark text-white">
            <div className="modal-header border-dark-custom p-3">
              <h5 className="modal-title fw-bold fs-7">Vincular Conductor</h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body d-flex flex-column gap-3 p-3">
              <div>
                <label className="form-label-dark mb-1">Nombre Completo</label>
                <input type="text" className="form-control form-control-dark" style={{ paddingLeft: '12px' }} placeholder="Ej. Carlos Rodríguez" />
              </div>
              <div>
                <label className="form-label-dark mb-1">Cédula</label>
                <input type="text" className="form-control form-control-dark" style={{ paddingLeft: '12px' }} placeholder="CC 12.345.678" />
              </div>
            </div>
            <div className="modal-footer border-dark-custom p-2">
              <button type="button" className="btn-outline-dark-custom" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" className="btn-orange-cta">Guardar</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}