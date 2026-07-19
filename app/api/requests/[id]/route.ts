import { NextRequest, NextResponse } from "next/server";
import { updateRequestStatus } from "@/lib/salsabeel/supabase-requests";
import { isAdminAuthed, unauthorized } from "@/lib/salsabeel/admin-auth";
import { deleteStoredPhotos, deleteSpecificPhoto } from "@/lib/salsabeel/place-photos";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthed(req)) return unauthorized();
  try {
    const body = await req.json();
    const { action, type, place_id, content } = body as {
      action: "approve" | "reject";
      type: string;
      place_id?: string;
      content?: Record<string, unknown>;
    };
    if (!action) return NextResponse.json({ error: "action مطلوب" }, { status: 400 });

    if (action === "approve" && type === "wrong_photo" && place_id) {
      const photoUrl = content?.photoUrl as string | undefined;
      if (photoUrl) {
        // Delete only the reported photo + clear .gid-* so Google re-fetches a replacement.
        await deleteSpecificPhoto(place_id, photoUrl);
      } else {
        // Fallback (no URL in content): clear all photos and block auto-refetch.
        await deleteStoredPhotos(place_id);
      }
    }

    const status = action === "approve" ? "approved" : "rejected";
    const ok = await updateRequestStatus(params.id, status);
    if (!ok) return NextResponse.json({ error: "فشل التحديث" }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
}
