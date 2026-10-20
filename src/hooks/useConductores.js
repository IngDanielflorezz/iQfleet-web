import { useCallback, useEffect, useState } from 'react';
import {
  createConductor,
  listConductores,
  removeConductor,
  subscribeConductores,
  updateConductor,
} from '../services/conductorService';

/**
 * Hook de acceso a conductores. Expone el estado (loading/error) y las
 * operaciones CRUD, delegando la persistencia al conductorService.
 */
export function useConductores() {
  const [conductores, setConductores] = useState(() => listConductores());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeConductores((data) => {
      setConductores(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const crear = useCallback((dto) => {
    try {
      return { ok: true, conductor: createConductor(dto) };
    } catch (ex) {
      setError(ex.message);
      return { ok: false, error: ex.message, fields: ex.fields ?? null };
    }
  }, []);

  const actualizar = useCallback((id, dto) => {
    try {
      return { ok: true, conductor: updateConductor(id, dto) };
    } catch (ex) {
      setError(ex.message);
      return { ok: false, error: ex.message, fields: ex.fields ?? null };
    }
  }, []);

  const eliminar = useCallback((id) => removeConductor(id), []);

  const limpiarError = useCallback(() => setError(null), []);

  return { conductores, loading, error, crear, actualizar, eliminar, limpiarError };
}
