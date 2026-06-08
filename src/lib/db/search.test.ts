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
  await db.collection("elo").insertMany([
    { _id: "1:pro", user_id: "1", queue_type: "pro", elo: 2300, wins: 0, losses: 0, name: "Zephyr" },
    { _id: "1:open", user_id: "1", queue_type: "open", elo: 2000, wins: 0, losses: 0, name: "Zephyr" },
    { _id: "2:pro", user_id: "2", queue_type: "pro", elo: 2100, wins: 0, losses: 0, name: "Zenith" },
    { _id: "3:pro", user_id: "3", queue_type: "pro", elo: 1900, wins: 0, losses: 0, name: "Nova" },
  ] as unknown as Document[]);
});

afterAll(async () => { await client.close(); await mem.stop(); });

describe("searchPlayers", () => {
  it("finds players by case-insensitive name prefix, de-duped by user", async () => {
    const { searchPlayers } = await import("./search");
    const res = await searchPlayers("ze");
    expect(res.map((r) => r.name).sort()).toEqual(["Zenith", "Zephyr"]);
    expect(res.filter((r) => r.userId === "1")).toHaveLength(1);
  });

  it("returns [] for blank queries and escapes regex metacharacters", async () => {
    const { searchPlayers } = await import("./search");
    expect(await searchPlayers("  ")).toEqual([]);
    expect(await searchPlayers("(")).toEqual([]);
  });
});
