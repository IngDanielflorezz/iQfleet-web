/**
 * Módulo de Vehículos (Flota) - iQFleet
 * =====================================
 * RF-002: Administración de vehículos de la flota.
 *
 * Este módulo es cargado dinámicamente por core/router.js dentro de
 * #app-content. Como el HTML se inyecta después de que el documento ya
 * disparó 'DOMContentLoaded', TODO el arranque ocurre a través del export
 * init(), que el router invoca explícitamente tras el import().
 *
 * Fases cubiertas:
 *  1. Preparar SPA      -> export init(), sin sidebar/topbar en el HTML.
 *  2. Datos              -> vehiculos.mock.js + getStorageData/saveStorageData.
 *  3. Consulta            -> render dinámico, búsqueda, filtros, KPIs.
 *  4. CRUD                -> registrar/editar + validaciones + placa única.
 *  5. Estados             -> ACTIVO/EN_MANTENIMIENTO/INACTIVO + reglas de
 *                             asignación de conductor.
 */

import { getStorageData, saveStorageData } from "../../core/storage.js";
import { vehiculosMock } from "../../data/vehiculos.mock.js";
import { conductoresMock } from "../../data/conductores.mock.js";

// =========================================
// CONSTANTES
// =========================================
const STORAGE_KEY = "iqfleet_vehiculos";
const MOVIMIENTOS_KEY = "iqfleet_movimientos";

const TIPOS = ["TAXI", "BUS", "BUSETA", "MICROBUS", "VAN"];
const TIPO_LABELS = {
  TAXI: "Taxi",
  BUS: "Bus",
  BUSETA: "Buseta",
  MICROBUS: "Microbús",
  VAN: "Van",
};

const ESTADOS = ["ACTIVO", "EN_MANTENIMIENTO", "INACTIVO"];
const ESTADO_LABELS = {
  ACTIVO: "Activo",
  EN_MANTENIMIENTO: "En Mantenimiento",
  INACTIVO: "Inactivo",
};
const ESTADO_BADGE_CLASS = {
  ACTIVO: "bg-success-subtle text-success",
  EN_MANTENIMIENTO: "badge-orange-subtle",
  INACTIVO: "bg-danger-subtle text-danger",
};

const PLACA_REGEX = /^[A-Z]{3}-\d{2}[0-9A-Z]$/; // ABC-123 o ABC-12D

// =========================================
// ESTADO EN MEMORIA DEL MÓDULO
// =========================================
let vehiculos = [];
let conductores = [];
let pendingEstadoChange = null; // { vehicleId, newEstado, selectEl, previousEstado }

// Referencias DOM (se resuelven en init, ya que el HTML recién se inyectó)
let els = {};

// =========================================
// ENTRY POINT — invocado por el router tras cargar el fragmento
// =========================================
export function init() {
  els = cacheDom();
  if (!els.tableBody) {
    console.error(
      "[vehiculos] No se encontró el fragmento del módulo en el DOM.",
    );
    return;
  }

  loadConductores();
  loadVehiculos();
  bindEvents();
  initLogout();
  initModalBackdropCleanup();
  render();
}

// Botón de logout de la sidebar (equivalente al de dashboard.js/documentos.js).
// Si el módulo se carga dentro de la SPA, el router quita el sidebar y este
// botón simplemente no existe en el DOM: la función no hace nada (no falla).
function initLogout() {
  const btnLogout = document.getElementById("btnLogout");
  if (!btnLogout) return;

  btnLogout.addEventListener("click", (e) => {
    e.preventDefault();
    if (confirm("¿Desea cerrar la sesión actual?")) {
      window.location.href = "../../auth/login.html";
    }
  });
}

// Red de seguridad: evita backdrops huérfanos de Bootstrap si un modal
// queda en un estado raro (mismo patrón que dashboard.js).
function initModalBackdropCleanup() {
  document.addEventListener("hidden.bs.modal", () => {
    if (!document.querySelector(".modal.show")) {
      document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
      document.body.classList.remove("modal-open");
      document.body.style.removeProperty("overflow");
      document.body.style.removeProperty("padding-right");
    }
  });
}

function cacheDom() {
  return {
    tableBody: document.getElementById("fleetTableBody"),
    emptyState: document.getElementById("fleetEmptyState"),
    summaryText: document.getElementById("fleetSummaryText"),

    kpiTotal: document.getElementById("kpiTotal"),
    kpiActivos: document.getElementById("kpiActivos"),
    kpiMantenimiento: document.getElementById("kpiMantenimiento"),
    kpiInactivos: document.getElementById("kpiInactivos"),
    topbarFleetStatus: document.getElementById("topbarFleetStatus"),

    searchInput: document.getElementById("fleetSearchInput"),
    typeFilter: document.getElementById("typeFilter"),
    statusFilter: document.getElementById("statusFilter"),
    btnClearFilters: document.getElementById("btnClearFilters"),
    btnExport: document.getElementById("btnExport"),
    btnCreateVehicle: document.getElementById("btnCreateVehicle"),

    vehicleModalEl: document.getElementById("vehicleModal"),
    vehicleModalTitle: document.getElementById("vehicleModalTitle"),
    vehicleForm: document.getElementById("vehicleForm"),
    vehicleFormAlert: document.getElementById("vehicleFormAlert"),

    vId: document.getElementById("vId"),
    vPlaca: document.getElementById("vPlaca"),
    vMarca: document.getElementById("vMarca"),
    vModelo: document.getElementById("vModelo"),
    vTipo: document.getElementById("vTipo"),
    vAnio: document.getElementById("vAnio"),
    vFechaRegistro: document.getElementById("vFechaRegistro"),
    vEstado: document.getElementById("vEstado"),
    vEstadoHelp: document.getElementById("vEstadoHelp"),
    vResponsable: document.getElementById("vResponsable"),

    mantCostModalEl: document.getElementById("mantCostModal"),
    mantCostForm: document.getElementById("mantCostForm"),
    mantCostPlaca: document.getElementById("mantCostPlaca"),
    mantCostInput: document.getElementById("mantCostInput"),

    toastEl: document.getElementById("fleetToast"),
    toastBody: document.getElementById("fleetToastBody"),
  };
}

// =========================================
// FASE 2 — DATOS (localStorage + mock)
// =========================================
function loadVehiculos() {
  const stored = getStorageData(STORAGE_KEY);
  if (Array.isArray(stored) && stored.length > 0) {
    vehiculos = stored;
  } else {
    vehiculos = structuredCloneSafe(vehiculosMock);
    persist();
  }
}

function loadConductores() {
  // Reutiliza el catálogo ya sembrado por el módulo Conductores si existe;
  // si no, cae al mock local para no dejar el selector vacío.
  const stored = getStorageData("iqfleet_conductores");
  conductores =
    Array.isArray(stored) && stored.length > 0 ? stored : conductoresMock;
}

function persist() {
  saveStorageData(STORAGE_KEY, vehiculos);
}

function structuredCloneSafe(data) {
  return typeof structuredClone === "function"
    ? structuredClone(data)
    : JSON.parse(JSON.stringify(data));
}

// =========================================
// FASE 3 — CONSULTA (render, búsqueda, filtros, KPIs)
// =========================================
function getFilteredVehiculos() {
  const query = (els.searchInput?.value || "").toLowerCase().trim();
  const tipo = els.typeFilter?.value || "all";
  const estado = els.statusFilter?.value || "all";

  return vehiculos.filter((v) => {
    const responsable = v.responsableNombre || "";
    const haystack =
      `${v.placa} ${v.marca} ${v.modelo} ${responsable}`.toLowerCase();

    const matchQuery = !query || haystack.includes(query);
    const matchTipo = tipo === "all" || v.tipo === tipo;
    const matchEstado = estado === "all" || v.estado === estado;

    return matchQuery && matchTipo && matchEstado;
  });
}

function render() {
  const filtered = getFilteredVehiculos();
  renderTable(filtered);
  renderKpis();
  renderSummary(filtered.length);
}

function renderSummary(visibleCount) {
  if (!els.summaryText) return;
  const total = vehiculos.length;
  els.summaryText.innerHTML = `
    <strong class="text-white">${total} vehículo${total === 1 ? "" : "s"} registrado${total === 1 ? "" : "s"}</strong>
    • Mostrando <strong class="text-white">${visibleCount}</strong> según filtros aplicados
  `;
}

function renderKpis() {
  const total = vehiculos.length;
  const activos = vehiculos.filter((v) => v.estado === "ACTIVO").length;
  const mantenimiento = vehiculos.filter(
    (v) => v.estado === "EN_MANTENIMIENTO",
  ).length;
  const inactivos = vehiculos.filter((v) => v.estado === "INACTIVO").length;

  if (els.kpiTotal) els.kpiTotal.textContent = total;
  if (els.kpiActivos) els.kpiActivos.textContent = activos;
  if (els.kpiMantenimiento) els.kpiMantenimiento.textContent = mantenimiento;
  if (els.kpiInactivos) els.kpiInactivos.textContent = inactivos;

  if (els.topbarFleetStatus) {
    const pct = total > 0 ? Math.round((activos / total) * 100) : 0;
    els.topbarFleetStatus.textContent = `${activos} Activos (${pct}%)`;
  }
}

function renderTable(list) {
  if (!els.tableBody) return;

  if (list.length === 0) {
    els.tableBody.innerHTML = "";
    els.emptyState?.classList.remove("d-none");
    return;
  }
  els.emptyState?.classList.add("d-none");

  els.tableBody.innerHTML = list.map(rowTemplate).join("");
}

function rowTemplate(v) {
  const estadoBadgeClass = ESTADO_BADGE_CLASS[v.estado] || "badge-dark-subtle";
  const responsable = v.responsableNombre
    ? `<div class="fw-semibold text-white">${escapeHtml(v.responsableNombre)}</div>`
    : `<span class="text-light-muted fs-8">Sin asignar</span>`;

  const estadoOptions = ESTADOS.map(
    (e) =>
      `<option value="${e}" ${e === v.estado ? "selected" : ""}>${ESTADO_LABELS[e]}</option>`,
  ).join("");

  return `
    <tr data-vehicle-id="${v.id}">
      <td class="px-3">
        <div class="d-flex align-items-center gap-2">
          <div class="plate-box rounded text-center p-1 shadow-sm">
            <span class="plate-city">${TIPO_LABELS[v.tipo] || v.tipo}</span>
            <div class="plate-code">${escapeHtml(v.placa)}</div>
            <span class="plate-country">COLOMBIA</span>
          </div>
        </div>
      </td>
      <td>
        <div class="fw-bold text-white">${escapeHtml(v.marca)}</div>
        <div class="text-light-muted fs-8">${escapeHtml(v.modelo)}</div>
      </td>
      <td><span class="badge badge-dark-subtle">${TIPO_LABELS[v.tipo] || v.tipo}</span></td>
      <td class="text-center">${v.anio || '<span class="text-light-muted">—</span>'}</td>
      <td>${responsable}</td>
      <td><span class="text-light-muted fs-8">${formatFecha(v.fechaRegistro)}</span></td>
      <td>
        <select class="form-select select-dark fs-8 row-status-select" style="min-width:170px;"
          data-vehicle-id="${v.id}" data-previous="${v.estado}" aria-label="Cambiar estado">
          ${estadoOptions}
        </select>
      </td>
      <td class="text-end px-3">
        <div class="btn-group">
          <button class="btn btn-sm btn-outline-dark-custom btn-edit-vehicle" data-vehicle-id="${v.id}" title="Editar">
            <span class="material-symbols-outlined fs-6 align-middle">edit</span>
          </button>
        </div>
      </td>
    </tr>
  `;
}

// =========================================
// EVENTOS
// =========================================
function bindEvents() {
  els.searchInput?.addEventListener("input", render);
  els.typeFilter?.addEventListener("change", render);
  els.statusFilter?.addEventListener("change", render);

  els.btnClearFilters?.addEventListener("click", () => {
    if (els.searchInput) els.searchInput.value = "";
    if (els.typeFilter) els.typeFilter.value = "all";
    if (els.statusFilter) els.statusFilter.value = "all";
    render();
  });

  els.btnCreateVehicle?.addEventListener("click", openCreateModal);
  els.btnExport?.addEventListener("click", exportToCsv);

  els.vehicleForm?.addEventListener("submit", handleFormSubmit);
  els.vEstado?.addEventListener("change", syncResponsableAvailability);

  // Delegación: editar vehículo y cambio de estado inline
  els.tableBody?.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".btn-edit-vehicle");
    if (editBtn) {
      const vehicle = vehiculos.find(
        (v) => v.id === Number(editBtn.dataset.vehicleId),
      );
      if (vehicle) openEditModal(vehicle);
    }
  });

  els.tableBody?.addEventListener("change", (e) => {
    const select = e.target.closest(".row-status-select");
    if (select) handleEstadoQuickChange(select);
  });

  els.mantCostForm?.addEventListener("submit", handleMantCostConfirm);
  els.mantCostModalEl?.addEventListener(
    "hidden.bs.modal",
    handleMantCostModalDismissed,
  );
}

// =========================================
// FASE 4 — CRUD (registrar / editar) + VALIDACIONES
// =========================================
function openCreateModal() {
  els.vehicleForm.reset();
  els.vId.value = "";
  els.vPlaca.disabled = false;
  els.vFechaRegistro.value = todayStr();
  els.vEstado.value = "ACTIVO";
  els.vehicleModalTitle.textContent = "Registrar Nuevo Vehículo";
  hideFormAlert();
  clearFieldErrors();
  populateResponsableSelect(null);
  syncResponsableAvailability();
  showModal(els.vehicleModalEl);
}

function openEditModal(vehicle) {
  els.vehicleForm.reset();
  els.vId.value = vehicle.id;
  els.vPlaca.value = vehicle.placa;
  els.vPlaca.disabled = true; // RN: la placa es inmutable una vez registrada
  els.vMarca.value = vehicle.marca;
  els.vModelo.value = vehicle.modelo;
  els.vTipo.value = vehicle.tipo;
  els.vAnio.value = vehicle.anio ?? "";
  els.vFechaRegistro.value = vehicle.fechaRegistro || "";
  els.vEstado.value = vehicle.estado;
  els.vehicleModalTitle.textContent = `Editar Vehículo — ${vehicle.placa}`;
  hideFormAlert();
  clearFieldErrors();
  populateResponsableSelect(vehicle.responsableId);
  syncResponsableAvailability();
  showModal(els.vehicleModalEl);
}

function populateResponsableSelect(selectedId) {
  // Solo conductores ACTIVOS son asignables (si el módulo Conductores no
  // define 'estado' en algún registro legado, se trata como asignable por
  // compatibilidad). Si el vehículo ya tenía asignado un conductor que
  // luego pasó a INACTIVO, se conserva visible para no perder el dato.
  const asignables = conductores.filter(
    (c) => c.estado !== 'INACTIVO' || c.id === selectedId,
  );

  const options = ['<option value="">Sin asignar</option>'].concat(
    asignables.map(
      (c) => `<option value="${c.id}">${escapeHtml(c.nombre)}${c.estado === 'INACTIVO' ? ' (inactivo)' : ''}</option>`,
    ),
  );
  els.vResponsable.innerHTML = options.join("");
  els.vResponsable.value = selectedId ? String(selectedId) : "";
}

// RN: un vehículo EN_MANTENIMIENTO o INACTIVO no puede tener conductor activo
function syncResponsableAvailability() {
  const estado = els.vEstado.value;
  const bloqueado = estado === "EN_MANTENIMIENTO" || estado === "INACTIVO";

  els.vResponsable.disabled = bloqueado;
  if (bloqueado) {
    els.vResponsable.value = "";
    els.vEstadoHelp.textContent =
      "Este estado desasigna automáticamente al conductor.";
  } else {
    els.vEstadoHelp.textContent = "";
  }
}

function handleFormSubmit(e) {
  e.preventDefault();

  const editingId = els.vId.value ? Number(els.vId.value) : null;
  const formData = {
    placa: els.vPlaca.value.trim().toUpperCase(),
    marca: els.vMarca.value.trim(),
    modelo: els.vModelo.value.trim(),
    tipo: els.vTipo.value,
    anio: els.vAnio.value ? Number(els.vAnio.value) : null,
    fechaRegistro: els.vFechaRegistro.value || todayStr(),
    estado: els.vEstado.value || "ACTIVO",
    responsableId: els.vResponsable.value
      ? Number(els.vResponsable.value)
      : null,
  };

  const { valid, errors } = validateVehicleForm(formData, editingId);
  clearFieldErrors();

  if (!valid) {
    Object.entries(errors).forEach(([field, message]) =>
      showFieldError(field, message),
    );
    showFormAlert("Revisa los campos marcados antes de continuar.");
    return;
  }

  const responsableConductor = formData.responsableId
    ? conductores.find((c) => c.id === formData.responsableId)
    : null;

  if (editingId) {
    const vehicle = vehiculos.find((v) => v.id === editingId);
    if (!vehicle) return;

    vehicle.marca = formData.marca;
    vehicle.modelo = formData.modelo;
    vehicle.tipo = formData.tipo;
    vehicle.anio = formData.anio;
    vehicle.fechaRegistro = formData.fechaRegistro;
    vehicle.estado = formData.estado;

    if (
      formData.estado === "EN_MANTENIMIENTO" ||
      formData.estado === "INACTIVO"
    ) {
      vehicle.responsableId = null;
      vehicle.responsableNombre = null;
      vehicle.fechaFinAsignacion = todayStr();
    } else {
      vehicle.responsableId = responsableConductor?.id ?? null;
      vehicle.responsableNombre = responsableConductor?.nombre ?? null;
    }

    showToast(`Vehículo ${vehicle.placa} actualizado correctamente.`);
  } else {
    const nuevo = {
      id: generateId(vehiculos),
      placa: formData.placa,
      marca: formData.marca,
      modelo: formData.modelo,
      tipo: formData.tipo,
      anio: formData.anio,
      estado: formData.estado,
      responsableId:
        formData.estado === "ACTIVO"
          ? (responsableConductor?.id ?? null)
          : null,
      responsableNombre:
        formData.estado === "ACTIVO"
          ? (responsableConductor?.nombre ?? null)
          : null,
      fechaRegistro: formData.fechaRegistro,
      fechaFinAsignacion: null,
    };
    vehiculos.push(nuevo);
    showToast(`Vehículo ${nuevo.placa} registrado correctamente.`);
  }

  persist();
  render();
  hideModal(els.vehicleModalEl);
}

/**
 * Validaciones de campos (ver tabla RF-002 §5).
 */
function validateVehicleForm(data, editingId) {
  const errors = {};

  // Placa: obligatoria, formato colombiano, única
  if (!data.placa) {
    errors.vPlaca = "La placa es obligatoria.";
  } else if (!PLACA_REGEX.test(data.placa)) {
    errors.vPlaca = "Formato inválido. Usa ABC-123 o ABC-12D.";
  } else {
    const duplicada = vehiculos.some(
      (v) => v.placa === data.placa && v.id !== editingId,
    );
    if (duplicada)
      errors.vPlaca = "Ya existe un vehículo registrado con esta placa.";
  }

  // Marca: 2-50 caracteres
  if (!data.marca || data.marca.length < 2 || data.marca.length > 50) {
    errors.vMarca = "La marca debe tener entre 2 y 50 caracteres.";
  }

  // Modelo: 2-80 caracteres
  if (!data.modelo || data.modelo.length < 2 || data.modelo.length > 80) {
    errors.vModelo = "El modelo debe tener entre 2 y 80 caracteres.";
  }

  // Tipo: enum obligatorio
  if (!TIPOS.includes(data.tipo)) {
    errors.vTipo = "Selecciona un tipo de vehículo válido.";
  }

  // Año: opcional, entre 1990 y año actual + 1
  if (data.anio !== null) {
    const maxAnio = new Date().getFullYear() + 1;
    if (
      !Number.isInteger(data.anio) ||
      data.anio < 1990 ||
      data.anio > maxAnio
    ) {
      errors.vAnio = `El año debe estar entre 1990 y ${maxAnio}.`;
    }
  }

  // Fecha de registro: opcional, no puede ser futura
  if (data.fechaRegistro && data.fechaRegistro > todayStr()) {
    errors.vFechaRegistro = "La fecha de registro no puede ser futura.";
  }

  // Estado: obligatorio y dentro del enum (el <select> ya lo garantiza,
  // se valida igual por robustez si el HTML fuese manipulado)
  if (!ESTADOS.includes(data.estado)) {
    errors.vEstado = "Estado inválido.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// =========================================
// FASE 5 — ESTADOS Y REGLAS DE ASIGNACIÓN DE CONDUCTOR
// =========================================
function handleEstadoQuickChange(selectEl) {
  const vehicleId = Number(selectEl.dataset.vehicleId);
  const vehicle = vehiculos.find((v) => v.id === vehicleId);
  if (!vehicle) return;

  const previousEstado = vehicle.estado;
  const newEstado = selectEl.value;
  if (newEstado === previousEstado) return;

  // RN: al salir de mantenimiento se debe registrar el costo -> egreso financiero (RF-004)
  if (
    previousEstado === "EN_MANTENIMIENTO" &&
    newEstado !== "EN_MANTENIMIENTO"
  ) {
    pendingEstadoChange = { vehicleId, newEstado, selectEl, previousEstado };
    els.mantCostPlaca.textContent = vehicle.placa;
    els.mantCostInput.value = "";
    showModal(els.mantCostModalEl);
    return;
  }

  applyEstadoChange(vehicle, newEstado);
}

function handleMantCostConfirm(e) {
  e.preventDefault();
  if (!pendingEstadoChange) return;

  const { vehicleId, newEstado } = pendingEstadoChange;
  const vehicle = vehiculos.find((v) => v.id === vehicleId);
  const costo = els.mantCostInput.value ? Number(els.mantCostInput.value) : 0;

  if (vehicle) {
    if (costo > 0) registrarEgresoFinanciero(vehicle, costo);
    applyEstadoChange(vehicle, newEstado);
  }

  pendingEstadoChange = null;
  hideModal(els.mantCostModalEl);
}

// Si el usuario cierra el modal de costo sin confirmar, se revierte el <select> visualmente
function handleMantCostModalDismissed() {
  if (pendingEstadoChange) {
    pendingEstadoChange.selectEl.value = pendingEstadoChange.previousEstado;
    pendingEstadoChange = null;
  }
}

/**
 * Aplica un cambio de estado con las reglas de negocio del RF-002 §4:
 *  - EN_MANTENIMIENTO / INACTIVO desasigna automáticamente al conductor
 *    y registra la fecha de fin de asignación.
 */
function applyEstadoChange(vehicle, newEstado) {
  vehicle.estado = newEstado;

  if (newEstado === "EN_MANTENIMIENTO" || newEstado === "INACTIVO") {
    const teniaConductor = Boolean(
      vehicle.responsableId || vehicle.responsableNombre,
    );
    vehicle.responsableId = null;
    vehicle.responsableNombre = null;
    if (teniaConductor) vehicle.fechaFinAsignacion = todayStr();
  }

  persist();
  render();
  showToast(
    `Estado de ${vehicle.placa} actualizado a "${ESTADO_LABELS[newEstado]}".`,
  );
}

function registrarEgresoFinanciero(vehicle, monto) {
  const movimientos = getStorageData(MOVIMIENTOS_KEY) || [];
  movimientos.push({
    id: generateId(movimientos),
    tipo: "egreso",
    concepto: `Mantenimiento vehículo ${vehicle.placa}`,
    vehiculoId: vehicle.id,
    monto,
    fecha: todayStr(),
  });
  saveStorageData(MOVIMIENTOS_KEY, movimientos);
}

// =========================================
// EXPORTAR (utilitario simple, sin dependencias externas)
// =========================================
function exportToCsv() {
  const rows = getFilteredVehiculos();
  if (rows.length === 0) {
    showToast(
      "No hay vehículos para exportar con los filtros actuales.",
      "warning",
    );
    return;
  }

  const header = [
    "Placa",
    "Marca",
    "Modelo",
    "Tipo",
    "Año",
    "Responsable",
    "Fecha Registro",
    "Estado",
  ];
  const lines = rows.map((v) =>
    [
      v.placa,
      v.marca,
      v.modelo,
      TIPO_LABELS[v.tipo] || v.tipo,
      v.anio ?? "",
      v.responsableNombre || "Sin asignar",
      v.fechaRegistro || "",
      ESTADO_LABELS[v.estado] || v.estado,
    ]
      .map(csvEscape)
      .join(";"),
  );

  const csvContent = [header.join(";"), ...lines].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `vehiculos_${todayStr()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const str = String(value ?? "");
  return /[;"\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

// =========================================
// HELPERS UI
// =========================================
function showFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById(`${fieldId}Error`);
  input?.classList.add("is-invalid");
  if (errorEl) errorEl.textContent = message;
}

function clearFieldErrors() {
  els.vehicleForm
    ?.querySelectorAll(".is-invalid")
    .forEach((el) => el.classList.remove("is-invalid"));
  els.vehicleForm
    ?.querySelectorAll(".invalid-feedback")
    .forEach((el) => (el.textContent = ""));
}

function showFormAlert(message) {
  if (!els.vehicleFormAlert) return;
  els.vehicleFormAlert.textContent = message;
  els.vehicleFormAlert.classList.remove("d-none");
}

function hideFormAlert() {
  els.vehicleFormAlert?.classList.add("d-none");
}

function showToast(message, variant = "success") {
  if (!els.toastEl || !window.bootstrap) {
    console.log(`[vehiculos] ${message}`);
    return;
  }
  els.toastEl.classList.remove(
    "text-bg-success",
    "text-bg-warning",
    "text-bg-danger",
  );
  els.toastEl.classList.add(
    variant === "warning"
      ? "text-bg-warning"
      : variant === "danger"
        ? "text-bg-danger"
        : "text-bg-success",
  );
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
  if (!isoStr) return "—";
  const [y, m, d] = isoStr.split("-");
  return `${d}/${m}/${y}`;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
