import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { ensureAnalyticsIndexes } from "./indexes";
import { getDb } from "@/lib/db/client";

let mem: MongoMemoryServer;

beforeAll(async () => {
  mem = await MongoMemoryServer.create();
  process.env.MONGO_URL = mem.getUri();
});

afterAll(async () => {
  await mem.stop();
});

describe("ensureAnalyticsIndexes", () => {
  it("creates the unique (day, h) index on analytics_visitors", async () => {
    await ensureAnalyticsIndexes();
    const db = await getDb();
    const idx = await db.collection("analytics_visitors").indexes();
    const unique = idx.find((i) => i.key?.day === 1 && i.key?.h === 1);
    expect(unique?.unique).toBe(true);
  });

  it("is idempotent when called twice", async () => {
    await ensureAnalyticsIndexes();
    await expect(ensureAnalyticsIndexes()).resolves.not.toThrow();
  });
});
