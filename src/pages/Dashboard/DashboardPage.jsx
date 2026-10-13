import './Dashboard.css';
// Descomenta estas líneas cuando crees los archivos de los modales en la subcarpeta 'componentes'
// import ModalDespacho from './componentes/ModalDespacho';
// import ModalNovedad from './componentes/ModalNovedad';

export default function DashboardPage() {
  
  const handleExportPdf = () => {
    // Aquí irá la lógica de html2pdf que extrajimos anteriormente
    console.log("Exportando PDF...");
  };

  return (
    <div className="container-fluid max-w-container">
      {/* Header: Título y Filtros */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge badge-orange-subtle text-uppercase fw-bold">CENTRO DE OPERACIONES</span>
            <span className="text-light-muted fs-8">Despacho Sabana &amp; Bogotá D.C.</span>
          </div>
          <h1 className="h3 fw-bold text-white mb-0">Consola de Control Operativo</h1>
          <span className="text-light-muted fs-8">Corte: 24 Oct, 16:40 COT</span>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <select className="select-dark">
            <option>Octubre 2024 (Mes en curso)</option>
            <option>Septiembre 2024</option>
            <option>Agosto 2024</option>
          </select>
          <button className="btn btn-outline-dark-custom" onClick={handleExportPdf}>
            <span className="material-symbols-outlined fs-5">picture_as_pdf</span> Exportar Reporte PDF
          </button>
          <button className="btn btn-orange-cta" data-bs-toggle="modal" data-bs-target="#modalDespacho">
            <span className="material-symbols-outlined fs-5">add</span> Registrar Despacho
          </button>
        </div>
      </div>

      {/* Contenedor que será exportado a PDF */}
      <div id="pdfReportArea">
        
        {/* Fila 1: 4 Tarjetas de Métricas Ejecutivas */}
        <div className="row g-3 mb-4">
          
          {/* KPI 1: Disponibilidad Flota */}
          <div className="col-12 col-md-3">
            <div className="card-dark-metric p-3 d-flex justify-content-between align-items-start h-100">
              <div>
                <span className="form-label-dark">DISPONIBILIDAD FLOTA</span>
                <div className="d-flex align-items-baseline gap-2 my-1">
                  <span className="metric-number text-white fw-bold">18</span>
                  <span className="text-light-muted fs-8">/20</span>
                </div>
                <small className="text-success d-flex align-items-center gap-1 fs-8">
                  <span className="material-symbols-outlined fs-6">check_circle</span> 90% Operativos
                </small>
              </div>
              <div className="icon-shield-check">
                <span className="material-symbols-outlined">directions_bus</span>
              </div>
            </div>
          </div>

          {/* KPI 2: Personal Rodante */}
          <div className="col-12 col-md-3">
            <div className="card-dark-metric p-3 d-flex justify-content-between align-items-start h-100">
              <div>
                <span className="form-label-dark">PERSONAL RODANTE</span>
                <div className="d-flex align-items-baseline gap-2 my-1">
                  <span className="metric-number text-white fw-bold">24</span>
                  <span className="text-light-muted fs-8">activos</span>
                </div>
                <small className="text-warning d-flex align-items-center gap-1 fs-8">
                  <span className="material-symbols-outlined fs-6">warning</span> 2 en relevo
                </small>
              </div>
              <div className="icon-shield-check">
                <span className="material-symbols-outlined">badge</span>
              </div>
            </div>
          </div>

          {/* KPI 3: Cumplimiento Legal */}
          <div className="col-12 col-md-3">
            <div className="card-dark-metric p-3 d-flex justify-content-between align-items-start h-100">
              <div>
                <span className="form-label-dark">CUMPLIMIENTO LEGAL</span>
                <div className="d-flex align-items-baseline gap-2 my-1">
                  <span className="metric-number text-white fw-bold">96.2%</span>
                </div>
                <small className="text-danger d-flex align-items-center gap-1 fs-8">
                  <span className="material-symbols-outlined fs-6">error</span> 3 Docs Críticos
                </small>
              </div>
              <div className="icon-shield-check">
                <span className="material-symbols-outlined">folder_open</span>
              </div>
            </div>
          </div>

          {/* KPI 4: Rentabilidad */}
          <div className="col-12 col-md-3">
            <div className="card-dark-metric p-3 d-flex justify-content-between align-items-start h-100">
              <div>
                <span className="form-label-dark">MARGEN NETO</span>
                <div className="d-flex align-items-baseline gap-2 my-1">
                  <span className="metric-number text-white fw-bold">31.7%</span>
                </div>
                <small className="text-success d-flex align-items-center gap-1 fs-8">
                  <span className="material-symbols-outlined fs-6">trending_up</span> Superávit activo
                </small>
              </div>
              <div className="icon-shield-check">
                <span className="material-symbols-outlined">payments</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fila 2: Telemetría y Alertas */}
        <div className="row g-3">
          {/* Gráfico (Simulado) */}
          <div className="col-12 col-lg-8">
            <div className="card-dark p-4 h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="fs-6 text-white fw-bold mb-0">Rendimiento y Telemetría Semanal</h2>
                <span className="badge badge-dark-subtle fs-8">Últimos 7 días</span>
              </div>
              <div className="d-flex align-items-center justify-content-center rounded" style={{ height: '250px', backgroundColor: 'var(--bg-input)', border: '1px dashed var(--border-dark)' }}>
                <span className="text-light-muted fs-8">Gráfico de rendimiento (Recharts / Chart.js iría aquí)</span>
              </div>
            </div>
          </div>

          {/* Panel de Alertas Críticas */}
          <div className="col-12 col-lg-4">
            <div className="card-dark p-4 h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="fs-6 text-white fw-bold mb-0">Alertas Críticas</h2>
                <span className="badge bg-danger-subtle text-danger fs-8">3 Activas</span>
              </div>
              <div className="d-flex flex-column gap-3">
                
                <div className="p-3 rounded" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid rgba(220, 53, 69, 0.3)' }}>
                  <div className="d-flex justify-content-between">
                    <strong className="text-danger fs-8">SOAT Vencido</strong>
                    <span className="text-light-muted fs-8">Hace 2h</span>
                  </div>
                  <span className="text-white fs-7 d-block mt-1">Placa UVP-123 (Kenworth T800)</span>
                </div>

                <div className="p-3 rounded" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid rgba(255, 193, 7, 0.3)' }}>
                  <div className="d-flex justify-content-between">
                    <strong className="text-warning fs-8">Mantenimiento Preventivo</strong>
                    <span className="text-light-muted fs-8">Hoy</span>
                  </div>
                  <span className="text-white fs-7 d-block mt-1">Placa WZA-456 (Marcopolo 21)</span>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Renderizado de Modales */}
      {/* <ModalDespacho /> */}
      {/* <ModalNovedad /> */}
    </div>
  );
}