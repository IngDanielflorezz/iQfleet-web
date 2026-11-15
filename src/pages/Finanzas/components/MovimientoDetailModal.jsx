import { formatCOP } from '../../../utils/format';
import { formatFechaCorta } from '../../../utils/dateUtils';

export default function MovimientoDetailModal({ movimiento, onClose }) {
  if (!movimiento) return null;

  const esIngreso = movimiento.tipo === 'Ingreso';
  const filas = [
    { etiqueta: 'Fecha', valor: formatFechaCorta(movimiento.fecha) },
    { etiqueta: 'Tipo', valor: movimiento.tipo },
    { etiqueta: 'Concepto', valor: movimiento.concepto },
    { etiqueta: 'Placa', valor: movimiento.placa || 'N/A' },
    { etiqueta: 'Conductor', valor: movimiento.conductor || 'N/A' },
    { etiqueta: 'Factura / Recibo', valor: movimiento.factura || 'N/A' },
    { etiqueta: 'Medio de pago', valor: movimiento.medioPago },
    { etiqueta: 'Kilometraje', valor: movimiento.km ? `${movimiento.km.toLocaleString('es-CO')} km` : 'N/A' },
    { etiqueta: 'Comprobante', valor: movimiento.comprobanteNombre || 'Sin adjunto' },
  ];

  return (
    <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content card-dark border-0">
          <div className="modal-header border-0">
            <h5 className="modal-title text-white fw-bold">Detalle del Movimiento</h5>
            <button type="button" className="btn-close btn-close-white" aria-label="Cerrar" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className={`d-flex align-items-center justify-content-between p-3 rounded mb-3 ${esIngreso ? 'bg-success-subtle-iq' : 'bg-danger-subtle-iq'}`}>
              <span className="fs-8 text-light-muted">{movimiento.concepto}</span>
              <strong className={`fs-4 ${esIngreso ? 'text-success' : 'text-danger'}`}>
                {esIngreso ? '+' : '−'} {formatCOP(movimiento.monto)}
              </strong>
            </div>

            <dl className="row mb-0 fs-8">
              {filas.map((fila) => (
                <div key={fila.etiqueta} className="col-6 mb-2">
                  <dt className="text-light-muted fw-normal">{fila.etiqueta}</dt>
                  <dd className="text-white mb-0">{fila.valor}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="modal-footer border-0">
            <button type="button" className="btn btn-outline-dark-custom" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
