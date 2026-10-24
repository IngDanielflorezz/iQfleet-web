import { useCallback, useEffect, useState } from 'react';
import {
  createVehiculo,
  removeVehiculo,
  subscribeVehiculos,
  updateVehiculo,
} from '../services/vehiculoService';

/**
 * Hook de acceso a la flota. Expone el estado (loading/error) y las
 * operaciones CRUD, delegando la persistencia al vehiculoService (API).
 */
export function useVehiculos() {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeVehiculos(
      (data) => {
        setVehiculos(data);
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
      return { ok: true, vehiculo: await createVehiculo(dto) };
    } catch (ex) {
      return { ok: false, error: ex.message, fields: ex.fields ?? null };
    }
  }, []);

  const actualizar = useCallback(async (id, dto) => {
    try {
      return { ok: true, vehiculo: await updateVehiculo(id, dto) };
    } catch (ex) {
      return { ok: false, error: ex.message, fields: ex.fields ?? null };
    }
  }, []);

  const eliminar = useCallback(async (id) => {
    try {
      return await removeVehiculo(id);
    } catch (ex) {
      setError(ex.message);
      return false;
    }
  }, []);

  const limpiarError = useCallback(() => setError(null), []);

  return { vehiculos, loading, error, crear, actualizar, eliminar, limpiarError };
}
