namespace IQFleet.Api.Domain;

// Registros del panel del conductor: una fila por (usuario, fecha). Los detalles
// variables (respuestas, pausas, eventos, puntos GPS) se guardan como jsonb.

/// <summary>Checklist preoperacional del día (tabla iqfleet.checklists).</summary>
public class Checklist
{
    public Guid Id { get; set; }
    public Guid UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public DateOnly Fecha { get; set; }
    public string? Placa { get; set; }
    public Vehiculo? Vehiculo { get; set; }
    /// <summary>{ [itemId]: { resultado: 'ok'|'falla'|'na', nota?, vencimiento? } }</summary>
    public string Respuestas { get; set; } = "{}";
    public bool Aprobado { get; set; }
    public DateTime? AprobadoEn { get; set; }
    /// <summary>Ítems críticos en falla: [{ id, label, motivo }]. Bloquean la ruta.</summary>
    public string Blockers { get; set; } = "[]";
    /// <summary>Ítems no críticos en falla o vencimientos próximos.</summary>
    public string Warnings { get; set; } = "[]";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>Cronómetro de conducción continua del turno (tabla iqfleet.fatiga).</summary>
public class Fatiga
{
    public Guid Id { get; set; }
    public Guid UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public DateOnly Fecha { get; set; }
    public DateTime IniciadoEn { get; set; }
    public long AcumuladoMs { get; set; }
    public bool Corriendo { get; set; }
    public DateTime? ReanudadoEn { get; set; }
    public DateTime? UltimaPausaEn { get; set; }
    /// <summary>[{ en, duracionMs, motivo }]</summary>
    public string Pausas { get; set; } = "[]";
    public DateTime UpdatedAt { get; set; }
}

/// <summary>Puntaje de conducción del turno (tabla iqfleet.puntajes).</summary>
public class Puntaje
{
    public Guid Id { get; set; }
    public Guid UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public DateOnly Fecha { get; set; }
    /// <summary>{ excesoLeve, excesoGrave, frenadaBrusca, aceleracionBrusca }</summary>
    public string Eventos { get; set; } = "{}";
    public int Excesos { get; set; }
    public int Puntos { get; set; } = 100;
    public DateTime UpdatedAt { get; set; }
}

/// <summary>Estela GPS y kilómetros del turno (tabla iqfleet.recorridos).</summary>
public class Recorrido
{
    public Guid Id { get; set; }
    public Guid UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public DateOnly Fecha { get; set; }
    public string? Placa { get; set; }
    public Vehiculo? Vehiculo { get; set; }
    /// <summary>[{ lat, lng, accuracy, timestamp }]</summary>
    public string Puntos { get; set; } = "[]";
    public decimal Kilometros { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>Posición en vivo de un conductor en ruta (tabla iqfleet.rutas_activas). Una fila por usuario.</summary>
public class RutaActiva
{
    public Guid UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public string? Placa { get; set; }
    public Vehiculo? Vehiculo { get; set; }
    public double Lat { get; set; }
    public double Lng { get; set; }
    public decimal VelocidadKmh { get; set; }
    public DateTime IniciadaEn { get; set; }
    public DateTime UpdatedAt { get; set; }
}
