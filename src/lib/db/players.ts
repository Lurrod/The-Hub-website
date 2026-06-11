import { unstable_cache } from "next/cache";
import { getDb } from "./client";
import type { RatingAggregate, EloDoc, QueueType } from "./types";
import { buildStatLine, type PlayerStatLine } from "@/lib/stats/derive";

/** Cache tag for all queue stat-line entries; revalidate with `revalidateTag`. */
export const QUEUE_STAT_LINES_TAG = "queue-stat-lines";

export interface QueueStatOptions {
  /** Minimum games to be included. Default 0. */
  minGames?: number;
}

/**
 * All players of a queue as derived stat lines, sorted by Rating desc.
 * Joins `player_rating_aggregates` with `elo` on the shared compound `_id`.
 * Players without a matching `elo` doc are skipped.
 */
export async function getQueueStatLines(
  queueType: QueueType,
  opts: QueueStatOptions = {},
): Promise<PlayerStatLine[]> {
  const minGames = opts.minGames ?? 0;
  const db = await getDb();
  const aggs = await db
    .collection<RatingAggregate>("player_rating_aggregates")
    .find({ queue_type: queueType, games: { $gte: minGames } })
    .toArray();
  if (aggs.length === 0) return [];

  const ids = aggs.map((a) => a._id);
  const elos = await db
    .collection<EloDoc>("elo")
    .find({ _id: { $in: ids } })
    .toArray();
  const eloById = new Map(elos.map((e) => [e._id, e]));

  const lines: PlayerStatLine[] = [];
  for (const agg of aggs) {
    const elo = eloById.get(agg._id);
    if (elo) lines.push(buildStatLine(agg, elo));
  }
  lines.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
  return lines;
}

/**
 * Cached variant of {@link getQueueStatLines} for page rendering.
 *
 * The cache key includes `queueType` and `minGames` (both via the wrapped
 * function's arguments and the explicit key parts), so each queue caches
 * independently — unlike a page-level `revalidate`, which the client Router
 * Cache keys by pathname only and would reuse one queue's render across tabs.
 * Pages stay dynamic (driven by `searchParams`) while the DB query is reused
 * for `revalidate` seconds per queue. Invalidate with
 * `revalidateTag(QUEUE_STAT_LINES_TAG)`.
 */
export async function getCachedQueueStatLines(
  queueType: QueueType,
  opts: QueueStatOptions = {},
): Promise<PlayerStatLine[]> {
  const minGames = opts.minGames ?? 0;
  const lines = await cachedQueueStatLines(queueType, minGames);
  // `unstable_cache` JSON-serializes its result, so on a cache hit `updatedAt`
  // returns as an ISO string. Re-hydrate it to a Date so callers such as
  // `rankLeaderboard` can call Date methods. `new Date` accepts a Date or string.
  return lines.map((l) => ({ ...l, updatedAt: new Date(l.updatedAt) }));
}

const cachedQueueStatLines = unstable_cache(
  (queueType: QueueType, minGames: number) =>
    getQueueStatLines(queueType, { minGames }),
  [QUEUE_STAT_LINES_TAG],
  { revalidate: 60, tags: [QUEUE_STAT_LINES_TAG] },
);
