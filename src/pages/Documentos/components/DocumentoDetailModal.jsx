import { useEffect, useRef } from 'react';
import { diasRestantesLabel, clasificarVencimiento } from '../documentosMetrics';
import { formatFechaCorta, formatFechaHora } from '../../../utils/dateUtils';

export default function DocumentoDetailModal({ documento, archivo, onArchivo, onClose }) {
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!documento) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [documento, onClose]);

  if (!documento) return null;

  const { grupo, dias } = clasificarVencimiento(documento);
  const variante = { critico: 'danger', preventivo: 'warning', vigente: 'success' }[grupo] ?? 'secondary';

  const onFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) onArchivo(file);
    event.target.value = '';
  };

  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose} />
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content card-dark text-white">
            <div className="modal-header border-dark-custom p-3">
              <h5 className="modal-title fw-bold fs-7">Detalle del Documento</h5>
              <button type="button" className="btn-close btn-close-white" aria-label="Cerrar" onClick={onClose} />
            </div>
            <div className="modal-body p-3">
              <div className="d-flex align-items-center gap-2 mb-3">
                <span className={`material-symbols-outlined text-${variante} fs-3`}>description</span>
                <div>
                  <div className="fw-bold text-white fs-6">{documento.tipo}</div>
                  <span className={`badge bg-${variante} text-white fs-8`}>{diasRestantesLabel(dias)}</span>
                </div>
              </div>

              <dl className="row mb-0 fs-7">
                <dt className="col-5 text-light-muted">Número / Póliza</dt>
                <dd className="col-7 text-white text-end">{documento.numero}</dd>

                <dt className="col-5 text-light-muted">Entidad emisora</dt>
                <dd className="col-7 text-white text-end">{documento.entidad}</dd>

                <dt className="col-5 text-light-muted">Placa</dt>
                <dd className="col-7 text-white text-end">{documento.placa || '—'}</dd>

                <dt className="col-5 text-light-muted">Conductor</dt>
                <dd className="col-7 text-white text-end">{documento.conductor || '—'}</dd>

                <dt className="col-5 text-light-muted">Expedición</dt>
                <dd className="col-7 text-white text-end">{formatFechaCorta(documento.expedicion)}</dd>

                <dt className="col-5 text-light-muted">Vencimiento</dt>
                <dd className="col-7 text-white text-end">{formatFechaCorta(documento.vencimiento)}</dd>

                <dt className="col-5 text-light-muted">Auditoría RUNT</dt>
                <dd className="col-7 text-white text-end">
                  {documento.estadoRunt}
                  {documento.runtSincronizadoEn && (
                    <small className="d-block text-light-muted fs-8">{formatFechaHora(documento.runtSincronizadoEn)}</small>
                  )}
                </dd>

                <dt className="col-5 text-light-muted">Archivo</dt>
                <dd className="col-7 text-white text-end">{documento.archivoNombre || 'Sin adjunto'}</dd>
              </dl>
            </div>
            <div className="modal-footer border-dark-custom p-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,application/pdf"
                className="d-none"
                onChange={onFileChange}
              />
              {archivo ? (
                <a className="btn-outline-dark-custom" href={archivo.dataUrl} download={archivo.nombre} target="_blank" rel="noreferrer">
                  <span className="material-symbols-outlined fs-6">download</span> Descargar
                </a>
              ) : (
                <button type="button" className="btn-outline-dark-custom" onClick={() => fileInputRef.current?.click()}>
                  <span className="material-symbols-outlined fs-6">upload</span> Adjuntar archivo
                </button>
              )}
              <button type="button" className="btn-outline-dark-custom" onClick={onClose}>Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
