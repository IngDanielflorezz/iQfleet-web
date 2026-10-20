import { useEffect } from 'react';
import { estadoVehiculoVariants } from '../../../services/vehiculoService';
import { daysUntil, formatFechaCorta } from '../../../utils/dateUtils';
import { formatNumber } from '../../../utils/format';

export default function VehiculoDetailModal({ vehiculo, onClose }) {
  useEffect(() => {
    if (!vehiculo) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [vehiculo, onClose]);

  if (!vehiculo) return null;

  const variant = estadoVehiculoVariants[vehiculo.estado] ?? 'secondary';
  const diasSoat = daysUntil(vehiculo.soatVence);
  const diasRtm = daysUntil(vehiculo.rtmVence);

  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose} />
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content card-dark text-white">
            <div className="modal-header border-dark-custom p-3">
              <h5 className="modal-title fw-bold fs-7">Detalle del Vehículo</h5>
              <button type="button" className="btn-close btn-close-white" aria-label="Cerrar" onClick={onClose} />
            </div>
            <div className="modal-body p-3">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="plate-box text-center">
                  <span className="plate-city">{vehiculo.ciudad}</span>
                  <span className="plate-code">{vehiculo.id}</span>
                  <span className="plate-country">COLOMBIA</span>
                </div>
                <div>
                  <div className="fw-bold text-white fs-6">{vehiculo.marca} {vehiculo.modelo}</div>
                  <span className={`badge bg-${variant}-subtle text-${variant} fs-8`}>{vehiculo.estado}</span>
                </div>
              </div>

              <dl className="row mb-0 fs-7">
                <dt className="col-5 text-light-muted">Tipo</dt>
                <dd className="col-7 text-white text-end">{vehiculo.tipo}</dd>

                <dt className="col-5 text-light-muted">Año</dt>
                <dd className="col-7 text-white text-end">{vehiculo.anio}</dd>

                <dt className="col-5 text-light-muted">Conductor asignado</dt>
                <dd className="col-7 text-white text-end">{vehiculo.conductor}</dd>

                <dt className="col-5 text-light-muted">Kilometraje</dt>
                <dd className="col-7 text-white text-end">{formatNumber(vehiculo.kilometraje)} km</dd>

                <dt className="col-5 text-light-muted">Vence SOAT</dt>
                <dd className="col-7 text-white text-end">
                  {formatFechaCorta(vehiculo.soatVence)}
                  {diasSoat !== null && (
                    <small className="d-block text-light-muted fs-8">
                      {diasSoat < 0 ? `Vencido hace ${Math.abs(diasSoat)}d` : `En ${diasSoat} días`}
                    </small>
                  )}
                </dd>

                <dt className="col-5 text-light-muted">Vence RTM</dt>
                <dd className="col-7 text-white text-end">
                  {formatFechaCorta(vehiculo.rtmVence)}
                  {diasRtm !== null && (
                    <small className="d-block text-light-muted fs-8">
                      {diasRtm < 0 ? `Vencido hace ${Math.abs(diasRtm)}d` : `En ${diasRtm} días`}
                    </small>
                  )}
                </dd>
              </dl>
            </div>
            <div className="modal-footer border-dark-custom p-2">
              <button type="button" className="btn-outline-dark-custom" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
