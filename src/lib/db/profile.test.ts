import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, type Document } from "mongodb";

let mem: MongoMemoryServer;
let client: MongoClient;

beforeAll(async () => {
  mem = await MongoMemoryServer.create();
  process.env.MONGO_URL = mem.getUri();
  client = await new MongoClient(mem.getUri()).connect();
  const db = client.db("elobot");
  const base = {
    rounds_played: 200, kills: 180, deaths: 160, assists: 60, damage_made: 30000,
    damage_received: 28000, headshots: 90, bodyshots: 180, legshots: 30,
    multikills_2k: 0, multikills_3k: 0, multikills_4k: 0, multikills_5k: 0,
    first_kills: 24, first_deaths: 18, kast_rounds: 150, updated_at: new Date(),
  };
  await db.collection("player_rating_aggregates").insertMany([
    { _id: "1:pro", user_id: "1", queue_type: "pro", games: 20, rating_2_0_sum: 24, ...base },
    { _id: "1:open", user_id: "1", queue_type: "open", games: 10, rating_2_0_sum: 9, ...base },
  ] as unknown as Document[]);
  await db.collection("elo").insertMany([
    { _id: "1:pro", user_id: "1", queue_type: "pro", elo: 2300, wins: 12, losses: 8, name: "Alpha" },
    { _id: "1:open", user_id: "1", queue_type: "open", elo: 2000, wins: 6, losses: 4, name: "Alpha" },
  ] as unknown as Document[]);
  await db.collection("web_profiles").insertOne({
    _id: "1", bio: "gg", favorite_agent: "Jett", socials: { twitch: "alpha" },
  } as unknown as Document);
});

afterAll(async () => { await client.close(); await mem.stop(); });

describe("getPlayerProfile", () => {
  it("returns name, per-queue stat lines and web profile", async () => {
    const { getPlayerProfile } = await import("./profile");
    const p = await getPlayerProfile("1");
    expect(p).not.toBeNull();
    expect(p!.name).toBe("Alpha");
    expect(p!.queues.map((q) => q.queueType).sort()).toEqual(["open", "pro"]);
    const pro = p!.queues.find((q) => q.queueType === "pro")!;
    expect(pro.elo).toBe(2300);
    expect(pro.rating).toBeCloseTo(24 / 20, 5);
    expect(p!.webProfile?.bio).toBe("gg");
  });

  it("returns null for an unknown player", async () => {
    const { getPlayerProfile } = await import("./profile");
    expect(await getPlayerProfile("999")).toBeNull();
  });
});
