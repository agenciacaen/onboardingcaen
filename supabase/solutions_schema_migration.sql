-- ============================================================
-- MIGRATION A — Soluções contratáveis/versionadas
-- Tabelas: solutions, solution_versions, client_solutions
-- tasks: novos metadados de solução
-- ============================================================

-- 1) Catálogo de soluções
create table if not exists public.solutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon text default 'layers',
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- 2) Versões do template (structure JSONB versionado)
create table if not exists public.solution_versions (
  id uuid primary key default gen_random_uuid(),
  solution_id uuid not null references public.solutions(id) on delete cascade,
  version text not null,
  notes text,
  structure jsonb not null default '{}'::jsonb,
  is_current boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (solution_id, version)
);

-- 3) Instância por cliente
create table if not exists public.client_solutions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  version_id uuid not null references public.solution_versions(id) on delete cascade,
  status text not null default 'active' check (status in ('active','paused','completed','removed')),
  start_date date not null default current_date,
  end_date date,
  config jsonb not null default '{}'::jsonb,
  linked_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz
);

create index if not exists client_solutions_client_idx on public.client_solutions (client_id);
create index if not exists client_solutions_version_idx on public.client_solutions (version_id);
-- Uma instância ativa por (cliente, versão); removidas preservam histórico
create unique index if not exists client_solutions_active_unique
  on public.client_solutions (client_id, version_id)
  where status <> 'removed';

-- 4) Metadados de solução nas tasks existentes
alter table public.tasks add column if not exists task_type text;
alter table public.tasks add column if not exists responsible_role text;
alter table public.tasks add column if not exists day_offset integer;
alter table public.tasks add column if not exists duration_days integer default 1;
alter table public.tasks add column if not exists milestone text;
alter table public.tasks add column if not exists depends_on_task_ids uuid[];
alter table public.tasks add column if not exists solution_instance_id uuid references public.client_solutions(id) on delete set null;
alter table public.tasks add column if not exists template_key text;
alter table public.tasks add column if not exists completed_by uuid references public.profiles(id) on delete set null;

-- template_key único por instância (garante idempotência na reaplicação)
create unique index if not exists tasks_solution_template_key_unique
  on public.tasks (solution_instance_id, template_key)
  where solution_instance_id is not null;
create index if not exists tasks_solution_instance_idx on public.tasks (solution_instance_id);

-- ============================================================
-- RLS (espelhando padrões is_admin / auth_client_id / admin+member)
-- ============================================================
alter table public.solutions enable row level security;
alter table public.solution_versions enable row level security;
alter table public.client_solutions enable row level security;

-- solutions
create policy "solutions SELECT agency" on public.solutions
  for select to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = any (array['admin','member'])));

create policy "solutions INSERT agency" on public.solutions
  for insert to authenticated
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = any (array['admin','member'])));

create policy "solutions UPDATE agency" on public.solutions
  for update to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = any (array['admin','member'])));

create policy "solutions DELETE agency" on public.solutions
  for delete to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = any (array['admin','member'])));

-- solution_versions
create policy "solution_versions SELECT agency" on public.solution_versions
  for select to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = any (array['admin','member'])));

create policy "solution_versions INSERT agency" on public.solution_versions
  for insert to authenticated
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = any (array['admin','member'])));

create policy "solution_versions UPDATE agency" on public.solution_versions
  for update to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = any (array['admin','member'])));

create policy "solution_versions DELETE agency" on public.solution_versions
  for delete to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = any (array['admin','member'])));

-- client_solutions
create policy "client_solutions SELECT agency" on public.client_solutions
  for select to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = any (array['admin','member'])));

create policy "client_solutions SELECT client own" on public.client_solutions
  for select to authenticated
  using (client_id = auth_client_id());

create policy "client_solutions INSERT agency" on public.client_solutions
  for insert to authenticated
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = any (array['admin','member'])));

create policy "client_solutions UPDATE agency" on public.client_solutions
  for update to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = any (array['admin','member'])));

create policy "client_solutions DELETE agency" on public.client_solutions
  for delete to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = any (array['admin','member'])));