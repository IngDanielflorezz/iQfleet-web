/**
 * mensajesConfig — Mensajes rápidos que el conductor puede enviar al centro
 * de control con un toque. Viven como datos para poder agregarlos o cambiarlos
 * sin tocar los componentes.
 */

export const MENSAJES_RAPIDOS = [
  { id: 'llegue', label: 'Llegué al punto', icon: 'flag', severidad: 'info' },
  { id: 'trafico', label: 'Tráfico pesado', icon: 'traffic', severidad: 'warning' },
  { id: 'mecanica', label: 'Falla mecánica', icon: 'car_repair', severidad: 'danger' },
  { id: 'bloqueada', label: 'Vía bloqueada', icon: 'block', severidad: 'danger' },
];

/** Tiempo (ms) que hay que mantener pulsado el botón SOS para confirmarlo. */
export const SOS_HOLD_MS = 2000;

export function getMensajeRapido(id) {
  return MENSAJES_RAPIDOS.find((mensaje) => mensaje.id === id) ?? null;
}
