# مثوى العقارية

نظام إدارة عقارات باستخدام:
- Next.js 14 (App Router)
- Tailwind CSS
- Supabase (Auth + Database لاحقًا)

## التجهيز
1. ثبّت Node.js و npm.
2. أنشئ ملف إعدادات:
   - انسخ `.env.example` الى `.env.local`
   - حدّث قيم Supabase.
3. ثبّت الحزم:
   - `npm install`

## التشغيل
- التطوير: `npm run dev`
- البِلْد: `npm run build`

## ملاحظات مهمة للأمان (Supabase + RLS)
- `lib/supabase/server.ts` يستخدم **ANON key** حتى يتم تطبيق RLS على كل الطلبات.
- `SUPABASE_SERVICE_ROLE_KEY` لا يجب استخدامه في صفحات المستخدمين. إذا احتجته لعمليات إدارية فقط استخدم `lib/supabase/admin.ts`.

## الهيكل الحالي
- `app/(public)/page.tsx` : الموقع العام
- `app/login/page.tsx` : تسجيل الدخول
- `app/employee/dashboard/page.tsx` : لوحة الموظفين
- `app/tenant/portal/page.tsx` : بوابة المستأجر
- `app/owner/portal/page.tsx` : بوابة المالك
- `app/finance/dashboard/page.tsx` : قسم المالية
- `lib/supabase/*` : مُساعد Supabase (client/server)

## مراجع الوثائق
- `docs/prd-v2-reference.md` : تلخيص مستخرج من `mathwa prd v2.docx` (owners/properties/owner_transfers وحقولها)
- `docs/supabase-setup.md` : خطوات إعداد Supabase + تشغيل سكربت SQL

