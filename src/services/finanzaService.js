/**
 * finanzaService — Repositorio de movimientos financieros (ingresos/egresos).
 *
 * Patrón Repository + Adapter: hoy persiste en localStorage; la API pública
 * (listMovimientos / createMovimiento / updateMovimiento / removeMovimiento /
 * subscribeMovimientos) es el contrato que consumen las vistas. Al integrar
 * Supabase solo se sustituye la implementación interna.
 *
 * El comprobante adjunto (Data URL) vive en memoria durante la sesión; en
 * localStorage solo se persisten los metadatos (nombre del archivo).
 */

export const MOVIMIENTO_TIPOS = {
  INGRESO: 'Ingreso',
  EGRESO: 'Egreso',
};

export const CONCEPTOS_INGRESO = ['Flete / Flete Intermunicipal', 'Servicio Especial', 'Ajuste a favor'];
export const CONCEPTOS_EGRESO = [
  'Combustible ACPM',
  'Peajes',
  'Mantenimiento Correctivo',
  'Mantenimiento Preventivo',
  'Nómina Operativa',
  'Seguros',
  'Otros gastos',
];

export const MEDIOS_PAGO = ['Transferencia', 'Efectivo', 'Tarjeta', 'Crédito'];

export const MAX_ARCHIVO_BYTES = 2 * 1024 * 1024; // 2 MB

const MOVIMIENTOS_KEY = 'iqfleet_movimientos';
const SEED_FLAG_KEY = 'iqfleet_movimientos_seeded';
const CHANGED_EVENT = 'iqfleet:movimientos-changed';

const comprobantesEnMemoria = new Map();

function readMovimientos() {
  try {
    const raw = JSON.parse(localStorage.getItem(MOVIMIENTOS_KEY));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeMovimientos(movimientos) {
  localStorage.setItem(MOVIMIENTOS_KEY, JSON.stringify(movimientos));
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
}

function createId() {
  const sufijo = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TX-${Date.now().toString(36).toUpperCase()}${sufijo}`;
}

function normalize(dto) {
  return {
    id: dto.id,
    tipo: dto.tipo ?? MOVIMIENTO_TIPOS.EGRESO,
    concepto: String(dto.concepto ?? '').trim(),
    placa: String(dto.placa ?? '').trim().toUpperCase(),
    conductor: String(dto.conductor ?? '').trim(),
    factura: String(dto.factura ?? '').trim(),
    medioPago: dto.medioPago ?? 'Transferencia',
    monto: Number(dto.monto ?? 0),
    km: dto.km === '' || dto.km === null || dto.km === undefined ? null : Number(dto.km),
    fecha: dto.fecha ?? '',
    comprobanteNombre: String(dto.comprobanteNombre ?? '').trim(),
    comprobanteTipo: dto.comprobanteTipo ?? '',
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function buildInvalidError(fields) {
  const error = new Error('Datos del movimiento inválidos');
  error.fields = fields;
  return error;
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

export function validateComprobante(file) {
  if (!file) return null;
  if (file.size > MAX_ARCHIVO_BYTES) return `El archivo supera el máximo de ${MAX_ARCHIVO_BYTES / (1024 * 1024)} MB.`;
  const permitido = ['image/png', 'image/jpeg', 'application/pdf'];
  if (!permitido.includes(file.type)) return 'Formato no permitido (usa PNG, JPG o PDF).';
  return null;
}

// ---------------------------------------------------------------
// Validación de dominio
// ---------------------------------------------------------------
export function validateMovimiento(dto) {
  const errores = {};

  if (!String(dto.concepto ?? '').trim()) errores.concepto = 'El concepto es obligatorio.';
  if (!dto.fecha) errores.fecha = 'La fecha es obligatoria.';

  const monto = Number(dto.monto);
  if (!Number.isFinite(monto) || monto <= 0) errores.monto = 'El monto debe ser mayor a 0.';

  if (dto.km !== '' && dto.km !== null && dto.km !== undefined) {
    const km = Number(dto.km);
    if (!Number.isFinite(km) || km < 0) errores.km = 'El kilometraje no puede ser negativo.';
  }

  return errores;
}

// ---------------------------------------------------------------
// API pública (CRUD)
// ---------------------------------------------------------------
export function listMovimientos() {
  return readMovimientos().sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
}

export function createMovimiento(dto, { file } = {}) {
  const errores = validateMovimiento(dto);
  if (Object.keys(errores).length > 0) throw buildInvalidError(errores);

  const now = new Date().toISOString();
  const movimiento = normalize({
    ...dto,
    id: createId(),
    comprobanteNombre: dto.comprobanteNombre || file?.name || '',
    comprobanteTipo: file?.type || '',
    createdAt: now,
    updatedAt: now,
  });
  writeMovimientos([movimiento, ...readMovimientos()]);
  return movimiento;
}

export function updateMovimiento(id, dto) {
  const movimientos = readMovimientos();
  const actual = movimientos.find((movimiento) => movimiento.id === id);
  if (!actual) throw new Error(`Movimiento ${id} no encontrado`);

  const errores = validateMovimiento({ ...actual, ...dto, id });
  if (Object.keys(errores).length > 0) throw buildInvalidError(errores);

  const actualizado = normalize({ ...actual, ...dto, id, updatedAt: new Date().toISOString() });
  writeMovimientos(movimientos.map((movimiento) => (movimiento.id === id ? actualizado : movimiento)));
  return actualizado;
}

export function removeMovimiento(id) {
  const movimientos = readMovimientos();
  const restantes = movimientos.filter((movimiento) => movimiento.id !== id);
  if (restantes.length === movimientos.length) return false;
  comprobantesEnMemoria.delete(id);
  writeMovimientos(restantes);
  return true;
}

/**
 * Adjunta (o reemplaza) el comprobante de un movimiento. Guarda el Data URL
 * en memoria y el nombre del archivo en localStorage.
 */
export async function attachComprobante(id, file) {
  const errorArchivo = validateComprobante(file);
  if (errorArchivo) throw new Error(errorArchivo);

  const dataUrl = await readFileAsDataURL(file);
  comprobantesEnMemoria.set(id, { dataUrl, nombre: file.name, tipo: file.type });

  const movimientos = readMovimientos();
  const actual = movimientos.find((movimiento) => movimiento.id === id);
  if (actual) {
    const actualizado = normalize({
      ...actual,
      comprobanteNombre: file.name,
      comprobanteTipo: file.type,
      updatedAt: new Date().toISOString(),
    });
    writeMovimientos(movimientos.map((movimiento) => (movimiento.id === id ? actualizado : movimiento)));
  }
  return { dataUrl, nombre: file.name };
}

export function getComprobante(id) {
  return comprobantesEnMemoria.get(id) ?? null;
}

/**
 * Observer: emite la lista ante cambios en otra pestaña (evento "storage")
 * y en la misma pestaña (evento custom). Emite un primer valor al suscribir.
 */
export function subscribeMovimientos(callback) {
  const handleChange = () => callback(listMovimientos());

  window.addEventListener('storage', handleChange);
  window.addEventListener(CHANGED_EVENT, handleChange);
  handleChange();

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener(CHANGED_EVENT, handleChange);
  };
}

// ---------------------------------------------------------------
// Semilla de demostración (una sola vez). Movimientos de los últimos 3 meses.
// ---------------------------------------------------------------
function fechaMovimiento(mesOffset, dia) {
  const base = new Date();
  const objetivo = new Date(base.getFullYear(), base.getMonth() + mesOffset, dia);
  const mes = String(objetivo.getMonth() + 1).padStart(2, '0');
  const diaStr = String(objetivo.getDate()).padStart(2, '0');
  return `${objetivo.getFullYear()}-${mes}-${diaStr}`;
}

const SEED_DEFINICIONES = [
  { tipo: 'Ingreso', concepto: 'Flete / Flete Intermunicipal', placa: 'UVP-123', conductor: 'Juan Pérez', factura: 'FE-100234', medioPago: 'Transferencia', monto: 4200000, km: 640, mes: 0, dia: 3 },
  { tipo: 'Egreso', concepto: 'Combustible ACPM', placa: 'UVP-123', conductor: 'Juan Pérez', factura: 'AC-77120', medioPago: 'Tarjeta', monto: 1850000, km: 640, mes: 0, dia: 3 },
  { tipo: 'Egreso', concepto: 'Peajes', placa: 'UVP-123', conductor: 'Juan Pérez', factura: 'FP-2201', medioPago: 'Tarjeta', monto: 320000, km: 640, mes: 0, dia: 3 },
  { tipo: 'Ingreso', concepto: 'Flete / Flete Intermunicipal', placa: 'WZA-456', conductor: 'Carlos Rodríguez', factura: 'FE-100251', medioPago: 'Transferencia', monto: 3100000, km: 400, mes: 0, dia: 5 },
  { tipo: 'Egreso', concepto: 'Mantenimiento Correctivo', placa: 'TRL-890', conductor: 'Andrés Gómez', factura: 'MC-8890', medioPago: 'Crédito', monto: 980000, km: null, mes: 0, dia: 8 },
  { tipo: 'Ingreso', concepto: 'Servicio Especial', placa: 'EQZ-912', conductor: 'Luis Martínez', factura: 'FE-100268', medioPago: 'Transferencia', monto: 2400000, km: 300, mes: 0, dia: 9 },
  { tipo: 'Egreso', concepto: 'Nómina Operativa', placa: '', conductor: 'Personal operativo', factura: 'NOM-1004', medioPago: 'Transferencia', monto: 2200000, km: null, mes: 0, dia: 10 },
  { tipo: 'Ingreso', concepto: 'Flete / Flete Intermunicipal', placa: 'TRL-890', conductor: 'Andrés Gómez', factura: 'FE-100110', medioPago: 'Transferencia', monto: 5100000, km: 780, mes: -1, dia: 12 },
  { tipo: 'Egreso', concepto: 'Combustible ACPM', placa: 'TRL-890', conductor: 'Andrés Gómez', factura: 'AC-76980', medioPago: 'Tarjeta', monto: 2100000, km: 780, mes: -1, dia: 12 },
  { tipo: 'Ingreso', concepto: 'Flete / Flete Intermunicipal', placa: 'UVP-123', conductor: 'Juan Pérez', factura: 'FE-100120', medioPago: 'Transferencia', monto: 3600000, km: 520, mes: -1, dia: 20 },
  { tipo: 'Egreso', concepto: 'Mantenimiento Preventivo', placa: 'WZA-456', conductor: 'Carlos Rodríguez', factura: 'MP-4410', medioPago: 'Crédito', monto: 760000, km: null, mes: -1, dia: 22 },
  { tipo: 'Ingreso', concepto: 'Flete / Flete Intermunicipal', placa: 'WZA-456', conductor: 'Carlos Rodríguez', factura: 'FE-100098', medioPago: 'Transferencia', monto: 1500000, km: 220, mes: -1, dia: 9 },
  { tipo: 'Ingreso', concepto: 'Flete / Flete Intermunicipal', placa: 'KLM-334', conductor: 'Diego Herrera', factura: 'FE-099980', medioPago: 'Transferencia', monto: 4400000, km: 700, mes: -2, dia: 14 },
  { tipo: 'Egreso', concepto: 'Combustible ACPM', placa: 'KLM-334', conductor: 'Diego Herrera', factura: 'AC-76540', medioPago: 'Tarjeta', monto: 1900000, km: 700, mes: -2, dia: 14 },
  { tipo: 'Ingreso', concepto: 'Servicio Especial', placa: 'TRL-890', conductor: 'Andrés Gómez', factura: 'FE-099995', medioPago: 'Efectivo', monto: 3300000, km: 610, mes: -2, dia: 22 },
  { tipo: 'Egreso', concepto: 'Seguros', placa: 'KLM-334', conductor: 'Diego Herrera', factura: 'SEG-2201', medioPago: 'Transferencia', monto: 640000, km: null, mes: -2, dia: 6 },
];

function buildSeedMovimientos() {
  const now = new Date().toISOString();
  return SEED_DEFINICIONES.map((definicion, indice) =>
    normalize({
      ...definicion,
      fecha: fechaMovimiento(definicion.mes, definicion.dia),
      id: `TX-SEED-${String(indice + 1).padStart(2, '0')}`,
      comprobanteNombre: '',
      comprobanteTipo: '',
      createdAt: now,
      updatedAt: now,
    }),
  );
}

export function ensureSeedMovimientos() {
  if (localStorage.getItem(SEED_FLAG_KEY)) return listMovimientos();
  const semilla = buildSeedMovimientos();
  localStorage.setItem(MOVIMIENTOS_KEY, JSON.stringify(semilla));
  localStorage.setItem(SEED_FLAG_KEY, '1');
  return semilla;
}

ensureSeedMovimientos();
