import { PUNTAJE_CONFIG } from '../../../config/puntajeConfig';

const ETIQUETAS_DESGLOSE = {
  velocidad: { label: 'Velocidad', icon: 'speed' },
  frenadas: { label: 'Frenadas', icon: 'trending_down' },
  aceleracion: { label: 'Aceleración', icon: 'trending_up' },
};

function BarraDesglose({ clave, valor }) {
  const { label, icon } = ETIQUETAS_DESGLOSE[clave];
  const color = valor >= 85 ? 'success' : valor >= 65 ? 'warning' : 'danger';

  return (
    <div className="puntaje-barra">
      <span className="puntaje-barra__label">
        <span className="material-symbols-outlined">{icon}</span>
        {label}
      </span>
      <span className="puntaje-barra__track">
        <span className={`puntaje-barra__fill puntaje-barra__fill--${color}`} style={{ width: `${valor}%` }} />
      </span>
      <span className="puntaje-barra__valor">{valor}</span>
    </div>
  );
}

export default function PuntajeCard({ puntaje, desglose, excesos, racha, nivel }) {
  return (
    <div className="card-iq p-4 h-100 d-flex flex-column">
      <div className="d-flex align-items-center gap-3 mb-3">
        <span className="material-symbols-outlined text-orange fs-3">workspace_premium</span>
        <div className="flex-fill">
          <h2 className="h6 fw-bold text-white mb-0">Puntaje de conducción</h2>
          <span className={`puntaje-nivel puntaje-nivel--${nivel.variant}`}>
            <span className="material-symbols-outlined">{nivel.icon}</span>
            {nivel.label}
          </span>
        </div>
        <span className={`puntaje-total puntaje-total--${nivel.variant}`}>{puntaje}</span>
      </div>

      <div className="puntaje-barras flex-fill">
        {Object.entries(desglose).map(([clave, valor]) => (
          <BarraDesglose key={clave} clave={clave} valor={valor} />
        ))}
      </div>

      <div className="puntaje-pie mt-3">
        <span className="puntaje-stat">
          <span className="material-symbols-outlined">speed</span>
          {excesos} exceso(s) · límite {PUNTAJE_CONFIG.velocidadLimiteKmh} km/h
        </span>
        <span className="puntaje-stat">
          <span className="material-symbols-outlined">local_fire_department</span>
          {racha} turno(s) sin infracción grave
        </span>
      </div>
    </div>
  );
}
