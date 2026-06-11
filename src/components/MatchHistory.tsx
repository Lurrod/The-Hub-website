import Link from "next/link";
import Image from "next/image";
import type { HistoryRow } from "@/lib/db/matches";
import { fmt, fmtPct, ratingClass } from "./format";
import { fmtDelta } from "./ui";
import { statTip } from "./stat-tooltips";
import { relativeTime } from "@/lib/stats/match-line";

function agentSrc(agent: string): string {
  return `/agents/${agent.replace(/\//g, "_")}.png`;
}

function AgentIcon({ agent }: { agent: string }) {
  return (
    <Image
      src={agentSrc(agent)}
      alt={agent}
      title={agent}
      width={28}
      height={28}
      style={{
        borderRadius: 7, flex: "0 0 auto", objectFit: "cover",
        background: "linear-gradient(135deg,#2a3b4a,#1a2530)",
      }}
    />
  );
}

/** One stat cell: an abbreviated, hover-explained label above its value. */
function Stat({ label, value, valueColor, valueClass }: {
  label: string; value: React.ReactNode; valueColor?: string; valueClass?: string;
}) {
  const tip = statTip(label);
  return (
    <div style={{ minWidth: 0, textAlign: "center" }}>
      <div
        title={tip}
        style={{
          color: "var(--muted)", fontSize: 10, textTransform: "uppercase",
          letterSpacing: .4, fontWeight: 800, whiteSpace: "nowrap",
          cursor: tip ? "help" : undefined,
        }}
      >{label}</div>
      <div className={valueClass} style={{ fontSize: 13, fontWeight: 700, color: valueColor, marginTop: 3, whiteSpace: "nowrap" }}>
        {value}
      </div>
    </div>
  );
}

function MatchCard({ r }: { r: HistoryRow }) {
  const eloColor = r.eloDelta === null ? "var(--muted)" : r.eloDelta > 0 ? "var(--green)" : "var(--red2)";
  return (
    <Link
      href={`/match/${r.matchId}`}
      className="glass"
      style={{
        display: "flex", flexDirection: "column", gap: 10, padding: 14,
        textDecoration: "none", color: "var(--txt)", boxShadow: "none",
      }}
    >
      {/* Result + score, with match number / time on the right */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: r.win ? "var(--green)" : "var(--red2)", fontWeight: 800, fontSize: 13, letterSpacing: .5 }}>
          {r.win ? "WIN" : "LOSS"}
        </span>
        {r.scoreLine && (
          <span style={{ fontFamily: "var(--font-teko)", fontSize: 20, fontWeight: 700, lineHeight: 1 }}>{r.scoreLine}</span>
        )}
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, color: "var(--muted)", fontSize: 11 }}>
          {r.matchNumber !== null && <span style={{ fontFamily: "var(--font-teko)", fontSize: 16, fontWeight: 700 }}>#{r.matchNumber}</span>}
          {relativeTime(r.createdAt)}
        </span>
      </div>

      {/* Agent + map */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <AgentIcon agent={r.agent} />
        <span style={{ fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.agent}</span>
        <span style={{ color: "var(--muted)", fontSize: 12, whiteSpace: "nowrap" }}>· {r.map}</span>
      </div>

      {/* Per-match stat line */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6,
        borderTop: "1px solid rgba(255,255,255,.07)", paddingTop: 10,
      }}>
        <Stat label="Rating" value={fmt(r.rating)} valueClass={ratingClass(r.rating)} />
        <Stat label="ACS" value={Math.round(r.acs)} />
        <Stat label="K-D-A" value={`${r.kills}-${r.deaths}-${r.assists}`} />
        <Stat label="ADR" value={fmt(r.adr, 0)} />
        <Stat label="HS%" value={fmtPct(r.hsPct)} />
        <Stat label="ELO" value={fmtDelta(r.eloDelta)} valueColor={eloColor} />
      </div>
    </Link>
  );
}

export default function MatchHistory({ rows }: { rows: HistoryRow[] }) {
  if (rows.length === 0) {
    return <div className="glass" style={{ padding: 20, color: "var(--muted)" }}>No recorded matches yet.</div>;
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
      {rows.map((r) => (<MatchCard key={r.matchId} r={r} />))}
    </div>
  );
}
