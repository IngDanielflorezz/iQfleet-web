import { useMemo, useState } from 'react';
import './Finanzas.css';
import useMovimientos from '../../hooks/useMovimientos';
import { useVehiculos } from '../../hooks/useVehiculos';
import { useConductores } from '../../hooks/useConductores';
import {
  computeFinanzasResumen,
  filtrarMovimientos,
  periodosDisponibles,
  periodoLabel,
} from './finanzasMetrics';
import FinanzasHeader from './components/FinanzasHeader';
import FinanzasMetricCards from './components/FinanzasMetricCards';
import MovimientoForm from './components/MovimientoForm';
import BalanceChart from './components/BalanceChart';
import MovimientosTable from './components/MovimientosTable';
import MovimientoDetailModal from './components/MovimientoDetailModal';
import ConfirmDialog from './components/ConfirmDialog';

function periodoActual() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
}

export default function FinanzasPage() {
  const { movimientos, guardar, eliminar } = useMovimientos();
  const { vehiculos } = useVehiculos();
  const { conductores } = useConductores();

  const periodos = useMemo(() => periodosDisponibles(movimientos), [movimientos]);
  const [periodo, setPeriodo] = useState(() => periodosDisponibles(movimientos)[0] ?? periodoActual());
  const [busqueda, setBusqueda] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('Todos');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [movimientoEnEdicion, setMovimientoEnEdicion] = useState(null);
  const [movimientoDetalle, setMovimientoDetalle] = useState(null);
  const [movimientoAEliminar, setMovimientoAEliminar] = useState(null);

  const periodoEfectivo = periodos.includes(periodo) ? periodo : periodos[0] ?? periodoActual();

  const resumen = useMemo(
    () => computeFinanzasResumen(movimientos, periodoEfectivo),
    [movimientos, periodoEfectivo],
  );

  const filas = useMemo(() => {
    const delPeriodo = movimientos.filter((movimiento) => String(movimiento.fecha).slice(0, 7) === periodoEfectivo);
    return filtrarMovimientos(delPeriodo, { busqueda, tipo: tipoFiltro });
  }, [movimientos, periodoEfectivo, busqueda, tipoFiltro]);

  const sugerenciasConductor = useMemo(
    () => [...new Set([
      ...conductores.map((conductor) => conductor.nombre),
      ...vehiculos.map((vehiculo) => vehiculo.conductor),
    ].filter(Boolean))],
    [conductores, vehiculos],
  );

  const abrirNuevo = () => {
    setMovimientoEnEdicion(null);
    setModalAbierto(true);
  };

  const abrirEditar = (movimiento) => {
    setMovimientoEnEdicion(movimiento);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setMovimientoEnEdicion(null);
  };

  const guardarMovimiento = async (dto, { id, file }) => {
    const guardado = await guardar(dto, { id, file });
    const mesGuardado = String(guardado.fecha).slice(0, 7);
    if (!periodos.includes(mesGuardado)) setPeriodo(mesGuardado);
    cerrarModal();
  };

  const confirmarEliminacion = () => {
    if (movimientoAEliminar) eliminar(movimientoAEliminar.id);
    setMovimientoAEliminar(null);
  };

  return (
    <div>
      <FinanzasHeader
        movimientos={movimientos}
        periodo={periodoEfectivo}
        onPeriodoChange={setPeriodo}
        onNuevo={abrirNuevo}
      />

      <FinanzasMetricCards resumen={resumen} movimientos={movimientos} periodo={periodoEfectivo} />

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-5">
          <div className="card-dark p-3 h-100 d-flex flex-column">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <span className="material-symbols-outlined text-orange fs-5">receipt_long</span>
                <div>
                  <h2 className="fs-6 text-white fw-bold mb-0">Registro de Movimiento</h2>
                  <span className="text-light-muted fs-8">{periodoLabel(periodoEfectivo)} · Contabilización directa en tesorería</span>
                </div>
              </div>
              <span className="badge badge-dark-subtle fs-8">RÁPIDO</span>
            </div>
            <button type="button" className="btn-orange-cta w-100 py-2 mt-auto" onClick={abrirNuevo}>
              <span className="material-symbols-outlined fs-6">add_circle</span>
              <span>Registrar Ingreso o Egreso</span>
            </button>
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <BalanceChart movimientos={movimientos} periodo={periodoEfectivo} />
        </div>
      </div>

      <div className="card-dark p-3 mb-3">
        <div className="d-flex flex-wrap align-items-center gap-2">
          <div className="input-dark-group flex-grow-1">
            <span className="material-symbols-outlined input-dark-icon">search</span>
            <input
              type="text"
              className="form-control-dark w-100"
              placeholder="Buscar por concepto, placa, conductor o factura…"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
            />
          </div>
          <select className="select-dark" value={tipoFiltro} onChange={(evento) => setTipoFiltro(evento.target.value)}>
            <option value="Todos">Todos los movimientos</option>
            <option value="Ingreso">Solo ingresos</option>
            <option value="Egreso">Solo egresos</option>
          </select>
          <button
            type="button"
            className="btn btn-outline-dark-custom"
            onClick={() => { setBusqueda(''); setTipoFiltro('Todos'); }}
          >
            Limpiar
          </button>
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-between mb-2">
        <h2 className="fs-6 text-white fw-bold mb-0">Movimientos del período ({filas.length})</h2>
        <span className="text-light-muted fs-8">Ingresos y egresos consolidados de {periodoLabel(periodoEfectivo)}</span>
      </div>

      <MovimientosTable
        filas={filas}
        onVer={setMovimientoDetalle}
        onEditar={abrirEditar}
        onEliminar={setMovimientoAEliminar}
      />

      {modalAbierto && (
        <MovimientoForm
          movimiento={movimientoEnEdicion}
          vehiculos={vehiculos}
          sugerenciasConductor={sugerenciasConductor}
          onGuardar={guardarMovimiento}
          onCancelar={cerrarModal}
        />
      )}

      <MovimientoDetailModal movimiento={movimientoDetalle} onClose={() => setMovimientoDetalle(null)} />

      <ConfirmDialog
        open={Boolean(movimientoAEliminar)}
        titulo="Eliminar movimiento"
        mensaje={
          movimientoAEliminar
            ? `¿Seguro que deseas eliminar "${movimientoAEliminar.concepto}" por ${movimientoAEliminar.monto?.toLocaleString('es-CO')} COP? Esta acción no se puede deshacer.`
            : ''
        }
        onConfirm={confirmarEliminacion}
        onCancel={() => setMovimientoAEliminar(null)}
      />
    </div>
  );
}
