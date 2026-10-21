import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import useTheme from '../../../theme/useTheme';

const VALLEDUPAR = { center: [10.4634, -73.2532], zoom: 15 };

const TILE_URL = {
  light: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
};
const TILE_ATTRIBUTION = '&copy; OpenStreetMap &copy; CARTO';

function MapEffects({ focusTarget }) {
  const map = useMap();

  useEffect(() => {
    const id = window.setTimeout(() => map.invalidateSize(), 250);
    const id2 = window.setTimeout(() => map.invalidateSize(), 900);
    return () => {
      window.clearTimeout(id);
      window.clearTimeout(id2);
    };
  }, [map]);

  useEffect(() => {
    if (!focusTarget) return;
    map.panTo([focusTarget.lat, focusTarget.lng], { animate: true, duration: 0.4 });
  }, [map, focusTarget]);

  return null;
}

export default function MiniMapa({ puntos = [], posicion = null }) {
  const { isDark } = useTheme();
  const theme = isDark ? 'dark' : 'light';

  const estela = puntos.map((punto) => [punto.lat, punto.lng]);
  const centro = posicion ? [posicion.lat, posicion.lng] : VALLEDUPAR.center;

  return (
    <div className="mini-map">
      <MapContainer
        center={centro}
        zoom={VALLEDUPAR.zoom}
        zoomControl={false}
        className="mini-map__canvas"
      >
        <TileLayer key={theme} url={TILE_URL[theme]} attribution={TILE_ATTRIBUTION} maxZoom={19} />
        <MapEffects focusTarget={posicion} />
        {estela.length > 1 && <Polyline positions={estela} pathOptions={{ color: '#c8754d', weight: 4, opacity: 0.85 }} />}
        {posicion && (
          <CircleMarker
            center={[posicion.lat, posicion.lng]}
            radius={8}
            pathOptions={{ color: '#ffffff', fillColor: '#c8754d', fillOpacity: 1, weight: 3 }}
          />
        )}
      </MapContainer>
      {!posicion && estela.length === 0 && (
        <div className="mini-map__empty">
          <span className="material-symbols-outlined">location_searching</span>
          <span>Sin recorrido aún</span>
        </div>
      )}
    </div>
  );
}
