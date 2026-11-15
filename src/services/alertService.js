/**
 * alertService — Repositorio transversal de alertas operativas.
 *
 * Lo consumen el panel del conductor (checklist, SOS, fatiga) y el panel del
 * administrador (Dashboard y Monitoreo GPS). Patrón Repository + Adapter sobre
 * localStorage; al migrar a Supabase solo cambia la implementación interna.
 *
 * Tipos de alerta:
 *  - CHECKLIST: checklist preoperacional no aprobado (bloquea la ruta).
 *  - SOS: el conductor solicitó ayuda; incluye última posición conocida.
 *  - FATIGA: umbral de conducción continua alcanzado.
 *  - MENSAJE: mensaje rápido enviado por el conductor.
 */

export const ALERTA_TIPOS = {
  CHECKLIST: 'checklist',
  SOS: 'sos',
  FATIGA: 'fatiga',
  MENSAJE: 'mensaje',
};

export const ALERTA_SEVERIDAD = {
  DANGER: 'danger',
  WARNING: 'warning',
  INFO: 'info',
};

export const ALERTA_TIPO_LIST = Object.values(ALERTA_TIPOS);

const ALERTAS_KEY = 'iqfleet_alertas';
const CHANGED_EVENT = 'iqfleet:alertas-changed';

const SEVERIDAD_ORDEN = { danger: 0, warning: 1, info: 2 };

function readAlertas() {
  try {
    const raw = JSON.parse(localStorage.getItem(ALERTAS_KEY));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeAlertas(alertas) {
  localStorage.setItem(ALERTAS_KEY, JSON.stringify(alertas));
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
}

function createId() {
  const sufijo = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ALR-${Date.now().toString(36).toUpperCase()}${sufijo}`;
}

function normalize(dto) {
  return {
    id: dto.id ?? createId(),
    tipo: dto.tipo ?? ALERTA_TIPOS.MENSAJE,
    severidad: dto.severidad ?? ALERTA_SEVERIDAD.INFO,
    userId: dto.userId ?? '',
    conductor: String(dto.conductor ?? '').trim(),
    empresa: String(dto.empresa ?? '').trim(),
    titulo: String(dto.titulo ?? '').trim(),
    detalle: String(dto.detalle ?? '').trim(),
    posicion: dto.posicion ?? null,
    clave: dto.clave ?? null,
    resuelta: Boolean(dto.resuelta),
    createdAt: dto.createdAt ?? new Date().toISOString(),
  };
}

// ---------------------------------------------------------------
// API pública
// ---------------------------------------------------------------
export function listAlertas() {
  return readAlertas().sort((a, b) => SEVERIDAD_ORDEN[a.severidad] - SEVERIDAD_ORDEN[b.severidad]);
}

export function listAlertasActivas() {
  return listAlertas().filter((alerta) => !alerta.resuelta);
}

export function createAlerta(dto) {
  const alerta = normalize(dto);
  writeAlertas([alerta, ...readAlertas()]);
  return alerta;
}

/**
 * Crea una alerta solo si no existe otra activa con la misma `clave`
 * (idempotencia: evita duplicar avisos de fatiga/checklist en cada tick).
 */
export function createAlertaIdempotente(dto, clave) {
  const existente = readAlertas().find((alerta) => !alerta.resuelta && alerta.clave === clave);
  if (existente) return existente;
  return createAlerta({ ...dto, clave });
}

export function resolverAlerta(id) {
  const alertas = readAlertas();
  const actual = alertas.find((alerta) => alerta.id === id);
  if (!actual) return false;
  const actualizada = { ...actual, resuelta: true, resueltaEn: new Date().toISOString() };
  writeAlertas(alertas.map((alerta) => (alerta.id === id ? actualizada : alerta)));
  return true;
}

export function resolverAlertasPorClave(clave) {
  const alertas = readAlertas();
  let cambio = false;
  const actualizadas = alertas.map((alerta) => {
    if (!alerta.resuelta && alerta.clave === clave) {
      cambio = true;
      return { ...alerta, resuelta: true, resueltaEn: new Date().toISOString() };
    }
    return alerta;
  });
  if (cambio) writeAlertas(actualizadas);
  return cambio;
}

export function removeAlerta(id) {
  const alertas = readAlertas();
  const restantes = alertas.filter((alerta) => alerta.id !== id);
  if (restantes.length === alertas.length) return false;
  writeAlertas(restantes);
  return true;
}

/** Alertas activas de un conductor (para su propio panel). */
export function listAlertasPorUsuario(userId) {
  return listAlertasActivas().filter((alerta) => alerta.userId === userId);
}

export function subscribeAlertas(callback) {
  const handleChange = () => callback(listAlertas());

  window.addEventListener('storage', handleChange);
  window.addEventListener(CHANGED_EVENT, handleChange);
  handleChange();

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener(CHANGED_EVENT, handleChange);
  };
}
