import { getDb } from "./client";
import type { RatingAggregate, EloDoc, QueueType } from "./types";
import { buildStatLine, type PlayerStatLine } from "@/lib/stats/derive";

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
