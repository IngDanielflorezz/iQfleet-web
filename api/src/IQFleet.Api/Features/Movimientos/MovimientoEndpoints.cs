using IQFleet.Api.Common;
using IQFleet.Api.Data;
using IQFleet.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace IQFleet.Api.Features.Movimientos;

/// <summary>Cuerpo que envía MovimientoForm.jsx (mismos nombres de campo que finanzaService.js).</summary>
public record MovimientoRequest(
    string? Tipo,
    string? Concepto,
    string? Placa,
    string? Conductor,
    string? Factura,
    string? MedioPago,
    decimal? Monto,
    int? Km,
    string? Fecha,
    string? ComprobanteNombre,
    string? ComprobanteTipo);

public record MovimientoResponse(
    Guid Id,
    string Tipo,
    string Concepto,
    string Placa,
    string Conductor,
    string Factura,
    string MedioPago,
    decimal Monto,
    int? Km,
    DateOnly Fecha,
    string ComprobanteNombre,
    string ComprobanteTipo,
    DateTime CreatedAt,
    DateTime UpdatedAt)
{
    public static MovimientoResponse From(Movimiento m) => new(
        m.Id, m.Tipo, m.Concepto, m.Placa ?? string.Empty, m.Conductor ?? string.Empty, m.Factura ?? string.Empty,
        m.MedioPago, m.Monto, m.Km, m.Fecha, m.ComprobanteNombre ?? string.Empty, m.ComprobanteTipo ?? string.Empty,
        m.CreatedAt, m.UpdatedAt);
}

public record ResumenFinancieroResponse(decimal Ingresos, decimal Egresos, decimal Balance, int Movimientos);

public static class MovimientoEndpoints
{
    private static readonly string[] TiposArchivo = ["image/png", "image/jpeg", "application/pdf"];

    public static RouteGroupBuilder MapMovimientos(this RouteGroupBuilder api)
    {
        var group = api.MapGroup("/movimientos").WithTags("Finanzas");

        group.MapGet("/", Listar).WithSummary("Lista movimientos, más recientes primero (filtros: tipo, placa, desde, hasta, q)");
        group.MapGet("/resumen", Resumen).WithSummary("Totales de ingresos, egresos y balance (filtros: placa, desde, hasta)");
        group.MapGet("/{id:guid}", Obtener).WithName("ObtenerMovimiento").WithSummary("Obtiene un movimiento por id");
        group.MapPost("/", Crear).WithSummary("Registra un ingreso o egreso");
        group.MapPut("/{id:guid}", Actualizar).WithSummary("Actualiza un movimiento");
        group.MapDelete("/{id:guid}", Eliminar).WithSummary("Elimina un movimiento");

        return api;
    }

    private static IQueryable<Movimiento> Filtrar(IQFleetDbContext db, string? tipo, string? placa, DateOnly? desde, DateOnly? hasta)
    {
        var query = db.Movimientos.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(tipo)) query = query.Where(m => m.Tipo == tipo);
        if (!string.IsNullOrWhiteSpace(placa)) query = query.Where(m => m.Placa == placa.Trim().ToUpper());
        if (desde is not null) query = query.Where(m => m.Fecha >= desde);
        if (hasta is not null) query = query.Where(m => m.Fecha <= hasta);
        return query;
    }

    private static async Task<IResult> Listar(IQFleetDbContext db, string? tipo, string? placa, DateOnly? desde, DateOnly? hasta, string? q)
    {
        var query = Filtrar(db, tipo, placa, desde, hasta);
        if (!string.IsNullOrWhiteSpace(q))
        {
            var termino = $"%{q.Trim()}%";
            query = query.Where(m =>
                EF.Functions.ILike(m.Concepto, termino) ||
                (m.Placa != null && EF.Functions.ILike(m.Placa, termino)) ||
                (m.Conductor != null && EF.Functions.ILike(m.Conductor, termino)) ||
                (m.Factura != null && EF.Functions.ILike(m.Factura, termino)));
        }

        var movimientos = await query.OrderByDescending(m => m.Fecha).ThenByDescending(m => m.CreatedAt).ToListAsync();
        return Results.Ok(movimientos.Select(MovimientoResponse.From));
    }

    private static async Task<IResult> Resumen(IQFleetDbContext db, string? placa, DateOnly? desde, DateOnly? hasta)
    {
        var totales = await Filtrar(db, null, placa, desde, hasta)
            .GroupBy(m => m.Tipo)
            .Select(g => new { Tipo = g.Key, Total = g.Sum(m => m.Monto), Cantidad = g.Count() })
            .ToListAsync();

        var ingresos = totales.Where(t => t.Tipo == MovimientoTipos.Ingreso).Sum(t => t.Total);
        var egresos = totales.Where(t => t.Tipo == MovimientoTipos.Egreso).Sum(t => t.Total);
        return Results.Ok(new ResumenFinancieroResponse(ingresos, egresos, ingresos - egresos, totales.Sum(t => t.Cantidad)));
    }

    private static async Task<IResult> Obtener(Guid id, IQFleetDbContext db)
    {
        var movimiento = await db.Movimientos.AsNoTracking().FirstOrDefaultAsync(m => m.Id == id);
        return movimiento is null ? NotFound(id) : Results.Ok(MovimientoResponse.From(movimiento));
    }

    private static async Task<IResult> Crear(MovimientoRequest request, IQFleetDbContext db)
    {
        var movimiento = new Movimiento();
        var v = await Aplicar(request, movimiento, db);
        if (!v.IsValid) return v.ToProblem();

        var ahora = DateTime.UtcNow;
        movimiento.CreatedAt = ahora;
        movimiento.UpdatedAt = ahora;
        db.Movimientos.Add(movimiento);
        await db.SaveChangesAsync();

        return Results.CreatedAtRoute("ObtenerMovimiento", new { id = movimiento.Id }, MovimientoResponse.From(movimiento));
    }

    private static async Task<IResult> Actualizar(Guid id, MovimientoRequest request, IQFleetDbContext db)
    {
        var movimiento = await db.Movimientos.FirstOrDefaultAsync(m => m.Id == id);
        if (movimiento is null) return NotFound(id);

        var v = await Aplicar(request, movimiento, db);
        if (!v.IsValid) return v.ToProblem();

        movimiento.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Results.Ok(MovimientoResponse.From(movimiento));
    }

    private static async Task<IResult> Eliminar(Guid id, IQFleetDbContext db)
    {
        var eliminados = await db.Movimientos.Where(m => m.Id == id).ExecuteDeleteAsync();
        return eliminados == 0 ? NotFound(id) : Results.NoContent();
    }

    /// <summary>Valida el request (mismas reglas que finanzaService.js) y lo copia a la entidad.</summary>
    private static async Task<Validation> Aplicar(MovimientoRequest request, Movimiento movimiento, IQFleetDbContext db)
    {
        var v = new Validation();

        var tipo = v.OneOf("tipo", request.Tipo, MovimientoTipos.Egreso, MovimientoTipos.Todos, "Tipo inválido (Ingreso o Egreso).");
        var concepto = v.Required("concepto", request.Concepto, "El concepto es obligatorio.");
        var fecha = v.Date("fecha", request.Fecha, "La fecha es obligatoria.");
        var medioPago = v.OneOf("medioPago", request.MedioPago, MediosPago.Transferencia, MediosPago.Todos, "Medio de pago inválido.");

        var monto = request.Monto ?? 0;
        if (monto <= 0) v.Add("monto", "El monto debe ser mayor a 0.");
        if (request.Km is < 0) v.Add("km", "El kilometraje no puede ser negativo.");

        var placa = Validation.Optional(request.Placa)?.ToUpperInvariant();
        if (placa is not null && !await db.Vehiculos.AnyAsync(x => x.Placa == placa))
            v.Add("placa", $"El vehículo {placa} no existe.");

        var comprobanteTipo = Validation.Optional(request.ComprobanteTipo);
        if (comprobanteTipo is not null && !TiposArchivo.Contains(comprobanteTipo))
            v.Add("comprobante", "Formato no permitido (usa PNG, JPG o PDF).");

        if (v.IsValid)
        {
            movimiento.Tipo = tipo;
            movimiento.Concepto = concepto;
            movimiento.Placa = placa;
            movimiento.Conductor = Validation.Optional(request.Conductor);
            movimiento.Factura = Validation.Optional(request.Factura);
            movimiento.MedioPago = medioPago;
            movimiento.Monto = monto;
            movimiento.Km = request.Km;
            movimiento.Fecha = fecha;
            movimiento.ComprobanteNombre = Validation.Optional(request.ComprobanteNombre) ?? movimiento.ComprobanteNombre;
            movimiento.ComprobanteTipo = comprobanteTipo ?? movimiento.ComprobanteTipo;
        }
        return v;
    }

    private static IResult NotFound(Guid id) =>
        Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "No encontrado", detail: $"Movimiento {id} no encontrado");
}
