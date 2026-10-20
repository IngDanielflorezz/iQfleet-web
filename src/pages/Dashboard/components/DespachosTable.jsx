import { DESPACHO_ESTADO_LIST, despachoEstadoVariant } from '../../../services/despachoService';
import { formatFechaHora } from '../../../utils/dateUtils';
import { formatCOP } from '../../../utils/format';

export default function DespachosTable({
  despachos,
  total,
  busqueda,
  onBusquedaChange,
  filtroEstado,
  onFiltroEstadoChange,
  onEditar,
  onEliminar,
  onNuevoDespacho,
}) {
  return (
    <div className="card-dark overflow-hidden mt-3">
      <div className="p-3 border-bottom border-dark-custom d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
        <div className="d-flex align-items-center gap-2">
          <span className="material-symbols-outlined text-warning fs-5">local_shipping</span>
          <h2 className="fs-6 text-white fw-bold mb-0">Despachos del período</h2>
          <span className="badge badge-dark-subtle fs-8">{despachos.length} de {total}</span>
        </div>

        <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2 no-print">
          <div className="input-dark-group">
            <span className="material-symbols-outlined input-dark-icon">search</span>
            <input
              type="search"
              className="form-control form-control-dark"
              placeholder="Buscar placa, conductor o ruta..."
              value={busqueda}
              onChange={(event) => onBusquedaChange(event.target.value)}
              style={{ minWidth: '260px' }}
            />
          </div>
          <select
            className="select-dark"
            value={filtroEstado}
            onChange={(event) => onFiltroEstadoChange(event.target.value)}
            aria-label="Filtrar por estado"
          >
            <option value="Todos">Todos los estados</option>
            {DESPACHO_ESTADO_LIST.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-orange-cta" onClick={onNuevoDespacho}>
            <span className="material-symbols-outlined fs-6">add</span> Nuevo
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-dark-custom align-middle mb-0">
          <thead>
            <tr>
              <th>DESPACHO</th>
              <th>VEHÍCULO / CONDUCTOR</th>
              <th>RUTA</th>
              <th>FECHA SALIDA</th>
              <th className="text-end">FLETE</th>
              <th>ESTADO</th>
              <th className="text-end no-print">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {despachos.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="d-flex flex-column align-items-center justify-content-center text-center gap-1 py-4">
                    <span className="material-symbols-outlined text-light-muted fs-2">inbox</span>
                    <span className="text-white fs-7 fw-semibold">No hay despachos para mostrar</span>
                    <span className="text-light-muted fs-8">Ajusta los filtros o registra un nuevo despacho.</span>
                  </div>
                </td>
              </tr>
            ) : (
              despachos.map((despacho) => (
                <tr key={despacho.id}>
                  <td>
                    <span className="text-white fw-bold fs-7 d-block">{despacho.id}</span>
                    <small className="text-light-muted fs-8">
                      {despacho.observaciones ? despacho.observaciones.slice(0, 32) : 'Sin observaciones'}
                    </small>
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div className="plate-box text-center">
                        <span className="plate-city">COLOMBIA</span>
                        <span className="plate-code">{despacho.placa}</span>
                        <span className="plate-country">iQFLEET</span>
                      </div>
                      <span className="text-white fs-7">{despacho.conductor}</span>
                    </div>
                  </td>
                  <td className="fs-7 text-white">
                    {despacho.origen} <span className="text-light-muted">→</span> {despacho.destino}
                  </td>
                  <td className="fs-7 text-white">{formatFechaHora(despacho.fechaSalida)}</td>
                  <td className="fs-7 text-white text-end">{formatCOP(despacho.valorFlete)}</td>
                  <td>
                    <span className={`badge bg-${despachoEstadoVariant[despacho.estado] ?? 'secondary'}-subtle text-${despachoEstadoVariant[despacho.estado] ?? 'secondary'} fs-8`}>
                      {despacho.estado}
                    </span>
                  </td>
                  <td className="text-end no-print">
                    <button
                      type="button"
                      className="btn btn-outline-dark-custom btn-sm p-1 me-1"
                      title="Editar despacho"
                      onClick={() => onEditar(despacho)}
                    >
                      <span className="material-symbols-outlined fs-6 text-warning">edit</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-dark-custom btn-sm p-1"
                      title="Eliminar despacho"
                      onClick={() => onEliminar(despacho)}
                    >
                      <span className="material-symbols-outlined fs-6 text-danger">delete</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
