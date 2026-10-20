import { vehiculos } from '../../data/vehiculos';
import { DESPACHO_ESTADOS } from '../../services/despachoService';
import { daysUntil, parseFechaLarga, toPeriodo } from '../../utils/dateUtils';

export const UMBRAL_CRITICO_DIAS = 7;
export const UMBRAL_PREVENTIVO_DIAS = 30;

const SEVERIDAD_ORDEN = { danger: 0, warning: 1, info: 2 };

function vehiculosOperativos(flota) {
  return flota.filter((vehiculo) => vehiculo.estado === 'Operativo');
}

export function computeDisponibilidadFlota(flota = vehiculos) {
  const total = flota.length;
  const operativos = vehiculosOperativos(flota).length;
  return {
    total,
    operativos,
    porcentaje: total > 0 ? (operativos / total) * 100 : 0,
  };
}

export function computePersonalRodante(despachos, flota = vehiculos) {
  const activos = new Set();
  flota.forEach((vehiculo) => {
    if (vehiculo.conductor && vehiculo.conductor !== 'Sin asignar') activos.add(vehiculo.conductor);
  });

  const enRuta = new Set();
  despachos.forEach((despacho) => {
    if (despacho.estado === DESPACHO_ESTADOS.CANCELADO) return;
    if (despacho.conductor) activos.add(despacho.conductor);
    if (despacho.estado === DESPACHO_ESTADOS.EN_RUTA && despacho.conductor) enRuta.add(despacho.conductor);
  });

  return { total: activos.size, enRuta: enRuta.size };
}

export function computeCumplimientoLegal(flota = vehiculos, referencia = new Date()) {
  let vigentes = 0;
  let total = 0;
  let criticos = 0;
  let vencidos = 0;

  flota.forEach((vehiculo) => {
    [vehiculo.soatVence, vehiculo.rtmVence].forEach((fechaStr) => {
      const fecha = parseFechaLarga(fechaStr);
      if (!fecha) return;
      total += 1;
      const dias = daysUntil(fecha, referencia);
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

export function computeMargenNeto(despachos) {
  const facturables = despachos.filter((despacho) => despacho.estado !== DESPACHO_ESTADOS.CANCELADO);
  if (facturables.length === 0) return null;

  const ingresos = facturables.reduce((acumulado, despacho) => acumulado + Number(despacho.valorFlete || 0), 0);
  const costos = facturables.reduce((acumulado, despacho) => acumulado + Number(despacho.costoOperativo || 0), 0);
  if (ingresos <= 0) return null;

  const margen = ingresos - costos;
  return { ingresos, costos, margen, porcentaje: (margen / ingresos) * 100 };
}

function buildDocAlerta(vehiculo, tipoDocumento, fechaStr, referencia) {
  const fecha = parseFechaLarga(fechaStr);
  if (!fecha) return null;

  const dias = daysUntil(fecha, referencia);
  const detalle = `Placa ${vehiculo.id} (${vehiculo.marca} ${vehiculo.modelo})`;

  if (dias < 0) {
    return { id: `${tipoDocumento}-${vehiculo.id}`, severidad: 'danger', tipo: `${tipoDocumento} Vencido`, detalle, tiempo: `Hace ${Math.abs(dias)} día(s)` };
  }
  if (dias <= UMBRAL_CRITICO_DIAS) {
    return { id: `${tipoDocumento}-${vehiculo.id}`, severidad: 'danger', tipo: `${tipoDocumento} Crítico`, detalle, tiempo: `Vence en ${dias} día(s)` };
  }
  if (dias <= UMBRAL_PREVENTIVO_DIAS) {
    return { id: `${tipoDocumento}-${vehiculo.id}`, severidad: 'warning', tipo: `${tipoDocumento} por vencer`, detalle, tiempo: `Vence en ${dias} días` };
  }
  return null;
}

export function buildAlertas(flota = vehiculos, despachos = [], referencia = new Date()) {
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
        tipo: 'Mantenimiento Preventivo',
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

  return alertas.sort((a, b) => SEVERIDAD_ORDEN[a.severidad] - SEVERIDAD_ORDEN[b.severidad]);
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

export function buildResumen(despachos, flota = vehiculos, referencia = new Date()) {
  return {
    disponibilidad: computeDisponibilidadFlota(flota),
    personal: computePersonalRodante(despachos, flota),
    cumplimiento: computeCumplimientoLegal(flota, referencia),
    margen: computeMargenNeto(despachos),
    alertas: buildAlertas(flota, despachos, referencia),
  };
}
