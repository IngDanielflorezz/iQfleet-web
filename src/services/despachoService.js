/**
 * despachoService — Repositorio de despachos (fletes) operativos.
 *
 * Patrón Repository + Adapter: hoy persiste en localStorage, pero la API
 * pública (listDespachos / createDespacho / updateDespacho / removeDespacho /
 * subscribeDespachos) es el contrato que consumen las vistas. Al integrar
 * Supabase solo se sustituye la implementación interna, sin tocar la UI.
 */

import { vehiculos } from '../data/vehiculos';

export const DESPACHO_ESTADOS = {
  PROGRAMADO: 'Programado',
  EN_RUTA: 'En ruta',
  COMPLETADO: 'Completado',
  CANCELADO: 'Cancelado',
};

export const DESPACHO_ESTADO_LIST = Object.values(DESPACHO_ESTADOS);

export const DESPACHO_ESTADOS_ACTIVOS = [DESPACHO_ESTADOS.PROGRAMADO, DESPACHO_ESTADOS.EN_RUTA];

export const despachoEstadoVariant = {
  [DESPACHO_ESTADOS.PROGRAMADO]: 'info',
  [DESPACHO_ESTADOS.EN_RUTA]: 'warning',
  [DESPACHO_ESTADOS.COMPLETADO]: 'success',
  [DESPACHO_ESTADOS.CANCELADO]: 'danger',
};

const DESPACHOS_KEY = 'iqfleet_despachos';
const SEED_FLAG_KEY = 'iqfleet_despachos_seeded';
const CHANGED_EVENT = 'iqfleet:despachos-changed';

// ---------------------------------------------------------------
// Persistencia (adaptador localStorage)
// ---------------------------------------------------------------
function readDespachos() {
  try {
    const raw = JSON.parse(localStorage.getItem(DESPACHOS_KEY));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeDespachos(despachos) {
  localStorage.setItem(DESPACHOS_KEY, JSON.stringify(despachos));
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
}

function createId() {
  const sufijo = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DSP-${Date.now().toString(36).toUpperCase()}${sufijo}`;
}

function normalize(dto) {
  return {
    id: dto.id,
    placa: String(dto.placa ?? '').trim().toUpperCase(),
    conductor: String(dto.conductor ?? '').trim(),
    origen: String(dto.origen ?? '').trim(),
    destino: String(dto.destino ?? '').trim(),
    fechaSalida: dto.fechaSalida,
    estado: dto.estado ?? DESPACHO_ESTADOS.PROGRAMADO,
    valorFlete: Number(dto.valorFlete ?? 0),
    costoOperativo: Number(dto.costoOperativo ?? 0),
    observaciones: String(dto.observaciones ?? '').trim(),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function buildInvalidError(fields) {
  const error = new Error('Datos de despacho inválidos');
  error.fields = fields;
  return error;
}

// ---------------------------------------------------------------
// Validación de dominio
// ---------------------------------------------------------------
export function validateDespacho(dto, { despachos = readDespachos(), ignoreId = null } = {}) {
  const errores = {};

  if (!dto.placa) errores.placa = 'Selecciona un vehículo.';
  if (!String(dto.conductor ?? '').trim()) errores.conductor = 'El conductor es obligatorio.';
  if (!String(dto.origen ?? '').trim()) errores.origen = 'El origen es obligatorio.';
  if (!String(dto.destino ?? '').trim()) errores.destino = 'El destino es obligatorio.';
  if (!dto.fechaSalida) errores.fechaSalida = 'La fecha de salida es obligatoria.';
  if (Number(dto.valorFlete) < 0) errores.valorFlete = 'El flete no puede ser negativo.';
  if (Number(dto.costoOperativo) < 0) errores.costoOperativo = 'El costo no puede ser negativo.';

  const estado = dto.estado ?? DESPACHO_ESTADOS.PROGRAMADO;
  const esActivo = DESPACHO_ESTADOS_ACTIVOS.includes(estado);

  if (!errores.placa && !errores.fechaSalida && esActivo) {
    const dia = String(dto.fechaSalida).slice(0, 10);
    const choque = despachos.find(
      (despacho) =>
        despacho.id !== ignoreId &&
        despacho.placa === String(dto.placa).trim().toUpperCase() &&
        String(despacho.fechaSalida).slice(0, 10) === dia &&
        DESPACHO_ESTADOS_ACTIVOS.includes(despacho.estado),
    );
    if (choque) {
      errores.placa = `El vehículo ${dto.placa} ya tiene un despacho activo ese día.`;
    }
  }

  return errores;
}

// ---------------------------------------------------------------
// API pública (CRUD)
// ---------------------------------------------------------------
export function listDespachos() {
  return readDespachos().sort((a, b) => String(b.fechaSalida).localeCompare(String(a.fechaSalida)));
}

export function getDespachosByPeriodo(periodo) {
  const despachos = listDespachos();
  if (!periodo) return despachos;
  return despachos.filter((despacho) => String(despacho.fechaSalida).slice(0, 7) === periodo);
}

export function createDespacho(dto) {
  const errores = validateDespacho(dto);
  if (Object.keys(errores).length > 0) throw buildInvalidError(errores);

  const now = new Date().toISOString();
  const despacho = normalize({ ...dto, id: createId(), createdAt: now, updatedAt: now });
  writeDespachos([despacho, ...readDespachos()]);
  return despacho;
}

export function updateDespacho(id, dto) {
  const despachos = readDespachos();
  const actual = despachos.find((despacho) => despacho.id === id);
  if (!actual) throw new Error(`Despacho ${id} no encontrado`);

  const errores = validateDespacho({ ...actual, ...dto, id }, { despachos, ignoreId: id });
  if (Object.keys(errores).length > 0) throw buildInvalidError(errores);

  const actualizado = normalize({ ...actual, ...dto, id, updatedAt: new Date().toISOString() });
  writeDespachos(despachos.map((despacho) => (despacho.id === id ? actualizado : despacho)));
  return actualizado;
}

export function removeDespacho(id) {
  const despachos = readDespachos();
  const restantes = despachos.filter((despacho) => despacho.id !== id);
  if (restantes.length === despachos.length) return false;
  writeDespachos(restantes);
  return true;
}

/**
 * Observer: emite la lista ante cambios en otra pestaña (evento "storage")
 * y en la misma pestaña (evento custom). Emite un primer valor al suscribir.
 * Devuelve la función de limpieza.
 */
export function subscribeDespachos(callback) {
  const handleChange = () => callback(listDespachos());

  window.addEventListener('storage', handleChange);
  window.addEventListener(CHANGED_EVENT, handleChange);
  handleChange();

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener(CHANGED_EVENT, handleChange);
  };
}

// ---------------------------------------------------------------
// Semilla de demostración (una sola vez)
// ---------------------------------------------------------------
function fechaSeed(mesOffset, dia, hora) {
  const base = new Date();
  const objetivo = new Date(base.getFullYear(), base.getMonth() + mesOffset, dia);
  const mes = String(objetivo.getMonth() + 1).padStart(2, '0');
  const diaStr = String(objetivo.getDate()).padStart(2, '0');
  return `${objetivo.getFullYear()}-${mes}-${diaStr}T${hora}:00`;
}

const SEED_DEFINICIONES = [
  { placa: 'UVP-123', conductor: 'Juan Pérez', origen: 'Bogotá D.C.', destino: 'Valledupar', mesOffset: 0, dia: 3, hora: '05:30', estado: 'En ruta', valorFlete: 4200000, costoOperativo: 2650000 },
  { placa: 'WZA-456', conductor: 'Carlos Rodríguez', origen: 'Bogotá D.C.', destino: 'Bucaramanga', mesOffset: 0, dia: 5, hora: '06:00', estado: 'Programado', valorFlete: 3100000, costoOperativo: 1950000 },
  { placa: 'EQZ-912', conductor: 'Luis Martínez', origen: 'Valledupar', destino: 'Santa Marta', mesOffset: 0, dia: 1, hora: '07:15', estado: 'Completado', valorFlete: 2400000, costoOperativo: 1500000 },
  { placa: 'KLM-334', conductor: 'Diego Herrera', origen: 'Barranquilla', destino: 'Cartagena', mesOffset: 0, dia: 8, hora: '04:45', estado: 'Programado', valorFlete: 2800000, costoOperativo: 1700000 },
  { placa: 'TRL-890', conductor: 'Andrés Gómez', origen: 'Valledupar', destino: 'Bogotá D.C.', mesOffset: -1, dia: 12, hora: '05:00', estado: 'Completado', valorFlete: 5100000, costoOperativo: 3400000 },
  { placa: 'UVP-123', conductor: 'Juan Pérez', origen: 'Bogotá D.C.', destino: 'Ibagué', mesOffset: -1, dia: 20, hora: '06:30', estado: 'Completado', valorFlete: 3600000, costoOperativo: 2300000 },
  { placa: 'EQZ-912', conductor: 'Luis Martínez', origen: 'Valledupar', destino: 'Riohacha', mesOffset: -1, dia: 25, hora: '07:00', estado: 'Cancelado', valorFlete: 1900000, costoOperativo: 0 },
  { placa: 'WZA-456', conductor: 'Carlos Rodríguez', origen: 'Bogotá D.C.', destino: 'Tunja', mesOffset: -1, dia: 9, hora: '05:45', estado: 'Completado', valorFlete: 1500000, costoOperativo: 980000 },
  { placa: 'KLM-334', conductor: 'Diego Herrera', origen: 'Barranquilla', destino: 'Valledupar', mesOffset: -2, dia: 14, hora: '04:30', estado: 'Completado', valorFlete: 4400000, costoOperativo: 2950000 },
  { placa: 'TRL-890', conductor: 'Andrés Gómez', origen: 'Valledupar', destino: 'Bucaramanga', mesOffset: -2, dia: 22, hora: '06:10', estado: 'Completado', valorFlete: 3300000, costoOperativo: 2100000 },
  { placa: 'UVP-123', conductor: 'Juan Pérez', origen: 'Bogotá D.C.', destino: 'Villavicencio', mesOffset: -2, dia: 6, hora: '05:20', estado: 'Completado', valorFlete: 2600000, costoOperativo: 1650000 },
  { placa: 'PQR-778', conductor: 'Miguel Torres', origen: 'Bogotá D.C.', destino: 'Girardot', mesOffset: -2, dia: 18, hora: '07:30', estado: 'Completado', valorFlete: 1400000, costoOperativo: 900000 },
];

function buildSeedDespachos() {
  const now = new Date().toISOString();
  return SEED_DEFINICIONES.map((definicion, indice) =>
    normalize({
      ...definicion,
      fechaSalida: fechaSeed(definicion.mesOffset, definicion.dia, definicion.hora),
      observaciones: '',
      id: `DSP-SEED-${String(indice + 1).padStart(2, '0')}`,
      createdAt: now,
      updatedAt: now,
    }),
  );
}

export function ensureSeedDespachos() {
  if (localStorage.getItem(SEED_FLAG_KEY)) return listDespachos();
  const semilla = buildSeedDespachos();
  localStorage.setItem(DESPACHOS_KEY, JSON.stringify(semilla));
  localStorage.setItem(SEED_FLAG_KEY, '1');
  return semilla;
}

export function getConductoresConocidos(despachos = readDespachos()) {
  const conductores = new Set();
  vehiculos.forEach((vehiculo) => {
    if (vehiculo.conductor && vehiculo.conductor !== 'Sin asignar') conductores.add(vehiculo.conductor);
  });
  despachos.forEach((despacho) => {
    if (despacho.conductor) conductores.add(despacho.conductor);
  });
  return [...conductores].sort((a, b) => a.localeCompare(b, 'es'));
}

ensureSeedDespachos();
