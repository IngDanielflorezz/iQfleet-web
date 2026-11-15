import { useEffect } from 'react';
import { conductorEstadoVariant } from '../../../services/conductorService';
import { daysUntil, formatFechaCorta } from '../../../utils/dateUtils';

export default function ConductorDetailModal({ conductor, onClose }) {
  useEffect(() => {
    if (!conductor) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [conductor, onClose]);

  if (!conductor) return null;

  const dias = daysUntil(conductor.licenciaVence);
  const variant = conductorEstadoVariant[conductor.estado] ?? 'secondary';

  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose} />
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content card-dark text-white">
            <div className="modal-header border-dark-custom p-3">
              <h5 className="modal-title fw-bold fs-7">Detalle del Conductor</h5>
              <button type="button" className="btn-close btn-close-white" aria-label="Cerrar" onClick={onClose} />
            </div>
            <div className="modal-body p-3">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div
                  className="avatar-sm rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                  style={{ backgroundColor: 'var(--lp-brand)', width: 48, height: 48, fontSize: '1.1rem' }}
                  aria-hidden="true"
                >
                  {conductor.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="fw-bold text-white fs-6">{conductor.nombre}</div>
                  <span className={`badge bg-${variant}-subtle text-${variant} fs-8`}>{conductor.estado}</span>
                </div>
              </div>

              <dl className="row mb-0 fs-7">
                <dt className="col-5 text-light-muted">ID Conductor</dt>
                <dd className="col-7 text-white text-end">{conductor.id}</dd>

                <dt className="col-5 text-light-muted">Cédula</dt>
                <dd className="col-7 text-white text-end">{conductor.cedula}</dd>

                <dt className="col-5 text-light-muted">Categoría licencia</dt>
                <dd className="col-7 text-white text-end">Lic. {conductor.categoriaLicencia}</dd>

                <dt className="col-5 text-light-muted">Vence licencia</dt>
                <dd className="col-7 text-white text-end">
                  {formatFechaCorta(conductor.licenciaVence)}
                  {dias !== null && (
                    <small className="d-block text-light-muted fs-8">
                      {dias < 0 ? `Vencida hace ${Math.abs(dias)}d` : `En ${dias} días`}
                    </small>
                  )}
                </dd>

                <dt className="col-5 text-light-muted">Teléfono</dt>
                <dd className="col-7 text-white text-end">{conductor.telefono || '—'}</dd>
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
