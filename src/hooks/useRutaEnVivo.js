import { useCallback, useEffect, useMemo, useRef } from 'react';
import useGeolocation from './useGeolocation';
import { getSession } from '../services/authService';
import { activateRoute, deactivateRoute, updatePosition } from '../services/gpsService';

/**
 * Estado único de la "Ruta en vivo" del conductor.
 *
 * Envuelve useGeolocation y el ciclo de publicación de la posición al centro
 * de control. Se eleva a un hook para que la tarjeta, el control de fatiga y
 * el puntaje de conducción compartan la misma fuente de posición, evitando
 * abrir varios watchPosition en paralelo.
 */
export default function useRutaEnVivo() {
  const session = useMemo(() => getSession(), []);
  const { position, error, isWatching, start, stop } = useGeolocation();
  const publishedRef = useRef(false);

  const isActive = isWatching && Boolean(position);
  const statusKey = !isWatching ? 'idle' : isActive ? 'active' : 'locating';

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

  const toggle = useCallback(() => {
    if (isWatching) {
      stop();
      if (session) deactivateRoute(session.id);
      publishedRef.current = false;
      return;
    }
    start();
  }, [isWatching, stop, start, session]);

  return { session, position, error, isWatching, isActive, statusKey, toggle };
}
