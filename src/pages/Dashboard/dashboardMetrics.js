import { codigoDespacho, DESPACHO_ESTADOS } from '../../services/despachoService';
import { buildLicenciaAlertas } from '../Conductores/conductoresMetrics';
import { computeFinanzasResumen } from '../Finanzas/finanzasMetrics';
import { buildAlertasMantenimiento } from '../Vehiculos/mantenimientoMetrics';
import { daysUntil, formatFechaCorta, toPeriodo } from '../../utils/dateUtils';
import { alertaVencimiento, ordenarPorSeveridad, UMBRAL_CRITICO_DIAS, venceAntesDe } from '../../utils/vencimientos';

export { UMBRAL_CRITICO_DIAS, UMBRAL_PREVENTIVO_DIAS } from '../../utils/vencimientos';

function vehiculosOperativos(flota) {
  return flota.filter((vehiculo) => vehiculo.estado === 'Operativo');
}

export function computeDisponibilidadFlota(flota = []) {
  const total = flota.length;
  const operativos = vehiculosOperativos(flota).length;
  return {
    total,
    operativos,
    porcentaje: total > 0 ? (operativos / total) * 100 : 0,
  };
}

/**
 * Personal rodante: conductores registrados que no están inactivos, y cuántos de ellos
 * tienen ahora mismo un despacho "En ruta".
 */
export function computePersonalRodante(conductores = [], despachos = []) {
  const disponibles = conductores.filter((conductor) => conductor.estado !== 'Inactivo');
  const nombres = new Set(disponibles.map((conductor) => conductor.nombre));
  const ids = new Set(disponibles.map((conductor) => conductor.id));

  const enRuta = new Set();
  despachos
    .filter((despacho) => despacho.estado === DESPACHO_ESTADOS.EN_RUTA)
    .forEach((despacho) => {
      if (ids.has(despacho.conductorId) || nombres.has(despacho.conductor)) enRuta.add(despacho.conductor);
    });

  return { total: disponibles.length, enRuta: enRuta.size };
}

export function computeCumplimientoLegal(flota = [], referencia = new Date()) {
  let vigentes = 0;
  let total = 0;
  let criticos = 0;
  let vencidos = 0;

  flota.forEach((vehiculo) => {
    [vehiculo.soatVence, vehiculo.rtmVence].forEach((fechaStr) => {
      const dias = daysUntil(fechaStr, referencia);
      if (dias === null) return;
      total += 1;
      if (dias < 0) vencidos += 1;
      else {
        vigentes += 1;
        if (dias <= UMBRAL_CRITICO_DIAS) criticos += 1;
      }
    });
  });

  return {
    porcentaje: total > 0 ? (vigentes / total) * 100 : 0,
    vigentes,
    total,
    criticos,
    vencidos,
    criticosTotales: criticos + vencidos,
  };
}

/**
 * Margen neto del mes con los movimientos de Finanzas (ingresos - egresos), con la misma
 * función que usa la página de Finanzas para que ambas muestren el mismo número.
 * null si no hay movimientos en el período.
 */
export function computeMargenNeto(movimientos = [], periodo = null) {
  if (!periodo) return null;
  const resumen = computeFinanzasResumen(movimientos, periodo);
  if (resumen.totalMovimientos === 0) return null;
  return {
    ingresos: resumen.ingresos,
    costos: resumen.egresos,
    margen: resumen.margen,
    porcentaje: resumen.ingresos > 0 ? resumen.rentabilidad : null,
  };
}

function buildDocAlerta(vehiculo, tipoDocumento, fechaStr, referencia) {
  return alertaVencimiento({
    id: `${tipoDocumento}-${vehiculo.id}`,
    fecha: fechaStr,
    detalle: `Placa ${vehiculo.id} (${vehiculo.marca} ${vehiculo.modelo})`,
    titulos: { vencido: `${tipoDocumento} Vencido`, critico: `${tipoDocumento} Crítico`, proximo: `${tipoDocumento} por vencer` },
    referencia,
  });
}

export function buildAlertas(flota = [], despachos = [], referencia = new Date()) {
  const alertas = [];

  flota.forEach((vehiculo) => {
    const soat = buildDocAlerta(vehiculo, 'SOAT', vehiculo.soatVence, referencia);
    if (soat) alertas.push(soat);
    const rtm = buildDocAlerta(vehiculo, 'RTM', vehiculo.rtmVence, referencia);
    if (rtm) alertas.push(rtm);

    if (vehiculo.estado === 'Mantenimiento') {
      alertas.push({
        id: `mantenimiento-${vehiculo.id}`,
        severidad: 'warning',
        tipo: 'Vehículo en taller',
        detalle: `Placa ${vehiculo.id} (${vehiculo.marca} ${vehiculo.modelo})`,
        tiempo: 'En taller',
      });
    }
  });

  despachos
    .filter((despacho) => despacho.estado === DESPACHO_ESTADOS.PROGRAMADO && new Date(despacho.fechaSalida) < referencia)
    .forEach((despacho) => {
      alertas.push({
        id: `atrasado-${despacho.id}`,
        severidad: 'warning',
        tipo: 'Despacho programado vencido',
        detalle: `Placa ${despacho.placa} · ${despacho.origen} → ${despacho.destino}`,
        tiempo: 'Requiere reprogramación',
      });
    });

  return alertas.sort(ordenarPorSeveridad);
}

// SOAT y RTM de un vehículo ya salen de la ficha del vehículo (buildAlertas);
// del módulo Documentos solo se suman los que no duplican esa información.
const TIPOS_CUBIERTOS_POR_FLOTA = ['SOAT', 'RTM'];

function buildAlertasDocumentos(documentos, flota, referencia) {
  const placasFlota = new Set(flota.map((vehiculo) => vehiculo.id));
  return documentos
    .filter((documento) => !(TIPOS_CUBIERTOS_POR_FLOTA.includes(documento.tipo) && placasFlota.has(documento.placa)))
    .map((documento) =>
      alertaVencimiento({
        id: `doc-${documento.id}`,
        fecha: documento.vencimiento,
        detalle: `N.º ${documento.numero} · ${documento.placa || documento.conductor || documento.entidad}`,
        titulos: {
          vencido: `${documento.tipo} · Vencido`,
          critico: `${documento.tipo} · Crítico`,
          proximo: `${documento.tipo} · Por vencer`,
        },
        referencia,
      }),
    )
    .filter(Boolean);
}

/**
 * Despachos programados a futuro que ya no cumplirían las reglas de despacho de la API:
 * se crearon cuando todo estaba en regla, pero antes de salir venció un documento o
 * cambió el estado del vehículo o del conductor. Avisa para reprogramarlos a tiempo.
 */
export function buildDespachosEnRiesgo(despachos, flota, conductores, referencia = new Date()) {
  const vehiculoPorPlaca = new Map(flota.map((vehiculo) => [vehiculo.id, vehiculo]));
  const fichaPorId = new Map(conductores.map((conductor) => [conductor.id, conductor]));
  const fichaPorNombre = new Map(conductores.map((conductor) => [conductor.nombre, conductor]));

  return despachos
    .filter((despacho) => despacho.estado === DESPACHO_ESTADOS.PROGRAMADO && new Date(despacho.fechaSalida) >= referencia)
    .map((despacho) => {
      const motivos = [];
      const vehiculo = vehiculoPorPlaca.get(despacho.placa);
      if (vehiculo) {
        if (vehiculo.estado !== 'Operativo') motivos.push(`vehículo en ${vehiculo.estado.toLowerCase()}`);
        if (venceAntesDe(vehiculo.soatVence, despacho.fechaSalida)) motivos.push('SOAT vence antes de la salida');
        if (venceAntesDe(vehiculo.rtmVence, despacho.fechaSalida)) motivos.push('RTM vence antes de la salida');
      }
      const ficha = fichaPorId.get(despacho.conductorId) ?? fichaPorNombre.get(despacho.conductor);
      if (ficha) {
        if (ficha.estado === 'Inactivo') motivos.push(`${ficha.nombre} está inactivo`);
        if (venceAntesDe(ficha.licenciaVence, despacho.fechaSalida)) motivos.push(`licencia de ${ficha.nombre} vence antes de la salida`);
      }
      if (motivos.length === 0) return null;
      return {
        id: `riesgo-${despacho.id}`,
        severidad: 'danger',
        tipo: 'Despacho en riesgo',
        detalle: `${codigoDespacho(despacho)} · ${despacho.placa}: ${motivos.join('; ')}`,
        tiempo: `Sale ${formatFechaCorta(despacho.fechaSalida)}`,
      };
    })
    .filter(Boolean);
}

/**
 * Alertas preventivas que no dependen del período elegido: licencias (conductores no
 * inactivos), documentos legales, despachos programados en riesgo y mantenimientos
 * vencidos o próximos.
 */
export function buildAlertasPrevencion({
  despachos = [],
  flota = [],
  conductores = [],
  documentos = [],
  planes = [],
  ordenes = [],
  referencia = new Date(),
}) {
  const conductoresVigentes = conductores.filter((conductor) => conductor.estado !== 'Inactivo');
  return [
    ...buildDespachosEnRiesgo(despachos, flota, conductores, referencia),
    ...buildLicenciaAlertas(conductoresVigentes, referencia).alertas,
    ...buildAlertasDocumentos(documentos, flota, referencia),
    ...buildAlertasMantenimiento(planes, flota, ordenes, referencia),
  ].sort(ordenarPorSeveridad);
}

export function listPeriodos(despachos) {
  const periodos = new Set();
  despachos.forEach((despacho) => {
    const periodo = toPeriodo(despacho.fechaSalida);
    if (periodo) periodos.add(periodo);
  });
  return [...periodos].sort((a, b) => b.localeCompare(a));
}

/**
 * Agrupa los despachos de un período (YYYY-MM) por semana del mes (1..5) para
 * alimentar la gráfica de telemetría. Cada punto incluye nº de despachos,
 * fletes facturados (excluye cancelados) y costos operativos.
 */
export function computeTelemetriaSemanal(despachos, periodo) {
  const semanas = Array.from({ length: 5 }, (_, indice) => ({
    semana: indice + 1,
    etiqueta: `S${indice + 1}`,
    despachos: 0,
    ingresos: 0,
    costos: 0,
  }));

  despachos
    .filter((despacho) => toPeriodo(despacho.fechaSalida) === periodo)
    .forEach((despacho) => {
      const dia = Number(String(despacho.fechaSalida).slice(8, 10));
      if (!Number.isFinite(dia)) return;
      const indiceSemana = Math.min(4, Math.floor((dia - 1) / 7));
      const punto = semanas[indiceSemana];
      punto.despachos += 1;
      if (despacho.estado !== DESPACHO_ESTADOS.CANCELADO) {
        punto.ingresos += Number(despacho.valorFlete || 0);
        punto.costos += Number(despacho.costoOperativo || 0);
      }
    });

  const maxDespachos = Math.max(1, ...semanas.map((punto) => punto.despachos));
  const maxDinero = Math.max(1, ...semanas.map((punto) => Math.max(punto.ingresos, punto.costos)));

  return semanas.map((punto) => ({
    ...punto,
    alturaDespachos: (punto.despachos / maxDespachos) * 100,
    alturaIngresos: (punto.ingresos / maxDinero) * 100,
    alturaCostos: (punto.costos / maxDinero) * 100,
  }));
}

/**
 * KPIs del dashboard. `despachosPeriodo` son los del mes elegido; `despachos`, todos
 * (el estado "En ruta" es actual, no de un mes). El margen sale de Finanzas.
 */
export function buildResumen({
  despachosPeriodo = [],
  despachos = [],
  flota = [],
  conductores = [],
  movimientos = [],
  periodo = null,
  referencia = new Date(),
}) {
  return {
    disponibilidad: computeDisponibilidadFlota(flota),
    personal: computePersonalRodante(conductores, despachos),
    cumplimiento: computeCumplimientoLegal(flota, referencia),
    margen: computeMargenNeto(movimientos, periodo),
    alertas: buildAlertas(flota, despachosPeriodo, referencia),
  };
}
