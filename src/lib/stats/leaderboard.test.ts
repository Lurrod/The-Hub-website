import { describe, it, expect } from "vitest";
import { rankLeaderboard } from "./leaderboard";
import type { PlayerStatLine } from "./derive";

function line(over: Partial<PlayerStatLine>): PlayerStatLine {
  return {
    userId: "x", queueType: "pro", name: "X", games: 10,
    rating: 1, acs: 200, adr: 100, kd: 1, kastPct: 70, kpr: 0.8, apr: 0.3,
    fkpr: 0.1, fdpr: 0.1, hsPct: 25, elo: 2000, wins: 5, losses: 5,
    updatedAt: new Date(), ...over,
  };
}

describe("rankLeaderboard", () => {
  const now = new Date("2026-06-08T12:00:00Z");

  it("sorts by ELO desc and hides players inactive > 7 days", () => {
    const lines = [
      line({ name: "Old", elo: 9999, updatedAt: new Date("2026-05-01T00:00:00Z") }),
      line({ name: "Top", elo: 2300, updatedAt: new Date("2026-06-07T00:00:00Z") }),
      line({ name: "Mid", elo: 2100, updatedAt: new Date("2026-06-06T00:00:00Z") }),
    ];
    const ranked = rankLeaderboard(lines, now);
    expect(ranked.map((l) => l.name)).toEqual(["Top", "Mid"]);
  });

  it("keeps a player active exactly within 7 days", () => {
    const lines = [line({ name: "Edge", updatedAt: new Date("2026-06-01T12:00:00Z") })];
    expect(rankLeaderboard(lines, now)).toHaveLength(1);
  });
});
