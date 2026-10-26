using IQFleet.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace IQFleet.Api.Data;

public class IQFleetDbContext(DbContextOptions<IQFleetDbContext> options) : DbContext(options)
{
    // Esquema propio: no choca con las tablas internas de Supabase (public, auth, storage). Ver api/db/schema.sql.
    public const string Schema = "iqfleet";

    public DbSet<Conductor> Conductores => Set<Conductor>();
    public DbSet<Vehiculo> Vehiculos => Set<Vehiculo>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Despacho> Despachos => Set<Despacho>();
    public DbSet<Documento> Documentos => Set<Documento>();
    public DbSet<Movimiento> Movimientos => Set<Movimiento>();
    public DbSet<Alerta> Alertas => Set<Alerta>();
    public DbSet<Checklist> Checklists => Set<Checklist>();
    public DbSet<Fatiga> Fatiga => Set<Fatiga>();
    public DbSet<Puntaje> Puntajes => Set<Puntaje>();
    public DbSet<Recorrido> Recorridos => Set<Recorrido>();
    public DbSet<RutaActiva> RutasActivas => Set<RutaActiva>();

    /// <summary>Convierte una lista de valores en el "in (...)" de un check constraint.</summary>
    private static string In(string columna, IEnumerable<string> valores) =>
        $"{columna} in ({string.Join(", ", valores.Select(v => $"'{v.Replace("'", "''")}'"))})";

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

        // Las tablas nuevas usan la convención: columna = propiedad en snake_case (ver final del método).

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.ToTable("usuarios", table =>
            {
                table.HasCheckConstraint("ck_usuarios_rol", In("rol", UsuarioRoles.Todos));
                // La licencia es obligatoria para CONDUCTOR y opcional para ADMINISTRADOR.
                table.HasCheckConstraint("ck_usuarios_licencia",
                    "rol = 'ADMINISTRADOR' or (licencia is not null and btrim(licencia) <> '')");
                table.HasCheckConstraint("ck_usuarios_correo", "correo = lower(correo) and correo like '%_@_%'");
            });
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(u => u.Nombres).HasMaxLength(40).IsRequired();
            entity.Property(u => u.Apellidos).HasMaxLength(40).IsRequired();
            entity.Property(u => u.Correo).HasMaxLength(120).IsRequired();
            entity.Property(u => u.Telefono).HasMaxLength(20);
            entity.Property(u => u.Empresa).HasMaxLength(60).IsRequired();
            entity.Property(u => u.Licencia).HasMaxLength(20);
            entity.Property(u => u.Rol).HasMaxLength(15).IsRequired();
            entity.Property(u => u.PasswordHash).HasMaxLength(200).IsRequired();
            entity.Property(u => u.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(u => u.UpdatedAt).HasDefaultValueSql("now()");
            entity.HasIndex(u => u.Correo).IsUnique();
            entity.HasIndex(u => new { u.Empresa, u.Rol });
            entity.HasIndex(u => u.ConductorId).IsUnique();

            entity.HasOne(u => u.Conductor).WithMany()
                .HasForeignKey(u => u.ConductorId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Despacho>(entity =>
        {
            entity.ToTable("despachos", table =>
            {
                table.HasCheckConstraint("ck_despachos_estado", In("estado", DespachoEstados.Todos));
                table.HasCheckConstraint("ck_despachos_flete", "valor_flete >= 0");
                table.HasCheckConstraint("ck_despachos_costo", "costo_operativo >= 0");
            });
            entity.HasKey(d => d.Id);
            entity.Property(d => d.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(d => d.Placa).HasMaxLength(8).IsRequired();
            entity.Property(d => d.Conductor).HasMaxLength(80).IsRequired();
            entity.Property(d => d.Origen).HasMaxLength(80).IsRequired();
            entity.Property(d => d.Destino).HasMaxLength(80).IsRequired();
            entity.Property(d => d.Estado).HasMaxLength(20).IsRequired();
            entity.Property(d => d.ValorFlete).HasPrecision(14, 2);
            entity.Property(d => d.CostoOperativo).HasPrecision(14, 2);
            entity.Property(d => d.Observaciones).HasMaxLength(250);
            entity.Property(d => d.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(d => d.UpdatedAt).HasDefaultValueSql("now()");
            entity.HasIndex(d => d.FechaSalida);
            entity.HasIndex(d => new { d.Placa, d.FechaSalida });

            // No se puede borrar un vehículo con despachos registrados (historial financiero).
            entity.HasOne(d => d.Vehiculo).WithMany()
                .HasForeignKey(d => d.Placa)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(d => d.ConductorRef).WithMany()
                .HasForeignKey(d => d.ConductorId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Documento>(entity =>
        {
            entity.ToTable("documentos", table =>
            {
                table.HasCheckConstraint("ck_documentos_tipo", In("tipo", DocumentoTipos.Todos));
                table.HasCheckConstraint("ck_documentos_estado_runt", In("estado_runt", DocumentoEstadosRunt.Todos));
                table.HasCheckConstraint("ck_documentos_fechas", "fecha_vencimiento >= fecha_expedicion");
                table.HasCheckConstraint("ck_documentos_titular",
                    "placa is not null or (conductor is not null and btrim(conductor) <> '')");
            });
            entity.HasKey(d => d.Id);
            entity.Property(d => d.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(d => d.Tipo).HasMaxLength(30).IsRequired();
            entity.Property(d => d.Numero).HasMaxLength(40).IsRequired();
            entity.Property(d => d.Entidad).HasMaxLength(80).IsRequired();
            entity.Property(d => d.Placa).HasMaxLength(8);
            entity.Property(d => d.Conductor).HasMaxLength(80);
            entity.Property(d => d.EstadoRunt).HasMaxLength(25).IsRequired();
            entity.Property(d => d.ArchivoNombre).HasMaxLength(150);
            entity.Property(d => d.ArchivoTipo).HasMaxLength(50);
            entity.Property(d => d.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(d => d.UpdatedAt).HasDefaultValueSql("now()");
            entity.HasIndex(d => d.FechaVencimiento);

            // Los documentos del vehículo se van con él.
            entity.HasOne(d => d.Vehiculo).WithMany()
                .HasForeignKey(d => d.Placa)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(d => d.ConductorRef).WithMany()
                .HasForeignKey(d => d.ConductorId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Movimiento>(entity =>
        {
            entity.ToTable("movimientos", table =>
            {
                table.HasCheckConstraint("ck_movimientos_tipo", In("tipo", MovimientoTipos.Todos));
                table.HasCheckConstraint("ck_movimientos_medio_pago", In("medio_pago", MediosPago.Todos));
                table.HasCheckConstraint("ck_movimientos_monto", "monto > 0");
                table.HasCheckConstraint("ck_movimientos_km", "km is null or km >= 0");
            });
            entity.HasKey(m => m.Id);
            entity.Property(m => m.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(m => m.Tipo).HasMaxLength(10).IsRequired();
            entity.Property(m => m.Concepto).HasMaxLength(80).IsRequired();
            entity.Property(m => m.Placa).HasMaxLength(8);
            entity.Property(m => m.Conductor).HasMaxLength(80);
            entity.Property(m => m.Factura).HasMaxLength(40);
            entity.Property(m => m.MedioPago).HasMaxLength(20).IsRequired();
            entity.Property(m => m.Monto).HasPrecision(14, 2);
            entity.Property(m => m.ComprobanteNombre).HasMaxLength(150);
            entity.Property(m => m.ComprobanteTipo).HasMaxLength(50);
            entity.Property(m => m.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(m => m.UpdatedAt).HasDefaultValueSql("now()");
            entity.HasIndex(m => m.Fecha);
            entity.HasIndex(m => new { m.Placa, m.Fecha });

            entity.HasOne(m => m.Vehiculo).WithMany()
                .HasForeignKey(m => m.Placa)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Alerta>(entity =>
        {
            entity.ToTable("alertas", table =>
            {
                table.HasCheckConstraint("ck_alertas_tipo", In("tipo", AlertaTipos.Todos));
                table.HasCheckConstraint("ck_alertas_severidad", In("severidad", AlertaSeveridades.Todas));
                table.HasCheckConstraint("ck_alertas_lat", "lat is null or lat between -90 and 90");
                table.HasCheckConstraint("ck_alertas_lng", "lng is null or lng between -180 and 180");
                table.HasCheckConstraint("ck_alertas_resuelta", "resuelta or resuelta_en is null");
            });
            entity.HasKey(a => a.Id);
            entity.Property(a => a.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(a => a.Tipo).HasMaxLength(15).IsRequired();
            entity.Property(a => a.Severidad).HasMaxLength(10).IsRequired();
            entity.Property(a => a.Conductor).HasMaxLength(80);
            entity.Property(a => a.Empresa).HasMaxLength(60).IsRequired();
            entity.Property(a => a.Titulo).HasMaxLength(120).IsRequired();
            entity.Property(a => a.Detalle).HasMaxLength(500);
            entity.Property(a => a.Clave).HasMaxLength(120);
            entity.Property(a => a.CreatedAt).HasDefaultValueSql("now()");
            // Idempotencia como en alertService.js: no puede haber dos alertas ACTIVAS con la misma clave.
            entity.HasIndex(a => a.Clave).IsUnique().HasFilter("clave is not null and not resuelta");
            entity.HasIndex(a => new { a.Empresa, a.Resuelta, a.CreatedAt });

            entity.HasOne(a => a.Usuario).WithMany()
                .HasForeignKey(a => a.UsuarioId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Checklist>(entity =>
        {
            entity.ToTable("checklists");
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(c => c.Placa).HasMaxLength(8);
            entity.Property(c => c.Respuestas).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");
            entity.Property(c => c.Blockers).HasColumnType("jsonb").HasDefaultValueSql("'[]'::jsonb");
            entity.Property(c => c.Warnings).HasColumnType("jsonb").HasDefaultValueSql("'[]'::jsonb");
            entity.Property(c => c.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(c => c.UpdatedAt).HasDefaultValueSql("now()");
            entity.HasIndex(c => new { c.UsuarioId, c.Fecha }).IsUnique();

            entity.HasOne(c => c.Usuario).WithMany()
                .HasForeignKey(c => c.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(c => c.Vehiculo).WithMany()
                .HasForeignKey(c => c.Placa)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Fatiga>(entity =>
        {
            entity.ToTable("fatiga", table =>
                table.HasCheckConstraint("ck_fatiga_acumulado", "acumulado_ms >= 0"));
            entity.HasKey(f => f.Id);
            entity.Property(f => f.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(f => f.IniciadoEn).HasDefaultValueSql("now()");
            entity.Property(f => f.Pausas).HasColumnType("jsonb").HasDefaultValueSql("'[]'::jsonb");
            entity.Property(f => f.UpdatedAt).HasDefaultValueSql("now()");
            entity.HasIndex(f => new { f.UsuarioId, f.Fecha }).IsUnique();

            entity.HasOne(f => f.Usuario).WithMany()
                .HasForeignKey(f => f.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Puntaje>(entity =>
        {
            entity.ToTable("puntajes", table =>
            {
                table.HasCheckConstraint("ck_puntajes_puntos", "puntos between 0 and 100");
                table.HasCheckConstraint("ck_puntajes_excesos", "excesos >= 0");
            });
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(p => p.Eventos).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");
            entity.Property(p => p.Puntos).HasDefaultValue(100);
            entity.Property(p => p.UpdatedAt).HasDefaultValueSql("now()");
            entity.HasIndex(p => new { p.UsuarioId, p.Fecha }).IsUnique();

            entity.HasOne(p => p.Usuario).WithMany()
                .HasForeignKey(p => p.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Recorrido>(entity =>
        {
            entity.ToTable("recorridos", table =>
                table.HasCheckConstraint("ck_recorridos_km", "kilometros >= 0"));
            entity.HasKey(r => r.Id);
            entity.Property(r => r.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(r => r.Placa).HasMaxLength(8);
            entity.Property(r => r.Puntos).HasColumnType("jsonb").HasDefaultValueSql("'[]'::jsonb");
            entity.Property(r => r.Kilometros).HasPrecision(10, 2);
            entity.Property(r => r.UpdatedAt).HasDefaultValueSql("now()");
            entity.HasIndex(r => new { r.UsuarioId, r.Fecha }).IsUnique();

            entity.HasOne(r => r.Usuario).WithMany()
                .HasForeignKey(r => r.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(r => r.Vehiculo).WithMany()
                .HasForeignKey(r => r.Placa)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<RutaActiva>(entity =>
        {
            entity.ToTable("rutas_activas", table =>
            {
                table.HasCheckConstraint("ck_rutas_activas_lat", "lat between -90 and 90");
                table.HasCheckConstraint("ck_rutas_activas_lng", "lng between -180 and 180");
                table.HasCheckConstraint("ck_rutas_activas_velocidad", "velocidad_kmh >= 0");
            });
            entity.HasKey(r => r.UsuarioId);
            entity.Property(r => r.Placa).HasMaxLength(8);
            entity.Property(r => r.VelocidadKmh).HasPrecision(6, 2);
            entity.Property(r => r.IniciadaEn).HasDefaultValueSql("now()");
            entity.Property(r => r.UpdatedAt).HasDefaultValueSql("now()");
            entity.HasIndex(r => r.Placa);

            entity.HasOne(r => r.Usuario).WithOne()
                .HasForeignKey<RutaActiva>(r => r.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(r => r.Vehiculo).WithMany()
                .HasForeignKey(r => r.Placa)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Comentarios de tabla (quedan en la base: \dt+ en psql o el editor de Supabase los muestra).
        var comentarios = new Dictionary<Type, string>
        {
            [typeof(Conductor)] = "Personal operativo de la empresa (ficha del conductor).",
            [typeof(Vehiculo)] = "Parque automotor. La placa es la llave primaria.",
            [typeof(Usuario)] = "Cuentas de acceso. Cada ADMINISTRADOR representa una empresa contratante.",
            [typeof(Despacho)] = "Fletes operativos asignados a un vehículo y un conductor.",
            [typeof(Documento)] = "Documentos legales (SOAT, RTM, tarjeta de operación, póliza) y su estado en el RUNT.",
            [typeof(Movimiento)] = "Ingresos y egresos financieros, opcionalmente asociados a una placa.",
            [typeof(Alerta)] = "Alertas operativas: checklist, SOS, fatiga, mensajes y vencimientos.",
            [typeof(Checklist)] = "Checklist preoperacional: una fila por usuario y día.",
            [typeof(Fatiga)] = "Cronómetro de conducción continua: una fila por usuario y día.",
            [typeof(Puntaje)] = "Puntaje de conducción del turno: una fila por usuario y día.",
            [typeof(Recorrido)] = "Estela GPS y kilómetros del turno: una fila por usuario y día.",
            [typeof(RutaActiva)] = "Posición en vivo de cada conductor en ruta (una fila por usuario).",
        };
        foreach (var (tipo, comentario) in comentarios)
            modelBuilder.Entity(tipo).ToTable(table => table.HasComment(comentario));

        // Convención snake_case para las columnas que no tienen nombre explícito.
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.FindAnnotation(RelationalAnnotationNames.ColumnName) is null)
                    property.SetColumnName(ToSnakeCase(property.Name));
            }
        }
    }

    private static string ToSnakeCase(string nombre) =>
        string.Concat(nombre.Select((c, i) => i > 0 && char.IsUpper(c) ? $"_{char.ToLowerInvariant(c)}" : char.ToLowerInvariant(c).ToString()));
}
