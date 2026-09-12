// =========================================
// ROUTER PRINCIPAL DE IQFLEET
// =========================================

// Contenedor donde se cargan los módulos
const appContent = document.getElementById('app-content');


// =========================================
// MÓDULOS DISPONIBLES
// =========================================

const modules = {

    dashboard: {
        html: '../modules/dashboard/dashboard.html',
        js: '../modules/dashboard/dashboard.js'
    },

    vehiculos: {
        html: '../modules/vehiculos/vehiculos.html',
        js: '../modules/vehiculos/vehiculos.js'
    },

    conductores: {
        html: '../modules/conductores/conductores.html',
        js: '../modules/conductores/conductores.js'
    },

    documentos: {
        html: '../modules/documentos/documentos.html',
        js: '../modules/documentos/documentos.js'
    },

    finanzas: {
        html: '../modules/finanzas/finanzas.html',
        js: '../modules/finanzas/finanzas.js'
    },

    mantenimiento: {
        html: '../modules/mantenimiento/mantenimiento.html',
        js: '../modules/mantenimiento/mantenimiento.js'
    },

    configuracion: {
        html: '../modules/configuracion/configuracion.html',
        js: '../modules/configuracion/configuracion.js'
    }

};


// =========================================
// CARGAR MÓDULO
// =========================================

async function cargarModulo(nombreModulo) {

    const modulo = modules[nombreModulo];

    if (!modulo) {

        console.error(
            `El módulo "${nombreModulo}" no está registrado.`
        );

        await cargarModulo('dashboard');

        return;
    }


    try {

        // Cargar HTML
        const respuesta = await fetch(modulo.html);

        if (!respuesta.ok) {
            throw new Error(
                `No se pudo cargar ${modulo.html}`
            );
        }

        const contenido = await respuesta.text();

        // Insertar contenido
        appContent.innerHTML = contenido;


        // Cargar JavaScript del módulo
        await import(`${modulo.js}?v=${Date.now()}`);


        // Marcar opción activa
        actualizarMenu(nombreModulo);

    } catch (error) {

        console.error(
            'Error al cargar el módulo:',
            error
        );

        appContent.innerHTML = `
            <div class="alert alert-danger">
                No se pudo cargar el módulo solicitado.
            </div>
        `;

    }

}


// =========================================
// ACTUALIZAR OPCIÓN ACTIVA
// =========================================

function actualizarMenu(nombreModulo) {

    const enlaces =
        document.querySelectorAll('[data-route]');

    enlaces.forEach(function(enlace) {

        enlace.classList.remove('active');

        const ruta =
            enlace.getAttribute('data-route');

        if (ruta === nombreModulo) {
            enlace.classList.add('active');
        }

    });

}


// =========================================
// OBTENER RUTA ACTUAL
// =========================================

function obtenerRuta() {

    const hash =
        window.location.hash;

    if (!hash) {
        return 'dashboard';
    }

    const ruta =
        hash.replace('#/', '');

    if (!modules[ruta]) {
        return 'dashboard';
    }

    return ruta;

}


// =========================================
// CAMBIO DE RUTA
// =========================================

function manejarRuta() {

    const ruta =
        obtenerRuta();

    cargarModulo(ruta);

}


// =========================================
// ESCUCHAR CAMBIOS DE URL
// =========================================

window.addEventListener(
    'hashchange',
    manejarRuta
);


// =========================================
// INICIAR ROUTER
// =========================================

manejarRuta();