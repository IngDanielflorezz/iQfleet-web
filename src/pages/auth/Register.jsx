import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getEmpresasContratantes, registerUser, ROLES } from '../../services/authService';
import EmpresaSelect from './EmpresaSelect';
import './Login.css';
import './Register.css';

const initialForm = {
  nombres: '',
  apellidos: '',
  correo: '',
  telefono: '',
  empresa: '',
  licencia: '',
  password: '',
  confirmPassword: '',
  terminos: false,
};

function Field({
  label,
  name,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
  icon,
  full,
}) {
  return (
    <div className={full ? 'reg-col-full' : ''}>
      <label htmlFor={name} className="form-label-dark">{label}</label>
      <div className="input-dark-group">
        {icon && <i className={`${icon} input-dark-icon`}></i>}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`form-control form-control-dark ${error ? 'reg-input-error' : ''}`}
        />
      </div>
      {error && <span className="reg-field-error">{error}</span>}
    </div>
  );
}

function PasswordField({ label, name, value, onChange, error, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={name} className="form-label-dark">{label}</label>
      <div className="input-dark-group">
        <i className="fa-solid fa-lock input-dark-icon"></i>
        <input
          id={name}
          name={name}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`form-control form-control-dark ${error ? 'reg-input-error' : ''}`}
        />
        <button
          type="button"
          className="btn-toggle-password-dark"
          onClick={() => setShow((prev) => !prev)}
          aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          <i className={show ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash'}></i>
        </button>
      </div>
      {error && <span className="reg-field-error">{error}</span>}
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [rol, setRol] = useState(ROLES.ADMINISTRADOR);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const empresasContratantes = getEmpresasContratantes();

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setServerError('');
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.nombres.trim()) nextErrors.nombres = 'Ingresa tus nombres';
    if (!form.apellidos.trim()) nextErrors.apellidos = 'Ingresa tus apellidos';

    if (!form.correo.trim()) nextErrors.correo = 'Ingresa tu correo';
    else if (!/^\S+@\S+\.\S+$/.test(form.correo)) nextErrors.correo = 'Correo no válido';

    if (!form.telefono.trim()) nextErrors.telefono = 'Ingresa tu teléfono';
    else if (!/^[+\d\s-]{7,15}$/.test(form.telefono)) nextErrors.telefono = 'Teléfono no válido';

    if (!form.empresa.trim())
      nextErrors.empresa =
        rol === ROLES.CONDUCTOR ? 'Selecciona tu empresa' : 'Ingresa la empresa u organización';
    if (rol === ROLES.CONDUCTOR && !form.licencia.trim())
      nextErrors.licencia = 'Ingresa tu número de licencia';

    if (form.password.length < 8) nextErrors.password = 'Mínimo 8 caracteres';
    else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))
      nextErrors.password = 'Debe incluir letras y números';

    if (form.confirmPassword !== form.password)
      nextErrors.confirmPassword = 'Las contraseñas no coinciden';

    if (!form.terminos) nextErrors.terminos = 'Debes aceptar los términos';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError('');
    if (!validate()) return;

    const datos = {
      nombres: form.nombres,
      apellidos: form.apellidos,
      correo: form.correo,
      telefono: form.telefono,
      empresa: form.empresa,
      licencia: form.licencia,
      password: form.password,
    };
    setLoading(true);
    try {
      await registerUser({ ...datos, rol });
      setSuccess(true);
      setForm(initialForm);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-4">
        <h1 className="h3 fw-bold text-white m-0">Crear cuenta</h1>
        <p className="small text-light-muted mt-1 mb-0">Regístrate para comenzar en iQFleet</p>
      </div>

      <form className="d-flex flex-column gap-3" onSubmit={handleSubmit} noValidate>
        <div>
          <label className="form-label-dark">SELECCIONA TU ROL</label>
          <div className="row g-2">
            <div className="col-6">
              <button
                type="button"
                className={`btn-role-dark w-100 ${rol === ROLES.ADMINISTRADOR ? 'active' : ''}`}
                onClick={() => {
                  setRol(ROLES.ADMINISTRADOR);
                  setErrors({});
                  setForm((prev) => ({ ...prev, empresa: '' }));
                }}
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
                onClick={() => {
                  setRol(ROLES.CONDUCTOR);
                  setErrors({});
                  setForm((prev) => ({ ...prev, empresa: '' }));
                }}
              >
                <div className="d-flex align-items-center gap-2">
                  <i className="fa-solid fa-car text-secondary fs-6"></i>
                  <span>Conductor</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="reg-form-grid">
          <Field
            label="NOMBRES"
            name="nombres"
            value={form.nombres}
            onChange={handleChange}
            error={errors.nombres}
            placeholder="Ej: Juan Carlos"
            icon="fa-regular fa-user"
          />
          <Field
            label="APELLIDOS"
            name="apellidos"
            value={form.apellidos}
            onChange={handleChange}
            error={errors.apellidos}
            placeholder="Ej: Pérez Gómez"
            icon="fa-regular fa-user"
          />

          <Field
            full
            label="CORREO CORPORATIVO"
            name="correo"
            type="email"
            value={form.correo}
            onChange={handleChange}
            error={errors.correo}
            placeholder="Ej: juan@empresa.com"
            icon="fa-regular fa-envelope"
          />

          <Field
            label="TELÉFONO"
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
            error={errors.telefono}
            placeholder="Ej: +57 300 123 4567"
            icon="fa-solid fa-phone"
          />

          {rol === ROLES.ADMINISTRADOR ? (
            <Field
              label="EMPRESA / ORGANIZACIÓN"
              name="empresa"
              value={form.empresa}
              onChange={handleChange}
              error={errors.empresa}
              placeholder="Ej: Transportes del Valle S.A.S."
              icon="fa-regular fa-building"
            />
          ) : (
            <EmpresaSelect
              empresas={empresasContratantes}
              value={form.empresa}
              onChange={handleChange}
              error={errors.empresa}
            />
          )}

          {rol === ROLES.CONDUCTOR && (
            <Field
              label="N.º DE LICENCIA"
              name="licencia"
              value={form.licencia}
              onChange={handleChange}
              error={errors.licencia}
              placeholder="Ej: 20001234567"
              icon="fa-regular fa-id-card"
            />
          )}

          <PasswordField
            label="CONTRASEÑA"
            name="password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="Crea una contraseña segura"
          />
          <PasswordField
            label="CONFIRMAR CONTRASEÑA"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            placeholder="Confirma tu contraseña"
          />

          <div className="reg-col-full">
            <label className="reg-terms">
              <input
                type="checkbox"
                name="terminos"
                checked={form.terminos}
                onChange={handleChange}
              />
              <span>
                Acepto los <a href="#terminos">Términos y Condiciones</a> y la{' '}
                <a href="#privacidad">Política de Privacidad</a>
              </span>
            </label>
            {errors.terminos && <span className="reg-field-error">{errors.terminos}</span>}
          </div>

          {serverError && (
            <div className="reg-alert reg-alert-error reg-col-full">{serverError}</div>
          )}
          {success && (
            <div className="reg-alert reg-alert-ok reg-col-full">
              ¡Cuenta creada! Redirigiendo al inicio de sesión...
            </div>
          )}

          <button type="submit" className="btn btn-orange-cta reg-col-full" disabled={loading}>
            <span>{loading ? 'CREANDO...' : 'CREAR CUENTA'}</span>
            {!loading && <i className="fa-solid fa-arrow-right"></i>}
          </button>
        </div>
      </form>

      <p className="text-center small text-light-muted mt-4 mb-0">
        ¿Ya tienes cuenta? <Link to="/login" className="link-orange">Iniciar sesión</Link>
      </p>
    </>
  );
}
