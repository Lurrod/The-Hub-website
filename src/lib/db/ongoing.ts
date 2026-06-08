import { getDb } from "./client";
import type { MatchDoc, MatchTeamPlayer } from "./match-types";

/** Match statuses considered "in progress" (not yet concluded). */
const ONGOING_STATUSES = ["pending", "contested"] as const;

export interface OngoingTeamPlayer {
  id: string;
  name: string;
  elo: number | null;
}

export interface OngoingMatch {
  matchId: string;
  matchNumber: number | null;
  queueType: string;
  map: string | null;
  status: string;
  createdAt: Date;
  teamA: OngoingTeamPlayer[];
  teamB: OngoingTeamPlayer[];
}

function mapTeam(team: MatchTeamPlayer[] | undefined): OngoingTeamPlayer[] {
  return (team ?? []).map((p) => ({
    id: String(p.id),
    name: p.name ?? String(p.id),
    elo: typeof p.elo === "number" ? p.elo : null,
  }));
}

/** Matches currently in progress (pending / contested), newest first. */
export async function getOngoingMatches(): Promise<OngoingMatch[]> {
  const db = await getDb();
  const docs = await db
    .collection<MatchDoc>("matches")
    .find({ status: { $in: [...ONGOING_STATUSES] } })
    .sort({ created_at: -1 })
    .limit(50)
    .toArray();

  return docs.map((m) => ({
    matchId: m._id.toHexString(),
    matchNumber: m.match_number ?? null,
    queueType: m.queue_type,
    map: m.map ?? null,
    status: m.status,
    createdAt: m.created_at,
    teamA: mapTeam(m.team_a),
    teamB: mapTeam(m.team_b),
  }));
}

export interface RecentMatch {
  matchId: string;
  matchNumber: number | null;
  queueType: string;
  map: string | null;
  scoreA: number | null;
  scoreB: number | null;
  winner: "a" | "b" | null;
  createdAt: Date;
  teamA: OngoingTeamPlayer[];
  teamB: OngoingTeamPlayer[];
}

/** Recently concluded matches (validated), newest first. */
export async function getRecentMatches(limit = 20): Promise<RecentMatch[]> {
  const db = await getDb();
  const docs = await db
    .collection<MatchDoc>("matches")
    .find({ status: { $in: ["validated_a", "validated_b"] } })
    .sort({ created_at: -1 })
    .limit(limit)
    .toArray();

  return docs.map((m) => ({
    matchId: m._id.toHexString(),
    matchNumber: m.match_number ?? null,
    queueType: m.queue_type,
    map: m.map ?? null,
    scoreA: m.score_a ?? null,
    scoreB: m.score_b ?? null,
    winner: m.status === "validated_a" ? "a" : m.status === "validated_b" ? "b" : null,
    createdAt: m.created_at,
    teamA: mapTeam(m.team_a),
    teamB: mapTeam(m.team_b),
  }));
}
