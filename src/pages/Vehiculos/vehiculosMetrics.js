import { VEHICULO_ESTADOS } from '../../services/vehiculoService';
import { daysUntil } from '../../utils/dateUtils';

export const UMBRAL_CRITICO_DIAS = 7;
export const UMBRAL_PREVENTIVO_DIAS = 30;

const SEVERIDAD_ORDEN = { danger: 0, warning: 1, info: 2 };

function buildDocAlerta(vehiculo, tipoDocumento, fechaISO, referencia) {
  const dias = daysUntil(fechaISO, referencia);
  if (dias === null) return null;

  const detalle = `Placa ${vehiculo.id} · ${vehiculo.marca} ${vehiculo.modelo}`;

  if (dias < 0) {
    return { id: `${tipoDocumento}-${vehiculo.id}`, severidad: 'danger', tipo: `${tipoDocumento} vencido`, detalle, tiempo: `Hace ${Math.abs(dias)} día(s)` };
  }
  if (dias <= UMBRAL_CRITICO_DIAS) {
    return { id: `${tipoDocumento}-${vehiculo.id}`, severidad: 'danger', tipo: `${tipoDocumento} crítico`, detalle, tiempo: `Vence en ${dias} día(s)` };
  }
  if (dias <= UMBRAL_PREVENTIVO_DIAS) {
    return { id: `${tipoDocumento}-${vehiculo.id}`, severidad: 'warning', tipo: `${tipoDocumento} próximo`, detalle, tiempo: `Vence en ${dias} días` };
  }
  return null;
}

export function buildAlertasLegales(vehiculos = [], referencia = new Date()) {
  const alertas = [];
  let criticos = 0;

  vehiculos.forEach((vehiculo) => {
    [['SOAT', vehiculo.soatVence], ['RTM', vehiculo.rtmVence]].forEach(([tipoDocumento, fechaISO]) => {
      const alerta = buildDocAlerta(vehiculo, tipoDocumento, fechaISO, referencia);
      if (alerta) {
        alertas.push(alerta);
        criticos += 1;
      }
    });
  });

  alertas.sort((a, b) => SEVERIDAD_ORDEN[a.severidad] - SEVERIDAD_ORDEN[b.severidad]);
  return { total: criticos, alertas };
}

export function computeVehiculosResumen(vehiculos = [], referencia = new Date()) {
  const total = vehiculos.length;
  const operativos = vehiculos.filter((vehiculo) => vehiculo.estado === VEHICULO_ESTADOS.OPERATIVO).length;
  const mantenimiento = vehiculos.filter((vehiculo) => vehiculo.estado === VEHICULO_ESTADOS.MANTENIMIENTO).length;
  const fueraServicio = vehiculos.filter((vehiculo) => vehiculo.estado === VEHICULO_ESTADOS.FUERA_DE_SERVICIO).length;

  const { total: alertasLegales, alertas } = buildAlertasLegales(vehiculos, referencia);

  return {
    total,
    operativos,
    mantenimiento,
    fueraServicio,
    disponibilidad: total > 0 ? (operativos / total) * 100 : 0,
    alertasLegales,
    alertas,
  };
}
