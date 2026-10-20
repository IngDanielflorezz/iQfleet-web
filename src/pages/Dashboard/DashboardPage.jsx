import { useMemo, useState } from 'react';
import { vehiculos } from '../../data/vehiculos';
import { getConductoresConocidos } from '../../services/despachoService';
import { useDespachos } from '../../hooks/useDespachos';
import { periodoLabel, toPeriodo } from '../../utils/dateUtils';
import { buildResumen, listPeriodos } from './dashboardMetrics';
import DashboardHeader from './components/DashboardHeader';
import MetricCards from './components/MetricCards';
import AlertsPanel from './components/AlertsPanel';
import DespachosTable from './components/DespachosTable';
import ModalDespacho from './components/ModalDespacho';
import ConfirmDialog from './components/ConfirmDialog';
import './Dashboard.css';

export default function DashboardPage() {
  const { despachos, crear, actualizar, eliminar } = useDespachos();

  const [periodo, setPeriodo] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [despachoEnEdicion, setDespachoEnEdicion] = useState(null);
  const [despachoAEliminar, setDespachoAEliminar] = useState(null);

  const opcionesPeriodo = useMemo(() => {
    const actual = toPeriodo(new Date());
    return listPeriodos(despachos).map((valor) => ({
      value: valor,
      label: valor === actual ? `${periodoLabel(valor)} (Mes en curso)` : periodoLabel(valor),
    }));
  }, [despachos]);

  const periodoActivo = useMemo(() => {
    if (periodo && opcionesPeriodo.some((opcion) => opcion.value === periodo)) return periodo;
    return opcionesPeriodo[0]?.value ?? null;
  }, [periodo, opcionesPeriodo]);

  const despachosPeriodo = useMemo(
    () => despachos.filter((despacho) => toPeriodo(despacho.fechaSalida) === periodoActivo),
    [despachos, periodoActivo],
  );

  const despachosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return despachosPeriodo.filter((despacho) => {
      const coincideEstado = filtroEstado === 'Todos' || despacho.estado === filtroEstado;
      if (!coincideEstado) return false;
      if (!termino) return true;
      return [despacho.id, despacho.placa, despacho.conductor, despacho.origen, despacho.destino]
        .join(' ')
        .toLowerCase()
        .includes(termino);
    });
  }, [despachosPeriodo, busqueda, filtroEstado]);

  const resumen = useMemo(() => buildResumen(despachosPeriodo, vehiculos, new Date()), [despachosPeriodo]);

  const conductores = useMemo(() => getConductoresConocidos(despachos), [despachos]);

  const abrirNuevo = () => {
    setDespachoEnEdicion(null);
    setModalAbierto(true);
  };

  const abrirEditar = (despacho) => {
    setDespachoEnEdicion(despacho);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setDespachoEnEdicion(null);
  };

  const guardarDespacho = (dto) =>
    despachoEnEdicion ? actualizar(despachoEnEdicion.id, dto) : crear(dto);

  const confirmarEliminacion = () => {
    if (despachoAEliminar) eliminar(despachoAEliminar.id);
    setDespachoAEliminar(null);
  };

  return (
    <div className="container-fluid max-w-container">
      <DashboardHeader
        periodo={periodoActivo}
        periodos={opcionesPeriodo}
        onPeriodoChange={setPeriodo}
        onNuevoDespacho={abrirNuevo}
        onExportar={() => window.print()}
      />

      <div id="pdfReportArea">
        <MetricCards resumen={resumen} />

        <div className="row g-3">
          <div className="col-12 col-xl-8">
            <div className="card-dark p-4 h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="fs-6 text-white fw-bold mb-0">Rendimiento y Telemetría Semanal</h2>
                <span className="badge badge-dark-subtle fs-8">{periodoLabel(periodoActivo)}</span>
              </div>
              <div
                className="d-flex align-items-center justify-content-center rounded"
                style={{ height: '250px', backgroundColor: 'var(--lp-input)', border: '1px dashed var(--lp-border)' }}
              >
                <span className="text-light-muted fs-8">Gráfico de rendimiento (Recharts / Chart.js iría aquí)</span>
              </div>
            </div>
          </div>

          <AlertsPanel alertas={resumen.alertas} />
        </div>

        <DespachosTable
          despachos={despachosFiltrados}
          total={despachosPeriodo.length}
          busqueda={busqueda}
          onBusquedaChange={setBusqueda}
          filtroEstado={filtroEstado}
          onFiltroEstadoChange={setFiltroEstado}
          onEditar={abrirEditar}
          onEliminar={setDespachoAEliminar}
          onNuevoDespacho={abrirNuevo}
        />
      </div>

      {modalAbierto && (
        <ModalDespacho
          despacho={despachoEnEdicion}
          flota={vehiculos}
          conductores={conductores}
          onClose={cerrarModal}
          onGuardar={guardarDespacho}
        />
      )}

      <ConfirmDialog
        open={Boolean(despachoAEliminar)}
        titulo="Eliminar despacho"
        mensaje={
          despachoAEliminar
            ? `¿Seguro que deseas eliminar el despacho ${despachoAEliminar.id} (${despachoAEliminar.origen} → ${despachoAEliminar.destino})? Esta acción no se puede deshacer.`
            : ''
        }
        onConfirm={confirmarEliminacion}
        onCancel={() => setDespachoAEliminar(null)}
      />
    </div>
  );
}
