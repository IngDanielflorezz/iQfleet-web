import { useCallback, useEffect, useState } from 'react';
import {
  attachArchivo,
  createDocumento,
  getArchivo,
  removeDocumento,
  subscribeDocumentos,
  syncRunt,
  updateDocumento,
} from '../services/documentoService';

/**
 * Hook de acceso a documentos legales. Expone el estado (loading/error/
 * sincronizando) y las operaciones CRUD + sincronización RUNT (API).
 */
export function useDocumentos() {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeDocumentos(
      (data) => {
        setDocumentos(data);
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

  const crear = useCallback(async (dto, opciones) => {
    try {
      return { ok: true, documento: await createDocumento(dto, opciones) };
    } catch (ex) {
      return { ok: false, error: ex.message, fields: ex.fields ?? null };
    }
  }, []);

  const actualizar = useCallback(async (id, dto, opciones) => {
    try {
      return { ok: true, documento: await updateDocumento(id, dto, opciones) };
    } catch (ex) {
      return { ok: false, error: ex.message, fields: ex.fields ?? null };
    }
  }, []);

  const eliminar = useCallback(async (id) => {
    try {
      return await removeDocumento(id);
    } catch (ex) {
      setError(ex.message);
      return false;
    }
  }, []);

  const sincronizar = useCallback(async () => {
    setSincronizando(true);
    try {
      await syncRunt();
    } catch (ex) {
      setError(ex.message);
    } finally {
      setSincronizando(false);
    }
  }, []);

  const adjuntarArchivo = useCallback(async (documento, file) => {
    try {
      const actualizado = await attachArchivo(documento, file);
      return { ok: true, documento: actualizado, archivo: getArchivo(actualizado.id) };
    } catch (ex) {
      setError(ex.message);
      return { ok: false, error: ex.message };
    }
  }, []);

  const limpiarError = useCallback(() => setError(null), []);

  return {
    documentos,
    loading,
    sincronizando,
    error,
    crear,
    actualizar,
    eliminar,
    sincronizar,
    adjuntarArchivo,
    limpiarError,
  };
}
