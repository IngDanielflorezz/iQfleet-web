import '../Conductores/Conductores.css';
import './Vehiculos.css';
import { vehiculos, estadoVehiculoVariants } from '../../data/vehiculos';

export default function VehiculosPage() {
  const total = vehiculos.length;
  const operativos = vehiculos.filter((v) => v.estado === 'Operativo').length;
  const enMantenimiento = vehiculos.filter((v) => v.estado === 'Mantenimiento').length;
  const disponibles = Math.round((operativos / total) * 100);

  return (
    <div className="max-w-container mx-auto">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge badge-orange-subtle text-uppercase fw-bold">GESTIÓN DE PARQUE AUTOMOTOR</span>
            <span className="text-light-muted fs-8">ID Sistema: IQ-FLT-01</span>
          </div>
          <h1 className="page-module-title mb-1">Administración de Flota &amp; Vehículos</h1>
          <p className="text-light-muted fs-7 mb-0">
            <strong className="text-white">{total}</strong> Vehículos registrados •{' '}
            <span className="text-success fw-semibold">{operativos} Operativos</span> •{' '}
            <span className="text-warning fw-semibold">{enMantenimiento} En mantenimiento</span>
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn-outline-dark-custom">
            <span className="material-symbols-outlined">download</span> Exportar Flota
          </button>
          <button className="btn-orange-cta" data-bs-toggle="modal" data-bs-target="#modalVehiculo">
            <span className="material-symbols-outlined">directions_bus</span> Registrar Vehículo
          </button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card-dark-metric p-3 d-flex justify-content-between align-items-start h-100">
            <div>
              <span className="form-label-dark">FLOTA TOTAL</span>
              <div className="d-flex align-items-baseline gap-2 my-1">
                <span className="metric-number text-white fw-bold">{total}</span>
                <span className="text-light-muted fs-8">unidades</span>
              </div>
              <small className="text-success d-flex align-items-center gap-1 fs-8">
                <span className="material-symbols-outlined">directions_bus</span> Parque registrado
              </small>
            </div>
            <div className="icon-shield-check">
              <span className="material-symbols-outlined">garage</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <div className="card-dark-metric p-3 d-flex justify-content-between align-items-start h-100">
            <div>
              <span className="form-label-dark">DISPONIBILIDAD</span>
              <div className="d-flex align-items-baseline gap-2 my-1">
                <span className="metric-number text-white fw-bold">{disponibles}%</span>
                <span className="text-light-muted fs-8">{operativos}/{total}</span>
              </div>
              <small className="text-success d-flex align-items-center gap-1 fs-8">
                <span className="material-symbols-outlined">check_circle</span> Listos para despacho
              </small>
            </div>
            <div className="icon-shield-check">
              <span className="material-symbols-outlined">task_alt</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <div className="card-dark-metric p-3 d-flex justify-content-between align-items-start h-100">
            <div>
              <span className="form-label-dark">EN TALLER</span>
              <div className="d-flex align-items-baseline gap-2 my-1">
                <span className="metric-number text-white fw-bold">{enMantenimiento}</span>
                <span className="text-light-muted fs-8">unidades</span>
              </div>
              <small className="text-warning d-flex align-items-center gap-1 fs-8">
                <span className="material-symbols-outlined">build</span> Mantenimiento preventivo
              </small>
            </div>
            <div className="icon-shield-check">
              <span className="material-symbols-outlined">construction</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <div className="card-dark-metric p-3 d-flex justify-content-between align-items-start h-100">
            <div>
              <span className="form-label-dark">ALERTAS LEGALES</span>
              <div className="d-flex align-items-baseline gap-2 my-1">
                <span className="metric-number text-white fw-bold">3</span>
                <span className="text-light-muted fs-8">por vencer</span>
              </div>
              <small className="text-danger d-flex align-items-center gap-1 fs-8">
                <span className="material-symbols-outlined">error</span> SOAT / RTM críticos
              </small>
            </div>
            <div className="icon-shield-check">
              <span className="material-symbols-outlined">gpp_maybe</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card-dark p-3">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <div className="input-dark-group" style={{ width: '320px' }}>
            <span className="material-symbols-outlined input-dark-icon">search</span>
            <input type="text" className="form-control form-control-dark" placeholder="Buscar por Placa, Marca o Conductor..." />
          </div>
          <div className="d-flex align-items-center gap-2">
            <select className="select-dark" defaultValue="Todas">
              <option>Todas</option>
              <option>Operativo</option>
              <option>Mantenimiento</option>
              <option>Fuera de servicio</option>
            </select>
            <button className="btn-outline-dark-custom">
              <span className="material-symbols-outlined">filter_list</span> Filtrar
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-dark-custom align-middle mb-0">
            <thead>
              <tr>
                <th>VEHÍCULO</th>
                <th>TIPO</th>
                <th>AÑO</th>
                <th>CONDUCTOR ASIGNADO</th>
                <th>KILOMETRAJE</th>
                <th>ESTADO</th>
                <th>SOAT</th>
                <th>RTM</th>
                <th className="text-end">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {vehiculos.map((vehiculo) => (
                <tr key={vehiculo.id}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div className="plate-box text-center">
                        <span className="plate-city">{vehiculo.ciudad}</span>
                        <span className="plate-code">{vehiculo.id}</span>
                        <span className="plate-country">COLOMBIA</span>
                      </div>
                      <div>
                        <div className="fw-bold text-white fs-7">{vehiculo.marca} {vehiculo.modelo}</div>
                        <small className="text-light-muted fs-8">{vehiculo.tipo}</small>
                      </div>
                    </div>
                  </td>
                  <td className="fs-7">{vehiculo.tipo}</td>
                  <td className="fs-7">{vehiculo.anio}</td>
                  <td className="fs-7">{vehiculo.conductor}</td>
                  <td className="fs-7">{vehiculo.kilometraje.toLocaleString('es-CO')} km</td>
                  <td>
                    <span className={`badge bg-${estadoVehiculoVariants[vehiculo.estado]}-subtle text-${estadoVehiculoVariants[vehiculo.estado]}`}>
                      {vehiculo.estado}
                    </span>
                  </td>
                  <td className="fs-7">{vehiculo.soatVence}</td>
                  <td className="fs-7">{vehiculo.rtmVence}</td>
                  <td className="text-end">
                    <button className="btn btn-outline-dark-custom btn-sm p-1 me-1" title="Ver detalle">
                      <span className="material-symbols-outlined fs-6 text-warning">visibility</span>
                    </button>
                    <button className="btn btn-outline-dark-custom btn-sm p-1" title="Editar">
                      <span className="material-symbols-outlined fs-6 text-light-muted">edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="modal fade" id="modalVehiculo" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content card-dark text-white">
            <div className="modal-header border-dark-custom p-3">
              <h5 className="modal-title fw-bold fs-7">Registrar Vehículo</h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body d-flex flex-column gap-3 p-3">
              <div>
                <label className="form-label-dark mb-1">Placa</label>
                <input type="text" className="form-control form-control-dark" style={{ paddingLeft: '12px' }} placeholder="Ej. UVP-123" />
              </div>
              <div className="row g-3">
                <div className="col-6">
                  <label className="form-label-dark mb-1">Marca</label>
                  <input type="text" className="form-control form-control-dark" style={{ paddingLeft: '12px' }} placeholder="Ej. Kenworth" />
                </div>
                <div className="col-6">
                  <label className="form-label-dark mb-1">Modelo</label>
                  <input type="text" className="form-control form-control-dark" style={{ paddingLeft: '12px' }} placeholder="Ej. T800" />
                </div>
              </div>
              <div className="row g-3">
                <div className="col-6">
                  <label className="form-label-dark mb-1">Tipo</label>
                  <select className="select-dark w-100" defaultValue="Bus">
                    <option>Bus</option>
                    <option>Buseta</option>
                    <option>Camión</option>
                    <option>Van</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label-dark mb-1">Año</label>
                  <input type="number" className="form-control form-control-dark" style={{ paddingLeft: '12px' }} placeholder="2024" />
                </div>
              </div>
            </div>
            <div className="modal-footer border-dark-custom p-2">
              <button type="button" className="btn-outline-dark-custom" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" className="btn-orange-cta">Guardar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
