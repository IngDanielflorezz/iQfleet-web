/**
 * checklistConfig — Definición de datos del checklist preoperacional.
 *
 * Los ítems viven aquí (datos, no JSX) para poder agregarlos, quitarlos o
 * marcarlos como críticos sin tocar los componentes. `critical: true` implica
 * que una falla bloquea la aprobación del checklist y, por ende, la ruta.
 */

export const CHECKLIST_ITEMS = [
  { id: 'frenos', label: 'Frenos (servicio y estacionamiento)', critical: true, icon: 'car_crash' },
  { id: 'luces', label: 'Luces y direccionales', critical: true, icon: 'lightbulb' },
  { id: 'llantas', label: 'Llantas y presión', critical: true, icon: 'tire_repair' },
  { id: 'extintor', label: 'Extintor vigente', critical: true, icon: 'fire_extinguisher' },
  { id: 'botiquin', label: 'Botiquín (con vencimiento)', critical: true, icon: 'medical_services', requiereVencimiento: true },
  { id: 'espejos', label: 'Espejos y parabrisas', critical: false, icon: 'visibility' },
  { id: 'cinturones', label: 'Cinturones de seguridad', critical: false, icon: 'airline_seat_recline_normal' },
  { id: 'documentos', label: 'Documentos a bordo (SOAT, RTM, licencia)', critical: false, icon: 'description' },
];

/** Resultado posible de cada ítem. */
export const ITEM_RESULTADO = {
  OK: 'ok',
  FALLA: 'falla',
  NA: 'na',
};

/** Umbral (días) para marcar un vencimiento como "atención". */
export const UMBRAL_ATENCION_DIAS = 30;

export function getChecklistItem(id) {
  return CHECKLIST_ITEMS.find((item) => item.id === id) ?? null;
}
