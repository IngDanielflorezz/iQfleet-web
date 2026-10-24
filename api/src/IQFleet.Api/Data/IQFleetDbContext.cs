using IQFleet.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace IQFleet.Api.Data;

public class IQFleetDbContext(DbContextOptions<IQFleetDbContext> options) : DbContext(options)
{
    // Esquema propio: no choca con las tablas de public.* que crea api/db/schema.sql en Supabase.
    public const string Schema = "iqfleet";

    public DbSet<Conductor> Conductores => Set<Conductor>();
    public DbSet<Vehiculo> Vehiculos => Set<Vehiculo>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);

        modelBuilder.Entity<Conductor>(entity =>
        {
            entity.ToTable("conductores", table =>
            {
                table.HasCheckConstraint("ck_conductores_estado", "estado in ('Activo', 'En relevo', 'Inactivo')");
                table.HasCheckConstraint("ck_conductores_categoria",
                    "categoria_licencia in ('A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3')");
            });
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(c => c.Nombre).HasColumnName("nombre").HasMaxLength(80).IsRequired();
            entity.Property(c => c.Cedula).HasColumnName("cedula").HasMaxLength(12).IsRequired();
            entity.Property(c => c.CategoriaLicencia).HasColumnName("categoria_licencia").HasMaxLength(2).IsRequired();
            entity.Property(c => c.LicenciaVence).HasColumnName("licencia_vence");
            entity.Property(c => c.Telefono).HasColumnName("telefono").HasMaxLength(15);
            entity.Property(c => c.Estado).HasColumnName("estado").HasMaxLength(20).IsRequired();
            entity.Property(c => c.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            entity.Property(c => c.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");
            entity.HasIndex(c => c.Cedula).IsUnique();
        });

        modelBuilder.Entity<Vehiculo>(entity =>
        {
            entity.ToTable("vehiculos", table =>
            {
                table.HasCheckConstraint("ck_vehiculos_estado", "estado in ('Operativo', 'Mantenimiento', 'Fuera de servicio')");
                table.HasCheckConstraint("ck_vehiculos_anio", "anio between 1980 and 2100");
                table.HasCheckConstraint("ck_vehiculos_km", "kilometraje >= 0");
            });
            entity.HasKey(v => v.Placa);
            entity.Property(v => v.Placa).HasColumnName("placa").HasMaxLength(8);
            entity.Property(v => v.Ciudad).HasColumnName("ciudad").HasMaxLength(40).IsRequired();
            entity.Property(v => v.Marca).HasColumnName("marca").HasMaxLength(40).IsRequired();
            entity.Property(v => v.Modelo).HasColumnName("modelo").HasMaxLength(40).IsRequired();
            entity.Property(v => v.Tipo).HasColumnName("tipo").HasMaxLength(30).IsRequired();
            entity.Property(v => v.Anio).HasColumnName("anio");
            entity.Property(v => v.Kilometraje).HasColumnName("kilometraje");
            entity.Property(v => v.Estado).HasColumnName("estado").HasMaxLength(20).IsRequired();
            entity.Property(v => v.SoatVence).HasColumnName("soat_vence");
            entity.Property(v => v.RtmVence).HasColumnName("rtm_vence");
            entity.Property(v => v.ConductorId).HasColumnName("conductor_id");
            entity.Property(v => v.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            entity.Property(v => v.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");

            // Si se elimina el conductor, el vehículo queda "Sin asignar".
            entity.HasOne(v => v.Conductor)
                .WithMany(c => c.Vehiculos)
                .HasForeignKey(v => v.ConductorId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
