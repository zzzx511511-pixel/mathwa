import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/get-session-user-id";
import { getUserRole } from "@/lib/auth/get-user-role";

/**
 * مواصفة مثوى — إدارة الحسابات (مدير).
 * POST/GET الكامل يتطلب جداول ومفاتيح؛ حالياً نقطة تمديد آمنة.
 */
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const role = await getUserRole();
  if (role !== "super_admin" && role !== "manager" && role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return NextResponse.json({
    ok: false,
    message:
      "تفعيل GET /api/admin/users يتطلب استعلاماً مؤمّناً على portal users. راجع docs/supabase-auth-spec-access-code.sql واربط واجهة الإدارة."
  });
}

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const role = await getUserRole();
  if (role !== "super_admin" && role !== "manager" && role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return NextResponse.json(
    {
      ok: false,
      message:
        "إنشاء الحساب من لوحة المدير سيُربط بـ Auth + access_code. نفّذ المنطق حسب نموذج بيانات المواصفة."
    },
    { status: 501 }
  );
}
