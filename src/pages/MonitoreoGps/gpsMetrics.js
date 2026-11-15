import { GPS_CONFIG } from '../../services/gpsService';

/**
 * Helpers puros (sin React) para derivar estado y métricas de la flota GPS.
 * Mantenerlos aquí evita duplicar lógica entre los componentes del módulo.
 */

export const ROUTE_STATUS = {
  MOVING: 'moving',
  STOPPED: 'stopped',
  LOST: 'lost',
};

export const STATUS_META = {
  [ROUTE_STATUS.MOVING]: { label: 'En ruta', variant: 'success', icon: 'navigation' },
  [ROUTE_STATUS.STOPPED]: { label: 'Detenida', variant: 'warning', icon: 'pause_circle' },
  [ROUTE_STATUS.LOST]: { label: 'Sin señal', variant: 'danger', icon: 'signal_wifi_off' },
};

export function getRouteStatus(route) {
  if (route.stale) return ROUTE_STATUS.LOST;
  if ((route.speedKmh ?? 0) <= GPS_CONFIG.movingThresholdKmh) return ROUTE_STATUS.STOPPED;
  return ROUTE_STATUS.MOVING;
}

export function summarizeFleet(routes) {
  const summary = { total: routes.length, moving: 0, stopped: 0, lost: 0, avgSpeed: 0 };
  if (routes.length === 0) return summary;

  let speedTotal = 0;
  routes.forEach((route) => {
    const status = getRouteStatus(route);
    if (status === ROUTE_STATUS.LOST) summary.lost += 1;
    else if (status === ROUTE_STATUS.MOVING) summary.moving += 1;
    else summary.stopped += 1;
    speedTotal += route.speedKmh ?? 0;
  });

  summary.avgSpeed = Math.round(speedTotal / routes.length);
  return summary;
}

export function formatAgo(timestamp) {
  if (!timestamp) return '—';
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 5) return 'ahora mismo';
  if (seconds < 60) return `hace ${seconds} s`;
  return `hace ${Math.round(seconds / 60)} min`;
}
