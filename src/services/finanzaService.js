/**
 * finanzaService — Repositorio de movimientos financieros (ingresos/egresos).
 *
 * Patrón Repository + Adapter: persiste en la API de iQFleet
 * (GET/POST/PUT/DELETE /api/movimientos). La API pública (listMovimientos /
 * createMovimiento / updateMovimiento / removeMovimiento / subscribeMovimientos)
 * es el contrato que consumen las vistas; todas las operaciones son asíncronas.
 *
 * Comprobantes: se suben a la API (PUT /api/movimientos/{id}/comprobante),
 * que los guarda en Supabase Storage; se descargan con una URL firmada.
 */

import { api } from './apiClient';
import { ArchivoNoSubidoError, MAX_ARCHIVO_BYTES, toArchivoRequest, validarArchivo } from '../utils/archivos';

export { MAX_ARCHIVO_BYTES };

export const MOVIMIENTO_TIPOS = {
  INGRESO: 'Ingreso',
  EGRESO: 'Egreso',
};

export const CONCEPTOS_INGRESO = ['Flete / Flete Intermunicipal', 'Servicio Especial', 'Ajuste a favor'];
export const CONCEPTOS_EGRESO = [
  'Combustible ACPM',
  'Peajes',
  'Mantenimiento Correctivo',
  'Mantenimiento Preventivo',
  'Nómina Operativa',
  'Seguros',
  'Otros gastos',
];

export const MEDIOS_PAGO = ['Transferencia', 'Efectivo', 'Tarjeta', 'Crédito'];

const ENDPOINT = '/api/movimientos';
const CHANGED_EVENT = 'iqfleet:movimientos-changed';

function notifyChanged() {
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
}

/** Para otros módulos que cambian estos datos en la API (p. ej. al cerrar una orden de mantenimiento). */
export { notifyChanged as notifyMovimientosChanged };

/** Cuerpo para la API: números reales y km vacío como null (el formulario trabaja con strings). */
function toRequest(dto) {
  const km = dto.km === '' || dto.km === null || dto.km === undefined ? null : Number(dto.km);
  return {
    tipo: dto.tipo,
    concepto: dto.concepto,
    placa: dto.placa,
    conductor: dto.conductor,
    factura: dto.factura,
    medioPago: dto.medioPago,
    monto: Number(dto.monto),
    km,
    fecha: dto.fecha,
  };
}

/** Sube el comprobante de un movimiento recién guardado; si falla, el movimiento ya existe. */
async function subirSiHayComprobante(movimiento, file) {
  if (!file) return movimiento;
  try {
    return await api.put(`${ENDPOINT}/${encodeURIComponent(movimiento.id)}/comprobante`, await toArchivoRequest(file));
  } catch (error) {
    throw new ArchivoNoSubidoError(movimiento, error);
  }
}

export function validateComprobante(file) {
  return validarArchivo(file);
}

// ---------------------------------------------------------------
// Validación de dominio
// ---------------------------------------------------------------
export function validateMovimiento(dto) {
  const errores = {};

  if (!String(dto.concepto ?? '').trim()) errores.concepto = 'El concepto es obligatorio.';
  if (!dto.fecha) errores.fecha = 'La fecha es obligatoria.';

  const monto = Number(dto.monto);
  if (!Number.isFinite(monto) || monto <= 0) errores.monto = 'El monto debe ser mayor a 0.';

  if (dto.km !== '' && dto.km !== null && dto.km !== undefined) {
    const km = Number(dto.km);
    if (!Number.isFinite(km) || km < 0) errores.km = 'El kilometraje no puede ser negativo.';
  }

  return errores;
}

// ---------------------------------------------------------------
// API pública (CRUD)
// ---------------------------------------------------------------
export function listMovimientos() {
  return api.get(ENDPOINT);
}

export async function createMovimiento(dto, { file } = {}) {
  const movimiento = await api.post(ENDPOINT, toRequest(dto));
  try {
    return await subirSiHayComprobante(movimiento, file);
  } finally {
    notifyChanged();
  }
}

export async function updateMovimiento(id, dto, { file } = {}) {
  const movimiento = await api.put(`${ENDPOINT}/${encodeURIComponent(id)}`, toRequest(dto));
  try {
    return await subirSiHayComprobante(movimiento, file);
  } finally {
    notifyChanged();
  }
}

/** URL firmada (caduca en 5 min) para descargar el comprobante: { url, nombre, tipo }. */
export function getComprobanteUrl(id) {
  return api.get(`${ENDPOINT}/${encodeURIComponent(id)}/comprobante`);
}

export async function removeMovimiento(id) {
  await api.delete(`${ENDPOINT}/${encodeURIComponent(id)}`);
  notifyChanged();
  return true;
}

/**
 * Observer: consulta la API al suscribir y cada vez que una vista de esta
 * pestaña crea, edita o elimina un movimiento. Devuelve la función de limpieza.
 */
export function subscribeMovimientos(callback, onError) {
  let activo = true;
  const refrescar = () =>
    listMovimientos()
      .then((data) => activo && callback(data))
      .catch((error) => activo && onError?.(error));

  window.addEventListener(CHANGED_EVENT, refrescar);
  refrescar();

  return () => {
    activo = false;
    window.removeEventListener(CHANGED_EVENT, refrescar);
  };
}
