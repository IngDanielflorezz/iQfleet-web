/**
 * Datos mock (semilla) del módulo Vehículos - iQFleet
 * ---------------------------------------------------
 * Se usan únicamente la primera vez que se carga el módulo, cuando
 * localStorage aún no tiene la key 'iqfleet_vehiculos'. A partir de ahí,
 * toda la información viaja por getStorageData()/saveStorageData().
 *
 * Modelo de datos (ver RF-002):
 * {
 *   id: number,
 *   placa: string,                   // ABC-123 / ABC-12D, único, inmutable
 *   marca: string,
 *   modelo: string,
 *   tipo: 'TAXI' | 'BUS'|'BUSETA'|'MICROBUS'|'VAN',
 *   anio: number|null,
 *   estado: 'ACTIVO'|'EN_MANTENIMIENTO'|'INACTIVO',
 *   responsableId: number|null,      // FK -> conductor.id
 *   responsableNombre: string|null,  // fallback si no es FK a conductor
 *   fechaRegistro: 'YYYY-MM-DD',
 *   fechaFinAsignacion: 'YYYY-MM-DD'|null // se llena al desasignar conductor
 * }
 */

export const vehiculosMock = [
  {
    id: 1,
    placa: 'UVP-123',
    marca: 'Hino',
    modelo: 'FC9J Urbanuss Pluss',
    tipo: 'BUS',
    anio: 2021,
    estado: 'ACTIVO',
    responsableId: 1,
    responsableNombre: 'Carlos R.',
    fechaRegistro: '2024-01-15',
    fechaFinAsignacion: null
  },
  {
    id: 2,
    placa: 'WZA-456',
    marca: 'Mercedes-Benz',
    modelo: 'Atego Torino G7',
    tipo: 'BUS',
    anio: 2019,
    estado: 'ACTIVO',
    responsableId: 3,
    responsableNombre: 'Marcela P.',
    fechaRegistro: '2023-11-02',
    fechaFinAsignacion: null
  },
  {
    id: 3,
    placa: 'TRL-890',
    marca: 'Chevrolet',
    modelo: 'NPR Buseta Escolar',
    tipo: 'BUSETA',
    anio: 2017,
    estado: 'EN_MANTENIMIENTO',
    responsableId: null,
    responsableNombre: null,
    fechaRegistro: '2022-06-20',
    fechaFinAsignacion: '2026-09-10'
  },
  {
    id: 4,
    placa: 'SKY-901',
    marca: 'Mercedes-Benz',
    modelo: 'OH1521 Alimentador',
    tipo: 'MICROBUS',
    anio: 2020,
    estado: 'ACTIVO',
    responsableId: 4,
    responsableNombre: 'Andrés T.',
    fechaRegistro: '2024-03-08',
    fechaFinAsignacion: null
  },
  {
    id: 5,
    placa: 'FTW-119',
    marca: 'Renault',
    modelo: 'Master Van de Ruta',
    tipo: 'VAN',
    anio: 2015,
    estado: 'INACTIVO',
    responsableId: null,
    responsableNombre: null,
    fechaRegistro: '2020-09-01',
    fechaFinAsignacion: '2026-05-14'
  },
  {
    id: 6,
    placa: 'UWS-838',
    marca: 'Chevrolet',
    modelo: 'Spark GT',
    tipo: 'TAXI',
    anio: 2025,
    estado: 'INACTIVO',
    responsableId: null,
    responsableNombre: null,
    fechaRegistro: '2025-12-01',
    fechaFinAsignacion: '2025-12-01'
  }
];
