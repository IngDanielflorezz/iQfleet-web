using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IQFleet.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class TablasOperativas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "despachos",
                schema: "iqfleet",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    placa = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    conductor_id = table.Column<Guid>(type: "uuid", nullable: true),
                    conductor = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    origen = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    destino = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    fecha_salida = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    estado = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    valor_flete = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    costo_operativo = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    observaciones = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_despachos", x => x.id);
                    table.CheckConstraint("ck_despachos_costo", "costo_operativo >= 0");
                    table.CheckConstraint("ck_despachos_estado", "estado in ('Programado', 'En ruta', 'Completado', 'Cancelado')");
                    table.CheckConstraint("ck_despachos_flete", "valor_flete >= 0");
                    table.ForeignKey(
                        name: "FK_despachos_conductores_conductor_id",
                        column: x => x.conductor_id,
                        principalSchema: "iqfleet",
                        principalTable: "conductores",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_despachos_vehiculos_placa",
                        column: x => x.placa,
                        principalSchema: "iqfleet",
                        principalTable: "vehiculos",
                        principalColumn: "placa",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "documentos",
                schema: "iqfleet",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    tipo = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    numero = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    entidad = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    placa = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    conductor_id = table.Column<Guid>(type: "uuid", nullable: true),
                    conductor = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    fecha_expedicion = table.Column<DateOnly>(type: "date", nullable: false),
                    fecha_vencimiento = table.Column<DateOnly>(type: "date", nullable: false),
                    estado_runt = table.Column<string>(type: "character varying(25)", maxLength: 25, nullable: false),
                    runt_sincronizado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    archivo_nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    archivo_tipo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_documentos", x => x.id);
                    table.CheckConstraint("ck_documentos_estado_runt", "estado_runt in ('Pendiente', 'Sincronizado', 'Error de validación')");
                    table.CheckConstraint("ck_documentos_fechas", "fecha_vencimiento >= fecha_expedicion");
                    table.CheckConstraint("ck_documentos_tipo", "tipo in ('SOAT', 'RTM', 'Tarjeta de Operación', 'Póliza RCC')");
                    table.CheckConstraint("ck_documentos_titular", "placa is not null or (conductor is not null and btrim(conductor) <> '')");
                    table.ForeignKey(
                        name: "FK_documentos_conductores_conductor_id",
                        column: x => x.conductor_id,
                        principalSchema: "iqfleet",
                        principalTable: "conductores",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_documentos_vehiculos_placa",
                        column: x => x.placa,
                        principalSchema: "iqfleet",
                        principalTable: "vehiculos",
                        principalColumn: "placa",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "movimientos",
                schema: "iqfleet",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    tipo = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    concepto = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    placa = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    conductor = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    factura = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    medio_pago = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    monto = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    km = table.Column<int>(type: "integer", nullable: true),
                    fecha = table.Column<DateOnly>(type: "date", nullable: false),
                    comprobante_nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    comprobante_tipo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_movimientos", x => x.id);
                    table.CheckConstraint("ck_movimientos_km", "km is null or km >= 0");
                    table.CheckConstraint("ck_movimientos_medio_pago", "medio_pago in ('Transferencia', 'Efectivo', 'Tarjeta', 'Crédito')");
                    table.CheckConstraint("ck_movimientos_monto", "monto > 0");
                    table.CheckConstraint("ck_movimientos_tipo", "tipo in ('Ingreso', 'Egreso')");
                    table.ForeignKey(
                        name: "FK_movimientos_vehiculos_placa",
                        column: x => x.placa,
                        principalSchema: "iqfleet",
                        principalTable: "vehiculos",
                        principalColumn: "placa",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "usuarios",
                schema: "iqfleet",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    nombres = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    apellidos = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    correo = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    telefono = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    empresa = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    licencia = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    rol = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    password_hash = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    conductor_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_usuarios", x => x.id);
                    table.CheckConstraint("ck_usuarios_correo", "correo = lower(correo) and correo like '%_@_%'");
                    table.CheckConstraint("ck_usuarios_licencia", "rol = 'ADMINISTRADOR' or (licencia is not null and btrim(licencia) <> '')");
                    table.CheckConstraint("ck_usuarios_rol", "rol in ('ADMINISTRADOR', 'CONDUCTOR')");
                    table.ForeignKey(
                        name: "FK_usuarios_conductores_conductor_id",
                        column: x => x.conductor_id,
                        principalSchema: "iqfleet",
                        principalTable: "conductores",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "alertas",
                schema: "iqfleet",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    tipo = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    severidad = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    usuario_id = table.Column<Guid>(type: "uuid", nullable: true),
                    conductor = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    empresa = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    titulo = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    detalle = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    lat = table.Column<double>(type: "double precision", nullable: true),
                    lng = table.Column<double>(type: "double precision", nullable: true),
                    clave = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    resuelta = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    resuelta_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_alertas", x => x.id);
                    table.CheckConstraint("ck_alertas_lat", "lat is null or lat between -90 and 90");
                    table.CheckConstraint("ck_alertas_lng", "lng is null or lng between -180 and 180");
                    table.CheckConstraint("ck_alertas_resuelta", "resuelta or resuelta_en is null");
                    table.CheckConstraint("ck_alertas_severidad", "severidad in ('info', 'warning', 'danger')");
                    table.CheckConstraint("ck_alertas_tipo", "tipo in ('checklist', 'sos', 'fatiga', 'mensaje', 'documento', 'mantenimiento')");
                    table.ForeignKey(
                        name: "FK_alertas_usuarios_usuario_id",
                        column: x => x.usuario_id,
                        principalSchema: "iqfleet",
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "checklists",
                schema: "iqfleet",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    usuario_id = table.Column<Guid>(type: "uuid", nullable: false),
                    fecha = table.Column<DateOnly>(type: "date", nullable: false),
                    placa = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    respuestas = table.Column<string>(type: "jsonb", nullable: false, defaultValueSql: "'{}'::jsonb"),
                    aprobado = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_checklists", x => x.id);
                    table.ForeignKey(
                        name: "FK_checklists_usuarios_usuario_id",
                        column: x => x.usuario_id,
                        principalSchema: "iqfleet",
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_checklists_vehiculos_placa",
                        column: x => x.placa,
                        principalSchema: "iqfleet",
                        principalTable: "vehiculos",
                        principalColumn: "placa",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "fatiga",
                schema: "iqfleet",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    usuario_id = table.Column<Guid>(type: "uuid", nullable: false),
                    fecha = table.Column<DateOnly>(type: "date", nullable: false),
                    iniciado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    acumulado_ms = table.Column<long>(type: "bigint", nullable: false),
                    corriendo = table.Column<bool>(type: "boolean", nullable: false),
                    ultima_pausa_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    pausas = table.Column<string>(type: "jsonb", nullable: false, defaultValueSql: "'[]'::jsonb"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fatiga", x => x.id);
                    table.CheckConstraint("ck_fatiga_acumulado", "acumulado_ms >= 0");
                    table.ForeignKey(
                        name: "FK_fatiga_usuarios_usuario_id",
                        column: x => x.usuario_id,
                        principalSchema: "iqfleet",
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "puntajes",
                schema: "iqfleet",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    usuario_id = table.Column<Guid>(type: "uuid", nullable: false),
                    fecha = table.Column<DateOnly>(type: "date", nullable: false),
                    eventos = table.Column<string>(type: "jsonb", nullable: false, defaultValueSql: "'{}'::jsonb"),
                    excesos = table.Column<int>(type: "integer", nullable: false),
                    puntos = table.Column<int>(type: "integer", nullable: false, defaultValue: 100),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_puntajes", x => x.id);
                    table.CheckConstraint("ck_puntajes_excesos", "excesos >= 0");
                    table.CheckConstraint("ck_puntajes_puntos", "puntos between 0 and 100");
                    table.ForeignKey(
                        name: "FK_puntajes_usuarios_usuario_id",
                        column: x => x.usuario_id,
                        principalSchema: "iqfleet",
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "recorridos",
                schema: "iqfleet",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    usuario_id = table.Column<Guid>(type: "uuid", nullable: false),
                    fecha = table.Column<DateOnly>(type: "date", nullable: false),
                    placa = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    puntos = table.Column<string>(type: "jsonb", nullable: false, defaultValueSql: "'[]'::jsonb"),
                    kilometros = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_recorridos", x => x.id);
                    table.CheckConstraint("ck_recorridos_km", "kilometros >= 0");
                    table.ForeignKey(
                        name: "FK_recorridos_usuarios_usuario_id",
                        column: x => x.usuario_id,
                        principalSchema: "iqfleet",
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_recorridos_vehiculos_placa",
                        column: x => x.placa,
                        principalSchema: "iqfleet",
                        principalTable: "vehiculos",
                        principalColumn: "placa",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "rutas_activas",
                schema: "iqfleet",
                columns: table => new
                {
                    usuario_id = table.Column<Guid>(type: "uuid", nullable: false),
                    placa = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    lat = table.Column<double>(type: "double precision", nullable: false),
                    lng = table.Column<double>(type: "double precision", nullable: false),
                    velocidad_kmh = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: false),
                    iniciada_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rutas_activas", x => x.usuario_id);
                    table.CheckConstraint("ck_rutas_activas_lat", "lat between -90 and 90");
                    table.CheckConstraint("ck_rutas_activas_lng", "lng between -180 and 180");
                    table.CheckConstraint("ck_rutas_activas_velocidad", "velocidad_kmh >= 0");
                    table.ForeignKey(
                        name: "FK_rutas_activas_usuarios_usuario_id",
                        column: x => x.usuario_id,
                        principalSchema: "iqfleet",
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_rutas_activas_vehiculos_placa",
                        column: x => x.placa,
                        principalSchema: "iqfleet",
                        principalTable: "vehiculos",
                        principalColumn: "placa",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_alertas_clave",
                schema: "iqfleet",
                table: "alertas",
                column: "clave",
                unique: true,
                filter: "clave is not null");

            migrationBuilder.CreateIndex(
                name: "IX_alertas_empresa_resuelta_created_at",
                schema: "iqfleet",
                table: "alertas",
                columns: new[] { "empresa", "resuelta", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_alertas_usuario_id",
                schema: "iqfleet",
                table: "alertas",
                column: "usuario_id");

            migrationBuilder.CreateIndex(
                name: "IX_checklists_placa",
                schema: "iqfleet",
                table: "checklists",
                column: "placa");

            migrationBuilder.CreateIndex(
                name: "IX_checklists_usuario_id_fecha",
                schema: "iqfleet",
                table: "checklists",
                columns: new[] { "usuario_id", "fecha" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_despachos_conductor_id",
                schema: "iqfleet",
                table: "despachos",
                column: "conductor_id");

            migrationBuilder.CreateIndex(
                name: "IX_despachos_fecha_salida",
                schema: "iqfleet",
                table: "despachos",
                column: "fecha_salida");

            migrationBuilder.CreateIndex(
                name: "IX_despachos_placa_fecha_salida",
                schema: "iqfleet",
                table: "despachos",
                columns: new[] { "placa", "fecha_salida" });

            migrationBuilder.CreateIndex(
                name: "IX_documentos_conductor_id",
                schema: "iqfleet",
                table: "documentos",
                column: "conductor_id");

            migrationBuilder.CreateIndex(
                name: "IX_documentos_fecha_vencimiento",
                schema: "iqfleet",
                table: "documentos",
                column: "fecha_vencimiento");

            migrationBuilder.CreateIndex(
                name: "IX_documentos_placa",
                schema: "iqfleet",
                table: "documentos",
                column: "placa");

            migrationBuilder.CreateIndex(
                name: "IX_fatiga_usuario_id_fecha",
                schema: "iqfleet",
                table: "fatiga",
                columns: new[] { "usuario_id", "fecha" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_movimientos_fecha",
                schema: "iqfleet",
                table: "movimientos",
                column: "fecha");

            migrationBuilder.CreateIndex(
                name: "IX_movimientos_placa_fecha",
                schema: "iqfleet",
                table: "movimientos",
                columns: new[] { "placa", "fecha" });

            migrationBuilder.CreateIndex(
                name: "IX_puntajes_usuario_id_fecha",
                schema: "iqfleet",
                table: "puntajes",
                columns: new[] { "usuario_id", "fecha" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_recorridos_placa",
                schema: "iqfleet",
                table: "recorridos",
                column: "placa");

            migrationBuilder.CreateIndex(
                name: "IX_recorridos_usuario_id_fecha",
                schema: "iqfleet",
                table: "recorridos",
                columns: new[] { "usuario_id", "fecha" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_rutas_activas_placa",
                schema: "iqfleet",
                table: "rutas_activas",
                column: "placa");

            migrationBuilder.CreateIndex(
                name: "IX_usuarios_conductor_id",
                schema: "iqfleet",
                table: "usuarios",
                column: "conductor_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_usuarios_correo",
                schema: "iqfleet",
                table: "usuarios",
                column: "correo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_usuarios_empresa_rol",
                schema: "iqfleet",
                table: "usuarios",
                columns: new[] { "empresa", "rol" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "alertas",
                schema: "iqfleet");

            migrationBuilder.DropTable(
                name: "checklists",
                schema: "iqfleet");

            migrationBuilder.DropTable(
                name: "despachos",
                schema: "iqfleet");

            migrationBuilder.DropTable(
                name: "documentos",
                schema: "iqfleet");

            migrationBuilder.DropTable(
                name: "fatiga",
                schema: "iqfleet");

            migrationBuilder.DropTable(
                name: "movimientos",
                schema: "iqfleet");

            migrationBuilder.DropTable(
                name: "puntajes",
                schema: "iqfleet");

            migrationBuilder.DropTable(
                name: "recorridos",
                schema: "iqfleet");

            migrationBuilder.DropTable(
                name: "rutas_activas",
                schema: "iqfleet");

            migrationBuilder.DropTable(
                name: "usuarios",
                schema: "iqfleet");
        }
    }
}
