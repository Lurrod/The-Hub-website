import type { MatchPlayerStat } from "@/lib/db/match-types";
import type { QueueType } from "@/lib/db/types";
import { safeDiv } from "./derive";

export interface MatchLine {
  matchId: string;
  userId: string;
  queueType: QueueType;
  map: string;
  agent: string;
  win: boolean;
  rating: number;
  acs: number;
  kills: number;
  deaths: number;
  assists: number;
  adr: number | null;
  hsPct: number | null;
  kastPct: number | null;
  firstKills: number;
  firstDeaths: number;
  createdAt: Date;
}

export function buildMatchLine(s: MatchPlayerStat): MatchLine {
  const shots = s.headshots + s.bodyshots + s.legshots;
  const kast = safeDiv(s.kast_rounds, s.rounds_played);
  const hs = safeDiv(s.headshots, shots);
  return {
    matchId: s.match_id,
    userId: s.user_id,
    queueType: s.queue_type,
    map: s.map,
    agent: s.agent,
    win: s.win,
    rating: s.rating_2_0,
    acs: s.acs,
    kills: s.kills,
    deaths: s.deaths,
    assists: s.assists,
    adr: safeDiv(s.damage_made, s.rounds_played),
    hsPct: hs === null ? null : hs * 100,
    kastPct: kast === null ? null : kast * 100,
    firstKills: s.first_kills,
    firstDeaths: s.first_deaths,
    createdAt: s.created_at,
  };
}

/** Short relative time like "30m ago" / "3h ago" / "2d ago". */
export function relativeTime(then: Date, now: Date = new Date()): string {
  const sec = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}
