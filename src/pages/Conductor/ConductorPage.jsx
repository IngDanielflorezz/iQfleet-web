import { useMemo } from 'react';
import { getSession } from '../../services/authService';
import useChecklist from '../../hooks/useChecklist';
import { createAlertaIdempotente, resolverAlertasPorClave, ALERTA_SEVERIDAD, ALERTA_TIPOS } from '../../services/alertService';
import RouteActivationCard from './RouteActivationCard';
import ChecklistCard from './components/ChecklistCard';
import './Conductor.css';

export default function ConductorPage() {
  const session = useMemo(() => getSession(), []);
  const userId = session?.id ?? null;
  const nombre = session ? `${session.nombres} ${session.apellidos}` : 'Conductor';
  const empresa = session?.empresa ?? '';

  const { checklist, aprobado, diligenciado, fecha, guardar } = useChecklist(userId, {
    conductor: nombre,
    empresa,
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

      <RouteActivationCard puedeActivar={aprobado} motivoBloqueo={motivoBloqueo} />

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
