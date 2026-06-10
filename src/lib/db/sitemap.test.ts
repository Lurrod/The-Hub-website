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
const idNoDate = new ObjectId();

beforeAll(async () => {
  mem = await MongoMemoryServer.create();
  process.env.MONGO_URL = mem.getUri();
  client = await new MongoClient(mem.getUri()).connect();
  const db = client.db("elobot");
  await db.collection("player_rating_aggregates").insertMany([
    { _id: "1:pro", user_id: "1", queue_type: "pro", updated_at: OLD },
    { _id: "1:open", user_id: "1", queue_type: "open", updated_at: NEW },
    { _id: "2:pro", user_id: "2", queue_type: "pro", updated_at: OLD },
    // 3: newer queue seen first, older second -> keeps NEW (current > prev false)
    { _id: "3:pro", user_id: "3", queue_type: "pro", updated_at: NEW },
    { _id: "3:open", user_id: "3", queue_type: "open", updated_at: OLD },
    // 4: first queue has no date, second does -> adopts NEW (!prev true)
    { _id: "4:pro", user_id: "4", queue_type: "pro", updated_at: null },
    { _id: "4:open", user_id: "4", queue_type: "open", updated_at: NEW },
    // 5: dated first, undated second -> keeps NEW (current falsy)
    { _id: "5:pro", user_id: "5", queue_type: "pro", updated_at: NEW },
    { _id: "5:open", user_id: "5", queue_type: "open", updated_at: null },
  ] as unknown as Document[]);
  await db.collection("matches").insertMany([
    { _id: idA, status: "validated_a", created_at: NEW },
    { _id: idB, status: "validated_b", created_at: OLD },
    { _id: idPending, status: "ongoing", created_at: NEW },
    // validated but no created_at -> createdAt falls back to null
    { _id: idNoDate, status: "validated_a", created_at: null },
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
    expect(players).toHaveLength(5);
    const p1 = players.find((p) => p.userId === "1");
    expect(p1?.updatedAt?.toISOString()).toBe(NEW.toISOString());
    const p2 = players.find((p) => p.userId === "2");
    expect(p2?.updatedAt?.toISOString()).toBe(OLD.toISOString());
  });

  it("keeps the newest date regardless of queue order and tolerates missing dates", async () => {
    const { getSitemapEntries } = await import("./sitemap");
    const { players } = await getSitemapEntries();
    const at = (id: string) => players.find((p) => p.userId === id)?.updatedAt;
    // newest-first then older: newest wins
    expect(at("3")?.toISOString()).toBe(NEW.toISOString());
    // first queue undated, second dated: adopts the date
    expect(at("4")?.toISOString()).toBe(NEW.toISOString());
    // dated first, undated second: keeps the date
    expect(at("5")?.toISOString()).toBe(NEW.toISOString());
  });

  it("returns only validated matches, newest first, as hex ids", async () => {
    const { getSitemapEntries } = await import("./sitemap");
    const { matches } = await getSitemapEntries();
    expect(matches.map((m) => m.matchId)).toEqual([
      idA.toHexString(),
      idB.toHexString(),
      idNoDate.toHexString(),
    ]);
    expect(matches[0].createdAt?.toISOString()).toBe(NEW.toISOString());
    // validated match without a created_at surfaces with null
    expect(matches[2].createdAt).toBeNull();
  });
});
