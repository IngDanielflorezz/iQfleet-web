/**
 * iQ Fleet - JavaScript del Módulo Dashboard
 * Archivo: frontend/modules/dashboard/dashboard.js
 */

document.addEventListener('DOMContentLoaded', () => {
  initDashboardEvents();
});

/**
 * Inicializa todos los eventos del módulo Dashboard
 */
function initDashboardEvents() {
  setupShortcutSearch();
  setupQuickAction();
  setupLogout();
}

/**
 * Atajo de teclado (Ctrl + K o Cmd + K) para enfocar el buscador del Topbar
 */
function setupShortcutSearch() {
  const searchInput = document.querySelector('.topbar-iq input');
  if (!searchInput) return;

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      searchInput.focus();
    }
  });
}

/**
 * Control del botón "+ Registrar Novedad" del Topbar
 */
function setupQuickAction() {
  const btnQuickAction = document.querySelector('.topbar-iq .btn-orange-cta');
  if (!btnQuickAction) return;

  btnQuickAction.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('Acción rápida: Registrar Novedad ejecutada.');
    // Los desarrolladores pueden abrir un modal de Bootstrap aquí:
    // const modal = new bootstrap.Modal(document.getElementById('modalNovedad'));
    // modal.show();
  });
}

/**
 * Control del botón de Logout (Icono de salida en tarjeta de usuario)
 */
function setupLogout() {
  const btnLogout = document.getElementById('btnLogout');
  if (!btnLogout) return;

  btnLogout.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('¿Desea cerrar la sesión actual?')) {
      // Redirección al login subiendo 2 niveles desde /modules/dashboard/
      window.location.href = '../../auth/login.html';
    }
  });
}