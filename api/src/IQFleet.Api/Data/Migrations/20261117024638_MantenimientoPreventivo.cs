using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IQFleet.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class MantenimientoPreventivo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "planes_mantenimiento",
                schema: "iqfleet",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    placa = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    tarea = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    cada_km = table.Column<int>(type: "integer", nullable: true),
                    cada_dias = table.Column<int>(type: "integer", nullable: true),
                    ultimo_km = table.Column<int>(type: "integer", nullable: true),
                    ultima_fecha = table.Column<DateOnly>(type: "date", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_planes_mantenimiento", x => x.id);
                    table.CheckConstraint("ck_planes_cada_dias", "cada_dias is null or cada_dias > 0");
                    table.CheckConstraint("ck_planes_cada_km", "cada_km is null or cada_km > 0");
                    table.CheckConstraint("ck_planes_frecuencia", "cada_km is not null or cada_dias is not null");
                    table.CheckConstraint("ck_planes_ultimo_km", "ultimo_km is null or ultimo_km >= 0");
                    table.ForeignKey(
                        name: "FK_planes_mantenimiento_vehiculos_placa",
                        column: x => x.placa,
                        principalSchema: "iqfleet",
                        principalTable: "vehiculos",
                        principalColumn: "placa",
                        onDelete: ReferentialAction.Cascade);
                },
                comment: "Plan de mantenimiento preventivo por vehículo: tarea y frecuencia en km y/o días.");

            migrationBuilder.CreateTable(
                name: "ordenes_mantenimiento",
                schema: "iqfleet",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    placa = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    tipo = table.Column<string>(type: "character varying(12)", maxLength: 12, nullable: false),
                    plan_id = table.Column<Guid>(type: "uuid", nullable: true),
                    descripcion = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    estado = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    fecha_apertura = table.Column<DateOnly>(type: "date", nullable: false),
                    fecha_cierre = table.Column<DateOnly>(type: "date", nullable: true),
                    km_apertura = table.Column<int>(type: "integer", nullable: false),
                    km_cierre = table.Column<int>(type: "integer", nullable: true),
                    costo = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: true),
                    taller = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    observaciones = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    movimiento_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ordenes_mantenimiento", x => x.id);
                    table.CheckConstraint("ck_ordenes_cierre", "(estado = 'Abierta' and fecha_cierre is null) or (estado = 'Cerrada' and fecha_cierre >= fecha_apertura)");
                    table.CheckConstraint("ck_ordenes_costo", "costo is null or costo >= 0");
                    table.CheckConstraint("ck_ordenes_estado", "estado in ('Abierta', 'Cerrada')");
                    table.CheckConstraint("ck_ordenes_km", "km_apertura >= 0 and (km_cierre is null or km_cierre >= km_apertura)");
                    table.CheckConstraint("ck_ordenes_tipo", "tipo in ('Preventivo', 'Correctivo')");
                    table.ForeignKey(
                        name: "FK_ordenes_mantenimiento_movimientos_movimiento_id",
                        column: x => x.movimiento_id,
                        principalSchema: "iqfleet",
                        principalTable: "movimientos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ordenes_mantenimiento_planes_mantenimiento_plan_id",
                        column: x => x.plan_id,
                        principalSchema: "iqfleet",
                        principalTable: "planes_mantenimiento",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ordenes_mantenimiento_vehiculos_placa",
                        column: x => x.placa,
                        principalSchema: "iqfleet",
                        principalTable: "vehiculos",
                        principalColumn: "placa",
                        onDelete: ReferentialAction.Restrict);
                },
                comment: "Órdenes de mantenimiento (historial); al cerrarse registran el egreso en Finanzas.");

            migrationBuilder.CreateIndex(
                name: "IX_ordenes_mantenimiento_movimiento_id",
                schema: "iqfleet",
                table: "ordenes_mantenimiento",
                column: "movimiento_id");

            migrationBuilder.CreateIndex(
                name: "IX_ordenes_mantenimiento_placa_fecha_apertura",
                schema: "iqfleet",
                table: "ordenes_mantenimiento",
                columns: new[] { "placa", "fecha_apertura" });

            migrationBuilder.CreateIndex(
                name: "IX_ordenes_mantenimiento_plan_id",
                schema: "iqfleet",
                table: "ordenes_mantenimiento",
                column: "plan_id");

            migrationBuilder.CreateIndex(
                name: "ux_ordenes_una_abierta_por_vehiculo",
                schema: "iqfleet",
                table: "ordenes_mantenimiento",
                column: "placa",
                unique: true,
                filter: "estado = 'Abierta'");

            migrationBuilder.CreateIndex(
                name: "IX_planes_mantenimiento_placa_tarea",
                schema: "iqfleet",
                table: "planes_mantenimiento",
                columns: new[] { "placa", "tarea" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ordenes_mantenimiento",
                schema: "iqfleet");

            migrationBuilder.DropTable(
                name: "planes_mantenimiento",
                schema: "iqfleet");
        }
    }
}
