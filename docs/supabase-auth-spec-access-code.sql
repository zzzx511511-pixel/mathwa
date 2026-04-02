-- مثوى — مواصفة المصادقة 2025 (رمز 6 أرقام)
-- نفّذ في SQL Editor في Supabase بعد النسخ الاحتياطي.
-- شرط: صف public.users مربوط بـ auth.users (نفس id).

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS access_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

COMMENT ON COLUMN public.users.access_code IS '6 أرقام؛ يجب أن تطابق كلمة مرور مستخدم Supabase Auth لنفس الحساب عند استخدام /api/auth/login';

CREATE INDEX IF NOT EXISTS users_access_code_idx ON public.users (access_code) WHERE access_code IS NOT NULL;

-- تهيئة حساب للدخول بالرمز:
-- 1) أنشئ المستخدم في Authentication (أو موجود مسبقاً).
-- 2) حدّث public.users.access_code = '123456' (مثال) للصف بنفس id.
-- 3) من لوحة Supabase أو عبر Admin API: اضبط كلمة مرور المستخدم في Auth لتساوي نفس الرمز (6 أرقام)
--    أو استخدم: auth.admin.updateUserById(id, { password: '123456' }).
-- 4) role في public.users: admin | employee | owner | client حسب المواصفة.
