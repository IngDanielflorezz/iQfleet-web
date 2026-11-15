/**
 * apiClient — Cliente HTTP único hacia la API de iQFleet (C# Minimal API, carpeta api/).
 *
 * Toma la URL y el token de .env.local (VITE_API_URL / VITE_API_TOKEN), envía
 * JSON y traduce los errores de la API (ProblemDetails) a un ApiError con
 * `fields` = { campo: 'mensaje' }, el mismo formato que pintan los formularios.
 */

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/+$/, '');
const API_TOKEN = import.meta.env.VITE_API_TOKEN ?? '';

export class ApiError extends Error {
  constructor(message, { status = 0, fields = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields;
  }
}

function toFields(errors) {
  if (!errors || typeof errors !== 'object') return null;
  return Object.fromEntries(
    Object.entries(errors).map(([campo, mensajes]) => [campo, Array.isArray(mensajes) ? mensajes[0] : String(mensajes)]),
  );
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' };
  if (API_TOKEN) headers.Authorization = `Bearer ${API_TOKEN}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(`No se pudo conectar con la API (${API_URL}). ¿Está encendida?`);
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const mensaje = data?.detail ?? data?.title ?? `Error ${response.status} en la API`;
    throw new ApiError(mensaje, { status: response.status, fields: toFields(data?.errors) });
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
