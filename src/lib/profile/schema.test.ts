import { describe, it, expect } from "vitest";
import { profileSchema, ROLES } from "./schema";

const ok = {
  bio: "gg wp",
  roles: ["Duelist", "Flex"],
  nationality: "FR",
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
    expect(profileSchema.safeParse({ ...ok, roles: ["Wizard"] }).success).toBe(false);
  });
  it("accepts multiple roles including Flex and dedupes", () => {
    const r = profileSchema.safeParse({ ...ok, roles: ["Duelist", "Duelist", "Flex"] });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.roles).toEqual(["Duelist", "Flex"]);
  });
  it("accepts a known nationality and rejects an unknown one", () => {
    expect(profileSchema.safeParse({ ...ok, nationality: "JP" }).success).toBe(true);
    expect(profileSchema.safeParse({ ...ok, nationality: "ZZ" }).success).toBe(false);
  });
  it("rejects off-domain vlr_url / tracker_url", () => {
    expect(profileSchema.safeParse({ ...ok, vlr_url: "https://evil.com" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...ok, tracker_url: "https://evil.com" }).success).toBe(false);
  });
  it("rejects a non-youtube youtube link", () => {
    expect(profileSchema.safeParse({ ...ok, youtube: "https://evil.com" }).success).toBe(false);
  });
  it("allows all-empty optional fields", () => {
    expect(profileSchema.safeParse({ roles: [], nationality: "", bio: "", twitch: "", twitter: "", youtube: "", vlr_url: "", tracker_url: "" }).success).toBe(true);
  });
  it("defaults roles to an empty array when omitted", () => {
    const r = profileSchema.safeParse({ nationality: "", bio: "", twitch: "", twitter: "", youtube: "", vlr_url: "", tracker_url: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.roles).toEqual([]);
  });
  it("exposes the five roles including Flex", () => {
    expect(ROLES).toEqual(["Duelist", "Initiator", "Controller", "Sentinel", "Flex"]);
  });
});
