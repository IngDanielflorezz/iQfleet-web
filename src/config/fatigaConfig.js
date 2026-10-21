/**
 * fatigaConfig — Parámetros del control de fatiga en vivo.
 *
 * Todos los umbrales viven como datos para poder ajustarlos sin tocar la
 * lógica. El cronómetro mide conducción continua del turno; una pausa válida
 * reinicia el contador.
 */

export const FATIGA_CONFIG = {
  maxContinuoMin: 4 * 60, // 4 h máximo de conducción continua
  umbralAvisoPct: 80, // % para pasar a "Descanso pronto"
  pausaMinimaMin: 15, // pausa válida que reinicia el contador
  tickMs: 1000, // frecuencia de actualización del cronómetro
  movingThresholdKmh: 3, // debajo de esto se considera detenido
};

export const FATIGA_ESTADOS = {
  NORMAL: 'normal',
  AVISO: 'aviso',
  REQUERIDO: 'requerido',
};

export const FATIGA_META = {
  [FATIGA_ESTADOS.NORMAL]: { label: 'Conducción normal', variant: 'success' },
  [FATIGA_ESTADOS.AVISO]: { label: 'Descanso pronto', variant: 'warning' },
  [FATIGA_ESTADOS.REQUERIDO]: { label: 'Descanso requerido', variant: 'danger' },
};
