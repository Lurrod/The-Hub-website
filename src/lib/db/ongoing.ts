import { getDb } from "./client";
import type { MatchDoc, MatchTeamPlayer } from "./match-types";

/** Match statuses considered "in progress" (not yet concluded). */
const ONGOING_STATUSES = ["pending", "contested"] as const;

export interface OngoingTeamPlayer {
  id: string;
  name: string;
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
  return (team ?? []).map((p) => ({ id: String(p.id), name: p.name ?? String(p.id) }));
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
