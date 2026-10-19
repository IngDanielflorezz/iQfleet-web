import { useMemo, useState } from 'react';
import useActiveRoutes from '../../hooks/useActiveRoutes';
import { summarizeFleet } from './gpsMetrics';
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

  const summary = useMemo(() => summarizeFleet(routes), [routes]);

  const handleSelect = (route) => {
    setSelectedId(route.userId);
    setFocusTarget({ userId: route.userId, lat: route.lat, lng: route.lng });
    setPanelCollapsed(true);
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

        <TelemetryDock summary={summary} />
      </div>
    </div>
  );
}
