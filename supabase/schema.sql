-- HRIS Barri Vell · esquema para Supabase (plan gratuito)
-- 1) Supabase > SQL Editor > pega este archivo y ejecútalo.
-- 2) Authentication > Users > "Add user": crea el único usuario que entrará en la app.
-- 3) En bv-core.js rellena SUPABASE = { url: 'https://xxxx.supabase.co', anonKey: '...' }.
--    (Project Settings > API). Con eso la app deja el modo demo y usa Supabase.

create table if not exists companies (
  id text primary key,
  name text not null
);

create table if not exists locals (
  id text primary key,
  company_id text not null references companies(id) on delete cascade,
  name text not null
);

create table if not exists groups (
  id text primary key,
  name text not null,
  color int not null default 0
);

create table if not exists employees (
  id text primary key,
  nombre text not null,
  apellidos text not null,
  dni text,
  telefono text,
  email text,
  precio_hora numeric(8,2),
  precio_hora_nocturna numeric(8,2),          -- null = se paga a precio_hora
  horas_contrato numeric(5,2),                -- horas por semana
  prl_hecho boolean not null default false,
  activo boolean not null default true,
  company_id text references companies(id) on delete set null,
  group_id text references groups(id) on delete set null,
  locales text[] not null default '{}',       -- ids de locals
  fecha_alta date not null default current_date,
  fecha_baja date,
  nss text,
  iban text,
  fecha_nacimiento date,
  direccion text,
  dni_anverso text,                           -- imagen JPEG reducida (data URL)
  dni_reverso text,
  alta_solicitada date
);

create table if not exists shifts (
  id text primary key,
  employee_id text not null references employees(id) on delete cascade,
  local_id text not null references locals(id) on delete cascade,
  fecha date not null,                        -- día en que empieza el turno
  inicio text not null check (inicio ~ '^[0-2][0-9]:[0-5][0-9]$'),
  fin text not null check (fin ~ '^[0-2][0-9]:[0-5][0-9]$')  -- si fin <= inicio, termina al día siguiente
);
create index if not exists shifts_fecha_idx on shifts (fecha);
create index if not exists shifts_local_fecha_idx on shifts (local_id, fecha);

create table if not exists days_off (
  id text primary key,
  employee_id text not null references employees(id) on delete cascade,
  fecha date not null,
  unique (employee_id, fecha)
);

create table if not exists settings (
  id int primary key default 1 check (id = 1),
  gestoria_email text not null default 'prueba@gestoria.com',
  asunto text not null default 'Solicitud de alta: {NOMBRE}',
  plantilla text not null default 'Hola,

Solicito el alta de {NOMBRE} con fecha {FECHA_ALTA} y DNI {DNI}.

Empresa: {EMPRESA}

Adjunto las imágenes del DNI.

Gracias.'
);
insert into settings (id) values (1) on conflict do nothing;

-- Seguridad: solo usuarios autenticados pueden leer y escribir
do $$
declare t text;
begin
  foreach t in array array['companies','locals','groups','employees','shifts','days_off','settings'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "auth_all" on %I', t);
    execute format('create policy "auth_all" on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- Datos iniciales (opcional)
insert into companies (id, name) values ('c1','TrescientascuarentaSL'), ('c2','Valadri24SL') on conflict do nothing;
insert into locals (id, company_id, name) values ('l1','c1','Vermuteria'), ('l2','c1','Lola'), ('l3','c2','River') on conflict do nothing;
insert into groups (id, name, color) values ('g1','Encargado',3), ('g2','Camarero',0), ('g3','Cocinero',1), ('g4','Jefe de cocina',2), ('g5','Ayudante de cocina',4) on conflict do nothing;

-- Envío con adjuntos (opcional, más adelante): una Edge Function con un proveedor
-- como Resend puede enviar el correo de alta con las imágenes del DNI adjuntas.
