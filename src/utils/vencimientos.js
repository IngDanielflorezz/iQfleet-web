/**
 * Reglas comunes de vencimiento (SOAT, RTM, licencias y documentos legales).
 *
 * Un solo lugar para los umbrales y para construir las alertas que pintan el
 * dashboard, Vehículos y Conductores. Cada módulo conserva sus propios textos.
 */
import { daysUntil } from './dateUtils';

export const UMBRAL_CRITICO_DIAS = 7;
export const UMBRAL_PREVENTIVO_DIAS = 30;

export const SEVERIDAD_ORDEN = { danger: 0, warning: 1, info: 2 };

export const ordenarPorSeveridad = (a, b) =>
  (SEVERIDAD_ORDEN[a.severidad] ?? 3) - (SEVERIDAD_ORDEN[b.severidad] ?? 3);

/** 'vencido' | 'critico' (<= 7 días) | 'proximo' (<= 30 días) | null (vigente o sin fecha). */
export function nivelVencimiento(dias) {
  if (dias === null || dias === undefined) return null;
  if (dias < 0) return 'vencido';
  if (dias <= UMBRAL_CRITICO_DIAS) return 'critico';
  if (dias <= UMBRAL_PREVENTIVO_DIAS) return 'proximo';
  return null;
}

/**
 * Alerta { id, severidad, tipo, detalle, tiempo, nivel, dias } para una fecha de
 * vencimiento, o null si sigue vigente. `titulos` = { vencido, critico, proximo }.
 */
export function alertaVencimiento({ id, fecha, detalle, titulos, referencia = new Date() }) {
  const dias = daysUntil(fecha, referencia);
  const nivel = nivelVencimiento(dias);
  if (!nivel) return null;

  let tiempo = `Vence en ${dias} días`;
  if (nivel === 'vencido') tiempo = `Hace ${Math.abs(dias)} día(s)`;
  else if (nivel === 'critico') tiempo = `Vence en ${dias} día(s)`;

  return {
    id,
    severidad: nivel === 'proximo' ? 'warning' : 'danger',
    tipo: titulos[nivel],
    detalle,
    tiempo,
    nivel,
    dias,
  };
}

/** true si `fechaVence` (YYYY-MM-DD) es anterior al día de `fechaSalida`. */
export function venceAntesDe(fechaVence, fechaSalida) {
  const dias = daysUntil(fechaVence, fechaSalida);
  return dias !== null && dias < 0;
}
