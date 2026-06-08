import Link from "next/link";
import type { ScoreboardPlayer } from "@/lib/db/matches";

// Mirrors the bot scoreboard (services/scoreboard_img.py), glass-styled.
// Columns: PLAYER · agent · R · ELO +/- · ACS · K / D / A · +/- · KAST · ADR · HS% · FK · FD · +/-

const GREEN = "var(--green)";
const RED = "var(--red2)";
const MUTED = "var(--muted)";

function ratingColor(r: number): string {
  if (r >= 1.1) return GREEN;
  if (r < 0.85) return RED;
  return "var(--txt)";
}

/** Centered signed delta: +N green / -N red / 0 grey / null em-dash. */
function Delta({ value }: { value: number | null }) {
  if (value === null) return <span style={{ color: MUTED }}>—</span>;
  if (value > 0) return <span style={{ color: GREEN }}>+{value}</span>;
  if (value < 0) return <span style={{ color: RED }}>{value}</span>;
  return <span style={{ color: MUTED }}>0</span>;
}

function agentSrc(agent: string): string {
  return `/agents/${agent.replace(/\//g, "_")}.png`;
}

function AgentIcon({ agent }: { agent: string }) {
  return (
    <span
      title={agent}
      style={{
        width: 26, height: 26, borderRadius: 6, flex: "0 0 auto",
        background: "linear-gradient(135deg,#2a3b4a,#1a2530)",
        backgroundImage: `url("${agentSrc(agent)}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "inline-block",
      }}
    />
  );
}

const TH: React.CSSProperties = {
  padding: "9px 8px", color: "var(--muted)", fontSize: 11, textTransform: "uppercase",
  letterSpacing: .4, fontWeight: 800, whiteSpace: "nowrap", textAlign: "center",
};
const TD: React.CSSProperties = { padding: "9px 8px", textAlign: "center", whiteSpace: "nowrap" };

const COLS: { key: string; label: string }[] = [
  { key: "r", label: "R" },
  { key: "elo", label: "ELO +/-" },
  { key: "acs", label: "ACS" },
  { key: "kda", label: "K / D / A" },
  { key: "kddiff", label: "+/-" },
  { key: "kast", label: "KAST" },
  { key: "adr", label: "ADR" },
  { key: "hs", label: "HS%" },
  { key: "fk", label: "FK" },
  { key: "fd", label: "FD" },
  { key: "fkfd", label: "+/-" },
];

function pct(n: number | null): string {
  return n === null ? "—" : `${Math.round(n)}%`;
}

function TeamBlock({ title, players, won }: { title: string; players: ScoreboardPlayer[]; won: boolean }) {
  const accent = won ? GREEN : RED;
  return (
    <div className="glass" style={{ overflow: "hidden", marginBottom: 14 }}>
      <div style={{ padding: "11px 16px", fontWeight: 800, letterSpacing: .5, color: accent, borderBottom: "1px solid var(--line)" }}>
        {title}{won ? "  · WON" : ""}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: 220 }} />
          {COLS.map((c) => (<col key={c.key} style={c.key === "kda" ? { width: 96 } : undefined} />))}
        </colgroup>
        <thead>
          <tr style={{ background: "rgba(255,255,255,.03)" }}>
            <th style={{ ...TH, textAlign: "left", paddingLeft: 18 }}>PLAYER</th>
            {COLS.map((c) => (<th key={c.key} style={TH}>{c.label}</th>))}
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => (
            <tr key={p.userId} style={{ background: i % 2 ? "rgba(255,255,255,.025)" : "transparent" }}>
              <td style={{ ...TD, textAlign: "left", padding: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px 8px 14px", borderLeft: `4px solid ${accent}` }}>
                  <Link href={`/player/${p.userId}`} style={{ color: "var(--txt)", textDecoration: "none", fontWeight: 700, display: "inline-block", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", verticalAlign: "middle" }}>{p.name}</Link>
                  <AgentIcon agent={p.agent} />
                </div>
              </td>
              <td style={{ ...TD, fontWeight: 800, color: ratingColor(p.rating) }}>{p.rating.toFixed(2)}</td>
              <td style={TD}><Delta value={p.eloDelta} /></td>
              <td style={TD}>{Math.round(p.acs)}</td>
              <td style={TD}>{p.kills} / {p.deaths} / {p.assists}</td>
              <td style={TD}><Delta value={p.kills - p.deaths} /></td>
              <td style={TD}>{pct(p.kastPct)}</td>
              <td style={TD}>{p.adr === null ? "—" : Math.round(p.adr)}</td>
              <td style={TD}>{pct(p.hsPct)}</td>
              <td style={TD}>{p.firstKills}</td>
              <td style={TD}>{p.firstDeaths}</td>
              <td style={TD}><Delta value={p.firstKills - p.firstDeaths} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Scoreboard({ teamA, teamB, winner }: { teamA: ScoreboardPlayer[]; teamB: ScoreboardPlayer[]; winner: "a" | "b" | null }) {
  return (
    <>
      <TeamBlock title="Team A" players={teamA} won={winner === "a"} />
      <TeamBlock title="Team B" players={teamB} won={winner === "b"} />
    </>
  );
}
