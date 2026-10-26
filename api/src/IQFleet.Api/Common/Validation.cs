using System.Globalization;

namespace IQFleet.Api.Common;

/// <summary>
/// Acumula errores por campo con las mismas llaves que usa el formulario de React
/// (id, marca, soatVence...), para que el front los pinte debajo de cada input.
/// </summary>
public class Validation
{
    private readonly Dictionary<string, string[]> _errores = new();

    public bool IsValid => _errores.Count == 0;
    public IDictionary<string, string[]> Errores => _errores;

    public void Add(string campo, string mensaje)
    {
        if (!_errores.ContainsKey(campo)) _errores[campo] = [mensaje];
    }

    public bool Has(string campo) => _errores.ContainsKey(campo);

    public string Required(string campo, string? valor, string mensaje)
    {
        var limpio = valor?.Trim() ?? string.Empty;
        if (limpio.Length == 0) Add(campo, mensaje);
        return limpio;
    }

    /// <summary>Fecha en formato ISO (YYYY-MM-DD), que es lo que envía un input type="date".</summary>
    public DateOnly Date(string campo, string? valor, string mensaje)
    {
        if (DateOnly.TryParseExact(valor?.Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var fecha))
            return fecha;
        Add(campo, mensaje);
        return default;
    }

    /// <summary>Fecha opcional: vacío => null; con valor debe ser YYYY-MM-DD.</summary>
    public DateOnly? OptionalDate(string campo, string? valor, string mensaje) =>
        string.IsNullOrWhiteSpace(valor) ? null : Date(campo, valor, mensaje);

    /// <summary>Fecha y hora local de Colombia (input type="datetime-local"), devuelta en UTC.</summary>
    public DateTime DateTimeLocal(string campo, string? valor, string mensaje)
    {
        if (HoraColombia.TryParse(valor, out var utc)) return utc;
        Add(campo, mensaje);
        return default;
    }

    /// <summary>Valor de una lista cerrada (estado, tipo...). Vacío => porDefecto.</summary>
    public string OneOf(string campo, string? valor, string porDefecto, string[] permitidos, string mensaje)
    {
        var limpio = string.IsNullOrWhiteSpace(valor) ? porDefecto : valor.Trim();
        if (!permitidos.Contains(limpio)) Add(campo, mensaje);
        return limpio;
    }

    /// <summary>Texto opcional: vacío => null.</summary>
    public static string? Optional(string? valor) => string.IsNullOrWhiteSpace(valor) ? null : valor.Trim();

    public IResult ToProblem(int statusCode = StatusCodes.Status400BadRequest) =>
        Results.ValidationProblem(_errores, title: "Datos inválidos", statusCode: statusCode);
}
