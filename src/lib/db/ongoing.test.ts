import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, ObjectId, type Document } from "mongodb";

let mem: MongoMemoryServer;
let client: MongoClient;

function match(id: ObjectId, status: string, num: number, createdAt: Date) {
  return {
    _id: id, queue_type: "pro", map: "Ascent", status, match_number: num, created_at: createdAt,
    team_a: [{ id: "1", name: "Alpha", elo: 2300 }, { id: "2", name: "Bravo", elo: 2100 }],
    team_b: [{ id: "3", name: "Charlie", elo: 1950 }, { id: "4", name: "Delta" }],
  };
}

const PENDING = new ObjectId("0123456789abcdef0000a001");
const CONTESTED = new ObjectId("0123456789abcdef0000a002");
const VALIDATED = new ObjectId("0123456789abcdef0000a003");

beforeAll(async () => {
  mem = await MongoMemoryServer.create();
  process.env.MONGO_URL = mem.getUri();
  client = await new MongoClient(mem.getUri()).connect();
  const db = client.db("elobot");
  await db.collection("matches").insertMany([
    match(PENDING, "pending", 10, new Date("2026-06-08T10:00:00Z")),
    match(CONTESTED, "contested", 11, new Date("2026-06-08T11:00:00Z")),
    match(VALIDATED, "validated_a", 9, new Date("2026-06-08T09:00:00Z")),
  ] as unknown as Document[]);
});

afterAll(async () => { await client.close(); await mem.stop(); });

describe("getOngoingMatches", () => {
  it("returns only pending/contested matches, newest first", async () => {
    const { getOngoingMatches } = await import("./ongoing");
    const rows = await getOngoingMatches();
    expect(rows.map((r) => r.status)).toEqual(["contested", "pending"]); // sorted by created_at desc
    expect(rows.map((r) => r.matchNumber)).toEqual([11, 10]);
  });

  it("maps teams to id/name pairs", async () => {
    const { getOngoingMatches } = await import("./ongoing");
    const rows = await getOngoingMatches();
    const pending = rows.find((r) => r.matchNumber === 10)!;
    expect(pending.teamA.map((p) => p.name)).toEqual(["Alpha", "Bravo"]);
    expect(pending.teamB.map((p) => p.id)).toEqual(["3", "4"]);
    expect(pending.teamA[0].elo).toBe(2300);
    expect(pending.teamB[1].elo).toBeNull(); // Delta has no elo in the doc
    expect(pending.matchId).toBe(PENDING.toHexString());
    expect(pending.map).toBe("Ascent");
  });
});

describe("getRecentMatches", () => {
  it("returns only validated matches with a resolved winner, newest first", async () => {
    const { getRecentMatches } = await import("./ongoing");
    const rows = await getRecentMatches();
    expect(rows.map((r) => r.matchNumber)).toEqual([9]); // only the validated_a match
    expect(rows[0].winner).toBe("a");
    expect(rows[0].teamA.map((p) => p.name)).toEqual(["Alpha", "Bravo"]);
  });
});
