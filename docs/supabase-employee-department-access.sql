-- غرف أقسام الموظفين: رقم تعريف لكل موظف وقسم (يُدخل في /employee/unlock)
-- نفّذ هذا الملف في Supabase SQL Editor بعد supabase-setup.sql

create table if not exists public.employee_department_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  department text not null check (department in ('estates', 'finance', 'projects', 'marketing', 'e_services')),
  code_hash text not null,
  created_at timestamptz not null default now(),
  unique (user_id, department)
);

alter table public.employee_department_codes enable row level security;
-- لا نفتح select مباشرة للمستخدمين؛ التحقق عبر الدالة فقط.

-- نفس صيغة التجزئة المستخدمة في verify (MW_DEPT_V1)
create or replace function public.hash_employee_department_code(
  p_user_id uuid,
  p_department text,
  p_plain_code text
)
returns text
language sql
immutable
as $$
  select encode(
    digest(
      'MW_DEPT_V1:' || p_user_id::text || ':' || p_department || ':' || p_plain_code,
      'sha256'
    ),
    'hex'
  );
$$;

revoke all on function public.hash_employee_department_code(uuid, text, text) from public;
grant execute on function public.hash_employee_department_code(uuid, text, text) to service_role;

create or replace function public.verify_employee_department_code(
  p_department text,
  p_plain_code text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
begin
  if auth.uid() is null then
    return false;
  end if;
  if p_plain_code is null or p_plain_code !~ '^\d{4}$' then
    return false;
  end if;
  if p_department not in ('estates', 'finance', 'projects', 'marketing', 'e_services') then
    return false;
  end if;
  v_hash := encode(
    digest(
      'MW_DEPT_V1:' || auth.uid()::text || ':' || p_department || ':' || p_plain_code,
      'sha256'
    ),
    'hex'
  );
  return exists (
    select 1
    from public.employee_department_codes c
    where c.user_id = auth.uid()
      and c.department = p_department
      and c.code_hash = v_hash
  );
end;
$$;

revoke all on function public.verify_employee_department_code(text, text) from public;
grant execute on function public.verify_employee_department_code(text, text) to authenticated;

-- مثال (استبدل UUID والرقم النصي):
-- insert into public.employee_department_codes (user_id, department, code_hash)
-- values (
--   '00000000-0000-0000-0000-000000000000'::uuid,
--   'estates',
--   public.hash_employee_department_code(
--     '00000000-0000-0000-0000-000000000000'::uuid,
--     'estates',
--     '123456'
--   )
-- );
