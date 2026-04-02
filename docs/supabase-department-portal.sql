-- بوابة القسم: بريد + كلمة مرور مشتركة للقسم (الخطوة 1)، ثم رمز شخصي لكل موظف (الخطوة 2 في التطبيق).
-- نفّذ في SQL Editor بعد إنشاء المشروع. الولوج من API باستخدام service_role فقط.

create table if not exists public.department_portal_accounts (
  department text primary key
    check (department in ('estates', 'finance', 'projects', 'marketing', 'e_services')),
  login_email text not null unique,
  password_hash text not null,
  updated_at timestamptz not null default now()
);

alter table public.department_portal_accounts enable row level security;

-- لا سياسات قراءة للمستخدمين؛ التحقق من Route Handler عبر service role.

comment on table public.department_portal_accounts is
  'كلمة المرور بصيغة scrypt: ناتج node scripts/hash-dept-password.mjs';

-- ربط الموظف بقسمه (للتحقق عند إدخال الرمز الشخصي): User Metadata في Auth
--   employee_department = إحدى: estates | finance | projects | marketing | e_services
