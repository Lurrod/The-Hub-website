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
