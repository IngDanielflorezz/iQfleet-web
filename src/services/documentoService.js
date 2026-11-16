/**
 * documentoService — Repositorio de documentos legales (RUNT / CDA).
 *
 * Patrón Repository + Adapter: persiste en la API de iQFleet
 * (GET/POST/PUT/DELETE /api/documentos y POST /api/documentos/sincronizar-runt).
 * La API pública (listDocumentos / createDocumento / updateDocumento /
 * removeDocumento / syncRunt / subscribeDocumentos) es el contrato que consumen
 * las vistas; todas las operaciones son asíncronas.
 *
 * Archivos de soporte: se suben a la API (PUT /api/documentos/{id}/archivo),
 * que los guarda en Supabase Storage; se descargan con una URL firmada.
 */

import { api } from './apiClient';
import { ArchivoNoSubidoError, MAX_ARCHIVO_BYTES, toArchivoRequest, validarArchivo } from '../utils/archivos';

export { MAX_ARCHIVO_BYTES };

export const DOCUMENTO_TIPOS = {
  SOAT: 'SOAT',
  RTM: 'RTM',
  TARJETA_OPERACION: 'Tarjeta de Operación',
  POLIZA: 'Póliza RCC',
};

export const DOCUMENTO_TIPO_LIST = Object.values(DOCUMENTO_TIPOS);

export const DOCUMENTO_ESTADOS_RUNT = {
  PENDIENTE: 'Pendiente',
  SINCRONIZADO: 'Sincronizado',
  ERROR: 'Error de validación',
};

export const DOCUMENTO_ESTADO_RUNT_LIST = Object.values(DOCUMENTO_ESTADOS_RUNT);

export const runtoEstadoVariant = {
  [DOCUMENTO_ESTADOS_RUNT.PENDIENTE]: 'secondary',
  [DOCUMENTO_ESTADOS_RUNT.SINCRONIZADO]: 'success',
  [DOCUMENTO_ESTADOS_RUNT.ERROR]: 'danger',
};

export const DOCUMENTO_ENTIDADES_SUGERIDAS = [
  'Seguros Bolívar S.A.',
  'Sura Seguros',
  'Allianz Colombia',
  'Mapfre',
  'MinTransporte',
  'CDA Bogotá',
];

const ENDPOINT = '/api/documentos';
const CHANGED_EVENT = 'iqfleet:documentos-changed';

function notifyChanged() {
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
}

/** Cuerpo para la API con los mismos nombres de campo que el formulario (el archivo va aparte). */
function toRequest(dto) {
  return {
    tipo: dto.tipo,
    numero: dto.numero,
    entidad: dto.entidad,
    placa: dto.placa,
    conductor: dto.conductor,
    expedicion: dto.expedicion,
    vencimiento: dto.vencimiento,
    estadoRunt: dto.estadoRunt,
  };
}

/** Sube el archivo de un documento recién guardado; si falla, el documento ya existe. */
async function subirSiHayArchivo(documento, file) {
  if (!file) return documento;
  try {
    return await api.put(`${ENDPOINT}/${encodeURIComponent(documento.id)}/archivo`, await toArchivoRequest(file));
  } catch (error) {
    throw new ArchivoNoSubidoError(documento, error);
  }
}

/**
 * Valida el archivo adjunto. File opcional: null => sin archivo.
 */
export function validateArchivo(file) {
  return validarArchivo(file);
}

// ---------------------------------------------------------------
// Validación de dominio
// ---------------------------------------------------------------
export function validateDocumento(dto) {
  const errores = {};

  if (!DOCUMENTO_TIPO_LIST.includes(dto.tipo)) errores.tipo = 'Tipo de documento inválido.';
  if (!String(dto.numero ?? '').trim()) errores.numero = 'El número / póliza es obligatorio.';
  if (!String(dto.entidad ?? '').trim()) errores.entidad = 'La entidad emisora es obligatoria.';
  if (!String(dto.placa ?? '').trim() && !String(dto.conductor ?? '').trim()) {
    errores.placa = 'Asocia el documento a una placa o a un conductor.';
  }
  if (!dto.expedicion) errores.expedicion = 'La fecha de expedición es obligatoria.';
  if (!dto.vencimiento) errores.vencimiento = 'La fecha de vencimiento es obligatoria.';
  else if (dto.expedicion && dto.vencimiento < dto.expedicion) {
    errores.vencimiento = 'El vencimiento no puede ser anterior a la expedición.';
  }

  return errores;
}

// ---------------------------------------------------------------
// API pública (CRUD)
// ---------------------------------------------------------------
export function listDocumentos() {
  return api.get(ENDPOINT);
}

export async function createDocumento(dto, { file } = {}) {
  const documento = await api.post(ENDPOINT, toRequest(dto));
  try {
    return await subirSiHayArchivo(documento, file);
  } finally {
    notifyChanged();
  }
}

export async function updateDocumento(id, dto, { file } = {}) {
  const documento = await api.put(`${ENDPOINT}/${encodeURIComponent(id)}`, toRequest(dto));
  try {
    return await subirSiHayArchivo(documento, file);
  } finally {
    notifyChanged();
  }
}

export async function removeDocumento(id) {
  await api.delete(`${ENDPOINT}/${encodeURIComponent(id)}`);
  notifyChanged();
  return true;
}

/** Marca como sincronizados con el RUNT los documentos indicados (o todos). Simulado en la API. */
export async function syncRunt(ids = null) {
  const documentos = await api.post(`${ENDPOINT}/sincronizar-runt`, { ids });
  notifyChanged();
  return documentos;
}

/** Adjunta (o reemplaza) el archivo de un documento existente. Devuelve el documento actualizado. */
export async function attachArchivo(id, file) {
  const errorArchivo = validarArchivo(file);
  if (errorArchivo) throw new Error(errorArchivo);
  const documento = await api.put(`${ENDPOINT}/${encodeURIComponent(id)}/archivo`, await toArchivoRequest(file));
  notifyChanged();
  return documento;
}

/** URL firmada (caduca en 5 min) para descargar el archivo: { url, nombre, tipo }. */
export function getArchivoUrl(id) {
  return api.get(`${ENDPOINT}/${encodeURIComponent(id)}/archivo`);
}

/**
 * Observer: consulta la API al suscribir y cada vez que una vista de esta
 * pestaña crea, edita o elimina un documento. Devuelve la función de limpieza.
 */
export function subscribeDocumentos(callback, onError) {
  let activo = true;
  const refrescar = () =>
    listDocumentos()
      .then((data) => activo && callback(data))
      .catch((error) => activo && onError?.(error));

  window.addEventListener(CHANGED_EVENT, refrescar);
  refrescar();

  return () => {
    activo = false;
    window.removeEventListener(CHANGED_EVENT, refrescar);
  };
}
