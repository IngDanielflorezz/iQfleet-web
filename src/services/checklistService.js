/**
 * checklistService — Checklist preoperacional por conductor y por día.
 *
 * Evalúa las respuestas contra CHECKLIST_ITEMS y produce un resultado con la
 * forma { approved, blockers[], warnings[] }. Regla de negocio: un ítem
 * crítico en falla => approved = false (bloquea la activación de la ruta).
 *
 * Persistencia: una entrada por (userId, fecha) en localStorage. Patrón
 * Repository + Adapter, listo para migrar a Supabase.
 */

import { CHECKLIST_ITEMS, ITEM_RESULTADO, UMBRAL_ATENCION_DIAS } from '../config/checklistConfig';
import { daysUntil } from '../utils/dateUtils';

const CHECKLIST_KEY = 'iqfleet_checklists';
const CHANGED_EVENT = 'iqfleet:checklists-changed';

// ---------------------------------------------------------------
// Utilidades de fecha
// ---------------------------------------------------------------
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
function readChecklists() {
  try {
    const raw = JSON.parse(localStorage.getItem(CHECKLIST_KEY));
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

function writeChecklists(mapa) {
  localStorage.setItem(CHECKLIST_KEY, JSON.stringify(mapa));
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
}

// ---------------------------------------------------------------
// Evaluación (función pura)
// ---------------------------------------------------------------
/**
 * @param {Object} respuestas  { [itemId]: { resultado: 'ok'|'falla'|'na', nota?, vencimiento? } }
 * @param {Date}   referencia  fecha para calcular días restantes
 * @returns {{ approved: boolean, blockers: Array, warnings: Array, evaluados: number }}
 */
export function evaluarChecklist(respuestas = {}, referencia = new Date()) {
  const blockers = [];
  const warnings = [];

  CHECKLIST_ITEMS.forEach((item) => {
    const respuesta = respuestas[item.id];
    const resultado = respuesta?.resultado ?? ITEM_RESULTADO.NA;

    if (resultado === ITEM_RESULTADO.FALLA) {
      const entrada = { id: item.id, label: item.label, motivo: respuesta?.nota || 'Reportado en falla' };
      if (item.critical) blockers.push(entrada);
      else warnings.push(entrada);
    }

    if (item.requiereVencimiento && respuesta?.vencimiento) {
      const dias = daysUntil(respuesta.vencimiento, referencia);
      if (dias !== null && dias <= UMBRAL_ATENCION_DIAS) {
        const alertaVencimiento = {
          id: item.id,
          label: item.label,
          motivo:
            dias < 0
              ? `Vencido hace ${Math.abs(dias)} día(s)`
              : `Vence en ${dias} día(s)`,
        };
        if (item.critical && dias < 0) blockers.push(alertaVencimiento);
        else warnings.push(alertaVencimiento);
      }
    }
  });

  const evaluados = CHECKLIST_ITEMS.filter((item) => respuestas[item.id]?.resultado && respuestas[item.id].resultado !== ITEM_RESULTADO.NA).length;

  return { approved: blockers.length === 0, blockers, warnings, evaluados };
}

// ---------------------------------------------------------------
// API pública
// ---------------------------------------------------------------
export function getChecklist(userId, fecha = hoyISO()) {
  const mapa = readChecklists();
  return mapa[claveEntrada(userId, fecha)] ?? null;
}

/**
 * Guarda el checklist del conductor para la fecha dada, adjuntando el
 * resultado de la evaluación y la hora de aprobación.
 */
export function saveChecklist(userId, respuestas, { fecha = hoyISO(), conductor = '', empresa = '' } = {}) {
  const evaluacion = evaluarChecklist(respuestas);
  const ahora = new Date().toISOString();
  const entrada = {
    userId,
    fecha,
    conductor,
    empresa,
    respuestas,
    approved: evaluacion.approved,
    blockers: evaluacion.blockers,
    warnings: evaluacion.warnings,
    aprobadoEn: evaluacion.approved ? ahora : null,
    updatedAt: ahora,
  };

  const mapa = readChecklists();
  mapa[claveEntrada(userId, fecha)] = entrada;
  writeChecklists(mapa);
  return entrada;
}

export function removeChecklist(userId, fecha = hoyISO()) {
  const mapa = readChecklists();
  const clave = claveEntrada(userId, fecha);
  if (!(clave in mapa)) return false;
  delete mapa[clave];
  writeChecklists(mapa);
  return true;
}

/** ¿El conductor tiene el checklist de hoy aprobado? (guarda dura de la ruta) */
export function puedeActivarRuta(userId, fecha = hoyISO()) {
  const entrada = getChecklist(userId, fecha);
  return Boolean(entrada?.approved);
}

export function subscribeChecklists(callback) {
  const handleChange = () => callback(readChecklists());

  window.addEventListener('storage', handleChange);
  window.addEventListener(CHANGED_EVENT, handleChange);
  handleChange();

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener(CHANGED_EVENT, handleChange);
  };
}
