import { getDb } from "@/lib/db/client";
import { dayKey } from "./hash";

export interface DaySeriesPoint {
  day: string;
  pageViews: number;
  visitors: number;
}

export interface DashboardStats {
  registered: number;
  dau: number;
  mau: number;
  todayVisitors: number;
  todayPageViews: number;
  series: DaySeriesPoint[];
}

function daysBack(now: Date, n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    out.push(dayKey(d));
  }
  return out;
}

interface ReadOptions {
  day?: string;
  now?: Date;
}

export async function readDashboard({ day, now }: ReadOptions = {}): Promise<DashboardStats> {
  const ref = now ?? new Date();
  const today = day ?? dayKey(ref);
  const db = await getDb();

  const since = (ms: number) => new Date(ref.getTime() - ms);
  const profiles = db.collection("web_profiles");

  const [registered, dau, mau] = await Promise.all([
    profiles.countDocuments({}),
    profiles.countDocuments({ last_seen: { $gte: since(24 * 60 * 60 * 1000) } }),
    profiles.countDocuments({ last_seen: { $gte: since(30 * 24 * 60 * 60 * 1000) } }),
  ]);

  const window = daysBack(ref, 30);
  const dailyDocs = await db
    .collection<{ _id: string; pageviews: number }>("analytics_daily")
    .find({ _id: { $in: window } })
    .toArray();
  const pvByDay = new Map(dailyDocs.map((d) => [d._id, d.pageviews ?? 0]));

  const visitorAgg = await db
    .collection("analytics_visitors")
    .aggregate<{ _id: string; count: number }>([
      { $match: { day: { $in: window } } },
      { $group: { _id: "$day", count: { $sum: 1 } } },
    ])
    .toArray();
  const visByDay = new Map(visitorAgg.map((v) => [v._id, v.count]));

  const series: DaySeriesPoint[] = window.map((d) => ({
    day: d,
    pageViews: pvByDay.get(d) ?? 0,
    visitors: visByDay.get(d) ?? 0,
  }));

  return {
    registered,
    dau,
    mau,
    todayVisitors: visByDay.get(today) ?? 0,
    todayPageViews: pvByDay.get(today) ?? 0,
    series,
  };
}
