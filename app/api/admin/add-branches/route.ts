/**
 * POST /api/admin/add-branches
 * Appends a list of new branches to an existing place.
 * Body: { place_id: string; branches: Branch[] }
 */
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminAuthed, unauthorized } from "@/lib/salsabeel/admin-auth";
import { getCustomPlaces, upsertCustomPlace } from "@/lib/salsabeel/supabase-places";
import { mergePlaces } from "@/lib/salsabeel/data";
import type { Branch } from "@/lib/salsabeel/types";

export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();

  let body: { place_id?: string; branches?: Branch[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const { place_id, branches: newBranches } = body;
  if (!place_id || !newBranches?.length) {
    return NextResponse.json({ error: "place_id and branches[] are required" }, { status: 400 });
  }

  try {
    const allPlaces = mergePlaces(await getCustomPlaces());
    const place = allPlaces.find((p) => p.id === place_id);
    if (!place) {
      return NextResponse.json({ error: `place "${place_id}" not found` }, { status: 400 });
    }

    // Stamp IDs on the incoming branches if missing.
    const ts = Date.now();
    const stamped: Branch[] = newBranches.map((b, i) => ({
      ...b,
      id: b.id || `${place_id}-bf${ts}-${i + 1}`,
    }));

    const ok = await upsertCustomPlace({
      ...place,
      branches: [...place.branches, ...stamped],
    });

    if (!ok) return NextResponse.json({ error: "upsert failed" }, { status: 500 });

    revalidatePath("/places");
    revalidatePath("/category/[slug]", "page");
    revalidatePath(`/places/${place_id}`);

    return NextResponse.json({
      ok:      true,
      place_id,
      added:   stamped.length,
      total:   place.branches.length + stamped.length,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
