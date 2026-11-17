using System.Text;
using IQFleet.Api.Common;
using IQFleet.Api.Data;
using IQFleet.Api.Features.Alertas;
using IQFleet.Api.Features.Conductores;
using IQFleet.Api.Features.Despachos;
using IQFleet.Api.Features.Documentos;
using IQFleet.Api.Features.Mantenimiento;
using IQFleet.Api.Features.Movimientos;
using IQFleet.Api.Features.RutasActivas;
using IQFleet.Api.Features.Turno;
using IQFleet.Api.Features.Usuarios;
using IQFleet.Api.Features.Vehiculos;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

// --- CARGAR AUTOMÁTICAMENTE EL ARCHIVO .ENV ---
var rootDir = Directory.GetCurrentDirectory();
// Busca el archivo .env subiendo por los directorios padre si es necesario
var envPath = Path.Combine(rootDir, ".env");
if (!File.Exists(envPath)) envPath = Path.Combine(rootDir, "..", ".env");
if (!File.Exists(envPath)) envPath = Path.Combine(rootDir, "../..", ".env");
if (!File.Exists(envPath)) envPath = Path.Combine(rootDir, "../../..", ".env");

if (File.Exists(envPath))
{
    foreach (var line in File.ReadAllLines(envPath))
    {
        var trimmed = line.Trim();
        if (string.IsNullOrEmpty(trimmed) || trimmed.StartsWith("#")) continue;
        
        var parts = trimmed.Split('=', 2);
        if (parts.Length == 2)
        {
            var key = parts[0].Trim();
            var val = parts[1].Trim().Trim('\'', '"'); // Remover comillas si las tiene
            Environment.SetEnvironmentVariable(key, val);
        }
    }
}
// ----------------------------------------------

var builder = WebApplication.CreateBuilder(args);

// ---------------------------------------------------------------- servicios --
var databaseUrl = builder.Configuration["IQFLEET_DATABASE_URL"]
    ?? throw new InvalidOperationException("Falta la variable IQFLEET_DATABASE_URL (ver api/.env.example).");
var poolSize = int.TryParse(builder.Configuration["IQFLEET_DB_POOL"], out var pool) ? pool : (int?)null;

builder.Services.AddDbContext<IQFleetDbContext>(options =>
    options.UseNpgsql(DatabaseUrl.ToConnectionString(databaseUrl, poolSize),
        npgsql => npgsql.MigrationsHistoryTable("__ef_migrations", IQFleetDbContext.Schema)));

var origenes = (builder.Configuration["IQFLEET_CORS_ORIGINS"] ?? "http://localhost:5173")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy => policy.WithOrigins(origenes).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

// ---------------------------------------------------------------- jwt auth ---
var jwtSecret = Environment.GetEnvironmentVariable("IQFLEET_JWT_SECRET") 
    ?? builder.Configuration["Jwt:Secret"] 
    ?? throw new InvalidOperationException("Falta definir IQFLEET_JWT_SECRET en el entorno.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false; // Evita que .NET renombre las claims estándar
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            RoleClaimType = "rol" // Asegura que lea el rol desde nuestra claim personalizada
        };

        // Soporte adicional: si quieres que el token se lea automáticamente desde la cookie HttpOnly
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                if (context.Request.Cookies.TryGetValue("iqfleet_session", out var token))
                {
                    context.Token = token;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorizationBuilder()
    .AddPolicy("Administrador", policy => policy.RequireRole("ADMINISTRADOR"))
    .AddPolicy("Conductor", policy => policy.RequireRole("CONDUCTOR", "ADMINISTRADOR"));

builder.Services.AddHttpClient<ArchivoStorage>();
builder.Services.AddProblemDetails();
builder.Services.AddOpenApi(options => options.AddDocumentTransformer<BearerSecurityTransformer>());

var app = builder.Build();

// --------------------------------------------------------------- base datos --
// Crea/actualiza las tablas (migraciones de EF Core) y carga la semilla de demo.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<IQFleetDbContext>();
    await db.Database.MigrateAsync();
    await SeedData.EnsureSeededAsync(db);
}

// ----------------------------------------------------------------- pipeline --
app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseCors();

// IMPORTANTE: Authentication debe ir ANTES de Authorization y de MapControllers
app.UseAuthentication();
app.UseAuthorization();

// Documentación y pruebas: /swagger (Swagger UI) y /scalar, ambos leen /openapi/v1.json.
app.MapOpenApi();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/openapi/v1.json", "iQFleet API v1");
    options.DocumentTitle = "iQFleet API";
    options.EnablePersistAuthorization();
});
app.MapScalarApiReference(options => options
    .WithTitle("iQFleet API")
    .AddPreferredSecuritySchemes(BearerSecurityTransformer.Scheme));

app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();
app.MapGet("/health", async (IQFleetDbContext db) =>
        await db.Database.CanConnectAsync() ? Results.Ok(new { status = "ok" }) : Results.Problem("Sin conexión a la base de datos"))
    .WithTags("Salud");

var api = app.MapGroup("/api").AddEndpointFilter<ApiTokenFilter>();
api.MapAuth();
api.MapUsuarios();
api.MapVehiculos();
api.MapConductores();
api.MapDespachos();
api.MapDocumentos();
api.MapMovimientos();
api.MapMantenimiento();
api.MapAlertas();
api.MapTurno();
api.MapRutasActivas();

app.Run();