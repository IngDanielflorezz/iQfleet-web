import { useMemo, useState } from 'react';
import { useConductores } from '../../hooks/useConductores';
import { useDocumentos } from '../../hooks/useDocumentos';
import { useVehiculos } from '../../hooks/useVehiculos';
import {
  clasificarVencimiento,
  computeDocumentosResumen,
  filtrarDocumentos,
} from './documentosMetrics';
import DocumentosHeader from './components/DocumentosHeader';
import DocumentosMetricCards from './components/DocumentosMetricCards';
import DocumentosFilterPills from './components/DocumentosFilterPills';
import DocumentosTable from './components/DocumentosTable';
import DocumentoModal from './components/DocumentoModal';
import DocumentoDetailModal from './components/DocumentoDetailModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import '../Conductores/Conductores.css';
import './Documentos.css';

export default function DocumentosPage() {
  const {
    documentos,
    loading,
    error,
    crear,
    actualizar,
    eliminar,
    sincronizar,
    sincronizando,
    adjuntarArchivo,
    descargarArchivo,
    limpiarError,
  } = useDocumentos();
  const { vehiculos } = useVehiculos();
  const { conductores } = useConductores();

  const [filtro, setFiltro] = useState('all');
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [documentoEnEdicion, setDocumentoEnEdicion] = useState(null);
  const [documentoDetalle, setDocumentoDetalle] = useState(null);
  const [documentoAEliminar, setDocumentoAEliminar] = useState(null);

  const resumen = useMemo(() => computeDocumentosResumen(documentos, new Date()), [documentos]);

  const opcionesConductores = useMemo(
    () => conductores.map((conductor) => ({ value: conductor.id, label: conductor.nombre })),
    [conductores],
  );

  const conteos = useMemo(() => {
    const base = {
      all: documentos.length,
      critico: resumen.criticos,
      preventivo: resumen.preventivos,
      SOAT: 0,
      RTM: 0,
      'Tarjeta de Operación': 0,
      'Póliza RCC': 0,
    };
    documentos.forEach((documento) => {
      base[documento.tipo] = (base[documento.tipo] ?? 0) + 1;
    });
    return base;
  }, [documentos, resumen]);

  const filas = useMemo(() => {
    return filtrarDocumentos(documentos, filtro, busqueda, new Date()).map((documento) => ({
      documento,
      ...clasificarVencimiento(documento, new Date()),
    }));
  }, [documentos, filtro, busqueda]);

  const abrirNuevo = () => {
    setDocumentoEnEdicion(null);
    setModalAbierto(true);
  };

  const abrirEditar = (documento) => {
    setDocumentoEnEdicion(documento);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setDocumentoEnEdicion(null);
  };

  const guardarDocumento = (dto, file) =>
    documentoEnEdicion ? actualizar(documentoEnEdicion.id, dto, { file }) : crear(dto, { file });

  const abrirDetalle = (documento) => setDocumentoDetalle(documento);

  const adjuntarDesdeDetalle = async (file) => {
    if (!documentoDetalle) return { ok: false };
    const resultado = await adjuntarArchivo(documentoDetalle.id, file);
    if (resultado.ok) setDocumentoDetalle(resultado.documento);
    return resultado;
  };

  const confirmarEliminacion = async () => {
    const id = documentoAEliminar?.id;
    setDocumentoAEliminar(null);
    if (id) await eliminar(id);
  };

  const limpiarFiltros = () => {
    setFiltro('all');
    setBusqueda('');
  };

  return (
    <div className="max-w-container mx-auto" id="documentosPrintArea">
      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center py-2 fs-8" role="alert">
          <span>{error}</span>
          <button type="button" className="btn-close btn-close-white" aria-label="Cerrar" onClick={limpiarError} />
        </div>
      )}
      {loading && <p className="text-secondary fs-8">Cargando documentos desde la API…</p>}

      <DocumentosHeader sincronizando={sincronizando} onSincronizar={sincronizar} onNuevo={abrirNuevo} />

      <DocumentosMetricCards resumen={resumen} />

      <DocumentosFilterPills
        conteos={conteos}
        filtro={filtro}
        onFiltroChange={setFiltro}
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        onLimpiar={limpiarFiltros}
      />

      <DocumentosTable
        filas={filas}
        onVer={abrirDetalle}
        onArchivo={abrirEditar}
        onEliminar={setDocumentoAEliminar}
      />

      {modalAbierto && (
        <DocumentoModal
          documento={documentoEnEdicion}
          vehiculos={vehiculos}
          conductores={opcionesConductores}
          onClose={cerrarModal}
          onGuardar={guardarDocumento}
        />
      )}

      {documentoDetalle && (
        <DocumentoDetailModal
          key={documentoDetalle.id}
          documento={documentoDetalle}
          onArchivo={adjuntarDesdeDetalle}
          onDescargar={descargarArchivo}
          onClose={() => setDocumentoDetalle(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(documentoAEliminar)}
        titulo="Eliminar documento"
        mensaje={
          documentoAEliminar
            ? `¿Seguro que deseas eliminar ${documentoAEliminar.tipo} N.º ${documentoAEliminar.numero}? Esta acción no se puede deshacer.`
            : ''
        }
        onConfirm={confirmarEliminacion}
        onCancel={() => setDocumentoAEliminar(null)}
      />
    </div>
  );
}
