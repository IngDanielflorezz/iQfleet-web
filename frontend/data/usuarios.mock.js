// credenciales y roles de usuarios mockeados para pruebas de login y autorizacióncion

const usuariosMock = [
    {
        id: 1,
        nombre: "Daniel Florez",
        correo: "admin@iqfleet.com",
        passwordMock: "admin123",
        rol: "Administrador",
        mantenerSesion: true
    },
    {
        id: 2,
        nombre: "Carlos Pérez",
        correo: "conductor@iqfleet.com",
        passwordMock: "conductor123",
        rol: "Conductor",
        mantenerSesion: false
    }
];

if (typeof window !== "undefined") {
    window.usuariosMock = usuariosMock;
}   