import Link from "next/link";
import { getOngoingMatches, type OngoingMatch, type OngoingTeamPlayer } from "@/lib/db/ongoing";
import { QUEUE_TYPES, QUEUE_LABELS, type QueueType } from "@/lib/db/types";
import { relativeTime } from "@/lib/stats/match-line";

export const dynamic = "force-dynamic";

function TeamLines({ players, align }: { players: OngoingTeamPlayer[]; align: "left" | "right" }) {
  if (players.length === 0) return <span style={{ color: "var(--muted)" }}>—</span>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {players.map((p) => (
        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, flexDirection: align === "right" ? "row-reverse" : "row" }}>
          <Link
            href={`/player/${p.id}`}
            style={{ color: "var(--txt)", textDecoration: "none", fontWeight: 600, flex: 1, minWidth: 0, textAlign: align, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >{p.name}</Link>
          <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: 12, fontFamily: "var(--font-teko)", flex: "0 0 auto" }}>{p.elo ?? "—"}</span>
        </div>
      ))}
    </div>
  );
}

function MatchCard({ m }: { m: OngoingMatch }) {
  return (
    <div className="glass" style={{ padding: 12, flex: "1 1 320px", minWidth: 300, maxWidth: 520 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span className="teko" style={{ fontFamily: "var(--font-teko)", fontSize: 20, fontWeight: 700, lineHeight: 1 }}>
          {m.matchNumber ? `#${m.matchNumber}` : "Match"}
        </span>
        {m.map && <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 700 }}>{m.map}</span>}
        {m.status === "contested" && <span style={{ color: "var(--yellow)", fontSize: 11, fontWeight: 700 }}>contested</span>}
        <span style={{ marginLeft: "auto", color: "var(--muted)", fontSize: 11 }}>{relativeTime(m.createdAt)}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "start", gap: 12, fontSize: 12 }}>
        <TeamLines players={m.teamA} align="left" />
        <span style={{ color: "var(--muted)", fontWeight: 700, alignSelf: "center" }}>vs</span>
        <TeamLines players={m.teamB} align="right" />
      </div>
    </div>
  );
}

export default async function MatchesPage() {
  const matches = await getOngoingMatches();
  const byQueue = new Map<QueueType, OngoingMatch[]>();
  for (const m of matches) {
    const q = m.queueType as QueueType;
    if (!byQueue.has(q)) byQueue.set(q, []);
    byQueue.get(q)!.push(m);
  }

  return (
    <>
      <div style={{ textTransform: "uppercase", letterSpacing: 3, fontSize: 11, color: "var(--muted)", fontWeight: 700, margin: "22px 4px 12px" }}>
        Matches in progress
      </div>
      {matches.length === 0 ? (
        <div className="glass" style={{ padding: 20, color: "var(--muted)" }}>No matches in progress right now.</div>
      ) : (
        QUEUE_TYPES.map((q) => {
          const ms = byQueue.get(q);
          if (!ms || ms.length === 0) return null;
          return (
            <div key={q} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)", fontWeight: 800, margin: "0 4px 8px" }}>
                {QUEUE_LABELS[q]}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {ms.map((m) => (<MatchCard key={m.matchId} m={m} />))}
              </div>
            </div>
          );
        })
      )}
    </>
  );
}
