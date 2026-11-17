import { useState } from 'react';
import { TAREAS_SUGERIDAS, validatePlan } from '../../../../services/mantenimientoService';
import ModalForm, { Campo } from './ModalForm';

const texto = (valor) => (valor === null || valor === undefined ? '' : String(valor));

export default function PlanModal({ plan, vehiculos, placaInicial = '', onGuardar, onClose }) {
  const [form, setForm] = useState(() => ({
    placa: plan?.placa ?? placaInicial,
    tarea: plan?.tarea ?? '',
    cadaKm: texto(plan?.cadaKm),
    cadaDias: texto(plan?.cadaDias),
    ultimoKm: texto(plan?.ultimoKm),
    ultimaFecha: plan?.ultimaFecha ?? '',
  }));
  const actualizar = (campo) => (event) => setForm((previo) => ({ ...previo, [campo]: event.target.value }));
  const vehiculo = vehiculos.find((item) => item.id === form.placa);

  return (
    <ModalForm
      titulo={plan ? 'Editar plan de mantenimiento' : 'Nuevo plan de mantenimiento'}
      textoEnviar={plan ? 'Guardar cambios' : 'Crear plan'}
      validar={() => validatePlan(form)}
      onSubmit={() => onGuardar(form, plan?.id)}
      onClose={onClose}
    >
      {(errores) => (
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <Campo etiqueta="Vehículo" error={errores.placa}>
              <select className="select-dark w-100" value={form.placa} onChange={actualizar('placa')} disabled={Boolean(plan)}>
                <option value="">Selecciona un vehículo...</option>
                {vehiculos.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.id} · {item.marca} {item.modelo}
                  </option>
                ))}
              </select>
            </Campo>
          </div>
          <div className="col-12 col-md-6">
            <Campo etiqueta="Tarea" error={errores.tarea}>
              <input
                type="text"
                className="form-control form-control-dark"
                list="tareas-mantenimiento"
                maxLength={60}
                placeholder="Ej. Cambio de aceite y filtros"
                value={form.tarea}
                onChange={actualizar('tarea')}
              />
              <datalist id="tareas-mantenimiento">
                {TAREAS_SUGERIDAS.map((tarea) => (
                  <option key={tarea} value={tarea} />
                ))}
              </datalist>
            </Campo>
          </div>

          <div className="col-12 col-md-6">
            <Campo etiqueta="Cada (km)" error={errores.cadaKm} ayuda="Deja vacío si solo va por tiempo.">
              <input type="number" min="1" step="500" className="form-control form-control-dark" placeholder="10000" value={form.cadaKm} onChange={actualizar('cadaKm')} />
            </Campo>
          </div>
          <div className="col-12 col-md-6">
            <Campo etiqueta="Cada (días)" error={errores.cadaDias} ayuda="Deja vacío si solo va por kilometraje.">
              <input type="number" min="1" step="1" className="form-control form-control-dark" placeholder="180" value={form.cadaDias} onChange={actualizar('cadaDias')} />
            </Campo>
          </div>

          <div className="col-12 col-md-6">
            <Campo
              etiqueta="Km del último servicio"
              error={errores.ultimoKm}
              ayuda={vehiculo ? `Odómetro actual: ${vehiculo.kilometraje.toLocaleString('es-CO')} km` : undefined}
            >
              <input type="number" min="0" step="1" className="form-control form-control-dark" value={form.ultimoKm} onChange={actualizar('ultimoKm')} />
            </Campo>
          </div>
          <div className="col-12 col-md-6">
            <Campo etiqueta="Fecha del último servicio" error={errores.ultimaFecha}>
              <input type="date" className="form-control form-control-dark" value={form.ultimaFecha} onChange={actualizar('ultimaFecha')} />
            </Campo>
          </div>
        </div>
      )}
    </ModalForm>
  );
}
