/**
 * Lógica básica del Módulo Control Documental (documentos.js)
 */
document.addEventListener('DOMContentLoaded', () => {
  const btnSync = document.getElementById('btnSyncRunt');
  const searchInput = document.getElementById('docGlobalSearch');
  const filterBtns = document.querySelectorAll('.filter-doc-btn');
  const filterStatusText = document.getElementById('filterStatusText');
  const btnClearFilters = document.getElementById('btnClearFilters');
  const tableRows = document.querySelectorAll('#documentTableBody tr');

  // 1. Efecto Sincronizar RUNT
  if (btnSync) {
    btnSync.addEventListener('click', () => {
      btnSync.disabled = true;
      btnSync.innerHTML = `<span class="material-symbols-outlined text-warning spin-icon">sync</span> Sincronizando con RUNT...`;
      
      setTimeout(() => {
        btnSync.disabled = false;
        btnSync.innerHTML = `<span class="material-symbols-outlined text-success">check_circle</span> RUNT Actualizado`;
        setTimeout(() => {
          btnSync.innerHTML = `<span class="material-symbols-outlined text-warning">sync</span> Sincronizar RUNT`;
        }, 2000);
      }, 1500);
    });
  }

  // 2. Filtros por Tipo de Documento
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.classList.add('btn-outline-dark-custom');
        b.classList.remove('btn-orange-cta');
      });

      btn.classList.add('active');
      btn.classList.remove('btn-outline-dark-custom');
      btn.classList.add('btn-orange-cta');

      const filterType = btn.dataset.filter;
      if (filterStatusText) filterStatusText.textContent = btn.textContent;

      tableRows.forEach(row => {
        if (filterType === 'all' || row.dataset.type === filterType) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });
  });

  // 3. Limpiar Filtros
  if (btnClearFilters) {
    btnClearFilters.addEventListener('click', () => {
      if (filterBtns[0]) filterBtns[0].click();
      if (searchInput) searchInput.value = '';
    });
  }

  // 4. Búsqueda en Vivo
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      tableRows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }
});