export default function ConfirmDialog({ open, titulo, mensaje, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content card-dark border-0">
            <div className="modal-header border-0">
              <h5 className="modal-title text-white fw-bold">{titulo}</h5>
              <button type="button" className="btn-close btn-close-white" aria-label="Cerrar" onClick={onCancel}></button>
            </div>
            <div className="modal-body text-light-muted fs-8">{mensaje}</div>
            <div className="modal-footer border-0">
              <button type="button" className="btn btn-outline-dark-custom" onClick={onCancel}>Cancelar</button>
              <button type="button" className="btn btn-danger" onClick={onConfirm}>Eliminar</button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
}
