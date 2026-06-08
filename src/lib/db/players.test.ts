import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, type Document } from "mongodb";
import type { RatingAggregate, EloDoc } from "./types";

let mem: MongoMemoryServer;
let client: MongoClient;

function agg(id: string, over: Partial<RatingAggregate>): RatingAggregate {
  return {
    _id: id,
    user_id: id.split(":")[0],
    queue_type: "pro",
    games: 12,
    rounds_played: 200,
    kills: 180,
    deaths: 160,
    assists: 60,
    damage_made: 30000,
    damage_received: 28000,
    headshots: 90,
    bodyshots: 180,
    legshots: 30,
    multikills_2k: 0,
    multikills_3k: 0,
    multikills_4k: 0,
    multikills_5k: 0,
    first_kills: 24,
    first_deaths: 18,
    kast_rounds: 150,
    rating_2_0_sum: 12,
    updated_at: new Date(),
    ...over,
  };
}
function elo(id: string, over: Partial<EloDoc>): EloDoc {
  return {
    _id: id,
    user_id: id.split(":")[0],
    queue_type: "pro",
    elo: 2000,
    wins: 6,
    losses: 6,
    name: "P" + id.split(":")[0],
    ...over,
  };
}

beforeAll(async () => {
  mem = await MongoMemoryServer.create();
  process.env.MONGO_URL = mem.getUri();
  client = await new MongoClient(mem.getUri()).connect();
  const db = client.db("elobot");
  await db.collection("player_rating_aggregates").insertMany([
    agg("1:pro", { rating_2_0_sum: 14, games: 12 }),
    agg("2:pro", { rating_2_0_sum: 9, games: 12 }),
    agg("3:pro", { games: 3, rating_2_0_sum: 4 }),
    agg("4:semipro", { queue_type: "semipro", _id: "4:semipro" }),
  ] as unknown as Document[]);
  await db.collection("elo").insertMany([
    elo("1:pro", { elo: 2300, name: "Alpha" }),
    elo("2:pro", { elo: 2100, name: "Bravo" }),
    elo("3:pro", { elo: 1900, name: "Charlie" }),
    elo("4:semipro", { queue_type: "semipro", _id: "4:semipro", name: "Delta" }),
  ] as unknown as Document[]);
});

afterAll(async () => {
  await client.close();
  await mem.stop();
});

describe("getQueueStatLines", () => {
  it("returns joined lines for the queue, filtered by minGames, sorted by rating desc", async () => {
    const { getQueueStatLines } = await import("./players");
    const lines = await getQueueStatLines("pro", { minGames: 10 });
    expect(lines.map((l) => l.name)).toEqual(["Alpha", "Bravo"]);
    expect(lines[0].rating).toBeCloseTo(14 / 12, 5);
    expect(lines[0].elo).toBe(2300);
  });

  it("scopes to the requested queue only", async () => {
    const { getQueueStatLines } = await import("./players");
    const lines = await getQueueStatLines("semipro", { minGames: 0 });
    expect(lines.map((l) => l.name)).toEqual(["Delta"]);
  });

  it("returns [] when no aggregates match", async () => {
    const { getQueueStatLines } = await import("./players");
    const lines = await getQueueStatLines("gc", { minGames: 0 });
    expect(lines).toEqual([]);
  });
});
