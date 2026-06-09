import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, ObjectId, type Document } from "mongodb";

let mem: MongoMemoryServer;
let client: MongoClient;

const OLD = new Date("2026-01-01T00:00:00Z");
const NEW = new Date("2026-06-01T00:00:00Z");

const idA = new ObjectId();
const idB = new ObjectId();
const idPending = new ObjectId();

beforeAll(async () => {
  mem = await MongoMemoryServer.create();
  process.env.MONGO_URL = mem.getUri();
  client = await new MongoClient(mem.getUri()).connect();
  const db = client.db("elobot");
  await db.collection("player_rating_aggregates").insertMany([
    { _id: "1:pro", user_id: "1", queue_type: "pro", updated_at: OLD },
    { _id: "1:open", user_id: "1", queue_type: "open", updated_at: NEW },
    { _id: "2:pro", user_id: "2", queue_type: "pro", updated_at: OLD },
  ] as unknown as Document[]);
  await db.collection("matches").insertMany([
    { _id: idA, status: "validated_a", created_at: NEW },
    { _id: idB, status: "validated_b", created_at: OLD },
    { _id: idPending, status: "ongoing", created_at: NEW },
  ] as unknown as Document[]);
});

afterAll(async () => {
  await client.close();
  await mem.stop();
});

describe("getSitemapEntries", () => {
  it("returns one entry per player with the most recent updated_at across queues", async () => {
    const { getSitemapEntries } = await import("./sitemap");
    const { players } = await getSitemapEntries();
    expect(players).toHaveLength(2);
    const p1 = players.find((p) => p.userId === "1");
    expect(p1?.updatedAt?.toISOString()).toBe(NEW.toISOString());
    const p2 = players.find((p) => p.userId === "2");
    expect(p2?.updatedAt?.toISOString()).toBe(OLD.toISOString());
  });

  it("returns only validated matches, newest first, as hex ids", async () => {
    const { getSitemapEntries } = await import("./sitemap");
    const { matches } = await getSitemapEntries();
    expect(matches.map((m) => m.matchId)).toEqual([idA.toHexString(), idB.toHexString()]);
    expect(matches[0].createdAt?.toISOString()).toBe(NEW.toISOString());
  });
});
