import { useMemo, useState } from 'react';
import { useConductores } from '../../hooks/useConductores';
import { buildExportCSV, downloadCSV } from '../../utils/exportUtils';
import { computeConductoresResumen } from './conductoresMetrics';
import ConductoresHeader from './components/ConductoresHeader';
import ConductoresMetricCards from './components/ConductoresMetricCards';
import ConductoresTable from './components/ConductoresTable';
import ConductorModal from './components/ConductorModal';
import ConductorDetailModal from './components/ConductorDetailModal';
import ConfirmDialog from './components/ConfirmDialog';
import './Conductores.css';

const COLUMNAS_EXPORT = [
  { key: 'id', label: 'ID' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'cedula', label: 'Cédula' },
  { key: 'categoriaLicencia', label: 'Categoría licencia' },
  { key: 'licenciaVence', label: 'Vence licencia' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'estado', label: 'Estado' },
];

export default function ConductoresPage() {
  const { conductores, loading, error, crear, actualizar, eliminar, limpiarError } = useConductores();

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [conductorEnEdicion, setConductorEnEdicion] = useState(null);
  const [conductorDetalle, setConductorDetalle] = useState(null);
  const [conductorAEliminar, setConductorAEliminar] = useState(null);

  const resumen = useMemo(() => computeConductoresResumen(conductores, new Date()), [conductores]);

  const conductoresFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return conductores.filter((conductor) => {
      const coincideEstado = filtroEstado === 'Todos' || conductor.estado === filtroEstado;
      if (!coincideEstado) return false;
      if (!termino) return true;
      return `${conductor.nombre} ${conductor.cedula}`.toLowerCase().includes(termino);
    });
  }, [conductores, busqueda, filtroEstado]);

  const abrirNuevo = () => {
    setConductorEnEdicion(null);
    setModalAbierto(true);
  };

  const abrirEditar = (conductor) => {
    setConductorEnEdicion(conductor);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setConductorEnEdicion(null);
  };

  const guardarConductor = (dto) =>
    conductorEnEdicion ? actualizar(conductorEnEdicion.id, dto) : crear(dto);

  const confirmarEliminacion = () => {
    if (conductorAEliminar) eliminar(conductorAEliminar.id);
    setConductorAEliminar(null);
  };

  const exportarLista = () => {
    const csv = buildExportCSV(conductoresFiltrados, COLUMNAS_EXPORT);
    downloadCSV('conductores-iqfleet.csv', csv);
  };

  const controlFatiga = () => {
    window.alert(
      'Control de Fatiga: próximamente se integrará el monitoreo de horas de conducción por conductor.',
    );
  };

  return (
    <div className="max-w-container mx-auto" id="conductoresPrintArea">
      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center py-2 fs-8" role="alert">
          <span>{error}</span>
          <button type="button" className="btn-close btn-close-white" aria-label="Cerrar" onClick={limpiarError} />
        </div>
      )}
      {loading && <p className="text-secondary fs-8">Cargando conductores desde la API…</p>}

      <ConductoresHeader
        resumen={resumen}
        onNuevo={abrirNuevo}
        onExportar={exportarLista}
        onControlFatiga={controlFatiga}
      />

      <ConductoresMetricCards resumen={resumen} />

      <ConductoresTable
        conductores={conductoresFiltrados}
        total={conductores.length}
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        filtroEstado={filtroEstado}
        onFiltroEstadoChange={setFiltroEstado}
        onVer={setConductorDetalle}
        onEditar={abrirEditar}
        onEliminar={setConductorAEliminar}
        onNuevo={abrirNuevo}
      />

      {modalAbierto && (
        <ConductorModal conductor={conductorEnEdicion} onClose={cerrarModal} onGuardar={guardarConductor} />
      )}

      {conductorDetalle && (
        <ConductorDetailModal conductor={conductorDetalle} onClose={() => setConductorDetalle(null)} />
      )}

      <ConfirmDialog
        open={Boolean(conductorAEliminar)}
        titulo="Eliminar conductor"
        mensaje={
          conductorAEliminar
            ? `¿Seguro que deseas eliminar a ${conductorAEliminar.nombre} (CC ${conductorAEliminar.cedula})? Esta acción no se puede deshacer.`
            : ''
        }
        onConfirm={confirmarEliminacion}
        onCancel={() => setConductorAEliminar(null)}
      />
    </div>
  );
}
