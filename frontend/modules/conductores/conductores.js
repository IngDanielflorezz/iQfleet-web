/**
 * Módulo de Conductores - iQFleet
 */

import { getStorageData, saveStorageData } from '../../core/storage.js';

// Datos iniciales si el almacenamiento local está vacío
const initialConductores = [
  {
    id: 1,
    nombre: "Carlos R.",
    experiencia: "8 años de servicio",
    cedula: "79.402.119",
    categoria: "C2 Público",
    vencimiento: "Vence Oct 2026",
    vencEstado: "vigente",
    movil: "UVP-123",
    movilDetalle: "Bus 106 • Scania K310",
    ruta: "Ruta 14: Calle 80 - Suba",
    turno: "Turno Mañana (04:30 - 12:30)",
    puntaje: 98,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
  },
  {
    id: 2,
    nombre: "David G.",
    experiencia: "4 años de servicio",
    cedula: "80.124.990",
    categoria: "C3 Articulado",
    vencimiento: "Vence en 5 días",
    vencEstado: "vencida",
    movil: "WOP-892",
    movilDetalle: "Padrón 208 • Volvo B340M",
    ruta: "Ruta 08: Portal Norte - Salitre",
    turno: "Alerta: Relevo Programado",
    puntaje: 91,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
  },
  {
    id: 3,
    nombre: "Marcela P.",
    experiencia: "6 años de servicio",
    cedula: "52.881.043",
    categoria: "C2 Público",
    vencimiento: "Vence Nov 2027",
    vencEstado: "vigente",
    movil: "TLK-405",
    movilDetalle: "Articulado 510 • BYD Eléctrico",
    ruta: "Ruta Expreso: Portal Américas",
    turno: "Turno Completo (05:00 - 14:00)",
    puntaje: 99,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
  },
  {
    id: 4,
    nombre: "Andrés T.",
    experiencia: "2 años de servicio",
    cedula: "1.018.423.991",
    categoria: "C1 Liviano",
    vencimiento: "Vence en 24 días",
    vencEstado: "alerta",
    movil: "SKY-901",
    movilDetalle: "Alimentador 55 • Mercedes OH1521",
    ruta: "Ruta Circular Usme",
    turno: "En Descanso Obligatorio",
    puntaje: 94,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
  }
];

let conductoresList = [];
let activeCategory = 'Todos';

document.addEventListener('DOMContentLoaded', () => {
  initData();
  setupEventListeners();
  renderTable();
});

function initData() {
  const stored = getStorageData('iqfleet_conductores');
  if (stored && stored.length > 0) {
    conductoresList = stored;
  } else {
    conductoresList = initialConductores;
    saveStorageData('iqfleet_conductores', conductoresList);
  }
}

function renderTable() {
  const tbody = document.getElementById('conductoresTableBody');
  const searchVal = document.getElementById('globalSearch')?.value.toLowerCase() || '';

  if (!tbody) return;
  tbody.innerHTML = '';

  const filtered = conductoresList.filter(item => {
    const matchCat = activeCategory === 'Todos' || item.categoria === activeCategory;
    const matchSearch = item.nombre.toLowerCase().includes(searchVal) ||
                        item.cedula.includes(searchVal) ||
                        item.movil.toLowerCase().includes(searchVal);
    return matchCat && matchSearch;
  });

  filtered.forEach(c => {
    const tr = document.createElement('tr');
    
    // Progress Bar Color
    let progressColor = 'bg-success';
    if (c.puntaje < 92) progressColor = 'bg-warning';
    if (c.puntaje < 85) progressColor = 'bg-danger';

    tr.innerHTML = `
      <td>
        <div class="d-flex align-items-center gap-3">
          <img src="${c.avatar}" class="avatar-img" alt="${c.nombre}">
          <div>
            <h6 class="mb-0 fw-bold fs-6">${c.nombre}</h6>
            <span class="text-muted small">${c.experiencia}</span>
          </div>
        </div>
      </td>
      <td class="fw-semibold text-secondary">CC ${c.cedula}</td>
      <td><span class="badge bg-light text-dark border">${c.categoria}</span></td>
      <td>
        <span class="badge-licencia ${c.vencEstado}">
          ${c.vencimiento}
        </span>
      </td>
      <td>
        <div class="fw-bold text-dark">${c.movil}</div>
        <div class="text-muted small" style="font-size:0.75rem;">${c.movilDetalle}</div>
      </td>
      <td>
        <div class="small fw-semibold text-dark">${c.ruta}</div>
        <div class="text-success small" style="font-size:0.75rem;">${c.turno}</div>
      </td>
      <td style="width: 160px;">
        <div class="d-flex align-items-center gap-2">
          <span class="fw-bold small">${c.puntaje}%</span>
          <div class="progress flex-grow-1 progress-telematics">
            <div class="progress-bar ${progressColor}" role="progressbar" style="width: ${c.puntaje}%"></div>
          </div>
        </div>
      </td>
      <td class="text-end">
        <button class="btn btn-sm btn-light border me-1" onclick="alert('Ver Perfil de ${c.nombre}')">Ver Perfil</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Actualización de KPIs
  document.getElementById('kpiTotal').textContent = conductoresList.length;
  document.getElementById('totalActivosCount').textContent = conductoresList.length;
}

function setupEventListeners() {
  // Buscador en tiempo real
  document.getElementById('globalSearch')?.addEventListener('input', renderTable);

  // Filtros de categoría
  document.querySelectorAll('#filterCategory button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('#filterCategory button').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      activeCategory = e.target.dataset.cat;
      renderTable();
    });
  });

  // Vincular Nuevo Conductor Form
  const formVincular = document.getElementById('formVincular');
  formVincular?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nuevo = {
      id: Date.now(),
      nombre: document.getElementById('inputNombre').value,
      experiencia: "Nuevo Ingreso",
      cedula: document.getElementById('inputCedula').value,
      categoria: document.getElementById('selectCategoria').value,
      vencimiento: "Vence en 1 año",
      vencEstado: "vigente",
      movil: document.getElementById('inputMovil').value || "Sin Asignar",
      movilDetalle: "Vehículo en patio",
      ruta: "Ruta Asignada",
      turno: "Turno Estándar",
      puntaje: 100,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(document.getElementById('inputNombre').value)}&background=ff8c00&color=fff`
    };

    conductoresList.push(nuevo);
    saveStorageData('iqfleet_conductores', conductoresList);
    renderTable();

    // Cerrar Modal
    const modalEl = document.getElementById('modalVincular');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();
    formVincular.reset();
  });
}