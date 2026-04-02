-- ربط الملاك بالعقارات عبر owner_id + بيانات المستأجر والعقد
-- شغّل هذا السكربت في SQL Editor داخل Supabase

-- owners: تأكد من وجود user_id والبيانات الأساسية
alter table public.owners
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists full_name text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists archived boolean default false,
  add column if not exists is_archived boolean default false,
  add column if not exists archived_at timestamptz;

-- properties: أعمدة نموذج إضافة العقار
alter table public.properties
  add column if not exists owner_id uuid references public.owners(id) on delete cascade,
  add column if not exists name text,
  add column if not exists location text,
  add column if not exists city text,
  add column if not exists archived boolean default false,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists map_address text,
  add column if not exists type text,
  add column if not exists area_sqm numeric,
  add column if not exists commission_rate numeric,
  add column if not exists property_condition text;

create index if not exists properties_owner_id_idx on public.properties(owner_id);

-- tenants: ربط المستأجر بالعقار + تواريخ العقد
alter table public.tenants
  add column if not exists property_id uuid references public.properties(id) on delete cascade,
  add column if not exists full_name text,
  add column if not exists phone text,
  add column if not exists contract_start date,
  add column if not exists contract_end date;

create index if not exists tenants_property_id_idx on public.tenants(property_id);
