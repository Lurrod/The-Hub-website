import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { recordHit } from "./record";
import { getDb } from "@/lib/db/client";

let mem: MongoMemoryServer;

beforeAll(async () => {
  mem = await MongoMemoryServer.create();
  process.env.MONGO_URL = mem.getUri();
});

afterAll(async () => {
  await mem.stop();
});

describe("recordHit", () => {
  it("increments page views on every hit", async () => {
    await recordHit({ ip: "1.1.1.1", userAgent: "UA", day: "2026-01-01" });
    await recordHit({ ip: "2.2.2.2", userAgent: "UA", day: "2026-01-01" });
    const db = await getDb();
    const doc = await db
      .collection<{ _id: string; pageviews: number }>("analytics_daily")
      .findOne({ _id: "2026-01-01" });
    expect(doc?.pageviews).toBe(2);
  });

  it("counts the same visitor once per day", async () => {
    await recordHit({ ip: "3.3.3.3", userAgent: "UA", day: "2026-02-01" });
    await recordHit({ ip: "3.3.3.3", userAgent: "UA", day: "2026-02-01" });
    const db = await getDb();
    const visitors = await db
      .collection("analytics_visitors")
      .countDocuments({ day: "2026-02-01" });
    expect(visitors).toBe(1);
  });

  it("counts distinct visitors separately", async () => {
    await recordHit({ ip: "4.4.4.4", userAgent: "UA", day: "2026-03-01" });
    await recordHit({ ip: "5.5.5.5", userAgent: "UA", day: "2026-03-01" });
    const db = await getDb();
    const visitors = await db
      .collection("analytics_visitors")
      .countDocuments({ day: "2026-03-01" });
    expect(visitors).toBe(2);
  });

  it("defaults to today's bucket when no day is given", async () => {
    const today = new Date().toISOString().slice(0, 10);
    await recordHit({ ip: "7.7.7.7", userAgent: "UA" });
    const db = await getDb();
    const doc = await db
      .collection<{ _id: string; pageviews: number }>("analytics_daily")
      .findOne({ _id: today });
    expect(doc?.pageviews ?? 0).toBeGreaterThanOrEqual(1);
  });
});
