import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, ObjectId, type Document } from "mongodb";

let mem: MongoMemoryServer;
let client: MongoClient;
const MID = new ObjectId("0123456789abcdef01234567");
const hex = MID.toHexString();
// validated_b, older match with no score_a/score_b and no elo_results.
const MID2 = new ObjectId("0123456789abcdef0123bb02");
const hex2 = MID2.toHexString();
// non-validated (contested) match -> winner should resolve to null.
const MID3 = new ObjectId("0123456789abcdef0123cc03");
const hex3 = MID3.toHexString();

function pstat(uid: string, over: Record<string, unknown>) {
  return {
    _id: `${hex}:${uid}`, match_id: hex, user_id: uid, queue_type: "pro",
    map: "Ascent", agent: "Jett", rounds_played: 22, win: true,
    kills: 20, deaths: 14, assists: 5, damage_made: 3300, damage_received: 3000,
    headshots: 40, bodyshots: 60, legshots: 10, first_kills: 3, first_deaths: 2,
    kast_rounds: 17, acs: 250, rating_2_0: 1.2, created_at: new Date("2026-06-08T10:00:00Z"),
    ...over,
  };
}

beforeAll(async () => {
  mem = await MongoMemoryServer.create();
  process.env.MONGO_URL = mem.getUri();
  client = await new MongoClient(mem.getUri()).connect();
  const db = client.db("elobot");
  await db.collection("matches").insertOne({
    _id: MID, queue_type: "pro", map: "Ascent", status: "validated_a", match_number: 42,
    created_at: new Date("2026-06-08T10:00:00Z"),
    team_a: [{ id: "1", name: "Alpha" }, { id: "2", name: "Bravo" }],
    team_b: [{ id: "3", name: "Charlie" }, { id: "4", name: "Delta" }],
    score_a: 13, score_b: 9,
    elo_results: { "1": { delta: 22, old: 2000, new: 2022, win: true }, "3": { delta: -18, old: 2100, new: 2082, win: false } },
  } as unknown as Document);
  await db.collection("match_player_stats").insertMany([
    pstat("1", { win: true }), pstat("2", { win: true }),
    pstat("3", { win: false }), pstat("4", { win: false }),
  ] as unknown as Document[]);

  // Older match: validated_b, no score / no elo_results.
  await db.collection("matches").insertOne({
    _id: MID2, queue_type: "pro", map: "Bind", status: "validated_b", match_number: 7,
    created_at: new Date("2026-06-07T10:00:00Z"),
    team_a: [{ id: "5", name: "Echo" }], team_b: [{ id: "6", name: "Foxtrot" }],
  } as unknown as Document);
  await db.collection("match_player_stats").insertMany([
    pstat("5", { _id: `${hex2}:5`, match_id: hex2, map: "Bind", win: false }),
    pstat("6", { _id: `${hex2}:6`, match_id: hex2, map: "Bind", win: true }),
  ] as unknown as Document[]);

  // Non-validated match (no winner).
  await db.collection("matches").insertOne({
    _id: MID3, queue_type: "open", map: "Split", status: "contested", match_number: 8,
    created_at: new Date("2026-06-07T09:00:00Z"),
    team_a: [{ id: "7" }], team_b: [{ id: "8" }],
  } as unknown as Document);
});

afterAll(async () => { await client.close(); await mem.stop(); });

describe("getPlayerMatchHistory", () => {
  it("returns recent lines with eloDelta and score from the parent match", async () => {
    const { getPlayerMatchHistory } = await import("./matches");
    const rows = await getPlayerMatchHistory("1", { limit: 10 });
    expect(rows).toHaveLength(1);
    expect(rows[0].matchId).toBe(hex);
    expect(rows[0].agent).toBe("Jett");
    expect(rows[0].eloDelta).toBe(22);
    expect(rows[0].scoreLine).toBe("13-9");
  });

  it("omits eloDelta when the player has no result on the match", async () => {
    const { getPlayerMatchHistory } = await import("./matches");
    const rows = await getPlayerMatchHistory("2", { limit: 10 });
    expect(rows[0].eloDelta).toBeNull();
    expect(rows[0].scoreLine).toBe("13-9");
  });
});

describe("getMatchDetail", () => {
  it("returns the match and both teams' player lines", async () => {
    const { getMatchDetail } = await import("./matches");
    const d = await getMatchDetail(hex);
    expect(d).not.toBeNull();
    expect(d!.matchNumber).toBe(42);
    expect(d!.scoreA).toBe(13);
    expect(d!.scoreB).toBe(9);
    expect(d!.teamA.map((p) => p.userId).sort()).toEqual(["1", "2"]);
    expect(d!.teamB.map((p) => p.userId).sort()).toEqual(["3", "4"]);
    const a1 = d!.teamA.find((p) => p.userId === "1")!;
    expect(a1.name).toBe("Alpha");
    expect(a1.eloDelta).toBe(22);
  });

  it("returns null for a bad id or missing match", async () => {
    const { getMatchDetail } = await import("./matches");
    expect(await getMatchDetail("not-an-objectid")).toBeNull();
    expect(await getMatchDetail("0123456789abcdef0123dead")).toBeNull();
  });

  it("resolves winner='b' and null score/eloDelta for an older validated_b match", async () => {
    const { getMatchDetail } = await import("./matches");
    const d = await getMatchDetail(hex2);
    expect(d).not.toBeNull();
    expect(d!.winner).toBe("b");
    expect(d!.scoreA).toBeNull();
    expect(d!.scoreB).toBeNull();
    expect(d!.teamA.map((p) => p.userId)).toEqual(["5"]);
    expect(d!.teamA.find((p) => p.userId === "5")!.eloDelta).toBeNull();
  });

  it("resolves winner=null for a non-validated match", async () => {
    const { getMatchDetail } = await import("./matches");
    const d = await getMatchDetail(hex3);
    expect(d).not.toBeNull();
    expect(d!.winner).toBeNull();
  });
});

describe("getPlayerMatchHistory — absent score/elo_results", () => {
  it("returns null eloDelta and null scoreLine when the parent match lacks them", async () => {
    const { getPlayerMatchHistory } = await import("./matches");
    const rows = await getPlayerMatchHistory("5", { limit: 10 });
    expect(rows).toHaveLength(1);
    expect(rows[0].eloDelta).toBeNull();
    expect(rows[0].scoreLine).toBeNull();
  });
});
