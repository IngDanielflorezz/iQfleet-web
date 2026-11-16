namespace IQFleet.Api.Common;

/// <summary>
/// Archivo adjunto enviado por el front dentro del JSON (el cliente HTTP del front solo
/// envía JSON). contenidoBase64 admite el Data URL completo ("data:...;base64,") o solo la parte base64.
/// </summary>
public record ArchivoRequest(string? Nombre, string? Tipo, string? ContenidoBase64);

public record ArchivoUrlResponse(string Url, string Nombre, string Tipo);

public record ArchivoValido(string Nombre, string Tipo, byte[] Contenido);

public static class Adjuntos
{
    public const int MaxBytes = 2 * 1024 * 1024; // 2 MB, igual que el front
    public static readonly string[] TiposPermitidos = ["image/png", "image/jpeg", "application/pdf"];

    /// <summary>Valida tipo, tamaño y base64. Los errores usan la llave <paramref name="campo"/> del formulario.</summary>
    public static ArchivoValido? Validar(ArchivoRequest? request, string campo, Validation v)
    {
        var nombre = Validation.Optional(request?.Nombre);
        var tipo = Validation.Optional(request?.Tipo);
        var base64 = Validation.Optional(request?.ContenidoBase64);

        if (nombre is null || base64 is null)
        {
            v.Add(campo, "Selecciona un archivo.");
            return null;
        }
        if (tipo is null || !TiposPermitidos.Contains(tipo))
        {
            v.Add(campo, "Formato no permitido (usa PNG, JPG o PDF).");
            return null;
        }

        var coma = base64.IndexOf(',');
        if (base64.StartsWith("data:", StringComparison.OrdinalIgnoreCase) && coma >= 0) base64 = base64[(coma + 1)..];

        // Tope previo sobre el texto (base64 ocupa ~4/3 del binario) para no decodificar cuerpos enormes.
        if (base64.Length > (MaxBytes / 3 + 1) * 4)
        {
            v.Add(campo, "El archivo supera el máximo de 2 MB.");
            return null;
        }

        byte[] contenido;
        try
        {
            contenido = Convert.FromBase64String(base64);
        }
        catch (FormatException)
        {
            v.Add(campo, "El archivo está dañado o no se pudo leer.");
            return null;
        }

        if (contenido.Length == 0) v.Add(campo, "El archivo está vacío.");
        else if (contenido.Length > MaxBytes) v.Add(campo, "El archivo supera el máximo de 2 MB.");
        return v.IsValid ? new ArchivoValido(Path.GetFileName(nombre), tipo, contenido) : null;
    }

    public static IResult NoConfigurado() =>
        Results.Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "Almacenamiento no configurado",
            detail: "El almacenamiento de archivos no está configurado (SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en api/.env).");

    public static IResult ErrorAlmacenamiento() =>
        Results.Problem(statusCode: StatusCodes.Status502BadGateway, title: "Error de almacenamiento",
            detail: "No se pudo completar la operación con el almacenamiento de archivos. Intenta de nuevo.");

    public static IResult SinArchivo() =>
        Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "Sin archivo",
            detail: "Este registro no tiene un archivo almacenado. Adjúntalo de nuevo para poder descargarlo.");
}
