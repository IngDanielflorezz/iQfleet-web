using IQFleet.Api.Common;
using IQFleet.Api.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace IQFleet.Api.Data;

/// <summary>
/// Datos de demostración (los mismos que traía el front en localStorage). Cada tabla se
/// siembra por separado y solo si está vacía, así una base ya en uso no se duplica.
/// </summary>
public static class SeedData
{
    // Hora local de Colombia para las fechas de salida de la semilla.
    private static readonly TimeSpan Colombia = HoraColombia.Offset;

    public static async Task EnsureSeededAsync(IQFleetDbContext db)
    {
        await SeedFlotaAsync(db);
        await SeedUsuariosAsync(db);
        await SeedDespachosAsync(db);
        await SeedDocumentosAsync(db);
        await SeedMovimientosAsync(db);
    }

    private static async Task SeedFlotaAsync(IQFleetDbContext db)
    {
        if (await db.Conductores.AnyAsync() || await db.Vehiculos.AnyAsync()) return;

        var hoy = DateOnly.FromDateTime(DateTime.UtcNow);
        var ahora = DateTime.UtcNow;

        Conductor Conductor(string nombre, string cedula, string categoria, int diasLicencia, string telefono, string estado) => new()
        {
            Id = Guid.NewGuid(),
            Nombre = nombre,
            Cedula = cedula,
            CategoriaLicencia = categoria,
            LicenciaVence = hoy.AddDays(diasLicencia),
            Telefono = telefono,
            Estado = estado,
            CreatedAt = ahora,
            UpdatedAt = ahora,
        };

        var juan = Conductor("Juan Pérez", "1234567890", "C2", -40, "3104567890", ConductorEstados.Activo);
        var carlos = Conductor("Carlos Rodríguez", "1098765432", "C3", 120, "3204567891", ConductorEstados.Activo);
        var andres = Conductor("Andrés Gómez", "1122334455", "B2", 20, "3004567892", ConductorEstados.EnRelevo);
        var luis = Conductor("Luis Martínez", "1987654321", "C2", 400, "3114567893", ConductorEstados.Activo);
        var miguel = Conductor("Miguel Torres", "1020304050", "B1", -10, "3154567894", ConductorEstados.Inactivo);
        var diego = Conductor("Diego Herrera", "1066778899", "C3", 60, "3124567895", ConductorEstados.Activo);
        db.Conductores.AddRange(juan, carlos, andres, luis, miguel, diego);

        Vehiculo Vehiculo(string placa, string ciudad, string marca, string modelo, string tipo, int anio,
            Conductor? conductor, int km, string estado, int diasSoat, int diasRtm) => new()
        {
            Placa = placa,
            Ciudad = ciudad,
            Marca = marca,
            Modelo = modelo,
            Tipo = tipo,
            Anio = anio,
            ConductorId = conductor?.Id,
            Kilometraje = km,
            Estado = estado,
            SoatVence = hoy.AddDays(diasSoat),
            RtmVence = hoy.AddDays(diasRtm),
            CreatedAt = ahora,
            UpdatedAt = ahora,
        };

        db.Vehiculos.AddRange(
            Vehiculo("UVP-123", "BOGOTA D.C.", "Kenworth", "T800", "Camión", 2019, juan, 184320, VehiculoEstados.Operativo, 5, 50),
            Vehiculo("WZA-456", "BOGOTA D.C.", "Marcopolo", "Torino G7", "Bus", 2021, carlos, 96210, VehiculoEstados.Operativo, 120, 100),
            Vehiculo("TRL-890", "VALLEDUPAR", "Chevrolet", "NPR", "Buseta", 2018, andres, 231540, VehiculoEstados.Mantenimiento, -15, 25),
            Vehiculo("EQZ-912", "VALLEDUPAR", "Hino", "AK1J", "Buseta", 2020, luis, 128970, VehiculoEstados.Operativo, 150, 145),
            Vehiculo("KLM-334", "BARRANQUILLA", "Volvo", "9800", "Bus Intermunicipal", 2022, diego, 64500, VehiculoEstados.Operativo, 200, 180),
            Vehiculo("FGH-778", "MEDELLÍN", "Mercedes-Benz", "Sprinter", "Van", 2017, null, 275800, VehiculoEstados.FueraDeServicio, -60, -30));

        await db.SaveChangesAsync();
    }

    /// <summary>Cuentas demo del login (clave 1234), las mismas de authService.js.</summary>
    private static async Task SeedUsuariosAsync(IQFleetDbContext db)
    {
        if (await db.Usuarios.AnyAsync()) return;

        var hasher = new PasswordHasher<Usuario>();
        var ahora = DateTime.UtcNow;
        var andres = await db.Conductores.FirstOrDefaultAsync(c => c.Nombre == "Andrés Gómez");

        Usuario Usuario(string nombres, string apellidos, string correo, string telefono, string rol, string? licencia, Guid? conductorId)
        {
            var usuario = new Usuario
            {
                Id = Guid.NewGuid(),
                Nombres = nombres,
                Apellidos = apellidos,
                Correo = correo,
                Telefono = telefono,
                Empresa = "iQFleet",
                Licencia = licencia,
                Rol = rol,
                ConductorId = conductorId,
                CreatedAt = ahora,
                UpdatedAt = ahora,
            };
            usuario.PasswordHash = hasher.HashPassword(usuario, "1234");
            return usuario;
        }

        db.Usuarios.AddRange(
            Usuario("Carlos", "Morales", "admin@iqfleet.com", "+57 300 000 0000", UsuarioRoles.Administrador, null, null),
            Usuario("Andrés", "Gómez", "conductor@iqfleet.com", "+57 301 000 0000", UsuarioRoles.Conductor, "20001234567", andres?.Id));

        await db.SaveChangesAsync();
    }

    private static async Task SeedDespachosAsync(IQFleetDbContext db)
    {
        if (await db.Despachos.AnyAsync()) return;

        var placas = await db.Vehiculos.Select(v => v.Placa).ToHashSetAsync();
        var conductores = await db.Conductores.ToDictionaryAsync(c => c.Nombre, c => c.Id);
        var mesActual = DateTime.UtcNow.Add(Colombia);
        var ahora = DateTime.UtcNow;

        (string Placa, string Conductor, string Origen, string Destino, int Mes, int Dia, int Hora, int Minuto, string Estado, decimal Flete, decimal Costo)[] definiciones =
        [
            ("UVP-123", "Juan Pérez", "Bogotá D.C.", "Valledupar", 0, 3, 5, 30, DespachoEstados.EnRuta, 4_200_000, 2_650_000),
            ("WZA-456", "Carlos Rodríguez", "Bogotá D.C.", "Bucaramanga", 0, 5, 6, 0, DespachoEstados.Programado, 3_100_000, 1_950_000),
            ("EQZ-912", "Luis Martínez", "Valledupar", "Santa Marta", 0, 1, 7, 15, DespachoEstados.Completado, 2_400_000, 1_500_000),
            ("KLM-334", "Diego Herrera", "Barranquilla", "Cartagena", 0, 8, 4, 45, DespachoEstados.Programado, 2_800_000, 1_700_000),
            ("TRL-890", "Andrés Gómez", "Valledupar", "Bogotá D.C.", -1, 12, 5, 0, DespachoEstados.Completado, 5_100_000, 3_400_000),
            ("UVP-123", "Juan Pérez", "Bogotá D.C.", "Ibagué", -1, 20, 6, 30, DespachoEstados.Completado, 3_600_000, 2_300_000),
            ("EQZ-912", "Luis Martínez", "Valledupar", "Riohacha", -1, 25, 7, 0, DespachoEstados.Cancelado, 1_900_000, 0),
            ("WZA-456", "Carlos Rodríguez", "Bogotá D.C.", "Tunja", -1, 9, 5, 45, DespachoEstados.Completado, 1_500_000, 980_000),
            ("KLM-334", "Diego Herrera", "Barranquilla", "Valledupar", -2, 14, 4, 30, DespachoEstados.Completado, 4_400_000, 2_950_000),
            ("TRL-890", "Andrés Gómez", "Valledupar", "Bucaramanga", -2, 22, 6, 10, DespachoEstados.Completado, 3_300_000, 2_100_000),
            ("UVP-123", "Juan Pérez", "Bogotá D.C.", "Villavicencio", -2, 6, 5, 20, DespachoEstados.Completado, 2_600_000, 1_650_000),
        ];

        db.Despachos.AddRange(definiciones
            .Where(d => placas.Contains(d.Placa))
            .Select(d =>
            {
                var mes = new DateTime(mesActual.Year, mesActual.Month, 1).AddMonths(d.Mes);
                var salida = new DateTimeOffset(mes.Year, mes.Month, d.Dia, d.Hora, d.Minuto, 0, Colombia);
                return new Despacho
                {
                    Id = Guid.NewGuid(),
                    Placa = d.Placa,
                    Conductor = d.Conductor,
                    ConductorId = conductores.TryGetValue(d.Conductor, out var id) ? id : null,
                    Origen = d.Origen,
                    Destino = d.Destino,
                    FechaSalida = salida.UtcDateTime,
                    Estado = d.Estado,
                    ValorFlete = d.Flete,
                    CostoOperativo = d.Costo,
                    CreatedAt = ahora,
                    UpdatedAt = ahora,
                };
            }));

        await db.SaveChangesAsync();
    }

    private static async Task SeedDocumentosAsync(IQFleetDbContext db)
    {
        if (await db.Documentos.AnyAsync()) return;

        var placas = await db.Vehiculos.Select(v => v.Placa).ToHashSetAsync();
        var hoy = DateOnly.FromDateTime(DateTime.UtcNow.Add(Colombia));
        var ahora = DateTime.UtcNow;

        (string Tipo, string Numero, string Entidad, string Placa, int DiasExpedicion, int DiasVencimiento, string Estado)[] definiciones =
        [
            (DocumentoTipos.Soat, "8921-983210", "Seguros Bolívar S.A.", "UVP-123", -365, -3, DocumentoEstadosRunt.Sincronizado),
            (DocumentoTipos.Rtm, "RTM-450-2024", "CDA Bogotá", "UVP-123", -350, 5, DocumentoEstadosRunt.Sincronizado),
            (DocumentoTipos.Soat, "1120-771230", "Sura Seguros", "WZA-456", -360, 25, DocumentoEstadosRunt.Sincronizado),
            (DocumentoTipos.Rtm, "RTM-778-2024", "CDA Bogotá", "WZA-456", -355, 90, DocumentoEstadosRunt.Pendiente),
            (DocumentoTipos.Soat, "5567-112233", "Allianz Colombia", "TRL-890", -358, 20, DocumentoEstadosRunt.Sincronizado),
            (DocumentoTipos.Rtm, "RTM-901-2024", "CDA Valledupar", "TRL-890", -370, -12, DocumentoEstadosRunt.Error),
            (DocumentoTipos.Soat, "3201-556677", "Mapfre", "EQZ-912", -300, 60, DocumentoEstadosRunt.Sincronizado),
            (DocumentoTipos.TarjetaOperacion, "TO-2004-8891", "MinTransporte", "EQZ-912", -330, 15, DocumentoEstadosRunt.Sincronizado),
            (DocumentoTipos.PolizaRcc, "KLM-334-RCC", "Seguros Bolívar S.A.", "KLM-334", -200, 140, DocumentoEstadosRunt.Sincronizado),
            (DocumentoTipos.Soat, "9910-445566", "Sura Seguros", "FGH-778", -400, -5, DocumentoEstadosRunt.Error),
        ];

        db.Documentos.AddRange(definiciones
            .Where(d => placas.Contains(d.Placa))
            .Select(d => new Documento
            {
                Id = Guid.NewGuid(),
                Tipo = d.Tipo,
                Numero = d.Numero,
                Entidad = d.Entidad,
                Placa = d.Placa,
                FechaExpedicion = hoy.AddDays(d.DiasExpedicion),
                FechaVencimiento = hoy.AddDays(d.DiasVencimiento),
                EstadoRunt = d.Estado,
                RuntSincronizadoEn = d.Estado == DocumentoEstadosRunt.Sincronizado ? ahora : null,
                CreatedAt = ahora,
                UpdatedAt = ahora,
            }));

        await db.SaveChangesAsync();
    }

    private static async Task SeedMovimientosAsync(IQFleetDbContext db)
    {
        if (await db.Movimientos.AnyAsync()) return;

        var placas = await db.Vehiculos.Select(v => v.Placa).ToHashSetAsync();
        var mesActual = DateOnly.FromDateTime(DateTime.UtcNow.Add(Colombia));
        var ahora = DateTime.UtcNow;

        const string Ingreso = MovimientoTipos.Ingreso, Egreso = MovimientoTipos.Egreso;
        (string Tipo, string Concepto, string? Placa, string Conductor, string Factura, string Medio, decimal Monto, int? Km, int Mes, int Dia)[] definiciones =
        [
            (Ingreso, "Flete / Flete Intermunicipal", "UVP-123", "Juan Pérez", "FE-100234", MediosPago.Transferencia, 4_200_000, 640, 0, 3),
            (Egreso, "Combustible ACPM", "UVP-123", "Juan Pérez", "AC-77120", MediosPago.Tarjeta, 1_850_000, 640, 0, 3),
            (Egreso, "Peajes", "UVP-123", "Juan Pérez", "FP-2201", MediosPago.Tarjeta, 320_000, 640, 0, 3),
            (Ingreso, "Flete / Flete Intermunicipal", "WZA-456", "Carlos Rodríguez", "FE-100251", MediosPago.Transferencia, 3_100_000, 400, 0, 5),
            (Egreso, "Mantenimiento Correctivo", "TRL-890", "Andrés Gómez", "MC-8890", MediosPago.Credito, 980_000, null, 0, 8),
            (Ingreso, "Servicio Especial", "EQZ-912", "Luis Martínez", "FE-100268", MediosPago.Transferencia, 2_400_000, 300, 0, 9),
            (Egreso, "Nómina Operativa", null, "Personal operativo", "NOM-1004", MediosPago.Transferencia, 2_200_000, null, 0, 10),
            (Ingreso, "Flete / Flete Intermunicipal", "TRL-890", "Andrés Gómez", "FE-100110", MediosPago.Transferencia, 5_100_000, 780, -1, 12),
            (Egreso, "Combustible ACPM", "TRL-890", "Andrés Gómez", "AC-76980", MediosPago.Tarjeta, 2_100_000, 780, -1, 12),
            (Ingreso, "Flete / Flete Intermunicipal", "UVP-123", "Juan Pérez", "FE-100120", MediosPago.Transferencia, 3_600_000, 520, -1, 20),
            (Egreso, "Mantenimiento Preventivo", "WZA-456", "Carlos Rodríguez", "MP-4410", MediosPago.Credito, 760_000, null, -1, 22),
            (Ingreso, "Flete / Flete Intermunicipal", "WZA-456", "Carlos Rodríguez", "FE-100098", MediosPago.Transferencia, 1_500_000, 220, -1, 9),
            (Ingreso, "Flete / Flete Intermunicipal", "KLM-334", "Diego Herrera", "FE-099980", MediosPago.Transferencia, 4_400_000, 700, -2, 14),
            (Egreso, "Combustible ACPM", "KLM-334", "Diego Herrera", "AC-76540", MediosPago.Tarjeta, 1_900_000, 700, -2, 14),
            (Ingreso, "Servicio Especial", "TRL-890", "Andrés Gómez", "FE-099995", MediosPago.Efectivo, 3_300_000, 610, -2, 22),
            (Egreso, "Seguros", "KLM-334", "Diego Herrera", "SEG-2201", MediosPago.Transferencia, 640_000, null, -2, 6),
        ];

        db.Movimientos.AddRange(definiciones
            .Where(m => m.Placa is null || placas.Contains(m.Placa))
            .Select(m =>
            {
                var mes = new DateOnly(mesActual.Year, mesActual.Month, 1).AddMonths(m.Mes);
                return new Movimiento
                {
                    Id = Guid.NewGuid(),
                    Tipo = m.Tipo,
                    Concepto = m.Concepto,
                    Placa = m.Placa,
                    Conductor = m.Conductor,
                    Factura = m.Factura,
                    MedioPago = m.Medio,
                    Monto = m.Monto,
                    Km = m.Km,
                    Fecha = new DateOnly(mes.Year, mes.Month, m.Dia),
                    CreatedAt = ahora,
                    UpdatedAt = ahora,
                };
            }));

        await db.SaveChangesAsync();
    }
}
