import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useTheme from '../../../theme/useTheme';
import { getRouteStatus, STATUS_META, formatAgo } from '../gpsMetrics';

const VALLEDUPAR = { center: [10.4634, -73.2532], zoom: 13 };
const COLOMBIA = { center: [4.57, -74.29], zoom: 6 };

const TILE_URL = {
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};
const TILE_ATTRIBUTION = '&copy; OpenStreetMap &copy; CARTO';

function buildPinIcon(route) {
  const status = getRouteStatus(route);
  const speed = Math.round(route.speedKmh ?? 0);
  return divIcon({
    className: 'gps-pin-wrapper',
    html: `<div class="gps-pin gps-pin--${status}">
      <span class="gps-pin-speed">${speed}</span>
      <span class="gps-pin-unit">km/h</span>
    </div>`,
    iconSize: [68, 34],
    iconAnchor: [34, 32],
  });
}

/** Efectos imperativos: recalcula el tamaño y centra la unidad seleccionada. */
function MapEffects({ focusTarget }) {
  const map = useMap();

  useEffect(() => {
    const id = window.setTimeout(() => map.invalidateSize(), 250);
    return () => window.clearTimeout(id);
  }, [map]);

  useEffect(() => {
    if (!focusTarget) return;
    map.flyTo([focusTarget.lat, focusTarget.lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [map, focusTarget]);

  return null;
}

function MapControls({ map }) {
  if (!map) return null;
  return (
    <div className="gps-map-controls">
      <div className="gps-zoom">
        <button type="button" onClick={() => map.zoomIn()} title="Acercar" aria-label="Acercar">
          <span className="material-symbols-outlined">add</span>
        </button>
        <button type="button" onClick={() => map.zoomOut()} title="Alejar" aria-label="Alejar">
          <span className="material-symbols-outlined">remove</span>
        </button>
      </div>
      <div className="gps-jumps">
        <button type="button" onClick={() => map.flyTo(VALLEDUPAR.center, VALLEDUPAR.zoom)}>
          Valledupar
        </button>
        <button type="button" onClick={() => map.flyTo(COLOMBIA.center, COLOMBIA.zoom)}>
          Colombia
        </button>
      </div>
    </div>
  );
}

export default function MapCanvas({ routes, focusTarget }) {
  const { isDark } = useTheme();
  const [map, setMap] = useState(null);
  const theme = isDark ? 'dark' : 'light';

  return (
    <div className="gps-map">
      <MapContainer
        center={VALLEDUPAR.center}
        zoom={VALLEDUPAR.zoom}
        zoomControl={false}
        className="gps-map-canvas"
        whenReady={setMap}
      >
        <TileLayer key={theme} url={TILE_URL[theme]} attribution={TILE_ATTRIBUTION} maxZoom={19} />
        <MapEffects focusTarget={focusTarget} />
        {routes.map((route) => {
          const meta = STATUS_META[getRouteStatus(route)];
          return (
            <Marker key={route.userId} position={[route.lat, route.lng]} icon={buildPinIcon(route)}>
              <Popup>
                <div className="gps-popup">
                  <strong className="gps-popup-name">
                    {route.nombres} {route.apellidos}
                  </strong>
                  <span className="gps-popup-empresa">{route.empresa || 'Empresa no registrada'}</span>
                  <div className="gps-popup-row">
                    <span>Velocidad</span>
                    <b>{Math.round(route.speedKmh ?? 0)} km/h</b>
                  </div>
                  <div className="gps-popup-row">
                    <span>Estado</span>
                    <b className={`text-${meta.variant}`}>{meta.label}</b>
                  </div>
                  <div className="gps-popup-row">
                    <span>Último reporte</span>
                    <b>{formatAgo(route.updatedAt)}</b>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <MapControls map={map} />

      <div className="gps-legend">
        <span><i className="gps-legend-dot gps-legend-dot--moving" /> En ruta</span>
        <span><i className="gps-legend-dot gps-legend-dot--stopped" /> Detenida</span>
        <span><i className="gps-legend-dot gps-legend-dot--lost" /> Sin señal</span>
      </div>
    </div>
  );
}
