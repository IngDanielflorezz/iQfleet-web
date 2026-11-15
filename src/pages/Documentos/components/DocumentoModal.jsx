import { useEffect, useState } from 'react';
import {
  DOCUMENTO_ENTIDADES_SUGERIDAS,
  DOCUMENTO_ESTADO_RUNT_LIST,
  DOCUMENTO_ESTADOS_RUNT,
  DOCUMENTO_TIPO_LIST,
  validateArchivo,
  validateDocumento,
} from '../../../services/documentoService';

function buildInitial(documento) {
  return {
    tipo: documento?.tipo ?? DOCUMENTO_TIPO_LIST[0],
    numero: documento?.numero ?? '',
    entidad: documento?.entidad ?? '',
    placa: documento?.placa ?? '',
    conductor: documento?.conductor ?? '',
    expedicion: documento?.expedicion ?? '',
    vencimiento: documento?.vencimiento ?? '',
    estadoRunt: documento?.estadoRunt ?? DOCUMENTO_ESTADOS_RUNT.PENDIENTE,
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

export default function DocumentoModal({ documento, vehiculos, conductores, onClose, onGuardar }) {
  const [form, setForm] = useState(() => buildInitial(documento));
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [file, setFile] = useState(null);
  const [errorArchivo, setErrorArchivo] = useState(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const esEdicion = Boolean(documento);
  const actualizar = (campo) => (event) => setForm((previo) => ({ ...previo, [campo]: event.target.value }));

  const onFileChange = (event) => {
    const seleccionado = event.target.files?.[0] ?? null;
    const error = validateArchivo(seleccionado);
    setErrorArchivo(error);
    setFile(error ? null : seleccionado);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const erroresLocales = validateDocumento({ ...form, id: documento?.id }, { ignoreId: documento?.id ?? null });
    if (Object.keys(erroresLocales).length > 0 || errorArchivo) {
      setErrores(erroresLocales);
      return;
    }

    setEnviando(true);
    const resultado = onGuardar(form, file);
    if (resultado?.ok) {
      onClose();
      return;
    }
    setErrores(resultado?.fields ?? { general: resultado?.error ?? 'No se pudo guardar el documento.' });
    setEnviando(false);
  };

  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose} />
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <form className="modal-content card-dark text-white" onSubmit={handleSubmit} noValidate>
            <div className="modal-header border-dark-custom p-3">
              <h5 className="modal-title fw-bold fs-7">{esEdicion ? 'Editar Documento' : 'Cargar Documento / Póliza'}</h5>
              <button type="button" className="btn-close btn-close-white" aria-label="Cerrar" onClick={onClose} />
            </div>

            <div className="modal-body p-3 d-flex flex-column gap-3">
              {errores.general && <div className="alert alert-danger py-2 mb-0 fs-8">{errores.general}</div>}

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <Campo etiqueta="Tipo de Documento" error={errores.tipo}>
                    <select className="select-dark w-100" value={form.tipo} onChange={actualizar('tipo')}>
                      {DOCUMENTO_TIPO_LIST.map((tipo) => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                      ))}
                    </select>
                  </Campo>
                </div>
                <div className="col-12 col-md-6">
                  <Campo etiqueta="Número / Póliza" error={errores.numero}>
                    <input type="text" className="form-control form-control-dark" placeholder="Ej. 8921-983210" value={form.numero} onChange={actualizar('numero')} />
                  </Campo>
                </div>

                <div className="col-12 col-md-6">
                  <Campo etiqueta="Entidad Emisora" error={errores.entidad}>
                    <input
                      type="text"
                      list="entidadesSugeridas"
                      className="form-control form-control-dark"
                      placeholder="Ej. Seguros Bolívar S.A."
                      value={form.entidad}
                      onChange={actualizar('entidad')}
                    />
                    <datalist id="entidadesSugeridas">
                      {DOCUMENTO_ENTIDADES_SUGERIDAS.map((entidad) => (
                        <option key={entidad} value={entidad} />
                      ))}
                    </datalist>
                  </Campo>
                </div>
                <div className="col-12 col-md-6">
                  <Campo etiqueta="Estado RUNT" error={errores.estadoRunt}>
                    <select className="select-dark w-100" value={form.estadoRunt} onChange={actualizar('estadoRunt')}>
                      {DOCUMENTO_ESTADO_RUNT_LIST.map((estado) => (
                        <option key={estado} value={estado}>{estado}</option>
                      ))}
                    </select>
                  </Campo>
                </div>

                <div className="col-12 col-md-6">
                  <Campo etiqueta="Placa / Vehículo" error={errores.placa}>
                    <select className="select-dark w-100" value={form.placa} onChange={actualizar('placa')}>
                      <option value="">Sin placa (documento de personal)</option>
                      {vehiculos.map((vehiculo) => (
                        <option key={vehiculo.id} value={vehiculo.id}>{vehiculo.id} · {vehiculo.marca} {vehiculo.modelo}</option>
                      ))}
                    </select>
                  </Campo>
                </div>
                <div className="col-12 col-md-6">
                  <Campo etiqueta="Conductor (opcional)" error={errores.conductor}>
                    <select className="select-dark w-100" value={form.conductor} onChange={actualizar('conductor')}>
                      <option value="">Sin conductor asociado</option>
                      {conductores.map((conductor) => (
                        <option key={conductor.value} value={conductor.label}>{conductor.label}</option>
                      ))}
                    </select>
                  </Campo>
                </div>

                <div className="col-12 col-md-6">
                  <Campo etiqueta="Expedición" error={errores.expedicion}>
                    <input type="date" className="form-control form-control-dark" value={form.expedicion} onChange={actualizar('expedicion')} />
                  </Campo>
                </div>
                <div className="col-12 col-md-6">
                  <Campo etiqueta="Vencimiento" error={errores.vencimiento}>
                    <input type="date" className="form-control form-control-dark" value={form.vencimiento} onChange={actualizar('vencimiento')} />
                  </Campo>
                </div>

                <div className="col-12">
                  <Campo etiqueta="Archivo de Soporte (PNG, JPG o PDF · máx. 2 MB)" error={errorArchivo}>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,application/pdf"
                      className="form-control form-control-dark"
                      onChange={onFileChange}
                    />
                  </Campo>
                  {documento?.archivoNombre && !file && (
                    <small className="text-light-muted fs-8 d-block mt-1">Archivo actual: {documento.archivoNombre}</small>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer border-dark-custom p-2">
              <button type="button" className="btn-outline-dark-custom" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn-orange-cta" disabled={enviando}>
                <span className="material-symbols-outlined fs-6">{esEdicion ? 'save' : 'upload_file'}</span>
                {esEdicion ? 'Guardar cambios' : 'Cargar documento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
