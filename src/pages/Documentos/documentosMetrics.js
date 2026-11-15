import { daysUntil } from '../../utils/dateUtils';

export const UMBRAL_CRITICO_DIAS = 7;
export const UMBRAL_PREVENTIVO_DIAS = 30;

/**
 * Clasifica un documento según sus días restantes:
 *  - critico: vencido o <= 7 días
 *  - preventivo: <= 30 días
 *  - vigente: > 30 días
 */
export function clasificarVencimiento(documento, referencia = new Date()) {
  const dias = daysUntil(documento.vencimiento, referencia);
  if (dias === null) return { grupo: 'vigente', dias };
  if (dias < 0) return { grupo: 'critico', dias };
  if (dias <= UMBRAL_CRITICO_DIAS) return { grupo: 'critico', dias };
  if (dias <= UMBRAL_PREVENTIVO_DIAS) return { grupo: 'preventivo', dias };
  return { grupo: 'vigente', dias };
}

export function diasRestantesLabel(dias) {
  if (dias === null) return 'Sin fecha';
  if (dias < 0) return `Vencido hace ${Math.abs(dias)} día(s)`;
  if (dias === 0) return 'Vence hoy';
  if (dias === 1) return '1 día (Crítico)';
  if (dias <= UMBRAL_CRITICO_DIAS) return `${dias} días (Crítico)`;
  if (dias <= UMBRAL_PREVENTIVO_DIAS) return `${dias} días`;
  return `${dias} días`;
}

export function computeDocumentosResumen(documentos = [], referencia = new Date()) {
  const grupos = { critico: [], preventivo: [], vigente: [] };

  documentos.forEach((documento) => {
    const { grupo, dias } = clasificarVencimiento(documento, referencia);
    grupos[grupo].push({ documento, dias });
  });

  const total = documentos.length;
  const sincronizados = documentos.filter((documento) => documento.estadoRunt === 'Sincronizado').length;
  const conformidad = total > 0 ? (sincronizados / total) * 100 : 0;

  return {
    total,
    criticos: grupos.critico.length,
    preventivos: grupos.preventivo.length,
    vigentes: grupos.vigente.length,
    sincronizados,
    conformidad,
    porGrupo: grupos,
  };
}

export function filtrarDocumentos(documentos, filtro, busqueda = '', referencia = new Date()) {
  const termino = busqueda.trim().toLowerCase();

  return documentos.filter((documento) => {
    if (filtro === 'critico') {
      if (clasificarVencimiento(documento, referencia).grupo !== 'critico') return false;
    } else if (filtro === 'preventivo') {
      if (clasificarVencimiento(documento, referencia).grupo !== 'preventivo') return false;
    } else if (filtro && filtro !== 'all' && documento.tipo !== filtro) {
      return false;
    }

    if (!termino) return true;
    return `${documento.numero} ${documento.entidad} ${documento.placa} ${documento.conductor} ${documento.tipo}`
      .toLowerCase()
      .includes(termino);
  });
}
