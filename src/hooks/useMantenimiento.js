import { useCallback, useEffect, useState } from 'react';
import {
  abrirOrden,
  anularOrden,
  cerrarOrden,
  createPlan,
  removePlan,
  subscribeMantenimiento,
  updatePlan,
} from '../services/mantenimientoService';

const resultado = async (accion) => {
  try {
    return { ok: true, data: await accion() };
  } catch (ex) {
    return { ok: false, error: ex.message, fields: ex.fields ?? null };
  }
};

/** Planes y órdenes de mantenimiento (API) con sus operaciones; cada una devuelve { ok, fields }. */
export function useMantenimiento() {
  const [planes, setPlanes] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(
    () =>
      subscribeMantenimiento(
        (data) => {
          setPlanes(data.planes);
          setOrdenes(data.ordenes);
          setError(null);
          setLoading(false);
        },
        (ex) => {
          setError(ex.message);
          setLoading(false);
        },
      ),
    [],
  );

  const guardarPlan = useCallback((dto, id) => resultado(() => (id ? updatePlan(id, dto) : createPlan(dto))), []);
  const eliminarPlan = useCallback((id) => resultado(() => removePlan(id)), []);
  const abrir = useCallback((dto) => resultado(() => abrirOrden(dto)), []);
  const cerrar = useCallback((id, dto) => resultado(() => cerrarOrden(id, dto)), []);
  const anular = useCallback((id) => resultado(() => anularOrden(id)), []);
  const limpiarError = useCallback(() => setError(null), []);

  return { planes, ordenes, loading, error, setError, guardarPlan, eliminarPlan, abrir, cerrar, anular, limpiarError };
}
