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

type DuplicateKind = "EXACT" | "SUBSET" | "BRANCH_CLASH";

type DuplicateGroup = {
  kind:        DuplicateKind;
  place_a:     { id: string; name: string; category: string; branches_count: number };
  place_b:     { id: string; name: string; category: string; branches_count: number };
  /** For BRANCH_CLASH: the branch in place_a whose name matches place_b */
  matching_branch?: Branch;
  note:        string;
};

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
            place_a: { id: a.id, name: a.name, category: a.category, branches_count: a.branches.length },
            place_b: { id: b.id, name: b.name, category: b.category, branches_count: b.branches.length },
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
              ((g.place_a.id === a.id && g.place_b.id === match.id) ||
               (g.place_b.id === a.id && g.place_a.id === match.id))
          );
          if (!alreadyExact) {
            groups.push({
              kind:    "BRANCH_CLASH",
              place_a: { id: a.id,     name: a.name,     category: a.category,     branches_count: a.branches.length },
              place_b: { id: match.id, name: match.name, category: match.category, branches_count: match.branches.length },
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
            ((g.place_a.id === a.id && g.place_b.id === b.id) ||
             (g.place_b.id === a.id && g.place_a.id === b.id))
        );
        if (alreadyClash) continue;

        groups.push({
          kind:    "SUBSET",
          place_a: { id: shortPlace.id, name: shortPlace.name, category: shortPlace.category, branches_count: shortPlace.branches.length },
          place_b: { id: longPlace.id,  name: longPlace.name,  category: longPlace.category,  branches_count: longPlace.branches.length },
          note:    `"${longPlace.name}" قد تكون فرعاً من "${shortPlace.name}" مسجّل بالغلط كمنشأة رئيسية مستقلة`,
        });
      }
    }

    // Sort: EXACT first (highest confidence), then BRANCH_CLASH, then SUBSET.
    const order: Record<DuplicateKind, number> = { EXACT: 0, BRANCH_CLASH: 1, SUBSET: 2 };
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
