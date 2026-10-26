using System.Text.Json;

namespace IQFleet.Api.Common;

/// <summary>Lectura/escritura de las columnas jsonb (se guardan como texto en la entidad).</summary>
public static class JsonColumn
{
    public static JsonElement Leer(string json)
    {
        using var documento = JsonDocument.Parse(string.IsNullOrWhiteSpace(json) ? "null" : json);
        return documento.RootElement.Clone();
    }

    /// <summary>Valida que el valor recibido sea un objeto/arreglo JSON y lo devuelve como texto.</summary>
    public static string Escribir(Validation v, string campo, JsonElement? valor, JsonValueKind esperado, string porDefecto)
    {
        if (valor is null || valor.Value.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null) return porDefecto;
        if (valor.Value.ValueKind != esperado)
        {
            v.Add(campo, esperado == JsonValueKind.Array ? "Debe ser una lista." : "Debe ser un objeto.");
            return porDefecto;
        }
        return valor.Value.GetRawText();
    }
}
