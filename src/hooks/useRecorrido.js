import { useEffect, useRef, useState } from 'react';
import { getRecorrido, agregarPunto, resetRecorrido, subscribeRecorridos, hoyISO } from '../services/recorridoService';

/**
 * Recorrido del turno: estela de puntos y kilómetros acumulados.
 *
 * Recibe la posición en vivo y agrega un punto por lectura (el servicio filtra
 * baja precisión y saltos). Persiste por conductor y día.
 */
export default function useRecorrido(userId, { position = null } = {}) {
  const fecha = hoyISO();
  const [recorrido, setRecorrido] = useState(() => (userId ? getRecorrido(userId, fecha) : null));
  const ultimoTimestampRef = useRef(recorrido?.puntos?.at(-1)?.timestamp ?? null);

  useEffect(() => {
    if (!userId) return undefined;
    const unsubscribe = subscribeRecorridos((mapa) => {
      setRecorrido(mapa[`${userId}::${fecha}`] ?? null);
    });
    return unsubscribe;
  }, [userId, fecha]);

  useEffect(() => {
    if (!userId || !position) return;
    if (ultimoTimestampRef.current === position.timestamp) return;
    ultimoTimestampRef.current = position.timestamp;
    setRecorrido(agregarPunto(userId, position, { fecha }));
  }, [userId, position, fecha]);

  const reiniciar = () => {
    if (!userId) return;
    resetRecorrido(userId, fecha);
    ultimoTimestampRef.current = null;
    setRecorrido(null);
  };

  return {
    puntos: recorrido?.puntos ?? [],
    kilometros: recorrido?.kilometros ?? 0,
    reiniciar,
  };
}
