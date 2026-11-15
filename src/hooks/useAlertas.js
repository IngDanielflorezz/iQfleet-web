import { useEffect, useState } from 'react';
import { listAlertasActivas, subscribeAlertas } from '../services/alertService';
import { formatHoraCorta } from '../utils/dateUtils';

const TIPO_LABEL = {
  checklist: 'Checklist no aprobado',
  sos: 'SOS — Auxilio requerido',
  fatiga: 'Alerta de fatiga',
  mensaje: 'Mensaje del conductor',
};

const SEVERIDAD_MAP = {
  danger: 'danger',
  warning: 'warning',
  info: 'info',
};

/**
 * Transforma una alerta del servicio al formato que consume AlertsPanel
 * ({ id, severidad, tipo, detalle, tiempo }). Función pura y testeable.
 */
export function toPanelAlerta(alerta) {
  return {
    id: alerta.id,
    severidad: SEVERIDAD_MAP[alerta.severidad] ?? 'info',
    tipo: alerta.titulo || TIPO_LABEL[alerta.tipo] || 'Alerta',
    detalle: alerta.detalle,
    tiempo: alerta.createdAt ? `Hoy ${formatHoraCorta(alerta.createdAt)}` : '—',
    origen: alerta.tipo,
  };
}

/** Alertas operativas activas (checklist, SOS, fatiga, mensajes) para el admin. */
export default function useAlertas() {
  const [alertas, setAlertas] = useState(() => listAlertasActivas());

  useEffect(() => subscribeAlertas((todas) => setAlertas(todas.filter((alerta) => !alerta.resuelta))), []);

  return {
    alertas,
    alertasPanel: alertas.map(toPanelAlerta),
  };
}
