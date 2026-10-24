namespace IQFleet.Api.Domain;

/// <summary>Personal operativo de la empresa (tabla iqfleet.conductores).</summary>
public class Conductor
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Cedula { get; set; } = string.Empty;
    public string CategoriaLicencia { get; set; } = "B2";
    public DateOnly LicenciaVence { get; set; }
    public string? Telefono { get; set; }
    public string Estado { get; set; } = ConductorEstados.Activo;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public List<Vehiculo> Vehiculos { get; set; } = [];
}

public static class ConductorEstados
{
    public const string Activo = "Activo";
    public const string EnRelevo = "En relevo";
    public const string Inactivo = "Inactivo";

    public static readonly string[] Todos = [Activo, EnRelevo, Inactivo];
}

public static class LicenciaCategorias
{
    public static readonly string[] Todas = ["A1", "A2", "B1", "B2", "B3", "C1", "C2", "C3"];
}
