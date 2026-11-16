/**
 * finanzaService — Repositorio de movimientos financieros (ingresos/egresos).
 *
 * Patrón Repository + Adapter: persiste en la API de iQFleet
 * (GET/POST/PUT/DELETE /api/movimientos). La API pública (listMovimientos /
 * createMovimiento / updateMovimiento / removeMovimiento / subscribeMovimientos)
 * es el contrato que consumen las vistas; todas las operaciones son asíncronas.
 *
 * Del comprobante solo se registran los metadatos (nombre y tipo del archivo):
 * la API todavía no almacena el archivo.
 */

import { api } from './apiClient';

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

export const MAX_ARCHIVO_BYTES = 2 * 1024 * 1024; // 2 MB

const ENDPOINT = '/api/movimientos';
const CHANGED_EVENT = 'iqfleet:movimientos-changed';

function notifyChanged() {
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
}

/** Cuerpo para la API: números reales y km vacío como null (el formulario trabaja con strings). */
function toRequest(dto, file) {
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
    comprobanteNombre: file?.name ?? dto.comprobanteNombre ?? '',
    comprobanteTipo: file?.type ?? dto.comprobanteTipo ?? '',
  };
}

export function validateComprobante(file) {
  if (!file) return null;
  if (file.size > MAX_ARCHIVO_BYTES) return `El archivo supera el máximo de ${MAX_ARCHIVO_BYTES / (1024 * 1024)} MB.`;
  const permitido = ['image/png', 'image/jpeg', 'application/pdf'];
  if (!permitido.includes(file.type)) return 'Formato no permitido (usa PNG, JPG o PDF).';
  return null;
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
  const movimiento = await api.post(ENDPOINT, toRequest(dto, file));
  notifyChanged();
  return movimiento;
}

export async function updateMovimiento(id, dto, { file } = {}) {
  const movimiento = await api.put(`${ENDPOINT}/${encodeURIComponent(id)}`, toRequest(dto, file));
  notifyChanged();
  return movimiento;
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
