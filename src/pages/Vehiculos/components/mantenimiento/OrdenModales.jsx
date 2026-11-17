import { useState } from 'react';
import { TIPOS_MANTENIMIENTO } from '../../../../services/mantenimientoService';
import { MEDIOS_PAGO } from '../../../../services/finanzaService';
import { formatCOP } from '../../../../utils/format';
import ModalForm, { Campo } from './ModalForm';

const hoyISO = () => {
  const hoy = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${hoy.getFullYear()}-${pad(hoy.getMonth() + 1)}-${pad(hoy.getDate())}`;
};

/** Abre una orden. Con `plan`, es preventiva y toma la tarea del plan. */
export function AbrirOrdenModal({ plan, vehiculos, planes, ordenes, onAbrir, onClose }) {
  const [form, setForm] = useState(() => ({
    placa: plan?.placa ?? '',
    tipo: plan ? 'Preventivo' : 'Correctivo',
    planId: plan?.id ?? '',
    descripcion: '',
    fechaApertura: hoyISO(),
    observaciones: '',
  }));
  const actualizar = (campo) => (event) => {
    const { value } = event.target;
    setForm((previo) => {
      const siguiente = { ...previo, [campo]: value };
      if (campo === 'placa') siguiente.planId = '';
      if (campo === 'tipo' && value === 'Correctivo') siguiente.planId = '';
      return siguiente;
    });
  };

  const enTaller = new Set(ordenes.filter((orden) => orden.estado === 'Abierta').map((orden) => orden.placa));
  const planesDelVehiculo = planes.filter((item) => item.placa === form.placa);

  const validar = () => {
    const errores = {};
    if (!form.placa) errores.placa = 'Selecciona un vehículo.';
    else if (enTaller.has(form.placa)) errores.placa = `${form.placa} ya tiene una orden abierta.`;
    if (!form.planId && !form.descripcion.trim()) errores.descripcion = 'Describe el trabajo a realizar.';
    return errores;
  };

  return (
    <ModalForm
      titulo="Abrir orden de mantenimiento"
      icono="build"
      textoEnviar="Abrir orden"
      validar={validar}
      onSubmit={() => onAbrir(form)}
      onClose={onClose}
    >
      {(errores) => (
        <div className="row g-3">
          <div className="col-12">
            <div className="alert alert-warning py-2 mb-0 fs-8">
              Al abrir la orden, el vehículo pasa a <b>Mantenimiento</b> y no se le pueden asignar despachos hasta cerrarla.
            </div>
          </div>
          <div className="col-12 col-md-6">
            <Campo etiqueta="Vehículo" error={errores.placa}>
              <select className="select-dark w-100" value={form.placa} onChange={actualizar('placa')} disabled={Boolean(plan)}>
                <option value="">Selecciona un vehículo...</option>
                {vehiculos.map((vehiculo) => (
                  <option key={vehiculo.id} value={vehiculo.id} disabled={enTaller.has(vehiculo.id)}>
                    {vehiculo.id} · {vehiculo.marca} {vehiculo.modelo}
                    {enTaller.has(vehiculo.id) ? ' (ya en taller)' : ''}
                  </option>
                ))}
              </select>
            </Campo>
          </div>
          <div className="col-12 col-md-6">
            <Campo etiqueta="Tipo" error={errores.tipo}>
              <select className="select-dark w-100" value={form.tipo} onChange={actualizar('tipo')} disabled={Boolean(plan)}>
                {TIPOS_MANTENIMIENTO.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </Campo>
          </div>

          {form.tipo === 'Preventivo' && (
            <div className="col-12 col-md-6">
              <Campo etiqueta="Plan" error={errores.planId} ayuda="Al cerrar la orden se reinicia el contador del plan.">
                <select className="select-dark w-100" value={form.planId} onChange={actualizar('planId')} disabled={Boolean(plan) || !form.placa}>
                  <option value="">Sin plan asociado</option>
                  {planesDelVehiculo.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.tarea}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>
          )}
          <div className={`col-12 ${form.tipo === 'Preventivo' ? 'col-md-6' : ''}`}>
            <Campo etiqueta="Fecha de ingreso al taller" error={errores.fechaApertura}>
              <input type="date" max={hoyISO()} className="form-control form-control-dark" value={form.fechaApertura} onChange={actualizar('fechaApertura')} />
            </Campo>
          </div>

          <div className="col-12">
            <Campo
              etiqueta={form.planId ? 'Descripción (opcional: por defecto, la tarea del plan)' : 'Descripción del trabajo'}
              error={errores.descripcion}
            >
              <input
                type="text"
                maxLength={120}
                className="form-control form-control-dark"
                placeholder={form.tipo === 'Correctivo' ? 'Ej. Fuga de aceite en el cárter' : 'Ej. Cambio de aceite y filtros'}
                value={form.descripcion}
                onChange={actualizar('descripcion')}
              />
            </Campo>
          </div>
          <div className="col-12">
            <Campo etiqueta="Observaciones" error={errores.observaciones}>
              <textarea rows={2} maxLength={250} className="form-control form-control-dark" value={form.observaciones} onChange={actualizar('observaciones')} />
            </Campo>
          </div>
        </div>
      )}
    </ModalForm>
  );
}

/** Cierra una orden: el vehículo vuelve a Operativo y, si hay costo, se registra el egreso en Finanzas. */
export function CerrarOrdenModal({ orden, vehiculo, onCerrar, onClose }) {
  const kmSugerido = Math.max(vehiculo?.kilometraje ?? 0, orden.kmApertura);
  const [form, setForm] = useState({
    fechaCierre: hoyISO(),
    kmCierre: String(kmSugerido),
    costo: '',
    taller: '',
    medioPago: 'Transferencia',
    factura: '',
    observaciones: orden.observaciones ?? '',
  });
  const actualizar = (campo) => (event) => setForm((previo) => ({ ...previo, [campo]: event.target.value }));
  const costo = Number(form.costo) || 0;

  const validar = () => {
    const errores = {};
    if (form.fechaCierre && form.fechaCierre < orden.fechaApertura) errores.fechaCierre = 'No puede ser anterior a la apertura.';
    if (form.kmCierre !== '' && Number(form.kmCierre) < orden.kmApertura) {
      errores.kmCierre = `No puede ser menor al de apertura (${orden.kmApertura.toLocaleString('es-CO')} km).`;
    }
    if (costo < 0) errores.costo = 'No puede ser negativo.';
    return errores;
  };

  return (
    <ModalForm
      titulo={`Cerrar orden · ${orden.placa} · ${orden.descripcion}`}
      icono="task_alt"
      textoEnviar="Cerrar orden"
      validar={validar}
      onSubmit={() => onCerrar(orden.id, form)}
      onClose={onClose}
    >
      {(errores) => (
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <Campo etiqueta="Fecha de salida del taller" error={errores.fechaCierre}>
              <input type="date" min={orden.fechaApertura} max={hoyISO()} className="form-control form-control-dark" value={form.fechaCierre} onChange={actualizar('fechaCierre')} />
            </Campo>
          </div>
          <div className="col-12 col-md-6">
            <Campo etiqueta="Kilometraje al salir" error={errores.kmCierre} ayuda={`Al abrir: ${orden.kmApertura.toLocaleString('es-CO')} km`}>
              <input type="number" min={orden.kmApertura} className="form-control form-control-dark" value={form.kmCierre} onChange={actualizar('kmCierre')} />
            </Campo>
          </div>

          <div className="col-12 col-md-6">
            <Campo etiqueta="Costo total (COP)" error={errores.costo}>
              <input type="number" min="0" step="1000" className="form-control form-control-dark" placeholder="0" value={form.costo} onChange={actualizar('costo')} />
            </Campo>
          </div>
          <div className="col-12 col-md-6">
            <Campo etiqueta="Taller" error={errores.taller}>
              <input type="text" maxLength={80} className="form-control form-control-dark" placeholder="Ej. Taller Diesel del Cesar" value={form.taller} onChange={actualizar('taller')} />
            </Campo>
          </div>

          {costo > 0 && (
            <>
              <div className="col-12 col-md-6">
                <Campo etiqueta="Medio de pago" error={errores.medioPago}>
                  <select className="select-dark w-100" value={form.medioPago} onChange={actualizar('medioPago')}>
                    {MEDIOS_PAGO.map((medio) => (
                      <option key={medio} value={medio}>
                        {medio}
                      </option>
                    ))}
                  </select>
                </Campo>
              </div>
              <div className="col-12 col-md-6">
                <Campo etiqueta="Factura (opcional)" error={errores.factura}>
                  <input type="text" maxLength={40} className="form-control form-control-dark" value={form.factura} onChange={actualizar('factura')} />
                </Campo>
              </div>
            </>
          )}

          <div className="col-12">
            <Campo etiqueta="Observaciones" error={errores.observaciones}>
              <textarea rows={2} maxLength={250} className="form-control form-control-dark" value={form.observaciones} onChange={actualizar('observaciones')} />
            </Campo>
          </div>

          <div className="col-12">
            <div className="alert alert-info py-2 mb-0 fs-8">
              El vehículo volverá a <b>Operativo</b>
              {orden.planId ? ' y el plan reiniciará su contador desde este servicio' : ''}.
              {costo > 0
                ? ` Se registrará un egreso de ${formatCOP(costo)} en Finanzas ("Mantenimiento ${orden.tipo}").`
                : ' Sin costo, no se registra nada en Finanzas.'}
            </div>
          </div>
        </div>
      )}
    </ModalForm>
  );
}
