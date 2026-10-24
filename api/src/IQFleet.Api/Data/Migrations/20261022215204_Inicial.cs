using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IQFleet.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class Inicial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "iqfleet");

            migrationBuilder.CreateTable(
                name: "conductores",
                schema: "iqfleet",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    nombre = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    cedula = table.Column<string>(type: "character varying(12)", maxLength: 12, nullable: false),
                    categoria_licencia = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                    licencia_vence = table.Column<DateOnly>(type: "date", nullable: false),
                    telefono = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: true),
                    estado = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_conductores", x => x.id);
                    table.CheckConstraint("ck_conductores_categoria", "categoria_licencia in ('A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3')");
                    table.CheckConstraint("ck_conductores_estado", "estado in ('Activo', 'En relevo', 'Inactivo')");
                });

            migrationBuilder.CreateTable(
                name: "vehiculos",
                schema: "iqfleet",
                columns: table => new
                {
                    placa = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    ciudad = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    marca = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    modelo = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    tipo = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    anio = table.Column<int>(type: "integer", nullable: false),
                    kilometraje = table.Column<int>(type: "integer", nullable: false),
                    estado = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    soat_vence = table.Column<DateOnly>(type: "date", nullable: false),
                    rtm_vence = table.Column<DateOnly>(type: "date", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    conductor_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vehiculos", x => x.placa);
                    table.CheckConstraint("ck_vehiculos_anio", "anio between 1980 and 2100");
                    table.CheckConstraint("ck_vehiculos_estado", "estado in ('Operativo', 'Mantenimiento', 'Fuera de servicio')");
                    table.CheckConstraint("ck_vehiculos_km", "kilometraje >= 0");
                    table.ForeignKey(
                        name: "FK_vehiculos_conductores_conductor_id",
                        column: x => x.conductor_id,
                        principalSchema: "iqfleet",
                        principalTable: "conductores",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_conductores_cedula",
                schema: "iqfleet",
                table: "conductores",
                column: "cedula",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_vehiculos_conductor_id",
                schema: "iqfleet",
                table: "vehiculos",
                column: "conductor_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "vehiculos",
                schema: "iqfleet");

            migrationBuilder.DropTable(
                name: "conductores",
                schema: "iqfleet");
        }
    }
}
