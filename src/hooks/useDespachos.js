import { useCallback, useEffect, useState } from 'react';
import {
  createDespacho,
  listDespachos,
  removeDespacho,
  subscribeDespachos,
  updateDespacho,
} from '../services/despachoService';

/**
 * Hook de acceso a despachos. Expone el estado (loading/error) y las
 * operaciones CRUD, delegando la persistencia al despachoService.
 */
export function useDespachos() {
  const [despachos, setDespachos] = useState(() => listDespachos());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeDespachos((data) => {
      setDespachos(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const crear = useCallback((dto) => {
    try {
      return { ok: true, despacho: createDespacho(dto) };
    } catch (ex) {
      setError(ex.message);
      return { ok: false, error: ex.message, fields: ex.fields ?? null };
    }
  }, []);

  const actualizar = useCallback((id, dto) => {
    try {
      return { ok: true, despacho: updateDespacho(id, dto) };
    } catch (ex) {
      setError(ex.message);
      return { ok: false, error: ex.message, fields: ex.fields ?? null };
    }
  }, []);

  const eliminar = useCallback((id) => removeDespacho(id), []);

  const limpiarError = useCallback(() => setError(null), []);

  return { despachos, loading, error, crear, actualizar, eliminar, limpiarError };
}
