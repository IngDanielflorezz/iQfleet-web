import { CONDUCTOR_ESTADOS } from '../../services/conductorService';
import { daysUntil } from '../../utils/dateUtils';

export const UMBRAL_CRITICO_DIAS = 7;
export const UMBRAL_PREVENTIVO_DIAS = 30;

const SEVERIDAD_ORDEN = { danger: 0, warning: 1, info: 2 };

/**
 * Alertas de licencia: vencidas, críticas (<=7 días) y próximas (<=30 días).
 * Devuelve el conteo por grupo y el detalle ordenado por severidad.
 */
export function buildLicenciaAlertas(conductores = [], referencia = new Date()) {
  const grupos = { vencidas: 0, criticas: 0, proximas: 0 };
  const alertas = [];

  conductores.forEach((conductor) => {
    const dias = daysUntil(conductor.licenciaVence, referencia);
    if (dias === null) return;

    const detalle = `${conductor.nombre} · Lic. ${conductor.categoriaLicencia} · CC ${conductor.cedula}`;

    if (dias < 0) {
      grupos.vencidas += 1;
      alertas.push({
        id: `lic-${conductor.id}`,
        severidad: 'danger',
        tipo: 'Licencia vencida',
        detalle,
        tiempo: `Hace ${Math.abs(dias)} día(s)`,
      });
    } else if (dias <= UMBRAL_CRITICO_DIAS) {
      grupos.criticas += 1;
      alertas.push({
        id: `lic-${conductor.id}`,
        severidad: 'danger',
        tipo: 'Licencia crítica',
        detalle,
        tiempo: `Vence en ${dias} día(s)`,
      });
    } else if (dias <= UMBRAL_PREVENTIVO_DIAS) {
      grupos.proximas += 1;
      alertas.push({
        id: `lic-${conductor.id}`,
        severidad: 'warning',
        tipo: 'Licencia próxima a vencer',
        detalle,
        tiempo: `Vence en ${dias} días`,
      });
    }
  });

  alertas.sort((a, b) => SEVERIDAD_ORDEN[a.severidad] - SEVERIDAD_ORDEN[b.severidad]);
  return { grupos, alertas };
}

export function computeConductoresResumen(conductores = [], referencia = new Date()) {
  const total = conductores.length;
  const activos = conductores.filter((conductor) => conductor.estado === CONDUCTOR_ESTADOS.ACTIVO).length;
  const enRelevo = conductores.filter((conductor) => conductor.estado === CONDUCTOR_ESTADOS.EN_RELEVO).length;
  const inactivos = conductores.filter((conductor) => conductor.estado === CONDUCTOR_ESTADOS.INACTIVO).length;

  const { grupos, alertas } = buildLicenciaAlertas(conductores, referencia);

  return {
    total,
    activos,
    enRelevo,
    inactivos,
    habilitadosPorcentaje: total > 0 ? (activos / total) * 100 : 0,
    licencias: grupos,
    alertas,
  };
}
