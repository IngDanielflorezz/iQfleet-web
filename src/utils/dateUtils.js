const MESES_ABREV = {
  ene: 0,
  feb: 1,
  mar: 2,
  abr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  ago: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dic: 11,
};

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

export function parseFechaLarga(value) {
  const match = String(value ?? '').trim().match(/^(\d{1,2})\s+([^\s\d]{3})[^\s]*\s+(\d{4})$/);
  if (!match) return null;
  const dia = Number(match[1]);
  const mes = MESES_ABREV[match[2].toLowerCase()];
  const anio = Number(match[3]);
  if (mes === undefined || Number.isNaN(dia) || Number.isNaN(anio)) return null;
  const date = new Date(anio, mes, dia);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDate(value) {
  if (value instanceof Date) return value;
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
