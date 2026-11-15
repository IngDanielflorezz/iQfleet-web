import { useEffect, useState } from 'react';
import {
  DESPACHO_ESTADO_LIST,
  DESPACHO_ESTADOS,
  validateDespacho,
} from '../../../services/despachoService';
import { toDateTimeLocalValue } from '../../../utils/dateUtils';

function buildInitial(despacho) {
  return {
    placa: despacho?.placa ?? '',
    conductor: despacho?.conductor ?? '',
    origen: despacho?.origen ?? '',
    destino: despacho?.destino ?? '',
    fechaSalida: despacho?.fechaSalida ? despacho.fechaSalida.slice(0, 16) : toDateTimeLocalValue(new Date()),
    estado: despacho?.estado ?? DESPACHO_ESTADOS.PROGRAMADO,
    valorFlete: despacho?.valorFlete ?? '',
    costoOperativo: despacho?.costoOperativo ?? '',
    observaciones: despacho?.observaciones ?? '',
  };
}

function Campo({ etiqueta, error, children }) {
  return (
    <div>
      <label className="form-label-dark mb-1">{etiqueta}</label>
      {children}
      {error && <small className="text-danger fs-8 d-block mt-1">{error}</small>}
    </div>
  );
}

export default function ModalDespacho({ despacho, flota, conductores, onClose, onGuardar }) {
  const [form, setForm] = useState(() => buildInitial(despacho));
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const esEdicion = Boolean(despacho);
  const actualizar = (campo) => (event) => setForm((previo) => ({ ...previo, [campo]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const dto = {
      ...form,
      valorFlete: form.valorFlete === '' ? 0 : Number(form.valorFlete),
      costoOperativo: form.costoOperativo === '' ? 0 : Number(form.costoOperativo),
    };

    const erroresLocales = validateDespacho(dto, { ignoreId: despacho?.id ?? null });
    if (Object.keys(erroresLocales).length > 0) {
      setErrores(erroresLocales);
      return;
    }

    setEnviando(true);
    const resultado = onGuardar(dto);
    if (resultado?.ok) {
      onClose();
      return;
    }
    setErrores(resultado?.fields ?? { general: resultado?.error ?? 'No se pudo guardar el despacho.' });
    setEnviando(false);
  };

  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose} />
      <div className="modal fade show d-block" id="modalDespacho" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <form className="modal-content card-dark text-white" onSubmit={handleSubmit} noValidate>
            <div className="modal-header border-dark-custom p-3">
              <h5 className="modal-title fw-bold fs-7">{esEdicion ? 'Editar Despacho' : 'Registrar Despacho'}</h5>
              <button type="button" className="btn-close btn-close-white" aria-label="Cerrar" onClick={onClose} />
            </div>

            <div className="modal-body p-3 d-flex flex-column gap-3">
              {errores.general && <div className="alert alert-danger py-2 mb-0 fs-8">{errores.general}</div>}

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <Campo etiqueta="Vehículo / Placa" error={errores.placa}>
                    <select className="select-dark w-100" value={form.placa} onChange={actualizar('placa')}>
                      <option value="">Selecciona un vehículo...</option>
                      {flota.map((vehiculo) => (
                        <option key={vehiculo.id} value={vehiculo.id}>
                          {vehiculo.id} · {vehiculo.marca} {vehiculo.modelo}
                        </option>
                      ))}
                    </select>
                  </Campo>
                </div>
                <div className="col-12 col-md-6">
                  <Campo etiqueta="Conductor" error={errores.conductor}>
                    <input
                      type="text"
                      className="form-control form-control-dark"
                      list="conductoresConocidos"
                      placeholder="Ej. Juan Pérez"
                      value={form.conductor}
                      onChange={actualizar('conductor')}
                    />
                    <datalist id="conductoresConocidos">
                      {conductores.map((conductor) => (
                        <option key={conductor} value={conductor} />
                      ))}
                    </datalist>
                  </Campo>
                </div>

                <div className="col-12 col-md-6">
                  <Campo etiqueta="Origen" error={errores.origen}>
                    <input
                      type="text"
                      className="form-control form-control-dark"
                      placeholder="Ciudad de origen"
                      value={form.origen}
                      onChange={actualizar('origen')}
                    />
                  </Campo>
                </div>
                <div className="col-12 col-md-6">
                  <Campo etiqueta="Destino" error={errores.destino}>
                    <input
                      type="text"
                      className="form-control form-control-dark"
                      placeholder="Ciudad de destino"
                      value={form.destino}
                      onChange={actualizar('destino')}
                    />
                  </Campo>
                </div>

                <div className="col-12 col-md-6">
                  <Campo etiqueta="Fecha de Salida" error={errores.fechaSalida}>
                    <input
                      type="datetime-local"
                      className="form-control form-control-dark"
                      value={form.fechaSalida}
                      onChange={actualizar('fechaSalida')}
                    />
                  </Campo>
                </div>
                <div className="col-12 col-md-6">
                  <Campo etiqueta="Estado">
                    <select className="select-dark w-100" value={form.estado} onChange={actualizar('estado')}>
                      {DESPACHO_ESTADO_LIST.map((estado) => (
                        <option key={estado} value={estado}>
                          {estado}
                        </option>
                      ))}
                    </select>
                  </Campo>
                </div>

                <div className="col-12 col-md-6">
                  <Campo etiqueta="Valor Flete (COP)" error={errores.valorFlete}>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      className="form-control form-control-dark"
                      placeholder="0"
                      value={form.valorFlete}
                      onChange={actualizar('valorFlete')}
                    />
                  </Campo>
                </div>
                <div className="col-12 col-md-6">
                  <Campo etiqueta="Costo Operativo (COP)" error={errores.costoOperativo}>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      className="form-control form-control-dark"
                      placeholder="0"
                      value={form.costoOperativo}
                      onChange={actualizar('costoOperativo')}
                    />
                  </Campo>
                </div>

                <div className="col-12">
                  <Campo etiqueta="Observaciones">
                    <textarea
                      rows={2}
                      className="form-control form-control-dark"
                      placeholder="Notas del despacho (opcional)"
                      value={form.observaciones}
                      onChange={actualizar('observaciones')}
                    />
                  </Campo>
                </div>
              </div>
            </div>

            <div className="modal-footer border-dark-custom p-2">
              <button type="button" className="btn btn-outline-dark-custom" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-orange-cta" disabled={enviando}>
                <span className="material-symbols-outlined fs-6">{esEdicion ? 'save' : 'add'}</span>
                {esEdicion ? 'Guardar cambios' : 'Registrar despacho'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
