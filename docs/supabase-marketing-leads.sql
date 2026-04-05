-- طلبات العملاء المحتملين (Marketing leads) — غرفة التسويق
-- شغّل في Supabase SQL Editor بعد جداول المشروع الأساسية.

create table if not exists public.marketing_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  request_type text not null check (request_type in ('buy', 'rent', 'management', 'consulting')),
  property_type_wanted text,
  budget_min text,
  budget_max text,
  preferred_city text,
  source text not null,
  interested_listing_id text,
  status text not null default 'new',
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists marketing_leads_created_at_idx on public.marketing_leads (created_at desc);

comment on table public.marketing_leads is 'Leads من نموذج غرفة التسويق؛ الإدراج عبر API بصلاحية الخدمة فقط.';

alter table public.marketing_leads enable row level security;

-- لا سياسات قراءة/كتابة للعموم — الوصول عبر service role من الخادم فقط.

-- إن ظهرت رسالة PostgREST: Could not find the table ... in the schema cache
-- نفّذ في SQL Editor بعد إنشاء/تعديل الجدول:
--   NOTIFY pgrst, 'reload schema';
