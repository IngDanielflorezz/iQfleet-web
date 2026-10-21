import { useMemo } from 'react';
import { getSession } from '../../services/authService';
import { getActiveRoutes } from '../../services/gpsService';
import useChecklist from '../../hooks/useChecklist';
import useSosMensajes from '../../hooks/useSosMensajes';
import useRutaEnVivo from '../../hooks/useRutaEnVivo';
import useFatiga from '../../hooks/useFatiga';
import { createAlertaIdempotente, resolverAlertasPorClave, ALERTA_SEVERIDAD, ALERTA_TIPOS } from '../../services/alertService';
import RouteActivationCard from './RouteActivationCard';
import ChecklistCard from './components/ChecklistCard';
import SosPanel from './components/SosPanel';
import FatigaCard from './components/FatigaCard';
import './Conductor.css';

export default function ConductorPage() {
  const session = useMemo(() => getSession(), []);
  const userId = session?.id ?? null;
  const nombre = session ? `${session.nombres} ${session.apellidos}` : 'Conductor';
  const empresa = session?.empresa ?? '';

  const { position, error, isWatching, statusKey, toggle } = useRutaEnVivo();

  const { checklist, aprobado, diligenciado, fecha, guardar } = useChecklist(userId, {
    conductor: nombre,
    empresa,
  });

  const fatiga = useFatiga(userId, {
    activo: isWatching,
    position,
    conductor: nombre,
    empresa,
  });

  const obtenerUltimaPosicion = () => {
    if (position) return { lat: position.lat, lng: position.lng };
    const propia = getActiveRoutes().find((ruta) => ruta.userId === userId);
    return propia ? { lat: propia.lat, lng: propia.lng } : null;
  };

  const { sosActivo, ultimoMensaje, activarSos, retirarSos, enviarMensaje } = useSosMensajes(userId, {
    conductor: nombre,
    empresa,
    getPosicion: obtenerUltimaPosicion,
  });

  const motivoBloqueo = aprobado
    ? ''
    : diligenciado
      ? 'El checklist tiene bloqueos críticos sin resolver. Corrígelos para activar la ruta.'
      : 'Debes diligenciar y aprobar el checklist preoperacional antes de activar la ruta.';

  const handleGuardarChecklist = (respuestas) => {
    if (!userId) return;
    const entrada = guardar(respuestas);
    const clave = `checklist:${userId}:${fecha}`;

    if (entrada?.approved) {
      resolverAlertasPorClave(clave);
      return;
    }

    createAlertaIdempotente(
      {
        tipo: ALERTA_TIPOS.CHECKLIST,
        severidad: ALERTA_SEVERIDAD.DANGER,
        userId,
        conductor: nombre,
        empresa,
        titulo: 'Checklist no aprobado',
        detalle: `${nombre} no puede activar la ruta: ${entrada?.blockers?.[0]?.label ?? 'ítem crítico'} en falla.`,
      },
      clave,
    );
  };

  return (
    <div className="container-fluid max-w-container">
      <div className="mb-4">
        <div className="d-flex align-items-center gap-2 mb-1">
          <span className="badge badge-orange-subtle text-uppercase fw-bold">PANEL DEL CONDUCTOR</span>
        </div>
        <h1 className="h3 fw-bold text-white mb-0">Hola, {nombre}</h1>
        <span className="text-light-muted fs-8">Tu espacio de trabajo para la operación del día.</span>
      </div>

      <RouteActivationCard
        position={position}
        error={error}
        isWatching={isWatching}
        statusKey={statusKey}
        onToggle={toggle}
        puedeActivar={aprobado}
        motivoBloqueo={motivoBloqueo}
      />

      <SosPanel
        sosActivo={sosActivo}
        ultimoMensaje={ultimoMensaje}
        onActivarSos={activarSos}
        onRetirarSos={retirarSos}
        onEnviarMensaje={enviarMensaje}
      />

      <div className="row g-3">
        <div className="col-12 col-md-4">
          <div className="card-iq p-4 h-100">
            <div className="d-flex align-items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-orange fs-3">directions_bus</span>
              <h2 className="h6 fw-bold text-white mb-0">Vehículo asignado</h2>
            </div>
            <p className="text-light-muted fs-8 mb-0">Aún no tienes un vehículo asignado.</p>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card-iq p-4 h-100">
            <div className="d-flex align-items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-orange fs-3">route</span>
              <h2 className="h6 fw-bold text-white mb-0">Ruta del día</h2>
            </div>
            <p className="text-light-muted fs-8 mb-0">Sin despachos programados por ahora.</p>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <FatigaCard
            acumuladoMs={fatiga.acumuladoMs}
            estado={fatiga.estado}
            porcentaje={fatiga.porcentaje}
            restanteMin={fatiga.restanteMin}
            onRegistrarPausa={fatiga.pausar}
          />
        </div>
      </div>

      <div className="row g-3 mt-0">
        <div className="col-12 col-md-4">
          <ChecklistCard
            checklist={checklist}
            aprobado={aprobado}
            diligenciado={diligenciado}
            onSave={handleGuardarChecklist}
          />
        </div>
      </div>
    </div>
  );
}
