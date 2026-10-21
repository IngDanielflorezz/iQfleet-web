import { useState } from 'react';
import { FATIGA_CONFIG, FATIGA_ESTADOS, FATIGA_META } from '../../../config/fatigaConfig';
import { formatDuracion } from '../../../services/fatigaService';
import { formatHoraCorta } from '../../../utils/dateUtils';

function AnilloProgreso({ porcentaje, estado }) {
  const radio = 52;
  const circunferencia = 2 * Math.PI * radio;
  const offset = circunferencia - (Math.min(100, porcentaje) / 100) * circunferencia;

  return (
    <svg className={`fatiga-ring fatiga-ring--${estado}`} viewBox="0 0 120 120" role="img" aria-label={`${porcentaje}% del tiempo continuo`}>
      <circle className="fatiga-ring__track" cx="60" cy="60" r={radio} />
      <circle
        className="fatiga-ring__value"
        cx="60"
        cy="60"
        r={radio}
        strokeDasharray={circunferencia}
        strokeDashoffset={offset}
      />
      <text className="fatiga-ring__pct" x="60" y="66" textAnchor="middle">
        {porcentaje}%
      </text>
    </svg>
  );
}

export default function FatigaCard({ acumuladoMs, estado, porcentaje, restanteMin, onRegistrarPausa }) {
  const meta = FATIGA_META[estado];
  const [pausaConfirmadaEn, setPausaConfirmadaEn] = useState(null);

  const handlePausa = () => {
    onRegistrarPausa();
    setPausaConfirmadaEn(new Date());
  };

  return (
    <div className="card-iq p-4 h-100 d-flex flex-column">
      <div className="d-flex align-items-center gap-3 mb-3">
        <span className="material-symbols-outlined text-orange fs-3">bedtime</span>
        <div>
          <h2 className="h6 fw-bold text-white mb-0">Control de fatiga</h2>
          <span className={`fatiga-badge fatiga-badge--${estado}`}>{meta.label}</span>
        </div>
      </div>

      <div className="fatiga-body">
        <AnilloProgreso porcentaje={porcentaje} estado={estado} />
        <div className="fatiga-info">
          <span className="fatiga-tiempo">{formatDuracion(acumuladoMs)}</span>
          <span className="fatiga-info-label">Conducción continua</span>
          <span className="text-light-muted fs-8">
            Máximo recomendado: {FATIGA_CONFIG.maxContinuoMin / 60} h
          </span>
          {estado !== FATIGA_ESTADOS.NORMAL && (
            <span className={`fs-8 fatiga-restante fatiga-restante--${estado}`}>
              {estado === FATIGA_ESTADOS.REQUERIDO
                ? 'Toma un descanso ahora'
                : `Descansa en ${restanteMin} min`}
            </span>
          )}
          {pausaConfirmadaEn && (
            <span className="fs-8 fatiga-confirmada">
              Pausa registrada a las {formatHoraCorta(pausaConfirmadaEn)}
            </span>
          )}
        </div>
      </div>

      <button type="button" className="btn btn-outline-dark-custom mt-3" onClick={handlePausa}>
        <span className="material-symbols-outlined fs-5">free_breakfast</span>
        Registrar pausa ({FATIGA_CONFIG.pausaMinimaMin} min)
      </button>
    </div>
  );
}
