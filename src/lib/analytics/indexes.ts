import { getDb } from "@/lib/db/client";

const VISITOR_TTL_SECONDS = 3 * 24 * 60 * 60; // 3 days
const SALT_TTL_SECONDS = 2 * 24 * 60 * 60; // 2 days

let ensured: Promise<void> | null = null;

async function createIndexes(): Promise<void> {
  const db = await getDb();
  await db
    .collection("analytics_visitors")
    .createIndex({ day: 1, h: 1 }, { unique: true });
  await db
    .collection("analytics_visitors")
    .createIndex({ createdAt: 1 }, { expireAfterSeconds: VISITOR_TTL_SECONDS });
  await db
    .collection("analytics_salt")
    .createIndex({ createdAt: 1 }, { expireAfterSeconds: SALT_TTL_SECONDS });
}

/** Idempotent; the underlying createIndex calls are no-ops once indexes exist. */
export async function ensureAnalyticsIndexes(): Promise<void> {
  if (!ensured) {
    ensured = createIndexes().catch((err) => {
      ensured = null; // allow retry on next call
      throw err;
    });
  }
  return ensured;
}
