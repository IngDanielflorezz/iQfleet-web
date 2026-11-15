namespace IQFleet.Api.Domain;

/// <summary>Ingreso o egreso financiero (tabla iqfleet.movimientos).</summary>
public class Movimiento
{
    public Guid Id { get; set; }
    public string Tipo { get; set; } = MovimientoTipos.Egreso;
    public string Concepto { get; set; } = string.Empty;
    /// <summary>Opcional: gastos generales (p. ej. nómina) no se asocian a una placa.</summary>
    public string? Placa { get; set; }
    public Vehiculo? Vehiculo { get; set; }
    public string? Conductor { get; set; }
    public string? Factura { get; set; }
    public string MedioPago { get; set; } = MediosPago.Transferencia;
    public decimal Monto { get; set; }
    public int? Km { get; set; }
    public DateOnly Fecha { get; set; }
    public string? ComprobanteNombre { get; set; }
    public string? ComprobanteTipo { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public static class MovimientoTipos
{
    public const string Ingreso = "Ingreso";
    public const string Egreso = "Egreso";

    public static readonly string[] Todos = [Ingreso, Egreso];
}

public static class MediosPago
{
    public const string Transferencia = "Transferencia";
    public const string Efectivo = "Efectivo";
    public const string Tarjeta = "Tarjeta";
    public const string Credito = "Crédito";

    public static readonly string[] Todos = [Transferencia, Efectivo, Tarjeta, Credito];
}
