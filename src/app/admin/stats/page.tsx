import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { readDashboard, type DaySeriesPoint } from "@/lib/analytics/read";

export const dynamic = "force-dynamic";

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ padding: 16, border: "1px solid #333", borderRadius: 8, minWidth: 140 }}>
      <div style={{ fontSize: 13, opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value.toLocaleString()}</div>
    </div>
  );
}

function Sparkline({ series }: { series: DaySeriesPoint[] }) {
  const max = Math.max(1, ...series.map((p) => p.pageViews));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 80 }}>
      {series.map((p) => (
        <div
          key={p.day}
          title={`${p.day}: ${p.pageViews} views, ${p.visitors} visitors`}
          style={{
            width: 10,
            height: `${(p.pageViews / max) * 100}%`,
            background: "#5865F2",
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}

export default async function StatsPage() {
  const session = await auth();
  const owner = process.env.OWNER_DISCORD_ID;
  if (!owner || session?.discordId !== owner) notFound();

  const stats = await readDashboard();

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1>Site stats</h1>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, margin: "16px 0" }}>
        <Metric label="Registered users" value={stats.registered} />
        <Metric label="Active today (DAU)" value={stats.dau} />
        <Metric label="Active 30d (MAU)" value={stats.mau} />
        <Metric label="Unique visitors today" value={stats.todayVisitors} />
        <Metric label="Page views today" value={stats.todayPageViews} />
      </div>
      <h2 style={{ fontSize: 16 }}>Page views — last 30 days</h2>
      <Sparkline series={stats.series} />
    </main>
  );
}
