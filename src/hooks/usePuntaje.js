import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getPuntaje,
  acumularEventos,
  getRachaSinGraves,
  actualizarRacha,
  subscribePuntaje,
  hoyISO,
} from '../services/puntajeService';
import { evaluarPar, calcularPuntaje } from '../pages/Conductor/puntajeMetrics';

/**
 * Puntaje de conducción del turno.
 *
 * Consume las muestras de posición (velocidad y timestamp) y, por cada par
 * consecutivo, detecta eventos con las estrategias independientes. Solo
 * persiste contadores y el puntaje; las muestras crudas viven en memoria.
 */
export default function usePuntaje(userId, { position = null } = {}) {
  const fecha = hoyISO();
  const [puntaje, setPuntaje] = useState(() => getPuntaje(userId, fecha)?.puntaje ?? 100);
  const [eventos, setEventos] = useState(
    () => getPuntaje(userId, fecha)?.eventos ?? { excesoLeve: 0, excesoGrave: 0, frenadaBrusca: 0, aceleracionBrusca: 0 },
  );
  const [racha, setRacha] = useState(() => (userId ? getRachaSinGraves(userId) : 0));
  const ultimaMuestraRef = useRef(null);

  useEffect(() => {
    if (!userId) return undefined;
    const unsubscribe = subscribePuntaje((mapa) => {
      const entrada = mapa[`${userId}::${fecha}`];
      if (entrada) {
        setPuntaje(entrada.puntaje);
        setEventos(entrada.eventos);
      }
    });
    return unsubscribe;
  }, [userId, fecha]);

  // Detecta y acumula los eventos del par de muestras más reciente.
  useEffect(() => {
    if (!userId || !position) return;

    if (ultimaMuestraRef.current) {
      const detectados = evaluarPar(ultimaMuestraRef.current, position);
      const total = Object.values(detectados).reduce((suma, cantidad) => suma + cantidad, 0);
      if (total > 0) {
        const actualizada = acumularEventos(userId, detectados, { fecha });
        setPuntaje(actualizada.puntaje);
        setEventos(actualizada.eventos);
        setRacha(actualizarRacha(userId, { fecha }));
      }
    }
    ultimaMuestraRef.current = position;
  }, [userId, position, fecha]);

  const desglose = useMemo(() => calcularPuntaje(eventos), [eventos]);

  return {
    puntaje,
    eventos,
    racha,
    excesos: desglose.excesos,
    desglose: desglose.desglose,
    nivel: desglose.nivel,
  };
}
