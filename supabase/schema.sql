-- ═══════════════════════════════════════════════════════════════════════════
-- HRIS Barri Vell · Esquema de base de datos para Supabase (plan gratuito)
--
-- Cómo usarlo: Supabase → SQL Editor → New query → pega TODO este archivo → Run.
-- Se puede ejecutar varias veces sin romper nada (todo es "if not exists").
-- Después, ejecuta (opcional) supabase/import_vermuteria_river.sql para cargar
-- los trabajadores y turnos del documento de Vermuteria y River.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Empresas y locales ─────────────────────────────────────────────────────
create table if not exists companies (
  id   text primary key,
  name text not null
);

create table if not exists locals (
  id         text primary key,
  company_id text not null references companies(id) on delete cascade,
  name       text not null
);

-- ── Grupos (Camarero, Cocinero…) ───────────────────────────────────────────
create table if not exists groups (
  id    text primary key,
  name  text not null,
  color int  not null default 0           -- índice de la paleta de colores de la app
);

-- ── Trabajadores ───────────────────────────────────────────────────────────
create table if not exists employees (
  id                   text primary key,
  nombre               text not null,
  apellidos            text not null default '',
  dni                  text,
  telefono             text,
  email                text,
  precio_hora          numeric(8,2),
  precio_hora_nocturna numeric(8,2),      -- por defecto igual que precio_hora
  horas_contrato       numeric(5,2),      -- horas por semana
  prl_hecho            boolean not null default false,
  activo               boolean not null default true,
  company_id           text references companies(id) on delete set null,
  group_id             text references groups(id) on delete set null,
  locales              text[] not null default '{}',   -- ids de locals donde trabaja
  fecha_alta           date not null default current_date,
  fecha_baja           date,
  nss                  text,
  iban                 text,
  fecha_nacimiento     date,
  direccion            text,
  dni_anverso          text,              -- imagen JPEG reducida (data URL, ~30 KB)
  dni_reverso          text,
  alta_solicitada      date,
  prl_solicitado       date
);
-- Columnas añadidas en la versión 2 (por si ya habías creado la tabla antes)
alter table employees add column if not exists prl_solicitado date;

-- ── Turnos y días libres ───────────────────────────────────────────────────
create table if not exists shifts (
  id          text primary key,
  employee_id text not null references employees(id) on delete cascade,
  local_id    text not null references locals(id) on delete cascade,
  fecha       date not null,              -- día en que EMPIEZA el turno
  inicio      text not null check (inicio ~ '^[0-2][0-9]:[0-5][0-9]$'),
  fin         text not null check (fin    ~ '^[0-2][0-9]:[0-5][0-9]$')  -- fin <= inicio → termina al día siguiente
);
create index if not exists shifts_fecha_idx       on shifts (fecha);
create index if not exists shifts_local_fecha_idx on shifts (local_id, fecha);

create table if not exists days_off (
  id          text primary key,
  employee_id text not null references employees(id) on delete cascade,
  fecha       date not null,
  unique (employee_id, fecha)
);

-- ── Ficheros del trabajador (el archivo vive en Storage, aquí solo los datos) ─
create table if not exists employee_files (
  id          text primary key,
  employee_id text not null references employees(id) on delete cascade,
  nombre      text not null,
  tamano      bigint,
  tipo        text,
  ruta        text not null,              -- ruta dentro del bucket "ficheros"
  subido      date not null default current_date
);
create index if not exists employee_files_emp_idx on employee_files (employee_id);

-- ── Importe de nómina introducido a mano (por trabajador y periodo) ────────
create table if not exists nominas (
  id          text primary key,           -- "<employee_id>|<desde>|<hasta>"
  employee_id text not null references employees(id) on delete cascade,
  desde       date not null,
  hasta       date not null,
  importe     numeric(10,2) not null
);

-- ── Ajustes (una sola fila) ────────────────────────────────────────────────
create table if not exists settings (
  id             int primary key default 1 check (id = 1),
  gestoria_email text not null default 'prueba@gestoria.com',
  asunto         text not null default 'Solicitud de alta: {NOMBRE}',
  plantilla      text not null default E'Hola,\n\nSolicito el alta de {NOMBRE} con fecha {FECHA_ALTA} y DNI {DNI}.\n\nEmpresa: {EMPRESA}\n\nAdjunto las imágenes del DNI.\n\nGracias.',
  asunto_prl     text not null default 'Solicitud de formación PRL: {NOMBRE}',
  plantilla_prl  text not null default E'Hola,\n\nSolicito la formación en Prevención de Riesgos Laborales (PRL) para {NOMBRE}, con DNI {DNI}, dado/a de alta el {FECHA_ALTA} en {EMPRESA}.\n\nGracias.'
);
alter table settings add column if not exists asunto_prl text not null default 'Solicitud de formación PRL: {NOMBRE}';
alter table settings add column if not exists plantilla_prl text not null default E'Hola,\n\nSolicito la formación en Prevención de Riesgos Laborales (PRL) para {NOMBRE}, con DNI {DNI}, dado/a de alta el {FECHA_ALTA} en {EMPRESA}.\n\nGracias.';
insert into settings (id) values (1) on conflict do nothing;

-- ── Seguridad: solo el usuario que ha iniciado sesión puede leer y escribir ─
do $$
declare t text;
begin
  foreach t in array array['companies','locals','groups','employees','shifts','days_off','employee_files','nominas','settings'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "auth_all" on %I', t);
    execute format('create policy "auth_all" on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- ── Storage: bucket privado para los ficheros de los trabajadores ──────────
insert into storage.buckets (id, name, public)
values ('ficheros', 'ficheros', false)
on conflict (id) do nothing;

drop policy if exists "ficheros_auth" on storage.objects;
create policy "ficheros_auth" on storage.objects
  for all to authenticated
  using (bucket_id = 'ficheros')
  with check (bucket_id = 'ficheros');

-- ── Datos iniciales: empresas, locales y grupos ────────────────────────────
insert into companies (id, name) values
  ('c1', 'TrescientascuarentaSL'),
  ('c2', 'Valadri24SL')
on conflict (id) do nothing;

insert into locals (id, company_id, name) values
  ('l1', 'c1', 'Vermuteria'),
  ('l2', 'c1', 'Lola'),
  ('l3', 'c2', 'River')
on conflict (id) do nothing;

insert into groups (id, name, color) values
  ('g2', 'Camarero', 0),
  ('g3', 'Cocinero', 1)
on conflict (id) do nothing;
