import { VEHICULO_ESTADOS } from '../../services/vehiculoService';
import { alertaVencimiento, ordenarPorSeveridad } from '../../utils/vencimientos';

export { UMBRAL_CRITICO_DIAS, UMBRAL_PREVENTIVO_DIAS } from '../../utils/vencimientos';

function buildDocAlerta(vehiculo, tipoDocumento, fechaISO, referencia) {
  return alertaVencimiento({
    id: `${tipoDocumento}-${vehiculo.id}`,
    fecha: fechaISO,
    detalle: `Placa ${vehiculo.id} · ${vehiculo.marca} ${vehiculo.modelo}`,
    titulos: { vencido: `${tipoDocumento} vencido`, critico: `${tipoDocumento} crítico`, proximo: `${tipoDocumento} próximo` },
    referencia,
  });
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

  alertas.sort(ordenarPorSeveridad);
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
