import { CONDUCTOR_ESTADOS } from '../../services/conductorService';
import { alertaVencimiento, ordenarPorSeveridad } from '../../utils/vencimientos';

export { UMBRAL_CRITICO_DIAS, UMBRAL_PREVENTIVO_DIAS } from '../../utils/vencimientos';

const GRUPO_POR_NIVEL = { vencido: 'vencidas', critico: 'criticas', proximo: 'proximas' };

/**
 * Alertas de licencia: vencidas, críticas (<=7 días) y próximas (<=30 días).
 * Devuelve el conteo por grupo y el detalle ordenado por severidad.
 */
export function buildLicenciaAlertas(conductores = [], referencia = new Date()) {
  const grupos = { vencidas: 0, criticas: 0, proximas: 0 };
  const alertas = [];

  conductores.forEach((conductor) => {
    const alerta = alertaVencimiento({
      id: `lic-${conductor.id}`,
      fecha: conductor.licenciaVence,
      detalle: `${conductor.nombre} · Lic. ${conductor.categoriaLicencia} · CC ${conductor.cedula}`,
      titulos: { vencido: 'Licencia vencida', critico: 'Licencia crítica', proximo: 'Licencia próxima a vencer' },
      referencia,
    });
    if (!alerta) return;
    grupos[GRUPO_POR_NIVEL[alerta.nivel]] += 1;
    alertas.push(alerta);
  });

  alertas.sort(ordenarPorSeveridad);
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
