/**
 * conductorService — Repositorio de conductores (personal operativo).
 *
 * Patrón Repository + Adapter: persiste en la API de iQFleet
 * (GET/POST/PUT/DELETE /api/conductores). La API pública (listConductores /
 * createConductor / updateConductor / removeConductor / subscribeConductores)
 * es el contrato que consumen las vistas; todas las operaciones son asíncronas.
 */

import { api } from './apiClient';

export const CONDUCTOR_ESTADOS = {
  ACTIVO: 'Activo',
  EN_RELEVO: 'En relevo',
  INACTIVO: 'Inactivo',
};

export const CONDUCTOR_ESTADO_LIST = Object.values(CONDUCTOR_ESTADOS);

export const conductorEstadoVariant = {
  [CONDUCTOR_ESTADOS.ACTIVO]: 'success',
  [CONDUCTOR_ESTADOS.EN_RELEVO]: 'warning',
  [CONDUCTOR_ESTADOS.INACTIVO]: 'secondary',
};

export const LICENCIA_CATEGORIAS = ['A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'];

const ENDPOINT = '/api/conductores';
const CHANGED_EVENT = 'iqfleet:conductores-changed';

function notifyChanged() {
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
}

// ---------------------------------------------------------------
// Validación de dominio (previa al envío; la API vuelve a validar)
// ---------------------------------------------------------------
export function validateConductor(dto, { conductores = [], ignoreId = null } = {}) {
  const errores = {};

  if (!String(dto.nombre ?? '').trim()) errores.nombre = 'El nombre es obligatorio.';

  const cedula = String(dto.cedula ?? '').trim();
  if (!cedula) errores.cedula = 'La cédula es obligatoria.';
  else if (!/^\d{6,12}$/.test(cedula)) errores.cedula = 'La cédula debe tener entre 6 y 12 dígitos.';
  else if (conductores.some((conductor) => conductor.id !== ignoreId && conductor.cedula === cedula)) {
    errores.cedula = 'Ya existe un conductor con esa cédula.';
  }

  const telefono = String(dto.telefono ?? '').trim();
  if (telefono && !/^\d{7,15}$/.test(telefono)) errores.telefono = 'Teléfono inválido (7 a 15 dígitos).';

  if (!dto.licenciaVence) errores.licenciaVence = 'La fecha de vencimiento es obligatoria.';

  if (dto.estado && !CONDUCTOR_ESTADO_LIST.includes(dto.estado)) {
    errores.estado = 'Estado inválido.';
  }

  return errores;
}

// ---------------------------------------------------------------
// API pública (CRUD)
// ---------------------------------------------------------------
export function listConductores() {
  return api.get(ENDPOINT);
}

export function getConductor(id) {
  return api.get(`${ENDPOINT}/${encodeURIComponent(id)}`);
}

export async function createConductor(dto) {
  const conductor = await api.post(ENDPOINT, dto);
  notifyChanged();
  return conductor;
}

export async function updateConductor(id, dto) {
  const conductor = await api.put(`${ENDPOINT}/${encodeURIComponent(id)}`, dto);
  notifyChanged();
  // Los vehículos muestran el nombre del conductor asignado.
  window.dispatchEvent(new CustomEvent('iqfleet:vehiculos-changed'));
  return conductor;
}

export async function removeConductor(id) {
  await api.delete(`${ENDPOINT}/${encodeURIComponent(id)}`);
  notifyChanged();
  // Sus vehículos quedan "Sin asignar" en la API.
  window.dispatchEvent(new CustomEvent('iqfleet:vehiculos-changed'));
  return true;
}

/**
 * Observer: consulta la API al suscribir y cada vez que una vista de esta
 * pestaña crea, edita o elimina un conductor. Devuelve la función de limpieza.
 */
export function subscribeConductores(callback, onError) {
  let activo = true;
  const refrescar = () =>
    listConductores()
      .then((data) => activo && callback(data))
      .catch((error) => activo && onError?.(error));

  window.addEventListener(CHANGED_EVENT, refrescar);
  refrescar();

  return () => {
    activo = false;
    window.removeEventListener(CHANGED_EVENT, refrescar);
  };
}
