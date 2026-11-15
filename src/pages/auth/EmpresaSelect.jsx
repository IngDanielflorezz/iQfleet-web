import './EmpresaSelect.css';

export default function EmpresaSelect({ empresas, value, onChange, error, name = 'empresa' }) {
  const sinEmpresas = empresas.length === 0;

  return (
    <div>
      <label htmlFor={name} className="form-label-dark">EMPRESA / ORGANIZACIÓN</label>
      <div className="empresa-select-group">
        <i className="fa-regular fa-building input-dark-icon"></i>
        <select
          id={name}
          name={name}
          className={`empresa-select ${error ? 'empresa-select-error' : ''}`}
          value={value}
          onChange={onChange}
          disabled={sinEmpresas}
        >
          <option value="">{sinEmpresas ? 'Sin empresas disponibles' : 'Selecciona tu empresa'}</option>
          {empresas.map((empresa) => (
            <option key={empresa} value={empresa}>
              {empresa}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined empresa-select-caret">expand_more</span>
      </div>

      {sinEmpresas && (
        <span className="empresa-select-hint">
          Aún no hay empresas registradas. Pide a tu empresa que cree su cuenta de administrador.
        </span>
      )}
      {error && !sinEmpresas && <span className="empresa-select-hint">{error}</span>}
    </div>
  );
}
