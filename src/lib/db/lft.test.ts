import { describe, it, expect } from "vitest";
import { buildLftQuery } from "./lft";

const NOW = new Date(Date.UTC(2026, 5, 12));

describe("buildLftQuery", () => {
  it("always requires lft_enabled true", () => {
    expect(buildLftQuery({}, NOW)).toEqual({ lft_enabled: true });
  });
  it("adds an $in for roles", () => {
    expect(buildLftQuery({ roles: ["Duelist", "Flex"] }, NOW)).toEqual({
      lft_enabled: true,
      roles: { $in: ["Duelist", "Flex"] },
    });
  });
  it("ignores an empty roles array", () => {
    expect(buildLftQuery({ roles: [] }, NOW)).toEqual({ lft_enabled: true });
  });
  it("adds nationality only for a known country code", () => {
    expect(buildLftQuery({ nationality: "FR" }, NOW)).toEqual({
      lft_enabled: true,
      nationality: "FR",
    });
    expect(buildLftQuery({ nationality: "ZZ" }, NOW)).toEqual({ lft_enabled: true });
  });
  it("translates an age range into a date_of_birth window", () => {
    expect(buildLftQuery({ minAge: 18, maxAge: 25 }, NOW)).toEqual({
      lft_enabled: true,
      date_of_birth: { $gte: "2000-06-13", $lte: "2008-06-12" },
    });
  });
  it("escapes and case-insensitively matches a name query", () => {
    const q = buildLftQuery({ query: "a.b" }, NOW) as {
      discord_username: { $regex: string; $options: string };
    };
    expect(q.discord_username.$regex).toBe("a\\.b");
    expect(q.discord_username.$options).toBe("i");
  });
  it("ignores a blank name query", () => {
    expect(buildLftQuery({ query: "   " }, NOW)).toEqual({ lft_enabled: true });
  });
});
