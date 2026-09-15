/**
 * Módulo de Conductores - iQFleet
 * ===============================
 * Gestión de conductores y personal operativo.
 *
 * Igual que modules/vehiculos/vehiculos.js: este archivo NO se autoejecuta
 * (no hay ningún document.addEventListener('DOMContentLoaded', ...) a nivel
 * superior). Expone export init(), que arranca la lógica real:
 *   - En modo standalone, conductores.html lo llama desde un bootstrap
 *     inline al final del body.
 *   - En modo SPA, core/router.js lo llama después de inyectar el HTML del
 *     módulo dentro de #app-content.
 * Así se garantiza una sola inicialización sin importar el contexto.
 */

import { getStorageData, saveStorageData } from '../../core/storage.js';
import { conductoresMock } from '../../data/conductores.mock.js';

// =========================================
// CONSTANTES
// =========================================
const STORAGE_KEY = 'iqfleet_conductores';
const VEHICULOS_KEY = 'iqfleet_vehiculos'; // solo lectura, para el select "Móvil asignado"

const CATEGORIAS = ['C1 Liviano', 'C2 Público', 'C3 Articulado'];
const TURNOS = ['Mañana', 'Tarde', 'Noche', 'Descanso'];
const ESTADOS = ['ACTIVO', 'INACTIVO'];

const LICENCIA_DIAS_ALERTA = 30; // "por vencer" si faltan <= 30 días
const CEDULA_REGEX = /^[0-9](?:\.?[0-9]{3}){1,3}$/; // 6-13 dígitos, puntos de miles opcionales

// =========================================
// ESTADO EN MEMORIA DEL MÓDULO
// =========================================
let conductores = [];
let vehiculosDisponibles = []; // catálogo de placas, solo lectura

let els = {};

// =========================================
// ENTRY POINT
// =========================================
export function init() {
  els = cacheDom();
  if (!els.tableBody) {
    console.error('[conductores] No se encontró el fragmento del módulo en el DOM.');
    return;
  }

  loadVehiculosDisponibles();
  loadConductores();
  bindEvents();
  initLogout();
  initModalBackdropCleanup();
  render();
}

function cacheDom() {
  return {
    tableBody: document.getElementById('conductoresTableBody'),
    emptyState: document.getElementById('driverEmptyState'),
    summaryText: document.getElementById('driverSummaryText'),
    topbarStatus: document.getElementById('topbarDriverStatus'),

    kpiTotal: document.getElementById('kpiTotal'),
    kpiActivosDetalle: document.getElementById('kpiActivosDetalle'),
    kpiPuntaje: document.getElementById('kpiPuntaje'),
    kpiAlertaLicencia: document.getElementById('kpiAlertaLicencia'),
    kpiVencidas: document.getElementById('kpiVencidas'),

    searchInput: document.getElementById('driverSearchInput'),
    categoryFilter: document.getElementById('categoryFilter'),
    licenciaFilter: document.getElementById('licenciaFilter'),
    estadoFilter: document.getElementById('estadoFilter'),

    btnCreateDriver: document.getElementById('btnCreateDriver'),
    btnExportDrivers: document.getElementById('btnExportDrivers'),

    driverModalEl: document.getElementById('driverModal'),
    driverModalTitle: document.getElementById('driverModalTitle'),
    driverForm: document.getElementById('driverForm'),
    driverFormAlert: document.getElementById('driverFormAlert'),

    dId: document.getElementById('dId'),
    dNombre: document.getElementById('dNombre'),
    dCedula: document.getElementById('dCedula'),
    dCategoria: document.getElementById('dCategoria'),
    dVencimiento: document.getElementById('dVencimiento'),
    dTurno: document.getElementById('dTurno'),
    dEstado: document.getElementById('dEstado'),
    dEstadoHelp: document.getElementById('dEstadoHelp'),
    dMovil: document.getElementById('dMovil'),

    toastEl: document.getElementById('driverToast'),
    toastBody: document.getElementById('driverToastBody')
  };
}

// =========================================
// DATOS (localStorage + mock)
// =========================================
function loadConductores() {
  const stored = getStorageData(STORAGE_KEY);
  if (Array.isArray(stored) && stored.length > 0) {
    conductores = stored;
  } else {
    conductores = structuredCloneSafe(conductoresMock);
    persist();
  }
}

function loadVehiculosDisponibles() {
  const stored = getStorageData(VEHICULOS_KEY);
  vehiculosDisponibles = Array.isArray(stored) ? stored : [];
}

function persist() {
  saveStorageData(STORAGE_KEY, conductores);
}

function structuredCloneSafe(data) {
  return typeof structuredClone === 'function'
    ? structuredClone(data)
    : JSON.parse(JSON.stringify(data));
}

// =========================================
// CONSULTA (render, búsqueda, filtros, KPIs)
// =========================================
function getFilteredConductores() {
  const query = (els.searchInput?.value || '').toLowerCase().trim();
  const categoria = els.categoryFilter?.value || 'all';
  const licenciaEstado = els.licenciaFilter?.value || 'all';
  const estado = els.estadoFilter?.value || 'all';

  return conductores.filter((c) => {
    const haystack = `${c.nombre} ${c.cedula} ${c.movilPlaca || ''}`.toLowerCase();
    const matchQuery = !query || haystack.includes(query);
    const matchCategoria = categoria === 'all' || c.categoria === categoria;
    const matchLicencia = licenciaEstado === 'all' || getLicenciaEstado(c.fechaVencimientoLicencia) === licenciaEstado;
    const matchEstado = estado === 'all' || c.estado === estado;

    return matchQuery && matchCategoria && matchLicencia && matchEstado;
  });
}

// Semáforo de licencia calculado en tiempo real desde la fecha (no un texto fijo)
function getLicenciaEstado(fechaVencimiento) {
  const dias = diasHasta(fechaVencimiento);
  if (dias === null) return 'vigente';
  if (dias < 0) return 'vencida';
  if (dias <= LICENCIA_DIAS_ALERTA) return 'alerta';
  return 'vigente';
}

function diasHasta(fechaISO) {
  if (!fechaISO) return null;
  const hoy = new Date(todayStr());
  const objetivo = new Date(fechaISO);
  return Math.round((objetivo - hoy) / (1000 * 60 * 60 * 24));
}

function render() {
  const filtered = getFilteredConductores();
  renderTable(filtered);
  renderKpis();
  renderSummary(filtered.length);
}

function renderSummary(visibleCount) {
  if (!els.summaryText) return;
  const total = conductores.length;
  els.summaryText.innerHTML = `
    <strong class="text-white">${total} conductor${total === 1 ? '' : 'es'} registrado${total === 1 ? '' : 's'}</strong>
    • Mostrando <strong class="text-white">${visibleCount}</strong> según filtros aplicados
  `;
}

function renderKpis() {
  const total = conductores.length;
  const activos = conductores.filter((c) => c.estado === 'ACTIVO').length;
  const puntajeProm = total > 0
    ? Math.round(conductores.reduce((sum, c) => sum + (c.puntaje || 0), 0) / total)
    : 0;
  const alerta = conductores.filter((c) => getLicenciaEstado(c.fechaVencimientoLicencia) === 'alerta').length;
  const vencidas = conductores.filter((c) => getLicenciaEstado(c.fechaVencimientoLicencia) === 'vencida').length;

  if (els.kpiTotal) els.kpiTotal.textContent = total;
  if (els.kpiActivosDetalle) els.kpiActivosDetalle.textContent = `${activos} activos`;
  if (els.kpiPuntaje) els.kpiPuntaje.textContent = puntajeProm;
  if (els.kpiAlertaLicencia) els.kpiAlertaLicencia.textContent = alerta;
  if (els.kpiVencidas) els.kpiVencidas.textContent = vencidas;

  if (els.topbarStatus) {
    els.topbarStatus.textContent = `${activos} Activos / ${total} Total`;
  }
}

function renderTable(list) {
  if (!els.tableBody) return;

  if (list.length === 0) {
    els.tableBody.innerHTML = '';
    els.emptyState?.classList.remove('d-none');
    return;
  }
  els.emptyState?.classList.add('d-none');

  els.tableBody.innerHTML = list.map(rowTemplate).join('');
}

function rowTemplate(c) {
  const licenciaEstado = getLicenciaEstado(c.fechaVencimientoLicencia);
  const licenciaBadgeClass = {
    vigente: 'bg-success-subtle text-success',
    alerta: 'bg-warning-subtle text-warning',
    vencida: 'bg-danger-subtle text-danger'
  }[licenciaEstado];
  const dias = diasHasta(c.fechaVencimientoLicencia);
  const licenciaLabel = dias === null
    ? 'Sin fecha'
    : dias < 0
      ? `Vencida hace ${Math.abs(dias)} día${Math.abs(dias) === 1 ? '' : 's'}`
      : `Vence en ${dias} día${dias === 1 ? '' : 's'}`;

  const estadoBadgeClass = c.estado === 'ACTIVO' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger';

  let progressColor = 'bg-success';
  if (c.puntaje < 92) progressColor = 'bg-warning';
  if (c.puntaje < 85) progressColor = 'bg-danger';

  return `
    <tr data-driver-id="${c.id}">
      <td>
        <div class="d-flex align-items-center gap-3">
          <div class="rounded-circle avatar-sm bg-warning d-flex align-items-center justify-content-center text-white fw-bold">
            ${escapeHtml((c.nombre || '?').charAt(0).toUpperCase())}
          </div>
          <div>
            <h6 class="mb-0 fw-bold fs-7 text-white">${escapeHtml(c.nombre)}</h6>
            <span class="text-light-muted fs-8">Desde ${formatFecha(c.fechaRegistro)}</span>
          </div>
        </div>
      </td>
      <td class="fw-semibold text-light-muted fs-7">CC ${escapeHtml(c.cedula)}</td>
      <td><span class="badge badge-dark-subtle">${escapeHtml(c.categoria)}</span></td>
      <td><span class="badge ${licenciaBadgeClass} fs-8">${licenciaLabel}</span></td>
      <td class="fs-7 text-white">${c.movilPlaca ? escapeHtml(c.movilPlaca) : '<span class="text-light-muted">Sin asignar</span>'}</td>
      <td class="fs-7 text-light-muted">${escapeHtml(c.turno)}</td>
      <td style="width: 150px;">
        <div class="d-flex align-items-center gap-2">
          <span class="fw-bold small text-white">${c.puntaje}%</span>
          <div class="progress flex-grow-1" style="height:6px;">
            <div class="progress-bar ${progressColor}" role="progressbar" style="width:${c.puntaje}%"></div>
          </div>
        </div>
      </td>
      <td>
        <select class="form-select select-dark fs-8 row-estado-select" style="min-width:110px;" data-driver-id="${c.id}" aria-label="Cambiar estado">
          ${ESTADOS.map((e) => `<option value="${e}" ${e === c.estado ? 'selected' : ''}>${e === 'ACTIVO' ? 'Activo' : 'Inactivo'}</option>`).join('')}
        </select>
      </td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-dark-custom btn-edit-driver" data-driver-id="${c.id}" title="Editar">
          <span class="material-symbols-outlined fs-6 align-middle">edit</span>
        </button>
      </td>
    </tr>
  `;
}

// =========================================
// EVENTOS
// =========================================
function bindEvents() {
  els.searchInput?.addEventListener('input', render);
  els.categoryFilter?.addEventListener('change', render);
  els.licenciaFilter?.addEventListener('change', render);
  els.estadoFilter?.addEventListener('change', render);

  els.btnCreateDriver?.addEventListener('click', openCreateModal);
  els.btnExportDrivers?.addEventListener('click', exportToCsv);

  els.driverForm?.addEventListener('submit', handleFormSubmit);

  els.tableBody?.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.btn-edit-driver');
    if (editBtn) {
      const driver = conductores.find((c) => c.id === Number(editBtn.dataset.driverId));
      if (driver) openEditModal(driver);
    }
  });

  els.tableBody?.addEventListener('change', (e) => {
    const select = e.target.closest('.row-estado-select');
    if (select) handleEstadoQuickChange(select);
  });
}

// =========================================
// CRUD (vincular / editar) + VALIDACIONES
// =========================================
function openCreateModal() {
  els.driverForm.reset();
  els.dId.value = '';
  els.dCedula.disabled = false;
  els.dEstado.value = 'ACTIVO';
  els.driverModalTitle.textContent = 'Vincular Conductor';
  hideFormAlert();
  clearFieldErrors();
  populateMovilSelect(null);
  showModal(els.driverModalEl);
}

function openEditModal(driver) {
  els.driverForm.reset();
  els.dId.value = driver.id;
  els.dNombre.value = driver.nombre;
  els.dCedula.value = driver.cedula;
  els.dCedula.disabled = true; // identificador único, inmutable al editar
  els.dCategoria.value = driver.categoria;
  els.dVencimiento.value = driver.fechaVencimientoLicencia || '';
  els.dTurno.value = driver.turno;
  els.dEstado.value = driver.estado;
  els.driverModalTitle.textContent = `Editar Conductor — ${driver.nombre}`;
  hideFormAlert();
  clearFieldErrors();
  populateMovilSelect(driver.movilPlaca);
  showModal(els.driverModalEl);
}

function populateMovilSelect(selectedPlaca) {
  const placas = vehiculosDisponibles.map((v) => v.placa).filter(Boolean);
  const options = ['<option value="">Sin asignar</option>']
    .concat(placas.map((p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`));
  els.dMovil.innerHTML = options.join('');
  els.dMovil.value = selectedPlaca || '';
}

function handleFormSubmit(e) {
  e.preventDefault();

  const editingId = els.dId.value ? Number(els.dId.value) : null;
  const formData = {
    nombre: els.dNombre.value.trim(),
    cedula: els.dCedula.value.trim(),
    categoria: els.dCategoria.value,
    fechaVencimientoLicencia: els.dVencimiento.value,
    turno: els.dTurno.value,
    estado: els.dEstado.value,
    movilPlaca: els.dMovil.value || null
  };

  const { valid, errors } = validateDriverForm(formData, editingId);
  clearFieldErrors();

  if (!valid) {
    Object.entries(errors).forEach(([field, message]) => showFieldError(field, message));
    showFormAlert('Revisa los campos marcados antes de continuar.');
    return;
  }

  if (editingId) {
    const driver = conductores.find((c) => c.id === editingId);
    if (!driver) return;

    driver.nombre = formData.nombre;
    driver.categoria = formData.categoria;
    driver.fechaVencimientoLicencia = formData.fechaVencimientoLicencia;
    driver.turno = formData.turno;
    driver.estado = formData.estado;
    driver.movilPlaca = formData.movilPlaca;

    showToast(`Conductor ${driver.nombre} actualizado correctamente.`);
  } else {
    const nuevo = {
      id: generateId(conductores),
      nombre: formData.nombre,
      cedula: formData.cedula,
      categoria: formData.categoria,
      fechaVencimientoLicencia: formData.fechaVencimientoLicencia,
      turno: formData.turno,
      estado: formData.estado,
      movilPlaca: formData.movilPlaca,
      puntaje: 100, // puntaje telemático inicial; lo actualiza el sistema, no es editable aquí
      fechaRegistro: todayStr()
    };
    conductores.push(nuevo);
    showToast(`Conductor ${nuevo.nombre} vinculado correctamente.`);
  }

  persist();
  render();
  hideModal(els.driverModalEl);
}

function validateDriverForm(data, editingId) {
  const errors = {};

  if (!data.nombre || data.nombre.length < 3 || data.nombre.length > 80) {
    errors.dNombre = 'El nombre debe tener entre 3 y 80 caracteres.';
  }

  if (!data.cedula) {
    errors.dCedula = 'La cédula es obligatoria.';
  } else if (!CEDULA_REGEX.test(data.cedula)) {
    errors.dCedula = 'Formato inválido. Usa solo números (puntos de miles opcionales).';
  } else {
    const duplicada = conductores.some((c) => c.cedula === data.cedula && c.id !== editingId);
    if (duplicada) errors.dCedula = 'Ya existe un conductor registrado con esta cédula.';
  }

  if (!CATEGORIAS.includes(data.categoria)) {
    errors.dCategoria = 'Selecciona una categoría de licencia válida.';
  }

  if (!data.fechaVencimientoLicencia) {
    errors.dVencimiento = 'La fecha de vencimiento de la licencia es obligatoria.';
  }

  if (!TURNOS.includes(data.turno)) {
    errors.dTurno = 'Selecciona un turno válido.';
  }

  if (!ESTADOS.includes(data.estado)) {
    errors.dEstado = 'Estado inválido.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// =========================================
// ESTADO ACTIVO / INACTIVO (cambio rápido desde la tabla)
// =========================================
function handleEstadoQuickChange(selectEl) {
  const driverId = Number(selectEl.dataset.driverId);
  const driver = conductores.find((c) => c.id === driverId);
  if (!driver) return;

  const newEstado = selectEl.value;
  if (newEstado === driver.estado) return;

  driver.estado = newEstado;
  persist();
  render();
  showToast(`Estado de ${driver.nombre} actualizado a "${newEstado === 'ACTIVO' ? 'Activo' : 'Inactivo'}".`);
}

// =========================================
// EXPORTAR CSV
// =========================================
function exportToCsv() {
  const rows = getFilteredConductores();
  if (rows.length === 0) {
    showToast('No hay conductores para exportar con los filtros actuales.', 'warning');
    return;
  }

  const header = ['Nombre', 'Cédula', 'Categoría', 'Vencimiento Licencia', 'Móvil', 'Turno', 'Puntaje', 'Estado'];
  const lines = rows.map((c) => [
    c.nombre,
    c.cedula,
    c.categoria,
    c.fechaVencimientoLicencia || '',
    c.movilPlaca || 'Sin asignar',
    c.turno,
    c.puntaje,
    c.estado
  ].map(csvEscape).join(';'));

  const csvContent = [header.join(';'), ...lines].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `conductores_${todayStr()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const str = String(value ?? '');
  return /[;"\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

// =========================================
// LOGOUT / LIMPIEZA DE MODALES (mismo patrón que dashboard.js/vehiculos.js)
// =========================================
function initLogout() {
  const btnLogout = document.getElementById('btnLogout');
  if (!btnLogout) return;

  btnLogout.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('¿Desea cerrar la sesión actual?')) {
      window.location.href = '../../auth/login.html';
    }
  });
}

function initModalBackdropCleanup() {
  document.addEventListener('hidden.bs.modal', () => {
    if (!document.querySelector('.modal.show')) {
      document.querySelectorAll('.modal-backdrop').forEach((el) => el.remove());
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('padding-right');
    }
  });
}

// =========================================
// HELPERS UI
// =========================================
function showFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById(`${fieldId}Error`);
  input?.classList.add('is-invalid');
  if (errorEl) errorEl.textContent = message;
}

function clearFieldErrors() {
  els.driverForm?.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
  els.driverForm?.querySelectorAll('.invalid-feedback').forEach((el) => (el.textContent = ''));
}

function showFormAlert(message) {
  if (!els.driverFormAlert) return;
  els.driverFormAlert.textContent = message;
  els.driverFormAlert.classList.remove('d-none');
}

function hideFormAlert() {
  els.driverFormAlert?.classList.add('d-none');
}

function showToast(message, variant = 'success') {
  if (!els.toastEl || !window.bootstrap) {
    console.log(`[conductores] ${message}`);
    return;
  }
  els.toastEl.classList.remove('text-bg-success', 'text-bg-warning', 'text-bg-danger');
  els.toastEl.classList.add(variant === 'warning' ? 'text-bg-warning' : variant === 'danger' ? 'text-bg-danger' : 'text-bg-success');
  els.toastBody.textContent = message;
  bootstrap.Toast.getOrCreateInstance(els.toastEl).show();
}

function showModal(modalEl) {
  if (!modalEl || !window.bootstrap) return;
  bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

function hideModal(modalEl) {
  if (!modalEl || !window.bootstrap) return;
  bootstrap.Modal.getOrCreateInstance(modalEl).hide();
}

function generateId(list) {
  return list.reduce((max, item) => Math.max(max, item.id || 0), 0) + 1;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatFecha(isoStr) {
  if (!isoStr) return '—';
  const [y, m, d] = isoStr.split('-');
  return `${d}/${m}/${y}`;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
