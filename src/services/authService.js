const SESSION_KEY = "iqfleet_session";
const EMPRESAS_CACHE_KEY = "iqfleet_empresas_cache";

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8080").replace(/\/$/, "");
const API_TOKEN = import.meta.env.VITE_API_TOKEN ?? "";

export const ROLES = {
  ADMINISTRADOR: "ADMINISTRADOR",
  CONDUCTOR: "CONDUCTOR",
};

function getHeaders() {
  return {
    "Content-Type": "application/json",
    ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
  };
}

async function parseError(res, fallbackMsg) {
  try {
    const body = await res.json();
    if (body.errors) {
      const firstError = Object.values(body.errors).flat()[0];
      if (firstError) return firstError;
    }
    return body.detail || body.message || body.title || fallbackMsg;
  } catch {
    return fallbackMsg;
  }
}

/**
 * Sincroniza la lista de empresas contratantes desde GET /api/auth/empresas
 */
export async function syncEmpresasFromBackend() {
  try {
    const res = await fetch(`${API_URL}/api/auth/empresas`, {
      method: "GET",
      headers: getHeaders(),
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      const lista = Array.isArray(data)
        ? data.map((item) => (typeof item === "string" ? item : item.empresa ?? item.nombre ?? "")).filter(Boolean)
        : [];
      if (lista.length > 0) {
        localStorage.setItem(EMPRESAS_CACHE_KEY, JSON.stringify(lista));
        return lista;
      }
    }
  } catch {
    // Mantiene caché si el backend aún no responde
  }
  return getEmpresasContratantes();
}

export function getEmpresasContratantes() {
  try {
    const cached = JSON.parse(localStorage.getItem(EMPRESAS_CACHE_KEY));
    if (Array.isArray(cached) && cached.length > 0) {
      return [...new Set(cached)].sort((a, b) => a.localeCompare(b, "es"));
    }
  } catch {
    // Fallback por defecto
  }
  return ["iQFleet"];
}

export async function registerUser(data) {
  const payload = {
    ...data,
    correo: data.correo.trim().toLowerCase(),
    // Enviamos tanto password como clave por si el DTO en C# usa cualquiera de los dos nombres
    password: data.password,
    clave: data.password,
  };

  const res = await fetch(`${API_URL}/api/auth/registro`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await parseError(res, "No se pudo registrar la cuenta."));
  }

  const usuario = await res.json();
  await syncEmpresasFromBackend();
  return usuario;
}

export async function loginUser({ correo, password, rol, empresa }) {
  const payload = {
    correo: correo.trim().toLowerCase(),
    password,
    clave: password,
    rol,
    empresa: empresa?.trim() ?? "",
  };

  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await parseError(res, "Credenciales, rol o empresa incorrectos."));
  }

  const user = await res.json();
  saveSession(user);
  return user;
}

export function getSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY));
    return session ?? null;
  } catch {
    return null;
  }
}

export function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// Carga inicial de empresas desde Supabase al abrir la app
syncEmpresasFromBackend();