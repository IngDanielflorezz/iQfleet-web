import { useEffect, useState } from 'react';

export function Campo({ etiqueta, error, children, ayuda }) {
  return (
    <div>
      <label className="form-label-dark mb-1">{etiqueta}</label>
      {children}
      {ayuda && !error && <small className="text-light-muted fs-8 d-block mt-1">{ayuda}</small>}
      {error && <small className="text-danger fs-8 d-block mt-1">{error}</small>}
    </div>
  );
}

/**
 * Modal de formulario de la pestaña Mantenimiento. `onSubmit` devuelve { ok, error, fields }:
 * si ok, se cierra; si no, pinta los errores por campo o el general.
 */
export default function ModalForm({ titulo, icono = 'save', textoEnviar, validar, onSubmit, onClose, children }) {
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const locales = validar?.() ?? {};
    if (Object.keys(locales).length > 0) {
      setErrores(locales);
      return;
    }
    setEnviando(true);
    const resultado = await onSubmit();
    if (resultado?.ok) {
      onClose();
      return;
    }
    setErrores(resultado?.fields ?? { general: resultado?.error ?? 'No se pudo guardar.' });
    setEnviando(false);
  };

  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose} />
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <form className="modal-content card-dark text-white" onSubmit={handleSubmit} noValidate>
            <div className="modal-header border-dark-custom p-3">
              <h5 className="modal-title fw-bold fs-7">{titulo}</h5>
              <button type="button" className="btn-close btn-close-white" aria-label="Cerrar" onClick={onClose} />
            </div>
            <div className="modal-body p-3 d-flex flex-column gap-3">
              {(errores.general || errores.estado) && (
                <div className="alert alert-danger py-2 mb-0 fs-8">{errores.general ?? errores.estado}</div>
              )}
              {children(errores)}
            </div>
            <div className="modal-footer border-dark-custom p-2">
              <button type="button" className="btn btn-outline-dark-custom" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-orange-cta" disabled={enviando}>
                <span className="material-symbols-outlined fs-6">{icono}</span>
                {enviando ? 'Guardando…' : textoEnviar}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
