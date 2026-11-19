const SESSION_KEY = "iqfleet_session";
const EMPRESAS_CACHE_KEY = "iqfleet_empresas_cache";

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8080").replace(/\/$/, "");

export const ROLES = {
  ADMINISTRADOR: "ADMINISTRADOR",
  CONDUCTOR: "CONDUCTOR",
};

// Login, registro y empresas son públicos: no llevan token.
const JSON_HEADERS = { "Content-Type": "application/json" };

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
      headers: JSON_HEADERS,
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
  };

  const res = await fetch(`${API_URL}/api/auth/registro`, {
    method: "POST",
    headers: JSON_HEADERS,
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
    rol,
    empresa: empresa?.trim() ?? "",
  };

  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await parseError(res, "Credenciales, rol o empresa incorrectos."));
  }

  // La API responde { token, expiraEn, usuario }; la sesión guarda el perfil junto con el token.
  const { token, expiraEn, usuario } = await res.json();
  const sesion = { ...usuario, token, expiraEn };
  saveSession(sesion);
  return sesion;
}

/** Sesión iniciada, o null si no hay, es de la versión sin token o el token ya venció. */
export function getSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (!session?.token || !(Date.parse(session.expiraEn) > Date.now())) {
      if (session) clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/** JWT de la sesión para el header Authorization (lo usa apiClient). */
export function getToken() {
  return getSession()?.token ?? null;
}

export function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// Carga inicial de empresas desde Supabase al abrir la app
syncEmpresasFromBackend();
