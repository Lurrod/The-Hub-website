import type { RatingAggregate, EloDoc, QueueType } from "@/lib/db/types";

export interface PlayerStatLine {
  userId: string;
  queueType: QueueType;
  name: string;
  games: number;
  rating: number | null;
  adr: number | null;
  kd: number | null;
  kastPct: number | null;
  kpr: number | null;
  apr: number | null;
  fkpr: number | null;
  fdpr: number | null;
  hsPct: number | null;
  elo: number;
  wins: number;
  losses: number;
  updatedAt: Date;
}

/** Divide, or null when the denominator is non-positive (avoids div-by-zero). */
export function safeDiv(n: number, d: number): number | null {
  return d > 0 ? n / d : null;
}

function pct(n: number, d: number): number | null {
  const r = safeDiv(n, d);
  return r === null ? null : r * 100;
}

export function buildStatLine(agg: RatingAggregate, elo: EloDoc): PlayerStatLine {
  const r = agg.rounds_played;
  const shots = agg.headshots + agg.bodyshots + agg.legshots;
  return {
    userId: agg.user_id,
    queueType: agg.queue_type,
    name: elo.name,
    games: agg.games,
    rating: safeDiv(agg.rating_2_0_sum, agg.games),
    adr: safeDiv(agg.damage_made, r),
    kd: safeDiv(agg.kills, agg.deaths),
    kastPct: pct(agg.kast_rounds, r),
    kpr: safeDiv(agg.kills, r),
    apr: safeDiv(agg.assists, r),
    fkpr: safeDiv(agg.first_kills, r),
    fdpr: safeDiv(agg.first_deaths, r),
    hsPct: pct(agg.headshots, shots),
    elo: elo.elo,
    wins: elo.wins,
    losses: elo.losses,
    updatedAt: agg.updated_at,
  };
}
