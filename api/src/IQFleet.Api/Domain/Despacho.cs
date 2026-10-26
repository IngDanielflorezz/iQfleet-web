namespace IQFleet.Api.Domain;

/// <summary>Flete operativo asignado a un vehículo (tabla iqfleet.despachos).</summary>
public class Despacho
{
    public Guid Id { get; set; }
    public string Placa { get; set; } = string.Empty;
    public Vehiculo? Vehiculo { get; set; }
    public Guid? ConductorId { get; set; }
    public Conductor? ConductorRef { get; set; }
    /// <summary>Nombre del conductor tal como lo muestra el front (se conserva si se borra la ficha).</summary>
    public string Conductor { get; set; } = string.Empty;
    public string Origen { get; set; } = string.Empty;
    public string Destino { get; set; } = string.Empty;
    public DateTime FechaSalida { get; set; }
    public string Estado { get; set; } = DespachoEstados.Programado;
    public decimal ValorFlete { get; set; }
    public decimal CostoOperativo { get; set; }
    public string? Observaciones { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public static class DespachoEstados
{
    public const string Programado = "Programado";
    public const string EnRuta = "En ruta";
    public const string Completado = "Completado";
    public const string Cancelado = "Cancelado";

    public static readonly string[] Todos = [Programado, EnRuta, Completado, Cancelado];
}
