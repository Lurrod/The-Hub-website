import { getQueueStatLines } from "@/lib/db/players";
import { rankLeaderboard } from "@/lib/stats/leaderboard";
import { QUEUE_TYPES, type QueueType } from "@/lib/db/types";
import { fmt } from "@/components/format";
import QueueTabs from "@/components/QueueTabs";

export const revalidate = 60;

function parseQueue(v: string | undefined): QueueType {
  return (QUEUE_TYPES as string[]).includes(v ?? "") ? (v as QueueType) : "pro";
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ queue?: string }>;
}) {
  const queue = parseQueue((await searchParams).queue);
  const lines = rankLeaderboard(await getQueueStatLines(queue, { minGames: 1 }));

  return (
    <>
      <div className="eyebrow" style={{ textTransform: "uppercase", letterSpacing: 3, fontSize: 11, color: "var(--muted)", fontWeight: 700, margin: "20px 4px 12px" }}>
        Leaderboard
      </div>
      <QueueTabs active={queue} basePath="/" />
      <div className="glass" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {["#", "Player", "ELO", "W-L", "Rating", "Games"].map((h, i) => (
                <th key={h} style={{
                  textAlign: i <= 1 ? "left" : "right", padding: "13px 12px", color: "var(--muted)",
                  fontSize: 11, textTransform: "uppercase", letterSpacing: .5, fontWeight: 800,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 20, color: "var(--muted)" }}>No active players in this queue.</td></tr>
            )}
            {lines.map((l, i) => (
              <tr key={l.userId} style={{ borderTop: "1px solid rgba(255,255,255,.07)" }}>
                <td style={{ padding: "11px 12px", color: i < 3 ? "var(--gold)" : "var(--muted)", fontWeight: 700 }}>{i + 1}</td>
                <td style={{ padding: "11px 12px", fontWeight: 700 }}>{l.name}</td>
                <td style={{ padding: "11px 12px", textAlign: "right", color: "var(--gold)", fontWeight: 700 }}>{l.elo}</td>
                <td style={{ padding: "11px 12px", textAlign: "right" }}>{l.wins}-{l.losses}</td>
                <td style={{ padding: "11px 12px", textAlign: "right" }}>{fmt(l.rating)}</td>
                <td style={{ padding: "11px 12px", textAlign: "right" }}>{l.games}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
