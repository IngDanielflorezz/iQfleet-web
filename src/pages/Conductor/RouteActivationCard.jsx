import { useEffect, useMemo, useRef } from 'react';
import useGeolocation from '../../hooks/useGeolocation';
import { getSession } from '../../services/authService';
import { activateRoute, deactivateRoute, updatePosition } from '../../services/gpsService';

function formatCoords(position) {
  if (!position) return '—';
  return `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`;
}

function formatAgo(timestamp) {
  if (!timestamp) return '—';
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 5) return 'ahora mismo';
  if (seconds < 60) return `hace ${seconds} s`;
  return `hace ${Math.round(seconds / 60)} min`;
}

const STATUS_LABEL = {
  idle: 'Ruta inactiva',
  locating: 'Obteniendo señal GPS...',
  active: 'Compartiendo ubicación en vivo',
};

export default function RouteActivationCard({ puedeActivar = true, motivoBloqueo = '' }) {
  const session = useMemo(() => getSession(), []);
  const { position, error, isWatching, start, stop } = useGeolocation();
  const publishedRef = useRef(false);

  const isActive = isWatching && Boolean(position);
  const statusKey = !isWatching ? 'idle' : isActive ? 'active' : 'locating';
  const bloqueado = !isWatching && !puedeActivar;

  useEffect(() => {
    if (!session || !position) return;

    if (!publishedRef.current) {
      activateRoute({
        userId: session.id,
        nombres: session.nombres,
        apellidos: session.apellidos,
        empresa: session.empresa ?? '',
        rol: session.rol,
        lat: position.lat,
        lng: position.lng,
        speedKmh: position.speedKmh,
      });
      publishedRef.current = true;
      return;
    }

    updatePosition(session.id, position);
  }, [session, position]);

  useEffect(
    () => () => {
      if (publishedRef.current && session) {
        deactivateRoute(session.id);
        publishedRef.current = false;
      }
    },
    [session],
  );

  const handleToggle = () => {
    if (isWatching) {
      stop();
      if (session) deactivateRoute(session.id);
      publishedRef.current = false;
      return;
    }
    start();
  };

  if (!session) return null;

  return (
    <section className="route-card card-iq p-4 mb-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-3">
          <span className={`route-card-icon route-card-icon--${statusKey}`}>
            <span className="material-symbols-outlined">my_location</span>
          </span>
          <div>
            <h2 className="h6 fw-bold text-white mb-1">Ruta en vivo</h2>
            <p className={`route-status route-status--${statusKey} mb-0`}>
              <span className="route-status-dot" aria-hidden="true" /> {STATUS_LABEL[statusKey]}
            </p>
          </div>
        </div>

        <button
          type="button"
          className={`route-btn route-btn--${isWatching ? 'stop' : 'start'}`}
          onClick={handleToggle}
          disabled={bloqueado}
          title={bloqueado ? motivoBloqueo : undefined}
        >
          <span className="material-symbols-outlined">
            {bloqueado ? 'lock' : isWatching ? 'stop_circle' : 'play_circle'}
          </span>
          {bloqueado ? 'Ruta bloqueada' : isWatching ? 'Detener Ruta' : 'Activar Ruta'}
        </button>
      </div>

      {bloqueado && (
        <div className="route-alert mt-3" role="alert">
          <span className="material-symbols-outlined">rule</span>
          {motivoBloqueo}
        </div>
      )}

      {error && (
        <div className="route-alert mt-3" role="alert">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}

      <div className="route-metrics mt-3">
        <div className="route-metric">
          <span className="route-metric-value">{position?.speedKmh ?? 0}</span>
          <span className="route-metric-label">Velocidad (km/h)</span>
        </div>
        <div className="route-metric">
          <span className="route-metric-value">±{position?.accuracy ?? 0}</span>
          <span className="route-metric-label">Precisión (m)</span>
        </div>
        <div className="route-metric">
          <span className="route-metric-value route-metric-value--sm">{formatCoords(position)}</span>
          <span className="route-metric-label">Coordenadas</span>
        </div>
        <div className="route-metric">
          <span className="route-metric-value">{formatAgo(position?.timestamp)}</span>
          <span className="route-metric-label">Último reporte</span>
        </div>
      </div>

      {!isWatching && (
        <p className="text-light-muted fs-8 mb-0 mt-3">
          Al activar la ruta, tu posición se compartirá con el centro de control de iQFleet. Mientras la
          ruta esté activa, mantén esta pantalla abierta.
        </p>
      )}
    </section>
  );
}
