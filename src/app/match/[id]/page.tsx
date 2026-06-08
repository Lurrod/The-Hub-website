import { notFound } from "next/navigation";
import { getMatchDetail } from "@/lib/db/matches";
import { QUEUE_LABELS } from "@/lib/db/types";
import type { QueueType } from "@/lib/db/types";
import Scoreboard from "@/components/Scoreboard";

export const dynamic = "force-dynamic";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getMatchDetail(id);
  if (!d) notFound();

  const title = d.matchNumber ? `Match #${d.matchNumber}` : "Match";
  const score = d.scoreA !== null && d.scoreB !== null ? `${d.scoreA} - ${d.scoreB}` : null;

  return (
    <>
      <div className="glass" style={{ display: "flex", alignItems: "center", gap: 16, padding: 22, marginBottom: 16 }}>
        <div>
          <div className="teko" style={{ fontFamily: "var(--font-teko)", fontSize: 40, fontWeight: 700, lineHeight: 1 }}>{title}</div>
          <div style={{ color: "var(--muted)", marginTop: 4 }}>{QUEUE_LABELS[d.queueType as QueueType]} · {d.map}</div>
        </div>
        {score && (
          <div className="teko" style={{ marginLeft: "auto", fontFamily: "var(--font-teko)", fontSize: 44, fontWeight: 700 }}>
            <span style={{ color: d.winner === "a" ? "var(--green)" : "var(--txt)" }}>{d.scoreA}</span>
            <span style={{ color: "var(--muted)" }}> - </span>
            <span style={{ color: d.winner === "b" ? "var(--green)" : "var(--txt)" }}>{d.scoreB}</span>
          </div>
        )}
      </div>
      <Scoreboard teamA={d.teamA} teamB={d.teamB} winner={d.winner} />
    </>
  );
}
