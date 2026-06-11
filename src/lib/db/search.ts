import { getDb } from "./client";
import type { EloDoc } from "./types";

export interface PlayerHit {
  userId: string;
  name: string;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Players whose name contains `query` (case-insensitive), de-duped by user. */
export async function searchPlayers(query: string, limit = 20): Promise<PlayerHit[]> {
  // Defense in depth (callers should already cap): reject empty or absurdly
  // long queries so we never compile an unindexable multi-KB $regex.
  const q = query.trim().slice(0, 100);
  if (q.length === 0) return [];
  const db = await getDb();
  const docs = await db
    .collection<EloDoc>("elo")
    .find({ name: { $regex: escapeRegex(q), $options: "i" } })
    .limit(limit * 4)
    .toArray();

  const seen = new Set<string>();
  const hits: PlayerHit[] = [];
  for (const d of docs) {
    if (seen.has(d.user_id)) continue;
    seen.add(d.user_id);
    hits.push({ userId: d.user_id, name: d.name });
    if (hits.length >= limit) break;
  }
  return hits;
}
