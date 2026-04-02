-- إن كان سكربت القاعدة قديماً: نفّذ هذا الجزء فقط في SQL Editor (مرة واحدة)
-- يضيف دالة مزامنة الدور التي يستدعيها التطبيق بعد التسجيل/الدخول

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
