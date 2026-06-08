import { describe, it, expect } from "vitest";
import { safeDiv, buildStatLine } from "./derive";
import type { RatingAggregate, EloDoc } from "@/lib/db/types";

const agg: RatingAggregate = {
  _id: "1:pro",
  user_id: "1",
  queue_type: "pro",
  games: 10,
  rounds_played: 200,
  kills: 180,
  deaths: 160,
  assists: 60,
  damage_made: 30000,
  damage_received: 28000,
  headshots: 90,
  bodyshots: 180,
  legshots: 30,
  multikills_2k: 12,
  multikills_3k: 3,
  multikills_4k: 1,
  multikills_5k: 0,
  first_kills: 24,
  first_deaths: 18,
  kast_rounds: 150,
  rating_2_0_sum: 11.5,
  acs_sum: 2810,
  updated_at: new Date("2026-06-01T00:00:00Z"),
};

const elo: EloDoc = {
  _id: "1:pro",
  user_id: "1",
  queue_type: "pro",
  elo: 2200,
  wins: 6,
  losses: 4,
  name: "Zephyr",
};

describe("safeDiv", () => {
  it("divides", () => expect(safeDiv(10, 2)).toBe(5));
  it("returns null on zero denominator", () => expect(safeDiv(10, 0)).toBeNull());
});

describe("buildStatLine", () => {
  it("computes all derived stats", () => {
    const s = buildStatLine(agg, elo);
    expect(s.userId).toBe("1");
    expect(s.name).toBe("Zephyr");
    expect(s.games).toBe(10);
    expect(s.elo).toBe(2200);
    expect(s.rating).toBeCloseTo(1.15, 5);
    expect(s.acs).toBeCloseTo(281, 5);
    expect(s.adr).toBeCloseTo(150, 5);
    expect(s.kd).toBeCloseTo(1.125, 5);
    expect(s.kastPct).toBeCloseTo(75, 5);
    expect(s.kpr).toBeCloseTo(0.9, 5);
    expect(s.apr).toBeCloseTo(0.3, 5);
    expect(s.fkpr).toBeCloseTo(0.12, 5);
    expect(s.fdpr).toBeCloseTo(0.09, 5);
    expect(s.hsPct).toBeCloseTo(30, 5); // 90 / (90+180+30)
    expect(s.updatedAt).toEqual(new Date("2026-06-01T00:00:00Z"));
  });

  it("returns null derived stats when rounds/games/shots are zero", () => {
    const empty: RatingAggregate = {
      ...agg,
      games: 0,
      rounds_played: 0,
      deaths: 0,
      headshots: 0,
      bodyshots: 0,
      legshots: 0,
    };
    const s = buildStatLine(empty, elo);
    expect(s.rating).toBeNull();
    expect(s.acs).toBeNull();
    expect(s.adr).toBeNull();
    expect(s.kd).toBeNull();
    expect(s.kastPct).toBeNull();
    expect(s.hsPct).toBeNull();
  });
});
