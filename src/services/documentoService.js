/**
 * documentoService — Repositorio de documentos legales (RUNT / CDA).
 *
 * Patrón Repository + Adapter: hoy persiste en localStorage; la API pública
 * (listDocumentos / createDocumento / updateDocumento / removeDocumento /
 * syncRunt / subscribeDocumentos) es el contrato que consumen las vistas.
 * Al integrar Supabase solo se sustituye la implementación interna.
 *
 * Nota sobre archivos: el Data URL del archivo adjunto vive en un registro
 * en memoria (Map) durante la sesión; en localStorage solo se guardan los
 * metadatos y el nombre del archivo. Así evitamos exceder la cuota de
 * localStorage con imágenes/PDF grandes.
 */

export const DOCUMENTO_TIPOS = {
  SOAT: 'SOAT',
  RTM: 'RTM',
  TARJETA_OPERACION: 'Tarjeta de Operación',
  POLIZA: 'Póliza RCC',
};

export const DOCUMENTO_TIPO_LIST = Object.values(DOCUMENTO_TIPOS);

export const DOCUMENTO_ESTADOS_RUNT = {
  PENDIENTE: 'Pendiente',
  SINCRONIZADO: 'Sincronizado',
  ERROR: 'Error de validación',
};

export const DOCUMENTO_ESTADO_RUNT_LIST = Object.values(DOCUMENTO_ESTADOS_RUNT);

export const runtoEstadoVariant = {
  [DOCUMENTO_ESTADOS_RUNT.PENDIENTE]: 'secondary',
  [DOCUMENTO_ESTADOS_RUNT.SINCRONIZADO]: 'success',
  [DOCUMENTO_ESTADOS_RUNT.ERROR]: 'danger',
};

export const DOCUMENTO_ENTIDADES_SUGERIDAS = [
  'Seguros Bolívar S.A.',
  'Sura Seguros',
  'Allianz Colombia',
  'Mapfre',
  'MinTransporte',
  'CDA Bogotá',
];

export const MAX_ARCHIVO_BYTES = 2 * 1024 * 1024; // 2 MB

const DOCUMENTOS_KEY = 'iqfleet_documentos';
const SEED_FLAG_KEY = 'iqfleet_documentos_seeded';
const CHANGED_EVENT = 'iqfleet:documentos-changed';
const RUNT_SYNC_DELAY_MS = 1200;

// Archivos adjuntos en memoria (no persisten tras recargar)
const archivosEnMemoria = new Map();

function readDocumentos() {
  try {
    const raw = JSON.parse(localStorage.getItem(DOCUMENTOS_KEY));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeDocumentos(documentos) {
  localStorage.setItem(DOCUMENTOS_KEY, JSON.stringify(documentos));
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
}

function createId() {
  const sufijo = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DOC-${Date.now().toString(36).toUpperCase()}${sufijo}`;
}

function normalize(dto) {
  return {
    id: dto.id,
    tipo: dto.tipo ?? DOCUMENTO_TIPOS.SOAT,
    numero: String(dto.numero ?? '').trim(),
    entidad: String(dto.entidad ?? '').trim(),
    placa: String(dto.placa ?? '').trim().toUpperCase(),
    conductor: String(dto.conductor ?? '').trim(),
    expedicion: dto.expedicion ?? '',
    vencimiento: dto.vencimiento ?? '',
    estadoRunt: dto.estadoRunt ?? DOCUMENTO_ESTADOS_RUNT.PENDIENTE,
    runtSincronizadoEn: dto.runtSincronizadoEn ?? null,
    archivoNombre: String(dto.archivoNombre ?? '').trim(),
    archivoTipo: dto.archivoTipo ?? '',
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function buildInvalidError(fields) {
  const error = new Error('Datos de documento inválidos');
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

/**
 * Valida el archivo adjunto. File opcional: null => sin archivo.
 */
export function validateArchivo(file) {
  if (!file) return null;
  if (file.size > MAX_ARCHIVO_BYTES) {
    return `El archivo supera el máximo de ${MAX_ARCHIVO_BYTES / (1024 * 1024)} MB.`;
  }
  const permitido = ['image/png', 'image/jpeg', 'application/pdf'];
  if (!permitido.includes(file.type)) return 'Formato no permitido (usa PNG, JPG o PDF).';
  return null;
}

// ---------------------------------------------------------------
// Validación de dominio
// ---------------------------------------------------------------
export function validateDocumento(dto) {
  const errores = {};

  if (!DOCUMENTO_TIPO_LIST.includes(dto.tipo)) errores.tipo = 'Tipo de documento inválido.';
  if (!String(dto.numero ?? '').trim()) errores.numero = 'El número / póliza es obligatorio.';
  if (!String(dto.entidad ?? '').trim()) errores.entidad = 'La entidad emisora es obligatoria.';
  if (!String(dto.placa ?? '').trim() && !String(dto.conductor ?? '').trim()) {
    errores.placa = 'Asocia el documento a una placa o a un conductor.';
  }
  if (!dto.expedicion) errores.expedicion = 'La fecha de expedición es obligatoria.';
  if (!dto.vencimiento) errores.vencimiento = 'La fecha de vencimiento es obligatoria.';
  else if (dto.expedicion && dto.vencimiento < dto.expedicion) {
    errores.vencimiento = 'El vencimiento no puede ser anterior a la expedición.';
  }

  return errores;
}

// ---------------------------------------------------------------
// API pública (CRUD)
// ---------------------------------------------------------------
export function listDocumentos() {
  return readDocumentos().sort((a, b) => String(a.vencimiento).localeCompare(String(b.vencimiento)));
}

export function createDocumento(dto, { file } = {}) {
  const errores = validateDocumento(dto);
  if (Object.keys(errores).length > 0) throw buildInvalidError(errores);

  const now = new Date().toISOString();
  const documento = normalize({
    ...dto,
    id: createId(),
    archivoNombre: dto.archivoNombre || file?.name || '',
    archivoTipo: file?.type || '',
    createdAt: now,
    updatedAt: now,
  });
  writeDocumentos([...readDocumentos(), documento]);
  return documento;
}

export function updateDocumento(id, dto) {
  const documentos = readDocumentos();
  const actual = documentos.find((documento) => documento.id === id);
  if (!actual) throw new Error(`Documento ${id} no encontrado`);

  const errores = validateDocumento({ ...actual, ...dto, id }, { documentos, ignoreId: id });
  if (Object.keys(errores).length > 0) throw buildInvalidError(errores);

  const actualizado = normalize({ ...actual, ...dto, id, updatedAt: new Date().toISOString() });
  writeDocumentos(documentos.map((documento) => (documento.id === id ? actualizado : documento)));
  return actualizado;
}

export function removeDocumento(id) {
  const documentos = readDocumentos();
  const restantes = documentos.filter((documento) => documento.id !== id);
  if (restantes.length === documentos.length) return false;
  archivosEnMemoria.delete(id);
  writeDocumentos(restantes);
  return true;
}

/**
 * Simula la sincronización con la API RUNT: marca todos los documentos
 * (o los ids indicados) como Sincronizado con fecha/hora. Devuelve una
 * promesa para que la UI muestre el spinner mientras corre.
 */
export function syncRunt(ids = null) {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      const ahora = new Date().toISOString();
      const documentos = readDocumentos();
      const actualizados = documentos.map((documento) =>
        !ids || ids.includes(documento.id)
          ? { ...documento, estadoRunt: DOCUMENTO_ESTADOS_RUNT.SINCRONIZADO, runtSincronizadoEn: ahora, updatedAt: ahora }
          : documento,
      );
      writeDocumentos(actualizados);
      resolve(actualizados);
    }, RUNT_SYNC_DELAY_MS);
  });
}

/**
 * Adjunta (o reemplaza) el archivo de un documento. Guarda el Data URL en
 * memoria y el metadato del nombre en localStorage.
 */
export async function attachArchivo(id, file) {
  const errorArchivo = validateArchivo(file);
  if (errorArchivo) throw new Error(errorArchivo);

  const dataUrl = await readFileAsDataURL(file);
  archivosEnMemoria.set(id, { dataUrl, nombre: file.name, tipo: file.type });

  const documentos = readDocumentos();
  const actual = documentos.find((documento) => documento.id === id);
  if (actual) {
    const actualizado = normalize({
      ...actual,
      archivoNombre: file.name,
      archivoTipo: file.type,
      updatedAt: new Date().toISOString(),
    });
    writeDocumentos(documentos.map((documento) => (documento.id === id ? actualizado : documento)));
  }
  return { dataUrl, nombre: file.name };
}

export function getArchivo(id) {
  return archivosEnMemoria.get(id) ?? null;
}

/**
 * Observer: emite la lista ante cambios en otra pestaña (evento "storage")
 * y en la misma pestaña (evento custom). Emite un primer valor al suscribir.
 */
export function subscribeDocumentos(callback) {
  const handleChange = () => callback(listDocumentos());

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
function fechaRelativa(dias) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

const SEED_DEFINICIONES = [
  { tipo: 'SOAT', numero: '8921-983210', entidad: 'Seguros Bolívar S.A.', placa: 'UVP-123', conductor: '', expedicion: fechaRelativa(-365), vencimiento: fechaRelativa(-3), estadoRunt: 'Sincronizado' },
  { tipo: 'RTM', numero: 'RTM-450-2024', entidad: 'CDA Bogotá', placa: 'UVP-123', conductor: '', expedicion: fechaRelativa(-350), vencimiento: fechaRelativa(5), estadoRunt: 'Sincronizado' },
  { tipo: 'SOAT', numero: '1120-771230', entidad: 'Sura Seguros', placa: 'WZA-456', conductor: '', expedicion: fechaRelativa(-360), vencimiento: fechaRelativa(25), estadoRunt: 'Sincronizado' },
  { tipo: 'RTM', numero: 'RTM-778-2024', entidad: 'CDA Bogotá', placa: 'WZA-456', conductor: '', expedicion: fechaRelativa(-355), vencimiento: fechaRelativa(90), estadoRunt: 'Pendiente' },
  { tipo: 'SOAT', numero: '5567-112233', entidad: 'Allianz Colombia', placa: 'TRL-890', conductor: '', expedicion: fechaRelativa(-358), vencimiento: fechaRelativa(20), estadoRunt: 'Sincronizado' },
  { tipo: 'RTM', numero: 'RTM-901-2024', entidad: 'CDA Valledupar', placa: 'TRL-890', conductor: '', expedicion: fechaRelativa(-370), vencimiento: fechaRelativa(-12), estadoRunt: 'Error de validación' },
  { tipo: 'SOAT', numero: '3201-556677', entidad: 'Mapfre', placa: 'EQZ-912', conductor: '', expedicion: fechaRelativa(-300), vencimiento: fechaRelativa(60), estadoRunt: 'Sincronizado' },
  { tipo: 'Tarjeta de Operación', numero: 'TO-2004-8891', entidad: 'MinTransporte', placa: 'EQZ-912', conductor: '', expedicion: fechaRelativa(-330), vencimiento: fechaRelativa(15), estadoRunt: 'Sincronizado' },
  { tipo: 'Póliza RCC', numero: 'EQZ-912-RCC', entidad: 'Seguros Bolívar S.A.', placa: 'KLM-334', conductor: '', expedicion: fechaRelativa(-200), vencimiento: fechaRelativa(140), estadoRunt: 'Sincronizado' },
  { tipo: 'SOAT', numero: '9910-445566', entidad: 'Sura Seguros', placa: 'PQR-778', conductor: '', expedicion: fechaRelativa(-400), vencimiento: fechaRelativa(-5), estadoRunt: 'Error de validación' },
];

function buildSeedDocumentos() {
  const now = new Date().toISOString();
  return SEED_DEFINICIONES.map((definicion, indice) =>
    normalize({
      ...definicion,
      id: `DOC-SEED-${String(indice + 1).padStart(2, '0')}`,
      archivoNombre: '',
      archivoTipo: '',
      runtSincronizadoEn: definicion.estadoRunt === 'Sincronizado' ? now : null,
      createdAt: now,
      updatedAt: now,
    }),
  );
}

export function ensureSeedDocumentos() {
  if (localStorage.getItem(SEED_FLAG_KEY)) return listDocumentos();
  const semilla = buildSeedDocumentos();
  localStorage.setItem(DOCUMENTOS_KEY, JSON.stringify(semilla));
  localStorage.setItem(SEED_FLAG_KEY, '1');
  return semilla;
}

ensureSeedDocumentos();
