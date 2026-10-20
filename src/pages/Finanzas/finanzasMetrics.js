import { formatCOP, formatNumber, formatPercent } from '../../utils/format';

export const TIPO_INGRESO = 'Ingreso';
export const TIPO_EGRESO = 'Egreso';

function sumar(movimientos, tipo) {
  return movimientos
    .filter((movimiento) => movimiento.tipo === tipo)
    .reduce((total, movimiento) => total + Number(movimiento.monto || 0), 0);
}

function periodoDe(fecha) {
  return String(fecha || '').slice(0, 7); // YYYY-MM
}

/**
 * KPIs financieros del período: ingresos, egresos, margen neto y costo/km.
 * Incluye variación frente al período anterior (mismo mes del rango previo).
 */
export function computeFinanzasResumen(movimientos, periodo) {
  const delPeriodo = movimientos.filter((movimiento) => periodoDe(movimiento.fecha) === periodo);
  const delAnterior = movimientos.filter((movimiento) => periodoDe(movimiento.fecha) === periodoAnterior(periodo));

  const ingresos = sumar(delPeriodo, TIPO_INGRESO);
  const egresos = sumar(delPeriodo, TIPO_EGRESO);
  const margen = ingresos - egresos;

  const ingresosPrevios = sumar(delAnterior, TIPO_INGRESO);

  const kmTotales = delPeriodo.reduce(
    (total, movimiento) => total + Number(movimiento.km || 0),
    0,
  );

  return {
    ingresos,
    egresos,
    margen,
    rentabilidad: ingresos > 0 ? (margen / ingresos) * 100 : 0,
    costoPorKm: kmTotales > 0 ? egresos / kmTotales : 0,
    kmTotales,
    variacionIngresos: ingresosPrevios > 0 ? ((ingresos - ingresosPrevios) / ingresosPrevios) * 100 : null,
    ingresosPrevios,
    totalMovimientos: delPeriodo.length,
  };
}

/**
 * Desglose de egresos agrupado por concepto, ordenado de mayor a menor.
 */
export function desgloseEgresos(movimientos, periodo) {
  const porConcepto = new Map();

  movimientos
    .filter((movimiento) => movimiento.tipo === TIPO_EGRESO && periodoDe(movimiento.fecha) === periodo)
    .forEach((movimiento) => {
      const acumulado = porConcepto.get(movimiento.concepto) || 0;
      porConcepto.set(movimiento.concepto, acumulado + Number(movimiento.monto || 0));
    });

  const total = [...porConcepto.values()].reduce((suma, valor) => suma + valor, 0);

  return [...porConcepto.entries()]
    .map(([concepto, monto]) => ({ concepto, monto, porcentaje: total > 0 ? (monto / total) * 100 : 0 }))
    .sort((a, b) => b.monto - a.monto);
}

/**
 * Balance por unidad (placa): ingresos vs costos del período y margen.
 * Ordenado por ingresos generados (mayor primero).
 */
export function balancePorUnidad(movimientos, periodo) {
  const porPlaca = new Map();

  movimientos
    .filter((movimiento) => periodoDe(movimiento.fecha) === periodo && movimiento.placa)
    .forEach((movimiento) => {
      const actual = porPlaca.get(movimiento.placa) || {
        placa: movimiento.placa,
        conductor: movimiento.conductor,
        ingresos: 0,
        egresos: 0,
        km: 0,
      };
      const monto = Number(movimiento.monto || 0);
      if (movimiento.tipo === TIPO_INGRESO) actual.ingresos += monto;
      else actual.egresos += monto;
      actual.km += Number(movimiento.km || 0);
      if (!actual.conductor && movimiento.conductor) actual.conductor = movimiento.conductor;
      porPlaca.set(movimiento.placa, actual);
    });

  return [...porPlaca.values()]
    .map((unidad) => ({ ...unidad, margen: unidad.ingresos - unidad.egresos }))
    .sort((a, b) => b.ingresos - a.ingresos);
}

export function periodoAnterior(periodo) {
  const [anio, mes] = String(periodo).split('-').map(Number);
  if (!anio || !mes) return periodo;
  const fecha = new Date(anio, mes - 2, 1);
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
}

export function periodosDisponibles(movimientos) {
  const set = new Set(movimientos.map((movimiento) => periodoDe(movimiento.fecha)));
  return [...set].filter(Boolean).sort((a, b) => b.localeCompare(a));
}

export function periodoLabel(periodo) {
  const [anio, mes] = String(periodo).split('-').map(Number);
  if (!anio || !mes) return periodo;
  const nombre = new Date(anio, mes - 1, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}

/**
 * Filtra por búsqueda libre (concepto, placa, conductor, factura) y por tipo.
 */
export function filtrarMovimientos(movimientos, { busqueda = '', tipo = 'Todos' } = {}) {
  const termino = busqueda.trim().toLowerCase();

  return movimientos.filter((movimiento) => {
    if (tipo !== 'Todos' && movimiento.tipo !== tipo) return false;
    if (!termino) return true;
    return [
      movimiento.concepto,
      movimiento.placa,
      movimiento.conductor,
      movimiento.factura,
      movimiento.medioPago,
    ]
      .filter(Boolean)
      .some((campo) => String(campo).toLowerCase().includes(termino));
  });
}

export function resumenTexto(resumen) {
  const partes = [
    `Ingresos ${formatCOP(resumen.ingresos)}`,
    `Egresos ${formatCOP(resumen.egresos)}`,
    `Margen ${formatCOP(resumen.margen)}`,
  ];
  if (resumen.kmTotales > 0) partes.push(`${formatNumber(resumen.kmTotales)} km`);
  return partes.join(' · ');
}

export { formatCOP, formatPercent };
