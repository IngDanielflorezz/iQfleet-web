function escapeCell(value) {
  const texto = value === null || value === undefined ? '' : String(value);
  if (/[";\n]/.test(texto)) return `"${texto.replace(/"/g, '""')}"`;
  return texto;
}

/**
 * Construye un CSV (delimitador ';' para Excel en es-CO) a partir de filas
 * y una definición de columnas [{ key, label }].
 */
export function buildExportCSV(rows, columns) {
  const encabezado = columns.map((column) => escapeCell(column.label)).join(';');
  const cuerpo = rows.map((row) => columns.map((column) => escapeCell(row[column.key])).join(';'));
  return [encabezado, ...cuerpo].join('\r\n');
}

export function downloadCSV(filename, csvContent) {
  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
