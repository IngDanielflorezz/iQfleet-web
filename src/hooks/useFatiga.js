import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getFatiga,
  iniciarConduccion,
  registrarPausa,
  resetFatiga,
  subscribeFatiga,
  evaluarFatiga,
  hoyISO,
} from '../services/fatigaService';
import { FATIGA_CONFIG, FATIGA_ESTADOS } from '../config/fatigaConfig';
import { createAlertaIdempotente, resolverAlertasPorClave, ALERTA_SEVERIDAD, ALERTA_TIPOS } from '../services/alertService';

/**
 * Cronómetro de conducción continua con control de fatiga.
 *
 * - Corre mientras `activo` (ruta encendida) y `position.speedKmh` supera el
 *   umbral de movimiento.
 * - Detecta pausa automática: si la velocidad se mantiene por debajo del
 *   umbral durante `pausaMinimaMin`, registra la pausa y reinicia el contador.
 * - Emite una alerta idempotente al cruzar los umbrales de aviso y requerido.
 */
export default function useFatiga(userId, { activo = false, position = null, conductor = '', empresa = '' } = {}) {
  const fecha = hoyISO();
  const [acumuladoMs, setAcumuladoMs] = useState(() => getFatiga(userId, fecha)?.acumuladoMs ?? 0);

  const acumuladoRef = useRef(acumuladoMs);
  const ultimoTickRef = useRef(null);
  const detenidoDesdeRef = useRef(null);
  const umbralEmitidoRef = useRef(null);

  useEffect(() => {
    if (!userId) return undefined;
    const unsubscribe = subscribeFatiga((mapa) => {
      const entrada = mapa[`${userId}::${fecha}`];
      if (entrada) {
        acumuladoRef.current = entrada.acumuladoMs;
        setAcumuladoMs(entrada.acumuladoMs);
      }
    });
    return unsubscribe;
  }, [userId, fecha]);

  const evaluacion = useMemo(() => evaluarFatiga(acumuladoMs), [acumuladoMs]);

  // Cronómetro: acumula tiempo de conducción continua mientras la ruta está
  // activa. El contador corre aunque el vehículo esté detenido; una pausa
  // (manual o automática por detención prolongada) lo reinicia.
  useEffect(() => {
    if (!userId) return undefined;
    const id = window.setInterval(() => {
      const ahora = Date.now();
      const velocidad = position?.speedKmh ?? 0;
      const moviendose = Boolean(position) && velocidad > FATIGA_CONFIG.movingThresholdKmh;

      if (!activo) {
        ultimoTickRef.current = null;
        detenidoDesdeRef.current = null;
        return;
      }

      if (moviendose) {
        detenidoDesdeRef.current = null;
      } else if (detenidoDesdeRef.current === null) {
        detenidoDesdeRef.current = ahora;
      }

      if (ultimoTickRef.current !== null) {
        acumuladoRef.current += ahora - ultimoTickRef.current;
        setAcumuladoMs(acumuladoRef.current);
      }
      ultimoTickRef.current = ahora;

      // Pausa automática por permanecer detenido el tiempo mínimo.
      if (detenidoDesdeRef.current !== null) {
        const detenidoMs = ahora - detenidoDesdeRef.current;
        if (detenidoMs >= FATIGA_CONFIG.pausaMinimaMin * 60000) {
          registrarPausa(userId, detenidoMs, { fecha, motivo: 'automatica' });
          detenidoDesdeRef.current = null;
          acumuladoRef.current = 0;
          setAcumuladoMs(0);
        }
      }
    }, FATIGA_CONFIG.tickMs);

    return () => window.clearInterval(id);
  }, [userId, activo, position, fecha]);

  // Alerta idempotente al cruzar cada umbral (una sola vez por nivel).
  useEffect(() => {
    if (!userId) return undefined;
    const claveAviso = `fatiga:aviso:${userId}:${fecha}`;
    const claveRequerido = `fatiga:requerido:${userId}:${fecha}`;

    if (evaluacion.estado === FATIGA_ESTADOS.REQUERIDO && umbralEmitidoRef.current !== FATIGA_ESTADOS.REQUERIDO) {
      umbralEmitidoRef.current = FATIGA_ESTADOS.REQUERIDO;
      createAlertaIdempotente(
        {
          tipo: ALERTA_TIPOS.FATIGA,
          severidad: ALERTA_SEVERIDAD.DANGER,
          userId,
          conductor,
          empresa,
          titulo: 'Descanso requerido',
          detalle: `${conductor} superó ${FATIGA_CONFIG.maxContinuoMin / 60} h de conducción continua.`,
        },
        claveRequerido,
      );
      return undefined;
    }

    if (evaluacion.estado === FATIGA_ESTADOS.AVISO && umbralEmitidoRef.current === null) {
      umbralEmitidoRef.current = FATIGA_ESTADOS.AVISO;
      createAlertaIdempotente(
        {
          tipo: ALERTA_TIPOS.FATIGA,
          severidad: ALERTA_SEVERIDAD.WARNING,
          userId,
          conductor,
          empresa,
          titulo: 'Descanso pronto',
          detalle: `${conductor} lleva ${evaluacion.porcentaje}% del tiempo continuo recomendado.`,
        },
        claveAviso,
      );
    }

    if (evaluacion.estado === FATIGA_ESTADOS.NORMAL) {
      umbralEmitidoRef.current = null;
      resolverAlertasPorClave(claveAviso);
      resolverAlertasPorClave(claveRequerido);
    }

    return undefined;
  }, [evaluacion.estado, evaluacion.porcentaje, userId, fecha, conductor, empresa]);

  const iniciar = useCallback(() => {
    if (!userId) return;
    iniciarConduccion(userId, { fecha });
  }, [userId, fecha]);

  const pausar = useCallback(() => {
    if (!userId) return null;
    const detenidoMs = detenidoDesdeRef.current ? Date.now() - detenidoDesdeRef.current : 0;
    detenidoDesdeRef.current = null;
    const resultado = registrarPausa(userId, detenidoMs, { fecha, motivo: 'manual' });
    acumuladoRef.current = 0;
    setAcumuladoMs(0);
    return resultado;
  }, [userId, fecha]);

  const reiniciar = useCallback(() => {
    if (!userId) return;
    resetFatiga(userId, fecha);
    acumuladoRef.current = 0;
    setAcumuladoMs(0);
    umbralEmitidoRef.current = null;
  }, [userId, fecha]);

  return {
    acumuladoMs,
    estado: evaluacion.estado,
    porcentaje: evaluacion.porcentaje,
    restanteMin: evaluacion.restanteMin,
    iniciar,
    pausar,
    reiniciar,
  };
}
