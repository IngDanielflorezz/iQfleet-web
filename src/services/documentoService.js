/**
 * documentoService — Repositorio de documentos legales (RUNT / CDA).
 *
 * Patrón Repository + Adapter: persiste en la API de iQFleet
 * (GET/POST/PUT/DELETE /api/documentos y POST /api/documentos/sincronizar-runt).
 * La API pública (listDocumentos / createDocumento / updateDocumento /
 * removeDocumento / syncRunt / subscribeDocumentos) es el contrato que consumen
 * las vistas; todas las operaciones son asíncronas.
 *
 * Archivos: la API guarda solo los metadatos (nombre y tipo). El contenido
 * (Data URL) vive en memoria durante la sesión para poder descargarlo, hasta
 * que se integre un almacenamiento real (Supabase Storage).
 */

import { api } from './apiClient';

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

export const MAX_ARCHIVO_BYTES = 2 * 1024 * 1024; // 2 MB

const ENDPOINT = '/api/documentos';
const CHANGED_EVENT = 'iqfleet:documentos-changed';

// Contenido de los archivos adjuntos en esta sesión (no persiste tras recargar)
const archivosEnMemoria = new Map();

function notifyChanged() {
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

/** Cuerpo para la API con los mismos nombres de campo que el formulario. */
function toRequest(dto, file) {
  return {
    tipo: dto.tipo,
    numero: dto.numero,
    entidad: dto.entidad,
    placa: dto.placa,
    conductor: dto.conductor,
    expedicion: dto.expedicion,
    vencimiento: dto.vencimiento,
    estadoRunt: dto.estadoRunt,
    archivoNombre: file?.name ?? dto.archivoNombre ?? '',
    archivoTipo: file?.type ?? dto.archivoTipo ?? '',
  };
}

async function guardarEnMemoria(id, file) {
  if (!file) return null;
  const archivo = { dataUrl: await readFileAsDataURL(file), nombre: file.name, tipo: file.type };
  archivosEnMemoria.set(id, archivo);
  return archivo;
}

/**
 * Valida el archivo adjunto. File opcional: null => sin archivo.
 */
export function validateArchivo(file) {
  if (!file) return null;
  if (file.size > MAX_ARCHIVO_BYTES) {
    return `El archivo supera el máximo de ${MAX_ARCHIVO_BYTES / (1024 * 1024)} MB.`;
  }
  const permitido = ['image/png', 'image/jpeg', 'application/pdf'];
  if (!permitido.includes(file.type)) return 'Formato no permitido (usa PNG, JPG o PDF).';
  return null;
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
  const documento = await api.post(ENDPOINT, toRequest(dto, file));
  await guardarEnMemoria(documento.id, file);
  notifyChanged();
  return documento;
}

export async function updateDocumento(id, dto, { file } = {}) {
  const documento = await api.put(`${ENDPOINT}/${encodeURIComponent(id)}`, toRequest(dto, file));
  await guardarEnMemoria(documento.id, file);
  notifyChanged();
  return documento;
}

export async function removeDocumento(id) {
  await api.delete(`${ENDPOINT}/${encodeURIComponent(id)}`);
  archivosEnMemoria.delete(id);
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
export async function attachArchivo(documento, file) {
  const errorArchivo = validateArchivo(file);
  if (errorArchivo) throw new Error(errorArchivo);
  return updateDocumento(documento.id, documento, { file });
}

export function getArchivo(id) {
  return archivosEnMemoria.get(id) ?? null;
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
