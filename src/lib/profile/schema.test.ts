import { describe, it, expect } from "vitest";
import { profileSchema, ROLES } from "./schema";

const ok = {
  bio: "gg wp",
  favorite_role: "Duelist",
  favorite_agent: "Jett",
  twitch: "zephyr",
  twitter: "zephyr",
  youtube: "https://youtube.com/@zephyr",
  vlr_url: "https://vlr.gg/player/123/zephyr",
  tracker_url: "https://tracker.gg/valorant/profile/riot/x%23y/overview",
};

describe("profileSchema", () => {
  it("accepts valid input", () => {
    expect(profileSchema.safeParse(ok).success).toBe(true);
  });
  it("rejects an over-long bio", () => {
    expect(profileSchema.safeParse({ ...ok, bio: "x".repeat(281) }).success).toBe(false);
  });
  it("rejects an unknown role", () => {
    expect(profileSchema.safeParse({ ...ok, favorite_role: "Flex" }).success).toBe(false);
  });
  it("rejects off-domain vlr_url / tracker_url", () => {
    expect(profileSchema.safeParse({ ...ok, vlr_url: "https://evil.com" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...ok, tracker_url: "https://evil.com" }).success).toBe(false);
  });
  it("rejects a non-youtube youtube link", () => {
    expect(profileSchema.safeParse({ ...ok, youtube: "https://evil.com" }).success).toBe(false);
  });
  it("allows all-empty optional fields", () => {
    expect(profileSchema.safeParse({ favorite_role: "", favorite_agent: "", bio: "", twitch: "", twitter: "", youtube: "", vlr_url: "", tracker_url: "" }).success).toBe(true);
  });
  it("exposes the four roles", () => {
    expect(ROLES).toEqual(["Duelist", "Initiator", "Controller", "Sentinel"]);
  });
});
