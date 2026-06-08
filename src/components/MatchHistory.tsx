import Link from "next/link";
import type { HistoryRow } from "@/lib/db/matches";
import { fmt, fmtPct, ratingClass } from "./format";
import { fmtDelta } from "./ui";
import { relativeTime } from "@/lib/stats/match-line";

export default function MatchHistory({ rows }: { rows: HistoryRow[] }) {
  if (rows.length === 0) {
    return <div className="glass" style={{ padding: 20, color: "var(--muted)" }}>No recorded matches yet.</div>;
  }
  return (
    <div className="glass" style={{ overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {["Result", "Map", "Agent", "Rating", "ACS", "K-D-A", "ADR", "HS%", "ELO", "When"].map((h, i) => (
              <th key={h} style={{ textAlign: i === 0 ? "left" : "right", padding: "12px", color: "var(--muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: .5, fontWeight: 800, whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.matchId} style={{ borderTop: "1px solid rgba(255,255,255,.07)" }}>
              <td style={{ padding: "11px 12px" }}>
                <Link href={`/match/${r.matchId}`} style={{ color: r.win ? "var(--green)" : "var(--red2)", fontWeight: 800, textDecoration: "none" }}>
                  {r.win ? "WIN" : "LOSS"}{r.scoreLine ? `  ${r.scoreLine}` : ""}
                </Link>
              </td>
              <td style={{ padding: "11px 12px", textAlign: "right" }}>{r.map}</td>
              <td style={{ padding: "11px 12px", textAlign: "right" }}>{r.agent}</td>
              <td className={ratingClass(r.rating)} style={{ padding: "11px 12px", textAlign: "right", fontWeight: 700 }}>{fmt(r.rating)}</td>
              <td style={{ padding: "11px 12px", textAlign: "right" }}>{Math.round(r.acs)}</td>
              <td style={{ padding: "11px 12px", textAlign: "right" }}>{r.kills}-{r.deaths}-{r.assists}</td>
              <td style={{ padding: "11px 12px", textAlign: "right" }}>{fmt(r.adr, 0)}</td>
              <td style={{ padding: "11px 12px", textAlign: "right" }}>{fmtPct(r.hsPct)}</td>
              <td style={{ padding: "11px 12px", textAlign: "right", fontWeight: 700, color: r.eloDelta === null ? "var(--muted)" : r.eloDelta > 0 ? "var(--green)" : "var(--red2)" }}>{fmtDelta(r.eloDelta)}</td>
              <td style={{ padding: "11px 12px", textAlign: "right", color: "var(--muted)" }}>{relativeTime(r.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
