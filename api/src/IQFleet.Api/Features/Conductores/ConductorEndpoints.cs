using System.Text.RegularExpressions;
using IQFleet.Api.Common;
using IQFleet.Api.Data;
using IQFleet.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace IQFleet.Api.Features.Conductores;

public record ConductorRequest(
    string? Nombre,
    string? Cedula,
    string? CategoriaLicencia,
    string? LicenciaVence,
    string? Telefono,
    string? Estado);

public record ConductorResponse(
    Guid Id,
    string Nombre,
    string Cedula,
    string CategoriaLicencia,
    DateOnly LicenciaVence,
    string Telefono,
    string Estado,
    DateTime CreatedAt,
    DateTime UpdatedAt)
{
    public static ConductorResponse From(Conductor c) => new(
        c.Id, c.Nombre, c.Cedula, c.CategoriaLicencia, c.LicenciaVence,
        c.Telefono ?? string.Empty, c.Estado, c.CreatedAt, c.UpdatedAt);
}

public static partial class ConductorEndpoints
{
    public static RouteGroupBuilder MapConductores(this RouteGroupBuilder api)
    {
        var group = api.MapGroup("/conductores").WithTags("Conductores");

        group.MapGet("/", Listar).WithSummary("Lista los conductores (filtros opcionales: estado, q)");
        group.MapGet("/{id:guid}", Obtener).WithName("ObtenerConductor").WithSummary("Obtiene un conductor por id");
        group.MapPost("/", Crear).WithSummary("Registra un conductor");
        group.MapPut("/{id:guid}", Actualizar).WithSummary("Actualiza un conductor");
        group.MapDelete("/{id:guid}", Eliminar).WithSummary("Elimina un conductor (sus vehículos quedan sin asignar)");

        return api;
    }

    private static async Task<IResult> Listar(IQFleetDbContext db, string? estado, string? q)
    {
        var query = db.Conductores.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(estado)) query = query.Where(c => c.Estado == estado);
        if (!string.IsNullOrWhiteSpace(q))
        {
            var termino = $"%{q.Trim()}%";
            query = query.Where(c => EF.Functions.ILike(c.Nombre, termino) || EF.Functions.ILike(c.Cedula, termino));
        }

        var conductores = await query.OrderBy(c => c.Nombre).ToListAsync();
        return Results.Ok(conductores.Select(ConductorResponse.From));
    }

    private static async Task<IResult> Obtener(Guid id, IQFleetDbContext db)
    {
        var conductor = await db.Conductores.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);
        return conductor is null ? NotFound(id) : Results.Ok(ConductorResponse.From(conductor));
    }

    private static async Task<IResult> Crear(ConductorRequest request, IQFleetDbContext db)
    {
        var conductor = new Conductor();
        var validacion = await Aplicar(request, conductor, db, ignoreId: null);
        if (!validacion.IsValid) return validacion.ToProblem();

        var ahora = DateTime.UtcNow;
        conductor.CreatedAt = ahora;
        conductor.UpdatedAt = ahora;
        db.Conductores.Add(conductor);
        await db.SaveChangesAsync();

        return Results.CreatedAtRoute("ObtenerConductor", new { id = conductor.Id }, ConductorResponse.From(conductor));
    }

    private static async Task<IResult> Actualizar(Guid id, ConductorRequest request, IQFleetDbContext db)
    {
        var conductor = await db.Conductores.FirstOrDefaultAsync(c => c.Id == id);
        if (conductor is null) return NotFound(id);

        var validacion = await Aplicar(request, conductor, db, ignoreId: id);
        if (!validacion.IsValid) return validacion.ToProblem();

        conductor.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Results.Ok(ConductorResponse.From(conductor));
    }

    private static async Task<IResult> Eliminar(Guid id, IQFleetDbContext db)
    {
        var eliminados = await db.Conductores.Where(c => c.Id == id).ExecuteDeleteAsync();
        return eliminados == 0 ? NotFound(id) : Results.NoContent();
    }

    /// <summary>Valida el request (mismas reglas que conductorService.js) y lo copia a la entidad.</summary>
    private static async Task<Validation> Aplicar(ConductorRequest request, Conductor conductor, IQFleetDbContext db, Guid? ignoreId)
    {
        var v = new Validation();

        var nombre = v.Required("nombre", request.Nombre, "El nombre es obligatorio.");

        var cedula = v.Required("cedula", request.Cedula, "La cédula es obligatoria.");
        if (!v.Has("cedula") && !CedulaRegex().IsMatch(cedula))
            v.Add("cedula", "La cédula debe tener entre 6 y 12 dígitos.");
        if (!v.Has("cedula") && await db.Conductores.AnyAsync(c => c.Cedula == cedula && c.Id != ignoreId))
            v.Add("cedula", "Ya existe un conductor con esa cédula.");

        var categoria = string.IsNullOrWhiteSpace(request.CategoriaLicencia) ? "B2" : request.CategoriaLicencia.Trim().ToUpperInvariant();
        if (!LicenciaCategorias.Todas.Contains(categoria)) v.Add("categoriaLicencia", "Categoría de licencia inválida.");

        var telefono = request.Telefono?.Trim() ?? string.Empty;
        if (telefono.Length > 0 && !TelefonoRegex().IsMatch(telefono))
            v.Add("telefono", "Teléfono inválido (7 a 15 dígitos).");

        var licenciaVence = v.Date("licenciaVence", request.LicenciaVence, "La fecha de vencimiento es obligatoria.");

        var estado = string.IsNullOrWhiteSpace(request.Estado) ? ConductorEstados.Activo : request.Estado.Trim();
        if (!ConductorEstados.Todos.Contains(estado)) v.Add("estado", "Estado inválido.");

        if (v.IsValid)
        {
            conductor.Nombre = nombre;
            conductor.Cedula = cedula;
            conductor.CategoriaLicencia = categoria;
            conductor.LicenciaVence = licenciaVence;
            conductor.Telefono = telefono.Length > 0 ? telefono : null;
            conductor.Estado = estado;
        }
        return v;
    }

    private static IResult NotFound(Guid id) =>
        Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "No encontrado", detail: $"Conductor {id} no encontrado");

    [GeneratedRegex(@"^\d{6,12}$")]
    private static partial Regex CedulaRegex();

    [GeneratedRegex(@"^\d{7,15}$")]
    private static partial Regex TelefonoRegex();
}
