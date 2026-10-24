import { useEffect, useState } from 'react';
import {
  VEHICULO_CIUDADES,
  VEHICULO_ESTADOS,
  VEHICULO_ESTADO_LIST,
  VEHICULO_TIPOS,
  validateVehiculo,
} from '../../../services/vehiculoService';

function buildInitial(vehiculo) {
  return {
    id: vehiculo?.id ?? '',
    ciudad: vehiculo?.ciudad ?? VEHICULO_CIUDADES[0],
    marca: vehiculo?.marca ?? '',
    modelo: vehiculo?.modelo ?? '',
    tipo: vehiculo?.tipo ?? 'Bus',
    anio: vehiculo?.anio ?? new Date().getFullYear(),
    conductorId: vehiculo?.conductorId ?? '',
    kilometraje: vehiculo?.kilometraje ?? 0,
    estado: vehiculo?.estado ?? VEHICULO_ESTADOS.OPERATIVO,
    soatVence: vehiculo?.soatVence ?? '',
    rtmVence: vehiculo?.rtmVence ?? '',
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

export default function VehiculoModal({ vehiculo, conductores, onClose, onGuardar }) {
  const [form, setForm] = useState(() => buildInitial(vehiculo));
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const esEdicion = Boolean(vehiculo);
  const actualizar = (campo) => (event) => setForm((previo) => ({ ...previo, [campo]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const conductor = conductores.find((item) => item.value === form.conductorId);
    const dto = {
      ...form,
      id: form.id.toUpperCase(),
      anio: Number(form.anio),
      kilometraje: Number(form.kilometraje),
      conductor: conductor?.label ?? 'Sin asignar',
    };

    const erroresLocales = validateVehiculo(dto, { ignoreId: vehiculo?.id ?? null });
    if (Object.keys(erroresLocales).length > 0) {
      setErrores(erroresLocales);
      return;
    }

    setEnviando(true);
    const resultado = await onGuardar(dto);
    if (resultado?.ok) {
      onClose();
      return;
    }
    setErrores(resultado?.fields ?? { general: resultado?.error ?? 'No se pudo guardar el vehículo.' });
    setEnviando(false);
  };

  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose} />
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <form className="modal-content card-dark text-white" onSubmit={handleSubmit} noValidate>
            <div className="modal-header border-dark-custom p-3">
              <h5 className="modal-title fw-bold fs-7">{esEdicion ? 'Editar Vehículo' : 'Registrar Vehículo'}</h5>
              <button type="button" className="btn-close btn-close-white" aria-label="Cerrar" onClick={onClose} />
            </div>

            <div className="modal-body p-3 d-flex flex-column gap-3">
              {errores.general && <div className="alert alert-danger py-2 mb-0 fs-8">{errores.general}</div>}

              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <Campo etiqueta="Placa" error={errores.id}>
                    <input
                      type="text"
                      className="form-control form-control-dark text-uppercase"
                      placeholder="Ej. UVP-123"
                      value={form.id}
                      disabled={esEdicion}
                      onChange={(event) => setForm((previo) => ({ ...previo, id: event.target.value.toUpperCase() }))}
                    />
                  </Campo>
                </div>
                <div className="col-12 col-md-4">
                  <Campo etiqueta="Marca" error={errores.marca}>
                    <input type="text" className="form-control form-control-dark" placeholder="Ej. Kenworth" value={form.marca} onChange={actualizar('marca')} />
                  </Campo>
                </div>
                <div className="col-12 col-md-4">
                  <Campo etiqueta="Modelo" error={errores.modelo}>
                    <input type="text" className="form-control form-control-dark" placeholder="Ej. T800" value={form.modelo} onChange={actualizar('modelo')} />
                  </Campo>
                </div>

                <div className="col-12 col-md-4">
                  <Campo etiqueta="Tipo" error={errores.tipo}>
                    <select className="select-dark w-100" value={form.tipo} onChange={actualizar('tipo')}>
                      {VEHICULO_TIPOS.map((tipo) => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                      ))}
                    </select>
                  </Campo>
                </div>
                <div className="col-12 col-md-4">
                  <Campo etiqueta="Ciudad" error={errores.ciudad}>
                    <select className="select-dark w-100" value={form.ciudad} onChange={actualizar('ciudad')}>
                      {VEHICULO_CIUDADES.map((ciudad) => (
                        <option key={ciudad} value={ciudad}>{ciudad}</option>
                      ))}
                    </select>
                  </Campo>
                </div>
                <div className="col-12 col-md-4">
                  <Campo etiqueta="Año" error={errores.anio}>
                    <input type="number" className="form-control form-control-dark" placeholder="2024" value={form.anio} onChange={actualizar('anio')} />
                  </Campo>
                </div>

                <div className="col-12 col-md-6">
                  <Campo etiqueta="Conductor Asignado" error={errores.conductorId}>
                    <select className="select-dark w-100" value={form.conductorId} onChange={actualizar('conductorId')}>
                      <option value="">Sin asignar</option>
                      {conductores.map((conductor) => (
                        <option key={conductor.value} value={conductor.value}>{conductor.label}</option>
                      ))}
                    </select>
                  </Campo>
                </div>
                <div className="col-12 col-md-6">
                  <Campo etiqueta="Kilometraje" error={errores.kilometraje}>
                    <input type="number" min="0" className="form-control form-control-dark" placeholder="0" value={form.kilometraje} onChange={actualizar('kilometraje')} />
                  </Campo>
                </div>

                <div className="col-12 col-md-4">
                  <Campo etiqueta="Estado" error={errores.estado}>
                    <select className="select-dark w-100" value={form.estado} onChange={actualizar('estado')}>
                      {VEHICULO_ESTADO_LIST.map((estado) => (
                        <option key={estado} value={estado}>{estado}</option>
                      ))}
                    </select>
                  </Campo>
                </div>
                <div className="col-12 col-md-4">
                  <Campo etiqueta="Vence SOAT" error={errores.soatVence}>
                    <input type="date" className="form-control form-control-dark" value={form.soatVence} onChange={actualizar('soatVence')} />
                  </Campo>
                </div>
                <div className="col-12 col-md-4">
                  <Campo etiqueta="Vence RTM" error={errores.rtmVence}>
                    <input type="date" className="form-control form-control-dark" value={form.rtmVence} onChange={actualizar('rtmVence')} />
                  </Campo>
                </div>
              </div>

              {conductores.length === 0 && (
                <div className="alert alert-warning py-2 mb-0 fs-8">
                  No hay conductores registrados. Vincula conductores en el módulo <strong>Conductores</strong> para asignarlos.
                </div>
              )}
            </div>

            <div className="modal-footer border-dark-custom p-2">
              <button type="button" className="btn-outline-dark-custom" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn-orange-cta" disabled={enviando}>
                <span className="material-symbols-outlined fs-6">{esEdicion ? 'save' : 'directions_bus'}</span>
                {esEdicion ? 'Guardar cambios' : 'Registrar vehículo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
