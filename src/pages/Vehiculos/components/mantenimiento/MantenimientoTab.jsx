import { useMemo, useState } from 'react';
import { useMantenimiento } from '../../../../hooks/useMantenimiento';
import ConfirmDialog from '../../../../components/ConfirmDialog';
import { formatFechaCorta } from '../../../../utils/dateUtils';
import { formatCOP, formatNumber } from '../../../../utils/format';
import { NIVEL_PLAN, estadoPlan, resumenMantenimiento } from '../../mantenimientoMetrics';
import PlanModal from './PlanModal';
import { AbrirOrdenModal, CerrarOrdenModal } from './OrdenModales';

const frecuencia = (plan) =>
  [plan.cadaKm && `${formatNumber(plan.cadaKm)} km`, plan.cadaDias && `${plan.cadaDias} días`].filter(Boolean).join(' o ');

function Resumen({ resumen }) {
  const tarjetas = [
    { label: 'Vencidos', valor: resumen.vencido, clase: 'text-danger', icono: 'error' },
    { label: 'Próximos', valor: resumen.proximo, clase: 'text-warning', icono: 'schedule' },
    { label: 'En taller', valor: resumen.enTaller, clase: 'text-orange', icono: 'build' },
    { label: 'Al día', valor: resumen.al_dia, clase: 'text-success', icono: 'verified' },
  ];
  return (
    <div className="row g-3 mb-3">
      {tarjetas.map((tarjeta) => (
        <div key={tarjeta.label} className="col-6 col-lg-3">
          <div className="card-dark-metric p-3 d-flex justify-content-between align-items-center h-100">
            <div>
              <span className="form-label-dark">{tarjeta.label.toUpperCase()}</span>
              <div className={`metric-number fw-bold ${tarjeta.clase}`}>{tarjeta.valor}</div>
            </div>
            <span className={`material-symbols-outlined fs-3 ${tarjeta.clase}`}>{tarjeta.icono}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MantenimientoTab({ vehiculos }) {
  const { planes, ordenes, loading, error, guardarPlan, eliminarPlan, abrir, cerrar, anular, limpiarError, setError } =
    useMantenimiento();

  const [filtroPlaca, setFiltroPlaca] = useState('');
  const [modal, setModal] = useState(null); // { tipo: 'plan' | 'abrir' | 'cerrar', datos }
  const [confirmacion, setConfirmacion] = useState(null); // { tipo: 'plan' | 'orden', item }

  const porPlaca = useMemo(() => new Map(vehiculos.map((vehiculo) => [vehiculo.id, vehiculo])), [vehiculos]);
  const resumen = useMemo(() => resumenMantenimiento(planes, vehiculos, ordenes), [planes, vehiculos, ordenes]);

  const filasPlanes = useMemo(
    () =>
      planes
        .filter((plan) => !filtroPlaca || plan.placa === filtroPlaca)
        .map((plan) => ({ plan, estado: estadoPlan(plan, porPlaca.get(plan.placa)) }))
        .sort((a, b) => NIVEL_PLAN[a.estado.nivel].orden - NIVEL_PLAN[b.estado.nivel].orden || a.plan.placa.localeCompare(b.plan.placa)),
    [planes, filtroPlaca, porPlaca],
  );

  const filasOrdenes = useMemo(
    () =>
      ordenes
        .filter((orden) => !filtroPlaca || orden.placa === filtroPlaca)
        .sort((a, b) => (a.estado === b.estado ? 0 : a.estado === 'Abierta' ? -1 : 1)),
    [ordenes, filtroPlaca],
  );

  const enTaller = useMemo(
    () => new Set(ordenes.filter((orden) => orden.estado === 'Abierta').map((orden) => orden.placa)),
    [ordenes],
  );

  const confirmar = async () => {
    const { tipo, item } = confirmacion;
    setConfirmacion(null);
    const resultado = tipo === 'plan' ? await eliminarPlan(item.id) : await anular(item.id);
    if (!resultado.ok) setError(resultado.error);
  };

  const cerrarModal = () => setModal(null);

  return (
    <div>
      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center py-2 fs-8" role="alert">
          <span>{error}</span>
          <button type="button" className="btn-close btn-close-white" aria-label="Cerrar" onClick={limpiarError} />
        </div>
      )}
      {loading && <p className="text-secondary fs-8">Cargando mantenimiento desde la API…</p>}

      <Resumen resumen={resumen} />

      <div className="card-dark p-3 mb-3">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-2 mb-3">
          <div>
            <h2 className="fs-6 text-white fw-bold mb-0">Planes de mantenimiento</h2>
            <span className="text-light-muted fs-8">
              Avisa cuando faltan 1.000 km o 15 días; manda lo que ocurra primero.
            </span>
          </div>
          <div className="d-flex align-items-center gap-2 no-print">
            <select className="select-dark" value={filtroPlaca} onChange={(event) => setFiltroPlaca(event.target.value)} aria-label="Filtrar por vehículo">
              <option value="">Todos los vehículos</option>
              {vehiculos.map((vehiculo) => (
                <option key={vehiculo.id} value={vehiculo.id}>
                  {vehiculo.id}
                </option>
              ))}
            </select>
            <button type="button" className="btn btn-outline-dark-custom" onClick={() => setModal({ tipo: 'abrir', datos: null })}>
              <span className="material-symbols-outlined fs-6">build</span> Orden correctiva
            </button>
            <button type="button" className="btn-orange-cta" onClick={() => setModal({ tipo: 'plan', datos: null })}>
              <span className="material-symbols-outlined fs-6">add</span> Nuevo plan
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-dark-custom align-middle mb-0">
            <thead>
              <tr>
                <th>VEHÍCULO</th>
                <th>TAREA</th>
                <th>FRECUENCIA</th>
                <th>ÚLTIMO SERVICIO</th>
                <th>PRÓXIMO</th>
                <th>ESTADO</th>
                <th className="text-end no-print">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filasPlanes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-light-muted fs-8 py-4">
                    No hay planes. Crea uno para que el sistema avise cuándo toca cada servicio.
                  </td>
                </tr>
              ) : (
                filasPlanes.map(({ plan, estado }) => {
                  const nivel = NIVEL_PLAN[estado.nivel];
                  const vehiculoEnTaller = enTaller.has(plan.placa);
                  return (
                    <tr key={plan.id}>
                      <td className="fs-7 text-white fw-bold">{plan.placa}</td>
                      <td className="fs-7 text-white">{plan.tarea}</td>
                      <td className="fs-8 text-light-muted">Cada {frecuencia(plan)}</td>
                      <td className="fs-8 text-white">
                        {plan.ultimoKm !== null ? `${formatNumber(plan.ultimoKm)} km` : '—'}
                        <small className="d-block text-light-muted">{plan.ultimaFecha ? formatFechaCorta(plan.ultimaFecha) : 'Sin fecha'}</small>
                      </td>
                      <td className="fs-8 text-white">
                        {[estado.proximoKm !== null && `${formatNumber(estado.proximoKm)} km`, estado.proximaFecha && formatFechaCorta(estado.proximaFecha)]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                        <small className="d-block text-light-muted">{estado.resumen}</small>
                      </td>
                      <td>
                        <span className={`badge bg-${nivel.variant}-subtle text-${nivel.variant} fs-8`}>
                          {vehiculoEnTaller ? 'En taller' : nivel.label}
                        </span>
                      </td>
                      <td className="text-end no-print text-nowrap">
                        <button
                          type="button"
                          className="btn btn-outline-dark-custom btn-sm p-1 me-1"
                          title={vehiculoEnTaller ? 'El vehículo ya tiene una orden abierta' : 'Abrir orden preventiva'}
                          disabled={vehiculoEnTaller}
                          onClick={() => setModal({ tipo: 'abrir', datos: plan })}
                        >
                          <span className="material-symbols-outlined fs-6 text-warning">build</span>
                        </button>
                        <button type="button" className="btn btn-outline-dark-custom btn-sm p-1 me-1" title="Editar" onClick={() => setModal({ tipo: 'plan', datos: plan })}>
                          <span className="material-symbols-outlined fs-6 text-light-muted">edit</span>
                        </button>
                        <button type="button" className="btn btn-outline-dark-custom btn-sm p-1" title="Eliminar" onClick={() => setConfirmacion({ tipo: 'plan', item: plan })}>
                          <span className="material-symbols-outlined fs-6 text-danger">delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card-dark p-3">
        <h2 className="fs-6 text-white fw-bold mb-3">Órdenes de mantenimiento</h2>
        <div className="table-responsive">
          <table className="table table-dark-custom align-middle mb-0">
            <thead>
              <tr>
                <th>VEHÍCULO</th>
                <th>TIPO</th>
                <th>TRABAJO</th>
                <th>INGRESO</th>
                <th>SALIDA</th>
                <th className="text-end">COSTO</th>
                <th>ESTADO</th>
                <th className="text-end no-print">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filasOrdenes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-light-muted fs-8 py-4">
                    Sin órdenes registradas.
                  </td>
                </tr>
              ) : (
                filasOrdenes.map((orden) => {
                  const abierta = orden.estado === 'Abierta';
                  return (
                    <tr key={orden.id}>
                      <td className="fs-7 text-white fw-bold">{orden.placa}</td>
                      <td className="fs-8 text-white">{orden.tipo}</td>
                      <td className="fs-7 text-white">
                        {orden.descripcion}
                        {orden.taller && <small className="d-block text-light-muted">{orden.taller}</small>}
                      </td>
                      <td className="fs-8 text-white">
                        {formatFechaCorta(orden.fechaApertura)}
                        <small className="d-block text-light-muted">{formatNumber(orden.kmApertura)} km</small>
                      </td>
                      <td className="fs-8 text-white">
                        {orden.fechaCierre ? formatFechaCorta(orden.fechaCierre) : '—'}
                        {orden.kmCierre !== null && <small className="d-block text-light-muted">{formatNumber(orden.kmCierre)} km</small>}
                      </td>
                      <td className="fs-7 text-white text-end">
                        {orden.costo !== null ? formatCOP(orden.costo) : '—'}
                        {orden.movimientoId && <small className="d-block text-light-muted">En Finanzas</small>}
                      </td>
                      <td>
                        <span className={`badge fs-8 ${abierta ? 'bg-warning-subtle text-warning' : 'bg-success-subtle text-success'}`}>
                          {abierta ? 'En taller' : 'Cerrada'}
                        </span>
                      </td>
                      <td className="text-end no-print text-nowrap">
                        {abierta && (
                          <>
                            <button
                              type="button"
                              className="btn btn-outline-dark-custom btn-sm p-1 me-1"
                              title="Cerrar orden"
                              onClick={() => setModal({ tipo: 'cerrar', datos: orden })}
                            >
                              <span className="material-symbols-outlined fs-6 text-success">task_alt</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-dark-custom btn-sm p-1"
                              title="Anular orden"
                              onClick={() => setConfirmacion({ tipo: 'orden', item: orden })}
                            >
                              <span className="material-symbols-outlined fs-6 text-danger">cancel</span>
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal?.tipo === 'plan' && (
        <PlanModal plan={modal.datos} vehiculos={vehiculos} placaInicial={filtroPlaca} onGuardar={guardarPlan} onClose={cerrarModal} />
      )}
      {modal?.tipo === 'abrir' && (
        <AbrirOrdenModal plan={modal.datos} vehiculos={vehiculos} planes={planes} ordenes={ordenes} onAbrir={abrir} onClose={cerrarModal} />
      )}
      {modal?.tipo === 'cerrar' && (
        <CerrarOrdenModal orden={modal.datos} vehiculo={porPlaca.get(modal.datos.placa)} onCerrar={cerrar} onClose={cerrarModal} />
      )}

      <ConfirmDialog
        open={Boolean(confirmacion)}
        titulo={confirmacion?.tipo === 'plan' ? 'Eliminar plan' : 'Anular orden'}
        etiquetaConfirmar={confirmacion?.tipo === 'plan' ? 'Eliminar' : 'Anular'}
        mensaje={
          confirmacion?.tipo === 'plan'
            ? `¿Eliminar el plan "${confirmacion.item.tarea}" de ${confirmacion.item.placa}? Las órdenes ya registradas se conservan.`
            : confirmacion
              ? `¿Anular la orden "${confirmacion.item.descripcion}" de ${confirmacion.item.placa}? El vehículo volverá a Operativo.`
              : ''
        }
        onConfirm={confirmar}
        onCancel={() => setConfirmacion(null)}
      />
    </div>
  );
}
