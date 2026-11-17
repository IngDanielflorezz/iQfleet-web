/**
 * Cálculo del próximo mantenimiento de cada plan (lo que ocurra primero: km o días).
 * Lo usan la pestaña Mantenimiento de Vehículos y las alertas del dashboard.
 */
import { daysUntil, formatFechaCorta } from '../../utils/dateUtils';
import { formatNumber } from '../../utils/format';
import { ordenarPorSeveridad } from '../../utils/vencimientos';

/** Se avisa cuando faltan 1.000 km o menos, o 15 días o menos. */
export const MANT_UMBRAL_KM = 1000;
export const MANT_UMBRAL_DIAS = 15;

export const NIVEL_PLAN = {
  vencido: { label: 'Vencido', variant: 'danger', orden: 0 },
  proximo: { label: 'Próximo', variant: 'warning', orden: 1 },
  sin_registro: { label: 'Sin registro', variant: 'secondary', orden: 2 },
  al_dia: { label: 'Al día', variant: 'success', orden: 3 },
};

function sumarDias(fechaISO, dias) {
  const [anio, mes, dia] = String(fechaISO).split('-').map(Number);
  const fecha = new Date(anio, mes - 1, dia + dias);
  const pad = (n) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`;
}

function nivelDe(restante, umbral) {
  if (restante === null) return null;
  if (restante <= 0) return 'vencido';
  if (restante <= umbral) return 'proximo';
  return 'al_dia';
}

/**
 * Estado de un plan: { nivel, proximoKm, kmRestantes, proximaFecha, diasRestantes, resumen }.
 * nivel = el peor entre el criterio de km y el de días; 'sin_registro' si no se sabe
 * cuándo fue el último servicio.
 */
export function estadoPlan(plan, vehiculo, referencia = new Date()) {
  const kmActual = vehiculo?.kilometraje ?? null;
  const proximoKm = plan.cadaKm && plan.ultimoKm !== null && plan.ultimoKm !== undefined ? plan.ultimoKm + plan.cadaKm : null;
  const kmRestantes = proximoKm !== null && kmActual !== null ? proximoKm - kmActual : null;

  const proximaFecha = plan.cadaDias && plan.ultimaFecha ? sumarDias(plan.ultimaFecha, plan.cadaDias) : null;
  const diasRestantes = proximaFecha ? daysUntil(proximaFecha, referencia) : null;

  const niveles = [nivelDe(kmRestantes, MANT_UMBRAL_KM), nivelDe(diasRestantes, MANT_UMBRAL_DIAS)].filter(Boolean);
  const nivel = niveles.length === 0
    ? 'sin_registro'
    : niveles.sort((a, b) => NIVEL_PLAN[a].orden - NIVEL_PLAN[b].orden)[0];

  const partes = [];
  if (kmRestantes !== null) {
    partes.push(kmRestantes <= 0 ? `pasado por ${formatNumber(-kmRestantes)} km` : `faltan ${formatNumber(kmRestantes)} km`);
  }
  if (diasRestantes !== null) {
    partes.push(diasRestantes <= 0 ? `vencido el ${formatFechaCorta(proximaFecha)}` : `faltan ${diasRestantes} días`);
  }

  return {
    nivel,
    proximoKm,
    kmRestantes,
    proximaFecha,
    diasRestantes,
    resumen: partes.length > 0 ? partes.join(' · ') : 'Registra el último servicio para calcular el próximo',
  };
}

/** Resumen para la pestaña: conteo por nivel y órdenes abiertas. */
export function resumenMantenimiento(planes, vehiculos, ordenes, referencia = new Date()) {
  const porPlaca = new Map(vehiculos.map((vehiculo) => [vehiculo.id, vehiculo]));
  const conteo = { vencido: 0, proximo: 0, sin_registro: 0, al_dia: 0 };
  planes.forEach((plan) => {
    conteo[estadoPlan(plan, porPlaca.get(plan.placa), referencia).nivel] += 1;
  });
  return { ...conteo, enTaller: ordenes.filter((orden) => orden.estado === 'Abierta').length };
}

/**
 * Alertas para el dashboard: planes vencidos o próximos. Se omiten los vehículos que ya
 * tienen una orden abierta (ya están en taller) y los que están fuera de servicio.
 */
export function buildAlertasMantenimiento(planes, vehiculos, ordenes, referencia = new Date()) {
  const porPlaca = new Map(vehiculos.map((vehiculo) => [vehiculo.id, vehiculo]));
  const enTaller = new Set(ordenes.filter((orden) => orden.estado === 'Abierta').map((orden) => orden.placa));

  return planes
    .map((plan) => {
      const vehiculo = porPlaca.get(plan.placa);
      if (!vehiculo || enTaller.has(plan.placa) || vehiculo.estado === 'Fuera de servicio') return null;
      const estado = estadoPlan(plan, vehiculo, referencia);
      if (estado.nivel !== 'vencido' && estado.nivel !== 'proximo') return null;
      return {
        id: `mant-${plan.id}`,
        severidad: estado.nivel === 'vencido' ? 'danger' : 'warning',
        tipo: estado.nivel === 'vencido' ? 'Mantenimiento vencido' : 'Mantenimiento próximo',
        detalle: `${plan.placa} · ${plan.tarea}`,
        tiempo: estado.resumen,
      };
    })
    .filter(Boolean)
    .sort(ordenarPorSeveridad);
}
