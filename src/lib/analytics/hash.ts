import { createHash, randomBytes } from "crypto";
import { getDb } from "@/lib/db/client";

/** UTC day bucket, e.g. "2026-06-11". */
export function dayKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Pure, deterministic anonymous visitor fingerprint for one day. */
export function visitorHash(salt: string, ip: string, userAgent: string): string {
  return createHash("sha256").update(`${salt}:${ip}:${userAgent}`).digest("hex");
}

/**
 * Random 16-byte salt, created once per day and reused. Stored in
 * analytics_salt (TTL-purged after 2 days) so it can never be used to link a
 * visitor across days.
 */
export async function getDailySalt(day: string): Promise<string> {
  const db = await getDb();
  const candidate = randomBytes(16).toString("hex");
  const res = await db
    .collection<{ _id: string; salt: string; createdAt: Date }>("analytics_salt")
    .findOneAndUpdate(
      { _id: day },
      { $setOnInsert: { salt: candidate, createdAt: new Date() } },
      { upsert: true, returnDocument: "after" },
    );
  return res?.salt ?? candidate;
}
