import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, saveSession, ROLES } from '../../services/authService';
import flotaHero from '../../assets/flota-autobuses.png.png';
import './Login.css';

const ROLE_HOME = {
  [ROLES.ADMINISTRADOR]: '/app/dashboard',
  [ROLES.CONDUCTOR]: '/app/conductor',
};

export default function Login() {
  const navigate = useNavigate();

  // Estados para capturar los datos y mostrar errores
  const [rol, setRol] = useState(ROLES.ADMINISTRADOR);
  const [email, setEmail] = useState('admin@iqfleet.com');
  const [password, setPassword] = useState('1234');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Función que valida credenciales y redirige según el rol
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await loginUser({ correo: email, password, rol });
      saveSession(user);
      navigate(ROLE_HOME[user.rol] ?? '/app/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-dark-app min-vh-100 d-flex align-items-center justify-content-center p-3 p-md-4">
      <div className="card login-split-card overflow-hidden w-100 max-w-6xl">
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

            <div className="position-relative z-2">
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
            </div>
          </div>

          <div className="col-lg-6 form-column p-4 p-sm-5 d-flex flex-column justify-content-center">
            <div className="mb-4">
              <h1 className="h3 fw-bold text-white m-0">Iniciar sesión</h1>
              <p className="small text-light-muted mt-1">Accede a tu cuenta para continuar</p>
            </div>

            {/* Aquí conectamos la función handleLogin al formulario */}
            <form className="d-flex flex-column gap-3" onSubmit={handleLogin}>

              {/* Alerta roja condicional en caso de error */}
              {error && (
                <div className="alert alert-danger py-2 fs-8 mb-0" role="alert">
                  <i className="fa-solid fa-triangle-exclamation me-2"></i> {error}
                </div>
              )}

              <div>
                <label className="form-label-dark">SELECCIONA TU ROL</label>
                <div className="row g-2">
                  <div className="col-6">
                    <button
                      type="button"
                      className={`btn-role-dark w-100 ${rol === ROLES.ADMINISTRADOR ? 'active' : ''}`}
                      onClick={() => setRol(ROLES.ADMINISTRADOR)}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <i className="fa-solid fa-user-tie text-warning fs-6"></i>
                        <span>Administrador</span>
                      </div>
                    </button>
                  </div>
                  <div className="col-6">
                    <button
                      type="button"
                      className={`btn-role-dark w-100 ${rol === ROLES.CONDUCTOR ? 'active' : ''}`}
                      onClick={() => setRol(ROLES.CONDUCTOR)}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <i className="fa-solid fa-steering-wheel text-secondary fs-6"></i>
                        <span>Conductor</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="email" className="form-label-dark">CORREO CORPORATIVO</label>
                <div className="input-dark-group">
                  <i className="fa-regular fa-envelope input-dark-icon"></i>
                  {/* Conectamos el input al estado de email */}
                  <input
                    type="email"
                    id="email"
                    className="form-control form-control-dark"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="admin@iqfleet.com"
                  />
                </div>
              </div>

              <div>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label htmlFor="password" className="form-label-dark m-0">CONTRASEÑA</label>
                  <a href="#" className="link-orange small">¿Olvidaste tu contraseña?</a>
                </div>
                <div className="input-dark-group">
                  <i className="fa-solid fa-lock input-dark-icon"></i>
                  {/* Conectamos el input al estado de password */}
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className="form-control form-control-dark"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="btn-toggle-password-dark"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    <i className={showPassword ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash'}></i>
                  </button>
                </div>
              </div>

              <div className="form-check pt-1">
                <input className="form-check-input check-dark" type="checkbox" id="rememberMe" defaultChecked />
                <label className="form-check-label small text-light-muted" htmlFor="rememberMe">Mantener sesión</label>
              </div>

              <button type="submit" className="btn btn-orange-cta w-100 mt-2" disabled={loading}>
                <span>{loading ? 'INGRESANDO...' : 'INGRESAR A IQFLEET'}</span>
                {!loading && <i className="fa-solid fa-arrow-right"></i>}
              </button>

              <div className="d-flex align-items-center my-2 text-light-muted small">
                <hr className="flex-grow-1 border-secondary m-0" />
                <span className="px-3">o continúa con</span>
                <hr className="flex-grow-1 border-secondary m-0" />
              </div>

              <button type="button" className="btn btn-outline-dark-custom w-100 d-flex align-items-center justify-content-center gap-2">
                <i className="fa-brands fa-google text-danger"></i>
                <span>Continuar con Google</span>
              </button>
            </form>

            <p className="text-center small text-light-muted mt-4 mb-0">
              ¿No tienes cuenta? <Link to="/register" className="link-orange">Registrar</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
