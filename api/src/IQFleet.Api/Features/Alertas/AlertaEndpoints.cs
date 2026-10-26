using IQFleet.Api.Common;
using IQFleet.Api.Data;
using IQFleet.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace IQFleet.Api.Features.Alertas;

public record Posicion(double Lat, double Lng);

/// <summary>Cuerpo que envían el panel del conductor (checklist, SOS, fatiga, mensajes) y el dashboard.</summary>
public record AlertaRequest(
    string? Tipo,
    string? Severidad,
    string? UserId,
    string? Conductor,
    string? Empresa,
    string? Titulo,
    string? Detalle,
    Posicion? Posicion,
    string? Clave);

public record AlertaResponse(
    Guid Id,
    string Tipo,
    string Severidad,
    string UserId,
    string Conductor,
    string Empresa,
    string Titulo,
    string Detalle,
    Posicion? Posicion,
    string? Clave,
    bool Resuelta,
    DateTime CreatedAt,
    DateTime? ResueltaEn)
{
    public static AlertaResponse From(Alerta a) => new(
        a.Id, a.Tipo, a.Severidad, a.UsuarioId?.ToString() ?? string.Empty, a.Conductor ?? string.Empty, a.Empresa,
        a.Titulo, a.Detalle ?? string.Empty, a.Lat is { } lat && a.Lng is { } lng ? new Posicion(lat, lng) : null,
        a.Clave, a.Resuelta, a.CreatedAt, a.ResueltaEn);
}

public record ResultadoResponse(int Cantidad);

public static class AlertaEndpoints
{
    public static RouteGroupBuilder MapAlertas(this RouteGroupBuilder api)
    {
        var group = api.MapGroup("/alertas").WithTags("Alertas");

        group.MapGet("/", Listar).WithSummary("Lista alertas por severidad (filtros: activas, tipo, empresa, userId)");
        group.MapGet("/{id:guid}", Obtener).WithName("ObtenerAlerta").WithSummary("Obtiene una alerta por id");
        group.MapPost("/", Crear).WithSummary("Crea una alerta; con 'clave' es idempotente (devuelve la activa existente)");
        group.MapPost("/{id:guid}/resolver", Resolver).WithSummary("Marca una alerta como resuelta");
        group.MapPost("/resolver", ResolverPorClave).WithSummary("Resuelve todas las alertas activas con la clave dada");
        group.MapPost("/generar-vencimientos", GenerarVencimientos)
            .WithSummary("Crea alertas de SOAT, RTM, licencias y documentos vencidos o por vencer");
        group.MapDelete("/{id:guid}", Eliminar).WithSummary("Elimina una alerta");

        return api;
    }

    private static readonly Dictionary<string, int> OrdenSeveridad = new()
    {
        [AlertaSeveridades.Danger] = 0,
        [AlertaSeveridades.Warning] = 1,
        [AlertaSeveridades.Info] = 2,
    };

    private static async Task<IResult> Listar(IQFleetDbContext db, bool? activas, string? tipo, string? empresa, Guid? userId)
    {
        var query = db.Alertas.AsNoTracking();
        if (activas is not null) query = query.Where(a => a.Resuelta != activas.Value);
        if (!string.IsNullOrWhiteSpace(tipo)) query = query.Where(a => a.Tipo == tipo);
        if (!string.IsNullOrWhiteSpace(empresa)) query = query.Where(a => a.Empresa.ToLower() == empresa.Trim().ToLower());
        if (userId is not null) query = query.Where(a => a.UsuarioId == userId);

        var alertas = await query.OrderByDescending(a => a.CreatedAt).ToListAsync();
        return Results.Ok(alertas
            .OrderBy(a => OrdenSeveridad.GetValueOrDefault(a.Severidad, 3))
            .Select(AlertaResponse.From));
    }

    private static async Task<IResult> Obtener(Guid id, IQFleetDbContext db)
    {
        var alerta = await db.Alertas.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id);
        return alerta is null ? NotFound(id) : Results.Ok(AlertaResponse.From(alerta));
    }

    private static async Task<IResult> Crear(AlertaRequest request, IQFleetDbContext db)
    {
        var v = new Validation();
        var tipo = v.OneOf("tipo", request.Tipo, AlertaTipos.Mensaje, AlertaTipos.Todos, "Tipo de alerta inválido.");
        var severidad = v.OneOf("severidad", request.Severidad, AlertaSeveridades.Info, AlertaSeveridades.Todas, "Severidad inválida.");
        var titulo = v.Required("titulo", request.Titulo, "El título es obligatorio.");

        Usuario? usuario = null;
        if (!string.IsNullOrWhiteSpace(request.UserId))
        {
            usuario = Guid.TryParse(request.UserId, out var uid) ? await db.Usuarios.AsNoTracking().FirstOrDefaultAsync(u => u.Id == uid) : null;
            if (usuario is null) v.Add("userId", "El usuario no existe.");
        }

        // Si llega el usuario, la empresa y el nombre salen de su cuenta.
        var empresa = usuario?.Empresa ?? Validation.Optional(request.Empresa);
        if (empresa is null) v.Add("empresa", "La empresa es obligatoria.");
        var conductor = Validation.Optional(request.Conductor) ?? (usuario is null ? null : $"{usuario.Nombres} {usuario.Apellidos}");

        if (request.Posicion is { } p && (p.Lat is < -90 or > 90 || p.Lng is < -180 or > 180))
            v.Add("posicion", "Coordenadas inválidas.");

        if (!v.IsValid) return v.ToProblem();

        var clave = Validation.Optional(request.Clave);
        if (clave is not null)
        {
            var existente = await db.Alertas.AsNoTracking().FirstOrDefaultAsync(a => a.Clave == clave && !a.Resuelta);
            if (existente is not null) return Results.Ok(AlertaResponse.From(existente));
        }

        var alerta = new Alerta
        {
            Tipo = tipo,
            Severidad = severidad,
            UsuarioId = usuario?.Id,
            Conductor = conductor,
            Empresa = empresa!,
            Titulo = titulo,
            Detalle = Validation.Optional(request.Detalle),
            Lat = request.Posicion?.Lat,
            Lng = request.Posicion?.Lng,
            Clave = clave,
            CreatedAt = DateTime.UtcNow,
        };
        db.Alertas.Add(alerta);
        await db.SaveChangesAsync();

        return Results.CreatedAtRoute("ObtenerAlerta", new { id = alerta.Id }, AlertaResponse.From(alerta));
    }

    private static async Task<IResult> Resolver(Guid id, IQFleetDbContext db)
    {
        var alerta = await db.Alertas.FirstOrDefaultAsync(a => a.Id == id);
        if (alerta is null) return NotFound(id);

        if (!alerta.Resuelta)
        {
            alerta.Resuelta = true;
            alerta.ResueltaEn = DateTime.UtcNow;
            await db.SaveChangesAsync();
        }
        return Results.Ok(AlertaResponse.From(alerta));
    }

    private static async Task<IResult> ResolverPorClave(string clave, IQFleetDbContext db)
    {
        var ahora = DateTime.UtcNow;
        var resueltas = await db.Alertas
            .Where(a => a.Clave == clave && !a.Resuelta)
            .ExecuteUpdateAsync(s => s.SetProperty(a => a.Resuelta, true).SetProperty(a => a.ResueltaEn, ahora));
        return Results.Ok(new ResultadoResponse(resueltas));
    }

    /// <summary>
    /// Revisa SOAT/RTM de vehículos, licencias de conductores y documentos que vencen dentro de
    /// <paramref name="dias"/> días. La clave incluye la fecha de vencimiento, así una alerta ya
    /// creada (aunque se haya resuelto) no se repite hasta que el documento se renueve.
    /// </summary>
    private static async Task<IResult> GenerarVencimientos(IQFleetDbContext db, string? empresa, int? dias)
    {
        var limite = HoraColombia.Hoy().AddDays(Math.Clamp(dias ?? 15, 0, 365));
        var hoy = HoraColombia.Hoy();
        var nombreEmpresa = Validation.Optional(empresa) ?? "iQFleet";
        var candidatas = new List<Alerta>();

        void Agregar(string clave, DateOnly vence, string titulo, string detalle, string? conductor = null) =>
            candidatas.Add(new Alerta
            {
                Tipo = AlertaTipos.Documento,
                Severidad = vence < hoy ? AlertaSeveridades.Danger : AlertaSeveridades.Warning,
                Empresa = nombreEmpresa,
                Conductor = conductor,
                Titulo = titulo,
                Detalle = detalle,
                Clave = $"{clave}:{vence:yyyy-MM-dd}",
                CreatedAt = DateTime.UtcNow,
            });

        foreach (var x in await db.Vehiculos.AsNoTracking().Where(x => x.SoatVence <= limite || x.RtmVence <= limite).ToListAsync())
        {
            if (x.SoatVence <= limite)
                Agregar($"soat:{x.Placa}", x.SoatVence, $"SOAT por vencer o vencido: {x.Placa}", $"El SOAT del vehículo {x.Placa} vence el {x.SoatVence:yyyy-MM-dd}.");
            if (x.RtmVence <= limite)
                Agregar($"rtm:{x.Placa}", x.RtmVence, $"RTM por vencer o vencida: {x.Placa}", $"La revisión técnico-mecánica de {x.Placa} vence el {x.RtmVence:yyyy-MM-dd}.");
        }

        foreach (var c in await db.Conductores.AsNoTracking().Where(c => c.LicenciaVence <= limite).ToListAsync())
            Agregar($"licencia:{c.Cedula}", c.LicenciaVence, $"Licencia de conducción: {c.Nombre}",
                $"La licencia de {c.Nombre} (C.C. {c.Cedula}) vence el {c.LicenciaVence:yyyy-MM-dd}.", c.Nombre);

        foreach (var d in await db.Documentos.AsNoTracking().Where(d => d.FechaVencimiento <= limite).ToListAsync())
            Agregar($"documento:{d.Id}", d.FechaVencimiento, $"{d.Tipo} por vencer o vencido: {d.Placa ?? d.Conductor}",
                $"{d.Tipo} N.° {d.Numero} ({d.Entidad}) vence el {d.FechaVencimiento:yyyy-MM-dd}.", d.Conductor);

        var claves = candidatas.Select(a => a.Clave!).ToList();
        var existentes = await db.Alertas.Where(a => a.Clave != null && claves.Contains(a.Clave)).Select(a => a.Clave!).ToListAsync();
        var nuevas = candidatas.Where(a => !existentes.Contains(a.Clave!)).ToList();

        db.Alertas.AddRange(nuevas);
        await db.SaveChangesAsync();
        return Results.Ok(new ResultadoResponse(nuevas.Count));
    }

    private static async Task<IResult> Eliminar(Guid id, IQFleetDbContext db)
    {
        var eliminados = await db.Alertas.Where(a => a.Id == id).ExecuteDeleteAsync();
        return eliminados == 0 ? NotFound(id) : Results.NoContent();
    }

    private static IResult NotFound(Guid id) =>
        Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "No encontrado", detail: $"Alerta {id} no encontrada");
}
