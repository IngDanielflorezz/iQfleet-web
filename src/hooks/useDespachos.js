import { useCallback, useEffect, useState } from 'react';
import {
  createDespacho,
  removeDespacho,
  subscribeDespachos,
  updateDespacho,
} from '../services/despachoService';

/**
 * Hook de acceso a despachos. Expone el estado (loading/error) y las
 * operaciones CRUD, delegando la persistencia al despachoService (API).
 */
export function useDespachos() {
  const [despachos, setDespachos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeDespachos(
      (data) => {
        setDespachos(data);
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
      return { ok: true, despacho: await createDespacho(dto) };
    } catch (ex) {
      return { ok: false, error: ex.message, fields: ex.fields ?? null };
    }
  }, []);

  const actualizar = useCallback(async (id, dto) => {
    try {
      return { ok: true, despacho: await updateDespacho(id, dto) };
    } catch (ex) {
      return { ok: false, error: ex.message, fields: ex.fields ?? null };
    }
  }, []);

  const eliminar = useCallback(async (id) => {
    try {
      return await removeDespacho(id);
    } catch (ex) {
      setError(ex.message);
      return false;
    }
  }, []);

  const limpiarError = useCallback(() => setError(null), []);

  return { despachos, loading, error, crear, actualizar, eliminar, limpiarError };
}
