using System.Security.Claims;
using System.Text;
using IQFleet.Api.Domain;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace IQFleet.Api.Common;

/// <summary>Políticas de autorización por rol que usan los grupos de endpoints.</summary>
public static class Politicas
{
    /// <summary>Módulos de gestión: flota, conductores, despachos, documentos, finanzas, mantenimiento.</summary>
    public const string Administrador = "Administrador";

    /// <summary>Operación del turno (checklist, fatiga, recorridos, alertas, GPS): conductor o administrador.</summary>
    public const string Operacion = "Operacion";
}

/// <summary>Claims propias del token, además de "sub" (id del usuario).</summary>
public static class Claims
{
    public const string Rol = "rol";
    public const string Empresa = "empresa";
    public const string Nombre = "name";
    public const string Correo = "email";

    public static Guid? UsuarioId(this ClaimsPrincipal user) =>
        Guid.TryParse(user.FindFirstValue(JwtRegisteredClaimNames.Sub), out var id) ? id : null;

    public static bool EsAdministrador(this ClaimsPrincipal user) => user.IsInRole(UsuarioRoles.Administrador);
}

/// <summary>
/// Emite el JWT que devuelve POST /api/auth/login. El front lo guarda con la sesión y lo
/// envía en "Authorization: Bearer &lt;token&gt;" en cada petición.
/// </summary>
public class JwtEmisor(JwtConfig config)
{
    private readonly JsonWebTokenHandler _handler = new();

    public (string Token, DateTime ExpiraEn) Emitir(Usuario usuario)
    {
        var expira = DateTime.UtcNow.AddHours(config.Horas);
        var token = _handler.CreateToken(new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(
            [
                new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
                new Claim(Claims.Nombre, $"{usuario.Nombres} {usuario.Apellidos}".Trim()),
                new Claim(Claims.Correo, usuario.Correo),
                new Claim(Claims.Rol, usuario.Rol),
                new Claim(Claims.Empresa, usuario.Empresa),
            ]),
            Expires = expira,
            SigningCredentials = new SigningCredentials(config.Clave, SecurityAlgorithms.HmacSha256),
        });
        return (token, expira);
    }
}

/// <summary>Secreto y duración del token, leídos de IQFLEET_JWT_SECRET / IQFLEET_JWT_HORAS.</summary>
public sealed class JwtConfig
{
    public required SymmetricSecurityKey Clave { get; init; }
    public required int Horas { get; init; }

    public static JwtConfig Desde(IConfiguration configuration)
    {
        var secreto = configuration["IQFLEET_JWT_SECRET"]?.Trim();
        if (string.IsNullOrEmpty(secreto) || Encoding.UTF8.GetByteCount(secreto) < 32)
            throw new InvalidOperationException(
                "Define IQFLEET_JWT_SECRET en api/.env con al menos 32 caracteres (p. ej. la salida de: openssl rand -base64 48).");

        var horas = int.TryParse(configuration["IQFLEET_JWT_HORAS"], out var h) && h > 0 ? h : 8;
        return new JwtConfig { Clave = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secreto)), Horas = horas };
    }
}

public static class JwtAuthExtensions
{
    public static IServiceCollection AddJwtAuth(this IServiceCollection services, IConfiguration configuration)
    {
        var config = JwtConfig.Desde(configuration);
        services.AddSingleton(config);
        services.AddSingleton<JwtEmisor>();

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.MapInboundClaims = false; // conserva "sub", "rol", "empresa" tal cual
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = config.Clave,
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(1),
                    NameClaimType = Claims.Nombre,
                    RoleClaimType = Claims.Rol,
                };
            });

        services.AddAuthorizationBuilder()
            .AddPolicy(Politicas.Administrador, p => p.RequireRole(UsuarioRoles.Administrador))
            .AddPolicy(Politicas.Operacion, p => p.RequireRole(UsuarioRoles.Conductor, UsuarioRoles.Administrador));

        return services;
    }
}
