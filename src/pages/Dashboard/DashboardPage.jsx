import { useMemo, useState } from 'react';
import { codigoDespacho, getConductoresConocidos } from '../../services/despachoService';
import { useDespachos } from '../../hooks/useDespachos';
import { useVehiculos } from '../../hooks/useVehiculos';
import { useConductores } from '../../hooks/useConductores';
import { useDocumentos } from '../../hooks/useDocumentos';
import useMovimientos from '../../hooks/useMovimientos';
import { getSession } from '../../services/authService';
import useAlertas from '../../hooks/useAlertas';
import { periodoLabel, toPeriodo } from '../../utils/dateUtils';
import { buildAlertasPrevencion, buildResumen, listPeriodos } from './dashboardMetrics';
import { ordenarPorSeveridad } from '../../utils/vencimientos';
import DashboardHeader from './components/DashboardHeader';
import MetricCards from './components/MetricCards';
import AlertsPanel from './components/AlertsPanel';
import DespachosTable from './components/DespachosTable';
import TelemetriaChart from './components/TelemetriaChart';
import ModalDespacho from './components/ModalDespacho';
import ConfirmDialog from '../../components/ConfirmDialog';
import './Dashboard.css';

export default function DashboardPage() {
  const { despachos, loading, error, crear, actualizar, eliminar, limpiarError } = useDespachos();
  // La flota viene de la API: la placa de un despacho debe existir en la tabla de vehículos.
  const { vehiculos, error: errorFlota } = useVehiculos();
  const { conductores: fichasConductores } = useConductores();
  const { documentos } = useDocumentos();
  const { movimientos } = useMovimientos();
  const empresa = getSession()?.empresa ?? '';
  const { alertasPanel } = useAlertas();

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

  const resumen = useMemo(
    () =>
      buildResumen({
        despachosPeriodo,
        despachos,
        flota: vehiculos,
        conductores: fichasConductores,
        movimientos,
        periodo: periodoActivo,
      }),
    [despachosPeriodo, despachos, vehiculos, fichasConductores, movimientos, periodoActivo],
  );

  // Las preventivas (licencias, documentos, despachos en riesgo) usan todos los despachos,
  // no solo los del período elegido: un despacho de la próxima semana importa aunque se vea otro mes.
  const alertasPrevencion = useMemo(
    () => buildAlertasPrevencion({ despachos, flota: vehiculos, conductores: fichasConductores, documentos }),
    [despachos, vehiculos, fichasConductores, documentos],
  );

  const alertasConsolidadas = useMemo(
    () => [...alertasPanel, ...resumen.alertas, ...alertasPrevencion].sort(ordenarPorSeveridad),
    [alertasPanel, resumen.alertas, alertasPrevencion],
  );

  const conductores = useMemo(
    () => getConductoresConocidos({ conductores: fichasConductores, flota: vehiculos, despachos }),
    [fichasConductores, vehiculos, despachos],
  );

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

  const confirmarEliminacion = async () => {
    const id = despachoAEliminar?.id;
    setDespachoAEliminar(null);
    if (id) await eliminar(id);
  };

  return (
    <div className="container-fluid max-w-container">
      {(error || errorFlota) && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center py-2 fs-8" role="alert">
          <span>{error ?? `No se pudo cargar la flota: ${errorFlota}`}</span>
          {error && <button type="button" className="btn-close btn-close-white" aria-label="Cerrar" onClick={limpiarError} />}
        </div>
      )}
      {loading && <p className="text-secondary fs-8">Cargando despachos desde la API…</p>}
      <DashboardHeader
        empresa={empresa}
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
            <TelemetriaChart despachos={despachosPeriodo} periodo={periodoActivo} />
          </div>

          <AlertsPanel alertas={alertasConsolidadas} />
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
          despachos={despachos}
          onClose={cerrarModal}
          onGuardar={guardarDespacho}
        />
      )}

      <ConfirmDialog
        open={Boolean(despachoAEliminar)}
        titulo="Eliminar despacho"
        mensaje={
          despachoAEliminar
            ? `¿Seguro que deseas eliminar el despacho ${codigoDespacho(despachoAEliminar)} (${despachoAEliminar.origen} → ${despachoAEliminar.destino})? Esta acción no se puede deshacer.`
            : ''
        }
        onConfirm={confirmarEliminacion}
        onCancel={() => setDespachoAEliminar(null)}
      />
    </div>
  );
}
