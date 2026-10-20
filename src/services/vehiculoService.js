/**
 * vehiculoService — Repositorio de la flota (parque automotor).
 *
 * Patrón Repository + Adapter: hoy persiste en localStorage, migrando la
 * semilla de src/data/vehiculos.js la primera vez. La API pública
 * (listVehiculos / createVehiculo / updateVehiculo / removeVehiculo /
 * subscribeVehiculos) es el contrato que consumen las vistas; al integrar
 * Supabase solo se sustituye la implementación interna.
 */

import { vehiculos as vehiculosSemilla } from '../data/vehiculos';

export const VEHICULO_ESTADOS = {
  OPERATIVO: 'Operativo',
  MANTENIMIENTO: 'Mantenimiento',
  FUERA_DE_SERVICIO: 'Fuera de servicio',
};

export const VEHICULO_ESTADO_LIST = Object.values(VEHICULO_ESTADOS);

export const estadoVehiculoVariants = {
  [VEHICULO_ESTADOS.OPERATIVO]: 'success',
  [VEHICULO_ESTADOS.MANTENIMIENTO]: 'warning',
  [VEHICULO_ESTADOS.FUERA_DE_SERVICIO]: 'danger',
};

export const VEHICULO_TIPOS = ['Bus', 'Buseta', 'Bus Intermunicipal', 'Bus Padrón', 'Camión', 'Van', 'Camioneta'];

export const VEHICULO_CIUDADES = ['BOGOTA D.C.', 'VALLEDUPAR', 'BARRANQUILLA', 'MEDELLÍN', 'CALI', 'SANTA MARTA'];

const VEHICULOS_KEY = 'iqfleet_vehiculos';
const SEED_FLAG_KEY = 'iqfleet_vehiculos_seeded';
const CHANGED_EVENT = 'iqfleet:vehiculos-changed';

// ---------------------------------------------------------------
// Persistencia (adaptador localStorage)
// ---------------------------------------------------------------
function readVehiculos() {
  try {
    const raw = JSON.parse(localStorage.getItem(VEHICULOS_KEY));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeVehiculos(vehiculos) {
  localStorage.setItem(VEHICULOS_KEY, JSON.stringify(vehiculos));
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
}

function normalize(dto) {
  return {
    id: String(dto.id ?? '').trim().toUpperCase(),
    ciudad: String(dto.ciudad ?? '').trim().toUpperCase(),
    marca: String(dto.marca ?? '').trim(),
    modelo: String(dto.modelo ?? '').trim(),
    tipo: dto.tipo ?? 'Bus',
    anio: Number(dto.anio ?? new Date().getFullYear()),
    conductorId: dto.conductorId ?? '',
    conductor: String(dto.conductor ?? '').trim() || 'Sin asignar',
    kilometraje: Number(dto.kilometraje ?? 0),
    estado: dto.estado ?? VEHICULO_ESTADOS.OPERATIVO,
    soatVence: dto.soatVence ?? '',
    rtmVence: dto.rtmVence ?? '',
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function buildInvalidError(fields) {
  const error = new Error('Datos de vehículo inválidos');
  error.fields = fields;
  return error;
}

// ---------------------------------------------------------------
// Validación de dominio
// ---------------------------------------------------------------
export function validateVehiculo(dto, { vehiculos = readVehiculos(), ignoreId = null } = {}) {
  const errores = {};
  const placa = String(dto.id ?? '').trim().toUpperCase();

  if (!placa) errores.id = 'La placa es obligatoria.';
  else if (!/^[A-Z0-9]{3}-?[A-Z0-9]{2,3}$/.test(placa)) errores.id = 'Formato de placa inválido (ej. UVP-123).';
  else if (vehiculos.some((vehiculo) => vehiculo.id !== ignoreId && vehiculo.id === placa)) {
    errores.id = 'Ya existe un vehículo con esa placa.';
  }

  if (!String(dto.marca ?? '').trim()) errores.marca = 'La marca es obligatoria.';
  if (!String(dto.modelo ?? '').trim()) errores.modelo = 'El modelo es obligatorio.';
  if (!dto.ciudad) errores.ciudad = 'La ciudad es obligatoria.';

  const anio = Number(dto.anio);
  const anioActual = new Date().getFullYear();
  if (!Number.isInteger(anio) || anio < 1980 || anio > anioActual + 1) {
    errores.anio = `Año inválido (entre 1980 y ${anioActual + 1}).`;
  }

  if (Number(dto.kilometraje) < 0) errores.kilometraje = 'El kilometraje no puede ser negativo.';
  if (!dto.soatVence) errores.soatVence = 'La fecha de SOAT es obligatoria.';
  if (!dto.rtmVence) errores.rtmVence = 'La fecha de RTM es obligatoria.';

  return errores;
}

// ---------------------------------------------------------------
// API pública (CRUD)
// ---------------------------------------------------------------
export function listVehiculos() {
  return readVehiculos().sort((a, b) => a.id.localeCompare(b.id, 'es'));
}

export function getVehiculo(id) {
  return readVehiculos().find((vehiculo) => vehiculo.id === id) ?? null;
}

export function createVehiculo(dto) {
  const errores = validateVehiculo(dto);
  if (Object.keys(errores).length > 0) throw buildInvalidError(errores);

  const now = new Date().toISOString();
  const vehiculo = normalize({ ...dto, createdAt: now, updatedAt: now });
  writeVehiculos([...readVehiculos(), vehiculo]);
  return vehiculo;
}

export function updateVehiculo(id, dto) {
  const vehiculos = readVehiculos();
  const actual = vehiculos.find((vehiculo) => vehiculo.id === id);
  if (!actual) throw new Error(`Vehículo ${id} no encontrado`);

  const errores = validateVehiculo({ ...actual, ...dto, id: dto.id ?? actual.id }, { vehiculos, ignoreId: id });
  if (Object.keys(errores).length > 0) throw buildInvalidError(errores);

  const actualizado = normalize({ ...actual, ...dto, updatedAt: new Date().toISOString() });
  writeVehiculos(vehiculos.map((vehiculo) => (vehiculo.id === id ? actualizado : vehiculo)));
  return actualizado;
}

export function removeVehiculo(id) {
  const vehiculos = readVehiculos();
  const restantes = vehiculos.filter((vehiculo) => vehiculo.id !== id);
  if (restantes.length === vehiculos.length) return false;
  writeVehiculos(restantes);
  return true;
}

/**
 * Observer: emite la lista ante cambios en otra pestaña (evento "storage")
 * y en la misma pestaña (evento custom). Emite un primer valor al suscribir.
 */
export function subscribeVehiculos(callback) {
  const handleChange = () => callback(listVehiculos());

  window.addEventListener('storage', handleChange);
  window.addEventListener(CHANGED_EVENT, handleChange);
  handleChange();

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener(CHANGED_EVENT, handleChange);
  };
}

/**
 * Semilla: migra la lista de src/data/vehiculos.js la primera vez, convirtiendo
 * las fechas de texto ("25 Oct 2024") a ISO (YYYY-MM-DD).
 */
export function ensureSeedVehiculos() {
  if (localStorage.getItem(SEED_FLAG_KEY)) return listVehiculos();

  const ahora = new Date().toISOString();
  const semilla = vehiculosSemilla.map((vehiculo) =>
    normalize({
      ...vehiculo,
      conductorId: '',
      soatVence: toISODate(vehiculo.soatVence),
      rtmVence: toISODate(vehiculo.rtmVence),
      createdAt: ahora,
      updatedAt: ahora,
    }),
  );
  localStorage.setItem(VEHICULOS_KEY, JSON.stringify(semilla));
  localStorage.setItem(SEED_FLAG_KEY, '1');
  return semilla;
}

const MESES = {
  ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6,
  jul: 7, ago: 8, sep: 9, oct: 10, nov: 11, dic: 12,
};

function toISODate(value) {
  const match = String(value ?? '').trim().match(/^(\d{1,2})\s+([^\s\d]{3})[^\s]*\s+(\d{4})$/);
  if (!match) return '';
  const mes = MESES[match[2].toLowerCase()];
  if (!mes) return '';
  return `${match[3]}-${String(mes).padStart(2, '0')}-${String(match[1]).padStart(2, '0')}`;
}

ensureSeedVehiculos();
