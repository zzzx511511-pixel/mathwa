# عروض الواجهة العامة — الشاغر فقط

الصفحات **`/`** و **`/offers`** و **`/offers/[id]`** تمرّر نتائج الدالة `get_public_property_offers` عبر **`filterPublicVacantOffers`** في `lib/site/public-vacant-offers.ts`.

## ماذا يلزم في قاعدة البيانات؟

أرجِع من الـ RPC أحد الأعمدة (أو أكثر) بحيث يمكن تمييز الشاغر:

- `occupancy_status` **أو** `status` **أو** `property_status` **أو** `offer_status` **أو** `listing_status`

قيم تُعرض في العامة: مثل `vacant`, `شاغر`, `available`, `متاح`.  
قيم تُستبعد: مثل `occupied`, `مؤجَر`, `rented`.

إذا **لم يُرجع** أي من هذه الحقول للصف، السجل يُعتبر صالحاً للعرض (توافق مع بيانات قديمة). يُفضّل إضافة الحقل في الـ RPC والربط بجدول العقارات.

## تعديل الـ RPC في Supabase (اقتراح)

في تعريف `get_public_property_offers` أضف عموداً من جدول العقارات، مثلاً:

```sql
-- مثال مفهومي ( names تختلف حسب مخططك )
SELECT
  p.id,
  p.title,
  ...,
  p.status AS occupancy_status
FROM properties p
WHERE p.is_public_offer = true
  AND p.status = 'vacant'   -- أو مكافئ "شاغر"
LIMIT p_limit;
```

ثم يبقى الفلتر في التطبيق طبقة أمان إضافية إن وُجدت بيانات بلا حقل.

## غرفة إدارة الأملاك

الموظفون يرون **السجل الكامل** من **`/employee/properties`** وما يرتبط بها داخل **`/employee/estares`** دون قيد «شاغر فقط».
