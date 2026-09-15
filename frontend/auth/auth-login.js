/**
 * Módulo de Autenticación de Usuario - iQFleet (auth-login.js)
 */

import { getUsers, saveRememberedEmail, getRememberedEmail, setSession } from '../core/storage.js';

let selectedRole = 'Administrador';

document.addEventListener('DOMContentLoaded', () => {
  let attemptsLeft = 3;

  // Elementos DOM
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const rememberMeCheck = document.getElementById('rememberMe');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const loginForm = document.getElementById('loginForm');
  const forgotPasswordLink = document.querySelector('.link-orange');
  const submitBtn = loginForm?.querySelector('button[type="submit"]') || loginForm?.querySelector('button');
  const roleAdminBtn = document.getElementById('roleAdmin');
  const roleDriverBtn = document.getElementById('roleDriver');

  // Asignación de eventos para selección de Rol (Reemplaza a onclick)
  function selectRole(role) {
    selectedRole = role;
    if (role === 'Administrador') {
      roleAdminBtn?.classList.add('active');
      roleDriverBtn?.classList.remove('active');
    } else {
      roleDriverBtn?.classList.add('active');
      roleAdminBtn?.classList.remove('active');
    }
  }

  roleAdminBtn?.addEventListener('click', () => selectRole('Administrador'));
  roleDriverBtn?.addEventListener('click', () => selectRole('Conductor'));

  // Manejo de errores visuales
  const emailError = createErrorSpan(emailInput);
  const passwordError = createErrorSpan(passwordInput);
  const globalError = createGlobalErrorContainer(loginForm);

  // Recarga correo recordado
  const savedEmail = getRememberedEmail();
  if (savedEmail && emailInput && rememberMeCheck) {
    emailInput.value = savedEmail;
    rememberMeCheck.checked = true;
  }

  // Toggle contraseña
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

  // Recuperar contraseña mock
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Proceso de recuperación: Se ha enviado un enlace a tu correo corporativo.');
    });
  }

  function clearErrors() {
    if (emailError) emailError.textContent = '';
    if (passwordError) passwordError.textContent = '';
    if (globalError) globalError.textContent = '';
    loginForm?.classList.remove('shake-animation');
  }

  emailInput?.addEventListener('input', clearErrors);
  passwordInput?.addEventListener('input', clearErrors);

  function isValidEmailFormat(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      clearErrors();

      if (attemptsLeft <= 0) {
        if (globalError) globalError.textContent = 'Acceso bloqueado. Ha superado el número máximo de intentos.';
        return;
      }

      const correo = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value.trim() : '';
      let isValid = true;

      if (!correo) {
        if (emailError) emailError.textContent = 'El correo electrónico no puede estar vacío.';
        isValid = false;
      } else if (!isValidEmailFormat(correo)) {
        if (emailError) emailError.textContent = 'Por favor ingresa un correo con formato válido.';
        isValid = false;
      }

      if (!password) {
        if (passwordError) passwordError.textContent = 'La contraseña no puede estar vacía.';
        isValid = false;
      }

      if (!isValid) {
        triggerShake();
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> INICIANDO SESIÓN...';
      }

      setTimeout(() => {
        let usuarios = getUsers();

        // Fallback: Si no hay usuarios en storage, provee credenciales por defecto
        if (!usuarios || usuarios.length === 0) {
          usuarios = [
            { correo: 'admin@iqfleet.com', password: '1234', rol: 'Administrador' },
            { correo: 'conductor@iqfleet.com', password: '1234', rol: 'Conductor' }
          ];
        }

        const usuarioValido = usuarios.find(user => {
          const matchCorreo = (user.correo === correo || user.email === correo);
          const matchPass = (user.passwordMock === password || user.password === password);
          const matchRol = (user.rol === selectedRole || user.role === selectedRole);
          return matchCorreo && matchPass && matchRol;
        });

        if (usuarioValido) {
          const isRemembered = rememberMeCheck ? rememberMeCheck.checked : false;

          saveRememberedEmail(isRemembered ? correo : '');
          setSession(usuarioValido, isRemembered);

          const userRol = usuarioValido.rol || usuarioValido.role;

          if (userRol === 'Administrador' || userRol === 'admin') {
            window.location.href = '../modules/dashboard/dashboard.html';
          } else {
            window.location.href = '../modules/conductores/conductores.html';
          }
        } else {
          attemptsLeft--;
          restoreSubmitButton();
          triggerShake();

          if (attemptsLeft > 0) {
            if (globalError) {
              globalError.textContent = `Usuario o contraseña incorrectos. Intentos restantes: ${attemptsLeft}`;
            }
          } else {
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

  function restoreSubmitButton() {
    if (submitBtn && submitBtn.dataset.originalText) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = submitBtn.dataset.originalText;
    }
  }

  function triggerShake() {
    const card = document.querySelector('.login-split-card') || loginForm;
    card?.classList.add('shake-animation');
    setTimeout(() => card?.classList.remove('shake-animation'), 400);
  }
});