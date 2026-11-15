namespace IQFleet.Api.Domain;

/// <summary>Documento legal de un vehículo o conductor (tabla iqfleet.documentos).</summary>
public class Documento
{
    public Guid Id { get; set; }
    public string Tipo { get; set; } = DocumentoTipos.Soat;
    public string Numero { get; set; } = string.Empty;
    public string Entidad { get; set; } = string.Empty;
    public string? Placa { get; set; }
    public Vehiculo? Vehiculo { get; set; }
    public Guid? ConductorId { get; set; }
    public Conductor? ConductorRef { get; set; }
    public string? Conductor { get; set; }
    public DateOnly FechaExpedicion { get; set; }
    public DateOnly FechaVencimiento { get; set; }
    public string EstadoRunt { get; set; } = DocumentoEstadosRunt.Pendiente;
    public DateTime? RuntSincronizadoEn { get; set; }
    public string? ArchivoNombre { get; set; }
    public string? ArchivoTipo { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public static class DocumentoTipos
{
    public const string Soat = "SOAT";
    public const string Rtm = "RTM";
    public const string TarjetaOperacion = "Tarjeta de Operación";
    public const string PolizaRcc = "Póliza RCC";

    public static readonly string[] Todos = [Soat, Rtm, TarjetaOperacion, PolizaRcc];
}

public static class DocumentoEstadosRunt
{
    public const string Pendiente = "Pendiente";
    public const string Sincronizado = "Sincronizado";
    public const string Error = "Error de validación";

    public static readonly string[] Todos = [Pendiente, Sincronizado, Error];
}
