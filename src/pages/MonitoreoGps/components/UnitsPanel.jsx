import { useMemo, useState } from 'react';
import { getRouteStatus, STATUS_META, ROUTE_STATUS, formatAgo } from '../gpsMetrics';

const FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: ROUTE_STATUS.MOVING, label: 'En ruta' },
  { id: ROUTE_STATUS.STOPPED, label: 'Detenidas' },
  { id: ROUTE_STATUS.LOST, label: 'Sin señal' },
];

function getInitials(route) {
  const initials = `${route.nombres?.[0] ?? ''}${route.apellidos?.[0] ?? ''}`.toUpperCase();
  return initials || 'IQ';
}

export default function UnitsPanel({ routes, selectedId, onSelect, onClose, collapsed }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const visibleRoutes = useMemo(() => {
    const term = query.trim().toLowerCase();
    return routes.filter((route) => {
      if (filter !== 'all' && getRouteStatus(route) !== filter) return false;
      if (!term) return true;
      return `${route.nombres} ${route.apellidos} ${route.empresa ?? ''}`.toLowerCase().includes(term);
    });
  }, [routes, query, filter]);

  return (
    <aside className={`gps-panel card-dark ${collapsed ? 'is-collapsed' : ''}`}>
      <header className="gps-panel-head">
        <div>
          <span className="form-label-dark">UNIDADES EN SEGUIMIENTO</span>
          <span className="gps-panel-count">{routes.length} en línea</span>
        </div>
        <button
          type="button"
          className="gps-panel-close"
          onClick={onClose}
          aria-label="Ocultar panel de unidades"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </header>

      <div className="gps-panel-search input-dark-group">
        <span className="material-symbols-outlined input-dark-icon">search</span>
        <input
          type="text"
          className="form-control form-control-dark"
          placeholder="Buscar conductor o empresa..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="gps-panel-filters">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`gps-chip ${filter === item.id ? 'is-active' : ''}`}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="gps-panel-list">
        {routes.length === 0 && (
          <p className="gps-panel-empty">Sin unidades activas. Aparecerán aquí cuando un conductor active su ruta.</p>
        )}
        {routes.length > 0 && visibleRoutes.length === 0 && (
          <p className="gps-panel-empty">Ninguna unidad coincide con el filtro seleccionado.</p>
        )}

        {visibleRoutes.map((route) => {
          const meta = STATUS_META[getRouteStatus(route)];
          return (
            <button
              key={route.userId}
              type="button"
              className={`gps-unit ${selectedId === route.userId ? 'is-selected' : ''}`}
              onClick={() => onSelect(route)}
            >
              <span className="gps-unit-avatar">{getInitials(route)}</span>
              <span className="gps-unit-body">
                <span className="gps-unit-name">
                  {route.nombres} {route.apellidos}
                </span>
                <span className="gps-unit-empresa">{route.empresa || 'Sin empresa'}</span>
                <span className="gps-unit-meta">
                  {Math.round(route.speedKmh ?? 0)} km/h · {formatAgo(route.updatedAt)}
                </span>
              </span>
              <span className={`gps-badge gps-badge--${meta.variant}`}>
                <span className="material-symbols-outlined">{meta.icon}</span>
                {meta.label}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
