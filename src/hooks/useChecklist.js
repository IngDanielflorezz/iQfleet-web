import { useCallback, useEffect, useState } from 'react';
import {
  getChecklist,
  saveChecklist,
  removeChecklist,
  subscribeChecklists,
  hoyISO,
} from '../services/checklistService';

/**
 * Checklist preoperacional del conductor para el día actual.
 * Expone el registro guardado, si la ruta está habilitada y las acciones
 * de guardar/reiniciar. Se sincroniza ante cambios en la misma pestaña.
 */
export default function useChecklist(userId, { conductor = '', empresa = '' } = {}) {
  const fecha = hoyISO();
  const [checklist, setChecklist] = useState(() => (userId ? getChecklist(userId, fecha) : null));

  useEffect(() => {
    if (!userId) return undefined;
    const unsubscribe = subscribeChecklists(() => {
      setChecklist(getChecklist(userId, fecha));
    });
    return unsubscribe;
  }, [userId, fecha]);

  const guardar = useCallback(
    (respuestas) => {
      if (!userId) return null;
      const entrada = saveChecklist(userId, respuestas, { conductor, empresa });
      setChecklist(entrada);
      return entrada;
    },
    [userId, conductor, empresa],
  );

  const reiniciar = useCallback(() => {
    if (!userId) return;
    removeChecklist(userId, fecha);
    setChecklist(null);
  }, [userId, fecha]);

  return {
    checklist,
    fecha,
    aprobado: Boolean(checklist?.approved),
    diligenciado: Boolean(checklist),
    guardar,
    reiniciar,
  };
}
