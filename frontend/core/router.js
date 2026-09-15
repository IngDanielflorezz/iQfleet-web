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

        // Cargar el HTML COMPLETO del módulo (el mismo archivo que se usa
        // en modo standalone, sin ninguna copia/fragmento paralelo, para
        // que el diseño nunca pueda desincronizarse).
        const respuesta = await fetch(modulo.html);

        if (!respuesta.ok) {
            throw new Error(
                `No se pudo cargar ${modulo.html}`
            );
        }

        const contenido = await respuesta.text();

        // Parseamos el documento completo del módulo para poder manipularlo
        // antes de inyectarlo (en vez de un innerHTML crudo con <html>/<head>
        // dentro de un <div>, que el navegador no interpreta bien).
        const doc = new DOMParser().parseFromString(contenido, 'text/html');

        // El ÚNICO elemento que se descarta es el sidebar: es idéntico en
        // todos los módulos y el shell (app.html) ya renderiza uno solo de
        // forma permanente. El topbar de cada módulo SÍ se conserva tal
        // cual (varía de módulo a módulo: botones, badges, buscador...) y
        // como usa position:fixed se ubica correctamente aunque quede
        // anidado dentro de #app-content.
        doc.querySelectorAll('.sidebar-iq').forEach((el) => el.remove());

        // Cargamos (una sola vez, sin duplicar) las hojas de estilo y
        // librerías externas que el módulo declara en su propio archivo
        // (ej: dashboard.css, html2pdf.js) para que se vea y funcione
        // exactamente igual que en modo standalone.
        await asegurarAssetsDelModulo(doc);

        // Los <script> del documento original no se ejecutan al inyectarse
        // vía innerHTML (el navegador los ignora); el JS real del módulo se
        // carga aparte con import() más abajo, así que los quitamos del
        // marcado para no dejar nodos inertes.
        doc.querySelectorAll('script').forEach((el) => el.remove());

        // Insertar contenido (topbar del módulo + main + modales, intactos)
        appContent.innerHTML = doc.body.innerHTML;


        // Cargar JavaScript del módulo
        const moduloJS = await import(`${modulo.js}?v=${Date.now()}`);

        // El HTML del módulo se inyectó DESPUÉS de que el documento ya
        // disparó 'DOMContentLoaded', así que cada módulo debe exponer un
        // export init() que el router invoca aquí manualmente.
        if (typeof moduloJS.init === 'function') {
            moduloJS.init();
        }


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
// ASEGURAR ASSETS EXTERNOS DEL MÓDULO (CSS/JS por CDN)
// =========================================
// Evita duplicar <link>/<script> que ya estén en el documento (ej. Bootstrap,
// que el shell ya carga) y agrega los que falten (ej. dashboard.css,
// html2pdf.js) esperando a que terminen de cargar antes de continuar.

async function asegurarAssetsDelModulo(doc) {

    const hojasDeEstilo = Array.from(
        doc.head ? doc.head.querySelectorAll('link[rel="stylesheet"]') : []
    );

    const scriptsExternos = Array.from(
        doc.body.querySelectorAll('script[src]')
    ).filter((s) => /^https?:\/\//i.test(s.getAttribute('src') || ''));

    const tareas = [];

    hojasDeEstilo.forEach((link) => {
        const href = link.getAttribute('href');
        if (href) tareas.push(asegurarAsset('link', { rel: 'stylesheet', href }, 'href'));
    });

    scriptsExternos.forEach((script) => {
        const src = script.getAttribute('src');
        if (src) tareas.push(asegurarAsset('script', { src }, 'src'));
    });

    await Promise.all(tareas);
}

function asegurarAsset(tagName, atributos, claveDedupe) {

    const valorClave = atributos[claveDedupe];
    const yaExiste = document.head.querySelector(
        `${tagName}[${claveDedupe}="${valorClave}"]`
    );

    if (yaExiste) {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        const el = document.createElement(tagName);
        Object.entries(atributos).forEach(([clave, valor]) => {
            el.setAttribute(clave, valor);
        });
        el.addEventListener('load', () => resolve());
        el.addEventListener('error', () => resolve()); // no bloquear la carga si un CDN falla
        document.head.appendChild(el);
    });
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