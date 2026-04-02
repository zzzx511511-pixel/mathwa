-- أعمدة اختيارية لربط فواتير الصيانة بصورة مرفوعة إلى Storage (bucket: invoices)
-- نفّذ في Supabase SQL Editor مرة واحدة إذا كان الجدول بدون هذه الأعمدة.

alter table public.maintenance_invoices
  add column if not exists image_url text;

alter table public.maintenance_invoices
  add column if not exists image_path text;

comment on column public.maintenance_invoices.image_url is 'رابط عام للصورة إن وُجد (اختياري)';
comment on column public.maintenance_invoices.image_path is 'مسار الملف داخل bucket invoices، يُستخدم مع رابط API الموقّع';
