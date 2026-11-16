const MESES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const MESES_ABREV_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function toDate(value) {
  if (value instanceof Date) return value;
  // "YYYY-MM-DD" (DateOnly de la API) es una fecha de calendario: se interpreta en hora local.
  // new Date('2025-10-25') la tomaría como medianoche UTC, que en Colombia es el día 24.
  const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ''));
  if (soloFecha) return new Date(Number(soloFecha[1]), Number(soloFecha[2]) - 1, Number(soloFecha[3]));
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toPeriodo(value) {
  const date = toDate(value);
  if (!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function periodoLabel(periodo) {
  if (!/^\d{4}-\d{2}$/.test(String(periodo ?? ''))) return 'Todos';
  const [anio, mes] = periodo.split('-').map(Number);
  return `${MESES_ES[mes - 1]} ${anio}`;
}

export function formatFechaCorta(value) {
  const date = toDate(value);
  if (!date) return '—';
  return `${date.getDate()} ${MESES_ABREV_ES[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatFechaHora(value) {
  const date = toDate(value);
  if (!date) return '—';
  const horas = String(date.getHours()).padStart(2, '0');
  const minutos = String(date.getMinutes()).padStart(2, '0');
  return `${formatFechaCorta(date)} · ${horas}:${minutos}`;
}

export function formatHoraCorta(value) {
  const date = toDate(value);
  if (!date) return '—';
  const horas = String(date.getHours()).padStart(2, '0');
  const minutos = String(date.getMinutes()).padStart(2, '0');
  return `${horas}:${minutos}`;
}

export function startOfDay(value) {
  const date = toDate(value);
  if (!date) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function daysUntil(value, reference = new Date()) {
  const objetivo = startOfDay(value);
  const base = startOfDay(reference);
  if (!objetivo || !base) return null;
  return Math.round((objetivo.getTime() - base.getTime()) / 86400000);
}

export function toDateTimeLocalValue(value) {
  const date = toDate(value) ?? new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
