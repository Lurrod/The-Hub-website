import Link from "next/link";
import { getOngoingMatches, type OngoingMatch, type OngoingTeamPlayer } from "@/lib/db/ongoing";
import { QUEUE_LABELS, type QueueType } from "@/lib/db/types";
import { relativeTime } from "@/lib/stats/match-line";

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: string }) {
  const live = status === "pending";
  const color = live ? "var(--green)" : "var(--yellow)";
  const label = live ? "LIVE" : "CONTESTED";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color, fontWeight: 800, fontSize: 12, letterSpacing: .5 }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 10px ${color}` }} />
      {label}
    </span>
  );
}

function Team({ players, align }: { players: OngoingTeamPlayer[]; align: "left" | "right" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: align === "right" ? "flex-end" : "flex-start" }}>
      {players.map((p) => (
        <Link key={p.id} href={`/player/${p.id}`} style={{ color: "var(--txt)", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
          {p.name}
        </Link>
      ))}
      {players.length === 0 && <span style={{ color: "var(--muted)", fontSize: 13 }}>—</span>}
    </div>
  );
}

function MatchCard({ m }: { m: OngoingMatch }) {
  return (
    <div className="glass" style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <span className="teko" style={{ fontFamily: "var(--font-teko)", fontSize: 26, fontWeight: 700, lineHeight: 1 }}>
          {m.matchNumber ? `Match #${m.matchNumber}` : "Match"}
        </span>
        <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: .5 }}>
          {QUEUE_LABELS[m.queueType as QueueType]}{m.map ? ` · ${m.map}` : ""}
        </span>
        <StatusBadge status={m.status} />
        <span style={{ marginLeft: "auto", color: "var(--muted)", fontSize: 12 }}>{relativeTime(m.createdAt)}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 16 }}>
        <Team players={m.teamA} align="left" />
        <span style={{ color: "var(--muted)", fontFamily: "var(--font-teko)", fontSize: 22, fontWeight: 700 }}>VS</span>
        <Team players={m.teamB} align="right" />
      </div>
    </div>
  );
}

export default async function MatchesPage() {
  const matches = await getOngoingMatches();
  return (
    <>
      <div style={{ textTransform: "uppercase", letterSpacing: 3, fontSize: 11, color: "var(--muted)", fontWeight: 700, margin: "22px 4px 12px" }}>
        Matches in progress
      </div>
      {matches.length === 0 ? (
        <div className="glass" style={{ padding: 20, color: "var(--muted)" }}>No matches in progress right now.</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {matches.map((m) => (<MatchCard key={m.matchId} m={m} />))}
        </div>
      )}
    </>
  );
}
