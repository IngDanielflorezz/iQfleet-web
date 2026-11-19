/**
 * apiClient — Cliente HTTP único hacia la API de iQFleet (C# Minimal API, carpeta api/).
 *
 * Toma la URL de .env.local (VITE_API_URL) y el JWT de la sesión iniciada, envía
 * JSON y traduce los errores de la API (ProblemDetails) a un ApiError con
 * `fields` = { campo: 'mensaje' }, el mismo formato que pintan los formularios.
 */
import { getToken, clearSession } from './authService';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/+$/, '');

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
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
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

  // Sesión vencida o inválida: se cierra y se vuelve al login.
  if (response.status === 401 && token) {
    clearSession();
    window.location.assign('/login');
    throw new ApiError('Tu sesión expiró. Inicia sesión de nuevo.', { status: 401 });
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    // El 403 de la autorización por rol llega sin detalle (solo el título "Forbidden").
    const mensaje = data?.detail
      ?? (response.status === 403 ? 'No tienes permiso para esta acción.' : data?.title ?? `Error ${response.status} en la API`);
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
