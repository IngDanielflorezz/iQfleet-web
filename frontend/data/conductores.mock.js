/**
 * Catálogo mínimo de conductores, compartido por otros módulos
 * (por ejemplo el selector "Responsable asignado" de Vehículos).
 * Los ids coinciden con los usados en modules/conductores/conductores.js.
 */

/**
 * Catálogo de conductores - iQFleet
 * ---------------------------------
 * Semilla usada por localStorage la primera vez ('iqfleet_conductores').
 * También lo reutiliza modules/vehiculos/vehiculos.js para poblar el
 * selector "Responsable asignado" (misma fuente de datos, sin duplicar).
 *
 * Modelo de datos:
 * {
 *   id: number,
 *   nombre: string,
 *   cedula: string,                 // único
 *   categoria: 'C1 Liviano'|'C2 Público'|'C3 Articulado',
 *   fechaVencimientoLicencia: 'YYYY-MM-DD',
 *   movilPlaca: string|null,        // referencia informativa a un vehículo
 *   turno: 'Mañana'|'Tarde'|'Noche'|'Descanso',
 *   puntaje: number,                // 0-100, gestionado por telemetría (no editable en el form)
 *   estado: 'ACTIVO'|'INACTIVO',
 *   fechaRegistro: 'YYYY-MM-DD'
 * }
 */

export const conductoresMock = [
  {
    id: 1,
    nombre: 'Carlos R.',
    cedula: '79.402.119',
    categoria: 'C2 Público',
    fechaVencimientoLicencia: '2026-10-20',
    movilPlaca: 'UVP-123',
    turno: 'Mañana',
    puntaje: 98,
    estado: 'ACTIVO',
    fechaRegistro: '2023-02-10'
  },
  {
    id: 2,
    nombre: 'David G.',
    cedula: '80.124.990',
    categoria: 'C3 Articulado',
    fechaVencimientoLicencia: '2026-09-20',
    movilPlaca: null,
    turno: 'Tarde',
    puntaje: 91,
    estado: 'ACTIVO',
    fechaRegistro: '2024-05-02'
  },
  {
    id: 3,
    nombre: 'Marcela P.',
    cedula: '52.881.043',
    categoria: 'C2 Público',
    fechaVencimientoLicencia: '2027-11-01',
    movilPlaca: 'WZA-456',
    turno: 'Mañana',
    puntaje: 99,
    estado: 'ACTIVO',
    fechaRegistro: '2022-08-18'
  },
  {
    id: 4,
    nombre: 'Andrés T.',
    cedula: '1.018.423.991',
    categoria: 'C1 Liviano',
    fechaVencimientoLicencia: '2026-10-09',
    movilPlaca: 'SKY-901',
    turno: 'Noche',
    puntaje: 94,
    estado: 'ACTIVO',
    fechaRegistro: '2024-11-30'
  },
  {
    id: 5,
    nombre: 'Camilo G.',
    cedula: '1.065.475.193',
    categoria: 'C2 Público',
    fechaVencimientoLicencia: '2025-12-01',
    movilPlaca: null,
    turno: 'Descanso',
    puntaje: 88,
    estado: 'INACTIVO',
    fechaRegistro: '2021-03-05'
  }
];
