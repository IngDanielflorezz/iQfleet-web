using System.Globalization;

namespace IQFleet.Api.Common;

/// <summary>
/// La base guarda instantes en UTC, pero el front trabaja con fecha/hora local de Colombia
/// (input type="datetime-local" sin zona y "hoy" = YYYY-MM-DD local). Aquí se hace la conversión.
/// </summary>
public static class HoraColombia
{
    public static readonly TimeSpan Offset = TimeSpan.FromHours(-5);

    public static DateOnly Hoy() => DateOnly.FromDateTime(DateTime.UtcNow.Add(Offset));

    /// <summary>Inicio del día local expresado en UTC (para filtrar columnas timestamptz por fecha).</summary>
    public static DateTime InicioDiaUtc(DateOnly fecha) =>
        new DateTimeOffset(fecha.ToDateTime(TimeOnly.MinValue), Offset).UtcDateTime;

    /// <summary>"2026-10-26T05:30" (hora local) o con zona explícita ("...Z", "...-05:00") → UTC.</summary>
    public static bool TryParse(string? valor, out DateTime utc)
    {
        utc = default;
        var texto = valor?.Trim();
        if (string.IsNullOrEmpty(texto)) return false;

        var tieneZona = texto.EndsWith('Z') || texto.LastIndexOfAny(['+', '-']) > 10;
        if (tieneZona)
        {
            if (!DateTimeOffset.TryParse(texto, CultureInfo.InvariantCulture, DateTimeStyles.None, out var conZona)) return false;
            utc = conZona.UtcDateTime;
            return true;
        }

        string[] formatos = ["yyyy-MM-dd'T'HH:mm", "yyyy-MM-dd'T'HH:mm:ss", "yyyy-MM-dd'T'HH:mm:ss.FFFFFFF"];
        if (!DateTime.TryParseExact(texto, formatos, CultureInfo.InvariantCulture, DateTimeStyles.None, out var local)) return false;
        utc = new DateTimeOffset(local, Offset).UtcDateTime;
        return true;
    }

    /// <summary>UTC → "2026-10-26T05:30" local, el formato que pinta el front.</summary>
    public static string Formatear(DateTime utc) =>
        DateTime.SpecifyKind(utc, DateTimeKind.Utc).Add(Offset).ToString("yyyy-MM-dd'T'HH:mm", CultureInfo.InvariantCulture);
}
