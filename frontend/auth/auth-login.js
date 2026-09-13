/**
 * Módulo de Autenticación de Usuario - iQFleet
 */

import { getUsers, saveRememberedEmail, getRememberedEmail, setSession } from '../core/storage.js';

// Rol seleccionado por defecto en la interfaz
let selectedRole = 'Administrador';

/**
 * Cambia el rol activo del formulario y actualiza la presentación visual de los botones.
 * Expuesta globalmente para interactuar con los eventos onclick del DOM.
 * @param {string} role - El rol a seleccionar ('Administrador' | 'Conductor')
 */
window.selectRole = function(role) {
  selectedRole = role;
  const roleAdminBtn = document.getElementById('roleAdmin');
  const roleDriverBtn = document.getElementById('roleDriver');

  if (role === 'Administrador') {
    roleAdminBtn?.classList.add('active');
    roleDriverBtn?.classList.remove('active');
  } else {
    roleDriverBtn?.classList.add('active');
    roleAdminBtn?.classList.remove('active');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Límite máximo de intentos fallidos antes de bloquear la interfaz
  let attemptsLeft = 3;

  // Captura de elementos principales del DOM
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const rememberMeCheck = document.getElementById('rememberMe');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const loginForm = document.getElementById('loginForm');
  const forgotPasswordLink = document.querySelector('.link-orange');
  const submitBtn = loginForm?.querySelector('button[type="submit"]') || loginForm?.querySelector('button');

  // Inicialización de contenedores para mensajes de retroalimentación
  const emailError = createErrorSpan(emailInput);
  const passwordError = createErrorSpan(passwordInput);
  const globalError = createGlobalErrorContainer(loginForm);

  // Recarga el correo guardado si la casilla de recordar estuvo activa previamente
  const savedEmail = getRememberedEmail();
  if (savedEmail && emailInput && rememberMeCheck) {
    emailInput.value = savedEmail;
    rememberMeCheck.checked = true;
  }

  // Evento para conmutar la visibilidad de la contraseña
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';

      const icon = togglePasswordBtn.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-eye-slash', !isPassword);
        icon.classList.toggle('fa-eye', isPassword);
      }
    });
  }

  // Manejo simulado de la recuperación de credenciales
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Proceso de recuperación: Se ha enviado un enlace a tu correo corporativo.');
    });
  }

  /**
   * Limpia los mensajes de error activos en la interfaz y reinicia las animaciones.
   */
  function clearErrors() {
    if (emailError) emailError.textContent = '';
    if (passwordError) passwordError.textContent = '';
    if (globalError) globalError.textContent = '';
    loginForm?.classList.remove('shake-animation');
  }

  // Escuchadores para limpiar alertas dinámicamente mientras el usuario escribe
  emailInput?.addEventListener('input', clearErrors);
  passwordInput?.addEventListener('input', clearErrors);

  /**
   * Valida la estructura mediante expresión regular estándar para correos.
   * @param {string} email
   * @returns {boolean}
   */
  function isValidEmailFormat(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Procesamiento principal del formulario al enviarse
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      clearErrors();

      // Restricción por agotamiento de intentos
      if (attemptsLeft <= 0) {
        if (globalError) globalError.textContent = 'Acceso bloqueado. Ha superado el número máximo de intentos.';
        return;
      }

      const correo = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value.trim() : '';
      let isValid = true;

      // Validación de campo de correo electrónico
      if (!correo) {
        if (emailError) emailError.textContent = 'El correo electrónico no puede estar vacío.';
        isValid = false;
      } else if (!isValidEmailFormat(correo)) {
        if (emailError) emailError.textContent = 'Por favor ingresa un correo con formato válido.';
        isValid = false;
      }

      // Validación de campo de contraseña
      if (!password) {
        if (passwordError) passwordError.textContent = 'La contraseña no puede estar vacía.';
        isValid = false;
      }

      // Detiene el proceso si existen inconsistencias en la entrada de datos
      if (!isValid) {
        triggerShake();
        return;
      }

      // Proporciona retroalimentación de carga bloqueando el botón de acción
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> INICIANDO SESION...';
      }

      // Simulación de retraso de red para la validación de credenciales
      setTimeout(() => {
        const usuarios = getUsers();

        // Búsqueda de coincidencia según datos de usuario, contraseña y rol asignado
        const usuarioValido = usuarios.find(user => {
          const matchCorreo = (user.correo === correo || user.email === correo);
          const matchPass = (user.passwordMock === password || user.password === password);
          const matchRol = (user.rol === selectedRole || user.role === selectedRole);
          return matchCorreo && matchPass && matchRol;
        });

        if (usuarioValido) {
          const isRemembered = rememberMeCheck ? rememberMeCheck.checked : false;

          // Guarda la sesión activa y la preferencia de recordar correo
          saveRememberedEmail(isRemembered ? correo : '');
          setSession(usuarioValido, isRemembered);

          const userRol = usuarioValido.rol || usuarioValido.role;

          // Redirección dirigida hacia la arquitectura modular del sistema
          if (userRol === 'Administrador' || userRol === 'admin') {
            window.location.href = '../dashboard/index.html';
          } else {
            window.location.href = '../modules/conductores/conductores.html';
          }
        } else {
          // Descuento de intentos y retroalimentación de error
          attemptsLeft--;
          restoreSubmitButton();
          triggerShake();

          if (attemptsLeft > 0) {
            if (globalError) {
              globalError.textContent = `Usuario o contraseña incorrectos. Intentos restantes: ${attemptsLeft}`;
            }
          } else {
            // Inhabilitación permanente de entradas ante bloqueos por seguridad
            if (globalError) {
              globalError.textContent = 'Demasiados intentos fallidos. El formulario ha sido deshabilitado.';
            }
            if (emailInput) emailInput.disabled = true;
            if (passwordInput) passwordInput.disabled = true;
          }
        }
      }, 600);
    });
  }

  /**
   * Genera dinámicamente un nodo span para la renderización de errores por input.
   */
  function createErrorSpan(inputElement) {
    if (!inputElement) return null;
    let span = inputElement.parentElement.querySelector('.text-danger');
    if (!span) {
      span = document.createElement('span');
      span.className = 'text-danger d-block mt-1';
      span.style.fontSize = '0.75rem';
      inputElement.parentElement.appendChild(span);
    }
    return span;
  }

  /**
   * Genera dinámicamente el contenedor global para notificaciones del formulario.
   */
  function createGlobalErrorContainer(formElement) {
    if (!formElement) return null;
    let div = formElement.querySelector('.global-error-msg');
    if (!div) {
      div = document.createElement('div');
      div.className = 'global-error-msg text-danger text-center mt-3 fw-bold';
      div.style.fontSize = '0.85rem';
      formElement.appendChild(div);
    }
    return div;
  }

  /**
   * Restablece el estado y contenido original del botón de inicio de sesión.
   */
  function restoreSubmitButton() {
    if (submitBtn && submitBtn.dataset.originalText) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = submitBtn.dataset.originalText;
    }
  }

  /**
   * Ejecuta la animación CSS de sacudida visual al detectar errores.
   */
  function triggerShake() {
    const card = document.querySelector('.login-split-card') || loginForm;
    card?.classList.add('shake-animation');
    setTimeout(() => card?.classList.remove('shake-animation'), 400);
  }
});