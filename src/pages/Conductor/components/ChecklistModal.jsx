import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CHECKLIST_ITEMS, ITEM_RESULTADO } from '../../../config/checklistConfig';
import { evaluarChecklist } from '../../../services/checklistService';

function respuestasIniciales(checklist) {
  const base = {};
  CHECKLIST_ITEMS.forEach((item) => {
    const previo = checklist?.respuestas?.[item.id];
    base[item.id] = previo
      ? { resultado: previo.resultado, nota: previo.nota ?? '', vencimiento: previo.vencimiento ?? '' }
      : { resultado: null, nota: '', vencimiento: '' };
  });
  return base;
}

export default function ChecklistModal({ open, checklist, onClose, onSave }) {
  const [respuestas, setRespuestas] = useState(() => respuestasIniciales(checklist));

  const evaluacion = useMemo(() => evaluarChecklist(respuestas), [respuestas]);

  const completo = useMemo(
    () => CHECKLIST_ITEMS.every((item) => respuestas[item.id]?.resultado),
    [respuestas],
  );

  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const setCampo = (itemId, campo, valor) => {
    setRespuestas((previo) => ({
      ...previo,
      [itemId]: { ...previo[itemId], [campo]: valor },
    }));
  };

  return createPortal(
    <>
      <div className="modal-backdrop fade show" onClick={onClose} />
      <div className="modal fade show d-block" id="modalChecklist" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <div className="modal-content card-dark text-white">
            <div className="modal-header border-dark-custom p-3">
              <div>
                <h5 className="modal-title fw-bold fs-7 mb-0">Checklist preoperacional</h5>
                <span className="text-light-muted fs-8">Revisa el vehículo antes de activar la ruta.</span>
              </div>
              <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Cerrar" />
            </div>

            <div className="modal-body p-3">
              <ul className="checklist-list">
                {CHECKLIST_ITEMS.map((item) => {
                  const respuesta = respuestas[item.id] ?? {};
                  return (
                    <li key={item.id} className="checklist-item">
                      <div className="checklist-item__info">
                        <span className="material-symbols-outlined checklist-item__icon">{item.icon}</span>
                        <div className="flex-fill">
                          <span className="checklist-item__label text-white">
                            {item.label}
                            {item.critical && <span className="checklist-item__tag">Crítico</span>}
                          </span>
                          {respuesta.resultado === ITEM_RESULTADO.FALLA && (
                            <input
                              type="text"
                              className="form-control form-control-dark mt-2"
                              placeholder="Describe el problema (recomendado)"
                              value={respuesta.nota ?? ''}
                              onChange={(event) => setCampo(item.id, 'nota', event.target.value)}
                            />
                          )}
                          {item.requiereVencimiento && (
                            <div className="mt-2">
                              <label className="form-label-dark fs-8">Vencimiento</label>
                              <input
                                type="date"
                                className="form-control form-control-dark"
                                value={respuesta.vencimiento ?? ''}
                                onChange={(event) => setCampo(item.id, 'vencimiento', event.target.value)}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="checklist-item__actions">
                        <button
                          type="button"
                          className={`chip-result chip-result--ok ${respuesta.resultado === ITEM_RESULTADO.OK ? 'is-active' : ''}`}
                          onClick={() => setCampo(item.id, 'resultado', ITEM_RESULTADO.OK)}
                        >
                          OK
                        </button>
                        <button
                          type="button"
                          className={`chip-result chip-result--falla ${respuesta.resultado === ITEM_RESULTADO.FALLA ? 'is-active' : ''}`}
                          onClick={() => setCampo(item.id, 'resultado', ITEM_RESULTADO.FALLA)}
                        >
                          Falla
                        </button>
                        <button
                          type="button"
                          className={`chip-result chip-result--na ${respuesta.resultado === ITEM_RESULTADO.NA ? 'is-active' : ''}`}
                          onClick={() => setCampo(item.id, 'resultado', ITEM_RESULTADO.NA)}
                        >
                          N/A
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {(evaluacion.blockers.length > 0 || evaluacion.warnings.length > 0) && (
                <div className="d-flex flex-column gap-2 mt-3">
                  {evaluacion.blockers.length > 0 && (
                    <div className="checklist-eval checklist-eval--danger">
                      <span className="material-symbols-outlined">block</span>
                      <div>
                        <strong className="fs-8">No aprobado — {evaluacion.blockers.length} bloqueo(s) crítico(s)</strong>
                        <ul className="checklist-eval__list mb-0">
                          {evaluacion.blockers.map((bloqueo) => (
                            <li key={bloqueo.id}>{bloqueo.label}: {bloqueo.motivo}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  {evaluacion.warnings.length > 0 && (
                    <div className="checklist-eval checklist-eval--warning">
                      <span className="material-symbols-outlined">warning</span>
                      <div>
                        <strong className="fs-8">{evaluacion.warnings.length} punto(s) de atención</strong>
                        <ul className="checklist-eval__list mb-0">
                          {evaluacion.warnings.map((aviso) => (
                            <li key={aviso.id}>{aviso.label}: {aviso.motivo}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer border-dark-custom p-2">
              <button type="button" className="btn btn-outline-dark-custom" onClick={onClose}>
                Cancelar
              </button>
              <button
                type="button"
                className={evaluacion.approved ? 'btn btn-orange-cta' : 'btn btn-outline-dark-custom'}
                disabled={!completo}
                onClick={() => onSave(respuestas)}
              >
                <span className="material-symbols-outlined fs-5">
                  {evaluacion.approved ? 'check_circle' : 'save'}
                </span>
                {evaluacion.approved ? 'Aprobar y guardar' : 'Guardar evaluación'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
