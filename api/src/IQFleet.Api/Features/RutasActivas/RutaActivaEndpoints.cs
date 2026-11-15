using IQFleet.Api.Common;
using IQFleet.Api.Data;
using IQFleet.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace IQFleet.Api.Features.RutasActivas;

/// <summary>Posición que reporta el conductor (activateRoute / updatePosition de gpsService.js).</summary>
public record RutaActivaRequest(double? Lat, double? Lng, decimal? SpeedKmh, string? Placa);

public record RutaActivaResponse(
    string UserId,
    string Nombres,
    string Apellidos,
    string Empresa,
    string Placa,
    double Lat,
    double Lng,
    decimal SpeedKmh,
    DateTime IniciadaEn,
    DateTime UpdatedAt,
    bool Stale)
{
    public static RutaActivaResponse From(RutaActiva r) => new(
        r.UsuarioId.ToString(), r.Usuario?.Nombres ?? string.Empty, r.Usuario?.Apellidos ?? string.Empty,
        r.Usuario?.Empresa ?? string.Empty, r.Placa ?? string.Empty, r.Lat, r.Lng, r.VelocidadKmh,
        r.IniciadaEn, r.UpdatedAt, DateTime.UtcNow - r.UpdatedAt > RutaActivaEndpoints.SignalTimeout);
}

public static class RutaActivaEndpoints
{
    // Mismos tiempos que GPS_CONFIG en gpsService.js.
    internal static readonly TimeSpan SignalTimeout = TimeSpan.FromSeconds(45);
    private static readonly TimeSpan RouteTtl = TimeSpan.FromMinutes(10);

    public static RouteGroupBuilder MapRutasActivas(this RouteGroupBuilder api)
    {
        var group = api.MapGroup("/rutas-activas").WithTags("Monitoreo GPS");

        group.MapGet("/", Listar).WithSummary("Unidades en ruta que reportaron en los últimos 10 min (filtro: empresa)");
        group.MapGet("/{userId:guid}", Obtener).WithSummary("Ruta activa de un conductor");
        group.MapPut("/{userId:guid}", Reportar)
            .WithSummary("Activa la ruta o actualiza la posición. Activar exige el checklist de hoy aprobado");
        group.MapDelete("/{userId:guid}", Desactivar).WithSummary("Finaliza la ruta del conductor");

        return api;
    }

    private static async Task<IResult> Listar(IQFleetDbContext db, string? empresa)
    {
        var limite = DateTime.UtcNow - RouteTtl;
        var query = db.RutasActivas.AsNoTracking().Include(r => r.Usuario).Where(r => r.UpdatedAt >= limite);
        if (!string.IsNullOrWhiteSpace(empresa)) query = query.Where(r => r.Usuario!.Empresa.ToLower() == empresa.Trim().ToLower());

        var rutas = await query.OrderBy(r => r.Usuario!.Nombres).ToListAsync();
        return Results.Ok(rutas.Select(RutaActivaResponse.From));
    }

    private static async Task<IResult> Obtener(Guid userId, IQFleetDbContext db)
    {
        var ruta = await db.RutasActivas.AsNoTracking().Include(r => r.Usuario).FirstOrDefaultAsync(r => r.UsuarioId == userId);
        return ruta is null
            ? Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "No encontrado", detail: "El conductor no tiene una ruta activa.")
            : Results.Ok(RutaActivaResponse.From(ruta));
    }

    private static async Task<IResult> Reportar(Guid userId, RutaActivaRequest request, IQFleetDbContext db)
    {
        var usuario = await db.Usuarios.FirstOrDefaultAsync(u => u.Id == userId);
        if (usuario is null)
            return Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "No encontrado", detail: $"Usuario {userId} no encontrado");

        var v = new Validation();
        if (request.Lat is not (>= -90 and <= 90)) v.Add("lat", "Latitud inválida.");
        if (request.Lng is not (>= -180 and <= 180)) v.Add("lng", "Longitud inválida.");
        var velocidad = request.SpeedKmh ?? 0;
        if (velocidad < 0) v.Add("speedKmh", "La velocidad no puede ser negativa.");

        var placa = Validation.Optional(request.Placa)?.ToUpperInvariant();
        if (placa is not null && !await db.Vehiculos.AnyAsync(x => x.Placa == placa))
            v.Add("placa", $"El vehículo {placa} no existe.");
        if (!v.IsValid) return v.ToProblem();

        var ahora = DateTime.UtcNow;
        var ruta = await db.RutasActivas.FirstOrDefaultAsync(r => r.UsuarioId == userId);
        if (ruta is null)
        {
            // Guarda dura (puedeActivarRuta): sin checklist aprobado hoy no se puede salir a ruta.
            var hoy = HoraColombia.Hoy();
            if (usuario.Rol == UsuarioRoles.Conductor &&
                !await db.Checklists.AnyAsync(c => c.UsuarioId == userId && c.Fecha == hoy && c.Aprobado))
                return Results.Problem(statusCode: StatusCodes.Status409Conflict, title: "Checklist pendiente",
                    detail: "Debes aprobar el checklist preoperacional de hoy antes de activar la ruta.");

            ruta = new RutaActiva { UsuarioId = userId, IniciadaEn = ahora };
            db.RutasActivas.Add(ruta);
        }

        ruta.Lat = request.Lat!.Value;
        ruta.Lng = request.Lng!.Value;
        ruta.VelocidadKmh = velocidad;
        ruta.Placa = placa ?? ruta.Placa;
        ruta.UpdatedAt = ahora;
        ruta.Usuario = usuario;
        await db.SaveChangesAsync();
        return Results.Ok(RutaActivaResponse.From(ruta));
    }

    private static async Task<IResult> Desactivar(Guid userId, IQFleetDbContext db)
    {
        var eliminados = await db.RutasActivas.Where(r => r.UsuarioId == userId).ExecuteDeleteAsync();
        return eliminados == 0
            ? Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "No encontrado", detail: "El conductor no tiene una ruta activa.")
            : Results.NoContent();
    }
}
