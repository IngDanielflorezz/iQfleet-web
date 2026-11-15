import { useEffect, useState } from 'react';
import {
  CONDUCTOR_ESTADOS,
  CONDUCTOR_ESTADO_LIST,
  LICENCIA_CATEGORIAS,
  validateConductor,
} from '../../../services/conductorService';

function buildInitial(conductor) {
  return {
    nombre: conductor?.nombre ?? '',
    cedula: conductor?.cedula ?? '',
    categoriaLicencia: conductor?.categoriaLicencia ?? 'B2',
    licenciaVence: conductor?.licenciaVence ?? '',
    telefono: conductor?.telefono ?? '',
    estado: conductor?.estado ?? CONDUCTOR_ESTADOS.ACTIVO,
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

export default function ConductorModal({ conductor, onClose, onGuardar }) {
  const [form, setForm] = useState(() => buildInitial(conductor));
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const esEdicion = Boolean(conductor);
  const actualizar = (campo) => (event) => setForm((previo) => ({ ...previo, [campo]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const erroresLocales = validateConductor({ ...form, id: conductor?.id }, { ignoreId: conductor?.id ?? null });
    if (Object.keys(erroresLocales).length > 0) {
      setErrores(erroresLocales);
      return;
    }

    setEnviando(true);
    const resultado = await onGuardar(form);
    if (resultado?.ok) {
      onClose();
      return;
    }
    setErrores(resultado?.fields ?? { general: resultado?.error ?? 'No se pudo guardar el conductor.' });
    setEnviando(false);
  };

  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose} />
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <form className="modal-content card-dark text-white" onSubmit={handleSubmit} noValidate>
            <div className="modal-header border-dark-custom p-3">
              <h5 className="modal-title fw-bold fs-7">{esEdicion ? 'Editar Conductor' : 'Vincular Conductor'}</h5>
              <button type="button" className="btn-close btn-close-white" aria-label="Cerrar" onClick={onClose} />
            </div>

            <div className="modal-body p-3 d-flex flex-column gap-3">
              {errores.general && <div className="alert alert-danger py-2 mb-0 fs-8">{errores.general}</div>}

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <Campo etiqueta="Nombre Completo" error={errores.nombre}>
                    <input
                      type="text"
                      className="form-control form-control-dark"
                      placeholder="Ej. Carlos Rodríguez"
                      value={form.nombre}
                      onChange={actualizar('nombre')}
                    />
                  </Campo>
                </div>
                <div className="col-12 col-md-6">
                  <Campo etiqueta="Cédula" error={errores.cedula}>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="form-control form-control-dark"
                      placeholder="CC 12.345.678"
                      value={form.cedula}
                      onChange={(event) => setForm((previo) => ({ ...previo, cedula: event.target.value.replace(/\D/g, '') }))}
                    />
                  </Campo>
                </div>

                <div className="col-12 col-md-6">
                  <Campo etiqueta="Categoría de Licencia" error={errores.categoriaLicencia}>
                    <select className="select-dark w-100" value={form.categoriaLicencia} onChange={actualizar('categoriaLicencia')}>
                      {LICENCIA_CATEGORIAS.map((categoria) => (
                        <option key={categoria} value={categoria}>
                          {categoria}
                        </option>
                      ))}
                    </select>
                  </Campo>
                </div>
                <div className="col-12 col-md-6">
                  <Campo etiqueta="Vencimiento Licencia" error={errores.licenciaVence}>
                    <input
                      type="date"
                      className="form-control form-control-dark"
                      value={form.licenciaVence}
                      onChange={actualizar('licenciaVence')}
                    />
                  </Campo>
                </div>

                <div className="col-12 col-md-6">
                  <Campo etiqueta="Teléfono" error={errores.telefono}>
                    <input
                      type="tel"
                      inputMode="numeric"
                      className="form-control form-control-dark"
                      placeholder="Ej. 3104567890"
                      value={form.telefono}
                      onChange={(event) => setForm((previo) => ({ ...previo, telefono: event.target.value.replace(/\D/g, '') }))}
                    />
                  </Campo>
                </div>
                <div className="col-12 col-md-6">
                  <Campo etiqueta="Estado" error={errores.estado}>
                    <select className="select-dark w-100" value={form.estado} onChange={actualizar('estado')}>
                      {CONDUCTOR_ESTADO_LIST.map((estado) => (
                        <option key={estado} value={estado}>
                          {estado}
                        </option>
                      ))}
                    </select>
                  </Campo>
                </div>
              </div>
            </div>

            <div className="modal-footer border-dark-custom p-2">
              <button type="button" className="btn-outline-dark-custom" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn-orange-cta" disabled={enviando}>
                <span className="material-symbols-outlined fs-6">{esEdicion ? 'save' : 'person_add'}</span>
                {esEdicion ? 'Guardar cambios' : 'Vincular conductor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
