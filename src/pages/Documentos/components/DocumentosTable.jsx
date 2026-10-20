import { diasRestantesLabel } from '../documentosMetrics';

const VARIANTE_VENCIMIENTO = {
  critico: 'danger',
  preventivo: 'warning',
  vigente: 'success',
};

export default function DocumentosTable({ filas, onVer, onArchivo, onEliminar }) {
  return (
    <div className="card-dark overflow-hidden">
      <div className="p-3 border-bottom border-dark-custom d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-2">
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
              <th className="text-end no-print">DIGITAL</th>
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="d-flex flex-column align-items-center justify-content-center text-center gap-1 py-4">
                    <span className="material-symbols-outlined text-light-muted fs-2">folder_off</span>
                    <span className="text-white fs-7 fw-semibold">No hay documentos para mostrar</span>
                    <span className="text-light-muted fs-8">Ajusta los filtros o carga un nuevo documento.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filas.map(({ documento, grupo, dias }) => {
                const varianteVenc = VARIANTE_VENCIMIENTO[grupo] ?? 'secondary';
                const tieneArchivo = Boolean(documento.archivoNombre);
                return (
                  <tr key={documento.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <span className={`material-symbols-outlined text-${varianteVenc} fs-5`}>description</span>
                        <div>
                          <div className="fw-bold text-white fs-7">{documento.tipo}</div>
                          <small className="text-light-muted fs-8">N.º {documento.numero}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="d-block text-white fs-7">{documento.entidad}</span>
                      <small className="text-light-muted fs-8">{documento.conductor || 'Flota'}</small>
                    </td>
                    <td className="fs-7 text-white">
                      {documento.placa && (
                        <div className="plate-box text-center mb-1">
                          <span className="plate-city">COLOMBIA</span>
                          <span className="plate-code">{documento.placa}</span>
                          <span className="plate-country">iQFLEET</span>
                        </div>
                      )}
                      {documento.conductor && <small className="text-light-muted fs-8 d-block">{documento.conductor}</small>}
                    </td>
                    <td className="fs-7 text-white">{documento.expedicion || '—'}</td>
                    <td className="fs-7 text-white">{documento.vencimiento || '—'}</td>
                    <td>
                      <span className={`badge bg-${varianteVenc} text-white rounded-pill px-2 fs-8`}>
                        {diasRestantesLabel(dias)}
                      </span>
                    </td>
                    <td>
                      {documento.estadoRunt === 'Sincronizado' ? (
                        <span className="badge badge-runt-sync d-inline-flex align-items-center gap-1 fs-8">
                          <span className="material-symbols-outlined fs-8">cloud_done</span> Sincronizado API RUNT
                        </span>
                      ) : documento.estadoRunt === 'Error de validación' ? (
                        <span className="badge bg-danger-subtle text-danger d-inline-flex align-items-center gap-1 fs-8">
                          <span className="material-symbols-outlined fs-8">error</span> Error RUNT
                        </span>
                      ) : (
                        <span className="badge bg-secondary-subtle text-secondary d-inline-flex align-items-center gap-1 fs-8">
                          <span className="material-symbols-outlined fs-8">schedule</span> Pendiente
                        </span>
                      )}
                    </td>
                    <td className="text-end no-print">
                      <button type="button" className="btn btn-outline-dark-custom btn-sm p-1 me-1" title="Ver detalle" onClick={() => onVer(documento)}>
                        <span className="material-symbols-outlined fs-6 text-warning">visibility</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-dark-custom btn-sm p-1 me-1"
                        title={tieneArchivo ? 'Ver / adjuntar archivo' : 'Adjuntar archivo'}
                        onClick={() => onArchivo(documento)}
                      >
                        <span className="material-symbols-outlined fs-6 text-light-muted">
                          {tieneArchivo ? 'download' : 'upload'}
                        </span>
                      </button>
                      <button type="button" className="btn btn-outline-dark-custom btn-sm p-1" title="Eliminar documento" onClick={() => onEliminar(documento)}>
                        <span className="material-symbols-outlined fs-6 text-danger">delete</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
