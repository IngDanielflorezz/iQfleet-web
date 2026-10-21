import { useState } from 'react';
import { CHECKLIST_ITEMS, ITEM_RESULTADO } from '../../../config/checklistConfig';
import { formatHoraCorta } from '../../../utils/dateUtils';
import ChecklistModal from './ChecklistModal';

function ChipEstado({ item, respuesta }) {
  const resultado = respuesta?.resultado;
  const enFalla = resultado === ITEM_RESULTADO.FALLA;
  const enAtencion = enFalla && !item.critical;

  let variante = 'na';
  let etiqueta = 'Sin diligenciar';
  if (resultado === ITEM_RESULTADO.OK) {
    variante = 'ok';
    etiqueta = 'OK';
  } else if (enFalla) {
    variante = enAtencion ? 'warning' : 'danger';
    etiqueta = enAtencion ? 'Atención' : 'Falla crítica';
  } else if (resultado === ITEM_RESULTADO.NA) {
    variante = 'na';
    etiqueta = 'N/A';
  }

  return (
    <span className={`checklist-chip checklist-chip--${variante}`}>
      <span className="material-symbols-outlined">{item.icon}</span>
      {item.label}
      <strong>{etiqueta}</strong>
    </span>
  );
}

export default function ChecklistCard({ checklist, aprobado, diligenciado, onSave }) {
  const [modalAbierto, setModalAbierto] = useState(false);

  const respuestas = checklist?.respuestas ?? {};
  const horaAprobacion = checklist?.aprobadoEn ? formatHoraCorta(checklist.aprobadoEn) : null;

  const handleSave = (nuevasRespuestas) => {
    onSave(nuevasRespuestas);
    setModalAbierto(false);
  };

  return (
    <div className="card-iq p-4 h-100 d-flex flex-column">
      <div className="d-flex align-items-center gap-3 mb-3">
        <span className="material-symbols-outlined text-orange fs-3">fact_check</span>
        <div className="flex-fill">
          <h2 className="h6 fw-bold text-white mb-0">Checklist preoperacional</h2>
          <span className={`checklist-status checklist-status--${aprobado ? 'ok' : diligenciado ? 'warn' : 'idle'}`}>
            {aprobado
              ? `Aprobado ${horaAprobacion ? `a las ${horaAprobacion}` : ''}`
              : diligenciado
                ? 'Con pendientes por resolver'
                : 'Pendiente por diligenciar'}
          </span>
        </div>
      </div>

      {diligenciado ? (
        <div className="checklist-chips flex-fill">
          {CHECKLIST_ITEMS.map((item) => (
            <ChipEstado key={item.id} item={item} respuesta={respuestas[item.id]} />
          ))}
        </div>
      ) : (
        <p className="text-light-muted fs-8 flex-fill mb-3">
          Completa la revisión del vehículo para habilitar la activación de la ruta.
        </p>
      )}

      <button
        type="button"
        className={aprobado ? 'btn btn-outline-dark-custom mt-3' : 'btn btn-orange-cta mt-3'}
        onClick={() => setModalAbierto(true)}
      >
        <span className="material-symbols-outlined fs-5">{diligenciado ? 'edit' : 'playlist_add_check'}</span>
        {diligenciado ? 'Revisar checklist' : 'Diligenciar checklist'}
      </button>

      {modalAbierto && (
        <ChecklistModal
          key={checklist?.updatedAt ?? 'nuevo'}
          open={modalAbierto}
          checklist={checklist}
          onClose={() => setModalAbierto(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
