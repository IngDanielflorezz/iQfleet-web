const FILTROS = [
  { value: 'all', label: 'Todos' },
  { value: 'critico', label: 'Críticos' },
  { value: 'preventivo', label: 'Por vencer' },
  { value: 'SOAT', label: 'SOAT' },
  { value: 'RTM', label: 'Revisión Técnico-Mecánica' },
  { value: 'Tarjeta de Operación', label: 'Tarjetas de Operación' },
  { value: 'Póliza RCC', label: 'Pólizas RCC' },
];

export default function DocumentosFilterPills({
  conteos,
  filtro,
  onFiltroChange,
  busqueda,
  onBusquedaChange,
  onLimpiar,
}) {
  return (
    <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-2 mb-3">
      <div className="d-flex flex-wrap align-items-center gap-2 no-print">
        {FILTROS.map((opcion) => {
          const activo = filtro === opcion.value;
          const total = conteos[opcion.value] ?? 0;
          return (
            <button
              key={opcion.value}
              type="button"
              className={`btn btn-sm filter-doc-btn ${activo ? 'btn-orange-cta active' : 'btn-outline-dark-custom'}`}
              onClick={() => onFiltroChange(opcion.value)}
            >
              {opcion.label} ({total})
            </button>
          );
        })}
      </div>

      <div className="ms-lg-auto d-flex align-items-center gap-2">
        <div className="input-dark-group no-print">
          <span className="material-symbols-outlined input-dark-icon">search</span>
          <input
            type="search"
            className="form-control form-control-dark"
            placeholder="Buscar número, entidad o placa..."
            value={busqueda}
            onChange={(event) => onBusquedaChange(event.target.value)}
            style={{ minWidth: '240px' }}
          />
        </div>
        <button type="button" className="btn btn-link text-light-muted p-0 text-decoration-none fs-8 no-print" onClick={onLimpiar}>
          Limpiar filtros
        </button>
      </div>
    </div>
  );
}
