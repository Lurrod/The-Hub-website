import type { PlayerStatLine } from "./derive";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** Active players (updated within 7 days of `now`) sorted by ELO desc. */
export function rankLeaderboard(
  lines: PlayerStatLine[],
  now: Date = new Date(),
): PlayerStatLine[] {
  const cutoff = now.getTime() - SEVEN_DAYS_MS;
  return lines
    .filter((l) => l.updatedAt.getTime() >= cutoff)
    .sort((a, b) => b.elo - a.elo);
}
