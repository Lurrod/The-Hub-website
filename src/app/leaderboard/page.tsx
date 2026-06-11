import type { Metadata } from "next";
import Link from "next/link";
import { getCachedQueueStatLines } from "@/lib/db/players";
import { rankLeaderboard } from "@/lib/stats/leaderboard";
import { QUEUE_TYPES, type QueueType } from "@/lib/db/types";
import { fmt } from "@/components/format";
import { statTip } from "@/components/stat-tooltips";
import QueueTabs from "@/components/QueueTabs";

// No `revalidate`: this page's content is driven entirely by the `?queue=`
// search param. Declaring a revalidate marks the segment "static" for the
// client Router Cache, which keys by pathname (not query) and would reuse the
// first-rendered queue across tab switches. Reading `searchParams` keeps it
// dynamic so each queue navigation fetches fresh rankings.
function parseQueue(v: string | undefined): QueueType {
  return (QUEUE_TYPES as string[]).includes(v ?? "") ? (v as QueueType) : "pro";
}

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Per-queue ELO rankings for the Fast Learner x The Hub community — Pro, Semi Pro, Open and GC ladders.",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ queue?: string }>;
}) {
  const queue = parseQueue((await searchParams).queue);
  const lines = rankLeaderboard(await getCachedQueueStatLines(queue, { minGames: 1 }));

  return (
    <>
      <h1 className="eyebrow" style={{ textTransform: "uppercase", letterSpacing: 3, fontSize: 11, color: "var(--muted)", fontWeight: 700, margin: "20px 4px 12px" }}>
        Leaderboard
      </h1>
      <QueueTabs active={queue} basePath="/leaderboard" />
      <div className="glass" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <caption className="sr-only">Leaderboard ranking by ELO for the selected queue</caption>
          <thead>
            <tr>
              {["#", "Player", "ELO", "W-L", "Rating", "Games"].map((h, i) => {
                const tip = statTip(h);
                return (
                <th key={h} scope="col" title={tip} style={{
                  textAlign: i <= 1 ? "left" : "center", padding: "13px 12px", color: "var(--muted)",
                  fontSize: 11, textTransform: "uppercase", letterSpacing: .5, fontWeight: 800,
                  cursor: tip ? "help" : undefined,
                }}>{h}</th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 20, color: "var(--muted)" }}>No active players in this queue.</td></tr>
            )}
            {lines.map((l, i) => (
              <tr key={l.userId} style={{ borderTop: "1px solid rgba(255,255,255,.07)" }}>
                <td style={{ padding: "11px 12px", color: i < 3 ? "var(--gold)" : "var(--muted)", fontWeight: 700 }}>{i + 1}</td>
                <th scope="row" style={{ padding: "11px 12px", fontWeight: 700, textAlign: "left" }}>
                  <Link href={`/player/${l.userId}`} style={{ color: "var(--txt)", textDecoration: "none" }}>{l.name}</Link>
                </th>
                <td style={{ padding: "11px 12px", textAlign: "center", color: "var(--gold)", fontWeight: 700 }}>{l.elo}</td>
                <td style={{ padding: "11px 12px", textAlign: "center" }}>{l.wins}-{l.losses}</td>
                <td style={{ padding: "11px 12px", textAlign: "center" }}>{fmt(l.rating)}</td>
                <td style={{ padding: "11px 12px", textAlign: "center" }}>{l.games}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
