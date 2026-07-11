import { NextRequest, NextResponse } from "next/server";
import {
  getCustomPlaces,
  upsertCustomPlace,
  deleteCustomPlace,
} from "@/lib/salsabeel/supabase-places";
import { isAdminAuthed, unauthorized } from "@/lib/salsabeel/admin-auth";
import { getPlaceById } from "@/lib/salsabeel/data";

export async function GET() {
  const places = await getCustomPlaces();
  return NextResponse.json(places);
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();
  try {
    const place = await req.json();
    if (!place?.id || !place?.name) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }
    const ok = await upsertCustomPlace(place);
    if (!ok) return NextResponse.json({ error: "فشل الحفظ في قاعدة البيانات" }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id مطلوب" }, { status: 400 });

    // Static places can't be physically deleted (they live in code).
    // Write a tombstone to custom_places so mergePlaces hides them.
    if (getPlaceById(id)) {
      const ok = await upsertCustomPlace({ id, _deleted: true } as never);
      if (!ok) return NextResponse.json({ error: "فشل الحذف" }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    const ok = await deleteCustomPlace(id);
    if (!ok) return NextResponse.json({ error: "فشل الحذف" }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
}
