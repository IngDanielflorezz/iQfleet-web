/**
 * geoUtils — Utilidades geográficas puras.
 *
 * Haversine para distancias en metros/km y filtro de puntos por precisión GPS.
 * Sin dependencias, reutilizable en servicios y componentes.
 */

const RADIO_TIERRA_M = 6371000;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Distancia en metros entre dos coordenadas { lat, lng } (Haversine).
 */
export function distanciaMetros(a, b) {
  if (!a || !b) return 0;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_M * Math.asin(Math.sqrt(h));
}

export function distanciaKm(a, b) {
  return distanciaMetros(a, b) / 1000;
}

/**
 * ¿El punto es aceptable para dibujar la estela? Descarta lecturas GPS de baja
 * precisión (accuracy alto) que generan saltos falsos.
 */
export function puntoConfiable(punto, precisionMaximaM = 50) {
  if (!punto || typeof punto.lat !== 'number' || typeof punto.lng !== 'number') return false;
  return punto.accuracy == null || punto.accuracy <= precisionMaximaM;
}

/**
 * Suma los kilómetros de una secuencia de puntos { lat, lng, accuracy },
 * ignorando los tramos con precisión baja.
 */
export function kilometrosDeRecorrido(puntos = [], precisionMaximaM = 50) {
  let total = 0;
  let anterior = null;

  puntos.forEach((punto) => {
    if (!puntoConfiable(punto, precisionMaximaM)) return;
    if (anterior) total += distanciaKm(anterior, punto);
    anterior = punto;
  });

  return total;
}
