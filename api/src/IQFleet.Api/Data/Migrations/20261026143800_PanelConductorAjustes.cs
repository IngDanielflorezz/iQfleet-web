using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IQFleet.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class PanelConductorAjustes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_alertas_clave",
                schema: "iqfleet",
                table: "alertas");

            migrationBuilder.AlterTable(
                name: "vehiculos",
                schema: "iqfleet",
                comment: "Parque automotor. La placa es la llave primaria.");

            migrationBuilder.AlterTable(
                name: "usuarios",
                schema: "iqfleet",
                comment: "Cuentas de acceso. Cada ADMINISTRADOR representa una empresa contratante.");

            migrationBuilder.AlterTable(
                name: "rutas_activas",
                schema: "iqfleet",
                comment: "Posición en vivo de cada conductor en ruta (una fila por usuario).");

            migrationBuilder.AlterTable(
                name: "recorridos",
                schema: "iqfleet",
                comment: "Estela GPS y kilómetros del turno: una fila por usuario y día.");

            migrationBuilder.AlterTable(
                name: "puntajes",
                schema: "iqfleet",
                comment: "Puntaje de conducción del turno: una fila por usuario y día.");

            migrationBuilder.AlterTable(
                name: "movimientos",
                schema: "iqfleet",
                comment: "Ingresos y egresos financieros, opcionalmente asociados a una placa.");

            migrationBuilder.AlterTable(
                name: "fatiga",
                schema: "iqfleet",
                comment: "Cronómetro de conducción continua: una fila por usuario y día.");

            migrationBuilder.AlterTable(
                name: "documentos",
                schema: "iqfleet",
                comment: "Documentos legales (SOAT, RTM, tarjeta de operación, póliza) y su estado en el RUNT.");

            migrationBuilder.AlterTable(
                name: "despachos",
                schema: "iqfleet",
                comment: "Fletes operativos asignados a un vehículo y un conductor.");

            migrationBuilder.AlterTable(
                name: "conductores",
                schema: "iqfleet",
                comment: "Personal operativo de la empresa (ficha del conductor).");

            migrationBuilder.AlterTable(
                name: "checklists",
                schema: "iqfleet",
                comment: "Checklist preoperacional: una fila por usuario y día.");

            migrationBuilder.AlterTable(
                name: "alertas",
                schema: "iqfleet",
                comment: "Alertas operativas: checklist, SOS, fatiga, mensajes y vencimientos.");

            migrationBuilder.AddColumn<DateTime>(
                name: "reanudado_en",
                schema: "iqfleet",
                table: "fatiga",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "aprobado_en",
                schema: "iqfleet",
                table: "checklists",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "blockers",
                schema: "iqfleet",
                table: "checklists",
                type: "jsonb",
                nullable: false,
                defaultValueSql: "'[]'::jsonb");

            migrationBuilder.AddColumn<string>(
                name: "warnings",
                schema: "iqfleet",
                table: "checklists",
                type: "jsonb",
                nullable: false,
                defaultValueSql: "'[]'::jsonb");

            migrationBuilder.CreateIndex(
                name: "IX_alertas_clave",
                schema: "iqfleet",
                table: "alertas",
                column: "clave",
                unique: true,
                filter: "clave is not null and not resuelta");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_alertas_clave",
                schema: "iqfleet",
                table: "alertas");

            migrationBuilder.DropColumn(
                name: "reanudado_en",
                schema: "iqfleet",
                table: "fatiga");

            migrationBuilder.DropColumn(
                name: "aprobado_en",
                schema: "iqfleet",
                table: "checklists");

            migrationBuilder.DropColumn(
                name: "blockers",
                schema: "iqfleet",
                table: "checklists");

            migrationBuilder.DropColumn(
                name: "warnings",
                schema: "iqfleet",
                table: "checklists");

            migrationBuilder.AlterTable(
                name: "vehiculos",
                schema: "iqfleet",
                oldComment: "Parque automotor. La placa es la llave primaria.");

            migrationBuilder.AlterTable(
                name: "usuarios",
                schema: "iqfleet",
                oldComment: "Cuentas de acceso. Cada ADMINISTRADOR representa una empresa contratante.");

            migrationBuilder.AlterTable(
                name: "rutas_activas",
                schema: "iqfleet",
                oldComment: "Posición en vivo de cada conductor en ruta (una fila por usuario).");

            migrationBuilder.AlterTable(
                name: "recorridos",
                schema: "iqfleet",
                oldComment: "Estela GPS y kilómetros del turno: una fila por usuario y día.");

            migrationBuilder.AlterTable(
                name: "puntajes",
                schema: "iqfleet",
                oldComment: "Puntaje de conducción del turno: una fila por usuario y día.");

            migrationBuilder.AlterTable(
                name: "movimientos",
                schema: "iqfleet",
                oldComment: "Ingresos y egresos financieros, opcionalmente asociados a una placa.");

            migrationBuilder.AlterTable(
                name: "fatiga",
                schema: "iqfleet",
                oldComment: "Cronómetro de conducción continua: una fila por usuario y día.");

            migrationBuilder.AlterTable(
                name: "documentos",
                schema: "iqfleet",
                oldComment: "Documentos legales (SOAT, RTM, tarjeta de operación, póliza) y su estado en el RUNT.");

            migrationBuilder.AlterTable(
                name: "despachos",
                schema: "iqfleet",
                oldComment: "Fletes operativos asignados a un vehículo y un conductor.");

            migrationBuilder.AlterTable(
                name: "conductores",
                schema: "iqfleet",
                oldComment: "Personal operativo de la empresa (ficha del conductor).");

            migrationBuilder.AlterTable(
                name: "checklists",
                schema: "iqfleet",
                oldComment: "Checklist preoperacional: una fila por usuario y día.");

            migrationBuilder.AlterTable(
                name: "alertas",
                schema: "iqfleet",
                oldComment: "Alertas operativas: checklist, SOS, fatiga, mensajes y vencimientos.");

            migrationBuilder.CreateIndex(
                name: "IX_alertas_clave",
                schema: "iqfleet",
                table: "alertas",
                column: "clave",
                unique: true,
                filter: "clave is not null");
        }
    }
}
