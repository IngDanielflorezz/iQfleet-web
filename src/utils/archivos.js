/**
 * Utilidades de archivos adjuntos (comprobantes y soportes de documentos).
 *
 * El cliente de la API solo envía JSON, así que el archivo viaja como Data URL
 * (base64) dentro del cuerpo; la API lo guarda en Supabase Storage.
 */

export const TIPOS_ARCHIVO_PERMITIDOS = ['image/png', 'image/jpeg', 'application/pdf'];
export const MAX_ARCHIVO_BYTES = 2 * 1024 * 1024; // 2 MB, igual que la API

export function validarArchivo(file) {
  if (!file) return null;
  if (file.size > MAX_ARCHIVO_BYTES) return `El archivo supera el máximo de ${MAX_ARCHIVO_BYTES / (1024 * 1024)} MB.`;
  if (!TIPOS_ARCHIVO_PERMITIDOS.includes(file.type)) return 'Formato no permitido (usa PNG, JPG o PDF).';
  return null;
}

function leerComoDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

/** Cuerpo { nombre, tipo, contenidoBase64 } que esperan los endpoints de archivos de la API. */
export async function toArchivoRequest(file) {
  return { nombre: file.name, tipo: file.type, contenidoBase64: await leerComoDataUrl(file) };
}

/**
 * Descarga desde una URL firmada. La API la genera con "download=", así que el
 * navegador descarga el archivo sin salir de la página (y sin bloqueo de pop-ups).
 */
export function descargarDesdeUrl(url) {
  window.location.assign(url);
}

/**
 * Error de subida tras guardar el registro: el registro sí quedó en la API.
 * Las vistas lo usan para cerrar el formulario y avisar, en lugar de reintentar
 * el guardado completo (que duplicaría el registro).
 */
export class ArchivoNoSubidoError extends Error {
  constructor(registro, causa) {
    super(`Se guardó el registro, pero no el archivo: ${causa.message}`);
    this.name = 'ArchivoNoSubidoError';
    this.registro = registro;
  }
}
