import { useEffect, useRef, useState } from 'react';
import { MENSAJES_RAPIDOS, SOS_HOLD_MS } from '../../../config/mensajesConfig';
import { formatHoraCorta } from '../../../utils/dateUtils';

function BotonSos({ activo, onActivar, onRetirar }) {
  const [presionando, setPresionando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const timerRef = useRef(null);
  const inicioRef = useRef(0);

  const limpiar = () => {
    if (timerRef.current) {
      window.cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
    setPresionando(false);
    setProgreso(0);
  };

  useEffect(() => limpiar, []);

  const iniciar = () => {
    if (activo) return;
    setPresionando(true);
    inicioRef.current = performance.now();
    const tick = () => {
      const transcurrido = performance.now() - inicioRef.current;
      const pct = Math.min(100, (transcurrido / SOS_HOLD_MS) * 100);
      setProgreso(pct);
      if (pct >= 100) {
        limpiar();
        onActivar();
        return;
      }
      timerRef.current = window.requestAnimationFrame(tick);
    };
    timerRef.current = window.requestAnimationFrame(tick);
  };

  if (activo) {
    return (
      <button type="button" className="sos-button sos-button--active" onClick={onRetirar}>
        <span className="material-symbols-outlined">emergency</span>
        <span className="sos-button__label">SOS enviado</span>
        <span className="sos-button__hint">Toca para cancelar</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className="sos-button"
      onMouseDown={iniciar}
      onMouseUp={limpiar}
      onMouseLeave={limpiar}
      onTouchStart={iniciar}
      onTouchEnd={limpiar}
    >
      <span className="sos-button__ring" style={{ '--sos-progreso': `${progreso}%` }} />
      <span className="material-symbols-outlined">{presionando ? 'priority_high' : 'sos'}</span>
      <span className="sos-button__label">{presionando ? 'Suelta para cancelar' : 'Mantén pulsado'}</span>
      <span className="sos-button__hint">2 s para enviar SOS</span>
    </button>
  );
}

export default function SosPanel({ sosActivo, ultimoMensaje, onActivarSos, onRetirarSos, onEnviarMensaje }) {
  return (
    <section className="sos-panel card-iq p-4 mb-4">
      <div className="row g-4 align-items-center">
        <div className="col-12 col-md-4 d-flex justify-content-center">
          <BotonSos activo={Boolean(sosActivo)} onActivar={onActivarSos} onRetirar={onRetirarSos} />
        </div>

        <div className="col-12 col-md-8">
          <h2 className="h6 fw-bold text-white mb-1">Mensajes rápidos</h2>
          <p className="text-light-muted fs-8">Avisa al centro de control con un toque.</p>

          <div className="quick-messages">
            {MENSAJES_RAPIDOS.map((mensaje) => (
              <button
                key={mensaje.id}
                type="button"
                className={`quick-message quick-message--${mensaje.severidad}`}
                onClick={() => onEnviarMensaje(mensaje.id)}
              >
                <span className="material-symbols-outlined">{mensaje.icon}</span>
                {mensaje.label}
              </button>
            ))}
          </div>

          {ultimoMensaje && (
            <div className="last-message mt-3">
              <span className="material-symbols-outlined">check_circle</span>
              <div>
                <strong>{ultimoMensaje.titulo}</strong>
                <span className="text-light-muted fs-8">
                  Enviado a las {formatHoraCorta(ultimoMensaje.createdAt)} · Entregado al centro de control
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
