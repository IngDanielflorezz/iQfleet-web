import { GPS_CONFIG } from '../../../services/gpsService';

const METRICS = [
  { key: 'total', label: 'Unidades activas', icon: 'directions_bus', tone: 'brand' },
  { key: 'moving', label: 'En ruta', icon: 'navigation', tone: 'success' },
  { key: 'stopped', label: 'Detenidas', icon: 'pause_circle', tone: 'warning' },
  { key: 'lost', label: 'Sin señal', icon: 'signal_wifi_off', tone: 'danger' },
];

export default function FleetStatusStrip({ summary }) {
  return (
    <div className="gps-strip card-dark px-3 py-2 d-flex flex-wrap align-items-center gap-3 mb-3">
      <span className="gps-live">
        <span className="gps-live-dot" aria-hidden="true" /> EN VIVO
        <small className="text-light-muted">Actualiza cada {GPS_CONFIG.refreshMs / 1000} s</small>
      </span>

      <div className="gps-strip-metrics d-flex flex-wrap gap-3 ms-auto">
        {METRICS.map((metric) => (
          <div key={metric.key} className={`gps-strip-item gps-strip-item--${metric.tone}`}>
            <span className="material-symbols-outlined">{metric.icon}</span>
            <span className="gps-strip-value">{summary[metric.key]}</span>
            <span className="gps-strip-label">{metric.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
