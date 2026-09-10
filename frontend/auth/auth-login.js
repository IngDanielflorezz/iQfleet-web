// Garantiza que la manipulación del DOM ocurra solo cuando la estructura HTML esté totalmente parseada
document.addEventListener('DOMContentLoaded', () => {
    
    // Estado local para mantener el rol seleccionado ('Administrador' por defecto)
    let selectedRole = 'Administrador';

    // Captura de referencias a elementos del DOM
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const loginForm = document.getElementById('loginForm');
    const roleAdminBtn = document.getElementById('roleAdmin');
    const roleDriverBtn = document.getElementById('roleDriver');

    // Función expuesta en el objeto window para alternar la selección visual entre roles
    window.selectRole = function(role) {
        selectedRole = role;

        if (role === 'Administrador') {
            // Activa las clases CSS para el botón de Administrador
            roleAdminBtn.classList.add('active', 'selected');
            roleDriverBtn.classList.remove('active', 'selected');
        } else {
            // Activa las clases CSS para el botón de Conductor
            roleDriverBtn.classList.add('active', 'selected');
            roleAdminBtn.classList.remove('active', 'selected');
        }
    };

    // Manejo de visibilidad de la contraseña
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            // Verifica si actualmente el input es de tipo password
            const isPassword = passwordInput.type === 'password';
            
            // Cambia dinámicamente entre 'text' y 'password'
            passwordInput.type = isPassword ? 'text' : 'password';
            
            // Alterna la clase de FontAwesome para el icono de ojo abierto / cerrado
            const icon = togglePasswordBtn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye-slash', !isPassword);
                icon.classList.toggle('fa-eye', isPassword);
            }
        });
    }

    // Intercepción del evento de envío del formulario
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            // Cancela el comportamiento nativo de recarga de página del navegador
            e.preventDefault();

            // Limpieza de espacios en blanco al inicio y final de los valores
            const correo = emailInput.value.trim();
            const password = passwordInput.value.trim();

            // Intenta leer la lista de usuarios desde la clase Storage o recurre al mock global
            const usuarios = Storage.get('iqfleet_usuarios') || (typeof usuariosMock !== 'undefined' ? usuariosMock : []);

            // Valida coincidencia estricta de Correo, Contraseña y Rol activo
            const usuarioValido = usuarios.find(user => 
                user.correo === correo && 
                user.passwordMock === password && 
                user.rol === selectedRole
            );

            // Proceso de inicio de sesión exitoso
            if (usuarioValido) {
                // Persiste la información del usuario en localStorage mediante Storage
                Storage.setSession(usuarioValido);

                // Redirecciona según la ruta correspondiente a cada Rol
                if (usuarioValido.rol === 'Administrador') {
                    window.location.href = '../dashboard/index.html';
                } else {
                    window.location.href = '../conductores/index.html';
                }
            } else {
                // Alerta informativa en caso de fallo de autenticación
                alert('Credenciales inválidas o el rol seleccionado no coincide con la cuenta.');
            }
        });
    }
});