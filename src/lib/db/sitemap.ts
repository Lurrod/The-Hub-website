import { getDb } from "./client";
import type { RatingAggregate } from "./types";

export interface SitemapPlayer {
  userId: string;
  updatedAt: Date | null;
}

export interface SitemapMatch {
  matchId: string;
  createdAt: Date | null;
}

export interface SitemapEntries {
  players: SitemapPlayer[];
  matches: SitemapMatch[];
}

/** Caps so the sitemap stays well under the 50k-URL protocol limit. */
const MATCH_LIMIT = 1000;
const PLAYER_AGG_LIMIT = 20000;

/**
 * Players and validated matches to enumerate in the public sitemap.
 * One entry per player (most recent `updated_at` across their queues),
 * plus the latest validated matches, newest first.
 */
export async function getSitemapEntries(): Promise<SitemapEntries> {
  const db = await getDb();
  const [aggs, matchDocs] = await Promise.all([
    db
      .collection<RatingAggregate>("player_rating_aggregates")
      .find({}, { projection: { _id: 0, user_id: 1, updated_at: 1 } })
      .limit(PLAYER_AGG_LIMIT)
      .toArray(),
    db
      .collection("matches")
      .find(
        { status: { $in: ["validated_a", "validated_b"] } },
        { projection: { created_at: 1 } },
      )
      .sort({ created_at: -1 })
      .limit(MATCH_LIMIT)
      .toArray(),
  ]);

  const latestByUser = new Map<string, Date | null>();
  for (const agg of aggs) {
    const prev = latestByUser.get(agg.user_id);
    const current = agg.updated_at ?? null;
    if (prev === undefined || (current && (!prev || current > prev))) {
      latestByUser.set(agg.user_id, current);
    }
  }

  return {
    players: [...latestByUser].map(([userId, updatedAt]) => ({ userId, updatedAt })),
    matches: matchDocs.map((m) => ({
      matchId: m._id.toHexString(),
      createdAt: (m.created_at as Date | undefined) ?? null,
    })),
  };
}
