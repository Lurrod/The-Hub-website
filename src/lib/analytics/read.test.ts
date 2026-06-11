import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { readDashboard } from "./read";
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

describe("readDashboard", () => {
  it("reports registered, active, visitor and page-view totals", async () => {
    const now = new Date("2026-04-15T12:00:00Z");
    const today = "2026-04-15";
    const db = await getDb();

    await db.collection("web_profiles").insertMany([
      { _id: "u1", last_seen: new Date("2026-04-15T09:00:00Z") },
      { _id: "u2", last_seen: new Date("2026-04-05T09:00:00Z") },
      { _id: "u3" },
    ] as never);

    await recordHit({ ip: "9.9.9.9", userAgent: "UA", day: today });
    await recordHit({ ip: "8.8.8.8", userAgent: "UA", day: today });

    const stats = await readDashboard({ day: today, now });

    expect(stats.registered).toBe(3);
    expect(stats.dau).toBe(1);
    expect(stats.mau).toBe(2);
    expect(stats.todayVisitors).toBe(2);
    expect(stats.todayPageViews).toBe(2);
    expect(stats.series).toHaveLength(30);
    expect(stats.series[stats.series.length - 1]).toMatchObject({
      day: today,
      pageViews: 2,
      visitors: 2,
    });
  });

  it("uses defaults (today/now) and reports zeros for an empty window", async () => {
    const stats = await readDashboard();
    expect(stats.series).toHaveLength(30);
    expect(typeof stats.registered).toBe("number");
    // Today (real date) has no analytics docs in this in-memory DB → ?? 0 paths.
    expect(stats.todayPageViews).toBe(0);
    expect(stats.todayVisitors).toBe(0);
    expect(stats.series[stats.series.length - 1].pageViews).toBe(0);
  });
});
