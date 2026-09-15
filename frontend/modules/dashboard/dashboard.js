/* ------------------------------------------------------------
 * iQ Fleet - JavaScript del Módulo Dashboard
 * Archivo: frontend/modules/dashboard/dashboard.js
 *
 * Este archivo NO se autoejecuta al cargarse (por eso no hay ningún
 * document.addEventListener('DOMContentLoaded', ...) a nivel superior).
 * Expone export init(), que es quien realmente arranca la lógica:
 *   - En modo standalone, dashboard.html lo llama desde un pequeño
 *     bootstrap inline (ver el <script type="module"> al final del body).
 *   - En modo SPA, core/router.js lo llama después de inyectar el HTML
 *     del módulo dentro de #app-content.
 * Así garantizamos que boot() corra EXACTAMENTE una vez sin importar el
 * contexto (evita listeners/modales duplicados).
 * ---------------------------------------------------------*/

export function init() {
  initDashboardEvents();
  initModalTriggers();
  initExportPdf();
  initFormSubmission("formDespacho", "Despacho registrado correctamente.");
  initFormSubmission("formNovedad", "Novedad registrada correctamente.");
  initModalBackdropCleanup();
}

/* -----------------------------------------------------------------
 * Inicializa los eventos generales del módulo Dashboard
 * (Búsqueda rápida y cierre de sesión)
 * --------------------------------------------------------------*/
function initDashboardEvents() {
  setupShortcutSearch();
  setupLogout();
}

/* -------------------------------------------------------------------------------
 * Atajo de teclado (Ctrl + K o Cmd + K) para enfocar el buscador del Topbar
 * -----------------------------------------------------------------------------*/
function setupShortcutSearch() {
  const searchInput = document.querySelector(".topbar-iq input");
  if (!searchInput) return;

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      searchInput.focus();
    }
  });
}

/* -----------------------------------------------------------------------------
 * Control del botón de Logout (Icono de salida en tarjeta de usuario)
 * --------------------------------------------------------------------------*/
function setupLogout() {
  const btnLogout = document.getElementById("btnLogout");
  if (!btnLogout) return;

  btnLogout.addEventListener("click", (e) => {
    e.preventDefault();
    if (confirm("¿Desea cerrar la sesión actual?")) {
      window.location.href = "../../auth/login.html";
    }
  });
}

/* --------------------------------------------------------------------
 * 1. Apertura de modales desde los botones de la topbar
 * ------------------------------------------------------------------ */
function initModalTriggers() {
  const btnNovedad = document.getElementById("btnRegistrarNovedad");
  const btnDespacho = document.getElementById("btnRegistrarDespacho");
  const modalNovedadEl = document.getElementById("modalNovedad");
  const modalDespachoEl = document.getElementById("modalDespacho");

  if (btnNovedad && modalNovedadEl) {
    btnNovedad.addEventListener("click", function () {
      const modal = bootstrap.Modal.getOrCreateInstance(modalNovedadEl);
      modal.show();
    });
  }

  if (btnDespacho && modalDespachoEl) {
    btnDespacho.addEventListener("click", function () {
      const modal = bootstrap.Modal.getOrCreateInstance(modalDespachoEl);
      modal.show();
    });
  }
}

/* --------------------------------------------------------------------
 * 2. Exportar a PDF con html2pdf.js
 * ------------------------------------------------------------------ */
function initExportPdf() {
  const btnExport = document.getElementById("btnExportarPdf");
  const reportArea = document.getElementById("pdfReportArea");

  if (!btnExport || !reportArea) {
    return;
  }

  btnExport.addEventListener("click", function () {
    const originalLabel = btnExport.innerHTML;
    btnExport.disabled = true;
    btnExport.innerHTML = "Generando PDF...";

    const options = {
      margin: 10,
      filename:
        "iQFleet_Reporte_" + new Date().toISOString().slice(0, 10) + ".pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0f172a",
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: {
        mode: ["css", "legacy"],
        avoid: [".card-dark-metric", ".card-dark", ".alert-item"],
      },
    };

    html2pdf()
      .set(options)
      .from(reportArea)
      .save()
      .then(function () {
        btnExport.disabled = false;
        btnExport.innerHTML = originalLabel;
        showToast("Reporte PDF descargado correctamente.", "success");
      })
      .catch(function (error) {
        btnExport.disabled = false;
        btnExport.innerHTML = originalLabel;
        showToast("No se pudo generar el PDF. Intenta de nuevo.", "danger");
        console.error("Error al generar PDF:", error);
      });
  });
}

/* --------------------------------------------------------------------
 * 3. Envío de formularios (Despacho / Novedad) + cierre de modal + toast
 * ------------------------------------------------------------------ */
function initFormSubmission(formId, successMessage) {
  const form = document.getElementById(formId);

  if (!form) {
    return;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    console.log(
      'Datos capturados de "' + formId + '":',
      Object.fromEntries(formData),
    );

    const modalElement = form.closest(".modal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) {
      modalInstance.hide();
    }

    form.reset();
    showToast(successMessage, "success");
  });
}

/* --------------------------------------------------------------------
 * 4. Utilidad para mostrar el toast de confirmación
 * ------------------------------------------------------------------ */
function showToast(message, variant) {
  const toastEl = document.getElementById("appToast");
  const toastBody = document.getElementById("appToastBody");

  if (!toastEl || !toastBody) {
    return;
  }

  toastEl.classList.remove("text-bg-success", "text-bg-danger");
  toastEl.classList.add(
    variant === "danger" ? "text-bg-danger" : "text-bg-success",
  );

  toastBody.textContent = message;

  const toast = new bootstrap.Toast(toastEl, { delay: 3500 });
  toast.show();
}

/* --------------------------------------------------------------------
 * 5. Red de seguridad: evita backdrops huérfanos que bloqueen la página
 * ------------------------------------------------------------------ */
function initModalBackdropCleanup() {
  document.addEventListener("hidden.bs.modal", function () {
    if (!document.querySelector(".modal.show")) {
      document
        .querySelectorAll(".modal-backdrop")
        .forEach((backdrop) => backdrop.remove());
      document.body.classList.remove("modal-open");
      document.body.style.removeProperty("overflow");
      document.body.style.removeProperty("padding-right");
    }
  });
}
