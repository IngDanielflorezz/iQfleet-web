namespace IQFleet.Api.Domain;

/// <summary>Unidad del parque automotor (tabla iqfleet.vehiculos). La placa es la llave primaria.</summary>
public class Vehiculo
{
    public string Placa { get; set; } = string.Empty;
    public string Ciudad { get; set; } = string.Empty;
    public string Marca { get; set; } = string.Empty;
    public string Modelo { get; set; } = string.Empty;
    public string Tipo { get; set; } = "Bus";
    public int Anio { get; set; }
    public int Kilometraje { get; set; }
    public string Estado { get; set; } = VehiculoEstados.Operativo;
    public DateOnly SoatVence { get; set; }
    public DateOnly RtmVence { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Guid? ConductorId { get; set; }
    public Conductor? Conductor { get; set; }
}

public static class VehiculoEstados
{
    public const string Operativo = "Operativo";
    public const string Mantenimiento = "Mantenimiento";
    public const string FueraDeServicio = "Fuera de servicio";

    public static readonly string[] Todos = [Operativo, Mantenimiento, FueraDeServicio];
}
