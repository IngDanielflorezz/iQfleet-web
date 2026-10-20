import { useCallback, useEffect, useState } from 'react';
import {
  createVehiculo,
  listVehiculos,
  removeVehiculo,
  subscribeVehiculos,
  updateVehiculo,
} from '../services/vehiculoService';

/**
 * Hook de acceso a la flota. Expone el estado (loading/error) y las
 * operaciones CRUD, delegando la persistencia al vehiculoService.
 */
export function useVehiculos() {
  const [vehiculos, setVehiculos] = useState(() => listVehiculos());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeVehiculos((data) => {
      setVehiculos(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const crear = useCallback((dto) => {
    try {
      return { ok: true, vehiculo: createVehiculo(dto) };
    } catch (ex) {
      setError(ex.message);
      return { ok: false, error: ex.message, fields: ex.fields ?? null };
    }
  }, []);

  const actualizar = useCallback((id, dto) => {
    try {
      return { ok: true, vehiculo: updateVehiculo(id, dto) };
    } catch (ex) {
      setError(ex.message);
      return { ok: false, error: ex.message, fields: ex.fields ?? null };
    }
  }, []);

  const eliminar = useCallback((id) => removeVehiculo(id), []);

  const limpiarError = useCallback(() => setError(null), []);

  return { vehiculos, loading, error, crear, actualizar, eliminar, limpiarError };
}
