import { useCallback, useEffect, useState } from 'react';
import {
  createConductor,
  removeConductor,
  subscribeConductores,
  updateConductor,
} from '../services/conductorService';

/**
 * Hook de acceso a conductores. Expone el estado (loading/error) y las
 * operaciones CRUD, delegando la persistencia al conductorService (API).
 */
export function useConductores() {
  const [conductores, setConductores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeConductores(
      (data) => {
        setConductores(data);
        setError(null);
        setLoading(false);
      },
      (ex) => {
        setError(ex.message);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, []);

  const crear = useCallback(async (dto) => {
    try {
      return { ok: true, conductor: await createConductor(dto) };
    } catch (ex) {
      return { ok: false, error: ex.message, fields: ex.fields ?? null };
    }
  }, []);

  const actualizar = useCallback(async (id, dto) => {
    try {
      return { ok: true, conductor: await updateConductor(id, dto) };
    } catch (ex) {
      return { ok: false, error: ex.message, fields: ex.fields ?? null };
    }
  }, []);

  const eliminar = useCallback(async (id) => {
    try {
      return await removeConductor(id);
    } catch (ex) {
      setError(ex.message);
      return false;
    }
  }, []);

  const limpiarError = useCallback(() => setError(null), []);

  return { conductores, loading, error, crear, actualizar, eliminar, limpiarError };
}
