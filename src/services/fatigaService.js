/**
 * fatigaService — Control de fatiga por conductor y por día.
 *
 * Lleva el cronómetro de conducción continua del turno. Un turno se compone de
 * tramos: al registrar una pausa válida (>= pausaMinimaMin) el contador se
 * reinicia y la pausa queda en el historial del día.
 *
 * Persistencia: una entrada por (userId, fecha) en localStorage. Patrón
 * Repository + Adapter, listo para migrar a Supabase.
 */

import { FATIGA_CONFIG, FATIGA_ESTADOS } from '../config/fatigaConfig';

const FATIGA_KEY = 'iqfleet_fatiga';
const CHANGED_EVENT = 'iqfleet:fatiga-changed';

export function hoyISO(date = new Date()) {
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mes}-${dia}`;
}

function claveEntrada(userId, fecha) {
  return `${userId}::${fecha}`;
}

// ---------------------------------------------------------------
// Persistencia
// ---------------------------------------------------------------
function readFatiga() {
  try {
    const raw = JSON.parse(localStorage.getItem(FATIGA_KEY));
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

function writeFatiga(mapa) {
  localStorage.setItem(FATIGA_KEY, JSON.stringify(mapa));
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
}

function ensureEntrada(mapa, userId, fecha) {
  const clave = claveEntrada(userId, fecha);
  if (!mapa[clave]) {
    mapa[clave] = {
      userId,
      fecha,
      iniciadoEn: new Date().toISOString(),
      acumuladoMs: 0,
      corriendo: false,
      ultimaPausaEn: null,
      pausas: [],
      updatedAt: new Date().toISOString(),
    };
  }
  return mapa[clave];
}

// ---------------------------------------------------------------
// Lógica pura de fatiga
// ---------------------------------------------------------------
/** Minutos de conducción continua a partir de ms acumulados. */
export function minutosContinuos(acumuladoMs) {
  return Math.floor(acumuladoMs / 60000);
}

/**
 * @returns {{ estado: 'normal'|'aviso'|'requerido', porcentaje: number, restanteMin: number }}
 */
export function evaluarFatiga(acumuladoMs) {
  const continuos = minutosContinuos(acumuladoMs);
  const max = FATIGA_CONFIG.maxContinuoMin;
  const porcentaje = Math.min(100, Math.round((continuos / max) * 100));

  let estado = FATIGA_ESTADOS.NORMAL;
  if (continuos >= max) estado = FATIGA_ESTADOS.REQUERIDO;
  else if (porcentaje >= FATIGA_CONFIG.umbralAvisoPct) estado = FATIGA_ESTADOS.AVISO;

  return { estado, porcentaje, continuos, restanteMin: Math.max(0, max - continuos) };
}

export function formatDuracion(acumuladoMs) {
  const totalMin = minutosContinuos(acumuladoMs);
  const horas = Math.floor(totalMin / 60);
  const minutos = totalMin % 60;
  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}

// ---------------------------------------------------------------
// API pública
// ---------------------------------------------------------------
export function getFatiga(userId, fecha = hoyISO()) {
  const mapa = readFatiga();
  return mapa[claveEntrada(userId, fecha)] ?? null;
}

/** Inicia (o reanuda) la conducción continua del turno. */
export function iniciarConduccion(userId, { fecha = hoyISO() } = {}) {
  const mapa = readFatiga();
  const entrada = ensureEntrada(mapa, userId, fecha);
  if (!entrada.corriendo) {
    entrada.corriendo = true;
    entrada.reanudadoEn = new Date().toISOString();
    entrada.updatedAt = entrada.reanudadoEn;
  }
  mapa[claveEntrada(userId, fecha)] = entrada;
  writeFatiga(mapa);
  return entrada;
}

/**
 * Registra una pausa. Una pausa manual siempre reinicia el contador (el
 * conductor decide detenerse); una pausa automática solo reinicia si duró al
 * menos pausaMinimaMin.
 * @returns {{ entrada: Object, pausaValida: boolean }}
 */
export function registrarPausa(userId, duracionMs, { fecha = hoyISO(), motivo = 'manual' } = {}) {
  const mapa = readFatiga();
  const entrada = ensureEntrada(mapa, userId, fecha);
  const valida = motivo === 'manual' || duracionMs >= FATIGA_CONFIG.pausaMinimaMin * 60000;

  if (valida) {
    entrada.acumuladoMs = 0;
    entrada.ultimaPausaEn = new Date().toISOString();
    entrada.pausas = [
      ...(entrada.pausas ?? []),
      { en: entrada.ultimaPausaEn, duracionMs, motivo },
    ];
  }
  entrada.corriendo = false;
  entrada.updatedAt = new Date().toISOString();
  mapa[claveEntrada(userId, fecha)] = entrada;
  writeFatiga(mapa);
  return { entrada, pausaValida: valida };
}

/** Desecha el estado de fatiga del día (reinicio manual). */
export function resetFatiga(userId, fecha = hoyISO()) {
  const mapa = readFatiga();
  const clave = claveEntrada(userId, fecha);
  if (!(clave in mapa)) return false;
  delete mapa[clave];
  writeFatiga(mapa);
  return true;
}

export function subscribeFatiga(callback) {
  const handleChange = () => callback(readFatiga());

  window.addEventListener('storage', handleChange);
  window.addEventListener(CHANGED_EVENT, handleChange);
  handleChange();

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener(CHANGED_EVENT, handleChange);
  };
}
