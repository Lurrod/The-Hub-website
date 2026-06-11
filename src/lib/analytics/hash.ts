import { createHash, randomBytes } from "crypto";
import { getDb } from "@/lib/db/client";

/** UTC day bucket, e.g. "2026-06-11". */
export function dayKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Pure, deterministic anonymous visitor fingerprint for one day. Fields are
 * joined with a NUL byte (which cannot appear in an IP or a header value) so
 * that e.g. an IPv6 address's internal colons can't shift the field boundary
 * and collide two distinct visitors.
 */
export function visitorHash(salt: string, ip: string, userAgent: string): string {
  return createHash("sha256")
    .update(salt)
    .update("\x00")
    .update(ip)
    .update("\x00")
    .update(userAgent)
    .digest("hex");
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
  // With upsert + returnDocument:"after" the driver always returns the document.
  // A null here means the salt was never persisted — fail loud rather than
  // return an unstored salt that would mis-count every hit as a new visitor.
  if (!res?.salt) {
    throw new Error(`getDailySalt: upsert returned no document for day ${day}`);
  }
  return res.salt;
}
