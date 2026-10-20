import { useEffect, useState } from 'react';
import { getActiveRoutes, subscribeActiveRoutes, refreshDemoRoutes } from '../services/gpsService';

/**
 * Expone la lista viva de rutas GPS activas, sincronizada entre pestañas.
 */
export default function useActiveRoutes() {
  const [routes, setRoutes] = useState(() => {
    refreshDemoRoutes();
    return getActiveRoutes();
  });

  useEffect(() => subscribeActiveRoutes(setRoutes), []);

  return routes;
}
