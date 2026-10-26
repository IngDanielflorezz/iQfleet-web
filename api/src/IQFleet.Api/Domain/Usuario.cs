namespace IQFleet.Api.Domain;

/// <summary>Cuenta de acceso (tabla iqfleet.usuarios). Cada ADMINISTRADOR representa una empresa contratante.</summary>
public class Usuario
{
    public Guid Id { get; set; }
    public string Nombres { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string Empresa { get; set; } = string.Empty;
    public string? Licencia { get; set; }
    public string Rol { get; set; } = UsuarioRoles.Conductor;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    /// <summary>Ficha operativa del conductor (solo para rol CONDUCTOR).</summary>
    public Guid? ConductorId { get; set; }
    public Conductor? Conductor { get; set; }
}

public static class UsuarioRoles
{
    public const string Administrador = "ADMINISTRADOR";
    public const string Conductor = "CONDUCTOR";

    public static readonly string[] Todos = [Administrador, Conductor];
}
