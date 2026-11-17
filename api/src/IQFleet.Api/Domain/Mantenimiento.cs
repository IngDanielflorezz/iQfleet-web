namespace IQFleet.Api.Domain;

/// <summary>
/// Plan de mantenimiento preventivo de un vehículo (tabla iqfleet.planes_mantenimiento):
/// una tarea que se repite cada cierto kilometraje, cada cierto número de días o ambos
/// (lo que ocurra primero). Guarda el kilometraje y la fecha de la última vez que se hizo.
/// </summary>
public class PlanMantenimiento
{
    public Guid Id { get; set; }
    public string Placa { get; set; } = string.Empty;
    public Vehiculo? Vehiculo { get; set; }
    public string Tarea { get; set; } = string.Empty;
    public int? CadaKm { get; set; }
    public int? CadaDias { get; set; }
    public int? UltimoKm { get; set; }
    public DateOnly? UltimaFecha { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Orden de mantenimiento (tabla iqfleet.ordenes_mantenimiento): historial de lo que se le
/// hace a cada vehículo. Abrirla pone el vehículo en Mantenimiento; cerrarla lo devuelve a
/// Operativo, actualiza el plan y, si tiene costo, registra el egreso en Finanzas.
/// </summary>
public class OrdenMantenimiento
{
    public Guid Id { get; set; }
    public string Placa { get; set; } = string.Empty;
    public Vehiculo? Vehiculo { get; set; }
    public string Tipo { get; set; } = TiposMantenimiento.Preventivo;
    public Guid? PlanId { get; set; }
    public PlanMantenimiento? Plan { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public string Estado { get; set; } = EstadosOrden.Abierta;
    public DateOnly FechaApertura { get; set; }
    public DateOnly? FechaCierre { get; set; }
    public int KmApertura { get; set; }
    public int? KmCierre { get; set; }
    public decimal? Costo { get; set; }
    public string? Taller { get; set; }
    public string? Observaciones { get; set; }
    /// <summary>Egreso creado en Finanzas al cerrar la orden (null si no tuvo costo).</summary>
    public Guid? MovimientoId { get; set; }
    public Movimiento? Movimiento { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public static class TiposMantenimiento
{
    public const string Preventivo = "Preventivo";
    public const string Correctivo = "Correctivo";

    public static readonly string[] Todos = [Preventivo, Correctivo];

    /// <summary>Concepto del egreso en Finanzas (los mismos de finanzaService.js).</summary>
    public static string ConceptoFinanzas(string tipo) => $"Mantenimiento {tipo}";
}

public static class EstadosOrden
{
    public const string Abierta = "Abierta";
    public const string Cerrada = "Cerrada";

    public static readonly string[] Todos = [Abierta, Cerrada];
}
