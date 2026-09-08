let selectedRol = 'Administrador';

function selectRole(role) {
  selectedRol = role;
  document.getElementById('roleAdmin').classList.toggle('selected', role === 'Administrador');
  document.getElementById('roleDriver').classList.toggle('selected', role === 'Conductor');
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');
  const forgotPasswordLink = document.getElementById('forgotPassword');

  // Mostrar / Ocultar contraseña
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      togglePasswordBtn.querySelector('i').classList.toggle('bi-eye');
      togglePasswordBtn.querySelector('i').classList.toggle('bi-eye-slash');
    });
  }

  // Recuperar contraseña simulada
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Se ha enviado un enlace simulado de recuperación a tu correo corporativo.');
    });
  }

  // Validación e inicio de sesión
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const rememberMe = document.getElementById('rememberMe').checked;

      const usuarios = Storage.get('iqfleet_usuarios') || [];
      const user = usuarios.find(u => u.correo === email && u.passwordMock === password && u.rol === selectedRol);

      if (user) {
        const sessionData = { id: user.id, nombre: user.nombre, rol: user.rol };
        
        if (rememberMe) {
          localStorage.setItem('iqfleet_session', JSON.stringify(sessionData));
        } else {
          sessionStorage.setItem('iqfleet_session', JSON.stringify(sessionData));
        }

        // Redirección según el rol
        if (user.rol === 'Administrador') {
          window.location.href = '../dashboard/index.html';
        } else {
          window.location.href = '../conductores/index.html';
        }
      } else {
        alert('Credenciales incorrectas o el rol seleccionado no coincide.');
      }
    });
  }
});