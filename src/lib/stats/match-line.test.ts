import { describe, it, expect } from "vitest";
import { buildMatchLine, relativeTime } from "./match-line";
import type { MatchPlayerStat } from "@/lib/db/match-types";

const stat: MatchPlayerStat = {
  _id: "deadbeef:1", match_id: "deadbeef", user_id: "1", queue_type: "pro",
  map: "Ascent", agent: "Jett", rounds_played: 24, win: true,
  kills: 24, deaths: 15, assists: 6, damage_made: 4344, damage_received: 4000,
  headshots: 30, bodyshots: 60, legshots: 10, first_kills: 4, first_deaths: 2,
  kast_rounds: 18, acs: 281, rating_2_0: 1.41, created_at: new Date("2026-06-08T10:00:00Z"),
};

describe("buildMatchLine", () => {
  it("derives per-match line fields", () => {
    const l = buildMatchLine(stat);
    expect(l.matchId).toBe("deadbeef");
    expect(l.agent).toBe("Jett");
    expect(l.map).toBe("Ascent");
    expect(l.win).toBe(true);
    expect(l.rating).toBeCloseTo(1.41, 5);
    expect(l.acs).toBe(281);
    expect(l.kills).toBe(24);
    expect(l.adr).toBeCloseTo(4344 / 24, 5);
    expect(l.hsPct).toBeCloseTo(30, 5);
    expect(l.kastPct).toBeCloseTo(75, 5);
  });

  it("guards zero rounds/shots", () => {
    const l = buildMatchLine({ ...stat, rounds_played: 0, headshots: 0, bodyshots: 0, legshots: 0 });
    expect(l.adr).toBeNull();
    expect(l.kastPct).toBeNull();
    expect(l.hsPct).toBeNull();
  });
});

describe("relativeTime", () => {
  const now = new Date("2026-06-08T12:00:00Z");
  it("formats minutes, hours, days", () => {
    expect(relativeTime(new Date("2026-06-08T11:30:00Z"), now)).toBe("30m ago");
    expect(relativeTime(new Date("2026-06-08T09:00:00Z"), now)).toBe("3h ago");
    expect(relativeTime(new Date("2026-06-06T12:00:00Z"), now)).toBe("2d ago");
  });
  it("handles just now", () => {
    expect(relativeTime(new Date("2026-06-08T11:59:30Z"), now)).toBe("just now");
  });
});
