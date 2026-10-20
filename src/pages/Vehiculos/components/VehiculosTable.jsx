import { VEHICULO_ESTADO_LIST, estadoVehiculoVariants } from '../../../services/vehiculoService';
import { daysUntil, formatFechaCorta } from '../../../utils/dateUtils';
import { formatNumber } from '../../../utils/format';

function fechaClase(fechaISO) {
  const dias = daysUntil(fechaISO);
  if (dias === null) return 'text-light-muted';
  if (dias < 0) return 'text-danger fw-bold';
  if (dias <= 30) return 'text-warning fw-semibold';
  return 'text-white';
}

export default function VehiculosTable({
  vehiculos,
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
            placeholder="Buscar por Placa, Marca o Conductor..."
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
            <option value="Todos">Todas</option>
            {VEHICULO_ESTADO_LIST.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
          <button type="button" className="btn-orange-cta" onClick={onNuevo}>
            <span className="material-symbols-outlined fs-6">add</span> Nuevo
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-dark-custom align-middle mb-0">
          <thead>
            <tr>
              <th>VEHÍCULO</th>
              <th>TIPO</th>
              <th>AÑO</th>
              <th>CONDUCTOR ASIGNADO</th>
              <th className="text-end">KILOMETRAJE</th>
              <th>ESTADO</th>
              <th>SOAT</th>
              <th>RTM</th>
              <th className="text-end no-print">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {vehiculos.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="d-flex flex-column align-items-center justify-content-center text-center gap-1 py-4">
                    <span className="material-symbols-outlined text-light-muted fs-2">no_crash</span>
                    <span className="text-white fs-7 fw-semibold">No hay vehículos para mostrar</span>
                    <span className="text-light-muted fs-8">Ajusta los filtros o registra un nuevo vehículo.</span>
                  </div>
                </td>
              </tr>
            ) : (
              vehiculos.map((vehiculo) => (
                <tr key={vehiculo.id}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div className="plate-box text-center">
                        <span className="plate-city">{vehiculo.ciudad}</span>
                        <span className="plate-code">{vehiculo.id}</span>
                        <span className="plate-country">COLOMBIA</span>
                      </div>
                      <div>
                        <div className="fw-bold text-white fs-7">{vehiculo.marca} {vehiculo.modelo}</div>
                        <small className="text-light-muted fs-8">{vehiculo.tipo}</small>
                      </div>
                    </div>
                  </td>
                  <td className="fs-7 text-white">{vehiculo.tipo}</td>
                  <td className="fs-7 text-white">{vehiculo.anio}</td>
                  <td className="fs-7 text-white">{vehiculo.conductor}</td>
                  <td className="fs-7 text-white text-end">{formatNumber(vehiculo.kilometraje)} km</td>
                  <td>
                    <span className={`badge bg-${estadoVehiculoVariants[vehiculo.estado] ?? 'secondary'}-subtle text-${estadoVehiculoVariants[vehiculo.estado] ?? 'secondary'} fs-8`}>
                      {vehiculo.estado}
                    </span>
                  </td>
                  <td className={`fs-7 ${fechaClase(vehiculo.soatVence)}`}>{formatFechaCorta(vehiculo.soatVence)}</td>
                  <td className={`fs-7 ${fechaClase(vehiculo.rtmVence)}`}>{formatFechaCorta(vehiculo.rtmVence)}</td>
                  <td className="text-end no-print">
                    <button type="button" className="btn btn-outline-dark-custom btn-sm p-1 me-1" title="Ver detalle" onClick={() => onVer(vehiculo)}>
                      <span className="material-symbols-outlined fs-6 text-warning">visibility</span>
                    </button>
                    <button type="button" className="btn btn-outline-dark-custom btn-sm p-1 me-1" title="Editar" onClick={() => onEditar(vehiculo)}>
                      <span className="material-symbols-outlined fs-6 text-light-muted">edit</span>
                    </button>
                    <button type="button" className="btn btn-outline-dark-custom btn-sm p-1" title="Eliminar" onClick={() => onEliminar(vehiculo)}>
                      <span className="material-symbols-outlined fs-6 text-danger">delete</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {vehiculos.length > 0 && (
        <div className="d-flex justify-content-end mt-2">
          <small className="text-light-muted fs-8">Mostrando {vehiculos.length} de {total} vehículos</small>
        </div>
      )}
    </div>
  );
}
