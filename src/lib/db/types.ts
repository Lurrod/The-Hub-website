export type QueueType = "pro" | "semipro" | "open" | "gc";

export const QUEUE_TYPES: QueueType[] = ["pro", "semipro", "open", "gc"];

export const QUEUE_LABELS: Record<QueueType, string> = {
  pro: "Pro",
  semipro: "Semi Pro",
  open: "Open",
  gc: "GC",
};

/** Doc in `player_rating_aggregates`, `_id = "<user_id>:<queue_type>"`. */
export interface RatingAggregate {
  _id: string;
  user_id: string;
  queue_type: QueueType;
  games: number;
  rounds_played: number;
  kills: number;
  deaths: number;
  assists: number;
  damage_made: number;
  damage_received: number;
  headshots: number;
  bodyshots: number;
  legshots: number;
  multikills_2k: number;
  multikills_3k: number;
  multikills_4k: number;
  multikills_5k: number;
  first_kills: number;
  first_deaths: number;
  kast_rounds: number;
  rating_2_0_sum: number;
  /** Sum of per-match ACS; only matches played since the bot started
   * accumulating it (2026-06-08) are included, so it may cover fewer
   * matches than `games`. */
  acs_sum?: number;
  /** Number of matches included in `acs_sum` — the correct denominator for
   * season ACS. Absent until the backfill script has run on the aggregate. */
  acs_games?: number;
  updated_at: Date;
}

/** Doc in `elo`, same `_id` as the aggregate. */
export interface EloDoc {
  _id: string;
  user_id: string;
  queue_type: QueueType;
  elo: number;
  wins: number;
  losses: number;
  name: string;
}

/** Doc in `web_profiles` (`_id = discord user_id`). Read-only in Plan 2. */
export interface WebProfile {
  _id: string;
  bio?: string;
  favorite_role?: string;
  favorite_map?: string;
  socials?: { twitch?: string; twitter?: string; youtube?: string };
  vlr_url?: string;
  tracker_url?: string;
  updated_at?: Date;
  discord_username?: string;
  discord_avatar?: string | null;
}
