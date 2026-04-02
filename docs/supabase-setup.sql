-- مثوى العقارية — Supabase bootstrap schema (MVP)
-- Paste into Supabase SQL Editor and run once.

-- Enable useful extensions (safe if already enabled)
create extension if not exists "pgcrypto";

-- A simple app users table for roles (optional but recommended)
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'client',
  created_at timestamptz not null default now()
);

-- Helper: read role from public.users (keeps RLS policies readable)
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select u.role from public.users u where u.id = auth.uid()), 'client');
$$;

revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;

-- Owners
create table if not exists public.owners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  owner_type text not null default 'individual',
  created_at timestamptz not null default now()
);

-- Properties
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.owners (id) on delete set null,
  ownership_type text not null default 'company_owned',
  commission_rate numeric not null default 0,
  management_start_date date,
  management_end_date date,
  name text,
  created_at timestamptz not null default now()
);

-- Public listing metadata (safe-to-show fields for visitors)
alter table public.properties
  add column if not exists is_public boolean not null default false,
  add column if not exists public_title text,
  add column if not exists public_summary text,
  add column if not exists public_price numeric,
  add column if not exists public_image_url text,
  add column if not exists city text,
  add column if not exists district text,
  add column if not exists exact_location text;

-- Contracts (tenant + responsible employee)
create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  tenant_user_id uuid references auth.users (id) on delete set null,
  responsible_employee_id uuid references auth.users (id) on delete set null,
  property_id uuid references public.properties (id) on delete set null,
  start_date date,
  end_date date,
  status text default 'active',
  contract_file_url text,
  created_at timestamptz not null default now()
);

-- Invoices (payments)
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid references public.contracts (id) on delete set null,
  tenant_user_id uuid references auth.users (id) on delete set null,
  amount numeric,
  currency text default 'SAR',
  due_date date,
  status text default 'unpaid',
  created_at timestamptz not null default now()
);

-- Maintenance
create table if not exists public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_user_id uuid references auth.users (id) on delete set null,
  property_id uuid references public.properties (id) on delete set null,
  status text default 'open',
  description text,
  created_at timestamptz not null default now()
);

-- Collection schedule (finance/collector)
create table if not exists public.collection_schedule (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references public.invoices (id) on delete set null,
  collector_user_id uuid references auth.users (id) on delete set null,
  scheduled_date date,
  status text default 'scheduled',
  created_at timestamptz not null default now()
);

-- Owner transfers
create table if not exists public.owner_transfers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.owners (id) on delete cascade,
  property_id uuid references public.properties (id) on delete set null,
  commission_deducted numeric not null default 0,
  net_amount_transferred numeric not null default 0,
  transfer_date date,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- =========
-- RLS
-- =========

alter table public.users enable row level security;
alter table public.owners enable row level security;
alter table public.properties enable row level security;
alter table public.contracts enable row level security;
alter table public.invoices enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.collection_schedule enable row level security;
alter table public.owner_transfers enable row level security;

-- public.users
drop policy if exists users_self_read on public.users;
create policy users_self_read on public.users
for select
to authenticated
using (id = auth.uid());

drop policy if exists users_self_upsert on public.users;
create policy users_self_upsert on public.users
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists users_self_update on public.users;
create policy users_self_update on public.users
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- مزامنة الدور من التطبيق (تتجاوز أعطال RLS أحياناً مع upsert من العميل)
create or replace function public.sync_user_role(p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  r := coalesce(nullif(trim(p_role), ''), 'client');
  if r not in ('client', 'owner', 'employee', 'collector') then
    r := 'client';
  end if;
  insert into public.users (id, role)
  values (auth.uid(), r)
  on conflict (id) do update set role = excluded.role;
end;
$$;

revoke all on function public.sync_user_role(text) from public;
grant execute on function public.sync_user_role(text) to authenticated;

-- owners
drop policy if exists owners_select on public.owners;
create policy owners_select on public.owners
for select
to authenticated
using (
  user_id = auth.uid()
  or public.current_user_role() in ('super_admin','manager','employee')
);

-- properties
drop policy if exists properties_select on public.properties;
create policy properties_select on public.properties
for select
to authenticated
using (
  public.current_user_role() in ('super_admin','manager','employee')
  or exists (
    select 1
    from public.owners o
    where o.id = properties.owner_id
      and o.user_id = auth.uid()
  )
);

-- Public-safe function for website visitors (anon/authenticated):
-- returns only listing fields allowed for public display.
create or replace function public.get_public_property_offers(p_limit integer default 6)
returns table (
  id uuid,
  title text,
  summary text,
  property_type text,
  price numeric,
  image_url text,
  city text,
  district text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    coalesce(p.public_title, p.name, 'عرض عقاري') as title,
    coalesce(p.public_summary, 'وحدة مناسبة للسكن أو الاستثمار.') as summary,
    coalesce(p.ownership_type, 'عقار') as property_type,
    p.public_price as price,
    p.public_image_url as image_url,
    p.city,
    p.district
  from public.properties p
  where p.is_public = true
  order by p.created_at desc
  limit greatest(1, least(coalesce(p_limit, 6), 24));
$$;

revoke all on function public.get_public_property_offers(integer) from public;
grant execute on function public.get_public_property_offers(integer) to anon, authenticated;

-- contracts
drop policy if exists contracts_select on public.contracts;
create policy contracts_select on public.contracts
for select
to authenticated
using (
  public.current_user_role() in ('super_admin','manager','employee')
  or responsible_employee_id = auth.uid()
  or tenant_user_id = auth.uid()
);

-- invoices
drop policy if exists invoices_select on public.invoices;
create policy invoices_select on public.invoices
for select
to authenticated
using (
  public.current_user_role() in ('super_admin','manager','employee','collector')
  or tenant_user_id = auth.uid()
);

-- maintenance_requests
drop policy if exists maintenance_select on public.maintenance_requests;
create policy maintenance_select on public.maintenance_requests
for select
to authenticated
using (
  public.current_user_role() in ('super_admin','manager','employee')
  or tenant_user_id = auth.uid()
);

-- collection_schedule
drop policy if exists collection_schedule_select on public.collection_schedule;
create policy collection_schedule_select on public.collection_schedule
for select
to authenticated
using (
  public.current_user_role() in ('super_admin','manager','collector')
  or collector_user_id = auth.uid()
);

-- owner_transfers
drop policy if exists owner_transfers_select on public.owner_transfers;
create policy owner_transfers_select on public.owner_transfers
for select
to authenticated
using (
  public.current_user_role() in ('super_admin','manager','employee')
  or exists (
    select 1
    from public.owners o
    where o.id = owner_transfers.owner_id
      and o.user_id = auth.uid()
  )
);

-- Favorites for public offers (paths like /offers/...), synced from the website after signup/login.
create table if not exists public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  path text not null,
  title text not null,
  kind text not null check (kind in ('offer', 'demo')),
  created_at timestamptz not null default now(),
  unique (user_id, path)
);

alter table public.user_favorites enable row level security;

drop policy if exists user_favorites_own on public.user_favorites;
create policy user_favorites_own on public.user_favorites
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- مزامنة الدور من auth (raw_user_meta_data) إلى public.users عند إنشاء الحساب
-- (مفيد عند تفعيل «تأكيد البريد» حيث لا توجد جلسة في المتصفح مباشرة بعد signUp)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r text;
begin
  r := coalesce(new.raw_user_meta_data->>'role', 'client');
  if r not in ('client', 'owner', 'employee', 'collector') then
    r := 'client';
  end if;
  insert into public.users (id, role)
  values (new.id, r)
  on conflict (id) do update set role = excluded.role;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

