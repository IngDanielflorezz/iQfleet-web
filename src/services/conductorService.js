/**
 * conductorService — Repositorio de conductores (personal operativo).
 *
 * Patrón Repository + Adapter: hoy persiste en localStorage, pero la API
 * pública (listConductores / createConductor / updateConductor /
 * removeConductor / subscribeConductores) es el contrato que consumen las
 * vistas. Al integrar Supabase solo se sustituye la implementación interna.
 */

export const CONDUCTOR_ESTADOS = {
  ACTIVO: 'Activo',
  EN_RELEVO: 'En relevo',
  INACTIVO: 'Inactivo',
};

export const CONDUCTOR_ESTADO_LIST = Object.values(CONDUCTOR_ESTADOS);

export const conductorEstadoVariant = {
  [CONDUCTOR_ESTADOS.ACTIVO]: 'success',
  [CONDUCTOR_ESTADOS.EN_RELEVO]: 'warning',
  [CONDUCTOR_ESTADOS.INACTIVO]: 'secondary',
};

export const LICENCIA_CATEGORIAS = ['A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'];

const CONDUCTORES_KEY = 'iqfleet_conductores';
const SEED_FLAG_KEY = 'iqfleet_conductores_seeded';
const CHANGED_EVENT = 'iqfleet:conductores-changed';

// ---------------------------------------------------------------
// Persistencia (adaptador localStorage)
// ---------------------------------------------------------------
function readConductores() {
  try {
    const raw = JSON.parse(localStorage.getItem(CONDUCTORES_KEY));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeConductores(conductores) {
  localStorage.setItem(CONDUCTORES_KEY, JSON.stringify(conductores));
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
}

function createId() {
  const sufijo = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DRV-${Date.now().toString(36).toUpperCase()}${sufijo}`;
}

function normalize(dto) {
  return {
    id: dto.id,
    nombre: String(dto.nombre ?? '').trim(),
    cedula: String(dto.cedula ?? '').trim(),
    categoriaLicencia: dto.categoriaLicencia ?? 'B2',
    licenciaVence: dto.licenciaVence ?? '',
    telefono: String(dto.telefono ?? '').trim(),
    estado: dto.estado ?? CONDUCTOR_ESTADOS.ACTIVO,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function buildInvalidError(fields) {
  const error = new Error('Datos de conductor inválidos');
  error.fields = fields;
  return error;
}

// ---------------------------------------------------------------
// Validación de dominio
// ---------------------------------------------------------------
export function validateConductor(dto, { conductores = readConductores(), ignoreId = null } = {}) {
  const errores = {};

  if (!String(dto.nombre ?? '').trim()) errores.nombre = 'El nombre es obligatorio.';

  const cedula = String(dto.cedula ?? '').trim();
  if (!cedula) errores.cedula = 'La cédula es obligatoria.';
  else if (!/^\d{6,12}$/.test(cedula)) errores.cedula = 'La cédula debe tener entre 6 y 12 dígitos.';
  else if (conductores.some((conductor) => conductor.id !== ignoreId && conductor.cedula === cedula)) {
    errores.cedula = 'Ya existe un conductor con esa cédula.';
  }

  const telefono = String(dto.telefono ?? '').trim();
  if (telefono && !/^\d{7,15}$/.test(telefono)) errores.telefono = 'Teléfono inválido (7 a 15 dígitos).';

  if (!dto.licenciaVence) errores.licenciaVence = 'La fecha de vencimiento es obligatoria.';

  if (dto.estado && !CONDUCTOR_ESTADO_LIST.includes(dto.estado)) {
    errores.estado = 'Estado inválido.';
  }

  return errores;
}

// ---------------------------------------------------------------
// API pública (CRUD)
// ---------------------------------------------------------------
export function listConductores() {
  return readConductores().sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export function getConductor(id) {
  return readConductores().find((conductor) => conductor.id === id) ?? null;
}

export function createConductor(dto) {
  const errores = validateConductor(dto);
  if (Object.keys(errores).length > 0) throw buildInvalidError(errores);

  const now = new Date().toISOString();
  const conductor = normalize({ ...dto, id: createId(), createdAt: now, updatedAt: now });
  writeConductores([...readConductores(), conductor]);
  return conductor;
}

export function updateConductor(id, dto) {
  const conductores = readConductores();
  const actual = conductores.find((conductor) => conductor.id === id);
  if (!actual) throw new Error(`Conductor ${id} no encontrado`);

  const errores = validateConductor({ ...actual, ...dto, id }, { conductores, ignoreId: id });
  if (Object.keys(errores).length > 0) throw buildInvalidError(errores);

  const actualizado = normalize({ ...actual, ...dto, id, updatedAt: new Date().toISOString() });
  writeConductores(conductores.map((conductor) => (conductor.id === id ? actualizado : conductor)));
  return actualizado;
}

export function removeConductor(id) {
  const conductores = readConductores();
  const restantes = conductores.filter((conductor) => conductor.id !== id);
  if (restantes.length === conductores.length) return false;
  writeConductores(restantes);
  return true;
}

/**
 * Observer: emite la lista ante cambios en otra pestaña (evento "storage")
 * y en la misma pestaña (evento custom). Emite un primer valor al suscribir.
 * Devuelve la función de limpieza.
 */
export function subscribeConductores(callback) {
  const handleChange = () => callback(listConductores());

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
function fechaFutura(dias) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

const SEED_DEFINICIONES = [
  { nombre: 'Juan Pérez', cedula: '1234567890', categoriaLicencia: 'C2', licenciaVence: fechaFutura(-40), telefono: '3104567890', estado: 'Activo' },
  { nombre: 'Carlos Rodríguez', cedula: '1098765432', categoriaLicencia: 'C3', licenciaVence: fechaFutura(120), telefono: '3204567891', estado: 'Activo' },
  { nombre: 'Andrés Gómez', cedula: '1122334455', categoriaLicencia: 'B2', licenciaVence: fechaFutura(20), telefono: '3004567892', estado: 'En relevo' },
  { nombre: 'Luis Martínez', cedula: '1987654321', categoriaLicencia: 'C2', licenciaVence: fechaFutura(400), telefono: '3114567893', estado: 'Activo' },
  { nombre: 'Miguel Torres', cedula: '1020304050', categoriaLicencia: 'B1', licenciaVence: fechaFutura(-10), telefono: '3154567894', estado: 'Inactivo' },
  { nombre: 'Diego Herrera', cedula: '1066778899', categoriaLicencia: 'C3', licenciaVence: fechaFutura(60), telefono: '3124567895', estado: 'Activo' },
];

function buildSeedConductores() {
  const now = new Date().toISOString();
  return SEED_DEFINICIONES.map((definicion, indice) =>
    normalize({
      ...definicion,
      id: `DRV-SEED-${String(indice + 1).padStart(2, '0')}`,
      createdAt: now,
      updatedAt: now,
    }),
  );
}

export function ensureSeedConductores() {
  if (localStorage.getItem(SEED_FLAG_KEY)) return listConductores();
  const semilla = buildSeedConductores();
  localStorage.setItem(CONDUCTORES_KEY, JSON.stringify(semilla));
  localStorage.setItem(SEED_FLAG_KEY, '1');
  return semilla;
}

/**
 * Acceso ligero para selects dependientes (Vehículos).
 * Falla en silencio si aún no hay datos: devuelve [].
 */
export function getConductoresOptions() {
  try {
    const raw = JSON.parse(localStorage.getItem(CONDUCTORES_KEY));
    if (!Array.isArray(raw)) return [];
    return raw
      .map((conductor) => ({ value: conductor.id, label: conductor.nombre }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));
  } catch {
    return [];
  }
}

ensureSeedConductores();
