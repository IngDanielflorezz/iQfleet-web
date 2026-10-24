using System.Security.Cryptography;
using System.Text;

namespace IQFleet.Api.Common;

/// <summary>
/// Exige "Authorization: Bearer &lt;IQFLEET_API_TOKEN&gt;" en las rutas /api.
/// Es una protección básica entre el front y la API, no un login de usuarios.
/// </summary>
public class ApiTokenFilter(IConfiguration configuration) : IEndpointFilter
{
    private readonly byte[]? _token = string.IsNullOrWhiteSpace(configuration["IQFLEET_API_TOKEN"])
        ? null
        : Encoding.UTF8.GetBytes(configuration["IQFLEET_API_TOKEN"]!);

    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        // Sin token configurado la API queda abierta (útil solo en desarrollo).
        if (_token is null) return await next(context);

        var header = context.HttpContext.Request.Headers.Authorization.ToString();
        const string prefijo = "Bearer ";
        var recibido = header.StartsWith(prefijo, StringComparison.OrdinalIgnoreCase)
            ? Encoding.UTF8.GetBytes(header[prefijo.Length..].Trim())
            : [];

        if (!CryptographicOperations.FixedTimeEquals(recibido, _token))
        {
            return Results.Problem(statusCode: StatusCodes.Status401Unauthorized,
                title: "No autorizado", detail: "Token de API ausente o inválido.");
        }

        return await next(context);
    }
}
