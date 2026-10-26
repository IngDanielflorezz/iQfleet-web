using System.Text.RegularExpressions;
using IQFleet.Api.Common;
using IQFleet.Api.Data;
using IQFleet.Api.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace IQFleet.Api.Features.Usuarios;

/// <summary>Cuerpo que envía Register.jsx.</summary>
public record RegistroRequest(
    string? Nombres,
    string? Apellidos,
    string? Correo,
    string? Telefono,
    string? Empresa,
    string? Licencia,
    string? Password,
    string? Rol);

/// <summary>Cuerpo que envía Login.jsx. La empresa solo se exige al CONDUCTOR.</summary>
public record LoginRequest(string? Correo, string? Password, string? Rol, string? Empresa);

/// <summary>Datos de perfil editables (correo, rol y empresa no cambian).</summary>
public record UsuarioRequest(string? Nombres, string? Apellidos, string? Telefono, string? Licencia, string? ConductorId);

public record CambioPasswordRequest(string? Actual, string? Nueva);

public record UsuarioResponse(
    Guid Id,
    string Nombres,
    string Apellidos,
    string Correo,
    string Telefono,
    string Empresa,
    string Licencia,
    string Rol,
    string ConductorId,
    DateTime CreatedAt,
    DateTime UpdatedAt)
{
    public static UsuarioResponse From(Usuario u) => new(
        u.Id, u.Nombres, u.Apellidos, u.Correo, u.Telefono ?? string.Empty, u.Empresa,
        u.Licencia ?? string.Empty, u.Rol, u.ConductorId?.ToString() ?? string.Empty, u.CreatedAt, u.UpdatedAt);
}

public static partial class UsuarioEndpoints
{
    private static readonly PasswordHasher<Usuario> Hasher = new();

    public static RouteGroupBuilder MapAuth(this RouteGroupBuilder api)
    {
        var group = api.MapGroup("/auth").WithTags("Autenticación");

        group.MapPost("/registro", Registrar).WithSummary("Crea una cuenta (ADMINISTRADOR crea su empresa; CONDUCTOR se une a una existente)");
        group.MapPost("/login", Login).WithSummary("Valida correo, clave, rol y empresa; devuelve el perfil");
        group.MapGet("/empresas", Empresas).WithSummary("Empresas contratantes (las que tienen un administrador)");

        return api;
    }

    public static RouteGroupBuilder MapUsuarios(this RouteGroupBuilder api)
    {
        var group = api.MapGroup("/usuarios").WithTags("Usuarios");

        group.MapGet("/", Listar).WithSummary("Lista usuarios (filtros opcionales: empresa, rol, q)");
        group.MapGet("/{id:guid}", Obtener).WithName("ObtenerUsuario").WithSummary("Obtiene un usuario por id");
        group.MapPut("/{id:guid}", Actualizar).WithSummary("Actualiza el perfil (nombres, teléfono, licencia, ficha de conductor)");
        group.MapPut("/{id:guid}/password", CambiarPassword).WithSummary("Cambia la contraseña verificando la actual");
        group.MapDelete("/{id:guid}", Eliminar).WithSummary("Elimina la cuenta y sus registros de turno");

        return api;
    }

    // ------------------------------------------------------------------ auth --

    private static async Task<IResult> Registrar(RegistroRequest request, IQFleetDbContext db)
    {
        var v = new Validation();

        var nombres = v.Required("nombres", request.Nombres, "Los nombres son obligatorios.");
        var apellidos = v.Required("apellidos", request.Apellidos, "Los apellidos son obligatorios.");
        if (nombres.Length > 40) v.Add("nombres", "Máximo 40 caracteres.");
        if (apellidos.Length > 40) v.Add("apellidos", "Máximo 40 caracteres.");

        var correo = v.Required("correo", request.Correo, "El correo es obligatorio.").ToLowerInvariant();
        if (!v.Has("correo") && !CorreoRegex().IsMatch(correo)) v.Add("correo", "Correo inválido.");
        if (!v.Has("correo") && await db.Usuarios.AnyAsync(u => u.Correo == correo))
            v.Add("correo", "Ya existe una cuenta con ese correo.");

        var password = request.Password ?? string.Empty;
        if (password.Length < 8) v.Add("password", "Mínimo 8 caracteres");
        else if (!password.Any(char.IsLetter) || !password.Any(char.IsDigit)) v.Add("password", "Debe incluir letras y números");

        var rol = v.OneOf("rol", request.Rol?.ToUpperInvariant(), UsuarioRoles.Conductor, UsuarioRoles.Todos, "Rol inválido.");
        var empresa = v.Required("empresa", request.Empresa, "La empresa es obligatoria.");
        var licencia = Validation.Optional(request.Licencia);

        if (rol == UsuarioRoles.Conductor)
        {
            if (licencia is null) v.Add("licencia", "La licencia es obligatoria para el conductor.");
            if (!v.Has("empresa"))
            {
                // El conductor solo puede unirse a una empresa contratante; se guarda con el nombre oficial.
                var contratante = await BuscarEmpresa(db, empresa);
                if (contratante is null) v.Add("empresa", "La empresa seleccionada no está registrada como empresa contratante.");
                else empresa = contratante;
            }
        }

        var telefono = Validation.Optional(request.Telefono);
        if (telefono is not null && !TelefonoRegex().IsMatch(telefono)) v.Add("telefono", "Teléfono inválido.");

        if (!v.IsValid) return v.ToProblem();

        var ahora = DateTime.UtcNow;
        var usuario = new Usuario
        {
            Nombres = nombres,
            Apellidos = apellidos,
            Correo = correo,
            Telefono = telefono,
            Empresa = empresa,
            Licencia = licencia,
            Rol = rol,
            CreatedAt = ahora,
            UpdatedAt = ahora,
        };
        usuario.PasswordHash = Hasher.HashPassword(usuario, password);
        db.Usuarios.Add(usuario);
        await db.SaveChangesAsync();

        return Results.CreatedAtRoute("ObtenerUsuario", new { id = usuario.Id }, UsuarioResponse.From(usuario));
    }

    private static async Task<IResult> Login(LoginRequest request, IQFleetDbContext db)
    {
        var correo = request.Correo?.Trim().ToLowerInvariant() ?? string.Empty;
        var rol = request.Rol?.Trim().ToUpperInvariant() ?? string.Empty;
        var usuario = await db.Usuarios.FirstOrDefaultAsync(u => u.Correo == correo && u.Rol == rol);

        var resultado = usuario is null
            ? PasswordVerificationResult.Failed
            : Hasher.VerifyHashedPassword(usuario, usuario.PasswordHash, request.Password ?? string.Empty);
        if (usuario is null || resultado == PasswordVerificationResult.Failed)
            return NoAutorizado("Credenciales o rol incorrectos.");

        if (usuario.Rol == UsuarioRoles.Conductor &&
            !string.Equals(usuario.Empresa.Trim(), request.Empresa?.Trim(), StringComparison.OrdinalIgnoreCase))
            return NoAutorizado("La empresa no coincide con la registrada para este conductor.");

        if (resultado == PasswordVerificationResult.SuccessRehashNeeded)
        {
            usuario.PasswordHash = Hasher.HashPassword(usuario, request.Password!);
            await db.SaveChangesAsync();
        }

        return Results.Ok(UsuarioResponse.From(usuario));
    }

    private static async Task<IResult> Empresas(IQFleetDbContext db)
    {
        var empresas = await db.Usuarios.AsNoTracking()
            .Where(u => u.Rol == UsuarioRoles.Administrador)
            .Select(u => u.Empresa.Trim())
            .Distinct()
            .ToListAsync();
        return Results.Ok(empresas.Order(StringComparer.Create(new System.Globalization.CultureInfo("es-CO"), true)));
    }

    // -------------------------------------------------------------- usuarios --

    private static async Task<IResult> Listar(IQFleetDbContext db, string? empresa, string? rol, string? q)
    {
        var query = db.Usuarios.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(empresa)) query = query.Where(u => u.Empresa.ToLower() == empresa.Trim().ToLower());
        if (!string.IsNullOrWhiteSpace(rol)) query = query.Where(u => u.Rol == rol.Trim().ToUpper());
        if (!string.IsNullOrWhiteSpace(q))
        {
            var termino = $"%{q.Trim()}%";
            query = query.Where(u =>
                EF.Functions.ILike(u.Nombres, termino) ||
                EF.Functions.ILike(u.Apellidos, termino) ||
                EF.Functions.ILike(u.Correo, termino));
        }

        var usuarios = await query.OrderBy(u => u.Nombres).ThenBy(u => u.Apellidos).ToListAsync();
        return Results.Ok(usuarios.Select(UsuarioResponse.From));
    }

    private static async Task<IResult> Obtener(Guid id, IQFleetDbContext db)
    {
        var usuario = await db.Usuarios.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);
        return usuario is null ? NotFound(id) : Results.Ok(UsuarioResponse.From(usuario));
    }

    private static async Task<IResult> Actualizar(Guid id, UsuarioRequest request, IQFleetDbContext db)
    {
        var usuario = await db.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
        if (usuario is null) return NotFound(id);

        var v = new Validation();
        var nombres = v.Required("nombres", request.Nombres, "Los nombres son obligatorios.");
        var apellidos = v.Required("apellidos", request.Apellidos, "Los apellidos son obligatorios.");
        var telefono = Validation.Optional(request.Telefono);
        if (telefono is not null && !TelefonoRegex().IsMatch(telefono)) v.Add("telefono", "Teléfono inválido.");

        var licencia = Validation.Optional(request.Licencia);
        if (usuario.Rol == UsuarioRoles.Conductor && licencia is null)
            v.Add("licencia", "La licencia es obligatoria para el conductor.");

        Guid? conductorId = null;
        if (!string.IsNullOrWhiteSpace(request.ConductorId))
        {
            if (!Guid.TryParse(request.ConductorId, out var cid) || !await db.Conductores.AnyAsync(c => c.Id == cid))
                v.Add("conductorId", "La ficha de conductor no existe.");
            else if (await db.Usuarios.AnyAsync(u => u.ConductorId == cid && u.Id != id))
                v.Add("conductorId", "Esa ficha ya está vinculada a otra cuenta.");
            else
                conductorId = cid;
        }

        if (!v.IsValid) return v.ToProblem();

        usuario.Nombres = nombres;
        usuario.Apellidos = apellidos;
        usuario.Telefono = telefono;
        usuario.Licencia = licencia;
        usuario.ConductorId = conductorId;
        usuario.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Results.Ok(UsuarioResponse.From(usuario));
    }

    private static async Task<IResult> CambiarPassword(Guid id, CambioPasswordRequest request, IQFleetDbContext db)
    {
        var usuario = await db.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
        if (usuario is null) return NotFound(id);

        var v = new Validation();
        if (Hasher.VerifyHashedPassword(usuario, usuario.PasswordHash, request.Actual ?? string.Empty) == PasswordVerificationResult.Failed)
            v.Add("actual", "La contraseña actual no es correcta.");
        var nueva = request.Nueva ?? string.Empty;
        if (nueva.Length < 8) v.Add("nueva", "Mínimo 8 caracteres");
        else if (!nueva.Any(char.IsLetter) || !nueva.Any(char.IsDigit)) v.Add("nueva", "Debe incluir letras y números");
        if (!v.IsValid) return v.ToProblem();

        usuario.PasswordHash = Hasher.HashPassword(usuario, nueva);
        usuario.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> Eliminar(Guid id, IQFleetDbContext db)
    {
        var eliminados = await db.Usuarios.Where(u => u.Id == id).ExecuteDeleteAsync();
        return eliminados == 0 ? NotFound(id) : Results.NoContent();
    }

    private static async Task<string?> BuscarEmpresa(IQFleetDbContext db, string empresa) =>
        await db.Usuarios.AsNoTracking()
            .Where(u => u.Rol == UsuarioRoles.Administrador && u.Empresa.ToLower() == empresa.Trim().ToLower())
            .Select(u => u.Empresa)
            .FirstOrDefaultAsync();

    private static IResult NoAutorizado(string detalle) =>
        Results.Problem(statusCode: StatusCodes.Status401Unauthorized, title: "No autorizado", detail: detalle);

    private static IResult NotFound(Guid id) =>
        Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "No encontrado", detail: $"Usuario {id} no encontrado");

    [GeneratedRegex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$")]
    private static partial Regex CorreoRegex();

    [GeneratedRegex(@"^\+?[\d\s]{7,20}$")]
    private static partial Regex TelefonoRegex();
}
