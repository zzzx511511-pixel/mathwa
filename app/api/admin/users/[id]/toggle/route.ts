import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/get-session-user-id";
import { getUserRole } from "@/lib/auth/get-user-role";

export async function PATCH(_req: Request, _ctx: { params: { id: string } }) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const role = await getUserRole();
  if (role !== "super_admin" && role !== "manager" && role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return NextResponse.json(
    { ok: false, message: "تفعيل/تعطيل الحساب: حدّث is_active في public.users (مواصفة مثوى)." },
    { status: 501 }
  );
}
