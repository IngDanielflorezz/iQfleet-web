using System.Text.Json;
using System.Text.Json.Nodes;
using IQFleet.Api.Common;
using IQFleet.Api.Data;
using IQFleet.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace IQFleet.Api.Features.Turno;

// Panel del conductor: checklist, fatiga, puntaje y recorrido. Cada recurso tiene una fila por
// (usuario, fecha local) y se direcciona como /api/{recurso}/{userId}/{YYYY-MM-DD}. El PUT crea
// o reemplaza la fila del día (upsert), igual que hacían los servicios con localStorage.

public record ChecklistRequest(JsonElement? Respuestas, bool? Approved, JsonElement? Blockers, JsonElement? Warnings, string? Placa);

public record ChecklistResponse(
    string UserId, DateOnly Fecha, string Conductor, string Empresa, string Placa,
    JsonElement Respuestas, bool Approved, JsonElement Blockers, JsonElement Warnings,
    DateTime? AprobadoEn, DateTime UpdatedAt)
{
    public static ChecklistResponse From(Checklist c) => new(
        c.UsuarioId.ToString(), c.Fecha, NombreDe(c.Usuario), c.Usuario?.Empresa ?? string.Empty, c.Placa ?? string.Empty,
        JsonColumn.Leer(c.Respuestas), c.Aprobado, JsonColumn.Leer(c.Blockers), JsonColumn.Leer(c.Warnings),
        c.AprobadoEn, c.UpdatedAt);

    internal static string NombreDe(Usuario? u) => u is null ? string.Empty : $"{u.Nombres} {u.Apellidos}";
}

public record FatigaRequest(
    long? AcumuladoMs, bool? Corriendo, string? IniciadoEn, string? ReanudadoEn, string? UltimaPausaEn, JsonElement? Pausas);

public record FatigaResponse(
    string UserId, DateOnly Fecha, DateTime IniciadoEn, long AcumuladoMs, bool Corriendo,
    DateTime? ReanudadoEn, DateTime? UltimaPausaEn, JsonElement Pausas, DateTime UpdatedAt)
{
    public static FatigaResponse From(Fatiga f) => new(
        f.UsuarioId.ToString(), f.Fecha, f.IniciadoEn, f.AcumuladoMs, f.Corriendo,
        f.ReanudadoEn, f.UltimaPausaEn, JsonColumn.Leer(f.Pausas), f.UpdatedAt);
}

public record PuntajeRequest(JsonElement? Eventos, int? Excesos, int? Puntaje);

public record PuntajeResponse(string UserId, DateOnly Fecha, JsonElement Eventos, int Excesos, int Puntaje, DateTime UpdatedAt)
{
    public static PuntajeResponse From(Puntaje p) =>
        new(p.UsuarioId.ToString(), p.Fecha, JsonColumn.Leer(p.Eventos), p.Excesos, p.Puntos, p.UpdatedAt);
}

public record RachaResponse(string UserId, int Dias);

public record RecorridoRequest(JsonElement? Puntos, decimal? Kilometros, string? Placa);

/// <summary>Una lectura GPS. timestamp en milisegundos (Date.now() del navegador).</summary>
public record PuntoRequest(double? Lat, double? Lng, double? Accuracy, long? Timestamp, string? Placa);

public record RecorridoResponse(string UserId, DateOnly Fecha, string Placa, JsonElement Puntos, decimal Kilometros, DateTime UpdatedAt)
{
    public static RecorridoResponse From(Recorrido r) =>
        new(r.UsuarioId.ToString(), r.Fecha, r.Placa ?? string.Empty, JsonColumn.Leer(r.Puntos), r.Kilometros, r.UpdatedAt);
}

public static class TurnoEndpoints
{
    // Mismos límites que recorridoService.js.
    private const int MaxPuntos = 500;
    private const double PrecisionMaximaM = 50;

    public static RouteGroupBuilder MapTurno(this RouteGroupBuilder api)
    {
        var checklists = api.MapGroup("/checklists").WithTags("Checklist preoperacional");
        checklists.MapGet("/", ListarChecklists).WithSummary("Checklists de una fecha (por defecto hoy) para el administrador");
        checklists.MapGet("/{userId:guid}/{fecha}", ObtenerChecklist).WithSummary("Checklist del usuario en la fecha");
        checklists.MapPut("/{userId:guid}/{fecha}", GuardarChecklist).WithSummary("Guarda el checklist del día (crea o reemplaza)");
        checklists.MapDelete("/{userId:guid}/{fecha}", (Guid userId, DateOnly fecha, IQFleetDbContext db) =>
            Borrar(db.Checklists.Where(c => c.UsuarioId == userId && c.Fecha == fecha))).WithSummary("Elimina el checklist del día");

        var fatiga = api.MapGroup("/fatiga").WithTags("Fatiga");
        fatiga.MapGet("/{userId:guid}/{fecha}", ObtenerFatiga).WithSummary("Estado de fatiga del usuario en la fecha");
        fatiga.MapPut("/{userId:guid}/{fecha}", GuardarFatiga).WithSummary("Guarda el cronómetro del día (crea o reemplaza)");
        fatiga.MapDelete("/{userId:guid}/{fecha}", (Guid userId, DateOnly fecha, IQFleetDbContext db) =>
            Borrar(db.Fatiga.Where(f => f.UsuarioId == userId && f.Fecha == fecha))).WithSummary("Reinicia la fatiga del día");

        var puntajes = api.MapGroup("/puntajes").WithTags("Puntaje de conducción");
        puntajes.MapGet("/{userId:guid}", ListarPuntajes).WithSummary("Historial de puntajes del usuario (filtros: desde, hasta)");
        puntajes.MapGet("/{userId:guid}/racha", Racha).WithSummary("Días consecutivos sin excesos graves");
        puntajes.MapGet("/{userId:guid}/{fecha}", ObtenerPuntaje).WithSummary("Puntaje del usuario en la fecha");
        puntajes.MapPut("/{userId:guid}/{fecha}", GuardarPuntaje).WithSummary("Guarda el puntaje del día (crea o reemplaza)");

        var recorridos = api.MapGroup("/recorridos").WithTags("Recorridos");
        recorridos.MapGet("/{userId:guid}/{fecha}", ObtenerRecorrido).WithSummary("Estela y kilómetros del usuario en la fecha");
        recorridos.MapPut("/{userId:guid}/{fecha}", GuardarRecorrido).WithSummary("Guarda el recorrido completo del día");
        recorridos.MapPost("/{userId:guid}/{fecha}/puntos", AgregarPunto)
            .WithSummary("Agrega una lectura GPS: filtra precisión > 50 m, suma km (Haversine) y conserva los últimos 500 puntos");
        recorridos.MapDelete("/{userId:guid}/{fecha}", (Guid userId, DateOnly fecha, IQFleetDbContext db) =>
            Borrar(db.Recorridos.Where(r => r.UsuarioId == userId && r.Fecha == fecha))).WithSummary("Reinicia el recorrido del día");

        return api;
    }

    // ------------------------------------------------------------ checklists --

    private static async Task<IResult> ListarChecklists(IQFleetDbContext db, DateOnly? fecha, string? empresa)
    {
        var dia = fecha ?? HoraColombia.Hoy();
        var query = db.Checklists.AsNoTracking().Include(c => c.Usuario).Where(c => c.Fecha == dia);
        if (!string.IsNullOrWhiteSpace(empresa)) query = query.Where(c => c.Usuario!.Empresa.ToLower() == empresa.Trim().ToLower());
        var lista = await query.OrderBy(c => c.Usuario!.Nombres).ToListAsync();
        return Results.Ok(lista.Select(ChecklistResponse.From));
    }

    private static async Task<IResult> ObtenerChecklist(Guid userId, DateOnly fecha, IQFleetDbContext db)
    {
        var checklist = await db.Checklists.AsNoTracking().Include(c => c.Usuario)
            .FirstOrDefaultAsync(c => c.UsuarioId == userId && c.Fecha == fecha);
        return checklist is null ? SinRegistro("checklist", fecha) : Results.Ok(ChecklistResponse.From(checklist));
    }

    private static async Task<IResult> GuardarChecklist(Guid userId, DateOnly fecha, ChecklistRequest request, IQFleetDbContext db)
    {
        var usuario = await db.Usuarios.FirstOrDefaultAsync(u => u.Id == userId);
        if (usuario is null) return UsuarioNoEncontrado(userId);

        var v = new Validation();
        var respuestas = JsonColumn.Escribir(v, "respuestas", request.Respuestas, JsonValueKind.Object, "{}");
        var blockers = JsonColumn.Escribir(v, "blockers", request.Blockers, JsonValueKind.Array, "[]");
        var warnings = JsonColumn.Escribir(v, "warnings", request.Warnings, JsonValueKind.Array, "[]");
        var placa = await ValidarPlaca(v, request.Placa, db);
        if (!v.IsValid) return v.ToProblem();

        var ahora = DateTime.UtcNow;
        var checklist = await db.Checklists.FirstOrDefaultAsync(c => c.UsuarioId == userId && c.Fecha == fecha);
        if (checklist is null)
        {
            checklist = new Checklist { UsuarioId = userId, Fecha = fecha, CreatedAt = ahora };
            db.Checklists.Add(checklist);
        }

        var aprobado = request.Approved ?? false;
        checklist.Respuestas = respuestas;
        checklist.Blockers = blockers;
        checklist.Warnings = warnings;
        checklist.Placa = placa;
        checklist.AprobadoEn = aprobado ? (checklist.Aprobado ? checklist.AprobadoEn : ahora) : null;
        checklist.Aprobado = aprobado;
        checklist.UpdatedAt = ahora;
        checklist.Usuario = usuario;
        await db.SaveChangesAsync();
        return Results.Ok(ChecklistResponse.From(checklist));
    }

    // ---------------------------------------------------------------- fatiga --

    private static async Task<IResult> ObtenerFatiga(Guid userId, DateOnly fecha, IQFleetDbContext db)
    {
        var fatiga = await db.Fatiga.AsNoTracking().FirstOrDefaultAsync(f => f.UsuarioId == userId && f.Fecha == fecha);
        return fatiga is null ? SinRegistro("registro de fatiga", fecha) : Results.Ok(FatigaResponse.From(fatiga));
    }

    private static async Task<IResult> GuardarFatiga(Guid userId, DateOnly fecha, FatigaRequest request, IQFleetDbContext db)
    {
        if (!await db.Usuarios.AnyAsync(u => u.Id == userId)) return UsuarioNoEncontrado(userId);

        var v = new Validation();
        var acumulado = request.AcumuladoMs ?? 0;
        if (acumulado < 0) v.Add("acumuladoMs", "El acumulado no puede ser negativo.");
        var pausas = JsonColumn.Escribir(v, "pausas", request.Pausas, JsonValueKind.Array, "[]");
        var iniciadoEn = InstanteOpcional(v, "iniciadoEn", request.IniciadoEn);
        var reanudadoEn = InstanteOpcional(v, "reanudadoEn", request.ReanudadoEn);
        var ultimaPausaEn = InstanteOpcional(v, "ultimaPausaEn", request.UltimaPausaEn);
        if (!v.IsValid) return v.ToProblem();

        var ahora = DateTime.UtcNow;
        var fatiga = await db.Fatiga.FirstOrDefaultAsync(f => f.UsuarioId == userId && f.Fecha == fecha);
        if (fatiga is null)
        {
            fatiga = new Fatiga { UsuarioId = userId, Fecha = fecha, IniciadoEn = iniciadoEn ?? ahora };
            db.Fatiga.Add(fatiga);
        }

        fatiga.AcumuladoMs = acumulado;
        fatiga.Corriendo = request.Corriendo ?? false;
        fatiga.ReanudadoEn = reanudadoEn;
        fatiga.UltimaPausaEn = ultimaPausaEn;
        fatiga.Pausas = pausas;
        fatiga.UpdatedAt = ahora;
        await db.SaveChangesAsync();
        return Results.Ok(FatigaResponse.From(fatiga));
    }

    // -------------------------------------------------------------- puntajes --

    private static async Task<IResult> ListarPuntajes(Guid userId, IQFleetDbContext db, DateOnly? desde, DateOnly? hasta)
    {
        var query = db.Puntajes.AsNoTracking().Where(p => p.UsuarioId == userId);
        if (desde is not null) query = query.Where(p => p.Fecha >= desde);
        if (hasta is not null) query = query.Where(p => p.Fecha <= hasta);
        var lista = await query.OrderByDescending(p => p.Fecha).ToListAsync();
        return Results.Ok(lista.Select(PuntajeResponse.From));
    }

    private static async Task<IResult> ObtenerPuntaje(Guid userId, DateOnly fecha, IQFleetDbContext db)
    {
        var puntaje = await db.Puntajes.AsNoTracking().FirstOrDefaultAsync(p => p.UsuarioId == userId && p.Fecha == fecha);
        return puntaje is null ? SinRegistro("puntaje", fecha) : Results.Ok(PuntajeResponse.From(puntaje));
    }

    private static async Task<IResult> GuardarPuntaje(Guid userId, DateOnly fecha, PuntajeRequest request, IQFleetDbContext db)
    {
        if (!await db.Usuarios.AnyAsync(u => u.Id == userId)) return UsuarioNoEncontrado(userId);

        var v = new Validation();
        var eventos = JsonColumn.Escribir(v, "eventos", request.Eventos, JsonValueKind.Object, "{}");
        var excesos = request.Excesos ?? 0;
        var puntos = request.Puntaje ?? 100;
        if (excesos < 0) v.Add("excesos", "Los excesos no pueden ser negativos.");
        if (puntos is < 0 or > 100) v.Add("puntaje", "El puntaje debe estar entre 0 y 100.");
        if (!v.IsValid) return v.ToProblem();

        var puntaje = await db.Puntajes.FirstOrDefaultAsync(p => p.UsuarioId == userId && p.Fecha == fecha);
        if (puntaje is null)
        {
            puntaje = new Puntaje { UsuarioId = userId, Fecha = fecha };
            db.Puntajes.Add(puntaje);
        }

        puntaje.Eventos = eventos;
        puntaje.Excesos = excesos;
        puntaje.Puntos = puntos;
        puntaje.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Results.Ok(PuntajeResponse.From(puntaje));
    }

    /// <summary>Cuenta hacia atrás los días consecutivos con puntaje registrado y sin excesoGrave.</summary>
    private static async Task<IResult> Racha(Guid userId, IQFleetDbContext db)
    {
        var dias = await db.Puntajes.AsNoTracking()
            .Where(p => p.UsuarioId == userId)
            .OrderByDescending(p => p.Fecha)
            .Select(p => new { p.Fecha, p.Eventos })
            .Take(366)
            .ToListAsync();

        var racha = 0;
        DateOnly? esperado = null;
        foreach (var dia in dias)
        {
            if (esperado is not null && dia.Fecha != esperado) break;
            var graves = JsonNode.Parse(dia.Eventos)?["excesoGrave"]?.GetValue<int>() ?? 0;
            if (graves > 0) break;
            racha++;
            esperado = dia.Fecha.AddDays(-1);
        }
        return Results.Ok(new RachaResponse(userId.ToString(), racha));
    }

    // ------------------------------------------------------------ recorridos --

    private static async Task<IResult> ObtenerRecorrido(Guid userId, DateOnly fecha, IQFleetDbContext db)
    {
        var recorrido = await db.Recorridos.AsNoTracking().FirstOrDefaultAsync(r => r.UsuarioId == userId && r.Fecha == fecha);
        return recorrido is null ? SinRegistro("recorrido", fecha) : Results.Ok(RecorridoResponse.From(recorrido));
    }

    private static async Task<IResult> GuardarRecorrido(Guid userId, DateOnly fecha, RecorridoRequest request, IQFleetDbContext db)
    {
        if (!await db.Usuarios.AnyAsync(u => u.Id == userId)) return UsuarioNoEncontrado(userId);

        var v = new Validation();
        var puntos = JsonColumn.Escribir(v, "puntos", request.Puntos, JsonValueKind.Array, "[]");
        if (request.Puntos is { ValueKind: JsonValueKind.Array } arreglo && arreglo.GetArrayLength() > MaxPuntos)
            v.Add("puntos", $"Máximo {MaxPuntos} puntos por día.");
        var kilometros = request.Kilometros ?? 0;
        if (kilometros < 0) v.Add("kilometros", "Los kilómetros no pueden ser negativos.");
        var placa = await ValidarPlaca(v, request.Placa, db);
        if (!v.IsValid) return v.ToProblem();

        var recorrido = await ObtenerOCrear(db, userId, fecha);
        recorrido.Puntos = puntos;
        recorrido.Kilometros = Math.Round(kilometros, 2);
        recorrido.Placa = placa ?? recorrido.Placa;
        recorrido.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Results.Ok(RecorridoResponse.From(recorrido));
    }

    private static async Task<IResult> AgregarPunto(Guid userId, DateOnly fecha, PuntoRequest request, IQFleetDbContext db)
    {
        if (!await db.Usuarios.AnyAsync(u => u.Id == userId)) return UsuarioNoEncontrado(userId);

        var v = new Validation();
        if (request.Lat is not (>= -90 and <= 90)) v.Add("lat", "Latitud inválida.");
        if (request.Lng is not (>= -180 and <= 180)) v.Add("lng", "Longitud inválida.");
        var placa = await ValidarPlaca(v, request.Placa, db);
        if (!v.IsValid) return v.ToProblem();

        var recorrido = await ObtenerOCrear(db, userId, fecha);
        recorrido.Placa = placa ?? recorrido.Placa;

        // Lecturas de baja precisión no se guardan (generan saltos falsos en la estela).
        if (request.Accuracy is null || request.Accuracy <= PrecisionMaximaM)
        {
            var puntos = JsonNode.Parse(recorrido.Puntos)?.AsArray() ?? [];
            var nuevo = new JsonObject
            {
                ["lat"] = request.Lat,
                ["lng"] = request.Lng,
                ["accuracy"] = request.Accuracy,
                ["timestamp"] = request.Timestamp ?? DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            };

            if (puntos.Count > 0 && puntos[^1] is JsonObject ultimo)
            {
                var km = DistanciaKm(ultimo["lat"]!.GetValue<double>(), ultimo["lng"]!.GetValue<double>(), request.Lat!.Value, request.Lng!.Value);
                recorrido.Kilometros = Math.Round(recorrido.Kilometros + (decimal)km, 2);
            }

            puntos.Add(nuevo);
            while (puntos.Count > MaxPuntos) puntos.RemoveAt(0);
            recorrido.Puntos = puntos.ToJsonString();
            recorrido.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync();
        return Results.Ok(RecorridoResponse.From(recorrido));
    }

    private static async Task<Recorrido> ObtenerOCrear(IQFleetDbContext db, Guid userId, DateOnly fecha)
    {
        var recorrido = await db.Recorridos.FirstOrDefaultAsync(r => r.UsuarioId == userId && r.Fecha == fecha);
        if (recorrido is not null) return recorrido;

        recorrido = new Recorrido { UsuarioId = userId, Fecha = fecha, UpdatedAt = DateTime.UtcNow };
        db.Recorridos.Add(recorrido);
        return recorrido;
    }

    /// <summary>Haversine, igual que geoUtils.js.</summary>
    private static double DistanciaKm(double lat1, double lng1, double lat2, double lng2)
    {
        const double radioTierraKm = 6371;
        static double Rad(double grados) => grados * Math.PI / 180;
        var dLat = Rad(lat2 - lat1);
        var dLng = Rad(lng2 - lng1);
        var h = Math.Pow(Math.Sin(dLat / 2), 2) + Math.Cos(Rad(lat1)) * Math.Cos(Rad(lat2)) * Math.Pow(Math.Sin(dLng / 2), 2);
        return 2 * radioTierraKm * Math.Asin(Math.Sqrt(h));
    }

    // ------------------------------------------------------------- utilidades --

    private static async Task<string?> ValidarPlaca(Validation v, string? valor, IQFleetDbContext db)
    {
        var placa = Validation.Optional(valor)?.ToUpperInvariant();
        if (placa is not null && !await db.Vehiculos.AnyAsync(x => x.Placa == placa))
            v.Add("placa", $"El vehículo {placa} no existe.");
        return placa;
    }

    private static DateTime? InstanteOpcional(Validation v, string campo, string? valor)
    {
        if (string.IsNullOrWhiteSpace(valor)) return null;
        if (HoraColombia.TryParse(valor, out var utc)) return utc;
        v.Add(campo, "Fecha y hora inválida (ISO 8601).");
        return null;
    }

    private static async Task<IResult> Borrar<T>(IQueryable<T> query) =>
        await query.ExecuteDeleteAsync() == 0
            ? Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "No encontrado", detail: "No hay registro para esa fecha.")
            : Results.NoContent();

    private static IResult SinRegistro(string que, DateOnly fecha) =>
        Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "No encontrado", detail: $"No hay {que} para el {fecha:yyyy-MM-dd}.");

    private static IResult UsuarioNoEncontrado(Guid id) =>
        Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "No encontrado", detail: $"Usuario {id} no encontrado");
}
