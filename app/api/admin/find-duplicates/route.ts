/**
 * GET /api/admin/find-duplicates
 *
 * Scans ALL places (static data merged with Supabase custom places) for records
 * that appear to be duplicated:
 *   EXACT        — two main places with identical normalised names
 *   SUBSET       — name A starts with name B (or vice-versa) in same category
 *                  suggesting one is a branch of the other stored as a main place
 *   BRANCH_CLASH — a main place's name exactly matches a branch name already
 *                  stored inside another main place
 *
 * Also scans branches WITHIN each place for intra-place duplicates:
 *   BRANCH_SAME_GID  — two branches in the same place share a _googlePlaceId
 *   BRANCH_NEAR      — two branches in the same place are within 200 m of each other
 *
 * Returns a ranked list of candidate groups for admin review.
 * DOES NOT modify any data.
 */
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed, unauthorized } from "@/lib/salsabeel/admin-auth";
import { getCustomPlaces } from "@/lib/salsabeel/supabase-places";
import { mergePlaces } from "@/lib/salsabeel/data";
import type { Place, Branch } from "@/lib/salsabeel/types";

// Arabic text normalisation: remove diacritics, unify letters, collapse spaces.
function norm(s: string): string {
  return s
    .replace(/[ً-ٰٟ]/g, "")   // tashkeel
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

type DuplicateKind = "EXACT" | "SUBSET" | "BRANCH_CLASH" | "BRANCH_SAME_GID" | "BRANCH_NEAR";

type PlaceRef = {
  id:            string;
  name:          string;
  category:      string;
  branches_count: number;
  neighborhood?: string;
  address?:      string;
};

function placeRef(p: Place): PlaceRef {
  return {
    id:             p.id,
    name:           p.name,
    category:       p.category,
    branches_count: p.branches.length,
    neighborhood:   p.neighborhood ?? p.branches[0]?.neighborhood,
    address:        p.address      ?? p.branches[0]?.address,
  };
}

type BranchRef = {
  id:             string;
  name:           string;
  address?:       string;
  neighborhood?:  string;
  _googlePlaceId?: string;
  lat?:           number;
  lng?:           number;
};

type DuplicateGroup = {
  kind:        DuplicateKind;
  place_a:     PlaceRef;
  place_b?:    PlaceRef;
  /** For BRANCH_CLASH: the branch in place_a whose name matches place_b */
  matching_branch?: Branch;
  /** For BRANCH_SAME_GID / BRANCH_NEAR: the two duplicate branches within place_a */
  branch_x?:   BranchRef;
  branch_y?:   BranchRef;
  distance_m?: number;
  note:        string;
};

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function branchRef(b: Branch & { _googlePlaceId?: string }): BranchRef {
  return {
    id:             b.id,
    name:           b.name,
    address:        b.address,
    neighborhood:   b.neighborhood,
    _googlePlaceId: b._googlePlaceId,
    lat:            b.lat,
    lng:            b.lng,
  };
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) return unauthorized();

  try {
    // Merge static data with Supabase custom places — same logic as all page components.
    const custom = await getCustomPlaces();
    const places: Place[] = mergePlaces(custom);

    const groups: DuplicateGroup[] = [];

    // Build a map: normalised name → places with that name (for EXACT check).
    const byNormName = new Map<string, Place[]>();
    for (const p of places) {
      const key = norm(p.name);
      if (!byNormName.has(key)) byNormName.set(key, []);
      byNormName.get(key)!.push(p);
    }

    // ── EXACT duplicates ─────────────────────────────────────────────────────
    for (const [, group] of byNormName) {
      if (group.length < 2) continue;
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const a = group[i], b = group[j];
          groups.push({
            kind:    "EXACT",
            place_a: placeRef(a),
            place_b: placeRef(b),
            note:    `كلا السجلين لهما نفس الاسم بالضبط (${a.name})`,
          });
        }
      }
    }

    // Build a fast set of all normalised place names for BRANCH_CLASH check.
    const placeNameSet = new Map<string, Place>();
    for (const p of places) placeNameSet.set(norm(p.name), p);

    // ── SUBSET + BRANCH_CLASH ─────────────────────────────────────────────────
    for (let i = 0; i < places.length; i++) {
      const a = places[i];
      const normA = norm(a.name);

      // BRANCH_CLASH: does any branch of A match another main place's name?
      for (const branch of a.branches) {
        const normBranch = norm(branch.name);
        const match = placeNameSet.get(normBranch);
        if (match && match.id !== a.id) {
          // Avoid adding if already captured as EXACT.
          const alreadyExact = groups.some(
            (g) => g.kind === "EXACT" &&
              ((g.place_a.id === a.id && g.place_b?.id === match.id) ||
               (g.place_b?.id === a.id && g.place_a.id === match.id))
          );
          if (!alreadyExact) {
            groups.push({
              kind:    "BRANCH_CLASH",
              place_a: placeRef(a),
              place_b: placeRef(match),
              matching_branch: branch,
              note:    `"${match.name}" موجودة كمنشأة رئيسية مستقلة لكنها أيضاً مسجلة كفرع داخل "${a.name}"`,
            });
          }
        }
      }

      // SUBSET: does name A start with (or contain) name B, or vice-versa?
      for (let j = i + 1; j < places.length; j++) {
        const b = places[j];
        if (a.category !== b.category) continue; // different category → not same chain
        const normB = norm(b.name);
        if (normA === normB) continue;           // already caught as EXACT

        const [shorter, longer, shortPlace, longPlace] =
          normA.length <= normB.length
            ? [normA, normB, a, b]
            : [normB, normA, b, a];

        if (shorter.length < 3) continue; // too short to be meaningful

        // The longer name must START with the shorter one followed by space/end.
        const startsWithShort =
          longer === shorter ||
          longer.startsWith(shorter + " ") ||
          longer.startsWith(shorter + "-") ||
          longer.startsWith(shorter + "،");

        if (!startsWithShort) continue;

        // Skip if already reported as BRANCH_CLASH for these two.
        const alreadyClash = groups.some(
          (g) => g.kind === "BRANCH_CLASH" &&
            ((g.place_a.id === a.id && g.place_b?.id === b.id) ||
             (g.place_b?.id === a.id && g.place_a.id === b.id))
        );
        if (alreadyClash) continue;

        groups.push({
          kind:    "SUBSET",
          place_a: placeRef(shortPlace),
          place_b: placeRef(longPlace),
          note:    `"${longPlace.name}" قد تكون فرعاً من "${shortPlace.name}" مسجّل بالغلط كمنشأة رئيسية مستقلة`,
        });
      }
    }

    // ── Intra-place branch duplicates ─────────────────────────────────────────
    // BRANCH_SAME_GID: two branches within the same place share a _googlePlaceId.
    // BRANCH_NEAR: two branches within the same place are within 200 m of each other.
    for (const place of places) {
      type BranchWithGid = Branch & { _googlePlaceId?: string };
      const bs = place.branches as BranchWithGid[];

      for (let i = 0; i < bs.length; i++) {
        for (let j = i + 1; j < bs.length; j++) {
          const bx = bs[i], by = bs[j];
          const ref = placeRef(place);

          // Same googlePlaceId
          if (bx._googlePlaceId && by._googlePlaceId && bx._googlePlaceId === by._googlePlaceId) {
            groups.push({
              kind:     "BRANCH_SAME_GID",
              place_a:  ref,
              branch_x: branchRef(bx),
              branch_y: branchRef(by),
              note:     `فرعان في "${place.name}" يتشاركان نفس Google Place ID (${bx._googlePlaceId})`,
            });
          }

          // Within 200 m
          if (bx.lat != null && bx.lng != null && by.lat != null && by.lng != null) {
            const dist = Math.round(haversineM(bx.lat, bx.lng, by.lat, by.lng));
            if (dist < 200) {
              // Skip if already reported as SAME_GID for these two
              const alreadySameGid =
                bx._googlePlaceId &&
                by._googlePlaceId &&
                bx._googlePlaceId === by._googlePlaceId;
              if (!alreadySameGid) {
                groups.push({
                  kind:       "BRANCH_NEAR",
                  place_a:    ref,
                  branch_x:   branchRef(bx),
                  branch_y:   branchRef(by),
                  distance_m: dist,
                  note:       `فرعان في "${place.name}" على بُعد ${dist} متر من بعضهما — قد يكونان نفس الموقع`,
                });
              }
            }
          }
        }
      }
    }

    // Sort: EXACT first (highest confidence), then BRANCH_SAME_GID, BRANCH_CLASH, BRANCH_NEAR, SUBSET.
    const order: Record<DuplicateKind, number> = {
      EXACT:          0,
      BRANCH_SAME_GID: 1,
      BRANCH_CLASH:   2,
      BRANCH_NEAR:    3,
      SUBSET:         4,
    };
    groups.sort((a, b) => order[a.kind] - order[b.kind]);

    return NextResponse.json({
      total_places_scanned: places.length,
      duplicates_found:     groups.length,
      groups,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
