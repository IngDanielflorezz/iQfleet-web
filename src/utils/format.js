const COP_FORMATTER = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const NUMBER_FORMATTER = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 1,
});

export function formatCOP(value) {
  const numero = Number(value);
  return Number.isFinite(numero) ? COP_FORMATTER.format(numero) : '—';
}

export function formatNumber(value) {
  const numero = Number(value);
  return Number.isFinite(numero) ? NUMBER_FORMATTER.format(numero) : '—';
}

export function formatPercent(value) {
  const numero = Number(value);
  return Number.isFinite(numero) ? `${numero.toFixed(1)}%` : '—';
}
