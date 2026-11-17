/**
 * despachoService — Repositorio de despachos (fletes) operativos.
 *
 * Patrón Repository + Adapter: persiste en la API de iQFleet
 * (GET/POST/PUT/DELETE /api/despachos). La API pública (listDespachos /
 * createDespacho / updateDespacho / removeDespacho / subscribeDespachos) es el
 * contrato que consumen las vistas; todas las operaciones son asíncronas.
 */

import { api } from './apiClient';

export const DESPACHO_ESTADOS = {
  PROGRAMADO: 'Programado',
  EN_RUTA: 'En ruta',
  COMPLETADO: 'Completado',
  CANCELADO: 'Cancelado',
};

export const DESPACHO_ESTADO_LIST = Object.values(DESPACHO_ESTADOS);

export const DESPACHO_ESTADOS_ACTIVOS = [DESPACHO_ESTADOS.PROGRAMADO, DESPACHO_ESTADOS.EN_RUTA];

export const despachoEstadoVariant = {
  [DESPACHO_ESTADOS.PROGRAMADO]: 'info',
  [DESPACHO_ESTADOS.EN_RUTA]: 'warning',
  [DESPACHO_ESTADOS.COMPLETADO]: 'success',
  [DESPACHO_ESTADOS.CANCELADO]: 'danger',
};

const ENDPOINT = '/api/despachos';
const CHANGED_EVENT = 'iqfleet:despachos-changed';

function notifyChanged() {
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
}

/** Código corto y legible para la UI: la API identifica los despachos con un GUID. */
export function codigoDespacho(despacho) {
  return `DSP-${String(despacho?.id ?? '').slice(0, 8).toUpperCase()}`;
}

// ---------------------------------------------------------------
// Validación de dominio (previa al envío; la API vuelve a validar,
// incluido que la placa exista y que no choque con otro despacho activo)
// ---------------------------------------------------------------
export function validateDespacho(dto, { despachos = [], ignoreId = null } = {}) {
  const errores = {};

  if (!dto.placa) errores.placa = 'Selecciona un vehículo.';
  if (!String(dto.conductor ?? '').trim()) errores.conductor = 'El conductor es obligatorio.';
  if (!String(dto.origen ?? '').trim()) errores.origen = 'El origen es obligatorio.';
  if (!String(dto.destino ?? '').trim()) errores.destino = 'El destino es obligatorio.';
  if (!dto.fechaSalida) errores.fechaSalida = 'La fecha de salida es obligatoria.';
  if (Number(dto.valorFlete) < 0) errores.valorFlete = 'El flete no puede ser negativo.';
  if (Number(dto.costoOperativo) < 0) errores.costoOperativo = 'El costo no puede ser negativo.';
  if (String(dto.observaciones ?? '').trim().length > 250) errores.observaciones = 'Máximo 250 caracteres.';

  const estado = dto.estado ?? DESPACHO_ESTADOS.PROGRAMADO;
  const esActivo = DESPACHO_ESTADOS_ACTIVOS.includes(estado);

  if (!errores.placa && !errores.fechaSalida && esActivo) {
    const dia = String(dto.fechaSalida).slice(0, 10);
    const choque = despachos.find(
      (despacho) =>
        despacho.id !== ignoreId &&
        despacho.placa === String(dto.placa).trim().toUpperCase() &&
        String(despacho.fechaSalida).slice(0, 10) === dia &&
        DESPACHO_ESTADOS_ACTIVOS.includes(despacho.estado),
    );
    if (choque) {
      errores.placa = `El vehículo ${dto.placa} ya tiene un despacho activo ese día.`;
    }
  }

  return errores;
}

// ---------------------------------------------------------------
// API pública (CRUD)
// ---------------------------------------------------------------
export function listDespachos() {
  return api.get(ENDPOINT);
}

export function getDespacho(id) {
  return api.get(`${ENDPOINT}/${encodeURIComponent(id)}`);
}

export async function createDespacho(dto) {
  const despacho = await api.post(ENDPOINT, dto);
  notifyChanged();
  return despacho;
}

export async function updateDespacho(id, dto) {
  const despacho = await api.put(`${ENDPOINT}/${encodeURIComponent(id)}`, dto);
  notifyChanged();
  return despacho;
}

export async function removeDespacho(id) {
  await api.delete(`${ENDPOINT}/${encodeURIComponent(id)}`);
  notifyChanged();
  return true;
}

/**
 * Observer: consulta la API al suscribir y cada vez que una vista de esta
 * pestaña crea, edita o elimina un despacho. Devuelve la función de limpieza.
 */
export function subscribeDespachos(callback, onError) {
  let activo = true;
  const refrescar = () =>
    listDespachos()
      .then((data) => activo && callback(data))
      .catch((error) => activo && onError?.(error));

  window.addEventListener(CHANGED_EVENT, refrescar);
  refrescar();

  return () => {
    activo = false;
    window.removeEventListener(CHANGED_EVENT, refrescar);
  };
}

/**
 * Nombres para el autocompletado del modal: conductores registrados,
 * los asignados a vehículos y los que ya aparecen en despachos.
 */
export function getConductoresConocidos({ conductores = [], flota = [], despachos = [] } = {}) {
  const nombres = new Set();
  conductores.forEach((conductor) => conductor.nombre && nombres.add(conductor.nombre));
  flota.forEach((vehiculo) => {
    if (vehiculo.conductor && vehiculo.conductor !== 'Sin asignar') nombres.add(vehiculo.conductor);
  });
  despachos.forEach((despacho) => despacho.conductor && nombres.add(despacho.conductor));
  return [...nombres].sort((a, b) => a.localeCompare(b, 'es'));
}
