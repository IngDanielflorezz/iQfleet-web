import { useCallback, useEffect, useRef, useState } from 'react';

const GEO_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 5000,
  timeout: 15000,
};

function describeError(error) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Permiso de ubicación denegado. Actívalo para compartir tu ruta.';
    case error.POSITION_UNAVAILABLE:
      return 'No se pudo obtener la ubicación. Verifica tu señal GPS.';
    case error.TIMEOUT:
      return 'La ubicación tardó demasiado en responder. Intenta de nuevo.';
    default:
      return 'Ocurrió un error al obtener la ubicación.';
  }
}

/**
 * Envuelve navigator.geolocation.watchPosition con estados explícitos
 * (posición, error, observando) y limpieza automática al desmontar.
 */
export default function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [isWatching, setIsWatching] = useState(false);
  const watchIdRef = useRef(null);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWatching(false);
  }, []);

  const start = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('La geolocalización no está disponible en este dispositivo.');
      return;
    }
    if (!window.isSecureContext) {
      setError('Compartir la ubicación requiere una conexión segura (HTTPS).');
      return;
    }
    if (watchIdRef.current !== null) return;

    setError(null);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (result) => {
        const { latitude, longitude, accuracy, speed } = result.coords;
        setPosition({
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy ?? 0),
          speedKmh: speed != null ? Math.max(0, Math.round(speed * 3.6)) : 0,
          timestamp: result.timestamp,
        });
      },
      (geoError) => {
        setError(describeError(geoError));
        stop();
      },
      GEO_OPTIONS,
    );
    setIsWatching(true);
  }, [stop]);

  useEffect(() => stop, [stop]);

  return { position, error, isWatching, start, stop };
}
