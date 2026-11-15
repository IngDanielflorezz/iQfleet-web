import { useCallback, useEffect, useState } from 'react';
import {
  listMovimientos,
  createMovimiento,
  updateMovimiento,
  removeMovimiento,
  attachComprobante,
  getComprobante,
  subscribeMovimientos,
} from '../services/finanzaService';

export default function useMovimientos() {
  const [movimientos, setMovimientos] = useState(() => listMovimientos());
  const [guardando, setGuardando] = useState(false);

  useEffect(() => subscribeMovimientos(setMovimientos), []);

  const guardar = useCallback(async (dto, { id, file } = {}) => {
    setGuardando(true);
    try {
      const movimiento = id
        ? updateMovimiento(id, dto)
        : createMovimiento(dto, { file });
      if (file && movimiento.id) {
        await attachComprobante(movimiento.id, file);
      }
      return movimiento;
    } finally {
      setGuardando(false);
    }
  }, []);

  const eliminar = useCallback((id) => removeMovimiento(id), []);

  const adjuntarComprobante = useCallback(
    (id, file) => attachComprobante(id, file),
    [],
  );

  const verComprobante = useCallback((id) => getComprobante(id), []);

  return { movimientos, guardando, guardar, eliminar, adjuntarComprobante, verComprobante };
}
