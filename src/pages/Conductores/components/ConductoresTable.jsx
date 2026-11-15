import { CONDUCTOR_ESTADO_LIST, conductorEstadoVariant } from '../../../services/conductorService';
import { daysUntil, formatFechaCorta } from '../../../utils/dateUtils';

function licenciaClase(dias) {
  if (dias === null) return 'text-light-muted';
  if (dias < 0) return 'text-danger fw-bold';
  if (dias <= 30) return 'text-warning fw-semibold';
  return 'text-white';
}

export default function ConductoresTable({
  conductores,
  total,
  busqueda,
  onBusquedaChange,
  filtroEstado,
  onFiltroEstadoChange,
  onVer,
  onEditar,
  onEliminar,
  onNuevo,
}) {
  return (
    <div className="card-dark p-3">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-2 mb-3">
        <div className="input-dark-group" style={{ width: '320px' }}>
          <span className="material-symbols-outlined input-dark-icon">search</span>
          <input
            type="search"
            className="form-control form-control-dark"
            placeholder="Buscar por Nombre o Cédula..."
            value={busqueda}
            onChange={(event) => onBusquedaChange(event.target.value)}
          />
        </div>
        <div className="d-flex align-items-center gap-2 no-print">
          <select
            className="select-dark"
            value={filtroEstado}
            onChange={(event) => onFiltroEstadoChange(event.target.value)}
            aria-label="Filtrar por estado"
          >
            <option value="Todos">Todos los estados</option>
            {CONDUCTOR_ESTADO_LIST.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
          <button type="button" className="btn-orange-cta" onClick={onNuevo}>
            <span className="material-symbols-outlined fs-6">person_add</span> Nuevo
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-dark-custom align-middle mb-0">
          <thead>
            <tr>
              <th>CONDUCTOR</th>
              <th>CÉDULA</th>
              <th>CATEGORÍA</th>
              <th>VENC. LICENCIA</th>
              <th>TELÉFONO</th>
              <th>ESTADO</th>
              <th className="text-end no-print">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {conductores.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="d-flex flex-column align-items-center justify-content-center text-center gap-1 py-4">
                    <span className="material-symbols-outlined text-light-muted fs-2">person_off</span>
                    <span className="text-white fs-7 fw-semibold">No hay conductores para mostrar</span>
                    <span className="text-light-muted fs-8">Ajusta los filtros o vincula un nuevo conductor.</span>
                  </div>
                </td>
              </tr>
            ) : (
              conductores.map((conductor) => {
                const dias = daysUntil(conductor.licenciaVence);
                return (
                  <tr key={conductor.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="avatar-sm rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                          style={{ backgroundColor: 'var(--lp-brand)', fontSize: '0.8rem' }}
                          aria-hidden="true"
                        >
                          {conductor.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-bold text-white fs-7">{conductor.nombre}</div>
                          <small className="text-light-muted fs-8">{conductor.id}</small>
                        </div>
                      </div>
                    </td>
                    <td className="fs-7 text-white">{conductor.cedula}</td>
                    <td>
                      <span className="badge badge-dark-subtle fs-8">Lic. {conductor.categoriaLicencia}</span>
                    </td>
                    <td className={`fs-7 ${licenciaClase(dias)}`}>
                      {formatFechaCorta(conductor.licenciaVence)}
                      {dias !== null && (
                        <small className="d-block fs-8 text-light-muted">
                          {dias < 0 ? `Vencida hace ${Math.abs(dias)}d` : `En ${dias} días`}
                        </small>
                      )}
                    </td>
                    <td className="fs-7 text-white">{conductor.telefono || '—'}</td>
                    <td>
                      <span className={`badge bg-${conductorEstadoVariant[conductor.estado] ?? 'secondary'}-subtle text-${conductorEstadoVariant[conductor.estado] ?? 'secondary'} fs-8`}>
                        {conductor.estado}
                      </span>
                    </td>
                    <td className="text-end no-print">
                      <button type="button" className="btn btn-outline-dark-custom btn-sm p-1 me-1" title="Ver detalle" onClick={() => onVer(conductor)}>
                        <span className="material-symbols-outlined fs-6 text-warning">visibility</span>
                      </button>
                      <button type="button" className="btn btn-outline-dark-custom btn-sm p-1 me-1" title="Editar" onClick={() => onEditar(conductor)}>
                        <span className="material-symbols-outlined fs-6 text-light-muted">edit</span>
                      </button>
                      <button type="button" className="btn btn-outline-dark-custom btn-sm p-1" title="Eliminar" onClick={() => onEliminar(conductor)}>
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

      {conductores.length > 0 && (
        <div className="d-flex justify-content-end mt-2">
          <small className="text-light-muted fs-8">Mostrando {conductores.length} de {total} conductores</small>
        </div>
      )}
    </div>
  );
}
