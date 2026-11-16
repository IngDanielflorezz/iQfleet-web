import { useEffect, useRef, useState } from 'react';
import { diasRestantesLabel, clasificarVencimiento } from '../documentosMetrics';
import { formatFechaCorta, formatFechaHora } from '../../../utils/dateUtils';

export default function DocumentoDetailModal({ documento, onArchivo, onDescargar, onClose }) {
  const fileInputRef = useRef(null);
  const [procesando, setProcesando] = useState(null); // 'subiendo' | 'descargando' | null
  const [errorArchivo, setErrorArchivo] = useState(null);

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

  const ejecutar = async (estado, accion) => {
    setProcesando(estado);
    setErrorArchivo(null);
    const resultado = await accion();
    if (!resultado?.ok) setErrorArchivo(resultado?.error ?? 'No se pudo completar la operación.');
    setProcesando(null);
  };

  const onFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) ejecutar('subiendo', () => onArchivo(file));
  };

  const tieneArchivo = Boolean(documento.archivoNombre);

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
              {errorArchivo && <div className="alert alert-danger py-2 mt-3 mb-0 fs-8">{errorArchivo}</div>}
            </div>
            <div className="modal-footer border-dark-custom p-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,application/pdf"
                className="d-none"
                onChange={onFileChange}
              />
              {tieneArchivo && (
                <button
                  type="button"
                  className="btn-outline-dark-custom"
                  disabled={Boolean(procesando)}
                  onClick={() => ejecutar('descargando', () => onDescargar(documento.id))}
                >
                  <span className="material-symbols-outlined fs-6">download</span>
                  {procesando === 'descargando' ? 'Preparando…' : 'Descargar'}
                </button>
              )}
              <button
                type="button"
                className="btn-outline-dark-custom"
                disabled={Boolean(procesando)}
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="material-symbols-outlined fs-6">upload</span>
                {procesando === 'subiendo' ? 'Subiendo…' : tieneArchivo ? 'Reemplazar archivo' : 'Adjuntar archivo'}
              </button>
              <button type="button" className="btn-outline-dark-custom" onClick={onClose}>Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
