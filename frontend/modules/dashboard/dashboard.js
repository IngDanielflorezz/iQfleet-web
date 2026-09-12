// =========================================
// DASHBOARD
// =========================================

function inicializarDashboard() {

    // Verificar que Chart.js esté disponible
    if (typeof Chart === 'undefined') {
        console.error('Chart.js no está disponible.');
        return;
    }


    // =========================================
    // GRÁFICO DE RENDIMIENTO
    // =========================================

    const elementoRendimiento =
        document.getElementById('graficoRendimiento');

    if (elementoRendimiento) {

        const ctxRendimiento =
            elementoRendimiento.getContext('2d');

        new Chart(ctxRendimiento, {

            type: 'line',

            data: {

                labels: [
                    'Lun',
                    'Mar',
                    'Mié',
                    'Jue',
                    'Vie',
                    'Sáb',
                    'Dom'
                ],

                datasets: [{

                    label: 'Km Promedio',

                    data: [
                        1200,
                        1850,
                        1400,
                        1600,
                        2100,
                        950,
                        600
                    ],

                    borderColor: '#ff7f00',

                    backgroundColor:
                        'rgba(255, 127, 0, 0.1)',

                    fill: true,

                    tension: 0.3

                }]

            },

            options: {

                responsive: true,

                plugins: {

                    legend: {

                        labels: {
                            color: '#a2a2b5'
                        }

                    }

                },

                scales: {

                    x: {

                        ticks: {
                            color: '#78788c'
                        },

                        grid: {
                            color: '#2b2b3a'
                        }

                    },

                    y: {

                        ticks: {
                            color: '#78788c'
                        },

                        grid: {
                            color: '#2b2b3a'
                        }

                    }

                }

            }

        });

    }


    // =========================================
    // GRÁFICO DE BALANCE
    // =========================================

    const elementoBalance =
        document.getElementById('graficoBalance');

    if (elementoBalance) {

        const ctxBalance =
            elementoBalance.getContext('2d');

        new Chart(ctxBalance, {

            type: 'doughnut',

            data: {

                labels: [
                    'Óptimo',
                    'Mantenimiento',
                    'Ralentí'
                ],

                datasets: [{

                    data: [
                        70,
                        15,
                        15
                    ],

                    backgroundColor: [
                        '#28a745',
                        '#ffc107',
                        '#dc3545'
                    ],

                    borderWidth: 0

                }]

            },

            options: {

                responsive: true,

                plugins: {

                    legend: {

                        position: 'bottom',

                        labels: {
                            color: '#a2a2b5'
                        }

                    }

                }

            }

        });

    }

}


// =========================================
// INICIALIZAR DASHBOARD
// =========================================

inicializarDashboard();