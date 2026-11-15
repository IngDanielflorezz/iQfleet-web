import { formatCOP } from '../../../utils/format';
import { formatFechaCorta } from '../../../utils/dateUtils';
import { TIPO_INGRESO } from '../finanzasMetrics';

export default function MovimientosTable({ filas, onVer, onEditar, onEliminar }) {
  if (filas.length === 0) {
    return (
      <div className="card-dark p-4 text-center text-light-muted">
        <span className="material-symbols-outlined fs-2 d-block mb-2">receipt_long</span>
        No hay movimientos que coincidan con el filtro.
      </div>
    );
  }

  return (
    <div className="card-dark p-0 overflow-hidden">
      <div className="table-responsive">
        <table className="table table-dark-custom align-middle mb-0">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Concepto</th>
              <th>Placa</th>
              <th>Conductor</th>
              <th>Factura</th>
              <th className="text-end">Monto</th>
              <th className="text-end no-print">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((movimiento) => {
              const esIngreso = movimiento.tipo === TIPO_INGRESO;
              return (
                <tr key={movimiento.id}>
                  <td className="fs-8 text-light-muted">{formatFechaCorta(movimiento.fecha)}</td>
                  <td>
                    <span className={`badge fs-8 ${esIngreso ? 'badge-success-subtle' : 'badge-orange-subtle'}`}>
                      {movimiento.tipo}
                    </span>
                  </td>
                  <td className="text-white fw-semibold fs-7">{movimiento.concepto}</td>
                  <td>
                    {movimiento.placa ? <span className="badge-plate">{movimiento.placa}</span> : <span className="text-light-muted fs-8">—</span>}
                  </td>
                  <td className="fs-8 text-light-muted">{movimiento.conductor || '—'}</td>
                  <td className="fs-8 text-light-muted">{movimiento.factura || '—'}</td>
                  <td className={`text-end fw-bold ${esIngreso ? 'text-success' : 'text-danger'}`}>
                    {esIngreso ? '+' : '−'} {formatCOP(movimiento.monto)}
                  </td>
                  <td className="text-end no-print">
                    <button type="button" className="btn btn-outline-dark-custom btn-sm p-1 me-1" title="Ver comprobante" onClick={() => onVer(movimiento)}>
                      <span className="material-symbols-outlined fs-6 text-warning">visibility</span>
                    </button>
                    <button type="button" className="btn btn-outline-dark-custom btn-sm p-1 me-1" title="Editar movimiento" onClick={() => onEditar(movimiento)}>
                      <span className="material-symbols-outlined fs-6 text-light-muted">edit</span>
                    </button>
                    <button type="button" className="btn btn-outline-dark-custom btn-sm p-1" title="Eliminar movimiento" onClick={() => onEliminar(movimiento)}>
                      <span className="material-symbols-outlined fs-6 text-danger">delete</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
