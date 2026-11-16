using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace IQFleet.Api.Common;

/// <summary>
/// Cliente de Supabase Storage (API REST) para los archivos adjuntos: comprobantes de
/// movimientos y soportes de documentos. El bucket debe ser privado: el front nunca
/// recibe la service role key, solo URLs firmadas que caducan.
///
/// Configuración (api/.env): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y, opcional,
/// SUPABASE_STORAGE_BUCKET (por defecto "iqfleet-adjuntos"). Sin ellas la API arranca
/// igual y solo los endpoints de archivos responden 503.
/// </summary>
public class ArchivoStorage
{
    private readonly HttpClient _http;
    private readonly string? _baseUrl;
    private readonly string _bucket;

    public ArchivoStorage(HttpClient http, IConfiguration configuration)
    {
        _http = http;
        var url = configuration["SUPABASE_URL"]?.Trim().TrimEnd('/');
        var key = configuration["SUPABASE_SERVICE_ROLE_KEY"]?.Trim();
        _bucket = configuration["SUPABASE_STORAGE_BUCKET"]?.Trim() is { Length: > 0 } bucket ? bucket : "iqfleet-adjuntos";

        if (!string.IsNullOrEmpty(url) && !string.IsNullOrEmpty(key))
        {
            _baseUrl = $"{url}/storage/v1";
            _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", key);
            _http.DefaultRequestHeaders.Add("apikey", key);
        }
    }

    public bool Configurado => _baseUrl is not null;

    /// <summary>Sube (o reemplaza) el archivo en la ruta indicada, p. ej. "documentos/{id}".</summary>
    public async Task SubirAsync(string ruta, byte[] contenido, string contentType, CancellationToken ct = default)
    {
        using var mensaje = new HttpRequestMessage(HttpMethod.Post, $"{BaseUrl}/object/{_bucket}/{ruta}")
        {
            Content = new ByteArrayContent(contenido),
        };
        mensaje.Content.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        mensaje.Headers.Add("x-upsert", "true");

        using var respuesta = await _http.SendAsync(mensaje, ct);
        await AsegurarExitoAsync(respuesta, "subir", ct);
    }

    /// <summary>URL firmada de descarga; null si el archivo no existe en el bucket.</summary>
    public async Task<string?> UrlFirmadaAsync(string ruta, string nombreDescarga, int segundos = 300, CancellationToken ct = default)
    {
        using var respuesta = await _http.PostAsJsonAsync($"{BaseUrl}/object/sign/{_bucket}/{ruta}", new { expiresIn = segundos }, ct);
        if (respuesta.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.BadRequest) return null;
        await AsegurarExitoAsync(respuesta, "firmar", ct);

        var cuerpo = await respuesta.Content.ReadFromJsonAsync<UrlFirmada>(ct);
        if (string.IsNullOrEmpty(cuerpo?.SignedURL)) return null;
        return $"{BaseUrl}{cuerpo.SignedURL}&download={Uri.EscapeDataString(nombreDescarga)}";
    }

    /// <summary>Elimina el archivo si existe. No falla si no está (p. ej. registros sin adjunto).</summary>
    public async Task EliminarAsync(string ruta, CancellationToken ct = default)
    {
        if (!Configurado) return;
        using var mensaje = new HttpRequestMessage(HttpMethod.Delete, $"{BaseUrl}/object/{_bucket}")
        {
            Content = JsonContent.Create(new { prefixes = new[] { ruta } }),
        };
        using var respuesta = await _http.SendAsync(mensaje, ct);
        if (respuesta.StatusCode != HttpStatusCode.NotFound) await AsegurarExitoAsync(respuesta, "eliminar", ct);
    }

    private string BaseUrl => _baseUrl ?? throw new InvalidOperationException("Supabase Storage no está configurado.");

    private static async Task AsegurarExitoAsync(HttpResponseMessage respuesta, string accion, CancellationToken ct)
    {
        if (respuesta.IsSuccessStatusCode) return;
        var detalle = await respuesta.Content.ReadAsStringAsync(ct);
        throw new HttpRequestException($"Supabase Storage no pudo {accion} el archivo ({(int)respuesta.StatusCode}): {detalle}");
    }

    private sealed record UrlFirmada(string? SignedURL);
}
