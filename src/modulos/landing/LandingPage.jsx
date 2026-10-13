import { useState } from 'react';
import { Link } from 'react-router-dom';
import useScrollFade from '../../hooks/useScrollFade';
import heroBackground from '../../assets/Flota moderna al amanecer urbano.png';
import './LandingPage.css';

function Icon({ name, className = '' }) {
  return <span className={`lp-icon ${className}`}>{name}</span>;
}

const NAV_LINKS = [
  { label: 'Producto', href: '#producto' },
  { label: 'Módulos', href: '#modulos' },
  { label: 'Control documental', href: '#documental' },
  { label: 'Preguntas', href: '#preguntas' },
];

const INDICATORS = [
  { label: 'Vehículos activos', value: '18/20', context: '90% disponibles', icon: 'directions_bus' },
  { label: 'Conductores', value: '24', context: '18 operativos hoy', icon: 'group' },
  { label: 'Cumplimiento legal', value: '96.2%', context: '3 documentos críticos', icon: 'shield' },
  { label: 'Margen neto', value: '31.7%', context: 'Superávit operativo', icon: 'monitoring' },
];

const VEHICLES = [
  { placa: 'UVP-123', tipo: 'Bus Padrón', conductor: 'Juan Pérez', status: 'ok', label: 'Al día' },
  { placa: 'WZA-456', tipo: 'Buseta', conductor: 'Carlos R.', status: 'warn', label: 'Por vencer' },
  { placa: 'TRL-890', tipo: 'Bus Intermunicipal', conductor: 'Andrés G.', status: 'ok', label: 'Al día' },
];

const MODULES = [
  {
    icon: 'dashboard',
    title: 'Dashboard ejecutivo',
    desc: 'Consola central con disponibilidad de flota, personal activo, cumplimiento legal y margen neto en tiempo real.',
    meta: 'Indicadores en vivo',
  },
  {
    icon: 'directions_bus',
    title: 'Flota y vehículos',
    desc: 'Ficha completa por unidad: placa, marca, modelo, tipo, kilometraje, estado y vencimientos legales.',
    meta: '20 unidades registradas',
  },
  {
    icon: 'group',
    title: 'Conductores',
    desc: 'Gestión del personal operativo con categoría de licencia, vencimientos, móvil asignado y turno.',
    meta: 'Control de fatiga',
  },
  {
    icon: 'folder_open',
    title: 'Control documental',
    desc: 'Auditoría automática de SOAT, revisión técnico-mecánica, pólizas y tarjetas de operación.',
    meta: 'Sincronización RUNT / CDA',
  },
  {
    icon: 'monitoring',
    title: 'Control financiero',
    desc: 'Consolidación de ingresos, costos por vehículo y rentabilidad por kilómetro en pesos colombianos.',
    meta: 'Cifras en COP',
  },
  {
    icon: 'manage_accounts',
    title: 'Administración',
    desc: 'Roles y permisos para propietarios, administradores y personal operativo de la empresa.',
    meta: 'Acceso por rol',
  },
];

const DOCUMENTS = [
  { doc: 'SOAT Obligatorio', owner: 'UVP-123', date: '25 Oct 2024', status: 'bad', label: 'Vencido' },
  { doc: 'Revisión Técnico-Mecánica', owner: 'WZA-456', date: '12 Dic 2024', status: 'warn', label: 'Por vencer' },
  { doc: 'Póliza Contractual', owner: 'TRL-890', date: '28 Sep 2024', status: 'warn', label: 'Por vencer' },
  { doc: 'Tarjeta de Operación', owner: 'EQZ-912', date: '02 Feb 2025', status: 'ok', label: 'Vigente' },
];

const WORKFLOW = [
  {
    step: '01',
    icon: 'login',
    title: 'Ingresar al sistema',
    desc: 'El administrador accede con su rol y visualiza de inmediato el estado general de la operación.',
  },
  {
    step: '02',
    icon: 'search',
    title: 'Consultar la información',
    desc: 'Filtra por vehículo, conductor o documento y revisa vencimientos y costos asociados.',
  },
  {
    step: '03',
    icon: 'download',
    title: 'Descargar el reporte',
    desc: 'Exporta el reporte consolidado en PDF para auditoría, control interno o presentación.',
  },
];

const FAQS = [
  {
    q: '¿Qué problema resuelve iQFleet?',
    a: 'Centraliza la gestión de la flota que hoy se lleva en carpetas físicas y hojas sueltas, eliminando demoras en la consulta de documentos y el vencimiento descontrolado de requisitos legales.',
  },
  {
    q: '¿Qué documentos controla el sistema?',
    a: 'SOAT, revisión técnico-mecánica, pólizas contractuales y tarjetas de operación de cada vehículo, junto con las licencias y vencimientos del personal operativo.',
  },
  {
    q: '¿Cómo ayuda al control financiero?',
    a: 'Consolida los ingresos y los costos por vehículo (combustible, peajes, taller y repuestos) para conocer la rentabilidad real por kilómetro de cada unidad.',
  },
  {
    q: '¿Qué roles pueden usar la plataforma?',
    a: 'Propietarios y administradores disponen del panel completo de gestión, mientras el personal operativo cuenta con accesos acordes a su rol.',
  },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const heroImageRef = useScrollFade({ maxBlurPx: 16, scaleRange: 0.08 });

  const toggleFaq = (index) => {
    setOpenFaq((current) => (current === index ? -1 : index));
  };

  return (
    <div className="landing-iq">
      {/* ================= NAV ================= */}
      <header className="lp-nav">
        <div className="lp-container lp-nav__inner">
          <a className="lp-brand" href="#inicio">
            <span className="lp-brand__symbol">
              <Icon name="alt_route" />
            </span>
            <span className="lp-brand__word">iQFleet</span>
          </a>

          <nav className="lp-nav__links">
            {NAV_LINKS.map((link) => (
              <a key={link.href} className="lp-nav__link" href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="lp-nav__actions">
            <Link className="lp-nav__login" to="/login">
              Iniciar sesión
            </Link>
            <a className="lp-btn lp-btn--primary" href="#demostracion">
              <span>Solicitar demo</span>
              <Icon name="arrow_forward" />
            </a>
            <button
              type="button"
              className="lp-nav__toggle"
              aria-label="Abrir menú"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <Icon name={menuOpen ? 'close' : 'menu'} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lp-container" style={{ paddingBottom: '16px' }}>
            <nav className="lp-nav__links" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  className="lp-nav__link"
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* ================= HERO ================= */}
      <section className="lp-hero" id="inicio">
        <img
          className="lp-hero__bg"
          ref={heroImageRef}
          src={heroBackground}
          alt=""
          aria-hidden="true"
        />
        <span className="lp-hero__overlay" aria-hidden="true" />

        <span className="lp-hero__category">
          <Icon name="directions_bus" />
          Sistema de gestión de flotas de transporte público
        </span>
        <h1 className="lp-hero__title">
          Toda tu flota bajo <span>control centralizado</span>
        </h1>
        <p className="lp-hero__description">
          iQFleet digitaliza la gestión documental, operativa y financiera de tu flota de transporte
          público. Olvídate de las carpetas físicas y toma decisiones con información confiable en
          tiempo real.
        </p>
        <div className="lp-hero__actions">
          <a className="lp-btn lp-btn--primary" href="#demostracion">
            <span>Conocer la plataforma</span>
            <Icon name="arrow_forward" />
          </a>
          <Link className="lp-btn lp-btn--ghost" to="/login">
            <span>Iniciar sesión</span>
          </Link>
        </div>
        <p className="lp-hero__applicability">
          Diseñado para operadores de transporte público urbano e intermunicipal.
        </p>
      </section>

      {/* ================= PRODUCTO (MOCKUP) ================= */}
      <section className="lp-product" id="producto">
        <div className="lp-product__frame">
          <aside className="lp-product__sidebar">
            <div className="lp-product__brand">
              <span className="lp-product__brand-symbol">
                <Icon name="alt_route" />
              </span>
              <span className="lp-product__brand-word">iQFleet</span>
            </div>

            <nav className="lp-product__nav">
              <span className="lp-product__nav-item is-active">
                <Icon name="dashboard" /> Dashboard
              </span>
              <span className="lp-product__nav-item">
                <Icon name="directions_bus" /> Flota y vehículos
              </span>
              <span className="lp-product__nav-item">
                <Icon name="group" /> Conductores
              </span>
              <span className="lp-product__nav-item">
                <Icon name="folder_open" /> Documentos
              </span>
              <span className="lp-product__nav-item">
                <Icon name="monitoring" /> Finanzas
              </span>
            </nav>

            <div className="lp-product__workspace">
              <span className="lp-product__workspace-role">Rol: Propietario</span>
              <span className="lp-product__workspace-context">
                Acceso completo a la operación y a los reportes de la empresa.
              </span>
            </div>
          </aside>

          <div className="lp-product__main">
            <div className="lp-product__toolbar">
              <span className="lp-product__breadcrumb">Operación / Panel general</span>
              <div className="lp-product__account">
                <span className="lp-product__status">
                  <span className="lp-product__status-dot" /> 18 en ruta (90%)
                </span>
                <Icon name="notifications" className="lp-product__bell" />
                <span className="lp-product__avatar">CM</span>
              </div>
            </div>

            <div className="lp-product__overview">
              <div className="lp-product__heading">
                <div>
                  <h3>Consola de control operativo</h3>
                  <span>Corte: 24 Oct, 16:40</span>
                </div>
                <span className="lp-product__report">
                  <Icon name="download" /> Reporte PDF
                </span>
              </div>

              <div className="lp-product__indicators">
                {INDICATORS.map((item) => (
                  <div key={item.label} className="lp-product__indicator">
                    <div className="lp-product__indicator-label">
                      <span>{item.label}</span>
                      <Icon name={item.icon} />
                    </div>
                    <span className="lp-product__indicator-value">{item.value}</span>
                    <span className="lp-product__indicator-context">{item.context}</span>
                  </div>
                ))}
              </div>

              <div className="lp-product__summary">
                <div className="lp-product__panel">
                  <div className="lp-product__panel-head">
                    Rendimiento financiero
                    <span>Millones COP</span>
                  </div>
                  <div className="lp-product__chart" role="img" aria-label="Gráfica de ingresos y costos en millones de COP">
                    <svg viewBox="0 0 320 100" preserveAspectRatio="none" className="lp-product__chart-svg">
                      <line x1="0" y1="25" x2="320" y2="25" className="lp-product__chart-grid" />
                      <line x1="0" y1="52" x2="320" y2="52" className="lp-product__chart-grid" />
                      <line x1="0" y1="79" x2="320" y2="79" className="lp-product__chart-grid" />
                      <polygon
                        className="lp-product__chart-area"
                        points="0,80 40,72 80,74 120,60 160,62 200,46 240,50 280,32 320,24 320,100 0,100"
                      />
                      <polyline
                        className="lp-product__chart-line is-income"
                        points="0,80 40,72 80,74 120,60 160,62 200,46 240,50 280,32 320,24"
                      />
                      <polyline
                        className="lp-product__chart-line is-cost"
                        points="0,86 40,84 80,80 120,82 160,76 200,76 240,72 280,70 320,66"
                      />
                      <circle className="lp-product__chart-dot" cx="320" cy="24" r="3" />
                    </svg>
                  </div>
                  <div className="lp-product__legend">
                    <span className="is-income"><i className="lp-product__legend-dot" /> Ingresos</span>
                    <span className="is-cost"><i className="lp-product__legend-dot" /> Costos</span>
                  </div>
                </div>

                <div className="lp-product__panel lp-product__alerts">
                  <div className="lp-product__alerts-head">
                    Alertas críticas
                    <span className="lp-product__alerts-count">3 activas</span>
                  </div>
                  <div className="lp-product__alert">
                    <span className="lp-product__alert-bar is-critical" />
                    <div>
                      <div className="lp-product__alert-title">SOAT vencido</div>
                      <div className="lp-product__alert-context">Placa UVP-123 · hace 2h</div>
                    </div>
                  </div>
                  <div className="lp-product__alert">
                    <span className="lp-product__alert-bar" />
                    <div>
                      <div className="lp-product__alert-title">Mantenimiento preventivo</div>
                      <div className="lp-product__alert-context">Placa WZA-456 · hoy</div>
                    </div>
                  </div>
                  <div className="lp-product__alert">
                    <span className="lp-product__alert-bar" />
                    <div>
                      <div className="lp-product__alert-title">Licencia por vencer</div>
                      <div className="lp-product__alert-context">Juan Pérez · 30 días</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lp-product__table">
                <div className="lp-product__table-head">
                  <span>Estado de la flota</span>
                  <a href="#documental">Ver detalle</a>
                </div>
                <div className="lp-product__table-cols">
                  <span>Placa</span>
                  <span>Tipo</span>
                  <span>Conductor</span>
                  <span>Estado legal</span>
                  <span>Kilometraje</span>
                </div>
                {VEHICLES.map((vehicle) => (
                  <div key={vehicle.placa} className="lp-product__table-row">
                    <span>{vehicle.placa}</span>
                    <span>{vehicle.tipo}</span>
                    <span>{vehicle.conductor}</span>
                    <span>
                      <span className={`lp-product__pill lp-product__pill--${vehicle.status}`}>
                        <span className="lp-product__pill-dot" />
                        {vehicle.label}
                      </span>
                    </span>
                    <span>184.320 km</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <p className="lp-product__disclosure">
          Vista de referencia con datos de ejemplo. La información real se carga desde tu operación.
        </p>
      </section>

      {/* ================= BEFORE / AFTER ================= */}
      <section className="lp-section">
        <div className="lp-container lp-ba">
          <div className="lp-ba__intro">
            <span className="lp-eyebrow">Sin iQFleet</span>
            <h2 className="lp-heading">De carpetas dispersas a una gestión centralizada</h2>
            <p className="lp-description">
              La operación tradicional depende de información repartida en múltiples fuentes, lo que
              ralentiza las decisiones y compromete el cumplimiento legal.
            </p>
          </div>

          <div className="lp-ba__cards">
            <div className="lp-ba__before">
              <span className="lp-ba__label">Antes · Información dispersa</span>
              <div className="lp-ba__sources">
                <div className="lp-ba__source">
                  <Icon name="folder" />
                  <span>Carpetas físicas</span>
                </div>
                <div className="lp-ba__source">
                  <Icon name="description" />
                  <span>Hojas de cálculo</span>
                </div>
                <div className="lp-ba__source">
                  <Icon name="folder_open" />
                  <span>Archivos en equipos</span>
                </div>
              </div>
            </div>

            <div className="lp-ba__after">
              <div className="lp-ba__after-title">
                <Icon name="layers" />
                Una sola plataforma
              </div>
              <div className="lp-ba__divider" />
              <p className="lp-ba__after-desc">
                Vehículos, conductores, documentos y finanzas consolidados en un único sistema
                accesible, con alertas automáticas y trazabilidad de cada operación.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= MÓDULOS ================= */}
      <section className="lp-section" id="modulos">
        <div className="lp-container">
          <div className="lp-modules__intro">
            <span className="lp-eyebrow">Funcionalidades</span>
            <h2 className="lp-heading">Todo lo que tu flota necesita en un solo lugar</h2>
            <p className="lp-description">
              Cinco módulos integrados que cubren desde la operación diaria hasta el control
              financiero y documental de la empresa de transporte.
            </p>
          </div>

          <div className="lp-modules__grid">
            {MODULES.map((module) => (
              <article key={module.title} className="lp-module">
                <span className="lp-module__symbol">
                  <Icon name={module.icon} />
                </span>
                <h3 className="lp-module__title">{module.title}</h3>
                <p className="lp-module__desc">{module.desc}</p>
                <span className="lp-module__meta">{module.meta}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FLOTA Y VEHÍCULOS ================= */}
      <section className="lp-section">
        <div className="lp-container lp-feature">
          <div className="lp-feature__visual">
            <img
              className="lp-feature__image"
              src="/src/assets/flota-autobuses.png.png"
              alt="Flota de buses de transporte público"
            />
            <div className="lp-feature__record">
              <div className="lp-feature__record-head">
                <div>
                  <div className="lp-feature__record-title">Marcopolo Torino G7</div>
                  <div className="lp-feature__record-sub">Ficha de vehículo · datos de ejemplo</div>
                </div>
                <span className="lp-badge lp-badge--ok">
                  <span className="lp-badge__dot" /> Operativo
                </span>
              </div>
              <div className="lp-feature__divider" />
              <div className="lp-feature__meta">
                <div className="lp-feature__attr">
                  <span className="lp-feature__attr-label">Placa</span>
                  <span className="lp-feature__attr-value">WZA-456</span>
                </div>
                <div className="lp-feature__attr">
                  <span className="lp-feature__attr-label">Año</span>
                  <span className="lp-feature__attr-value">2021</span>
                </div>
                <div className="lp-feature__attr">
                  <span className="lp-feature__attr-label">Kilometraje</span>
                  <span className="lp-feature__attr-value">96.210 km</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lp-feature__message">
            <div className="lp-feature__intro">
              <span className="lp-eyebrow">Flota y vehículos</span>
              <h2 className="lp-heading">Cada unidad con su historial completo</h2>
              <p className="lp-description">
                Registra y consulta la información técnica y legal de cada vehículo, con su estado
                operativo y los vencimientos siempre a la vista.
              </p>
            </div>
            <div className="lp-feature__capabilities">
              <div className="lp-capability">
                <Icon name="check" />
                Identificación por placa, marca, modelo y tipo de vehículo.
              </div>
              <div className="lp-capability">
                <Icon name="check" />
                Estado operativo: disponible, en mantenimiento o fuera de servicio.
              </div>
              <div className="lp-capability">
                <Icon name="check" />
                Vencimientos de SOAT y revisión técnico-mecánica por unidad.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CONDUCTORES ================= */}
      <section className="lp-section">
        <div className="lp-container lp-feature">
          <div className="lp-feature__message">
            <div className="lp-feature__intro">
              <span className="lp-eyebrow">Conductores</span>
              <h2 className="lp-heading">Gestión del personal operativo</h2>
              <p className="lp-description">
                Administra la información de cada conductor, su licencia, el móvil asignado y su
                desempeño, todo vinculado a la operación de la flota.
              </p>
            </div>
            <div className="lp-feature__capabilities">
              <div className="lp-capability">
                <Icon name="check" />
                Datos personales, cédula y categoría de licencia de conducción.
              </div>
              <div className="lp-capability">
                <Icon name="check" />
                Control de fatiga y vencimiento de licencias.
              </div>
            </div>
          </div>

          <div className="lp-driver">
            <div className="lp-driver__head">
              <span>Ficha del conductor</span>
              <span className="lp-badge lp-badge--warn">
                <span className="lp-badge__dot" /> Licencia por vencer
              </span>
            </div>
            <div className="lp-driver__profile">
              <span className="lp-driver__avatar">JP</span>
              <div>
                <div className="lp-driver__name">Juan Pérez</div>
                <div className="lp-driver__id">CC 12.345.678</div>
              </div>
            </div>
            <div className="lp-feature__divider" />
            <div className="lp-driver__grid">
              <div className="lp-feature__attr">
                <span className="lp-feature__attr-label">Categoría</span>
                <span className="lp-feature__attr-value">C3</span>
              </div>
              <div className="lp-feature__attr">
                <span className="lp-feature__attr-label">Móvil asignado</span>
                <span className="lp-feature__attr-value">UVP-123</span>
              </div>
              <div className="lp-feature__attr">
                <span className="lp-feature__attr-label">Turno</span>
                <span className="lp-feature__attr-value">Mañana</span>
              </div>
              <div className="lp-feature__attr">
                <span className="lp-feature__attr-label">Puntaje</span>
                <span className="lp-feature__attr-value">96.4 / 100</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CONTROL DOCUMENTAL (DARK) ================= */}
      <section className="lp-section lp-section--dark lp-docs" id="documental">
        <div className="lp-container">
          <div className="lp-docs__intro">
            <div>
              <span className="lp-eyebrow">Control documental</span>
              <h2 className="lp-heading">Nunca más un documento vencido</h2>
            </div>
            <p className="lp-description">
              El sistema clasifica automáticamente cada documento con un semáforo de vencimiento y
              alerta antes de que se convierta en un problema legal.
            </p>
          </div>

          <div className="lp-docs__grid">
            <div className="lp-docs__list">
              <div className="lp-docs__list-head">
                Registro documental
                <span>Sincronizado con RUNT / CDA</span>
              </div>
              <div className="lp-docs__cols">
                <span>Documento</span>
                <span>Vencimiento</span>
                <span>Estado</span>
              </div>
              {DOCUMENTS.map((document) => (
                <div key={document.doc} className="lp-docs__row">
                  <div className="lp-docs__row-identity">
                    <span className="lp-docs__row-title">{document.doc}</span>
                    <span className="lp-docs__row-owner">{document.owner}</span>
                  </div>
                  <span className="lp-docs__row-date">{document.date}</span>
                  <span className="lp-docs__row-status">
                    <span className={`lp-docs__pill lp-docs__pill--${document.status}`}>
                      <span className="lp-docs__pill-dot" />
                      {document.label}
                    </span>
                  </span>
                </div>
              ))}
            </div>

            <div className="lp-docs__legend">
              <Icon name="construction" />
              <div className="lp-docs__legend-title">Interpretación del semáforo</div>
              <div className="lp-docs__legend-item is-ok">
                <span className="lp-docs__legend-label">Vigente</span>
                <span className="lp-docs__legend-desc">Más de 30 días de holgura.</span>
              </div>
              <div className="lp-docs__legend-item is-warn">
                <span className="lp-docs__legend-label">Por vencer</span>
                <span className="lp-docs__legend-desc">Entre 8 y 30 días restantes.</span>
              </div>
              <div className="lp-docs__legend-item is-bad">
                <span className="lp-docs__legend-label">Vencido</span>
                <span className="lp-docs__legend-desc">Menos de 7 días o ya expirado.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CONTROL FINANCIERO ================= */}
      <section className="lp-section">
        <div className="lp-container lp-finance">
          <div className="lp-finance__summary">
            <div className="lp-finance__summary-head">
              <span className="lp-finance__summary-title">Balance del período</span>
              <span className="lp-finance__summary-period">Octubre 2024 · datos de ejemplo</span>
            </div>
            <div className="lp-finance__bars">
              <div className="lp-finance__measure">
                <div className="lp-finance__measure-label">
                  <span>Ingresos brutos</span>
                  <strong>$58.2M</strong>
                </div>
                <div className="lp-finance__bar" style={{ width: '100%' }} />
              </div>
              <div className="lp-finance__measure">
                <div className="lp-finance__measure-label">
                  <span>Costos operativos</span>
                  <strong>$39.7M</strong>
                </div>
                <div className="lp-finance__bar lp-finance__bar--cost" style={{ width: '75%' }} />
              </div>
            </div>
            <div className="lp-finance__divider" />
            <div className="lp-finance__key">
              <div className="lp-finance__key-item">
                <span className="lp-finance__key-label">Margen neto</span>
                <span className="lp-finance__key-value">31.7%</span>
                <span className="lp-finance__key-unit">Rentabilidad operativa</span>
              </div>
              <div className="lp-finance__key-item">
                <span className="lp-finance__key-label">Costo por km</span>
                <span className="lp-finance__key-value">$4.250</span>
                <span className="lp-finance__key-unit">COP por kilómetro</span>
              </div>
            </div>
          </div>

          <div className="lp-feature__message">
            <div className="lp-feature__intro">
              <span className="lp-eyebrow">Control financiero</span>
              <h2 className="lp-heading">Conoce la rentabilidad real de tu flota</h2>
              <p className="lp-description">
                Consolida ingresos y costos por vehículo para saber con exactitud cuánto gana cada
                unidad y dónde optimizar el gasto.
              </p>
            </div>
            <div className="lp-feature__capabilities">
              <div className="lp-capability">
                <Icon name="check" />
                Registro de gastos e ingresos por vehículo y conductor.
              </div>
              <div className="lp-capability">
                <Icon name="check" />
                Cálculo de margen neto y costo por kilómetro en COP.
              </div>
              <div className="lp-capability">
                <Icon name="check" />
                Soporte de facturación electrónica y comprobantes.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= WORKFLOW ================= */}
      <section className="lp-section lp-workflow">
        <div className="lp-container">
          <div className="lp-workflow__intro">
            <div className="lp-feature__intro">
              <span className="lp-eyebrow">Cómo funciona</span>
              <h2 className="lp-heading">Una rutina de gestión más clara</h2>
            </div>
            <div className="lp-workflow__roles">
              <span className="lp-workflow__roles-label">
                Pensado para los roles que sostienen la operación diaria:
              </span>
              <div className="lp-workflow__role-tags">
                <span className="lp-workflow__tag">
                  <span className="lp-workflow__tag-dot" /> Administrador
                </span>
                <span className="lp-workflow__tag">
                  <span className="lp-workflow__tag-dot" /> Propietario
                </span>
              </div>
            </div>
          </div>

          <div className="lp-workflow__steps">
            {WORKFLOW.map((step) => (
              <article key={step.step} className="lp-step">
                <div className="lp-step__head">
                  <span className="lp-step__label">{step.step}</span>
                  <Icon name={step.icon} />
                </div>
                <h3 className="lp-step__title">{step.title}</h3>
                <p className="lp-step__desc">{step.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="lp-section" id="preguntas">
        <div className="lp-container lp-faq">
          <div className="lp-faq__intro">
            <span className="lp-eyebrow">Preguntas frecuentes</span>
            <h2 className="lp-heading">Resolvemos tus dudas</h2>
            <p className="lp-description">
              Lo esencial sobre el alcance y funcionamiento de la plataforma.
            </p>
          </div>

          <div className="lp-faq__list">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={faq.q} className={`lp-faq__item ${isOpen ? 'is-open' : ''}`}>
                  <button type="button" className="lp-faq__question" onClick={() => toggleFaq(index)}>
                    <span>{faq.q}</span>
                    <Icon name={isOpen ? 'expand_less' : 'expand_more'} />
                  </button>
                  {isOpen && <p className="lp-faq__answer">{faq.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= DEMO CTA ================= */}
      <section className="lp-demo" id="demostracion">
        <div className="lp-container">
          <div className="lp-demo__invitation">
            <span className="lp-demo__eyebrow">Solicita una demostración</span>
            <h2 className="lp-demo__heading">Recorre la plataforma con tus propios datos</h2>
            <p className="lp-demo__description">
              Agenda una demostración guiada y descubre cómo iQFleet se adapta a la operación de tu
              empresa de transporte.
            </p>
            <div className="lp-demo__scope">
              <span className="lp-demo__item">
                <Icon name="check" /> Recorrido por los cinco módulos
              </span>
              <span className="lp-demo__item">
                <Icon name="check" /> Carga de un caso de uso real
              </span>
              <span className="lp-demo__item">
                <Icon name="check" /> Resolución de dudas con el equipo
              </span>
            </div>
          </div>

          <form className="lp-demo__form" onSubmit={(e) => e.preventDefault()}>
            <div className="lp-demo__form-head">
              <span className="lp-demo__form-title">Cuéntanos de tu operación</span>
              <span className="lp-demo__form-sub">Te contactamos en menos de 24 horas.</span>
            </div>

            <div className="lp-field">
              <label className="lp-field__label" htmlFor="demo-nombre">
                Nombre completo
              </label>
              <input id="demo-nombre" className="lp-field__input" type="text" placeholder="Ej. Carlos Morales" />
            </div>

            <div className="lp-field">
              <label className="lp-field__label" htmlFor="demo-correo">
                Correo corporativo
              </label>
              <input id="demo-correo" className="lp-field__input" type="email" placeholder="nombre@empresa.com" />
            </div>

            <div className="lp-field__row">
              <div className="lp-field">
                <label className="lp-field__label" htmlFor="demo-empresa">
                  Empresa
                </label>
                <input id="demo-empresa" className="lp-field__input" type="text" placeholder="Transportes S.A." />
              </div>
              <div className="lp-field">
                <label className="lp-field__label" htmlFor="demo-ciudad">
                  Ciudad
                </label>
                <select id="demo-ciudad" className="lp-field__select" defaultValue="Valledupar">
                  <option>Valledupar</option>
                  <option>Bogotá D.C.</option>
                  <option>Barranquilla</option>
                  <option>Otra</option>
                </select>
              </div>
            </div>

            <button type="submit" className="lp-demo__submit">
              <span>Solicitar demostración</span>
              <Icon name="arrow_forward" />
            </button>
            <p className="lp-demo__contact">
              Uso académico · proyecto de la Universidad Popular del Cesar.
            </p>
          </form>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="lp-footer" id="contacto">
        <div className="lp-footer__content">
          <div className="lp-footer__brand">
            <span className="lp-brand">
              <span className="lp-brand__symbol">
                <Icon name="alt_route" />
              </span>
              <span className="lp-brand__word">iQFleet</span>
            </span>
            <span className="lp-footer__tagline">
              Plataforma inteligente de gestión de flotas para transporte público.
            </span>
          </div>

          <nav className="lp-footer__nav">
            <a href="#producto">Producto</a>
            <a href="#modulos">Funcionalidades</a>
            <a href="#documental">Control documental</a>
            <a href="#demostracion">Solicitar demo</a>
          </nav>
        </div>

        <div className="lp-footer__divider" />

        <div className="lp-footer__note">
          <span>© 2026 iQFleet. Todos los derechos reservados.</span>
          <span>Universidad Popular del Cesar · Programación Web · Valledupar, Cesar</span>
        </div>
      </footer>
    </div>
  );
}
