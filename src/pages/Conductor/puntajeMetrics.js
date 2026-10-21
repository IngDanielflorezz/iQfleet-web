import { PUNTAJE_CONFIG, PUNTAJE_PESOS, getNivelPuntaje } from '../../config/puntajeConfig';

/**
 * Estrategias de evaluación del puntaje de conducción.
 *
 * Cada estrategia es un objeto independiente con:
 *  - id: identificador del evento
 *  - decide(prev, curr): detecta si ocurrió el evento entre dos muestras
 *  - peso: cuánto resta al puntaje (viene de PUNTAJE_PESOS)
 *
 * Agregar una regla nueva no toca el resto del cálculo (Open/Closed).
 */

function aMetrosPorSegundo(kmh) {
  return (kmh || 0) * (1000 / 3600);
}

export const ESTRATEGIAS = [
  {
    id: 'excesoGrave',
    peso: PUNTAJE_PESOS.excesoGrave,
    decide: (prev, curr) => (curr.speedKmh ?? 0) > PUNTAJE_CONFIG.velocidadLimiteKmh + PUNTAJE_CONFIG.excesoGraveKmh,
  },
  {
    id: 'excesoLeve',
    peso: PUNTAJE_PESOS.excesoLeve,
    decide: (prev, curr) => {
      const limite = PUNTAJE_CONFIG.velocidadLimiteKmh;
      return (curr.speedKmh ?? 0) > limite + PUNTAJE_CONFIG.excesoLeveKmh && (curr.speedKmh ?? 0) <= limite + PUNTAJE_CONFIG.excesoGraveKmh;
    },
  },
  {
    id: 'frenadaBrusca',
    peso: PUNTAJE_PESOS.frenadaBrusca,
    decide: (prev, curr) => {
      const deltaSeg = deltaSegundos(prev, curr);
      if (deltaSeg === null) return false;
      const a = (aMetrosPorSegundo(curr.speedKmh) - aMetrosPorSegundo(prev.speedKmh)) / deltaSeg;
      return a <= -PUNTAJE_CONFIG.frenadaBruscaMps2 && (prev.speedKmh ?? 0) > PUNTAJE_CONFIG.velocidadMinMovimientoKmh;
    },
  },
  {
    id: 'aceleracionBrusca',
    peso: PUNTAJE_PESOS.aceleracionBrusca,
    decide: (prev, curr) => {
      const deltaSeg = deltaSegundos(prev, curr);
      if (deltaSeg === null) return false;
      const a = (aMetrosPorSegundo(curr.speedKmh) - aMetrosPorSegundo(prev.speedKmh)) / deltaSeg;
      return a >= PUNTAJE_CONFIG.aceleracionBruscaMps2 && (curr.speedKmh ?? 0) > PUNTAJE_CONFIG.velocidadMinMovimientoKmh;
    },
  },
];

function deltaSegundos(prev, curr) {
  if (!prev?.timestamp || !curr?.timestamp) return null;
  const delta = (curr.timestamp - prev.timestamp) / 1000;
  if (delta < PUNTAJE_CONFIG.minIntervaloSeg) return null;
  return delta;
}

function muestraValida(muestra) {
  return muestra
    && typeof muestra.speedKmh === 'number'
    && typeof muestra.timestamp === 'number'
    && (muestra.accuracy == null || muestra.accuracy <= PUNTAJE_CONFIG.precisionMaximaM);
}

/**
 * Evalúa un par de muestras consecutivas y devuelve los eventos detectados.
 * Permite acumular incrementalmente sin re-contar el historial.
 */
export function evaluarPar(prev, curr) {
  const eventos = Object.fromEntries(ESTRATEGIAS.map((estrategia) => [estrategia.id, 0]));
  if (!muestraValida(prev) || !muestraValida(curr)) return eventos;
  ESTRATEGIAS.forEach((estrategia) => {
    if (estrategia.decide(prev, curr)) eventos[estrategia.id] += 1;
  });
  return eventos;
}

/**
 * Evalúa una secuencia de muestras y agrega los eventos detectados.
 * @param {Array} muestras
 * @returns {{ eventos: Object, excesos: number }}
 */
export function evaluarMuestras(muestras = []) {
  const eventos = Object.fromEntries(ESTRATEGIAS.map((estrategia) => [estrategia.id, 0]));
  let ultimaValida = null;

  muestras.forEach((muestra) => {
    if (!muestraValida(muestra)) return;
    if (ultimaValida) {
      ESTRATEGIAS.forEach((estrategia) => {
        if (estrategia.decide(ultimaValida, muestra)) eventos[estrategia.id] += 1;
      });
    }
    ultimaValida = muestra;
  });

  const excesos = eventos.excesoLeve + eventos.excesoGrave;
  return { eventos, excesos };
}

/**
 * Calcula el puntaje 0-100 y su desglose a partir de los eventos.
 * @returns {{ puntaje: number, desglose: Object, excesos: number }}
 */
export function calcularPuntaje(eventos = {}) {
  const desglose = {
    velocidad: 100 - (eventos.excesoLeve ?? 0) * PUNTAJE_PESOS.excesoLeve - (eventos.excesoGrave ?? 0) * PUNTAJE_PESOS.excesoGrave,
    frenadas: 100 - (eventos.frenadaBrusca ?? 0) * PUNTAJE_PESOS.frenadaBrusca,
    aceleracion: 100 - (eventos.aceleracionBrusca ?? 0) * PUNTAJE_PESOS.aceleracionBrusca,
  };

  Object.keys(desglose).forEach((clave) => {
    desglose[clave] = Math.max(0, Math.min(100, desglose[clave]));
  });

  const puntaje = Math.round((desglose.velocidad + desglose.frenadas + desglose.aceleracion) / 3);
  const excesos = (eventos.excesoLeve ?? 0) + (eventos.excesoGrave ?? 0);

  return { puntaje, desglose, excesos, nivel: getNivelPuntaje(puntaje) };
}
