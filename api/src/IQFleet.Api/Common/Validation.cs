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

    public IResult ToProblem(int statusCode = StatusCodes.Status400BadRequest) =>
        Results.ValidationProblem(_errores, title: "Datos inválidos", statusCode: statusCode);
}
