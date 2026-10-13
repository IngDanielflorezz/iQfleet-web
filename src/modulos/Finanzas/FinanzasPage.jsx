import './Finanzas.css';

export default function FinanzasPage() {
  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge badge-orange-subtle fs-8 fw-bold">MÓDULO ECONÓMICO</span>
            <span className="text-light-muted fs-8">• Auditoría DIAN &amp; Facturación Electrónica</span>
          </div>
          <h1 className="fs-4 text-white fw-bold mb-1">Finanzas &amp; Rentabilidad de Flota</h1>
          <p className="text-light-muted fs-8 mb-0">Control de fletes, nómina operativa, combustible y balance neto consolidado en Pesos Colombianos (COP).</p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <div className="btn-outline-dark-custom py-2">
            <span className="material-symbols-outlined fs-6 text-light-muted">date_range</span>
            <div className="lh-1 text-start">
              <span className="text-light-muted fs-8 d-block" style={{ fontSize: '0.65rem' }}>PERÍODO DE LIQUIDACIÓN</span>
              <strong className="text-white fs-8">Octubre 2024</strong>
            </div>
          </div>
          <button className="btn-orange-cta">
            <span className="material-symbols-outlined fs-6">add_circle</span>
            <span>Registrar Movimiento / Egreso</span>
          </button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-3">
          <div className="card-dark p-3 position-relative overflow-hidden">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="form-label-dark mb-0">INGRESOS BRUTOS MES</span>
              <span className="material-symbols-outlined text-success fs-5">account_balance_wallet</span>
            </div>
            <div className="d-flex align-items-baseline gap-1">
              <span className="fs-4 text-white fw-bold">$58.200.000</span>
              <span className="fs-8 text-light-muted">COP</span>
            </div>
            <div className="d-flex align-items-center gap-1 fs-8 text-success mt-1">
              <span className="material-symbols-outlined fs-6">trending_up</span>
              <span>+8.5% vs. Septiembre ($53.6M)</span>
            </div>
            <div className="kpi-bottom-line bg-success"></div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="card-dark p-3 position-relative overflow-hidden">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="form-label-dark mb-0">COSTOS OPERATIVOS</span>
              <span className="material-symbols-outlined text-primary fs-5">local_gas_station</span>
            </div>
            <div className="d-flex align-items-baseline gap-1">
              <span className="fs-4 text-white fw-bold">$39.750.000</span>
              <span className="fs-8 text-light-muted">COP</span>
            </div>
            <div className="d-flex align-items-center gap-2 fs-8 text-light-muted mt-1">
              <span className="badge bg-primary text-white fs-8 p-1">ACPM 62%</span>
              <span>Peajes 18%</span>
              <span>Taller 20%</span>
            </div>
            <div className="kpi-bottom-line bg-primary"></div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="card-dark p-3 position-relative overflow-hidden">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="form-label-dark mb-0">MARGEN OPERATIVO NETO</span>
              <span className="material-symbols-outlined text-orange fs-5">pie_chart</span>
            </div>
            <div className="d-flex align-items-baseline gap-1">
              <span className="fs-4 text-white fw-bold">$18.450.000</span>
              <span className="fs-8 text-light-muted">COP</span>
            </div>
            <div className="d-flex align-items-center gap-1 fs-8 link-orange mt-1">
              <span className="material-symbols-outlined fs-6">analytics</span>
              <span className="fw-bold">31.7% Rentabilidad</span>
              <span className="text-light-muted">• Superávit activo</span>
            </div>
            <div className="kpi-bottom-line bg-orange"></div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="card-dark p-3 position-relative overflow-hidden">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="form-label-dark mb-0">COSTO PROMEDIO / KM</span>
              <span className="material-symbols-outlined text-success fs-5">speed</span>
            </div>
            <div className="d-flex align-items-baseline gap-1">
              <span className="fs-4 text-white fw-bold">$4.250</span>
              <span className="fs-8 text-light-muted">COP / KM</span>
            </div>
            <div className="d-flex align-items-center gap-1 fs-8 text-success mt-1">
              <span className="material-symbols-outlined fs-6">check_circle</span>
              <span>Objetivo &lt; $4.500 Rango óptimo</span>
            </div>
            <div className="kpi-bottom-line bg-success"></div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-5">
          <div className="card-dark p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <span className="material-symbols-outlined text-orange fs-5">receipt_long</span>
                <div>
                  <h2 className="fs-6 text-white fw-bold mb-0">Registro de Movimiento</h2>
                  <span className="text-light-muted fs-8">Contabilización directa en tesorería</span>
                </div>
              </div>
              <span className="badge badge-dark-subtle fs-8">RÁPIDO</span>
            </div>

            <div className="d-flex bg-input p-1 rounded border-dark-custom mb-3" style={{ backgroundColor: 'var(--bg-input)' }}>
              <button type="button" className="btn-orange-cta flex-fill py-1 fs-8">
                <span className="material-symbols-outlined fs-6">arrow_downward</span>
                <span>Gasto / Egreso</span>
              </button>
              <button type="button" className="btn btn-link btn-toggle-inactive text-light-muted fs-8 text-decoration-none flex-fill py-1 d-flex align-items-center justify-content-center gap-1">
                <span className="material-symbols-outlined fs-6">arrow_upward</span>
                <span>Ingreso de Flete</span>
              </button>
            </div>

            <form id="formMovimiento" className="d-flex flex-column gap-2" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="form-label-dark mb-1">CONCEPTO ESPECÍFICO</label>
                <select className="select-dark w-100">
                  <option>Combustible ACPM</option>
                  <option>Mantenimiento Correctivo</option>
                </select>
              </div>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label-dark mb-1">VEHÍCULO / PLACA</label>
                  <select className="select-dark w-100">
                    <option>UVP-123</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label-dark mb-1">CONDUCTOR A CARGO</label>
                  <input type="text" className="form-control-dark w-100" style={{ paddingLeft: '12px' }} readOnly value="Juan Pérez" />
                </div>
              </div>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label-dark mb-1">FACTURA / RECIBO DIAN</label>
                  <input type="text" className="form-control-dark w-100" style={{ paddingLeft: '12px' }} placeholder="FE-000000" />
                </div>
                <div className="col-6">
                  <label className="form-label-dark mb-1">MONTO EN $ COP</label>
                  <input type="text" inputMode="numeric" className="form-control-dark w-100 text-end text-orange fw-bold" style={{ paddingLeft: '12px' }} placeholder="0" defaultValue="380.000" />
                  <span className="fs-8 link-orange d-block text-end mt-1">⚡ OCR Automático Activo</span>
                </div>
              </div>
              <div>
                <label className="form-label-dark mb-1">COMPROBANTE DE SOPORTE</label>
                <div className="file-drop-zone p-3 rounded text-center">
                  <span className="material-symbols-outlined text-orange fs-4">cloud_upload</span>
                  <div className="fs-8 text-white fw-bold">Subir foto o PDF del soporte</div>
                  <span className="text-light-muted fs-8">Lectura instantánea de CUFE y total</span>
                  <input type="file" accept="image/png,image/jpeg,application/pdf" className="d-none" />
                </div>
              </div>
              <div className="d-flex align-items-center justify-content-between fs-8 text-light-muted my-1">
                <span className="text-success d-flex align-items-center gap-1">
                  <span className="material-symbols-outlined fs-6">check_circle</span> Validación Flypass correcta
                </span>
                <span>ID: #TX-7718</span>
              </div>
              <button type="submit" className="btn-orange-cta w-100 py-2">
                <span className="material-symbols-outlined fs-6">add</span>
                <span className="btn-submit-text">Guardar y Contabilizar Movimiento</span>
              </button>
            </form>
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="card-dark p-3 h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h2 className="fs-6 text-white fw-bold mb-0">Balance Comparativo por Unidad</h2>
                  <span className="text-light-muted fs-8">Ingresos brutos vs costos totales operados (Cifras en millones COP)</span>
                </div>
                <div className="d-flex align-items-center gap-3 fs-8">
                  <span className="d-flex align-items-center gap-1 text-white">
                    <span className="status-dot bg-orange"></span> Ingreso Generado
                  </span>
                  <span className="d-flex align-items-center gap-1 text-white">
                    <span className="status-dot bg-primary"></span> Costo Operativo
                  </span>
                </div>
              </div>

              <div className="fin-chart-container pt-4 pb-2 px-2">
                <div className="d-flex align-items-end justify-content-around h-100 border-bottom border-dark position-relative pb-2">
                  <div className="chart-y-axis" style={{ bottom: '75%' }}><span className="fs-8 text-light-muted">$15M</span></div>
                  <div className="chart-y-axis" style={{ bottom: '50%' }}><span className="fs-8 text-light-muted">$10M</span></div>
                  <div className="chart-y-axis" style={{ bottom: '25%' }}><span className="fs-8 text-light-muted">$5M</span></div>
                  <div className="chart-y-axis" style={{ bottom: '0%' }}><span className="fs-8 text-light-muted">$0</span></div>

                  <div className="d-flex flex-column align-items-center gap-2">
                    <div className="d-flex align-items-end gap-1 h-100">
                      <div className="fin-bar bg-orange" style={{ height: '70%', width: '20px' }}></div>
                      <div className="fin-bar bg-primary" style={{ height: '45%', width: '20px' }}></div>
                    </div>
                    <span className="badge badge-dark-subtle fs-8">UVP-123</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="user-card p-2 rounded fs-8 text-light-muted d-flex align-items-center justify-content-between mt-3">
              <span>Tarifas actualizadas según Resolución MinTransporte 2024</span>
              <span>Total Ingresos: <strong className="text-white">$58.200.000 COP</strong> | Margen: <strong className="text-orange">31.7%</strong></span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}