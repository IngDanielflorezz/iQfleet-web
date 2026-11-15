import { useCallback, useEffect, useState } from 'react';
import {
  attachArchivo,
  createDocumento,
  listDocumentos,
  removeDocumento,
  subscribeDocumentos,
  syncRunt,
  updateDocumento,
} from '../services/documentoService';

/**
 * Hook de acceso a documentos legales. Expone el estado (loading/error/
 * sincronizando) y las operaciones CRUD + sincronización RUNT.
 */
export function useDocumentos() {
  const [documentos, setDocumentos] = useState(() => listDocumentos());
  const [loading, setLoading] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeDocumentos((data) => {
      setDocumentos(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const crear = useCallback((dto, opciones) => {
    try {
      return { ok: true, documento: createDocumento(dto, opciones) };
    } catch (ex) {
      setError(ex.message);
      return { ok: false, error: ex.message, fields: ex.fields ?? null };
    }
  }, []);

  const actualizar = useCallback((id, dto) => {
    try {
      return { ok: true, documento: updateDocumento(id, dto) };
    } catch (ex) {
      setError(ex.message);
      return { ok: false, error: ex.message, fields: ex.fields ?? null };
    }
  }, []);

  const eliminar = useCallback((id) => removeDocumento(id), []);

  const sincronizar = useCallback(async () => {
    setSincronizando(true);
    try {
      await syncRunt();
    } finally {
      setSincronizando(false);
    }
  }, []);

  const adjuntarArchivo = useCallback(async (id, file) => {
    try {
      const resultado = await attachArchivo(id, file);
      return { ok: true, ...resultado };
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
