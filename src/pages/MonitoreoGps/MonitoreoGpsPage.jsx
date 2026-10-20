import { useMemo, useState } from 'react';
import useActiveRoutes from '../../hooks/useActiveRoutes';
import { summarizeFleet, STATUS_META, getRouteStatus, formatAgo } from './gpsMetrics';
import { isDemoEnabled, enableDemoRoutes, disableDemoRoutes } from '../../services/gpsService';
import MapCanvas from './components/MapCanvas';
import FleetStatusStrip from './components/FleetStatusStrip';
import UnitsPanel from './components/UnitsPanel';
import TelemetryDock from './components/TelemetryDock';
import '../Conductores/Conductores.css';
import './MonitoreoGps.css';

function EmptyFleetNotice() {
  return (
    <div className="gps-empty">
      <span className="material-symbols-outlined gps-empty-icon">radar</span>
      <h2 className="gps-empty-title">Sin unidades activas</h2>
      <p className="gps-empty-text">
        Cuando un conductor active su ruta desde el panel del conductor, su posición aparecerá aquí en
        tiempo real.
      </p>
    </div>
  );
}

export default function MonitoreoGpsPage() {
  const routes = useActiveRoutes();
  const [selectedId, setSelectedId] = useState(null);
  const [focusTarget, setFocusTarget] = useState(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [demoActivo, setDemoActivo] = useState(() => isDemoEnabled());
  const [historialAbierto, setHistorialAbierto] = useState(false);

  const summary = useMemo(() => summarizeFleet(routes), [routes]);

  const toggleHistorial = () => setHistorialAbierto((previo) => !previo);

  const handleSelect = (route) => {
    setSelectedId(route.userId);
    setFocusTarget({ userId: route.userId, lat: route.lat, lng: route.lng });
    setPanelCollapsed(true);
  };

  const toggleDemo = () => {
    if (demoActivo) {
      disableDemoRoutes();
      setDemoActivo(false);
    } else {
      enableDemoRoutes();
      setDemoActivo(true);
    }
    setSelectedId(null);
    setFocusTarget(null);
  };

  return (
    <div className="max-w-container mx-auto">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge badge-orange-subtle text-uppercase fw-bold">MONITOREO GPS</span>
            <span className="text-light-muted fs-8">ID Sistema: IQ-GPS-01</span>
          </div>
          <h1 className="page-module-title mb-1">Centro de Control en Ruta</h1>
          <p className="text-light-muted fs-7 mb-0">
            Seguimiento en vivo de la flota operativa sobre el mapa · Base Valledupar, Cesar
          </p>
        </div>

        <button
          type="button"
          className={`btn ${demoActivo ? 'btn-outline-dark-custom' : 'btn-orange-cta'}`}
          onClick={toggleDemo}
          title={demoActivo ? 'Ocultar unidades de demostración' : 'Mostrar unidades de demostración'}
        >
          <span className="material-symbols-outlined fs-6">{demoActivo ? 'visibility_off' : 'visibility'}</span>
          <span>{demoActivo ? 'Ocultar demo' : 'Ver unidades demo'}</span>
        </button>
      </div>

      <FleetStatusStrip summary={summary} />

      <div className="gps-workspace">
        <MapCanvas routes={routes} focusTarget={focusTarget} />

        {routes.length === 0 && <EmptyFleetNotice />}

        <UnitsPanel
          routes={routes}
          selectedId={selectedId}
          onSelect={handleSelect}
          onClose={() => setPanelCollapsed(true)}
          collapsed={panelCollapsed}
        />

        <button
          type="button"
          className={`gps-panel-toggle ${panelCollapsed ? '' : 'is-hidden'}`}
          onClick={() => setPanelCollapsed(false)}
          title="Mostrar unidades"
          aria-label="Mostrar panel de unidades"
        >
          <span className="material-symbols-outlined">chevron_left</span>
          <span>Unidades</span>
        </button>

        <TelemetryDock summary={summary} onHistorial={toggleHistorial} historialActivo={historialAbierto} />
      </div>

      {historialAbierto && (
        <div className="card-dark p-3 mt-3">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center gap-2">
              <span className="material-symbols-outlined text-orange fs-5">history</span>
              <h2 className="fs-6 text-white fw-bold mb-0">Historial de posiciones</h2>
            </div>
            <span className="badge badge-dark-subtle fs-8">{routes.length} registro(s)</span>
          </div>
          <div className="table-responsive">
            <table className="table table-dark-custom align-middle mb-0">
              <thead>
                <tr>
                  <th>Conductor</th>
                  <th>Empresa</th>
                  <th>Placa</th>
                  <th>Coordenadas</th>
                  <th className="text-end">Velocidad</th>
                  <th>Estado</th>
                  <th>Último reporte</th>
                </tr>
              </thead>
              <tbody>
                {routes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-light-muted fs-8 py-4">
                      Sin unidades activas para mostrar.
                    </td>
                  </tr>
                ) : (
                  routes.map((route) => {
                    const meta = STATUS_META[getRouteStatus(route)];
                    return (
                      <tr key={route.userId}>
                        <td className="text-white fw-semibold fs-7">{route.nombres} {route.apellidos}</td>
                        <td className="fs-8 text-light-muted">{route.empresa || '—'}</td>
                        <td>{route.placa ? <span className="badge-plate">{route.placa}</span> : <span className="fs-8 text-light-muted">—</span>}</td>
                        <td className="fs-8 text-light-muted">{route.lat.toFixed(4)}, {route.lng.toFixed(4)}</td>
                        <td className="fs-8 text-white text-end">{Math.round(route.speedKmh ?? 0)} km/h</td>
                        <td><span className={`badge bg-${meta.variant}-subtle text-${meta.variant} fs-8`}>{meta.label}</span></td>
                        <td className="fs-8 text-light-muted">{formatAgo(route.updatedAt)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
