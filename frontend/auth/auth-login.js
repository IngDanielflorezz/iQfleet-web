// Espera a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    
    // Estado local para el rol ('Administrador' por defecto)
    let selectedRole = 'Administrador';

    // Referencias del DOM
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberMeCheck = document.getElementById('rememberMe');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const loginForm = document.getElementById('loginForm');
    const roleAdminBtn = document.getElementById('roleAdmin');
    const roleDriverBtn = document.getElementById('roleDriver');
    const forgotPasswordLink = document.querySelector('.link-orange');

    // Selección interactiva de rol
    window.selectRole = function(role) {
        selectedRole = role;

        if (role === 'Administrador') {
            roleAdminBtn.classList.add('active');
            roleDriverBtn.classList.remove('active');
        } else {
            roleDriverBtn.classList.add('active');
            roleAdminBtn.classList.remove('active');
        }
    };

    // Alternar visibilidad de contraseña
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            
            const icon = togglePasswordBtn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye-slash', !isPassword);
                icon.classList.toggle('fa-eye', isPassword);
            }
        });
    }

    // Modal/Notificación simulada para "¿Olvidaste tu contraseña?"
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Proceso de recuperación: Se ha enviado un enlace de restablecimiento a tu correo corporativo asignado.');
        });
    }

    // Procesar inicio de sesión
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const correo = emailInput.value.trim();
            const password = passwordInput.value.trim();

            // Cargar usuarios desde Storage o fallback a mock
            const usuarios = (typeof Storage !== 'undefined' && Storage.get('iqfleet_usuarios')) 
                || (typeof usuariosMock !== 'undefined' ? usuariosMock : []);

            // Validar credenciales y rol activo
            const usuarioValido = usuarios.find(user => 
                user.correo === correo && 
                user.passwordMock === password && 
                user.rol === selectedRole
            );

            if (usuarioValido) {
                const isRemembered = rememberMeCheck ? rememberMeCheck.checked : false;
                
                // Guardar en Storage o directo en sessionStorage/localStorage
                if (typeof Storage !== 'undefined' && Storage.setSession) {
                    Storage.setSession(usuarioValido, isRemembered);
                } else {
                    const storageTarget = isRemembered ? localStorage : sessionStorage;
                    storageTarget.setItem('iqfleet_session', JSON.stringify(usuarioValido));
                }

                // Redireccionar según el rol
                if (usuarioValido.rol === 'Administrador') {
                    window.location.href = '../dashboard/index.html';
                } else {
                    window.location.href = '../conductores/index.html';
                }
            } else {
                alert('Credenciales inválidas o el rol seleccionado no coincide con la cuenta.');
            }
        });
    }
});