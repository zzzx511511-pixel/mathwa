-- جدول عروض التسويق (Marketing offers / listings)
-- شغّل هذا الملف في Supabase SQL Editor مرة واحدة.
-- المسار API: app/api/employee/marketing/offers/create يستخدم service role ولا يعتمد على RLS للكتابة.

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  property_type text not null,
  city text not null,
  district text not null,
  listing_mode text not null check (listing_mode in ('sale', 'rent')),
  price numeric not null check (price >= 0),
  area_sqm numeric check (area_sqm is null or area_sqm > 0),
  payment_method text not null,
  hazard_level text check (hazard_level is null or hazard_level in ('high', 'medium', 'low')),
  latitude double precision,
  longitude double precision,
  description text not null,
  main_image_url text,
  gallery_urls jsonb not null default '[]'::jsonb,
  video_url text,
  features jsonb not null default '{}'::jsonb,
  status text not null default 'published',
  offer_section text not null default 'industrial'
    check (offer_section in ('industrial', 'commercial-workers', 'residential', 'lands')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listings_created_at_idx on public.listings (created_at desc);
create index if not exists listings_city_district_idx on public.listings (city, district);

comment on table public.listings is 'عروض تسويقية (إضافة من غرفة الموظفين)';

alter table public.listings enable row level security;

-- القراءة العامة للعروض المنشورة (للموقع/الزوار) — يمكن تعديل الشرط لاحقاً
drop policy if exists listings_public_read_published on public.listings;
create policy listings_public_read_published
on public.listings
for select
to anon, authenticated
using (status = 'published');

-- ملاحظة: الإدراج يتم من API باستخدام SUPABASE_SERVICE_ROLE_KEY الذي يتجاوز RLS.

-- --- ترقية جدول موجود مسبقاً (بدون عمود offer_section) ---
alter table public.listings add column if not exists offer_section text;
update public.listings
  set offer_section = 'industrial'
  where offer_section is null or trim(offer_section) = '';
alter table public.listings alter column offer_section set default 'industrial';
alter table public.listings drop constraint if exists listings_offer_section_check;
alter table public.listings
  add constraint listings_offer_section_check
  check (offer_section in ('industrial', 'commercial-workers', 'residential', 'lands'));
alter table public.listings alter column offer_section set not null;
