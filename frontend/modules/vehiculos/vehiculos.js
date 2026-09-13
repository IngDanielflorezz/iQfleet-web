document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('fleetSearchInput');
  const globalSearchInput = document.getElementById('globalSearchInput');
  const typeFilter = document.getElementById('typeFilter');
  const statusFilter = document.getElementById('statusFilter');
  const tableBody = document.getElementById('fleetTableBody');

  // Filtrado de la tabla en tiempo real
  function filterVehicles() {
    const query = (searchInput?.value || globalSearchInput?.value || '').toLowerCase().trim();
    const type = typeFilter?.value.toLowerCase() || 'all';
    const status = statusFilter?.value.toLowerCase() || 'all';

    const rows = tableBody.querySelectorAll('tr');

    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      const matchQuery = text.includes(query);
      const matchType = type === 'all' || text.includes(type);
      const matchStatus = status === 'all' || text.includes(status);

      if (matchQuery && matchType && matchStatus) {
        row.classList.remove('d-none');
      } else {
        row.classList.add('d-none');
      }
    });
  }

  // Listeners de búsqueda y selectores
  if (searchInput) searchInput.addEventListener('input', filterVehicles);
  if (globalSearchInput) globalSearchInput.addEventListener('input', filterVehicles);
  if (typeFilter) typeFilter.addEventListener('change', filterVehicles);
  if (statusFilter) statusFilter.addEventListener('change', filterVehicles);

  // Eventos preparados para la integración CRUD de tus compañeros
  document.getElementById('btnCreateVehicle')?.addEventListener('click', () => {
    console.log('Evento CRUD: Abrir modal crear vehículo');
  });

  tableBody?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const row = btn.closest('tr');
    const vehicleId = row?.dataset.vehicleId;

    if (btn.classList.contains('btn-edit-vehicle')) {
      console.log(`Evento CRUD: Editar vehículo ID #${vehicleId}`);
    } else if (btn.classList.contains('btn-delete-vehicle')) {
      console.log(`Evento CRUD: Eliminar vehículo ID #${vehicleId}`);
    } else if (btn.classList.contains('btn-view-detail')) {
      console.log(`Evento CRUD: Ver ficha técnica del vehículo ID #${vehicleId}`);
    }
  });
});