// ==========================================================
// finanzas.js — Módulo de Finanzas & Rentabilidad · iQFleet
// ==========================================================
// Lógica de:
//   1. Toggle Gasto/Egreso vs Ingreso de Flete
//   2. Selects dinámicos (Concepto, Vehículo -> Conductor)
//   3. Validación de campo monto (formato $ COP)
//   4. Carga de comprobantes (drag&drop + click) con vista previa
//   5. Simulación de OCR
//   6. Validación y envío (submit) del formulario con feedback
//   7. Sistema de notificaciones tipo toast
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================
     1. CONFIGURACIÓN Y DATOS DE REFERENCIA
     ========================================================== */

  const CONCEPTOS = {
    gasto: [
      'Combustible Diésel (ACPM Estación Primaria)',
      'Mantenimiento Taller / Repuestos',
      'Peajes / Telepeaje Flypass',
      'Viáticos Conductor',
      'Otros Gastos Operativos'
    ],
    ingreso: [
      'Flete de Carga Completa',
      'Flete Compartido / Encomienda',
      'Alquiler de Vehículo (Contrato)',
      'Servicio de Ruta Fija',
      'Otros Ingresos Operativos'
    ]
  };

  // En un caso real esto vendría de una llamada a tu API / backend
  const VEHICULOS = [
    { placa: 'UVP-123', modelo: 'Busscar 2022', conductor: 'Javier Restrepo' },
    { placa: 'WZA-456', modelo: 'Marcopolo 21', conductor: 'Andrea Salazar' },
    { placa: 'TRL-890', modelo: 'Scania K360', conductor: 'Miguel Ángel Ortiz' },
    { placa: 'KLP-771', modelo: 'Mercedes OH', conductor: 'Luis Fernando Gómez' },
    { placa: 'XTY-502', modelo: 'Chevrolet NQR', conductor: 'Diana Marcela Ríos' }
  ];

  const ACCEPTED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
  const MAX_FILE_SIZE_MB = 8;

  /* ==========================================================
     2. REFERENCIAS AL DOM
     ========================================================== */

  const btnGasto = document.getElementById('btnTipoGasto');
  const btnIngreso = document.getElementById('btnTipoIngreso');

  const selectConcepto = document.getElementById('selectConcepto');
  const selectVehiculo = document.getElementById('selectVehiculo');
  const inputConductor = document.getElementById('inputConductor');

  const labelReferencia = document.getElementById('labelReferencia');
  const inputReferencia = document.getElementById('inputReferencia');
  const inputMonto = document.getElementById('inputMonto');

  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const dropZoneTitle = document.getElementById('dropZoneTitle');
  const dropZoneSubtitle = document.getElementById('dropZoneSubtitle');
  const filePreview = document.getElementById('filePreview');

  const btnSubmit = document.getElementById('btnSubmit');
  const txIdBadge = document.getElementById('txIdBadge');

  // Si el script se carga en una página sin este formulario, no hacemos nada.
  if (!btnGasto || !btnIngreso || !selectConcepto) return;

  let currentType = 'gasto'; // 'gasto' | 'ingreso'
  let selectedFile = null;
  let txCounter = 7718;

  /* ==========================================================
     3. TOGGLE GASTO / INGRESO
     ========================================================== */

  function setTipoMovimiento(tipo) {
    currentType = tipo;
    const esGasto = tipo === 'gasto';

    // Estilo visual de los botones (activo vs inactivo)
    btnGasto.classList.toggle('btn-orange-cta', esGasto);
    btnGasto.classList.toggle('btn-toggle-inactive', !esGasto);
    btnIngreso.classList.toggle('btn-orange-cta', !esGasto);
    btnIngreso.classList.toggle('btn-toggle-inactive', esGasto);
    btnGasto.setAttribute('aria-pressed', esGasto);
    btnIngreso.setAttribute('aria-pressed', !esGasto);

    // Color y texto del botón de envío
    btnSubmit.classList.toggle('btn-orange-cta', esGasto);
    btnSubmit.classList.toggle('btn-ingreso-cta', !esGasto);
    btnSubmit.querySelector('.btn-submit-text').textContent = esGasto
      ? 'Guardar y Contabilizar Egreso'
      : 'Guardar y Contabilizar Ingreso';

    // Conceptos según el tipo de movimiento
    poblarConceptos(tipo);

    // Etiqueta / placeholder del campo de referencia (factura vs flete)
    if (esGasto) {
      labelReferencia.textContent = 'FACTURA / RECIBO DIAN';
      inputReferencia.placeholder = 'FE-000000';
    } else {
      labelReferencia.textContent = 'No. DE FLETE / CONTRATO';
      inputReferencia.placeholder = 'FLT-000000';
    }
    inputReferencia.value = '';

    // Textos de la zona de carga de comprobante
    dropZoneTitle.textContent = esGasto
      ? 'Subir foto o PDF del soporte'
      : 'Subir remesa o soporte del flete';
    dropZoneSubtitle.textContent = esGasto
      ? 'Lectura instantánea de CUFE y total'
      : 'Lectura instantánea de datos del contrato';

    limpiarArchivo();
  }

  function poblarConceptos(tipo) {
    selectConcepto.innerHTML = '';
    CONCEPTOS[tipo].forEach((concepto, index) => {
      const opt = document.createElement('option');
      opt.value = concepto;
      opt.textContent = concepto;
      if (index === 0) opt.selected = true;
      selectConcepto.appendChild(opt);
    });
  }

  btnGasto.addEventListener('click', () => setTipoMovimiento('gasto'));
  btnIngreso.addEventListener('click', () => setTipoMovimiento('ingreso'));

  /* ==========================================================
     4. SELECTS: VEHÍCULO -> CONDUCTOR AUTOMÁTICO
     ========================================================== */

  function poblarVehiculos() {
    selectVehiculo.innerHTML = '';
    VEHICULOS.forEach((v, index) => {
      const opt = document.createElement('option');
      opt.value = v.placa;
      opt.textContent = `${v.placa} (${v.modelo})`;
      if (index === 0) opt.selected = true;
      selectVehiculo.appendChild(opt);
    });
    actualizarConductor();
  }

  function actualizarConductor() {
    const vehiculo = VEHICULOS.find(v => v.placa === selectVehiculo.value);
    inputConductor.value = vehiculo ? vehiculo.conductor : '';
  }

  selectVehiculo.addEventListener('change', actualizarConductor);

  /* ==========================================================
     5. VALIDACIÓN Y FORMATO DEL CAMPO MONTO ($ COP)
     ========================================================== */

  function formatearMonto(valorNumerico) {
    return new Intl.NumberFormat('es-CO').format(valorNumerico);
  }

  function obtenerMontoNumerico() {
    const limpio = inputMonto.value.replace(/[^\d]/g, '');
    return limpio ? parseInt(limpio, 10) : 0;
  }

  inputMonto.addEventListener('input', () => {
    const numero = obtenerMontoNumerico();
    inputMonto.value = numero ? formatearMonto(numero) : '';
    inputMonto.classList.remove('input-error');
  });

  inputMonto.addEventListener('blur', () => {
    if (obtenerMontoNumerico() <= 0) {
      inputMonto.classList.add('input-error');
    }
  });

  /* ==========================================================
     6. CARGA DE ARCHIVOS (comprobante de soporte)
     ========================================================== */

  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length) {
      manejarArchivo(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      manejarArchivo(e.target.files[0]);
    }
  });

  function manejarArchivo(file) {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      mostrarToast('Formato no soportado. Usa PNG, JPG o PDF.', 'error');
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      mostrarToast(`El archivo supera los ${MAX_FILE_SIZE_MB}MB permitidos.`, 'error');
      return;
    }

    selectedFile = file;
    renderizarPreviewArchivo(file);
    simularOCR();
  }

  function renderizarPreviewArchivo(file) {
    filePreview.innerHTML = '';
    filePreview.classList.remove('d-none');

    const wrapper = document.createElement('div');
    wrapper.className = 'd-flex align-items-center justify-content-between file-preview-item p-2 rounded mt-2';

    const info = document.createElement('div');
    info.className = 'd-flex align-items-center gap-2 overflow-hidden';

    const icon = document.createElement('span');
    icon.className = 'material-symbols-outlined text-orange fs-5';
    icon.textContent = file.type === 'application/pdf' ? 'picture_as_pdf' : 'image';

    const name = document.createElement('span');
    name.className = 'fs-8 text-white text-truncate';
    name.textContent = file.name;

    info.appendChild(icon);
    info.appendChild(name);

    const btnQuitar = document.createElement('button');
    btnQuitar.type = 'button';
    btnQuitar.className = 'btn btn-link text-light-muted p-0 flex-shrink-0';
    btnQuitar.innerHTML = '<span class="material-symbols-outlined fs-6">close</span>';
    btnQuitar.addEventListener('click', (e) => {
      e.stopPropagation();
      limpiarArchivo();
    });

    wrapper.appendChild(info);
    wrapper.appendChild(btnQuitar);
    filePreview.appendChild(wrapper);

    // Vista previa de imagen (si el comprobante es foto)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.className = 'img-preview-thumb rounded mt-2';
        img.alt = 'Vista previa del comprobante';
        filePreview.appendChild(img);
      };
      reader.readAsDataURL(file);
    }
  }

  function limpiarArchivo() {
    selectedFile = null;
    fileInput.value = '';
    filePreview.innerHTML = '';
    filePreview.classList.add('d-none');
  }

  // Simulación de lectura OCR del comprobante (reemplazar por integración real)
  function simularOCR() {
    mostrarToast('Leyendo comprobante (OCR)...', 'info');
    setTimeout(() => {
      if (currentType === 'gasto' && !inputReferencia.value) {
        inputReferencia.value = `FE-${Math.floor(100000 + Math.random() * 899999)}`;
      }
      mostrarToast('Datos del comprobante detectados correctamente.', 'success');
    }, 900);
  }

  /* ==========================================================
     7. VALIDACIÓN Y ENVÍO DEL FORMULARIO
     ========================================================== */

  function validarFormulario() {
    const errores = [];
    const monto = obtenerMontoNumerico();

    if (!selectConcepto.value) errores.push('Selecciona un concepto.');
    if (!selectVehiculo.value) errores.push('Selecciona un vehículo.');
    if (!inputReferencia.value.trim()) errores.push('Ingresa el número de referencia (factura o flete).');
    if (monto <= 0) {
      errores.push('El monto debe ser mayor a $0 COP.');
      inputMonto.classList.add('input-error');
    }
    if (!selectedFile) errores.push('Adjunta el comprobante de soporte.');

    return errores;
  }

  function construirPayload() {
    return {
      id: `TX-${txCounter}`,
      tipo: currentType, // 'gasto' | 'ingreso'
      concepto: selectConcepto.value,
      vehiculo: selectVehiculo.value,
      conductor: inputConductor.value,
      referencia: inputReferencia.value.trim(),
      monto: obtenerMontoNumerico(),
      moneda: 'COP',
      archivo: selectedFile
        ? { nombre: selectedFile.name, tipo: selectedFile.type, tamañoKB: Math.round(selectedFile.size / 1024) }
        : null,
      fecha: new Date().toISOString()
    };
  }

  btnSubmit.addEventListener('click', async () => {
    const errores = validarFormulario();
    if (errores.length) {
      mostrarToast(errores[0], 'error');
      return;
    }

    const payload = construirPayload();

    btnSubmit.disabled = true;
    const contenidoOriginal = btnSubmit.innerHTML;
    btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...';

    try {
      // Aquí se conectaría con el backend real, por ejemplo:
      // const res = await fetch('/api/movimientos', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload)
      // });
      // if (!res.ok) throw new Error('Error de servidor');

      await simularEnvio(payload);

      mostrarToast(
        currentType === 'gasto'
          ? 'Egreso registrado y contabilizado con éxito.'
          : 'Ingreso de flete registrado con éxito.',
        'success'
      );

      txCounter += 1;
      if (txIdBadge) txIdBadge.textContent = `ID: #TX-${txCounter}`;
      resetearFormulario();

    } catch (err) {
      console.error(err);
      mostrarToast('Ocurrió un error al registrar el movimiento. Intenta de nuevo.', 'error');
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = contenidoOriginal;
    }
  });

  function simularEnvio(payload) {
    console.log('Movimiento registrado:', payload);
    return new Promise((resolve) => setTimeout(resolve, 700));
  }

  function resetearFormulario() {
    selectConcepto.selectedIndex = 0;
    selectVehiculo.selectedIndex = 0;
    actualizarConductor();
    inputReferencia.value = '';
    inputMonto.value = '';
    limpiarArchivo();
  }

  /* ==========================================================
     8. SISTEMA DE NOTIFICACIONES (TOAST)
     ========================================================== */

  function mostrarToast(mensaje, tipo = 'info') {
    let contenedor = document.getElementById('toastContainer');
    if (!contenedor) {
      contenedor = document.createElement('div');
      contenedor.id = 'toastContainer';
      contenedor.className = 'toast-container-iq';
      document.body.appendChild(contenedor);
    }

    const iconos = { success: 'check_circle', error: 'error', info: 'info' };

    const toast = document.createElement('div');
    toast.className = `toast-iq toast-iq-${tipo}`;
    toast.innerHTML = `
      <span class="material-symbols-outlined fs-5">${iconos[tipo] || 'info'}</span>
      <span class="fs-8">${mensaje}</span>
    `;
    contenedor.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  /* ==========================================================
     9. INICIALIZACIÓN
     ========================================================== */

  poblarVehiculos();
  setTipoMovimiento('gasto');

});