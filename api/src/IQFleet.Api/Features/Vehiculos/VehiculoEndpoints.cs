using System.Text.RegularExpressions;
using IQFleet.Api.Common;
using IQFleet.Api.Data;
using IQFleet.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace IQFleet.Api.Features.Vehiculos;

/// <summary>Cuerpo que envía VehiculoModal.jsx. "Id" es la placa (así la maneja el front).</summary>
public record VehiculoRequest(
    string? Id,
    string? Ciudad,
    string? Marca,
    string? Modelo,
    string? Tipo,
    int? Anio,
    string? ConductorId,
    int? Kilometraje,
    string? Estado,
    string? SoatVence,
    string? RtmVence);

public record VehiculoResponse(
    string Id,
    string Ciudad,
    string Marca,
    string Modelo,
    string Tipo,
    int Anio,
    string ConductorId,
    string Conductor,
    int Kilometraje,
    string Estado,
    DateOnly SoatVence,
    DateOnly RtmVence,
    DateTime CreatedAt,
    DateTime UpdatedAt)
{
    public static VehiculoResponse From(Vehiculo v) => new(
        v.Placa, v.Ciudad, v.Marca, v.Modelo, v.Tipo, v.Anio,
        v.ConductorId?.ToString() ?? string.Empty,
        v.Conductor?.Nombre ?? "Sin asignar",
        v.Kilometraje, v.Estado, v.SoatVence, v.RtmVence, v.CreatedAt, v.UpdatedAt);
}

public static partial class VehiculoEndpoints
{
    public static RouteGroupBuilder MapVehiculos(this RouteGroupBuilder api)
    {
        var group = api.MapGroup("/vehiculos").WithTags("Vehículos");

        group.MapGet("/", Listar).WithSummary("Lista la flota (filtros opcionales: estado, q)");
        group.MapGet("/{placa}", Obtener).WithName("ObtenerVehiculo").WithSummary("Obtiene un vehículo por placa");
        group.MapPost("/", Crear).WithSummary("Registra un vehículo");
        group.MapPut("/{placa}", Actualizar).WithSummary("Actualiza un vehículo (la placa no cambia)");
        group.MapDelete("/{placa}", Eliminar).WithSummary("Elimina un vehículo");

        return api;
    }

    private static async Task<IResult> Listar(IQFleetDbContext db, string? estado, string? q)
    {
        var query = db.Vehiculos.AsNoTracking().Include(v => v.Conductor).AsQueryable();
        if (!string.IsNullOrWhiteSpace(estado)) query = query.Where(v => v.Estado == estado);
        if (!string.IsNullOrWhiteSpace(q))
        {
            var termino = $"%{q.Trim()}%";
            query = query.Where(v =>
                EF.Functions.ILike(v.Placa, termino) ||
                EF.Functions.ILike(v.Marca, termino) ||
                EF.Functions.ILike(v.Modelo, termino) ||
                (v.Conductor != null && EF.Functions.ILike(v.Conductor.Nombre, termino)));
        }

        var vehiculos = await query.OrderBy(v => v.Placa).ToListAsync();
        return Results.Ok(vehiculos.Select(VehiculoResponse.From));
    }

    private static async Task<IResult> Obtener(string placa, IQFleetDbContext db)
    {
        var vehiculo = await Buscar(db, placa).AsNoTracking().FirstOrDefaultAsync();
        return vehiculo is null ? NotFound(placa) : Results.Ok(VehiculoResponse.From(vehiculo));
    }

    private static async Task<IResult> Crear(VehiculoRequest request, IQFleetDbContext db)
    {
        var v = new Validation();
        var placa = v.Required("id", request.Id, "La placa es obligatoria.").ToUpperInvariant();
        if (!v.Has("id") && !PlacaRegex().IsMatch(placa))
            v.Add("id", "Formato de placa inválido (ej. UVP-123).");
        if (!v.Has("id") && await db.Vehiculos.AnyAsync(x => x.Placa == placa))
            v.Add("id", "Ya existe un vehículo con esa placa.");

        var vehiculo = new Vehiculo { Placa = placa };
        await Aplicar(request, vehiculo, db, v);
        if (!v.IsValid) return v.ToProblem();

        var ahora = DateTime.UtcNow;
        vehiculo.CreatedAt = ahora;
        vehiculo.UpdatedAt = ahora;
        db.Vehiculos.Add(vehiculo);
        await db.SaveChangesAsync();
        await db.Entry(vehiculo).Reference(x => x.Conductor).LoadAsync();

        return Results.CreatedAtRoute("ObtenerVehiculo", new { placa = vehiculo.Placa }, VehiculoResponse.From(vehiculo));
    }

    private static async Task<IResult> Actualizar(string placa, VehiculoRequest request, IQFleetDbContext db)
    {
        var vehiculo = await Buscar(db, placa).FirstOrDefaultAsync();
        if (vehiculo is null) return NotFound(placa);

        var v = new Validation();
        await Aplicar(request, vehiculo, db, v);
        if (!v.IsValid) return v.ToProblem();

        vehiculo.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        await db.Entry(vehiculo).Reference(x => x.Conductor).LoadAsync();
        return Results.Ok(VehiculoResponse.From(vehiculo));
    }

    private static async Task<IResult> Eliminar(string placa, IQFleetDbContext db)
    {
        // despachos y movimientos referencian la placa con ON DELETE RESTRICT (historial financiero).
        var normalizada = placa.Trim().ToUpperInvariant();
        if (await db.Despachos.AnyAsync(d => d.Placa == normalizada) || await db.Movimientos.AnyAsync(m => m.Placa == normalizada))
            return Results.Problem(
                detail: $"El vehículo {normalizada} tiene despachos o movimientos registrados; cámbialo a \"Fuera de servicio\" en lugar de eliminarlo.",
                statusCode: StatusCodes.Status409Conflict);

        var eliminados = await Buscar(db, placa).ExecuteDeleteAsync();
        return eliminados == 0 ? NotFound(placa) : Results.NoContent();
    }

    private static IQueryable<Vehiculo> Buscar(IQFleetDbContext db, string placa)
    {
        var normalizada = placa.Trim().ToUpperInvariant();
        return db.Vehiculos.Include(x => x.Conductor).Where(x => x.Placa == normalizada);
    }

    /// <summary>Valida los campos editables (mismas reglas que vehiculoService.js) y los copia a la entidad.</summary>
    private static async Task Aplicar(VehiculoRequest request, Vehiculo vehiculo, IQFleetDbContext db, Validation v)
    {
        var marca = v.Required("marca", request.Marca, "La marca es obligatoria.");
        var modelo = v.Required("modelo", request.Modelo, "El modelo es obligatorio.");
        var ciudad = v.Required("ciudad", request.Ciudad, "La ciudad es obligatoria.").ToUpperInvariant();
        var tipo = string.IsNullOrWhiteSpace(request.Tipo) ? "Bus" : request.Tipo.Trim();

        var anioMaximo = DateTime.UtcNow.Year + 1;
        var anio = request.Anio ?? 0;
        if (anio < 1980 || anio > anioMaximo) v.Add("anio", $"Año inválido (entre 1980 y {anioMaximo}).");

        var kilometraje = request.Kilometraje ?? 0;
        if (kilometraje < 0) v.Add("kilometraje", "El kilometraje no puede ser negativo.");

        var estado = string.IsNullOrWhiteSpace(request.Estado) ? VehiculoEstados.Operativo : request.Estado.Trim();
        if (!VehiculoEstados.Todos.Contains(estado)) v.Add("estado", "Estado inválido.");

        var soat = v.Date("soatVence", request.SoatVence, "La fecha de SOAT es obligatoria.");
        var rtm = v.Date("rtmVence", request.RtmVence, "La fecha de RTM es obligatoria.");

        Guid? conductorId = null;
        if (!string.IsNullOrWhiteSpace(request.ConductorId))
        {
            if (!Guid.TryParse(request.ConductorId, out var id) || !await db.Conductores.AnyAsync(c => c.Id == id))
                v.Add("conductorId", "El conductor seleccionado no existe.");
            else
                conductorId = id;
        }

        if (!v.IsValid) return;

        vehiculo.Marca = marca;
        vehiculo.Modelo = modelo;
        vehiculo.Ciudad = ciudad;
        vehiculo.Tipo = tipo;
        vehiculo.Anio = anio;
        vehiculo.Kilometraje = kilometraje;
        vehiculo.Estado = estado;
        vehiculo.SoatVence = soat;
        vehiculo.RtmVence = rtm;
        vehiculo.ConductorId = conductorId;
    }

    private static IResult NotFound(string placa) =>
        Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "No encontrado", detail: $"Vehículo {placa} no encontrado");

    [GeneratedRegex(@"^[A-Z0-9]{3}-?[A-Z0-9]{2,3}$")]
    private static partial Regex PlacaRegex();
}
