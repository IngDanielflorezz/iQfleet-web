/**
 * vehiculoService — Repositorio de la flota (parque automotor).
 *
 * Patrón Repository + Adapter: persiste en la API de iQFleet
 * (GET/POST/PUT/DELETE /api/vehiculos). La API pública (listVehiculos /
 * createVehiculo / updateVehiculo / removeVehiculo / subscribeVehiculos) es el
 * contrato que consumen las vistas; todas las operaciones son asíncronas.
 */

import { api } from './apiClient';

export const VEHICULO_ESTADOS = {
  OPERATIVO: 'Operativo',
  MANTENIMIENTO: 'Mantenimiento',
  FUERA_DE_SERVICIO: 'Fuera de servicio',
};

export const VEHICULO_ESTADO_LIST = Object.values(VEHICULO_ESTADOS);

export const estadoVehiculoVariants = {
  [VEHICULO_ESTADOS.OPERATIVO]: 'success',
  [VEHICULO_ESTADOS.MANTENIMIENTO]: 'warning',
  [VEHICULO_ESTADOS.FUERA_DE_SERVICIO]: 'danger',
};

export const VEHICULO_TIPOS = ['Bus', 'Buseta', 'Bus Intermunicipal', 'Bus Padrón', 'Camión', 'Van', 'Camioneta'];

export const VEHICULO_CIUDADES = ['BOGOTA D.C.', 'VALLEDUPAR', 'BARRANQUILLA', 'MEDELLÍN', 'CALI', 'SANTA MARTA'];

const ENDPOINT = '/api/vehiculos';
const CHANGED_EVENT = 'iqfleet:vehiculos-changed';

function notifyChanged() {
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
}

// ---------------------------------------------------------------
// Validación de dominio (previa al envío; la API vuelve a validar)
// ---------------------------------------------------------------
export function validateVehiculo(dto, { vehiculos = [], ignoreId = null } = {}) {
  const errores = {};
  const placa = String(dto.id ?? '').trim().toUpperCase();

  if (!placa) errores.id = 'La placa es obligatoria.';
  else if (!/^[A-Z0-9]{3}-?[A-Z0-9]{2,3}$/.test(placa)) errores.id = 'Formato de placa inválido (ej. UVP-123).';
  else if (vehiculos.some((vehiculo) => vehiculo.id !== ignoreId && vehiculo.id === placa)) {
    errores.id = 'Ya existe un vehículo con esa placa.';
  }

  if (!String(dto.marca ?? '').trim()) errores.marca = 'La marca es obligatoria.';
  if (!String(dto.modelo ?? '').trim()) errores.modelo = 'El modelo es obligatorio.';
  if (!dto.ciudad) errores.ciudad = 'La ciudad es obligatoria.';

  const anio = Number(dto.anio);
  const anioActual = new Date().getFullYear();
  if (!Number.isInteger(anio) || anio < 1980 || anio > anioActual + 1) {
    errores.anio = `Año inválido (entre 1980 y ${anioActual + 1}).`;
  }

  if (Number(dto.kilometraje) < 0) errores.kilometraje = 'El kilometraje no puede ser negativo.';
  if (!dto.soatVence) errores.soatVence = 'La fecha de SOAT es obligatoria.';
  if (!dto.rtmVence) errores.rtmVence = 'La fecha de RTM es obligatoria.';

  return errores;
}

// ---------------------------------------------------------------
// API pública (CRUD)
// ---------------------------------------------------------------
export function listVehiculos() {
  return api.get(ENDPOINT);
}

export function getVehiculo(id) {
  return api.get(`${ENDPOINT}/${encodeURIComponent(id)}`);
}

export async function createVehiculo(dto) {
  const vehiculo = await api.post(ENDPOINT, dto);
  notifyChanged();
  return vehiculo;
}

export async function updateVehiculo(id, dto) {
  const vehiculo = await api.put(`${ENDPOINT}/${encodeURIComponent(id)}`, dto);
  notifyChanged();
  return vehiculo;
}

export async function removeVehiculo(id) {
  await api.delete(`${ENDPOINT}/${encodeURIComponent(id)}`);
  notifyChanged();
  return true;
}

/**
 * Observer: consulta la API al suscribir y cada vez que una vista de esta
 * pestaña crea, edita o elimina un vehículo. Devuelve la función de limpieza.
 */
export function subscribeVehiculos(callback, onError) {
  let activo = true;
  const refrescar = () =>
    listVehiculos()
      .then((data) => activo && callback(data))
      .catch((error) => activo && onError?.(error));

  window.addEventListener(CHANGED_EVENT, refrescar);
  refrescar();

  return () => {
    activo = false;
    window.removeEventListener(CHANGED_EVENT, refrescar);
  };
}
