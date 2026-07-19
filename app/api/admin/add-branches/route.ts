/**
 * POST /api/admin/add-branches
 * Merges a list of fetched branches into an existing place.
 * If a new branch shares a _googlePlaceId with an existing branch, the
 * existing branch is updated in-place instead of duplicated.
 * Only branches with no matching _googlePlaceId are appended as new entries.
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

    type BranchWithGid = Branch & { _googlePlaceId?: string };

    // Stamp IDs on the incoming branches if missing.
    const ts = Date.now();
    const stamped = newBranches.map((b, i) => ({
      ...b,
      id: b.id || `${place_id}-bf${ts}-${i + 1}`,
    })) as BranchWithGid[];

    // Merge incoming branches into existing ones:
    // - If an existing branch already has the same _googlePlaceId as an
    //   incoming branch → update it in-place (no duplicate).
    // - Otherwise append as a new branch.
    const existingGids = new Map<string, number>();
    (place.branches as BranchWithGid[]).forEach((b, i) => {
      if (b._googlePlaceId) existingGids.set(b._googlePlaceId, i);
    });

    const merged = [...place.branches] as BranchWithGid[];
    let added = 0;
    let updated = 0;

    for (const incoming of stamped) {
      const existingIdx = incoming._googlePlaceId
        ? existingGids.get(incoming._googlePlaceId)
        : undefined;

      if (existingIdx !== undefined) {
        // Update the existing branch, preserving its original id.
        merged[existingIdx] = { ...merged[existingIdx], ...incoming, id: merged[existingIdx].id };
        updated++;
      } else {
        merged.push(incoming);
        if (incoming._googlePlaceId) existingGids.set(incoming._googlePlaceId, merged.length - 1);
        added++;
      }
    }

    // Derive place.googlePlaceId from the first incoming branch that has one,
    // but only when the place doesn't already have a place-level ID set.
    const firstBranchGid = stamped.find((b) => b._googlePlaceId)?._googlePlaceId;
    const existingPlaceGid = (place as { googlePlaceId?: string }).googlePlaceId;
    const updatedGooglePlaceId = existingPlaceGid ?? firstBranchGid;

    const ok = await upsertCustomPlace({
      ...place,
      ...(updatedGooglePlaceId ? { googlePlaceId: updatedGooglePlaceId } : {}),
      branches: merged,
    });

    if (!ok) return NextResponse.json({ error: "upsert failed" }, { status: 500 });

    revalidatePath("/places");
    revalidatePath("/category/[slug]", "page");
    revalidatePath(`/places/${place_id}`);

    return NextResponse.json({
      ok:      true,
      place_id,
      added,
      updated,
      total:   merged.length,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
