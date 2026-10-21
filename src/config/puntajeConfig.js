/**
 * puntajeConfig — Parámetros del puntaje de conducción del turno.
 *
 * Reglas como estrategias independientes (exceso de velocidad, frenada brusca,
 * aceleración brusca). Cada regla tiene su umbral; los pesos definen cuánto
 * resta cada evento al puntaje base de 100.
 */

export const PUNTAJE_CONFIG = {
  velocidadLimiteKmh: 80, // límite configurable de referencia
  excesoLeveKmh: 10, // por encima del límite => leve
  excesoGraveKmh: 20, // por encima del límite => grave
  frenadaBruscaMps2: 4, // desaceleración (m/s²) sobre la que cuenta frenada
  aceleracionBruscaMps2: 3.5, // aceleración (m/s²) sobre la que cuenta aceleración
  minIntervaloSeg: 1, // separación mínima entre muestras para calcular Δv/Δt
  precisionMaximaM: 50, // descarta muestras con precisión GPS peor que esto
  velocidadMinMovimientoKmh: 5, // por debajo no evalúa frenadas (ruido)
};

export const PUNTAJE_PESOS = {
  excesoLeve: 3,
  excesoGrave: 8,
  frenadaBrusca: 6,
  aceleracionBrusca: 5,
};

export const PUNTAJE_NIVELES = [
  { min: 90, label: 'Excelente', variant: 'success', icon: 'verified' },
  { min: 75, label: 'Bueno', variant: 'success', icon: 'thumb_up' },
  { min: 60, label: 'Regular', variant: 'warning', icon: 'warning' },
  { min: 0, label: 'Deficiente', variant: 'danger', icon: 'error' },
];

export function getNivelPuntaje(puntaje) {
  return PUNTAJE_NIVELES.find((nivel) => puntaje >= nivel.min) ?? PUNTAJE_NIVELES.at(-1);
}
