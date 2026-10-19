/**
 * gpsService — Repositorio de posiciones GPS en vivo.
 *
 * Patrón Repository + Adapter: hoy persiste en localStorage, pero la API
 * pública (activateRoute / updatePosition / deactivateRoute / getActiveRoutes
 * / subscribeActiveRoutes) es el contrato que consumen las vistas. Cuando se
 * integre Supabase solo se sustituye la implementación interna, sin tocar UI.
 */

export const GPS_CONFIG = {
  refreshMs: 5000, // Frecuencia de sondeo del mapa
  signalTimeoutMs: 45000, // Sin reporte => "Sin señal"
  routeTtlMs: 600000, // Sin reporte prolongado => se descarta la unidad
  movingThresholdKmh: 3, // Por debajo se considera "Detenida"
};

const ROUTES_KEY = 'iqfleet_active_routes';
const CHANGED_EVENT = 'iqfleet:routes-changed';

// ---------------------------------------------------------------
// Persistencia (adaptador localStorage)
// ---------------------------------------------------------------
function readRoutes() {
  try {
    const raw = JSON.parse(localStorage.getItem(ROUTES_KEY));
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

function writeRoutes(routes) {
  localStorage.setItem(ROUTES_KEY, JSON.stringify(routes));
  notifyChanged();
}

function notifyChanged() {
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
}

// ---------------------------------------------------------------
// API pública
// ---------------------------------------------------------------
export function activateRoute(profile) {
  const routes = readRoutes();
  routes[profile.userId] = {
    speedKmh: 0,
    ...profile,
    updatedAt: Date.now(),
  };
  writeRoutes(routes);
}

export function updatePosition(userId, { lat, lng, speedKmh = 0 }) {
  const routes = readRoutes();
  const current = routes[userId];
  if (!current) return;
  routes[userId] = { ...current, lat, lng, speedKmh, updatedAt: Date.now() };
  writeRoutes(routes);
}

export function deactivateRoute(userId) {
  const routes = readRoutes();
  if (!(userId in routes)) return;
  delete routes[userId];
  writeRoutes(routes);
}

export function getActiveRoutes() {
  const now = Date.now();
  return Object.values(readRoutes())
    .filter((route) => now - route.updatedAt < GPS_CONFIG.routeTtlMs)
    .map((route) => ({
      ...route,
      stale: now - route.updatedAt > GPS_CONFIG.signalTimeoutMs,
    }))
    .sort((a, b) => a.nombres.localeCompare(b.nombres, 'es'));
}

/**
 * Observer: emite la lista de rutas ante cambios en otra pestaña (evento
 * "storage"), en la misma pestaña (evento custom) y por sondeo periódico.
 * Devuelve la función de limpieza.
 */
export function subscribeActiveRoutes(callback) {
  const handleChange = () => callback(getActiveRoutes());

  window.addEventListener('storage', handleChange);
  window.addEventListener(CHANGED_EVENT, handleChange);
  const intervalId = window.setInterval(handleChange, GPS_CONFIG.refreshMs);

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener(CHANGED_EVENT, handleChange);
    window.clearInterval(intervalId);
  };
}
