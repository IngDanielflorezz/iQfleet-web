using IQFleet.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace IQFleet.Api.Data;

/// <summary>Datos de demostración (los mismos que traía el front en localStorage). Solo se insertan si la base está vacía.</summary>
public static class SeedData
{
    public static async Task EnsureSeededAsync(IQFleetDbContext db)
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
}
