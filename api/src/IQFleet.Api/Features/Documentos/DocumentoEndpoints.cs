using IQFleet.Api.Common;
using IQFleet.Api.Data;
using IQFleet.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace IQFleet.Api.Features.Documentos;

/// <summary>Cuerpo que envía DocumentoModal.jsx (mismos nombres de campo que documentoService.js).</summary>
public record DocumentoRequest(
    string? Tipo,
    string? Numero,
    string? Entidad,
    string? Placa,
    string? Conductor,
    string? ConductorId,
    string? Expedicion,
    string? Vencimiento,
    string? EstadoRunt,
    string? ArchivoNombre,
    string? ArchivoTipo);

/// <summary>ids vacío o null => se sincronizan todos los documentos.</summary>
public record SincronizarRuntRequest(Guid[]? Ids);

public record DocumentoResponse(
    Guid Id,
    string Tipo,
    string Numero,
    string Entidad,
    string Placa,
    string Conductor,
    string ConductorId,
    DateOnly Expedicion,
    DateOnly Vencimiento,
    string EstadoRunt,
    DateTime? RuntSincronizadoEn,
    string ArchivoNombre,
    string ArchivoTipo,
    DateTime CreatedAt,
    DateTime UpdatedAt)
{
    public static DocumentoResponse From(Documento d) => new(
        d.Id, d.Tipo, d.Numero, d.Entidad, d.Placa ?? string.Empty, d.Conductor ?? string.Empty,
        d.ConductorId?.ToString() ?? string.Empty, d.FechaExpedicion, d.FechaVencimiento, d.EstadoRunt,
        d.RuntSincronizadoEn, d.ArchivoNombre ?? string.Empty, d.ArchivoTipo ?? string.Empty, d.CreatedAt, d.UpdatedAt);
}

public static class DocumentoEndpoints
{
    private static readonly string[] TiposArchivo = ["image/png", "image/jpeg", "application/pdf"];

    public static RouteGroupBuilder MapDocumentos(this RouteGroupBuilder api)
    {
        var group = api.MapGroup("/documentos").WithTags("Documentos");

        group.MapGet("/", Listar).WithSummary("Lista documentos por vencimiento (filtros: tipo, estadoRunt, placa, venceAntes, q)");
        group.MapGet("/{id:guid}", Obtener).WithName("ObtenerDocumento").WithSummary("Obtiene un documento por id");
        group.MapPost("/", Crear).WithSummary("Registra un documento");
        group.MapPut("/{id:guid}", Actualizar).WithSummary("Actualiza un documento");
        group.MapDelete("/{id:guid}", Eliminar).WithSummary("Elimina un documento");
        group.MapPost("/sincronizar-runt", SincronizarRunt).WithSummary("Marca documentos como sincronizados con el RUNT (simulado)");

        return api;
    }

    /// <param name="venceAntes">YYYY-MM-DD: documentos que vencen en o antes de esa fecha (vencidos y por vencer).</param>
    private static async Task<IResult> Listar(IQFleetDbContext db, string? tipo, string? estadoRunt, string? placa, DateOnly? venceAntes, string? q)
    {
        var query = db.Documentos.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(tipo)) query = query.Where(d => d.Tipo == tipo);
        if (!string.IsNullOrWhiteSpace(estadoRunt)) query = query.Where(d => d.EstadoRunt == estadoRunt);
        if (!string.IsNullOrWhiteSpace(placa)) query = query.Where(d => d.Placa == placa.Trim().ToUpper());
        if (venceAntes is not null) query = query.Where(d => d.FechaVencimiento <= venceAntes);
        if (!string.IsNullOrWhiteSpace(q))
        {
            var termino = $"%{q.Trim()}%";
            query = query.Where(d =>
                EF.Functions.ILike(d.Numero, termino) ||
                EF.Functions.ILike(d.Entidad, termino) ||
                (d.Placa != null && EF.Functions.ILike(d.Placa, termino)) ||
                (d.Conductor != null && EF.Functions.ILike(d.Conductor, termino)));
        }

        var documentos = await query.OrderBy(d => d.FechaVencimiento).ToListAsync();
        return Results.Ok(documentos.Select(DocumentoResponse.From));
    }

    private static async Task<IResult> Obtener(Guid id, IQFleetDbContext db)
    {
        var documento = await db.Documentos.AsNoTracking().FirstOrDefaultAsync(d => d.Id == id);
        return documento is null ? NotFound(id) : Results.Ok(DocumentoResponse.From(documento));
    }

    private static async Task<IResult> Crear(DocumentoRequest request, IQFleetDbContext db)
    {
        var documento = new Documento();
        var v = await Aplicar(request, documento, db);
        if (!v.IsValid) return v.ToProblem();

        var ahora = DateTime.UtcNow;
        documento.CreatedAt = ahora;
        documento.UpdatedAt = ahora;
        if (documento.EstadoRunt == DocumentoEstadosRunt.Sincronizado) documento.RuntSincronizadoEn = ahora;
        db.Documentos.Add(documento);
        await db.SaveChangesAsync();

        return Results.CreatedAtRoute("ObtenerDocumento", new { id = documento.Id }, DocumentoResponse.From(documento));
    }

    private static async Task<IResult> Actualizar(Guid id, DocumentoRequest request, IQFleetDbContext db)
    {
        var documento = await db.Documentos.FirstOrDefaultAsync(d => d.Id == id);
        if (documento is null) return NotFound(id);

        var estadoAnterior = documento.EstadoRunt;
        var v = await Aplicar(request, documento, db);
        if (!v.IsValid) return v.ToProblem();

        documento.UpdatedAt = DateTime.UtcNow;
        if (documento.EstadoRunt == DocumentoEstadosRunt.Sincronizado && estadoAnterior != documento.EstadoRunt)
            documento.RuntSincronizadoEn = documento.UpdatedAt;
        await db.SaveChangesAsync();
        return Results.Ok(DocumentoResponse.From(documento));
    }

    private static async Task<IResult> Eliminar(Guid id, IQFleetDbContext db)
    {
        var eliminados = await db.Documentos.Where(d => d.Id == id).ExecuteDeleteAsync();
        return eliminados == 0 ? NotFound(id) : Results.NoContent();
    }

    private static async Task<IResult> SincronizarRunt(SincronizarRuntRequest? request, IQFleetDbContext db)
    {
        var ids = request?.Ids ?? [];
        var ahora = DateTime.UtcNow;
        var query = db.Documentos.AsQueryable();
        if (ids.Length > 0) query = query.Where(d => ids.Contains(d.Id));

        await query.ExecuteUpdateAsync(s => s
            .SetProperty(d => d.EstadoRunt, DocumentoEstadosRunt.Sincronizado)
            .SetProperty(d => d.RuntSincronizadoEn, ahora)
            .SetProperty(d => d.UpdatedAt, ahora));

        var documentos = await db.Documentos.AsNoTracking().OrderBy(d => d.FechaVencimiento).ToListAsync();
        return Results.Ok(documentos.Select(DocumentoResponse.From));
    }

    /// <summary>Valida el request (mismas reglas que documentoService.js) y lo copia a la entidad.</summary>
    private static async Task<Validation> Aplicar(DocumentoRequest request, Documento documento, IQFleetDbContext db)
    {
        var v = new Validation();

        var tipo = v.OneOf("tipo", request.Tipo, DocumentoTipos.Soat, DocumentoTipos.Todos, "Tipo de documento inválido.");
        var numero = v.Required("numero", request.Numero, "El número / póliza es obligatorio.");
        var entidad = v.Required("entidad", request.Entidad, "La entidad emisora es obligatoria.");

        var placa = Validation.Optional(request.Placa)?.ToUpperInvariant();
        if (placa is not null && !await db.Vehiculos.AnyAsync(x => x.Placa == placa))
            v.Add("placa", $"El vehículo {placa} no existe.");

        Conductor? ficha = null;
        if (!string.IsNullOrWhiteSpace(request.ConductorId))
        {
            ficha = Guid.TryParse(request.ConductorId, out var cid) ? await db.Conductores.FirstOrDefaultAsync(c => c.Id == cid) : null;
            if (ficha is null) v.Add("conductorId", "El conductor seleccionado no existe.");
        }
        var conductor = Validation.Optional(request.Conductor) ?? ficha?.Nombre;
        if (placa is null && conductor is null) v.Add("placa", "Asocia el documento a una placa o a un conductor.");

        var expedicion = v.Date("expedicion", request.Expedicion, "La fecha de expedición es obligatoria.");
        var vencimiento = v.Date("vencimiento", request.Vencimiento, "La fecha de vencimiento es obligatoria.");
        if (!v.Has("expedicion") && !v.Has("vencimiento") && vencimiento < expedicion)
            v.Add("vencimiento", "El vencimiento no puede ser anterior a la expedición.");

        var estadoRunt = v.OneOf("estadoRunt", request.EstadoRunt, documento.EstadoRunt, DocumentoEstadosRunt.Todos, "Estado RUNT inválido.");

        var archivoTipo = Validation.Optional(request.ArchivoTipo);
        if (archivoTipo is not null && !TiposArchivo.Contains(archivoTipo))
            v.Add("archivo", "Formato no permitido (usa PNG, JPG o PDF).");

        if (v.IsValid)
        {
            documento.Tipo = tipo;
            documento.Numero = numero;
            documento.Entidad = entidad;
            documento.Placa = placa;
            documento.Conductor = conductor;
            documento.ConductorId = ficha?.Id;
            documento.FechaExpedicion = expedicion;
            documento.FechaVencimiento = vencimiento;
            documento.EstadoRunt = estadoRunt;
            documento.ArchivoNombre = Validation.Optional(request.ArchivoNombre) ?? documento.ArchivoNombre;
            documento.ArchivoTipo = archivoTipo ?? documento.ArchivoTipo;
        }
        return v;
    }

    private static IResult NotFound(Guid id) =>
        Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "No encontrado", detail: $"Documento {id} no encontrado");
}
