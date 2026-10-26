using IQFleet.Api.Common;
using IQFleet.Api.Data;
using IQFleet.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace IQFleet.Api.Features.Despachos;

/// <summary>Cuerpo que envía ModalDespacho.jsx. fechaSalida es hora local ("2026-10-26T05:30").</summary>
public record DespachoRequest(
    string? Placa,
    string? Conductor,
    string? ConductorId,
    string? Origen,
    string? Destino,
    string? FechaSalida,
    string? Estado,
    decimal? ValorFlete,
    decimal? CostoOperativo,
    string? Observaciones);

public record DespachoResponse(
    Guid Id,
    string Placa,
    string Conductor,
    string ConductorId,
    string Origen,
    string Destino,
    string FechaSalida,
    string Estado,
    decimal ValorFlete,
    decimal CostoOperativo,
    string Observaciones,
    DateTime CreatedAt,
    DateTime UpdatedAt)
{
    public static DespachoResponse From(Despacho d) => new(
        d.Id, d.Placa, d.Conductor, d.ConductorId?.ToString() ?? string.Empty, d.Origen, d.Destino,
        HoraColombia.Formatear(d.FechaSalida), d.Estado, d.ValorFlete, d.CostoOperativo,
        d.Observaciones ?? string.Empty, d.CreatedAt, d.UpdatedAt);
}

public static class DespachoEndpoints
{
    private static readonly string[] EstadosActivos = [DespachoEstados.Programado, DespachoEstados.EnRuta];

    public static RouteGroupBuilder MapDespachos(this RouteGroupBuilder api)
    {
        var group = api.MapGroup("/despachos").WithTags("Despachos");

        group.MapGet("/", Listar).WithSummary("Lista despachos (filtros opcionales: estado, placa, desde, hasta, q)");
        group.MapGet("/{id:guid}", Obtener).WithName("ObtenerDespacho").WithSummary("Obtiene un despacho por id");
        group.MapPost("/", Crear).WithSummary("Programa un despacho");
        group.MapPut("/{id:guid}", Actualizar).WithSummary("Actualiza un despacho");
        group.MapDelete("/{id:guid}", Eliminar).WithSummary("Elimina un despacho");

        return api;
    }

    /// <param name="desde">Fecha local YYYY-MM-DD (inclusive) sobre fechaSalida.</param>
    /// <param name="hasta">Fecha local YYYY-MM-DD (inclusive) sobre fechaSalida.</param>
    private static async Task<IResult> Listar(IQFleetDbContext db, string? estado, string? placa, DateOnly? desde, DateOnly? hasta, string? q)
    {
        var query = db.Despachos.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(estado)) query = query.Where(d => d.Estado == estado);
        if (!string.IsNullOrWhiteSpace(placa)) query = query.Where(d => d.Placa == placa.Trim().ToUpper());
        if (desde is not null) query = query.Where(d => d.FechaSalida >= HoraColombia.InicioDiaUtc(desde.Value));
        if (hasta is not null) query = query.Where(d => d.FechaSalida < HoraColombia.InicioDiaUtc(hasta.Value.AddDays(1)));
        if (!string.IsNullOrWhiteSpace(q))
        {
            var termino = $"%{q.Trim()}%";
            query = query.Where(d =>
                EF.Functions.ILike(d.Placa, termino) ||
                EF.Functions.ILike(d.Conductor, termino) ||
                EF.Functions.ILike(d.Origen, termino) ||
                EF.Functions.ILike(d.Destino, termino));
        }

        var despachos = await query.OrderByDescending(d => d.FechaSalida).ToListAsync();
        return Results.Ok(despachos.Select(DespachoResponse.From));
    }

    private static async Task<IResult> Obtener(Guid id, IQFleetDbContext db)
    {
        var despacho = await db.Despachos.AsNoTracking().FirstOrDefaultAsync(d => d.Id == id);
        return despacho is null ? NotFound(id) : Results.Ok(DespachoResponse.From(despacho));
    }

    private static async Task<IResult> Crear(DespachoRequest request, IQFleetDbContext db)
    {
        var despacho = new Despacho();
        var v = await Aplicar(request, despacho, db, ignoreId: null);
        if (!v.IsValid) return v.ToProblem();

        var ahora = DateTime.UtcNow;
        despacho.CreatedAt = ahora;
        despacho.UpdatedAt = ahora;
        db.Despachos.Add(despacho);
        await db.SaveChangesAsync();

        return Results.CreatedAtRoute("ObtenerDespacho", new { id = despacho.Id }, DespachoResponse.From(despacho));
    }

    private static async Task<IResult> Actualizar(Guid id, DespachoRequest request, IQFleetDbContext db)
    {
        var despacho = await db.Despachos.FirstOrDefaultAsync(d => d.Id == id);
        if (despacho is null) return NotFound(id);

        var v = await Aplicar(request, despacho, db, ignoreId: id);
        if (!v.IsValid) return v.ToProblem();

        despacho.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Results.Ok(DespachoResponse.From(despacho));
    }

    private static async Task<IResult> Eliminar(Guid id, IQFleetDbContext db)
    {
        var eliminados = await db.Despachos.Where(d => d.Id == id).ExecuteDeleteAsync();
        return eliminados == 0 ? NotFound(id) : Results.NoContent();
    }

    /// <summary>Valida el request (mismas reglas que despachoService.js) y lo copia a la entidad.</summary>
    private static async Task<Validation> Aplicar(DespachoRequest request, Despacho despacho, IQFleetDbContext db, Guid? ignoreId)
    {
        var v = new Validation();

        var placa = v.Required("placa", request.Placa, "Selecciona un vehículo.").ToUpperInvariant();
        if (!v.Has("placa") && !await db.Vehiculos.AnyAsync(x => x.Placa == placa))
            v.Add("placa", $"El vehículo {placa} no existe.");

        // El conductor puede llegar por id (ficha) o por nombre; si llega el nombre se intenta enlazar la ficha.
        Conductor? ficha = null;
        if (!string.IsNullOrWhiteSpace(request.ConductorId))
        {
            ficha = Guid.TryParse(request.ConductorId, out var cid) ? await db.Conductores.FirstOrDefaultAsync(c => c.Id == cid) : null;
            if (ficha is null) v.Add("conductorId", "El conductor seleccionado no existe.");
        }
        var conductor = Validation.Optional(request.Conductor) ?? ficha?.Nombre ?? string.Empty;
        if (conductor.Length == 0) v.Add("conductor", "El conductor es obligatorio.");
        ficha ??= conductor.Length > 0 ? await db.Conductores.FirstOrDefaultAsync(c => c.Nombre == conductor) : null;

        var origen = v.Required("origen", request.Origen, "El origen es obligatorio.");
        var destino = v.Required("destino", request.Destino, "El destino es obligatorio.");
        var fechaSalida = v.DateTimeLocal("fechaSalida", request.FechaSalida, "La fecha de salida es obligatoria.");
        var estado = v.OneOf("estado", request.Estado, DespachoEstados.Programado, DespachoEstados.Todos, "Estado inválido.");

        var flete = request.ValorFlete ?? 0;
        var costo = request.CostoOperativo ?? 0;
        if (flete < 0) v.Add("valorFlete", "El flete no puede ser negativo.");
        if (costo < 0) v.Add("costoOperativo", "El costo no puede ser negativo.");

        var observaciones = Validation.Optional(request.Observaciones);
        if (observaciones?.Length > 250) v.Add("observaciones", "Máximo 250 caracteres.");

        // Un vehículo no puede tener dos despachos activos el mismo día (hora local).
        if (!v.Has("placa") && !v.Has("fechaSalida") && EstadosActivos.Contains(estado))
        {
            var dia = DateOnly.FromDateTime(fechaSalida.Add(HoraColombia.Offset));
            var inicio = HoraColombia.InicioDiaUtc(dia);
            var fin = HoraColombia.InicioDiaUtc(dia.AddDays(1));
            var choque = await db.Despachos.AnyAsync(d =>
                d.Id != ignoreId && d.Placa == placa &&
                d.FechaSalida >= inicio && d.FechaSalida < fin &&
                EstadosActivos.Contains(d.Estado));
            if (choque) v.Add("placa", $"El vehículo {placa} ya tiene un despacho activo ese día.");
        }

        if (v.IsValid)
        {
            despacho.Placa = placa;
            despacho.Conductor = conductor;
            despacho.ConductorId = ficha?.Id;
            despacho.Origen = origen;
            despacho.Destino = destino;
            despacho.FechaSalida = fechaSalida;
            despacho.Estado = estado;
            despacho.ValorFlete = flete;
            despacho.CostoOperativo = costo;
            despacho.Observaciones = observaciones;
        }
        return v;
    }

    private static IResult NotFound(Guid id) =>
        Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "No encontrado", detail: $"Despacho {id} no encontrado");
}
