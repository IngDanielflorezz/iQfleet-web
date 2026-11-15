import { useEffect } from 'react';

/**
 * Diálogo de confirmación reutilizable (eliminaciones).
 * Se controla por props: no usa el bundle JS de Bootstrap.
 */
export default function ConfirmDialog({
  open,
  titulo = 'Confirmar acción',
  mensaje,
  etiquetaConfirmar = 'Eliminar',
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <>
      <div className="modal-backdrop fade show" onClick={onCancel} />
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content card-dark text-white">
            <div className="modal-header border-dark-custom p-3">
              <h5 className="modal-title fw-bold fs-7 d-flex align-items-center gap-2">
                <span className="material-symbols-outlined text-danger fs-5">warning</span> {titulo}
              </h5>
              <button type="button" className="btn-close btn-close-white" aria-label="Cerrar" onClick={onCancel} />
            </div>
            <div className="modal-body p-3">
              <p className="text-light-muted fs-7 mb-0">{mensaje}</p>
            </div>
            <div className="modal-footer border-dark-custom p-2">
              <button type="button" className="btn-outline-dark-custom" onClick={onCancel}>
                Cancelar
              </button>
              <button type="button" className="btn btn-danger" onClick={onConfirm}>
                <span className="material-symbols-outlined fs-6">delete</span> {etiquetaConfirmar}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
