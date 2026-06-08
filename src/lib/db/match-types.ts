import type { ObjectId } from "mongodb";
import type { QueueType } from "./types";

/** Doc in `match_player_stats`. `match_id` is the match ObjectId's hex string. */
export interface MatchPlayerStat {
  _id: string;
  match_id: string;
  user_id: string;
  queue_type: QueueType;
  map: string;
  agent: string;
  rounds_played: number;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  damage_made: number;
  damage_received: number;
  headshots: number;
  bodyshots: number;
  legshots: number;
  first_kills: number;
  first_deaths: number;
  kast_rounds: number;
  acs: number;
  rating_2_0: number;
  created_at: Date;
}

export interface MatchTeamPlayer {
  id: number | string;
  name?: string;
  elo?: number;
}

export interface EloResult {
  delta: number;
  old: number;
  new: number;
  win: boolean;
}

export interface MatchDoc {
  _id: ObjectId;
  team_a: MatchTeamPlayer[];
  team_b: MatchTeamPlayer[];
  map: string;
  queue_type: QueueType;
  status: string;
  match_number?: number | null;
  created_at: Date;
  score_a?: number;
  score_b?: number;
  elo_results?: Record<string, EloResult>;
}
