import { useMemo, useState } from 'react';
import {
  MOVIMIENTO_TIPOS,
  CONCEPTOS_INGRESO,
  CONCEPTOS_EGRESO,
  MEDIOS_PAGO,
  validateMovimiento,
  validateComprobante,
} from '../../../services/finanzaService';
import { formatCOP } from '../../../utils/format';

const hoyISO = () => new Date().toISOString().slice(0, 10);

function estadoInicial(movimiento) {
  if (movimiento) {
    return {
      tipo: movimiento.tipo,
      concepto: movimiento.concepto,
      placa: movimiento.placa ?? '',
      conductor: movimiento.conductor ?? '',
      factura: movimiento.factura ?? '',
      medioPago: movimiento.medioPago ?? 'Transferencia',
      monto: String(movimiento.monto ?? ''),
      km: movimiento.km === null || movimiento.km === undefined ? '' : String(movimiento.km),
      fecha: movimiento.fecha ?? hoyISO(),
    };
  }
  return {
    tipo: MOVIMIENTO_TIPOS.EGRESO,
    concepto: CONCEPTOS_EGRESO[0],
    placa: '',
    conductor: '',
    factura: '',
    medioPago: 'Transferencia',
    monto: '',
    km: '',
    fecha: hoyISO(),
  };
}

export default function MovimientoForm({
  movimiento,
  vehiculos = [],
  sugerenciasConductor = [],
  onGuardar,
  onCancelar,
}) {
  const [form, setForm] = useState(() => estadoInicial(movimiento));
  const [errores, setErrores] = useState({});
  const [archivo, setArchivo] = useState(null);
  const [errorArchivo, setErrorArchivo] = useState('');
  const [arrastrando, setArrastrando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const esEdicion = Boolean(movimiento);
  const conceptos = form.tipo === MOVIMIENTO_TIPOS.INGRESO ? CONCEPTOS_INGRESO : CONCEPTOS_EGRESO;

  const cambioPlacaConductor = useMemo(() => {
    const mapa = new Map();
    vehiculos.forEach((vehiculo) => {
      if (vehiculo.placa && vehiculo.conductor) mapa.set(vehiculo.placa, vehiculo.conductor);
    });
    return mapa;
  }, [vehiculos]);

  const actualizarCampo = (campo) => (evento) => {
    const { value } = evento.target;
    setForm((previo) => {
      const siguiente = { ...previo, [campo]: value };
      if (campo === 'placa') {
        const conductor = cambioPlacaConductor.get(value);
        if (previo.tipo === MOVIMIENTO_TIPOS.EGRESO && conductor) siguiente.conductor = conductor;
        if (!value) siguiente.conductor = '';
      }
      return siguiente;
    });
    setErrores((previo) => ({ ...previo, [campo]: undefined }));
  };

  const cambiarTipo = (tipo) => {
    const lista = tipo === MOVIMIENTO_TIPOS.INGRESO ? CONCEPTOS_INGRESO : CONCEPTOS_EGRESO;
    setForm((previo) => ({ ...previo, tipo, concepto: lista[0] }));
  };

  const seleccionarArchivo = (file) => {
    const error = validateComprobante(file);
    if (error) {
      setErrorArchivo(error);
      setArchivo(null);
      return;
    }
    setErrorArchivo('');
    setArchivo(file);
  };

  const onDrop = (evento) => {
    evento.preventDefault();
    setArrastrando(false);
    const file = evento.dataTransfer.files?.[0];
    if (file) seleccionarArchivo(file);
  };

  const manejarEnvio = async (evento) => {
    evento.preventDefault();
    const erroresValidacion = validateMovimiento(form);
    if (Object.keys(erroresValidacion).length > 0) {
      setErrores(erroresValidacion);
      return;
    }
    setEnviando(true);
    try {
      await onGuardar(form, { id: movimiento?.id, file: archivo });
    } finally {
      setEnviando(false);
    }
  };

  const montoNumerico = Number(String(form.monto).replace(/\./g, '').replace(',', '.')) || 0;

  return (
    <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content card-dark border-0">
          <div className="modal-header border-0">
            <h5 className="modal-title text-white fw-bold">
              {esEdicion ? 'Editar Movimiento' : 'Registrar Movimiento'}
            </h5>
            <button type="button" className="btn-close btn-close-white" aria-label="Cerrar" onClick={onCancelar}></button>
          </div>

          <form className="modal-body d-flex flex-column gap-3" onSubmit={manejarEnvio}>
            <div className="d-flex bg-input p-1 rounded border-dark-custom" style={{ backgroundColor: 'var(--bg-input)' }}>
              <button
                type="button"
                className={`flex-fill py-1 fs-8 ${form.tipo === MOVIMIENTO_TIPOS.EGRESO ? 'btn-orange-cta' : 'btn btn-link btn-toggle-inactive text-decoration-none d-flex align-items-center justify-content-center gap-1'}`}
                onClick={() => cambiarTipo(MOVIMIENTO_TIPOS.EGRESO)}
              >
                <span className="material-symbols-outlined fs-6">arrow_downward</span>
                <span>Gasto / Egreso</span>
              </button>
              <button
                type="button"
                className={`flex-fill py-1 fs-8 ${form.tipo === MOVIMIENTO_TIPOS.INGRESO ? 'btn btn-ingreso-cta' : 'btn btn-link btn-toggle-inactive text-decoration-none d-flex align-items-center justify-content-center gap-1'}`}
                onClick={() => cambiarTipo(MOVIMIENTO_TIPOS.INGRESO)}
              >
                <span className="material-symbols-outlined fs-6">arrow_upward</span>
                <span>Ingreso de Flete</span>
              </button>
            </div>

            <div className="row g-2">
              <div className="col-12 col-md-6">
                <label className="form-label-dark mb-1">CONCEPTO ESPECÍFICO</label>
                <select className="select-dark w-100" value={form.concepto} onChange={actualizarCampo('concepto')}>
                  {conceptos.map((concepto) => (
                    <option key={concepto} value={concepto}>{concepto}</option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label-dark mb-1">FECHA</label>
                <input
                  type="date"
                  className={`form-control-dark w-100 ${errores.fecha ? 'input-error' : ''}`}
                  style={{ paddingLeft: '12px' }}
                  value={form.fecha}
                  onChange={actualizarCampo('fecha')}
                />
                {errores.fecha && <span className="fs-8 text-danger d-block mt-1">{errores.fecha}</span>}
              </div>
            </div>

            <div className="row g-2">
              <div className="col-6">
                <label className="form-label-dark mb-1">VEHÍCULO / PLACA</label>
                <select className="select-dark w-100" value={form.placa} onChange={actualizarCampo('placa')}>
                  <option value="">Sin placa</option>
                  {vehiculos.map((vehiculo) => (
                    <option key={vehiculo.id} value={vehiculo.placa}>{vehiculo.placa}</option>
                  ))}
                </select>
              </div>
              <div className="col-6">
                <label className="form-label-dark mb-1">CONDUCTOR A CARGO</label>
                <input
                  type="text"
                  list="conductores-finanzas"
                  className="form-control-dark w-100"
                  style={{ paddingLeft: '12px' }}
                  value={form.conductor}
                  onChange={actualizarCampo('conductor')}
                  placeholder="Nombre del conductor"
                />
                <datalist id="conductores-finanzas">
                  {sugerenciasConductor.map((nombre) => (
                    <option key={nombre} value={nombre} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="row g-2">
              <div className="col-6">
                <label className="form-label-dark mb-1">FACTURA / RECIBO DIAN</label>
                <input
                  type="text"
                  className="form-control-dark w-100"
                  style={{ paddingLeft: '12px' }}
                  placeholder="FE-000000"
                  value={form.factura}
                  onChange={actualizarCampo('factura')}
                />
              </div>
              <div className="col-6">
                <label className="form-label-dark mb-1">MEDIO DE PAGO</label>
                <select className="select-dark w-100" value={form.medioPago} onChange={actualizarCampo('medioPago')}>
                  {MEDIOS_PAGO.map((medio) => (
                    <option key={medio} value={medio}>{medio}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row g-2">
              <div className="col-6">
                <label className="form-label-dark mb-1">MONTO EN $ COP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className={`form-control-dark w-100 text-end text-orange fw-bold ${errores.monto ? 'input-error' : ''}`}
                  style={{ paddingLeft: '12px' }}
                  placeholder="0"
                  value={form.monto}
                  onChange={actualizarCampo('monto')}
                />
                {errores.monto ? (
                  <span className="fs-8 text-danger d-block text-end mt-1">{errores.monto}</span>
                ) : (
                  <span className="fs-8 link-orange d-block text-end mt-1">{formatCOP(montoNumerico)}</span>
                )}
              </div>
              <div className="col-6">
                <label className="form-label-dark mb-1">KILOMETRAJE (OPCIONAL)</label>
                <input
                  type="number"
                  min="0"
                  className={`form-control-dark w-100 ${errores.km ? 'input-error' : ''}`}
                  style={{ paddingLeft: '12px' }}
                  placeholder="0"
                  value={form.km}
                  onChange={actualizarCampo('km')}
                />
                {errores.km && <span className="fs-8 text-danger d-block mt-1">{errores.km}</span>}
              </div>
            </div>

            <div>
              <label className="form-label-dark mb-1">COMPROBANTE DE SOPORTE</label>
              <label
                className={`file-drop-zone p-3 rounded text-center d-block ${arrastrando ? 'drag-over' : ''}`}
                onDragOver={(evento) => { evento.preventDefault(); setArrastrando(true); }}
                onDragLeave={() => setArrastrando(false)}
                onDrop={onDrop}
              >
                <span className="material-symbols-outlined text-orange fs-4">cloud_upload</span>
                <div className="fs-8 text-white fw-bold">
                  {archivo ? archivo.name : movimiento?.comprobanteNombre || 'Subir foto o PDF del soporte'}
                </div>
                <span className="text-light-muted fs-8">Lectura instantánea de CUFE y total (máx. 2 MB)</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,application/pdf"
                  className="d-none"
                  onChange={(evento) => evento.target.files?.[0] && seleccionarArchivo(evento.target.files[0])}
                />
              </label>
              {errorArchivo && <span className="fs-8 text-danger d-block mt-1">{errorArchivo}</span>}
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-dark-custom" onClick={onCancelar}>Cancelar</button>
              <button type="submit" className="btn-orange-cta" disabled={enviando}>
                <span className="material-symbols-outlined fs-6">add</span>
                <span>{enviando ? 'Guardando…' : esEdicion ? 'Guardar Cambios' : 'Guardar y Contabilizar'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
