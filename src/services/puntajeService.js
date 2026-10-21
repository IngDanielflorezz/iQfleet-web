/**
 * puntajeService — Puntaje de conducción del turno por conductor y día.
 *
 * Acumula los eventos detectados (excesos, frenadas, aceleraciones) y la racha
 * de turnos sin infracciones graves. Las muestras crudas no se persisten: se
 * evalúan en memoria y solo se guardan los contadores y el puntaje resultante.
 *
 * Patrón Repository + Adapter, listo para migrar a Supabase.
 */

import { calcularPuntaje, evaluarMuestras } from '../pages/Conductor/puntajeMetrics';

const PUNTAJE_KEY = 'iqfleet_puntaje';
const CHANGED_EVENT = 'iqfleet:puntaje-changed';

export function hoyISO(date = new Date()) {
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mes}-${dia}`;
}

function claveEntrada(userId, fecha) {
  return `${userId}::${fecha}`;
}

function readPuntajes() {
  try {
    const raw = JSON.parse(localStorage.getItem(PUNTAJE_KEY));
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

function writePuntajes(mapa) {
  localStorage.setItem(PUNTAJE_KEY, JSON.stringify(mapa));
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
}

function entradaVacia(userId, fecha) {
  return {
    userId,
    fecha,
    eventos: { excesoLeve: 0, excesoGrave: 0, frenadaBrusca: 0, aceleracionBrusca: 0 },
    excesos: 0,
    puntaje: 100,
    updatedAt: new Date().toISOString(),
  };
}

export function getPuntaje(userId, fecha = hoyISO()) {
  const mapa = readPuntajes();
  return mapa[claveEntrada(userId, fecha)] ?? null;
}

/**
 * Suma a los contadores del día los eventos detectados en un bloque de
 * muestras. Devuelve el puntaje actualizado.
 */
export function acumularEventos(userId, eventos, { fecha = hoyISO() } = {}) {
  const mapa = readPuntajes();
  const clave = claveEntrada(userId, fecha);
  const entrada = mapa[clave] ?? entradaVacia(userId, fecha);

  const nuevosEventos = { ...entrada.eventos };
  Object.entries(eventos).forEach(([tipo, cantidad]) => {
    nuevosEventos[tipo] = (nuevosEventos[tipo] ?? 0) + cantidad;
  });

  const { puntaje, excesos } = calcularPuntaje(nuevosEventos);
  const actualizada = {
    ...entrada,
    eventos: nuevosEventos,
    excesos,
    puntaje,
    updatedAt: new Date().toISOString(),
  };

  mapa[clave] = actualizada;
  writePuntajes(mapa);
  return actualizada;
}

/** Evalúa un bloque de muestras y acumula sus eventos en un solo paso. */
export function registrarMuestras(userId, muestras, { fecha = hoyISO() } = {}) {
  const { eventos } = evaluarMuestras(muestras);
  return acumularEventos(userId, eventos, { fecha });
}

// ---------------------------------------------------------------
// Racha de turnos sin infracciones graves
// ---------------------------------------------------------------
const RACHA_KEY = 'iqfleet_puntaje_racha';

function readRacha() {
  try {
    const raw = JSON.parse(localStorage.getItem(RACHA_KEY));
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

/** Racha actual de días consecutivos sin excesos graves. */
export function getRachaSinGraves(userId) {
  const racha = readRacha();
  return racha[userId]?.dias ?? 0;
}

/**
 * Recalcula la racha de turnos sin infracciones graves.
 * - Si hoy hubo un exceso grave, la racha vuelve a 0.
 * - Si no, y la última fecha registrada no es hoy, avanza un día.
 */
export function actualizarRacha(userId, { fecha = hoyISO() } = {}) {
  const racha = readRacha();
  const entrada = racha[userId] ?? { dias: 0, ultimaFecha: null };
  const mapa = readPuntajes();
  const dia = mapa[claveEntrada(userId, fecha)];
  const huboGrave = (dia?.eventos?.excesoGrave ?? 0) > 0;

  if (huboGrave) {
    racha[userId] = { dias: 0, ultimaFecha: fecha };
  } else if (entrada.ultimaFecha !== fecha) {
    racha[userId] = { dias: entrada.dias + 1, ultimaFecha: fecha };
  }

  localStorage.setItem(RACHA_KEY, JSON.stringify(racha));
  return racha[userId].dias;
}

export function subscribePuntaje(callback) {
  const handleChange = () => callback(readPuntajes());

  window.addEventListener('storage', handleChange);
  window.addEventListener(CHANGED_EVENT, handleChange);
  handleChange();

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener(CHANGED_EVENT, handleChange);
  };
}
