-- دخول الموظفين برمز تعريف فقط (بدون بريد/كلمة مرور في الواجهة)
-- التطبيق يتوقع رمزاً من 4 أرقام بالضبط. يُربط الرمز بمستخدم في auth.users؛ كلمة مرور ذلك المستخدم في Auth يجب أن تطابق الرمز نفسه (كما يُصدَر للموظف)
-- نفّذ في SQL Editor بعد supabase-setup.sql

create table if not exists public.employee_portal_codes (
  code_hash text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.employee_portal_codes enable row level security;
-- لا سياسات للوصول المباشر؛ القراءة من API عبر service role فقط.

-- مثال: إنشاء مستخدم في Authentication أولاً (بريد داخلي + كلمة مرور = الرمز الذي أعطيته للموظف)
-- ثم:
-- insert into public.employee_portal_codes (code_hash, user_id)
-- values (
--   encode(digest('MW_PORTAL_V1:' || 'الرمز_الصادر_للموظف', 'sha256'), 'hex'),
--   'UUID-من-auth.users'
-- );
