import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { dayKey, getDailySalt, visitorHash } from "./hash";

let mem: MongoMemoryServer;

beforeAll(async () => {
  mem = await MongoMemoryServer.create();
  process.env.MONGO_URL = mem.getUri();
});

afterAll(async () => {
  await mem.stop();
});

describe("dayKey", () => {
  it("formats a date as YYYY-MM-DD (UTC)", () => {
    expect(dayKey(new Date("2026-06-11T23:30:00Z"))).toBe("2026-06-11");
  });
});

describe("visitorHash", () => {
  it("is deterministic for the same inputs", () => {
    const a = visitorHash("salt", "1.2.3.4", "UA");
    const b = visitorHash("salt", "1.2.3.4", "UA");
    expect(a).toBe(b);
  });

  it("differs when the salt differs (cross-day unlinkability)", () => {
    expect(visitorHash("saltA", "1.2.3.4", "UA")).not.toBe(
      visitorHash("saltB", "1.2.3.4", "UA"),
    );
  });

  it("differs when the user-agent differs", () => {
    expect(visitorHash("salt", "1.2.3.4", "UA1")).not.toBe(
      visitorHash("salt", "1.2.3.4", "UA2"),
    );
  });
});

describe("getDailySalt", () => {
  it("returns the same salt when called twice for the same day", async () => {
    const first = await getDailySalt("2026-06-11");
    const second = await getDailySalt("2026-06-11");
    expect(second).toBe(first);
    expect(first).toHaveLength(32);
  });

  it("returns different salts for different days", async () => {
    const d1 = await getDailySalt("2026-06-12");
    const d2 = await getDailySalt("2026-06-13");
    expect(d1).not.toBe(d2);
  });
});
