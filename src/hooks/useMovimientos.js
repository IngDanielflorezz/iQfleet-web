import { useCallback, useEffect, useState } from 'react';
import {
  createMovimiento,
  removeMovimiento,
  subscribeMovimientos,
  updateMovimiento,
} from '../services/finanzaService';

/**
 * Hook de acceso a movimientos financieros. Expone el estado (loading/error)
 * y las operaciones CRUD, delegando la persistencia al finanzaService (API).
 */
export default function useMovimientos() {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeMovimientos(
      (data) => {
        setMovimientos(data);
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

  const guardar = useCallback(async (dto, { id, file } = {}) => {
    try {
      const movimiento = id ? await updateMovimiento(id, dto, { file }) : await createMovimiento(dto, { file });
      return { ok: true, movimiento };
    } catch (ex) {
      return { ok: false, error: ex.message, fields: ex.fields ?? null };
    }
  }, []);

  const eliminar = useCallback(async (id) => {
    try {
      return await removeMovimiento(id);
    } catch (ex) {
      setError(ex.message);
      return false;
    }
  }, []);

  const limpiarError = useCallback(() => setError(null), []);

  return { movimientos, loading, error, guardar, eliminar, limpiarError };
}
