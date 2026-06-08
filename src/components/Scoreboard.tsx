import Link from "next/link";
import type { ScoreboardPlayer } from "@/lib/db/matches";
import { fmt, fmtPct, ratingClass } from "./format";
import { fmtDelta } from "./ui";

function TeamTable({ title, players, won }: { title: string; players: ScoreboardPlayer[]; won: boolean }) {
  return (
    <div className="glass" style={{ overflow: "hidden", marginBottom: 14 }}>
      <div style={{ padding: "12px 16px", fontWeight: 800, letterSpacing: .5, color: won ? "var(--green)" : "var(--txt)", borderBottom: "1px solid var(--line)" }}>
        {title}{won ? "  · WON" : ""}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {["Player", "Agent", "Rating", "ACS", "K", "D", "A", "ADR", "HS%", "ELO"].map((h, i) => (
              <th key={h} style={{ textAlign: i === 0 ? "left" : "right", padding: "10px 12px", color: "var(--muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: .5, fontWeight: 800, whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.userId} style={{ borderTop: "1px solid rgba(255,255,255,.07)" }}>
              <td style={{ padding: "10px 12px", fontWeight: 700 }}>
                <Link href={`/player/${p.userId}`} style={{ color: "var(--txt)", textDecoration: "none" }}>{p.name}</Link>
              </td>
              <td style={{ padding: "10px 12px", textAlign: "right" }}>{p.agent}</td>
              <td className={ratingClass(p.rating)} style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700 }}>{fmt(p.rating)}</td>
              <td style={{ padding: "10px 12px", textAlign: "right" }}>{Math.round(p.acs)}</td>
              <td style={{ padding: "10px 12px", textAlign: "right" }}>{p.kills}</td>
              <td style={{ padding: "10px 12px", textAlign: "right" }}>{p.deaths}</td>
              <td style={{ padding: "10px 12px", textAlign: "right" }}>{p.assists}</td>
              <td style={{ padding: "10px 12px", textAlign: "right" }}>{fmt(p.adr, 0)}</td>
              <td style={{ padding: "10px 12px", textAlign: "right" }}>{fmtPct(p.hsPct)}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: p.eloDelta === null ? "var(--muted)" : p.eloDelta > 0 ? "var(--green)" : "var(--red2)" }}>{fmtDelta(p.eloDelta)}</td>
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
      <TeamTable title="Team A" players={teamA} won={winner === "a"} />
      <TeamTable title="Team B" players={teamB} won={winner === "b"} />
    </>
  );
}
