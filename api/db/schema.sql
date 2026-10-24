-- ============================================================================
-- iQFleet — Esquema completo y optimizado para Supabase (PostgreSQL)
-- ============================================================================
--
-- Este archivo crea TODO lo necesario para arrancar la base de datos:
--   1. Tipos y utilidades (funciones security definer para RLS sin recursión)
--   2. Tablas de dominio (perfiles, rutas, conductores, vehículos, despachos, etc.)
--   3. Tablas del panel del conductor (alertas, checklist, fatiga, puntaje, recorrido)
--   4. Índices de rendimiento y búsqueda por empresa/vencimientos
--   5. Row Level Security (RLS) y políticas multi-tenant por empresa y rol
--   6. Triggers y funciones de negocio (autoperfil, updated_at, alertas de vencimiento)
--   7. Realtime (publicación de las tablas que el front observa)
--   8. Buckets de Storage (adjuntos de documentos y comprobantes)
--   9. Datos semilla (seed) para demo
--
-- IDEMPOTENTE: se puede volver a ejecutar sin romper datos existentes.
-- ============================================================================

-- ============================================================================
-- 1. TIPOS Y UTILIDADES
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('ADMINISTRADOR', 'CONDUCTOR');
  end if;
end
$$;

-- Función auxiliar: rol del usuario autenticado (evita recursión en RLS).
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol = 'ADMINISTRADOR'
  );
$$;

-- Función auxiliar: empresa del usuario autenticado.
create or replace function public.mi_empresa()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select empresa from public.profiles where id = auth.uid();
$$;

-- ============================================================================
-- 2. TABLAS DE DOMINIO
-- ============================================================================

-- ---------------------------------------------------------------- profiles --
-- Perfiles 1:1 con auth.users. Guarda rol, empresa y licencia.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombres varchar(40) not null constraint nombres_no_vacios check(trim(nombres) != ''),
  apellidos varchar(40) not null constraint apellidos_no_vacios check(trim(apellidos) != ''),
  telefono text,
  empresa varchar(60) not null constraint empresa_no_vacia check(trim(empresa) != ''),
  licencia text,
  rol public.user_role not null default 'CONDUCTOR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- La licencia es obligatoria para CONDUCTOR, pero opcional para ADMINISTRADOR
  constraint licencia_obligatoria_conductor check (
    rol = 'ADMINISTRADOR' or (licencia is not null and trim(licencia) != '')
  )
);

-- ------------------------------------------------------------ conductores --
-- Registro operativo y de afiliación de conductores en la empresa.
create table if not exists public.conductores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles(id) on delete set null,
  empresa varchar(60) not null constraint empresa_o_afiliacion check(trim(empresa) != ''),
  nombre varchar(80) not null constraint nombre_siempre check(trim(nombre) != ''),
  cedula text not null constraint cedula_no_vacia check(trim(cedula) != ''),
  categoria_licencia varchar(5) constraint categoria_valida check (
    categoria_licencia is null or categoria_licencia in ('A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3')
  ),
  licencia_vence date,
  telefono text,
  estado text not null default 'Activo' constraint estado_conductor_valido check (
    estado in ('Activo', 'Inactivo', 'Pendiente afiliacion', 'Suspendido')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa, cedula)
);

-- -------------------------------------------------------------- vehiculos --
create table if not exists public.vehiculos (
  id uuid primary key default gen_random_uuid(),
  empresa varchar(60) not null constraint empresa_o_afiliacion check(trim(empresa) != ''),
  placa varchar(6) not null constraint placa_formato check (
    trim(placa) != '' and upper(placa) ~ '^[A-Z]{3}[0-9]{2}[0-9A-Z]$'
  ),
  marca varchar(30),
  modelo text,
  anio int constraint anio_logico check (
    anio is null or (anio between 1980 and (extract(year from current_date)::int + 2))
  ),
  kilometraje int not null default 0 constraint km_positivo check (kilometraje >= 0),
  soat_vence date,
  rtm_vence date,
  estado text not null default 'Disponible' constraint estado_vehiculo_valido check (
    estado in ('Disponible', 'En ruta', 'Mantenimiento', 'Fuera de servicio')
  ),
  conductor_id uuid references public.conductores(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa, placa)
);

-- ---------------------------------------------------------- active_routes --
-- Rutas GPS activas (una fila por conductor en ruta).
create table if not exists public.active_routes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nombres varchar(40) not null,
  apellidos varchar(40) not null,
  empresa varchar(60) not null constraint empresa_o_afiliacion check(trim(empresa) != ''),
  placa varchar(6),
  lat double precision not null constraint lat_valida check (lat between -90 and 90),
  lng double precision not null constraint lng_valida check (lng between -180 and 180),
  speed_kmh numeric(9,2) not null default 0 constraint velocidad_positiva check (speed_kmh >= 0),
  updated_at timestamptz not null default now(),
  foreign key (empresa, placa) references public.vehiculos(empresa, placa) on update cascade on delete set null
);

-- -------------------------------------------------------------- despachos --
create table if not exists public.despachos (
  id uuid primary key default gen_random_uuid(),
  empresa varchar(60) not null constraint empresa_o_afiliacion check(trim(empresa) != ''),
  placa varchar(6) not null constraint placa_no_vacia check(trim(placa) != ''),
  conductor_user_id uuid references auth.users(id) on delete set null,
  conductor text,
  origen text not null constraint origen_no_vacio check(trim(origen) != ''),
  destino text not null constraint destino_no_vacio check(trim(destino) != ''),
  fecha_salida timestamptz not null,
  estado text not null default 'Programado' constraint estado_despacho_valido check (
    estado in ('Programado', 'En curso', 'Completado', 'Cancelado')
  ),
  valor_flete numeric(12,2) not null default 0 constraint flete_positivo check (valor_flete >= 0),
  costo_operativo numeric(12,2) not null default 0 constraint costo_positivo check (costo_operativo >= 0),
  observaciones varchar(250),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (empresa, placa) references public.vehiculos(empresa, placa) on update cascade on delete restrict
);

-- ------------------------------------------------------------- documentos --
-- Soporta tanto documentos del vehículo (SOAT, RTM, Tarjeta Operación)
-- como documentos de afiliación del conductor (Licencia, Cédula, ARL, EPS).
create table if not exists public.documentos (
  id uuid primary key default gen_random_uuid(),
  empresa varchar(60) not null constraint empresa_o_afiliacion check(trim(empresa) != ''),
  user_id uuid references auth.users(id) on delete set null, -- Conductor propietario del doc / quien lo diligencia
  tipo text not null constraint tipo_doc_no_vacio check(trim(tipo) != ''),
  numero text,
  entidad text,
  placa varchar(6) constraint placa_opcional_no_vacia check(placa is null or trim(placa) != ''),
  conductor text,
  fecha_expedicion date,
  fecha_vencimiento date,
  estado_runt text not null default 'Pendiente' constraint estado_runt_valido check (
    estado_runt in ('Pendiente', 'Vigente', 'Vencido', 'Rechazado')
  ),
  storage_path text,
  creado_en timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fechas_documento_coherentes check (
    fecha_vencimiento is null or fecha_expedicion is null or fecha_vencimiento >= fecha_expedicion
  ),
  foreign key (empresa, placa) references public.vehiculos(empresa, placa) on update cascade on delete set null
);

-- ------------------------------------------------------------ movimientos --
create table if not exists public.movimientos (
  id uuid primary key default gen_random_uuid(),
  empresa varchar(60) not null constraint empresa_o_afiliacion check(trim(empresa) != ''),
  user_id uuid references auth.users(id) on delete set null,
  tipo text not null constraint tipo_movimiento_valido check (
    upper(tipo) in ('INGRESO', 'EGRESO', 'GASTO', 'MANTENIMIENTO', 'PEAJE', 'COMBUSTIBLE')
  ),
  concepto text not null constraint concepto_no_vacio check(trim(concepto) != ''),
  placa varchar(6) not null constraint placa_no_vacia check(trim(placa) != ''),
  conductor text,
  factura text,
  medio_pago text not null,
  monto numeric(12,2) not null constraint monto_positivo check (monto >= 0),
  km int constraint km_movimiento_positivo check (km is null or km >= 0),
  fecha date not null default current_date,
  storage_path text,
  created_at timestamptz not null default now(),
  foreign key (empresa, placa) references public.vehiculos(empresa, placa) on update cascade on delete restrict
);

-- ============================================================================
-- 3. TABLAS DEL PANEL DEL CONDUCTOR
-- ============================================================================

-- ---------------------------------------------------------------- alertas --
-- Alertas transversales (checklist/SOS/fatiga/mensaje/documento) con idempotencia.
create table if not exists public.alertas (
  id uuid primary key default gen_random_uuid(),
  empresa text not null constraint empresa_alerta_no_vacia check(trim(empresa) != ''),
  user_id uuid references auth.users(id) on delete cascade,
  conductor text,
  tipo text not null constraint tipo_alerta_valido check (
    tipo in ('checklist', 'sos', 'fatiga', 'mensaje', 'documento', 'mantenimiento')
  ),
  severidad text not null constraint severidad_alerta_valida check (
    severidad in ('info', 'warning', 'danger')
  ),
  titulo text not null,
  detalle text,
  clave text,                  -- clave de idempotencia (evita duplicados)
  resuelta boolean not null default false,
  created_at timestamptz not null default now(),
  resuelta_en timestamptz
);

-- ------------------------------------------------------------- checklists --
-- Checklist preoperacional (una fila por conductor/día).
create table if not exists public.checklists (
  id uuid primary key default gen_random_uuid(),
  empresa text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  placa varchar(6),
  fecha date not null default current_date,
  respuestas jsonb not null default '{}'::jsonb,
  approved boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, fecha)
);

-- ---------------------------------------------------------------- fatiga ---
-- Fatiga del conductor (una fila por conductor/día).
create table if not exists public.fatiga (
  id uuid primary key default gen_random_uuid(),
  empresa text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  fecha date not null default current_date,
  acumulado_ms bigint not null default 0 constraint acumulado_positivo check (acumulado_ms >= 0),
  ultimo_inicio timestamptz,
  estado text not null default 'ok' constraint estado_fatiga_valido check (
    estado in ('ok', 'warning', 'danger', 'descanso')
  ),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, fecha)
);

-- --------------------------------------------------------------- puntajes --
-- Puntaje de conducción (una fila por conductor/día).
create table if not exists public.puntajes (
  id uuid primary key default gen_random_uuid(),
  empresa text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  fecha date not null default current_date,
  eventos jsonb not null default '[]'::jsonb,
  puntos int not null default 100 constraint rango_puntos check (puntos between 0 and 100),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, fecha)
);

-- ------------------------------------------------------------- recorridos --
-- Recorrido del turno: estela de puntos + km (una fila por conductor/día).
create table if not exists public.recorridos (
  id uuid primary key default gen_random_uuid(),
  empresa text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  placa varchar(6),
  fecha date not null default current_date,
  puntos jsonb not null default '[]'::jsonb,   -- [{lat,lng,accuracy,timestamp}]
  kilometros numeric(10,2) not null default 0 constraint km_recorrido_positivo check (kilometros >= 0),
  updated_at timestamptz not null default now(),
  unique (user_id, fecha)
);

-- ============================================================================
-- 4. ÍNDICES DE RENDIMIENTO
-- ============================================================================

create unique index if not exists alertas_clave_unica
  on public.alertas (clave) where clave is not null;
create index if not exists alertas_empresa_idx on public.alertas (empresa, resuelta, created_at desc);
create index if not exists alertas_user_idx on public.alertas (user_id);

create index if not exists profiles_empresa_rol_idx on public.profiles (empresa, rol);
create index if not exists conductores_empresa_estado_idx on public.conductores (empresa, estado);
create index if not exists conductores_vencimiento_lic_idx on public.conductores (empresa, licencia_vence);
create index if not exists vehiculos_empresa_placa_idx on public.vehiculos (empresa, placa);
create index if not exists vehiculos_vencimientos_idx on public.vehiculos (empresa, soat_vence, rtm_vence);
create index if not exists despachos_empresa_fecha_idx on public.despachos (empresa, fecha_salida desc);
create index if not exists documentos_empresa_vencimiento_idx on public.documentos (empresa, fecha_vencimiento);
create index if not exists documentos_user_idx on public.documentos (user_id);
create index if not exists movimientos_empresa_fecha_idx on public.movimientos (empresa, fecha desc);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

alter table public.profiles      enable row level security;
alter table public.active_routes enable row level security;
alter table public.conductores   enable row level security;
alter table public.vehiculos     enable row level security;
alter table public.despachos     enable row level security;
alter table public.documentos    enable row level security;
alter table public.movimientos   enable row level security;
alter table public.alertas       enable row level security;
alter table public.checklists    enable row level security;
alter table public.fatiga        enable row level security;
alter table public.puntajes      enable row level security;
alter table public.recorridos    enable row level security;

-- ------------------------------------------------------------ profiles ------
drop policy if exists "perfil propio: select" on public.profiles;
create policy "perfil propio: select" on public.profiles
  for select to authenticated
  using (auth.uid() = id);

drop policy if exists "perfiles visibles a autenticados" on public.profiles;
drop policy if exists "perfiles visibles misma empresa" on public.profiles;
create policy "perfiles visibles misma empresa" on public.profiles
  for select to authenticated
  using (empresa = public.mi_empresa());

-- Impide que un conductor cambie su propio rol a ADMINISTRADOR o cambie de empresa
drop policy if exists "perfil propio: update" on public.profiles;
create policy "perfil propio: update" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and rol = (select p.rol from public.profiles p where p.id = auth.uid())
    and empresa = (select p.empresa from public.profiles p where p.id = auth.uid())
  );

-- ------------------------------------------------------- active_routes ------
drop policy if exists "conductor gestiona su ruta" on public.active_routes;
create policy "conductor gestiona su ruta" on public.active_routes
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and empresa = public.mi_empresa());

drop policy if exists "lectura de rutas a admins" on public.active_routes;
create policy "lectura de rutas a admins" on public.active_routes
  for select to authenticated
  using (public.es_admin() and empresa = public.mi_empresa());

-- ------------------------------------------- tablas por empresa (admin) -----
do $$
declare
  tabla text;
begin
  foreach tabla in array array['conductores','vehiculos','despachos','documentos','movimientos']
  loop
    execute format('drop policy if exists "admin gestiona su empresa" on public.%I', tabla);
    execute format(
      'create policy "admin gestiona su empresa" on public.%I
         for all to authenticated
         using (public.es_admin() and empresa = public.mi_empresa())
         with check (public.es_admin() and empresa = public.mi_empresa())',
      tabla
    );
  end loop;
end
$$;

-- -------------------- Permisos de consulta/afiliación para el CONDUCTOR -----
-- El conductor puede ver los vehículos y despachos de su empresa para operar:
drop policy if exists "conductor lee vehiculos de su empresa" on public.vehiculos;
create policy "conductor lee vehiculos de su empresa" on public.vehiculos
  for select to authenticated
  using (empresa = public.mi_empresa());

drop policy if exists "conductor lee despachos de su empresa" on public.despachos;
create policy "conductor lee despachos de su empresa" on public.despachos
  for select to authenticated
  using (empresa = public.mi_empresa());

-- El conductor puede ver y actualizar su ficha de afiliación en `conductores`:
drop policy if exists "conductor ve su ficha" on public.conductores;
create policy "conductor ve su ficha" on public.conductores
  for select to authenticated
  using (user_id = auth.uid() or empresa = public.mi_empresa());

drop policy if exists "conductor registra su afiliacion" on public.conductores;
create policy "conductor registra su afiliacion" on public.conductores
  for insert to authenticated
  with check (user_id = auth.uid() and empresa = public.mi_empresa());

-- El conductor puede subir y consultar sus documentos de afiliación en `documentos`:
drop policy if exists "conductor lee documentos" on public.documentos;
create policy "conductor lee documentos" on public.documentos
  for select to authenticated
  using (user_id = auth.uid() or empresa = public.mi_empresa());

drop policy if exists "conductor sube documentos de afiliacion" on public.documentos;
create policy "conductor sube documentos de afiliacion" on public.documentos
  for insert to authenticated
  with check (user_id = auth.uid() and empresa = public.mi_empresa());

drop policy if exists "conductor actualiza sus documentos pendientes" on public.documentos;
create policy "conductor actualiza sus documentos pendientes" on public.documentos
  for update to authenticated
  using (user_id = auth.uid() and estado_runt in ('Pendiente', 'Rechazado'))
  with check (user_id = auth.uid() and empresa = public.mi_empresa());

-- El conductor puede registrar comprobantes de gastos/movimientos en ruta:
drop policy if exists "conductor registra movimientos" on public.movimientos;
create policy "conductor registra movimientos" on public.movimientos
  for insert to authenticated
  with check (user_id = auth.uid() and empresa = public.mi_empresa());

drop policy if exists "conductor ve sus movimientos" on public.movimientos;
create policy "conductor ve sus movimientos" on public.movimientos
  for select to authenticated
  using (user_id = auth.uid());

-- ------------------------------------------- alertas (admin + conductor) ----
drop policy if exists "alertas: admin de su empresa" on public.alertas;
create policy "alertas: admin de su empresa" on public.alertas
  for all to authenticated
  using (public.es_admin() and empresa = public.mi_empresa())
  with check (public.es_admin() and empresa = public.mi_empresa());

drop policy if exists "alertas: conductor crea y ve las suyas" on public.alertas;
create policy "alertas: conductor crea y ve las suyas" on public.alertas
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and empresa = public.mi_empresa());

-- ------------------------------- tablas por conductor/día (una fila cada) --
do $$
declare
  tabla text;
begin
  foreach tabla in array array['checklists','fatiga','puntajes','recorridos']
  loop
    execute format('drop policy if exists "conductor gestiona su fila" on public.%I', tabla);
    execute format(
      'create policy "conductor gestiona su fila" on public.%I
         for all to authenticated
         using (auth.uid() = user_id)
         with check (auth.uid() = user_id and empresa = public.mi_empresa())',
      tabla
    );

    execute format('drop policy if exists "admin lee su empresa" on public.%I', tabla);
    execute format(
      'create policy "admin lee su empresa" on public.%I
         for select to authenticated
         using (public.es_admin() and empresa = public.mi_empresa())',
      tabla
    );
  end loop;
end
$$;

-- ============================================================================
-- 6. TRIGGERS Y FUNCIONES DE AUTOMATIZACIÓN
-- ============================================================================

-- Crea el perfil automáticamente al registrarse en auth.users.
-- Soporta tanto ADMINISTRADOR (sin licencia) como CONDUCTOR (con licencia por defecto si no se envía).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rol public.user_role;
  v_licencia text;
begin
  v_rol := coalesce((new.raw_user_meta_data->>'rol')::public.user_role, 'CONDUCTOR');
  v_licencia := nullif(trim(coalesce(new.raw_user_meta_data->>'licencia', '')), '');

  if v_rol = 'CONDUCTOR' and v_licencia is null then
    v_licencia := 'PENDIENTE';
  end if;

  insert into public.profiles (id, nombres, apellidos, telefono, empresa, licencia, rol)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'nombres'), ''), 'Usuario'),
    coalesce(nullif(trim(new.raw_user_meta_data->>'apellidos'), ''), 'Nuevo'),
    new.raw_user_meta_data->>'telefono',
    coalesce(nullif(trim(new.raw_user_meta_data->>'empresa'), ''), 'iQFleet'),
    v_licencia,
    v_rol
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Mantiene `updated_at` al día en todas las tablas que lo usan.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  tabla text;
begin
  foreach tabla in array array[
    'profiles','conductores','vehiculos','despachos','documentos',
    'active_routes','checklists','fatiga','puntajes','recorridos'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', tabla);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute procedure public.touch_updated_at()',
      tabla
    );
  end loop;
end
$$;

-- Función RPC para generar alertas automáticas de vencimientos (SOAT, RTM, Licencias y Documentos)
-- Se puede invocar desde el dashboard del administrador: supabase.rpc('generar_alertas_vencimientos')
create or replace function public.generar_alertas_vencimientos(dias_anticipacion int default 15)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa text := public.mi_empresa();
begin
  if v_empresa is null then
    return;
  end if;

  -- 1. Alertas de SOAT
  insert into public.alertas (empresa, tipo, severidad, titulo, detalle, clave)
  select
    v.empresa,
    'documento',
    case when v.soat_vence < current_date then 'danger' else 'warning' end,
    'SOAT por vencer o vencido: ' || v.placa,
    'El SOAT del vehículo ' || v.placa || ' vence el ' || v.soat_vence::text,
    'soat_' || v.empresa || '_' || v.placa || '_' || v.soat_vence::text
  from public.vehiculos v
  where v.empresa = v_empresa
    and v.soat_vence is not null
    and v.soat_vence <= (current_date + dias_anticipacion)
  on conflict (clave) where clave is not null do nothing;

  -- 2. Alertas de Revisión Técnico-Mecánica (RTM)
  insert into public.alertas (empresa, tipo, severidad, titulo, detalle, clave)
  select
    v.empresa,
    'documento',
    case when v.rtm_vence < current_date then 'danger' else 'warning' end,
    'RTM por vencer o vencida: ' || v.placa,
    'La Revisión Técnico-Mecánica del vehículo ' || v.placa || ' vence el ' || v.rtm_vence::text,
    'rtm_' || v.empresa || '_' || v.placa || '_' || v.rtm_vence::text
  from public.vehiculos v
  where v.empresa = v_empresa
    and v.rtm_vence is not null
    and v.rtm_vence <= (current_date + dias_anticipacion)
  on conflict (clave) where clave is not null do nothing;

  -- 3. Alertas de Licencias de Conducción
  insert into public.alertas (empresa, user_id, conductor, tipo, severidad, titulo, detalle, clave)
  select
    c.empresa,
    c.user_id,
    c.nombre,
    'documento',
    case when c.licencia_vence < current_date then 'danger' else 'warning' end,
    'Licencia de conducción: ' || c.nombre,
    'La licencia de ' || c.nombre || ' (C.C. ' || c.cedula || ') vence el ' || c.licencia_vence::text,
    'lic_' || c.empresa || '_' || c.cedula || '_' || c.licencia_vence::text
  from public.conductores c
  where c.empresa = v_empresa
    and c.licencia_vence is not null
    and c.licencia_vence <= (current_date + dias_anticipacion)
  on conflict (clave) where clave is not null do nothing;
end;
$$;

-- ============================================================================
-- 7. REALTIME
-- ============================================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'active_routes'
  ) then
    alter publication supabase_realtime add table public.active_routes;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'alertas'
  ) then
    alter publication supabase_realtime add table public.alertas;
  end if;
end
$$;

-- ============================================================================
-- 8. STORAGE (adjuntos)
-- ============================================================================
-- Recomendación de convención de rutas en el front:
-- Subir archivos como: `${empresa}/${user_id}/${nombre_archivo}.pdf`

insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('comprobantes', 'comprobantes', false)
on conflict (id) do nothing;

drop policy if exists "storage: lectura autenticada" on storage.objects;
create policy "storage: lectura autenticada" on storage.objects
  for select to authenticated
  using (bucket_id in ('documentos', 'comprobantes'));

drop policy if exists "storage: escritura autenticada" on storage.objects;
create policy "storage: escritura autenticada" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('documentos', 'comprobantes'));

drop policy if exists "storage: actualizacion autenticada" on storage.objects;
create policy "storage: actualizacion autenticada" on storage.objects
  for update to authenticated
  using (bucket_id in ('documentos', 'comprobantes') and owner = auth.uid());

-- ============================================================================
-- 9. DATOS SEMILLA (SEED)
-- ============================================================================

update public.profiles p
set rol = 'ADMINISTRADOR', empresa = 'iQFleet', licencia = null
from auth.users u
where u.id = p.id and u.email = 'admin@iqfleet.com';

update public.profiles p
set rol = 'CONDUCTOR', empresa = 'iQFleet', licencia = '20001234567'
from auth.users u
where u.id = p.id and u.email = 'conductor@iqfleet.com';

-- Vehículos de demo para la empresa 'iQFleet'.
insert into public.vehiculos (empresa, placa, marca, modelo, anio, kilometraje, soat_vence, rtm_vence, estado)
values
  ('iQFleet', 'ABC123', 'Chevrolet',     'NPR',  2021,  85000, current_date + 120, current_date + 200, 'Disponible'),
  ('iQFleet', 'XYZ789', 'Hino',          '500',  2020, 132000, current_date + 45,  current_date + 90,  'En ruta'),
  ('iQFleet', 'JKL456', 'International', '4300', 2019, 210000, current_date + 10,  current_date + 25,  'Mantenimiento')
on conflict (empresa, placa) do nothing;

-- ============================================================================
-- FIN DEL ESQUEMA
-- ============================================================================