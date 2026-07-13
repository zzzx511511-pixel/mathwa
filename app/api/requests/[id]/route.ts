import { NextRequest, NextResponse } from "next/server";
import { updateRequestStatus } from "@/lib/salsabeel/supabase-requests";
import { isAdminAuthed, unauthorized } from "@/lib/salsabeel/admin-auth";
import { deleteStoredPhotos } from "@/lib/salsabeel/place-photos";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthed(req)) return unauthorized();
  try {
    const body = await req.json();
    const { action, type, place_id } = body as {
      action: "approve" | "reject";
      type: string;
      place_id?: string;
    };
    if (!action) return NextResponse.json({ error: "action مطلوب" }, { status: 400 });

    // Approve wrong_photo → clear the cached photos so they re-fetch correctly
    if (action === "approve" && type === "wrong_photo" && place_id) {
      await deleteStoredPhotos(place_id);
    }

    const status = action === "approve" ? "approved" : "rejected";
    const ok = await updateRequestStatus(params.id, status);
    if (!ok) return NextResponse.json({ error: "فشل التحديث" }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
}
