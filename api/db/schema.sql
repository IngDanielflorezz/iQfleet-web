-- ============================================================================
-- iQFleet — Esquema de base de datos (PostgreSQL / Supabase)
-- ============================================================================
--
-- FUENTE DE VERDAD: las migraciones de EF Core en api/src/IQFleet.Api/Data/Migrations.
-- La API las aplica sola al arrancar (Program.cs → MigrateAsync) y luego carga la
-- semilla de demo (Data/SeedData.cs). Este archivo es el SQL equivalente, generado con
--   dotnet ef migrations script
-- y sirve como documentación o para crear la base a mano en un Postgres vacío.
-- Si cambias el modelo, crea una migración nueva y regenera este archivo.
--
-- Todas las tablas viven en el esquema `iqfleet` (no en `public`), así no chocan con
-- las tablas internas de Supabase. El acceso pasa siempre por la API C#
-- (Authorization: Bearer <IQFLEET_API_TOKEN>); por eso no se usa Supabase Auth ni RLS.
--
-- ----------------------------------------------------------------------------
-- MODELO
-- ----------------------------------------------------------------------------
--
--   conductores 1 ──< vehiculos            (vehiculos.conductor_id, SET NULL)
--   conductores 1 ──o usuarios             (usuarios.conductor_id, único, SET NULL)
--   conductores 1 ──< despachos/documentos (conductor_id, SET NULL; se conserva el nombre)
--
--   vehiculos 1 ──< despachos      (placa, RESTRICT: no se borra un vehículo con historial)
--   vehiculos 1 ──< movimientos    (placa opcional, RESTRICT)
--   vehiculos 1 ──< documentos     (placa opcional, CASCADE: los papeles se van con el vehículo)
--   vehiculos 1 ──< checklists / recorridos / rutas_activas   (placa opcional, SET NULL)
--
--   usuarios 1 ──< alertas                         (usuario_id, SET NULL)
--   usuarios 1 ──< checklists, fatiga, puntajes,   (usuario_id, CASCADE;
--                  recorridos                       único por (usuario_id, fecha))
--   usuarios 1 ──1 rutas_activas                   (PK = usuario_id, CASCADE)
--
-- ----------------------------------------------------------------------------
-- TABLAS
-- ----------------------------------------------------------------------------
--
-- Flota (migración Inicial)
--   conductores    Ficha del conductor. cedula única; categoria_licencia A1..C3;
--                  estado: Activo | En relevo | Inactivo.
--   vehiculos      PK = placa (UVP-123). estado: Operativo | Mantenimiento | Fuera de servicio;
--                  anio 1980..2100; kilometraje >= 0; soat_vence / rtm_vence.
--
-- Operación (migración TablasOperativas)
--   usuarios       Cuentas de acceso (reemplaza profiles + auth.users del diseño anterior).
--                  correo único y en minúsculas; password_hash (PBKDF2 de ASP.NET Identity);
--                  rol: ADMINISTRADOR | CONDUCTOR; licencia obligatoria si es CONDUCTOR.
--                  Cada ADMINISTRADOR define una "empresa contratante".
--   despachos      Fletes. estado: Programado | En ruta | Completado | Cancelado;
--                  valor_flete y costo_operativo >= 0. La API impide dos despachos activos
--                  del mismo vehículo el mismo día (hora de Colombia).
--   documentos     SOAT | RTM | Tarjeta de Operación | Póliza RCC.
--                  estado_runt: Pendiente | Sincronizado | Error de validación;
--                  fecha_vencimiento >= fecha_expedicion; debe tener placa o conductor.
--   movimientos    Finanzas. tipo: Ingreso | Egreso; monto > 0; km >= 0;
--                  medio_pago: Transferencia | Efectivo | Tarjeta | Crédito.
--   alertas        tipo: checklist | sos | fatiga | mensaje | documento | mantenimiento;
--                  severidad: info | warning | danger; lat/lng opcionales (SOS).
--                  `clave` = idempotencia: única entre las alertas NO resueltas.
--
-- Panel del conductor (una fila por usuario y día; los detalles variables en jsonb)
--   checklists     respuestas {itemId: {resultado, nota, vencimiento}}, aprobado,
--                  aprobado_en, blockers [...], warnings [...]. Sin checklist aprobado hoy
--                  la API no deja activar la ruta.
--   fatiga         acumulado_ms >= 0, corriendo, reanudado_en, ultima_pausa_en,
--                  pausas [{en, duracionMs, motivo}].
--   puntajes       eventos {excesoLeve, excesoGrave, frenadaBrusca, aceleracionBrusca},
--                  excesos >= 0, puntos 0..100.
--   recorridos     puntos [{lat, lng, accuracy, timestamp}] (máx. 500), kilometros >= 0.
--   rutas_activas  Posición en vivo: lat -90..90, lng -180..180, velocidad_kmh >= 0.
--
-- Convenciones: llaves uuid con gen_random_uuid(); columnas en snake_case;
-- instantes en timestamptz (UTC); fechas de negocio en date; created_at/updated_at
-- con default now(); los CHECK se llaman ck_<tabla>_<regla>.
-- ============================================================================

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname = 'iqfleet') THEN
        CREATE SCHEMA iqfleet;
    END IF;
END $EF$;
CREATE TABLE IF NOT EXISTS iqfleet.__ef_migrations (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___ef_migrations" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;
DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname = 'iqfleet') THEN
        CREATE SCHEMA iqfleet;
    END IF;
END $EF$;

CREATE TABLE iqfleet.conductores (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    nombre character varying(80) NOT NULL,
    cedula character varying(12) NOT NULL,
    categoria_licencia character varying(2) NOT NULL,
    licencia_vence date NOT NULL,
    telefono character varying(15),
    estado character varying(20) NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT (now()),
    updated_at timestamp with time zone NOT NULL DEFAULT (now()),
    CONSTRAINT "PK_conductores" PRIMARY KEY (id),
    CONSTRAINT ck_conductores_categoria CHECK (categoria_licencia in ('A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3')),
    CONSTRAINT ck_conductores_estado CHECK (estado in ('Activo', 'En relevo', 'Inactivo'))
);

CREATE TABLE iqfleet.vehiculos (
    placa character varying(8) NOT NULL,
    ciudad character varying(40) NOT NULL,
    marca character varying(40) NOT NULL,
    modelo character varying(40) NOT NULL,
    tipo character varying(30) NOT NULL,
    anio integer NOT NULL,
    kilometraje integer NOT NULL,
    estado character varying(20) NOT NULL,
    soat_vence date NOT NULL,
    rtm_vence date NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT (now()),
    updated_at timestamp with time zone NOT NULL DEFAULT (now()),
    conductor_id uuid,
    CONSTRAINT "PK_vehiculos" PRIMARY KEY (placa),
    CONSTRAINT ck_vehiculos_anio CHECK (anio between 1980 and 2100),
    CONSTRAINT ck_vehiculos_estado CHECK (estado in ('Operativo', 'Mantenimiento', 'Fuera de servicio')),
    CONSTRAINT ck_vehiculos_km CHECK (kilometraje >= 0),
    CONSTRAINT "FK_vehiculos_conductores_conductor_id" FOREIGN KEY (conductor_id) REFERENCES iqfleet.conductores (id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX "IX_conductores_cedula" ON iqfleet.conductores (cedula);

CREATE INDEX "IX_vehiculos_conductor_id" ON iqfleet.vehiculos (conductor_id);

INSERT INTO iqfleet.__ef_migrations ("MigrationId", "ProductVersion")
VALUES ('20261022215204_Inicial', '10.0.13');

COMMIT;

START TRANSACTION;
CREATE TABLE iqfleet.despachos (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    placa character varying(8) NOT NULL,
    conductor_id uuid,
    conductor character varying(80) NOT NULL,
    origen character varying(80) NOT NULL,
    destino character varying(80) NOT NULL,
    fecha_salida timestamp with time zone NOT NULL,
    estado character varying(20) NOT NULL,
    valor_flete numeric(14,2) NOT NULL,
    costo_operativo numeric(14,2) NOT NULL,
    observaciones character varying(250),
    created_at timestamp with time zone NOT NULL DEFAULT (now()),
    updated_at timestamp with time zone NOT NULL DEFAULT (now()),
    CONSTRAINT "PK_despachos" PRIMARY KEY (id),
    CONSTRAINT ck_despachos_costo CHECK (costo_operativo >= 0),
    CONSTRAINT ck_despachos_estado CHECK (estado in ('Programado', 'En ruta', 'Completado', 'Cancelado')),
    CONSTRAINT ck_despachos_flete CHECK (valor_flete >= 0),
    CONSTRAINT "FK_despachos_conductores_conductor_id" FOREIGN KEY (conductor_id) REFERENCES iqfleet.conductores (id) ON DELETE SET NULL,
    CONSTRAINT "FK_despachos_vehiculos_placa" FOREIGN KEY (placa) REFERENCES iqfleet.vehiculos (placa) ON DELETE RESTRICT
);

CREATE TABLE iqfleet.documentos (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    tipo character varying(30) NOT NULL,
    numero character varying(40) NOT NULL,
    entidad character varying(80) NOT NULL,
    placa character varying(8),
    conductor_id uuid,
    conductor character varying(80),
    fecha_expedicion date NOT NULL,
    fecha_vencimiento date NOT NULL,
    estado_runt character varying(25) NOT NULL,
    runt_sincronizado_en timestamp with time zone,
    archivo_nombre character varying(150),
    archivo_tipo character varying(50),
    created_at timestamp with time zone NOT NULL DEFAULT (now()),
    updated_at timestamp with time zone NOT NULL DEFAULT (now()),
    CONSTRAINT "PK_documentos" PRIMARY KEY (id),
    CONSTRAINT ck_documentos_estado_runt CHECK (estado_runt in ('Pendiente', 'Sincronizado', 'Error de validación')),
    CONSTRAINT ck_documentos_fechas CHECK (fecha_vencimiento >= fecha_expedicion),
    CONSTRAINT ck_documentos_tipo CHECK (tipo in ('SOAT', 'RTM', 'Tarjeta de Operación', 'Póliza RCC')),
    CONSTRAINT ck_documentos_titular CHECK (placa is not null or (conductor is not null and btrim(conductor) <> '')),
    CONSTRAINT "FK_documentos_conductores_conductor_id" FOREIGN KEY (conductor_id) REFERENCES iqfleet.conductores (id) ON DELETE SET NULL,
    CONSTRAINT "FK_documentos_vehiculos_placa" FOREIGN KEY (placa) REFERENCES iqfleet.vehiculos (placa) ON DELETE CASCADE
);

CREATE TABLE iqfleet.movimientos (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    tipo character varying(10) NOT NULL,
    concepto character varying(80) NOT NULL,
    placa character varying(8),
    conductor character varying(80),
    factura character varying(40),
    medio_pago character varying(20) NOT NULL,
    monto numeric(14,2) NOT NULL,
    km integer,
    fecha date NOT NULL,
    comprobante_nombre character varying(150),
    comprobante_tipo character varying(50),
    created_at timestamp with time zone NOT NULL DEFAULT (now()),
    updated_at timestamp with time zone NOT NULL DEFAULT (now()),
    CONSTRAINT "PK_movimientos" PRIMARY KEY (id),
    CONSTRAINT ck_movimientos_km CHECK (km is null or km >= 0),
    CONSTRAINT ck_movimientos_medio_pago CHECK (medio_pago in ('Transferencia', 'Efectivo', 'Tarjeta', 'Crédito')),
    CONSTRAINT ck_movimientos_monto CHECK (monto > 0),
    CONSTRAINT ck_movimientos_tipo CHECK (tipo in ('Ingreso', 'Egreso')),
    CONSTRAINT "FK_movimientos_vehiculos_placa" FOREIGN KEY (placa) REFERENCES iqfleet.vehiculos (placa) ON DELETE RESTRICT
);

CREATE TABLE iqfleet.usuarios (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    nombres character varying(40) NOT NULL,
    apellidos character varying(40) NOT NULL,
    correo character varying(120) NOT NULL,
    telefono character varying(20),
    empresa character varying(60) NOT NULL,
    licencia character varying(20),
    rol character varying(15) NOT NULL,
    password_hash character varying(200) NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT (now()),
    updated_at timestamp with time zone NOT NULL DEFAULT (now()),
    conductor_id uuid,
    CONSTRAINT "PK_usuarios" PRIMARY KEY (id),
    CONSTRAINT ck_usuarios_correo CHECK (correo = lower(correo) and correo like '%_@_%'),
    CONSTRAINT ck_usuarios_licencia CHECK (rol = 'ADMINISTRADOR' or (licencia is not null and btrim(licencia) <> '')),
    CONSTRAINT ck_usuarios_rol CHECK (rol in ('ADMINISTRADOR', 'CONDUCTOR')),
    CONSTRAINT "FK_usuarios_conductores_conductor_id" FOREIGN KEY (conductor_id) REFERENCES iqfleet.conductores (id) ON DELETE SET NULL
);

CREATE TABLE iqfleet.alertas (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    tipo character varying(15) NOT NULL,
    severidad character varying(10) NOT NULL,
    usuario_id uuid,
    conductor character varying(80),
    empresa character varying(60) NOT NULL,
    titulo character varying(120) NOT NULL,
    detalle character varying(500),
    lat double precision,
    lng double precision,
    clave character varying(120),
    resuelta boolean NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT (now()),
    resuelta_en timestamp with time zone,
    CONSTRAINT "PK_alertas" PRIMARY KEY (id),
    CONSTRAINT ck_alertas_lat CHECK (lat is null or lat between -90 and 90),
    CONSTRAINT ck_alertas_lng CHECK (lng is null or lng between -180 and 180),
    CONSTRAINT ck_alertas_resuelta CHECK (resuelta or resuelta_en is null),
    CONSTRAINT ck_alertas_severidad CHECK (severidad in ('info', 'warning', 'danger')),
    CONSTRAINT ck_alertas_tipo CHECK (tipo in ('checklist', 'sos', 'fatiga', 'mensaje', 'documento', 'mantenimiento')),
    CONSTRAINT "FK_alertas_usuarios_usuario_id" FOREIGN KEY (usuario_id) REFERENCES iqfleet.usuarios (id) ON DELETE SET NULL
);

CREATE TABLE iqfleet.checklists (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    usuario_id uuid NOT NULL,
    fecha date NOT NULL,
    placa character varying(8),
    respuestas jsonb NOT NULL DEFAULT ('{}'::jsonb),
    aprobado boolean NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT (now()),
    updated_at timestamp with time zone NOT NULL DEFAULT (now()),
    CONSTRAINT "PK_checklists" PRIMARY KEY (id),
    CONSTRAINT "FK_checklists_usuarios_usuario_id" FOREIGN KEY (usuario_id) REFERENCES iqfleet.usuarios (id) ON DELETE CASCADE,
    CONSTRAINT "FK_checklists_vehiculos_placa" FOREIGN KEY (placa) REFERENCES iqfleet.vehiculos (placa) ON DELETE SET NULL
);

CREATE TABLE iqfleet.fatiga (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    usuario_id uuid NOT NULL,
    fecha date NOT NULL,
    iniciado_en timestamp with time zone NOT NULL DEFAULT (now()),
    acumulado_ms bigint NOT NULL,
    corriendo boolean NOT NULL,
    ultima_pausa_en timestamp with time zone,
    pausas jsonb NOT NULL DEFAULT ('[]'::jsonb),
    updated_at timestamp with time zone NOT NULL DEFAULT (now()),
    CONSTRAINT "PK_fatiga" PRIMARY KEY (id),
    CONSTRAINT ck_fatiga_acumulado CHECK (acumulado_ms >= 0),
    CONSTRAINT "FK_fatiga_usuarios_usuario_id" FOREIGN KEY (usuario_id) REFERENCES iqfleet.usuarios (id) ON DELETE CASCADE
);

CREATE TABLE iqfleet.puntajes (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    usuario_id uuid NOT NULL,
    fecha date NOT NULL,
    eventos jsonb NOT NULL DEFAULT ('{}'::jsonb),
    excesos integer NOT NULL,
    puntos integer NOT NULL DEFAULT 100,
    updated_at timestamp with time zone NOT NULL DEFAULT (now()),
    CONSTRAINT "PK_puntajes" PRIMARY KEY (id),
    CONSTRAINT ck_puntajes_excesos CHECK (excesos >= 0),
    CONSTRAINT ck_puntajes_puntos CHECK (puntos between 0 and 100),
    CONSTRAINT "FK_puntajes_usuarios_usuario_id" FOREIGN KEY (usuario_id) REFERENCES iqfleet.usuarios (id) ON DELETE CASCADE
);

CREATE TABLE iqfleet.recorridos (
    id uuid NOT NULL DEFAULT (gen_random_uuid()),
    usuario_id uuid NOT NULL,
    fecha date NOT NULL,
    placa character varying(8),
    puntos jsonb NOT NULL DEFAULT ('[]'::jsonb),
    kilometros numeric(10,2) NOT NULL,
    updated_at timestamp with time zone NOT NULL DEFAULT (now()),
    CONSTRAINT "PK_recorridos" PRIMARY KEY (id),
    CONSTRAINT ck_recorridos_km CHECK (kilometros >= 0),
    CONSTRAINT "FK_recorridos_usuarios_usuario_id" FOREIGN KEY (usuario_id) REFERENCES iqfleet.usuarios (id) ON DELETE CASCADE,
    CONSTRAINT "FK_recorridos_vehiculos_placa" FOREIGN KEY (placa) REFERENCES iqfleet.vehiculos (placa) ON DELETE SET NULL
);

CREATE TABLE iqfleet.rutas_activas (
    usuario_id uuid NOT NULL,
    placa character varying(8),
    lat double precision NOT NULL,
    lng double precision NOT NULL,
    velocidad_kmh numeric(6,2) NOT NULL,
    iniciada_en timestamp with time zone NOT NULL DEFAULT (now()),
    updated_at timestamp with time zone NOT NULL DEFAULT (now()),
    CONSTRAINT "PK_rutas_activas" PRIMARY KEY (usuario_id),
    CONSTRAINT ck_rutas_activas_lat CHECK (lat between -90 and 90),
    CONSTRAINT ck_rutas_activas_lng CHECK (lng between -180 and 180),
    CONSTRAINT ck_rutas_activas_velocidad CHECK (velocidad_kmh >= 0),
    CONSTRAINT "FK_rutas_activas_usuarios_usuario_id" FOREIGN KEY (usuario_id) REFERENCES iqfleet.usuarios (id) ON DELETE CASCADE,
    CONSTRAINT "FK_rutas_activas_vehiculos_placa" FOREIGN KEY (placa) REFERENCES iqfleet.vehiculos (placa) ON DELETE SET NULL
);

CREATE UNIQUE INDEX "IX_alertas_clave" ON iqfleet.alertas (clave) WHERE clave is not null;

CREATE INDEX "IX_alertas_empresa_resuelta_created_at" ON iqfleet.alertas (empresa, resuelta, created_at);

CREATE INDEX "IX_alertas_usuario_id" ON iqfleet.alertas (usuario_id);

CREATE INDEX "IX_checklists_placa" ON iqfleet.checklists (placa);

CREATE UNIQUE INDEX "IX_checklists_usuario_id_fecha" ON iqfleet.checklists (usuario_id, fecha);

CREATE INDEX "IX_despachos_conductor_id" ON iqfleet.despachos (conductor_id);

CREATE INDEX "IX_despachos_fecha_salida" ON iqfleet.despachos (fecha_salida);

CREATE INDEX "IX_despachos_placa_fecha_salida" ON iqfleet.despachos (placa, fecha_salida);

CREATE INDEX "IX_documentos_conductor_id" ON iqfleet.documentos (conductor_id);

CREATE INDEX "IX_documentos_fecha_vencimiento" ON iqfleet.documentos (fecha_vencimiento);

CREATE INDEX "IX_documentos_placa" ON iqfleet.documentos (placa);

CREATE UNIQUE INDEX "IX_fatiga_usuario_id_fecha" ON iqfleet.fatiga (usuario_id, fecha);

CREATE INDEX "IX_movimientos_fecha" ON iqfleet.movimientos (fecha);

CREATE INDEX "IX_movimientos_placa_fecha" ON iqfleet.movimientos (placa, fecha);

CREATE UNIQUE INDEX "IX_puntajes_usuario_id_fecha" ON iqfleet.puntajes (usuario_id, fecha);

CREATE INDEX "IX_recorridos_placa" ON iqfleet.recorridos (placa);

CREATE UNIQUE INDEX "IX_recorridos_usuario_id_fecha" ON iqfleet.recorridos (usuario_id, fecha);

CREATE INDEX "IX_rutas_activas_placa" ON iqfleet.rutas_activas (placa);

CREATE UNIQUE INDEX "IX_usuarios_conductor_id" ON iqfleet.usuarios (conductor_id);

CREATE UNIQUE INDEX "IX_usuarios_correo" ON iqfleet.usuarios (correo);

CREATE INDEX "IX_usuarios_empresa_rol" ON iqfleet.usuarios (empresa, rol);

INSERT INTO iqfleet.__ef_migrations ("MigrationId", "ProductVersion")
VALUES ('20261026141732_TablasOperativas', '10.0.13');

COMMIT;

START TRANSACTION;
DROP INDEX iqfleet."IX_alertas_clave";

COMMENT ON TABLE iqfleet.vehiculos IS 'Parque automotor. La placa es la llave primaria.';

COMMENT ON TABLE iqfleet.usuarios IS 'Cuentas de acceso. Cada ADMINISTRADOR representa una empresa contratante.';

COMMENT ON TABLE iqfleet.rutas_activas IS 'Posición en vivo de cada conductor en ruta (una fila por usuario).';

COMMENT ON TABLE iqfleet.recorridos IS 'Estela GPS y kilómetros del turno: una fila por usuario y día.';

COMMENT ON TABLE iqfleet.puntajes IS 'Puntaje de conducción del turno: una fila por usuario y día.';

COMMENT ON TABLE iqfleet.movimientos IS 'Ingresos y egresos financieros, opcionalmente asociados a una placa.';

COMMENT ON TABLE iqfleet.fatiga IS 'Cronómetro de conducción continua: una fila por usuario y día.';

COMMENT ON TABLE iqfleet.documentos IS 'Documentos legales (SOAT, RTM, tarjeta de operación, póliza) y su estado en el RUNT.';

COMMENT ON TABLE iqfleet.despachos IS 'Fletes operativos asignados a un vehículo y un conductor.';

COMMENT ON TABLE iqfleet.conductores IS 'Personal operativo de la empresa (ficha del conductor).';

COMMENT ON TABLE iqfleet.checklists IS 'Checklist preoperacional: una fila por usuario y día.';

COMMENT ON TABLE iqfleet.alertas IS 'Alertas operativas: checklist, SOS, fatiga, mensajes y vencimientos.';

ALTER TABLE iqfleet.fatiga ADD reanudado_en timestamp with time zone;

ALTER TABLE iqfleet.checklists ADD aprobado_en timestamp with time zone;

ALTER TABLE iqfleet.checklists ADD blockers jsonb NOT NULL DEFAULT ('[]'::jsonb);

ALTER TABLE iqfleet.checklists ADD warnings jsonb NOT NULL DEFAULT ('[]'::jsonb);

CREATE UNIQUE INDEX "IX_alertas_clave" ON iqfleet.alertas (clave) WHERE clave is not null and not resuelta;

INSERT INTO iqfleet.__ef_migrations ("MigrationId", "ProductVersion")
VALUES ('20261026143800_PanelConductorAjustes', '10.0.13');

COMMIT;


