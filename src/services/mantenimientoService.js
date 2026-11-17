/**
 * mantenimientoService — Planes y órdenes de mantenimiento (API /api/mantenimiento).
 *
 * Abrir, cerrar o anular una orden también cambia el vehículo (estado y km) y, al
 * cerrar con costo, crea un egreso en Finanzas: por eso se avisa a esos módulos.
 */
import { api } from './apiClient';
import { notifyVehiculosChanged } from './vehiculoService';
import { notifyMovimientosChanged } from './finanzaService';

export const TIPOS_MANTENIMIENTO = ['Preventivo', 'Correctivo'];
export const ESTADOS_ORDEN = { ABIERTA: 'Abierta', CERRADA: 'Cerrada' };
export const TAREAS_SUGERIDAS = [
  'Cambio de aceite y filtros',
  'Revisión de frenos',
  'Alineación y balanceo',
  'Cambio de llantas',
  'Revisión de suspensión',
  'Sincronización',
];

const ENDPOINT = '/api/mantenimiento';
const CHANGED_EVENT = 'iqfleet:mantenimiento-changed';

function notifyChanged() {
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
}

const enteroONull = (valor) => (valor === '' || valor === null || valor === undefined ? null : Number(valor));

// ---------------------------------------------------------------- planes --
export function validatePlan(dto) {
  const errores = {};
  if (!dto.placa) errores.placa = 'Selecciona un vehículo.';
  if (!String(dto.tarea ?? '').trim()) errores.tarea = 'La tarea es obligatoria.';
  const cadaKm = enteroONull(dto.cadaKm);
  const cadaDias = enteroONull(dto.cadaDias);
  if (cadaKm === null && cadaDias === null) errores.cadaKm = 'Indica cada cuántos km, cada cuántos días o ambos.';
  if (cadaKm !== null && !(cadaKm > 0)) errores.cadaKm = 'Debe ser mayor a 0.';
  if (cadaDias !== null && !(cadaDias > 0)) errores.cadaDias = 'Debe ser mayor a 0.';
  const ultimoKm = enteroONull(dto.ultimoKm);
  if (ultimoKm !== null && !(ultimoKm >= 0)) errores.ultimoKm = 'No puede ser negativo.';
  return errores;
}

function toPlanRequest(dto) {
  return {
    placa: dto.placa,
    tarea: String(dto.tarea ?? '').trim(),
    cadaKm: enteroONull(dto.cadaKm),
    cadaDias: enteroONull(dto.cadaDias),
    ultimoKm: enteroONull(dto.ultimoKm),
    ultimaFecha: dto.ultimaFecha || null,
  };
}

export const listPlanes = () => api.get(`${ENDPOINT}/planes`);

export async function createPlan(dto) {
  const plan = await api.post(`${ENDPOINT}/planes`, toPlanRequest(dto));
  notifyChanged();
  return plan;
}

export async function updatePlan(id, dto) {
  const plan = await api.put(`${ENDPOINT}/planes/${encodeURIComponent(id)}`, toPlanRequest(dto));
  notifyChanged();
  return plan;
}

export async function removePlan(id) {
  await api.delete(`${ENDPOINT}/planes/${encodeURIComponent(id)}`);
  notifyChanged();
  return true;
}

// --------------------------------------------------------------- órdenes --
export const listOrdenes = () => api.get(`${ENDPOINT}/ordenes`);

export async function abrirOrden(dto) {
  const orden = await api.post(`${ENDPOINT}/ordenes`, {
    placa: dto.placa,
    tipo: dto.tipo,
    planId: dto.planId || null,
    descripcion: dto.descripcion,
    fechaApertura: dto.fechaApertura || null,
    observaciones: dto.observaciones,
  });
  notifyChanged();
  notifyVehiculosChanged();
  return orden;
}

export async function cerrarOrden(id, dto) {
  const orden = await api.post(`${ENDPOINT}/ordenes/${encodeURIComponent(id)}/cerrar`, {
    fechaCierre: dto.fechaCierre || null,
    kmCierre: enteroONull(dto.kmCierre),
    costo: enteroONull(dto.costo) ?? 0,
    taller: dto.taller,
    medioPago: dto.medioPago,
    factura: dto.factura,
    observaciones: dto.observaciones,
  });
  notifyChanged();
  notifyVehiculosChanged();
  if (orden.movimientoId) notifyMovimientosChanged();
  return orden;
}

export async function anularOrden(id) {
  await api.delete(`${ENDPOINT}/ordenes/${encodeURIComponent(id)}`);
  notifyChanged();
  notifyVehiculosChanged();
  return true;
}

/** Consulta planes y órdenes al suscribir y ante cada cambio de esta pestaña. */
export function subscribeMantenimiento(callback, onError) {
  let activo = true;
  const refrescar = () =>
    Promise.all([listPlanes(), listOrdenes()])
      .then(([planes, ordenes]) => activo && callback({ planes, ordenes }))
      .catch((error) => activo && onError?.(error));

  window.addEventListener(CHANGED_EVENT, refrescar);
  refrescar();
  return () => {
    activo = false;
    window.removeEventListener(CHANGED_EVENT, refrescar);
  };
}
