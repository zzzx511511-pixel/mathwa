# PRD v2 reference (مستخرج من `mathwa prd v2.docx`)

## المجالات التي ظهرت بوضوح في الوثيقة
### 1) `owners`
- الحقول الأساسية:
  - `owner_type` (افتراضيًا `individual`)
  - `user_id` (FK إلى `auth.users` عبر `auth.uid()` في منطق RLS)

### 2) `properties` (إضافة أعمدة)
- تم ذكر إضافة أعمدة إلى `properties`:
  - `ownership_type` (افتراضيًا `company_owned`)
  - `owner_id` (FK إلى `owners(id)`)
  - `commission_rate` (افتراضيًا `0`)
  - `management_start_date`
  - `management_end_date`

### 3) `owner_transfers`
- الحقول الظاهرة ضمن منطق التحويل:
  - `commission_deducted` (خصم العمولة)
  - `net_amount_transferred` (الصافي)
  - `transfer_date`
  - ربط بالـ `property_id` و `owner_id`
- حالات التحويل:
  - `pending / transferred / cancelled`
- أمان البيانات (RLS):
  - `ALTER TABLE owner_transfers ENABLE ROW LEVEL SECURITY;`
  - `CREATE POLICY owner_own_transfers ...`
  - الفكرة: “المالك يرى سجلاته فقط” (اعتمادًا على `auth.uid()`).

## ملاحظة
هذه المذكرة تلخص فقط ما أمكن استخراجه نصيًا من `prd v2` عبر محتوى `document.xml`/`styles.xml` (وبالتالي قد لا تغطي كل أقسام PRD إن كانت الوثيقة فيها أجزاء غير نصية/مجزأة).

