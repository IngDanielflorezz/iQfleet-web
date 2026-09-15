/**
 * iQFleet - Control Documental & Auditoría RUNT/CDA
 */

document.addEventListener('DOMContentLoaded', () => {
  initGlobalSearch();
  initDocumentFilters();
  initRuntSync();
  initDocumentActions();
  initUploadButtons();
  initLogout();
  updateSummaryCardsAndPills(); // Recalculo inicial con la tabla existente
});

/* ==========================================================
   1. BÚSQUEDA GLOBAL
   ========================================================== */
function initGlobalSearch() {
  const searchInput = document.getElementById('docGlobalSearch');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    filterTableByQuery(e.target.value.toLowerCase().trim());
  });

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });
}

function filterTableByQuery(query) {
  const rows = document.querySelectorAll('#documentTableBody tr');
  rows.forEach(row => {
    const textContent = row.textContent.toLowerCase();
    row.style.display = textContent.includes(query) ? '' : 'none';
  });
}

/* ==========================================================
   2. FILTROS POR TIPO DE DOCUMENTO
   ========================================================== */
function initDocumentFilters() {
  const filterBtns = document.querySelectorAll('.filter-doc-btn');
  const btnClear = document.getElementById('btnClearFilters');
  const statusText = document.getElementById('filterStatusText');
  const searchInput = document.getElementById('docGlobalSearch');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active', 'btn-orange-cta');
        b.classList.add('btn-outline-dark-custom');
      });

      btn.classList.add('active', 'btn-orange-cta');
      btn.classList.remove('btn-outline-dark-custom');

      const filterType = btn.getAttribute('data-filter');
      const filterLabel = btn.innerText.split('(')[0].trim();
      
      if (statusText) statusText.textContent = filterLabel;

      const rows = document.querySelectorAll('#documentTableBody tr');
      rows.forEach(row => {
        const rowType = row.getAttribute('data-type');
        row.style.display = (filterType === 'all' || rowType === filterType) ? '' : 'none';
      });
    });
  });

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      const allBtn = document.querySelector('.filter-doc-btn[data-filter="all"]');
      if (allBtn) allBtn.click();
    });
  }
}

/* ==========================================================
   3. RECALCULO DE CONTADORES (TARJETAS Y PILLS)
   ========================================================== */
function updateSummaryCardsAndPills() {
  const rows = document.querySelectorAll('#documentTableBody tr');
  let countVencidos = 0;
  let countProximos = 0;
  let countVigentes = 0;

  rows.forEach(row => {
    const text = row.innerText.toLowerCase();
    
    if (text.includes('crítico') || text.includes('vencido')) {
      countVencidos++;
    } else if (text.includes('alerta') || text.includes('alerta preventiva') || text.includes('días')) {
      countProximos++;
    } else {
      countVigentes++;
    }
  });

  const total = rows.length;

  // Actualizar Tarjeta 1 (Críticos)
  const card1Val = document.querySelector('.card-dark:nth-child(1) h3, .card-dark:nth-child(1) .fs-2');
  if (card1Val) card1Val.innerText = countVencidos;

  // Actualizar Tarjeta 2 (Próximos a Vencer)
  const card2Val = document.querySelector('.card-dark:nth-child(2) h3, .card-dark:nth-child(2) .fs-2');
  if (card2Val) card2Val.innerText = countProximos;

  // Actualizar Tarjeta 3 (Vigentes)
  const card3Val = document.querySelector('.card-dark:nth-child(3) h3, .card-dark:nth-child(3) .fs-2');
  if (card3Val) card3Val.innerText = countVigentes;

  // Actualizar Pill principal "Todos los Documentos"
  const mainPill = document.querySelector('.filter-doc-btn[data-filter="all"]');
  if (mainPill) {
    mainPill.innerText = `Todos los Documentos (${total})`;
  }
}

/* ==========================================================
   4. BOTÓN SINCRONIZAR API RUNT
   ========================================================== */
function initRuntSync() {
  const btnSync = document.getElementById('btnSyncRunt');
  if (!btnSync) return;

  btnSync.addEventListener('click', () => {
    btnSync.disabled = true;
    btnSync.innerHTML = `<span class="material-symbols-outlined text-warning spin-icon">sync</span> Sincronizando...`;

    setTimeout(() => {
      btnSync.disabled = false;
      btnSync.innerHTML = `<span class="material-symbols-outlined text-success">check_circle</span> RUNT Sincronizado`;
      showNotification('Auditoría RUNT actualizada con éxito. Documentos validados.', 'success');

      setTimeout(() => {
        btnSync.innerHTML = `<span class="material-symbols-outlined text-warning">sync</span> Sincronizar RUNT`;
      }, 3000);
    }, 1500);
  });
}

/* ==========================================================
   5. ACCIONES DE FILA (VER / DESCARGAR)
   ========================================================== */
function initDocumentActions() {
  document.addEventListener('click', (e) => {
    const row = e.target.closest('#documentTableBody tr');
    if (!row) return;

    const targetEl = e.target.closest('button, span, td');
    if (!targetEl) return;

    const docNameElem = row.querySelector('.fw-bold.text-white');
    const docName = docNameElem ? docNameElem.innerText.trim() : 'Documento';

    const html = targetEl.outerHTML.toLowerCase();
    const text = targetEl.innerText.toLowerCase();

    // Ver Vista Previa
    if (html.includes('visibility') || text.includes('visibility') || targetEl.querySelector('.text-warning')) {
      e.preventDefault();
      e.stopPropagation();
      openPreviewModal(docName);
      return;
    }

    // Descargar
    if (html.includes('download') || text.includes('download')) {
      e.preventDefault();
      e.stopPropagation();
      showNotification(`Iniciando descarga: ${docName}.pdf`, 'info');
      return;
    }
  });
}

/* ==========================================================
   6. BOTONES DE CARGA Y REGISTRO
   ========================================================== */
function initUploadButtons() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button, a');
    if (!btn) return;

    const btnText = btn.innerText.toLowerCase();
    
    // Solo responde al botón "+ Cargar Documento / Póliza"
    if (btnText.includes('cargar documento')) {
      e.preventDefault();
      openUploadModal();
    }
  });
}

function openUploadModal() {
  removeModal('customModalUpload');

  const modalHTML = `
    <div id="customModalUpload" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.75); z-index: 999999; display: flex; align-items: center; justify-content: center; padding: 15px;">
      <div style="background-color: #161b22; border: 1px solid #30363d; border-radius: 8px; width: 100%; max-width: 500px; color: #fff; box-shadow: 0 10px 25px rgba(0,0,0,0.8); overflow: hidden;">
        <div style="padding: 15px 20px; border-bottom: 1px solid #30363d; display: flex; justify-content: space-between; align-items: center;">
          <h5 style="margin: 0; font-size: 1rem; font-weight: bold; display: flex; align-items: center; gap: 8px;">
            <span class="material-symbols-outlined text-orange">upload_file</span> Cargar Nuevo Documento / Póliza
          </h5>
          <button onclick="removeModal('customModalUpload')" style="background: transparent; border: none; color: #fff; font-size: 20px; cursor: pointer;">&times;</button>
        </div>
        <div style="padding: 20px;">
          <form id="formDocUploadNativo">
            <div style="margin-bottom: 15px;">
              <label style="display: block; font-size: 11px; color: #8b949e; margin-bottom: 5px; text-transform: uppercase; font-weight: 600;">Tipo de Documento</label>
              <select id="inputTipoDoc" required style="width: 100%; background: #0d1117; border: 1px solid #30363d; color: #fff; padding: 8px; border-radius: 6px; font-size: 13px;">
                <option value="">Seleccione tipo...</option>
                <option value="soat">SOAT Obligatorio</option>
                <option value="rtm">Revisión Técnico-Mecánica (RTM)</option>
                <option value="to">Tarjeta de Operación</option>
                <option value="licencia">Licencia de Conducción</option>
                <option value="rcc">Póliza RCC / RCE</option>
              </select>
            </div>
            <div style="display: flex; gap: 10px; margin-bottom: 15px;">
              <div style="flex: 1;">
                <label style="display: block; font-size: 11px; color: #8b949e; margin-bottom: 5px; text-transform: uppercase; font-weight: 600;">Placa / Entidad</label>
                <input type="text" id="inputPlaca" placeholder="Ej: UVP-123" required style="width: 100%; background: #0d1117; border: 1px solid #30363d; color: #fff; padding: 8px; border-radius: 6px; font-size: 13px;">
              </div>
              <div style="flex: 1;">
                <label style="display: block; font-size: 11px; color: #8b949e; margin-bottom: 5px; text-transform: uppercase; font-weight: 600;">Vencimiento</label>
                <input type="date" id="inputFechaVenc" required style="width: 100%; background: #0d1117; border: 1px solid #30363d; color: #fff; padding: 8px; border-radius: 6px; font-size: 13px; color-scheme: dark; cursor: pointer;">
              </div>
            </div>
            <div style="margin-bottom: 20px;">
              <label style="display: block; font-size: 11px; color: #8b949e; margin-bottom: 5px; text-transform: uppercase; font-weight: 600;">Adjuntar Archivo (PDF / JPG)</label>
              <input type="file" accept=".pdf,.jpg,.png" required style="width: 100%; background: #0d1117; border: 1px solid #30363d; color: #fff; padding: 8px; border-radius: 6px; font-size: 13px;">
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #30363d; padding-top: 15px;">
              <button type="button" onclick="removeModal('customModalUpload')" class="btn btn-outline-dark-custom btn-sm">Cancelar</button>
              <button type="submit" class="btn btn-orange-cta btn-sm">+ Guardar & Auditar RUNT</button>
            </div>
          </form>
        </div>
      </div>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const dateInput = document.getElementById('inputFechaVenc');
  if (dateInput) {
    dateInput.addEventListener('click', () => {
      if (typeof dateInput.showPicker === 'function') {
        dateInput.showPicker();
      }
    });
  }

  document.getElementById('formDocUploadNativo').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const tipo = document.getElementById('inputTipoDoc').value;
    const tipoText = document.getElementById('inputTipoDoc').options[document.getElementById('inputTipoDoc').selectedIndex].text;
    const placa = document.getElementById('inputPlaca').value.toUpperCase();
    const fecha = document.getElementById('inputFechaVenc').value;

    addDocumentToTable(tipo, tipoText, placa, fecha);

    removeModal('customModalUpload');
    showNotification('Documento agregado a la tabla y registrado en RUNT.', 'success');
  });
}

function addDocumentToTable(tipo, tipoText, placa, fecha) {
  const tableBody = document.getElementById('documentTableBody');
  if (!tableBody) return;

  const today = new Date().toISOString().split('T')[0];

  const newRow = document.createElement('tr');
  newRow.setAttribute('data-type', tipo);
  newRow.innerHTML = `
    <td>
      <div class="d-flex align-items-center gap-2">
        <span class="material-symbols-outlined text-orange">description</span>
        <div>
          <div class="fw-bold text-white">${tipoText}</div>
          <div class="fs-8 text-light-muted">Registro Nuevo / Emisión Reciente</div>
        </div>
      </div>
    </td>
    <td>
      <span class="fs-8 text-white">Entidad Auditada</span>
      <div class="fs-8 text-light-muted">Pol. #NEW-${Math.floor(1000 + Math.random() * 9000)}</div>
    </td>
    <td>
      <div class="d-flex align-items-center gap-2">
        <span class="badge bg-warning text-dark fw-bold">${placa}</span>
        <span class="fs-8 text-light-muted">Vehículo</span>
      </div>
    </td>
    <td class="fs-8 text-light-muted">${today}</td>
    <td class="fs-8 text-white fw-bold">${fecha}</td>
    <td>
      <span class="badge bg-success-subtle text-success border border-success fs-8">Al Día (Nuevo)</span>
    </td>
    <td>
      <span class="badge bg-dark border border-warning text-warning fs-8 d-inline-flex align-items-center gap-1">
        <span class="material-symbols-outlined fs-8">sync</span> Sincronizado API RUNT
      </span>
    </td>
    <td class="text-end">
      <div class="d-flex gap-1 justify-content-end">
        <button class="btn btn-sm btn-outline-dark-custom p-1" title="Ver Documento">
          <span class="material-symbols-outlined text-warning fs-6">visibility</span>
        </button>
        <button class="btn btn-sm btn-outline-dark-custom p-1" title="Descargar PDF">
          <span class="material-symbols-outlined text-light-muted fs-6">download</span>
        </button>
      </div>
    </td>
  `;

  tableBody.insertBefore(newRow, tableBody.firstChild);
  
  // Recalcular los valores dinámicos
  updateSummaryCardsAndPills();
}

/* ==========================================================
   MODAL DE VISTA PREVIA
   ========================================================== */
function openPreviewModal(docName) {
  removeModal('customModalPreview');

  const previewHTML = `
    <div id="customModalPreview" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.8); z-index: 999999; display: flex; align-items: center; justify-content: center; padding: 15px;">
      <div style="background-color: #161b22; border: 1px solid #30363d; border-radius: 8px; width: 100%; max-width: 600px; color: #fff; box-shadow: 0 10px 25px rgba(0,0,0,0.8); overflow: hidden;">
        <div style="padding: 15px 20px; border-bottom: 1px solid #30363d; display: flex; justify-content: space-between; align-items: center;">
          <h5 style="margin: 0; font-size: 1rem; font-weight: bold; display: flex; align-items: center; gap: 8px;">
            <span class="material-symbols-outlined text-warning">visibility</span> Vista Previa de Documento
          </h5>
          <button onclick="removeModal('customModalPreview')" style="background: transparent; border: none; color: #fff; font-size: 20px; cursor: pointer;">&times;</button>
        </div>
        <div style="padding: 30px; text-align: center;">
          <span class="material-symbols-outlined text-warning" style="font-size: 64px; margin-bottom: 15px; display: block;">description</span>
          <h4 style="font-size: 1.25rem; font-weight: bold; margin-bottom: 8px;">${docName}</h4>
          <p style="font-size: 0.85rem; color: #8b949e; margin-bottom: 20px;">Documento verificado en CDN iQFleet y cotejado con API RUNT Central.</p>
          <span style="display: inline-block; background: rgba(46, 160, 67, 0.15); color: #3fb950; border: 1px solid #2ea043; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600;">
            ✓ Estado: Vigente & Auditado RUNT
          </span>
        </div>
        <div style="padding: 12px 20px; border-top: 1px solid #30363d; display: flex; justify-content: space-between; align-items: center; background: #0d1117;">
          <span style="font-size: 11px; color: #8b949e;">ID Auditoría: #RUNT-${Math.floor(100000 + Math.random() * 900000)}</span>
          <button onclick="removeModal('customModalPreview')" class="btn btn-outline-dark-custom btn-sm">Cerrar</button>
        </div>
      </div>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', previewHTML);
}

function removeModal(id) {
  const elem = document.getElementById(id);
  if (elem) elem.remove();
}

/* ==========================================================
   7. LOGOUT
   ========================================================== */
function initLogout() {
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      if (confirm('¿Deseas cerrar sesión en iQFleet?')) {
        window.location.href = '../../auth/login.html';
      }
    });
  }
}

/* ==========================================================
   NOTIFICACIONES TOAST
   ========================================================== */
function showNotification(message, type = 'info') {
  const toastId = 'toast-' + Date.now();
  const isSuccess = type === 'success';
  const toastHTML = `
    <div id="${toastId}" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999999; background: ${isSuccess ? '#198754' : '#161b22'}; color: #fff; border: 1px solid ${isSuccess ? '#198754' : '#30363d'}; border-radius: 8px; padding: 12px 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.5); display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 600;">
      <span class="material-symbols-outlined text-warning" style="font-size: 18px;">${isSuccess ? 'check_circle' : 'download'}</span>
      ${message}
    </div>`;

  document.body.insertAdjacentHTML('beforeend', toastHTML);

  setTimeout(() => {
    removeModal(toastId);
  }, 3500);
}