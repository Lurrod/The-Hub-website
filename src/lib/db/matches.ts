import { ObjectId } from "mongodb";
import { getDb } from "./client";
import type { MatchPlayerStat, MatchDoc, MatchTeamPlayer, RoundBreakdown } from "./match-types";
import { buildMatchLine, type MatchLine } from "@/lib/stats/match-line";

export interface HistoryRow extends MatchLine {
  eloDelta: number | null;
  scoreLine: string | null;
  matchNumber: number | null;
}

function scoreLine(m: MatchDoc | undefined): string | null {
  if (!m || m.score_a === undefined || m.score_b === undefined) return null;
  return `${m.score_a}-${m.score_b}`;
}

/** Recent matches for a player, newest first, enriched from the parent match. */
export async function getPlayerMatchHistory(
  userId: string,
  opts: { limit?: number; skip?: number } = {},
): Promise<HistoryRow[]> {
  const limit = opts.limit ?? 15;
  const skip = opts.skip ?? 0;
  const db = await getDb();
  const stats = await db
    .collection<MatchPlayerStat>("match_player_stats")
    .find({ user_id: userId })
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
  if (stats.length === 0) return [];

  const oids = stats
    .map((s) => (ObjectId.isValid(s.match_id) ? new ObjectId(s.match_id) : null))
    .filter((x): x is ObjectId => x !== null);
  const matches = await db.collection<MatchDoc>("matches").find({ _id: { $in: oids } }).toArray();
  const byId = new Map(matches.map((m) => [m._id.toHexString(), m]));

  return stats.map((s) => {
    const m = byId.get(s.match_id);
    const er = m?.elo_results?.[userId];
    return {
      ...buildMatchLine(s),
      eloDelta: er ? er.delta : null,
      scoreLine: scoreLine(m),
      matchNumber: m?.match_number ?? null,
    };
  });
}

export interface ScoreboardPlayer extends MatchLine {
  name: string;
  eloDelta: number | null;
}

export interface MatchDetail {
  matchId: string;
  matchNumber: number | null;
  map: string;
  queueType: string;
  status: string;
  createdAt: Date;
  scoreA: number | null;
  scoreB: number | null;
  winner: "a" | "b" | null;
  rounds: RoundBreakdown[];
  teamA: ScoreboardPlayer[];
  teamB: ScoreboardPlayer[];
}

function nameFor(teams: MatchTeamPlayer[], uid: string): string | undefined {
  return teams.find((p) => String(p.id) === uid)?.name;
}

/** Full match detail (both teams' scoreboards), or null if not found. */
export async function getMatchDetail(matchId: string): Promise<MatchDetail | null> {
  if (!ObjectId.isValid(matchId)) return null;
  const db = await getDb();
  const oid = new ObjectId(matchId);
  const [match, stats] = await Promise.all([
    db.collection<MatchDoc>("matches").findOne({ _id: oid }),
    db.collection<MatchPlayerStat>("match_player_stats").find({ match_id: matchId }).toArray(),
  ]);
  if (!match) return null;

  const teamAIds = new Set(match.team_a.map((p) => String(p.id)));
  const teamA: ScoreboardPlayer[] = [];
  const teamB: ScoreboardPlayer[] = [];
  for (const s of stats) {
    const er = match.elo_results?.[s.user_id];
    const row: ScoreboardPlayer = {
      ...buildMatchLine(s),
      name: nameFor(match.team_a, s.user_id) ?? nameFor(match.team_b, s.user_id) ?? s.user_id,
      eloDelta: er ? er.delta : null,
    };
    (teamAIds.has(s.user_id) ? teamA : teamB).push(row);
  }
  const byRating = (a: ScoreboardPlayer, b: ScoreboardPlayer) => b.rating - a.rating;
  teamA.sort(byRating);
  teamB.sort(byRating);

  const winner =
    match.status === "validated_a" ? "a" : match.status === "validated_b" ? "b" : null;
  return {
    matchId,
    matchNumber: match.match_number ?? null,
    map: match.map,
    queueType: match.queue_type,
    status: match.status,
    createdAt: match.created_at,
    scoreA: match.score_a ?? null,
    scoreB: match.score_b ?? null,
    winner,
    rounds: match.rounds ?? [],
    teamA,
    teamB,
  };
}
