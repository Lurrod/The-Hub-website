import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import type { WebProfile } from "./types";

let mem: MongoMemoryServer;
let client: MongoClient;

beforeAll(async () => {
  mem = await MongoMemoryServer.create();
  process.env.MONGO_URL = mem.getUri();
  client = await new MongoClient(mem.getUri()).connect();
});
afterAll(async () => { await client.close(); await mem.stop(); });

describe("updateWebProfile", () => {
  it("upserts the profile for the user id, stores identity, and is idempotent", async () => {
    const { updateWebProfile } = await import("./profile-write");
    await updateWebProfile(
      "42",
      { bio: "hello", favorite_role: "Duelist", nationality: "FR", socials: { twitch: "z" }, vlr_url: "", tracker_url: "" },
      { username: "Zephyr", avatar: "abc" },
    );
    const db = client.db("elobot");
    const doc = await db.collection<WebProfile & { discord_username?: string; discord_avatar?: string | null }>("web_profiles").findOne({ _id: "42" });
    expect(doc?.bio).toBe("hello");
    expect(doc?.favorite_role).toBe("Duelist");
    expect(doc?.nationality).toBe("FR");
    expect(doc?.socials?.twitch).toBe("z");
    expect(doc?.discord_username).toBe("Zephyr");
    expect(doc?.discord_avatar).toBe("abc");

    await updateWebProfile(
      "42",
      { bio: "updated", favorite_role: "", nationality: "", socials: {}, vlr_url: "", tracker_url: "" },
      { username: "Zephyr", avatar: "abc" },
    );
    const doc2 = await db.collection<WebProfile & { discord_username?: string; discord_avatar?: string | null }>("web_profiles").findOne({ _id: "42" });
    expect(doc2?.bio).toBe("updated");
    expect(doc2?.favorite_role).toBe("");
    expect(doc2?.nationality).toBe("");
  });
});

describe("syncDiscordIdentity", () => {
  type IdDoc = WebProfile & { discord_username?: string; discord_avatar?: string | null };

  it("refreshes avatar/username on existing profiles without touching other fields", async () => {
    const { updateWebProfile, syncDiscordIdentity } = await import("./profile-write");
    const db = client.db("elobot");
    await updateWebProfile(
      "77",
      { bio: "keep me", favorite_role: "Sentinel", nationality: "CA", socials: { twitch: "tw" }, vlr_url: "v", tracker_url: "t" },
      { username: "OldName", avatar: "oldhash" },
    );

    await syncDiscordIdentity("77", { username: "NewName", avatar: "newhash" });

    const doc = await db.collection<IdDoc>("web_profiles").findOne({ _id: "77" });
    // identity refreshed
    expect(doc?.discord_username).toBe("NewName");
    expect(doc?.discord_avatar).toBe("newhash");
    // everything else preserved
    expect(doc?.bio).toBe("keep me");
    expect(doc?.favorite_role).toBe("Sentinel");
    expect(doc?.nationality).toBe("CA");
    expect(doc?.socials?.twitch).toBe("tw");
  });

  it("upserts an identity-only doc for a first-time login", async () => {
    const { syncDiscordIdentity } = await import("./profile-write");
    const db = client.db("elobot");
    await syncDiscordIdentity("99", { username: "Fresh", avatar: "h99" });
    const doc = await db.collection<IdDoc>("web_profiles").findOne({ _id: "99" });
    expect(doc?.discord_username).toBe("Fresh");
    expect(doc?.discord_avatar).toBe("h99");
    expect(doc?.bio).toBeUndefined();
  });

  it("is a no-op for an empty user id", async () => {
    const { syncDiscordIdentity } = await import("./profile-write");
    const db = client.db("elobot");
    await syncDiscordIdentity("", { username: "Nobody", avatar: "x" });
    const doc = await db.collection<IdDoc>("web_profiles").findOne({ _id: "" });
    expect(doc).toBeNull();
  });
});
