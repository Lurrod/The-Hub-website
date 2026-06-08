import { getDb } from "./client";
import type { RatingAggregate, EloDoc, WebProfile } from "./types";
import { buildStatLine, type PlayerStatLine } from "@/lib/stats/derive";

export interface PlayerProfile {
  userId: string;
  name: string;
  queues: PlayerStatLine[];
  webProfile: WebProfile | null;
}

/** Full profile for a Discord user id, or null if the player is unknown. */
export async function getPlayerProfile(userId: string): Promise<PlayerProfile | null> {
  const db = await getDb();
  const [aggs, elos, web] = await Promise.all([
    db.collection<RatingAggregate>("player_rating_aggregates").find({ user_id: userId }).toArray(),
    db.collection<EloDoc>("elo").find({ user_id: userId }).toArray(),
    db.collection<WebProfile>("web_profiles").findOne({ _id: userId }),
  ]);
  if (aggs.length === 0 && elos.length === 0) return null;

  const eloById = new Map(elos.map((e) => [e._id, e]));
  const queues: PlayerStatLine[] = [];
  for (const agg of aggs) {
    const elo = eloById.get(agg._id);
    if (elo) queues.push(buildStatLine(agg, elo));
  }
  queues.sort((a, b) => b.elo - a.elo);
  const name = queues[0]?.name ?? elos[0]?.name ?? userId;
  return { userId, name, queues, webProfile: web ?? null };
}
