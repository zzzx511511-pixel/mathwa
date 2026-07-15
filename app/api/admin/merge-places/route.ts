/**
 * POST /api/admin/merge-places
 *
 * Merges two duplicate place records: keeps one as the canonical entry and
 * converts the other into a branch appended to the keeper, then tombstones
 * the merged record and deletes its stored photos.
 *
 * Body: { keep_id: string; merge_id: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/salsabeel/admin-auth";
import { getCustomPlaces, upsertCustomPlace } from "@/lib/salsabeel/supabase-places";
import { mergePlaces } from "@/lib/salsabeel/data";
import { deleteStoredPhotos } from "@/lib/salsabeel/place-photos";
import type { Branch } from "@/lib/salsabeel/types";

export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();

  let body: { keep_id?: string; merge_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const { keep_id, merge_id } = body;
  if (!keep_id || !merge_id) {
    return NextResponse.json({ error: "keep_id and merge_id are required" }, { status: 400 });
  }
  if (keep_id === merge_id) {
    return NextResponse.json({ error: "keep_id and merge_id must be different" }, { status: 400 });
  }

  try {
    const allPlaces = mergePlaces(await getCustomPlaces());

    const keepPlace = allPlaces.find((p) => p.id === keep_id);
    if (!keepPlace) {
      return NextResponse.json({ error: `keep_id "${keep_id}" not found` }, { status: 400 });
    }

    const mergePlace = allPlaces.find((p) => p.id === merge_id);
    if (!mergePlace) {
      return NextResponse.json({ error: `merge_id "${merge_id}" not found` }, { status: 400 });
    }

    // Build a Branch from mergePlace, using place-level fields with branch[0] fallback.
    const branch: Branch = {
      id:           `${keep_id}-bm${Date.now()}`,
      name:         mergePlace.name,
      address:      mergePlace.address ?? mergePlace.branches[0]?.address ?? "",
      city:         mergePlace.branches[0]?.city ?? "الرياض",
      neighborhood: mergePlace.neighborhood ?? mergePlace.branches[0]?.neighborhood,
      region:       mergePlace.region        ?? mergePlace.branches[0]?.region,
      lat:          mergePlace.lat           ?? mergePlace.branches[0]?.lat,
      lng:          mergePlace.lng           ?? mergePlace.branches[0]?.lng,
      openingHours: mergePlace.openingHours  ?? mergePlace.branches[0]?.openingHours,
      phone:        mergePlace.phone         ?? mergePlace.branches[0]?.phone,
      mapsUrl:      mergePlace.mapsUrl       ?? mergePlace.branches[0]?.mapsUrl,
    };

    // Upsert keepPlace with the new branch appended.
    await upsertCustomPlace({
      ...keepPlace,
      branches: [...keepPlace.branches, branch],
    });

    // Tombstone mergePlace.
    await upsertCustomPlace({ ...mergePlace, _deleted: true });

    // Delete mergePlace's stored photos (best-effort; don't fail the merge if this errors).
    try {
      await deleteStoredPhotos(merge_id);
    } catch {
      // non-fatal
    }

    return NextResponse.json({
      ok:           true,
      kept:         keep_id,
      merged:       merge_id,
      branch_added: branch.name,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
