import { useMemo, useState } from 'react';
import { useConductores } from '../../hooks/useConductores';
import { useVehiculos } from '../../hooks/useVehiculos';
import { buildExportCSV, downloadCSV } from '../../utils/exportUtils';
import { computeVehiculosResumen } from './vehiculosMetrics';
import VehiculosHeader from './components/VehiculosHeader';
import VehiculosMetricCards from './components/VehiculosMetricCards';
import VehiculosTable from './components/VehiculosTable';
import VehiculoModal from './components/VehiculoModal';
import VehiculoDetailModal from './components/VehiculoDetailModal';
import ConfirmDialog from './components/ConfirmDialog';
import '../Conductores/Conductores.css';
import './Vehiculos.css';

const COLUMNAS_EXPORT = [
  { key: 'id', label: 'Placa' },
  { key: 'marca', label: 'Marca' },
  { key: 'modelo', label: 'Modelo' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'anio', label: 'Año' },
  { key: 'ciudad', label: 'Ciudad' },
  { key: 'conductor', label: 'Conductor' },
  { key: 'kilometraje', label: 'Kilometraje' },
  { key: 'estado', label: 'Estado' },
  { key: 'soatVence', label: 'Vence SOAT' },
  { key: 'rtmVence', label: 'Vence RTM' },
];

export default function VehiculosPage() {
  const { vehiculos, loading, error, crear, actualizar, eliminar, limpiarError } = useVehiculos();
  const { conductores } = useConductores();

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [vehiculoEnEdicion, setVehiculoEnEdicion] = useState(null);
  const [vehiculoDetalle, setVehiculoDetalle] = useState(null);
  const [vehiculoAEliminar, setVehiculoAEliminar] = useState(null);

  const opcionesConductores = useMemo(
    () => conductores.map((conductor) => ({ value: conductor.id, label: conductor.nombre })),
    [conductores],
  );

  const resumen = useMemo(() => computeVehiculosResumen(vehiculos, new Date()), [vehiculos]);

  const vehiculosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return vehiculos.filter((vehiculo) => {
      const coincideEstado = filtroEstado === 'Todos' || vehiculo.estado === filtroEstado;
      if (!coincideEstado) return false;
      if (!termino) return true;
      return `${vehiculo.id} ${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.conductor}`.toLowerCase().includes(termino);
    });
  }, [vehiculos, busqueda, filtroEstado]);

  const abrirNuevo = () => {
    setVehiculoEnEdicion(null);
    setModalAbierto(true);
  };

  const abrirEditar = (vehiculo) => {
    setVehiculoEnEdicion(vehiculo);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setVehiculoEnEdicion(null);
  };

  const guardarVehiculo = (dto) =>
    vehiculoEnEdicion ? actualizar(vehiculoEnEdicion.id, dto) : crear(dto);

  const confirmarEliminacion = () => {
    if (vehiculoAEliminar) eliminar(vehiculoAEliminar.id);
    setVehiculoAEliminar(null);
  };

  const exportarFlota = () => {
    const csv = buildExportCSV(vehiculosFiltrados, COLUMNAS_EXPORT);
    downloadCSV('flota-iqfleet.csv', csv);
  };

  return (
    <div className="max-w-container mx-auto">
      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center py-2 fs-8" role="alert">
          <span>{error}</span>
          <button type="button" className="btn-close btn-close-white" aria-label="Cerrar" onClick={limpiarError} />
        </div>
      )}
      {loading && <p className="text-secondary fs-8">Cargando vehiculos desde la API…</p>}

      <VehiculosHeader resumen={resumen} onNuevo={abrirNuevo} onExportar={exportarFlota} />

      <VehiculosMetricCards resumen={resumen} />

      <VehiculosTable
        vehiculos={vehiculosFiltrados}
        total={vehiculos.length}
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        filtroEstado={filtroEstado}
        onFiltroEstadoChange={setFiltroEstado}
        onVer={setVehiculoDetalle}
        onEditar={abrirEditar}
        onEliminar={setVehiculoAEliminar}
        onNuevo={abrirNuevo}
      />

      {modalAbierto && (
        <VehiculoModal
          vehiculo={vehiculoEnEdicion}
          conductores={opcionesConductores}
          onClose={cerrarModal}
          onGuardar={guardarVehiculo}
        />
      )}

      {vehiculoDetalle && (
        <VehiculoDetailModal vehiculo={vehiculoDetalle} onClose={() => setVehiculoDetalle(null)} />
      )}

      <ConfirmDialog
        open={Boolean(vehiculoAEliminar)}
        titulo="Eliminar vehículo"
        mensaje={
          vehiculoAEliminar
            ? `¿Seguro que deseas eliminar el vehículo ${vehiculoAEliminar.id} (${vehiculoAEliminar.marca} ${vehiculoAEliminar.modelo})? Esta acción no se puede deshacer.`
            : ''
        }
        onConfirm={confirmarEliminacion}
        onCancel={() => setVehiculoAEliminar(null)}
      />
    </div>
  );
}
