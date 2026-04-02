## إعداد Supabase (MVP) لمشروع مثوى

### تشغيل سكربت القاعدة
- افتح Supabase Dashboard → **SQL Editor**
- الصق محتوى الملف `docs/supabase-setup.sql`
- شغّل السكربت مرة واحدة.
- (اختياري لبوابة الموظفين) لتفعيل **أرقام التعريف لكل قسم**: نفّذ أيضًا `docs/supabase-employee-department-access.sql` ثم أدخل الأزواج (موظف + قسم + تجزئة الرقم) من لوحة SQL أو عبر أداة إدارية لاحقة.
- **دخول الموظفين برمز فقط (بدون بريد في الواجهة)**: أنشئ مستخدمًا في Authentication ثم نفّذ `docs/supabase-employee-portal-code.sql` وأدخل `code_hash` المرتبط بـ `user_id`؛ كلمة مرور ذلك المستخدم في Auth يجب أن تطابق **نفس الرمز** النصي الذي يُعطى للموظف (انظر تعليقات الملف).

### مزامنة الأدوار تلقائياً
إذا شغّلت نهاية ملف `supabase-setup.sql` (دالة `handle_new_user` + التريغر على `auth.users`)، يُنشأ صف في `public.users` تلقائياً عند التسجيل، والدور يُؤخذ من `raw_user_meta_data.role` (مع السماح فقط بـ: client / owner / employee / collector).

### دالة `sync_user_role` (مهم لإنشاء الحساب من الموقع)
التطبيق يستدعي الدالة `public.sync_user_role(p_role text)` بعد تسجيل الدخول أو عند إنشاء حساب بجلسة فورية؛ تعمل بـ **SECURITY DEFINER** لتفادي أعطال RLS مع `upsert` من المتصفح.  
- إن أضفت قاعدتك قبل هذا التحديث: نفّذ ملف **`docs/supabase-patch-sync-user-role.sql`** مرة واحدة في SQL Editor.

### إنشاء المستخدمين وربط الأدوار يدوياً (اختياري)
بعد إنشاء أي مستخدم عبر Supabase Auth، يمكنك إضافة/تحديث دوره في جدول `public.users`:

- **super_admin / manager / employee / collector / client**

مثال:

```sql
insert into public.users (id, role)
values ('<AUTH_USER_UUID>', 'employee')
on conflict (id) do update set role = excluded.role;
```

### ملاحظات مهمة
- النظام يعتمد على RLS؛ لذلك صفحات السيرفر تستخدم **ANON key** عمدًا.
- هذا السكربت هو **MVP** لتشغيل الشاشات الحالية (قوائم/تفاصيل). عند إضافة حقول PRD كاملة يمكن توسيع الجداول والسياسات.
- جدول **`user_favorites`** (في نهاية نفس سكربت SQL) يزامن «مفضلاتي» مع المستخدم بعد تسجيل الدخول أو إنشاء حساب؛ إن لم تشغّل ذلك الجزء تبقى المفضلة محلية في المتصفح فقط.

### خصوصية موقع مثوى (للزوار)
- تم إضافة حقول نشر عامة في جدول `public.properties`:
  - `is_public`, `public_title`, `public_summary`, `public_price`, `public_image_url`, `city`, `district`
  - الحقل `exact_location` يبقى داخلي للموظفين فقط.
- تم إضافة دالة آمنة للواجهة العامة:
  - `public.get_public_property_offers(p_limit int)`
  - هذه الدالة تعيد **الحقول المسموح بها فقط** للزوار (anon/authenticated).
- يمنع عرض الموقع الدقيق في واجهة الزائر، ويظهر فقط عبر شاشات الموظفين الخاضعة لـ RLS.

### نشر عرض للزوار (مثال)
```sql
update public.properties
set
  is_public = true,
  public_title = 'شقة فاخرة - حي الياسمين',
  public_summary = '3 غرف، مجلس، موقع ممتاز قريب من الخدمات',
  public_price = 85000,
  city = 'الرياض',
  district = 'الياسمين'
where id = '<PROPERTY_UUID>';
```

