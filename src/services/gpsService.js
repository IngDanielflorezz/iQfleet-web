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
const DEMO_KEY = 'iqfleet_demo_routes';
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

// ---------------------------------------------------------------
// Unidades de demostración (para ver el mapa sin depender de un
// conductor real). Se marcan con demo: true y se pueden quitar.
// ---------------------------------------------------------------
const DEMO_UNIDADES = [
  { userId: 'demo-01', nombres: 'Juan', apellidos: 'Pérez', empresa: 'iQFleet', placa: 'UVP-123', lat: 10.4634, lng: -73.2532, speedKmh: 46 },
  { userId: 'demo-02', nombres: 'Carlos', apellidos: 'Rodríguez', empresa: 'iQFleet', placa: 'WZA-456', lat: 10.4780, lng: -73.2410, speedKmh: 62 },
  { userId: 'demo-03', nombres: 'Luis', apellidos: 'Martínez', empresa: 'Transportes del Cesar', placa: 'EQZ-912', lat: 10.4510, lng: -73.2680, speedKmh: 0 },
  { userId: 'demo-04', nombres: 'Andrés', apellidos: 'Gómez', empresa: 'iQFleet', placa: 'TRL-890', lat: 10.4905, lng: -73.2745, speedKmh: 38 },
  { userId: 'demo-05', nombres: 'Diego', apellidos: 'Herrera', empresa: 'Cootranscesar', placa: 'KLM-334', lat: 10.4420, lng: -73.2290, speedKmh: 71 },
  { userId: 'demo-06', nombres: 'Miguel', apellidos: 'Torres', empresa: 'Transportes del Cesar', placa: 'PQR-778', lat: 10.4700, lng: -73.2200, speedKmh: 0 },
];

function jitter(valor, amplitud) {
  return valor + (Math.random() - 0.5) * amplitud;
}

/** Re-escribe las unidades demo con posiciones frescas (movimiento simulado). */
export function refreshDemoRoutes() {
  if (!isDemoEnabled()) return;
  const existentes = readRoutes();
  const ahora = Date.now();
  let cambio = false;

  DEMO_UNIDADES.forEach((unidad, indice) => {
    const previa = existentes[unidad.userId];
    const lat = previa && unidad.speedKmh > 0 ? jitter(previa.lat, 0.004) : unidad.lat;
    const lng = previa && unidad.speedKmh > 0 ? jitter(previa.lng, 0.004) : unidad.lng;
    existentes[unidad.userId] = {
      ...unidad,
      lat,
      lng,
      rol: 'Conductor',
      demo: true,
      updatedAt: ahora - indice * 800,
    };
    cambio = true;
  });

  if (cambio) writeRoutes(existentes);
}

export function isDemoEnabled() {
  return localStorage.getItem(DEMO_KEY) === '1';
}

export function enableDemoRoutes() {
  localStorage.setItem(DEMO_KEY, '1');
  refreshDemoRoutes();
}

export function disableDemoRoutes() {
  localStorage.removeItem(DEMO_KEY);
  const existentes = readRoutes();
  Object.keys(existentes).forEach((clave) => {
    if (existentes[clave].demo) delete existentes[clave];
  });
  writeRoutes(existentes);
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
  const intervalId = window.setInterval(() => {
    refreshDemoRoutes();
    handleChange();
  }, GPS_CONFIG.refreshMs);

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener(CHANGED_EVENT, handleChange);
    window.clearInterval(intervalId);
  };
}

// Al cargar, si nunca se decidió, dejamos las unidades demo activas para
// que el centro de control no se vea vacío la primera vez.
if (localStorage.getItem(DEMO_KEY) === null) {
  localStorage.setItem(DEMO_KEY, '1');
}
