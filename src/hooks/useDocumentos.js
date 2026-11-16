import { useCallback, useEffect, useState } from 'react';
import {
  attachArchivo,
  createDocumento,
  getArchivoUrl,
  removeDocumento,
  subscribeDocumentos,
  syncRunt,
  updateDocumento,
} from '../services/documentoService';
import { ArchivoNoSubidoError, descargarDesdeUrl } from '../utils/archivos';

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

  // Si el documento se guardó pero el archivo no, se da por guardado y se avisa:
  // reintentar desde el formulario duplicaría el documento.
  const resultadoGuardado = useCallback((ex) => {
    if (ex instanceof ArchivoNoSubidoError) {
      setError(ex.message);
      return { ok: true, documento: ex.registro };
    }
    return { ok: false, error: ex.message, fields: ex.fields ?? null };
  }, []);

  const crear = useCallback(async (dto, opciones) => {
    try {
      return { ok: true, documento: await createDocumento(dto, opciones) };
    } catch (ex) {
      return resultadoGuardado(ex);
    }
  }, [resultadoGuardado]);

  const actualizar = useCallback(async (id, dto, opciones) => {
    try {
      return { ok: true, documento: await updateDocumento(id, dto, opciones) };
    } catch (ex) {
      return resultadoGuardado(ex);
    }
  }, [resultadoGuardado]);

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

  const adjuntarArchivo = useCallback(async (id, file) => {
    try {
      return { ok: true, documento: await attachArchivo(id, file) };
    } catch (ex) {
      return { ok: false, error: ex.fields?.archivo ?? ex.message };
    }
  }, []);

  const descargarArchivo = useCallback(async (id) => {
    try {
      const { url } = await getArchivoUrl(id);
      descargarDesdeUrl(url);
      return { ok: true };
    } catch (ex) {
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
    descargarArchivo,
    limpiarError,
  };
}
