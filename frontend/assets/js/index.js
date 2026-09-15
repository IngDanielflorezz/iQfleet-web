// ================= iQFleet — Interacciones =================

document.addEventListener('DOMContentLoaded', function () {
  const navMenuEl = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  const sections = document.querySelectorAll('section[id]');

  // 1. Cierre automático del menú hamburguesa en móviles al hacer clic en un enlace
  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      if (navMenuEl && navMenuEl.classList.contains('show')) {
        const bsCollapse = bootstrap.Collapse.getInstance(navMenuEl);
        if (bsCollapse) {
          bsCollapse.hide();
        }
      }
    });
  });

  // 2. Resaltar el enlace de navegación activo según la sección visible (ScrollSpy)
  if ('IntersectionObserver' in window && sections.length && navLinks.length) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navLinks.forEach(function (link) {
              link.classList.remove('active', 'text-dark', 'fw-semibold');
              
              if (link.getAttribute('href') === '#' + id) {
                link.classList.add('active', 'text-dark', 'fw-semibold');
              } else {
                link.classList.add('text-secondary');
              }
            });
          }
        });
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }
});