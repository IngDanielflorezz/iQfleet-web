using IQFleet.Api.Common;
using IQFleet.Api.Data;
using IQFleet.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace IQFleet.Api.Features.Mantenimiento;

public record PlanRequest(string? Placa, string? Tarea, int? CadaKm, int? CadaDias, int? UltimoKm, string? UltimaFecha);

public record PlanResponse(
    Guid Id, string Placa, string Tarea, int? CadaKm, int? CadaDias, int? UltimoKm, DateOnly? UltimaFecha,
    DateTime CreatedAt, DateTime UpdatedAt)
{
    public static PlanResponse From(PlanMantenimiento p) =>
        new(p.Id, p.Placa, p.Tarea, p.CadaKm, p.CadaDias, p.UltimoKm, p.UltimaFecha, p.CreatedAt, p.UpdatedAt);
}

/// <summary>Abre una orden. Con planId, la descripción por defecto es la tarea del plan.</summary>
public record AbrirOrdenRequest(string? Placa, string? Tipo, string? PlanId, string? Descripcion, string? FechaApertura, string? Observaciones);

/// <summary>Cierra una orden. Si costo > 0 se registra el egreso en Finanzas con medioPago y factura.</summary>
public record CerrarOrdenRequest(string? FechaCierre, int? KmCierre, decimal? Costo, string? Taller, string? MedioPago, string? Factura, string? Observaciones);

public record OrdenResponse(
    Guid Id, string Placa, string Tipo, string PlanId, string Descripcion, string Estado,
    DateOnly FechaApertura, DateOnly? FechaCierre, int KmApertura, int? KmCierre, decimal? Costo,
    string Taller, string Observaciones, string MovimientoId, DateTime CreatedAt, DateTime UpdatedAt)
{
    public static OrdenResponse From(OrdenMantenimiento o) => new(
        o.Id, o.Placa, o.Tipo, o.PlanId?.ToString() ?? string.Empty, o.Descripcion, o.Estado,
        o.FechaApertura, o.FechaCierre, o.KmApertura, o.KmCierre, o.Costo,
        o.Taller ?? string.Empty, o.Observaciones ?? string.Empty, o.MovimientoId?.ToString() ?? string.Empty,
        o.CreatedAt, o.UpdatedAt);
}

public static class MantenimientoEndpoints
{
    public static RouteGroupBuilder MapMantenimiento(this RouteGroupBuilder api)
    {
        var group = api.MapGroup("/mantenimiento").WithTags("Mantenimiento");

        group.MapGet("/planes", ListarPlanes).WithSummary("Planes de mantenimiento (filtro opcional: placa)");
        group.MapPost("/planes", CrearPlan).WithSummary("Crea un plan (tarea cada X km y/o cada X días)");
        group.MapPut("/planes/{id:guid}", ActualizarPlan).WithSummary("Actualiza un plan");
        group.MapDelete("/planes/{id:guid}", EliminarPlan).WithSummary("Elimina un plan (sus órdenes se conservan)");

        group.MapGet("/ordenes", ListarOrdenes).WithSummary("Órdenes de mantenimiento, más recientes primero (filtros: placa, estado)");
        group.MapPost("/ordenes", AbrirOrden).WithSummary("Abre una orden y pone el vehículo en Mantenimiento");
        group.MapPost("/ordenes/{id:guid}/cerrar", CerrarOrden)
            .WithSummary("Cierra la orden: vehículo a Operativo, actualiza el plan y registra el egreso en Finanzas");
        group.MapDelete("/ordenes/{id:guid}", EliminarOrden).WithSummary("Anula una orden abierta (las cerradas son historial)");

        return api;
    }

    // ------------------------------------------------------------------ planes --

    private static async Task<IResult> ListarPlanes(IQFleetDbContext db, string? placa)
    {
        var query = db.PlanesMantenimiento.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(placa)) query = query.Where(p => p.Placa == placa.Trim().ToUpper());
        var planes = await query.OrderBy(p => p.Placa).ThenBy(p => p.Tarea).ToListAsync();
        return Results.Ok(planes.Select(PlanResponse.From));
    }

    private static async Task<IResult> CrearPlan(PlanRequest request, IQFleetDbContext db)
    {
        var plan = new PlanMantenimiento();
        var v = await AplicarPlan(request, plan, db, ignoreId: null);
        if (!v.IsValid) return v.ToProblem();

        plan.CreatedAt = plan.UpdatedAt = DateTime.UtcNow;
        db.PlanesMantenimiento.Add(plan);
        await db.SaveChangesAsync();
        return Results.Created($"/api/mantenimiento/planes/{plan.Id}", PlanResponse.From(plan));
    }

    private static async Task<IResult> ActualizarPlan(Guid id, PlanRequest request, IQFleetDbContext db)
    {
        var plan = await db.PlanesMantenimiento.FirstOrDefaultAsync(p => p.Id == id);
        if (plan is null) return NoEncontrado("Plan", id);

        var v = await AplicarPlan(request, plan, db, ignoreId: id);
        if (!v.IsValid) return v.ToProblem();

        plan.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Results.Ok(PlanResponse.From(plan));
    }

    private static async Task<IResult> EliminarPlan(Guid id, IQFleetDbContext db)
    {
        var eliminados = await db.PlanesMantenimiento.Where(p => p.Id == id).ExecuteDeleteAsync();
        return eliminados == 0 ? NoEncontrado("Plan", id) : Results.NoContent();
    }

    private static async Task<Validation> AplicarPlan(PlanRequest request, PlanMantenimiento plan, IQFleetDbContext db, Guid? ignoreId)
    {
        var v = new Validation();

        var placa = v.Required("placa", request.Placa, "Selecciona un vehículo.").ToUpperInvariant();
        if (!v.Has("placa") && !await db.Vehiculos.AnyAsync(x => x.Placa == placa))
            v.Add("placa", $"El vehículo {placa} no existe.");

        var tarea = v.Required("tarea", request.Tarea, "La tarea es obligatoria.");
        if (tarea.Length > 60) v.Add("tarea", "Máximo 60 caracteres.");

        if (request.CadaKm is null && request.CadaDias is null)
            v.Add("cadaKm", "Indica cada cuántos km, cada cuántos días o ambos.");
        if (request.CadaKm is <= 0) v.Add("cadaKm", "Debe ser mayor a 0.");
        if (request.CadaDias is <= 0) v.Add("cadaDias", "Debe ser mayor a 0.");
        if (request.UltimoKm is < 0) v.Add("ultimoKm", "No puede ser negativo.");

        var ultimaFecha = v.OptionalDate("ultimaFecha", request.UltimaFecha, "Fecha inválida.");
        if (ultimaFecha > HoraColombia.Hoy()) v.Add("ultimaFecha", "No puede ser una fecha futura.");

        if (!v.Has("placa") && !v.Has("tarea") &&
            await db.PlanesMantenimiento.AnyAsync(p => p.Id != ignoreId && p.Placa == placa && p.Tarea.ToLower() == tarea.ToLower()))
            v.Add("tarea", $"{placa} ya tiene un plan para \"{tarea}\".");

        if (v.IsValid)
        {
            plan.Placa = placa;
            plan.Tarea = tarea;
            plan.CadaKm = request.CadaKm;
            plan.CadaDias = request.CadaDias;
            plan.UltimoKm = request.UltimoKm;
            plan.UltimaFecha = ultimaFecha;
        }
        return v;
    }

    // ----------------------------------------------------------------- órdenes --

    private static async Task<IResult> ListarOrdenes(IQFleetDbContext db, string? placa, string? estado)
    {
        var query = db.OrdenesMantenimiento.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(placa)) query = query.Where(o => o.Placa == placa.Trim().ToUpper());
        if (!string.IsNullOrWhiteSpace(estado)) query = query.Where(o => o.Estado == estado);
        var ordenes = await query.OrderByDescending(o => o.FechaApertura).ThenByDescending(o => o.CreatedAt).ToListAsync();
        return Results.Ok(ordenes.Select(OrdenResponse.From));
    }

    private static async Task<IResult> AbrirOrden(AbrirOrdenRequest request, IQFleetDbContext db)
    {
        var v = new Validation();

        var placa = v.Required("placa", request.Placa, "Selecciona un vehículo.").ToUpperInvariant();
        var vehiculo = v.Has("placa") ? null : await db.Vehiculos.FirstOrDefaultAsync(x => x.Placa == placa);
        if (!v.Has("placa") && vehiculo is null) v.Add("placa", $"El vehículo {placa} no existe.");
        if (vehiculo is not null && await db.OrdenesMantenimiento.AnyAsync(o => o.Placa == placa && o.Estado == EstadosOrden.Abierta))
            v.Add("placa", $"{placa} ya tiene una orden abierta. Ciérrala antes de abrir otra.");

        var tipo = v.OneOf("tipo", request.Tipo, TiposMantenimiento.Preventivo, TiposMantenimiento.Todos, "Tipo inválido (Preventivo o Correctivo).");

        PlanMantenimiento? plan = null;
        if (!string.IsNullOrWhiteSpace(request.PlanId))
        {
            plan = Guid.TryParse(request.PlanId, out var planId)
                ? await db.PlanesMantenimiento.AsNoTracking().FirstOrDefaultAsync(p => p.Id == planId)
                : null;
            if (plan is null) v.Add("planId", "El plan seleccionado no existe.");
            else if (plan.Placa != placa) v.Add("planId", $"El plan no pertenece al vehículo {placa}.");
        }

        var descripcion = Validation.Optional(request.Descripcion) ?? plan?.Tarea;
        if (descripcion is null) v.Add("descripcion", "Describe el trabajo a realizar.");
        else if (descripcion.Length > 120) v.Add("descripcion", "Máximo 120 caracteres.");

        var fechaApertura = string.IsNullOrWhiteSpace(request.FechaApertura)
            ? HoraColombia.Hoy()
            : v.Date("fechaApertura", request.FechaApertura, "Fecha inválida.");
        if (fechaApertura > HoraColombia.Hoy()) v.Add("fechaApertura", "No puede ser una fecha futura.");

        var observaciones = Validation.Optional(request.Observaciones);
        if (observaciones?.Length > 250) v.Add("observaciones", "Máximo 250 caracteres.");

        if (!v.IsValid) return v.ToProblem();

        var ahora = DateTime.UtcNow;
        var orden = new OrdenMantenimiento
        {
            Placa = placa,
            Tipo = tipo,
            PlanId = plan?.Id,
            Descripcion = descripcion!,
            Estado = EstadosOrden.Abierta,
            FechaApertura = fechaApertura,
            KmApertura = vehiculo!.Kilometraje,
            Observaciones = observaciones,
            CreatedAt = ahora,
            UpdatedAt = ahora,
        };
        db.OrdenesMantenimiento.Add(orden);

        // El vehículo queda en taller: las reglas de despacho ya no le asignan despachos.
        vehiculo.Estado = VehiculoEstados.Mantenimiento;
        vehiculo.UpdatedAt = ahora;

        await db.SaveChangesAsync();
        return Results.Created($"/api/mantenimiento/ordenes/{orden.Id}", OrdenResponse.From(orden));
    }

    private static async Task<IResult> CerrarOrden(Guid id, CerrarOrdenRequest request, IQFleetDbContext db)
    {
        var orden = await db.OrdenesMantenimiento.FirstOrDefaultAsync(o => o.Id == id);
        if (orden is null) return NoEncontrado("Orden", id);

        var v = new Validation();
        if (orden.Estado != EstadosOrden.Abierta) v.Add("estado", "La orden ya está cerrada.");

        var fechaCierre = string.IsNullOrWhiteSpace(request.FechaCierre)
            ? HoraColombia.Hoy()
            : v.Date("fechaCierre", request.FechaCierre, "Fecha inválida.");
        if (!v.Has("fechaCierre"))
        {
            if (fechaCierre < orden.FechaApertura) v.Add("fechaCierre", "No puede ser anterior a la apertura.");
            else if (fechaCierre > HoraColombia.Hoy()) v.Add("fechaCierre", "No puede ser una fecha futura.");
        }

        var vehiculo = await db.Vehiculos.Include(x => x.Conductor).FirstAsync(x => x.Placa == orden.Placa);
        var kmCierre = request.KmCierre ?? Math.Max(vehiculo.Kilometraje, orden.KmApertura);
        if (kmCierre < orden.KmApertura) v.Add("kmCierre", $"No puede ser menor al de apertura ({Km(orden.KmApertura)} km).");

        var costo = request.Costo ?? 0;
        if (costo < 0) v.Add("costo", "No puede ser negativo.");
        var medioPago = v.OneOf("medioPago", request.MedioPago, MediosPago.Transferencia, MediosPago.Todos, "Medio de pago inválido.");

        var taller = Validation.Optional(request.Taller);
        if (taller?.Length > 80) v.Add("taller", "Máximo 80 caracteres.");
        var factura = Validation.Optional(request.Factura);
        if (factura?.Length > 40) v.Add("factura", "Máximo 40 caracteres.");
        var observaciones = Validation.Optional(request.Observaciones) ?? orden.Observaciones;
        if (observaciones?.Length > 250) v.Add("observaciones", "Máximo 250 caracteres.");

        if (!v.IsValid) return v.ToProblem();

        var ahora = DateTime.UtcNow;

        // 1. Egreso en Finanzas (solo si hubo costo): así el margen refleja el gasto de taller.
        Movimiento? egreso = null;
        if (costo > 0)
        {
            egreso = new Movimiento
            {
                Tipo = MovimientoTipos.Egreso,
                Concepto = TiposMantenimiento.ConceptoFinanzas(orden.Tipo),
                Placa = orden.Placa,
                Conductor = vehiculo.Conductor?.Nombre,
                Factura = factura,
                MedioPago = medioPago,
                Monto = costo,
                Km = kmCierre,
                Fecha = fechaCierre,
                CreatedAt = ahora,
                UpdatedAt = ahora,
            };
            db.Movimientos.Add(egreso);
        }

        // 2. La orden pasa al historial.
        orden.Estado = EstadosOrden.Cerrada;
        orden.FechaCierre = fechaCierre;
        orden.KmCierre = kmCierre;
        orden.Costo = costo;
        orden.Taller = taller;
        orden.Observaciones = observaciones;
        orden.Movimiento = egreso;
        orden.UpdatedAt = ahora;

        // 3. El vehículo vuelve a operar y su odómetro nunca retrocede.
        vehiculo.Estado = VehiculoEstados.Operativo;
        vehiculo.Kilometraje = Math.Max(vehiculo.Kilometraje, kmCierre);
        vehiculo.UpdatedAt = ahora;

        // 4. El plan reinicia su contador desde este servicio.
        if (orden.PlanId is { } planId && await db.PlanesMantenimiento.FirstOrDefaultAsync(p => p.Id == planId) is { } plan)
        {
            plan.UltimoKm = kmCierre;
            plan.UltimaFecha = fechaCierre;
            plan.UpdatedAt = ahora;
        }

        await db.SaveChangesAsync(); // todo en una sola transacción
        return Results.Ok(OrdenResponse.From(orden));
    }

    private static async Task<IResult> EliminarOrden(Guid id, IQFleetDbContext db)
    {
        var orden = await db.OrdenesMantenimiento.FirstOrDefaultAsync(o => o.Id == id);
        if (orden is null) return NoEncontrado("Orden", id);
        if (orden.Estado == EstadosOrden.Cerrada)
            return Results.Problem(statusCode: StatusCodes.Status409Conflict, title: "Orden cerrada",
                detail: "Las órdenes cerradas forman parte del historial y de Finanzas; no se pueden eliminar.");

        // Anular una orden abierta devuelve el vehículo a Operativo (lo puso en Mantenimiento al abrirla).
        var vehiculo = await db.Vehiculos.FirstAsync(x => x.Placa == orden.Placa);
        if (vehiculo.Estado == VehiculoEstados.Mantenimiento)
        {
            vehiculo.Estado = VehiculoEstados.Operativo;
            vehiculo.UpdatedAt = DateTime.UtcNow;
        }
        db.OrdenesMantenimiento.Remove(orden);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    /// <summary>Miles con punto, como se escriben en Colombia (128.970), sin depender de la cultura del servidor.</summary>
    private static string Km(int km) => km.ToString("#,0", System.Globalization.CultureInfo.InvariantCulture).Replace(',', '.');

    private static IResult NoEncontrado(string entidad, Guid id) =>
        Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "No encontrado", detail: $"{entidad} {id} no encontrado");
}
