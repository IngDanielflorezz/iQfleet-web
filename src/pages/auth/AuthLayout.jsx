import { Outlet, useLocation } from 'react-router-dom';
import flotaHero from '../../assets/flota-autobuses.png.png';
import './Login.css';
import './AuthLayout.css';

function HeroLoginCopy() {
  return (
    <>
      <div className="d-flex align-items-center gap-2 mb-3">
        <div className="icon-shield-check"><i className="fa-solid fa-check"></i></div>
        <div>
          <h6 className="fw-bold text-white mb-0">Seguro. Confiable. Siempre conectado.</h6>
          <p className="small text-light-muted m-0">Gestiona tu flota, conductores y operaciones desde una sola plataforma.</p>
        </div>
      </div>

      <div className="d-flex gap-4 pt-2 border-top border-secondary-subtle small text-light-muted">
        <span><i className="fa-solid fa-chart-line text-warning me-1"></i> Monitoreo en tiempo real</span>
        <span><i className="fa-solid fa-shield-halved text-warning me-1"></i> Control y seguridad</span>
        <span><i className="fa-solid fa-file-contract text-warning me-1"></i> Reportes y cumplimiento</span>
      </div>
    </>
  );
}

function HeroRegisterCopy() {
  return (
    <>
      <h6 className="fw-bold text-white mb-1">Seguro. Confiable. Siempre conectado.</h6>
      <p className="small text-light-muted m-0">
        Gestiona tu flota, conductores y operaciones desde una sola plataforma.
      </p>
    </>
  );
}

const HERO_COPY = {
  login: HeroLoginCopy,
  register: HeroRegisterCopy,
};

export default function AuthLayout() {
  const { pathname } = useLocation();
  const isRegister = pathname.replace(/\/+$/, '') === '/register';
  const mode = isRegister ? 'register' : 'login';
  const HeroCopy = HERO_COPY[mode];

  return (
    <div className="bg-dark-app min-vh-100 d-flex align-items-center justify-content-center p-3 p-md-4">
      <div className={`card login-split-card max-w-6xl overflow-hidden w-100 auth-card auth-card--${mode}`}>
        <div className="row g-0">
          <div className="col-lg-6 hero-column d-none d-lg-flex flex-column justify-content-between p-5 position-relative">
            <div className="hero-overlay"></div>
            <img src={flotaHero} alt="Flota de Transporte iQFleet" className="hero-bg-img" />

            <div className="d-flex align-items-center gap-3 position-relative z-2">
              <div className="brand-logo-sq">iQ</div>
              <div>
                <h2 className="h4 fw-bold text-white m-0">iQFleet</h2>
                <p className="small text-light-muted m-0">Plataforma Inteligente de Transporte Público</p>
              </div>
            </div>

            <div className="position-relative z-2 hero-copy" key={mode}>
              <HeroCopy />
            </div>
          </div>

          <div className="col-lg-6 form-column p-4 p-sm-5 d-flex flex-column justify-content-center">
            <div key={pathname} className="auth-form-inner">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
