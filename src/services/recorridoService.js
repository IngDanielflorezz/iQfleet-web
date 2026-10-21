/**
 * recorridoService — Estela y kilómetros del turno por conductor y día.
 *
 * Acumula los puntos de la ruta (filtrados por precisión) y mantiene el total
 * de kilómetros mediante Haversine. Limita los puntos guardados para no llenar
 * localStorage: se conservan los últimos MAX_PUNTOS.
 *
 * Patrón Repository + Adapter, listo para migrar a Supabase.
 */

import { distanciaKm, puntoConfiable } from '../utils/geoUtils';

const RECORRIDO_KEY = 'iqfleet_recorridos';
const CHANGED_EVENT = 'iqfleet:recorridos-changed';
const MAX_PUNTOS = 500;
const PRECISION_MAXIMA_M = 50;

export function hoyISO(date = new Date()) {
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mes}-${dia}`;
}

function claveEntrada(userId, fecha) {
  return `${userId}::${fecha}`;
}

function readRecorridos() {
  try {
    const raw = JSON.parse(localStorage.getItem(RECORRIDO_KEY));
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

function writeRecorridos(mapa) {
  localStorage.setItem(RECORRIDO_KEY, JSON.stringify(mapa));
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
}

function entradaVacia(userId, fecha) {
  return { userId, fecha, puntos: [], kilometros: 0, updatedAt: new Date().toISOString() };
}

export function getRecorrido(userId, fecha = hoyISO()) {
  const mapa = readRecorridos();
  return mapa[claveEntrada(userId, fecha)] ?? null;
}

/**
 * Agrega un punto a la estela. Ignora lecturas de baja precisión y saltos
 * irreales (teletransportes GPS). Recalcula los km acumulados.
 */
export function agregarPunto(userId, punto, { fecha = hoyISO(), precisionMaximaM = PRECISION_MAXIMA_M } = {}) {
  if (!userId || !puntoConfiable(punto, precisionMaximaM)) return getRecorrido(userId, fecha);

  const mapa = readRecorridos();
  const clave = claveEntrada(userId, fecha);
  const entrada = mapa[clave] ?? entradaVacia(userId, fecha);
  const ultimo = entrada.puntos[entrada.puntos.length - 1];

  const nuevo = { lat: punto.lat, lng: punto.lng, accuracy: punto.accuracy ?? null, timestamp: punto.timestamp ?? Date.now() };
  let kilometros = entrada.kilometros;
  if (ultimo) kilometros += distanciaKm(ultimo, nuevo);

  const puntos = [...entrada.puntos, nuevo].slice(-MAX_PUNTOS);
  const actualizada = { ...entrada, puntos, kilometros, updatedAt: nuevo.timestamp ? new Date(nuevo.timestamp).toISOString() : new Date().toISOString() };

  mapa[clave] = actualizada;
  writeRecorridos(mapa);
  return actualizada;
}

export function resetRecorrido(userId, fecha = hoyISO()) {
  const mapa = readRecorridos();
  const clave = claveEntrada(userId, fecha);
  if (!(clave in mapa)) return false;
  delete mapa[clave];
  writeRecorridos(mapa);
  return true;
}

export function subscribeRecorridos(callback) {
  const handleChange = () => callback(readRecorridos());

  window.addEventListener('storage', handleChange);
  window.addEventListener(CHANGED_EVENT, handleChange);
  handleChange();

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener(CHANGED_EVENT, handleChange);
  };
}
