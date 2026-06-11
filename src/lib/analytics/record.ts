import { getDb } from "@/lib/db/client";
import { dayKey, getDailySalt, visitorHash } from "./hash";
import { ensureAnalyticsIndexes } from "./indexes";

interface HitInput {
  ip: string;
  userAgent: string;
  day?: string;
}

/** Records one page view and (idempotently) one unique-visitor row for the day. */
export async function recordHit({ ip, userAgent, day }: HitInput): Promise<void> {
  await ensureAnalyticsIndexes();
  const d = day ?? dayKey();
  const salt = await getDailySalt(d);
  const h = visitorHash(salt, ip, userAgent);
  const db = await getDb();

  // Page view is incremented before the visitor upsert intentionally: if the
  // visitor write fails transiently we'd rather over-count pageviews than count
  // a visitor with no pageview. Don't reverse this ordering.
  await db
    .collection<{ _id: string; pageviews: number }>("analytics_daily")
    .updateOne({ _id: d }, { $inc: { pageviews: 1 } }, { upsert: true });

  try {
    await db
      .collection("analytics_visitors")
      .updateOne(
        { day: d, h },
        { $setOnInsert: { day: d, h, createdAt: new Date() } },
        { upsert: true },
      );
  } catch (err) {
    // E11000 from a concurrent identical upsert is expected and harmless.
    if ((err as { code?: number }).code !== 11000) throw err;
  }
}
