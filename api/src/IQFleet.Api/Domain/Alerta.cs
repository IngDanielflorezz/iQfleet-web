namespace IQFleet.Api.Domain;

/// <summary>Alerta operativa transversal: checklist, SOS, fatiga, mensajes y vencimientos (tabla iqfleet.alertas).</summary>
public class Alerta
{
    public Guid Id { get; set; }
    public string Tipo { get; set; } = AlertaTipos.Mensaje;
    public string Severidad { get; set; } = AlertaSeveridades.Info;
    public Guid? UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public string? Conductor { get; set; }
    public string Empresa { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public string? Detalle { get; set; }
    /// <summary>Última posición conocida (SOS).</summary>
    public double? Lat { get; set; }
    public double? Lng { get; set; }
    /// <summary>Clave de idempotencia: evita registrar dos veces la misma alerta.</summary>
    public string? Clave { get; set; }
    public bool Resuelta { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ResueltaEn { get; set; }
}

public static class AlertaTipos
{
    public const string Checklist = "checklist";
    public const string Sos = "sos";
    public const string Fatiga = "fatiga";
    public const string Mensaje = "mensaje";
    public const string Documento = "documento";
    public const string Mantenimiento = "mantenimiento";

    public static readonly string[] Todos = [Checklist, Sos, Fatiga, Mensaje, Documento, Mantenimiento];
}

public static class AlertaSeveridades
{
    public const string Info = "info";
    public const string Warning = "warning";
    public const string Danger = "danger";

    public static readonly string[] Todas = [Info, Warning, Danger];
}
