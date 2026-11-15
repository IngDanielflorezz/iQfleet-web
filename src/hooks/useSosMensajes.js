import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createAlerta,
  listAlertasPorUsuario,
  resolverAlerta,
  subscribeAlertas,
  ALERTA_SEVERIDAD,
  ALERTA_TIPOS,
} from '../services/alertService';
import { getMensajeRapido } from '../config/mensajesConfig';

/**
 * Estado de SOS y mensajes rápidos del conductor.
 * Expone si hay un SOS activo, el último mensaje enviado y las acciones
 * de enviar/retirar. Se sincroniza ante cambios en la misma pestaña.
 */
export default function useSosMensajes(userId, { conductor = '', empresa = '', getPosicion } = {}) {
  const [alertas, setAlertas] = useState(() => (userId ? listAlertasPorUsuario(userId) : []));

  useEffect(() => {
    if (!userId) return undefined;
    const unsubscribe = subscribeAlertas(() => {
      setAlertas(listAlertasPorUsuario(userId));
    });
    return unsubscribe;
  }, [userId]);

  const sosActivo = useMemo(() => alertas.find((alerta) => alerta.tipo === ALERTA_TIPOS.SOS) ?? null, [alertas]);

  const ultimoMensaje = useMemo(
    () => alertas.find((alerta) => alerta.tipo === ALERTA_TIPOS.MENSAJE) ?? null,
    [alertas],
  );

  const activarSos = useCallback(() => {
    if (!userId || sosActivo) return null;
    const posicion = getPosicion?.() ?? null;
    return createAlerta({
      tipo: ALERTA_TIPOS.SOS,
      severidad: ALERTA_SEVERIDAD.DANGER,
      userId,
      conductor,
      empresa,
      titulo: 'SOS — Auxilio requerido',
      detalle: posicion
        ? `${conductor} solicitó ayuda. Última posición: ${posicion.lat.toFixed(4)}, ${posicion.lng.toFixed(4)}`
        : `${conductor} solicitó ayuda. Sin posición disponible.`,
      posicion,
      clave: `sos:${userId}`,
    });
  }, [userId, sosActivo, getPosicion, conductor, empresa]);

  const retirarSos = useCallback(() => {
    if (!sosActivo) return false;
    return resolverAlerta(sosActivo.id);
  }, [sosActivo]);

  const enviarMensaje = useCallback(
    (mensajeId) => {
      if (!userId) return null;
      const mensaje = getMensajeRapido(mensajeId);
      if (!mensaje) return null;

      const posicion = getPosicion?.() ?? null;
      const previos = listAlertasPorUsuario(userId).filter(
        (alerta) => alerta.tipo === ALERTA_TIPOS.MENSAJE,
      );
      previos.forEach((alerta) => resolverAlerta(alerta.id));

      return createAlerta({
        tipo: ALERTA_TIPOS.MENSAJE,
        severidad: mensaje.severidad === 'danger' ? ALERTA_SEVERIDAD.DANGER : ALERTA_SEVERIDAD.INFO,
        userId,
        conductor,
        empresa,
        titulo: mensaje.label,
        detalle: `${conductor}: ${mensaje.label}`,
        posicion,
      });
    },
    [userId, getPosicion, conductor, empresa],
  );

  return { alertas, sosActivo, ultimoMensaje, activarSos, retirarSos, enviarMensaje };
}
