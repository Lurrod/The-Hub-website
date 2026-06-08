"use client";
import { useState, useMemo } from "react";
import type { PlayerStatLine } from "@/lib/stats/derive";
import { fmt, fmtPct, ratingClass } from "@/components/format";

type Key = "name" | "games" | "rating" | "adr" | "kd" | "kastPct" | "kpr" | "apr" | "fkpr" | "hsPct" | "elo";

const COLS: { key: Key; label: string; left?: boolean }[] = [
  { key: "name", label: "Player", left: true },
  { key: "games", label: "GP" },
  { key: "rating", label: "Rating" },
  { key: "adr", label: "ADR" },
  { key: "kd", label: "K/D" },
  { key: "kastPct", label: "KAST" },
  { key: "kpr", label: "KPR" },
  { key: "apr", label: "APR" },
  { key: "fkpr", label: "FKPR" },
  { key: "hsPct", label: "HS%" },
  { key: "elo", label: "ELO" },
];

export default function StatsTable({ lines }: { lines: PlayerStatLine[] }) {
  const [sortKey, setSortKey] = useState<Key>("rating");
  const [minGames, setMinGames] = useState(10);

  const rows = useMemo(() => {
    const filtered = lines.filter((l) => l.games >= minGames);
    return filtered.sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      const av = a[sortKey] as number | null;
      const bv = b[sortKey] as number | null;
      return (bv ?? -Infinity) - (av ?? -Infinity);
    });
  }, [lines, sortKey, minGames]);

  function cell(key: Key, l: PlayerStatLine) {
    switch (key) {
      case "name": return l.name;
      case "games": return l.games;
      case "elo": return l.elo;
      case "kastPct": return fmtPct(l.kastPct);
      case "hsPct": return fmtPct(l.hsPct);
      case "adr": return fmt(l.adr, 0);
      case "rating": return fmt(l.rating);
      default: return fmt(l[key] as number | null);
    }
  }

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <label style={{ marginLeft: "auto", color: "var(--muted)", fontSize: 12 }}>
          Min games:{" "}
          <select value={minGames} onChange={(e) => setMinGames(Number(e.target.value))}
            style={{ background: "rgba(255,255,255,.06)", color: "var(--txt)", border: "1px solid var(--line)", borderRadius: 8, padding: "4px 8px" }}>
            <option value={0}>0</option><option value={10}>10</option><option value={20}>20</option>
          </select>
        </label>
      </div>
      <div className="glass" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {COLS.map((c) => (
                <th key={c.key} onClick={() => setSortKey(c.key)} style={{
                  textAlign: c.left ? "left" : "right", padding: "13px 12px", cursor: "pointer",
                  color: sortKey === c.key ? "#fff" : "var(--muted)", fontSize: 11,
                  textTransform: "uppercase", letterSpacing: .5, fontWeight: 800, whiteSpace: "nowrap",
                }}>{c.label}{sortKey === c.key ? " ▼" : ""}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={COLS.length} style={{ padding: 20, color: "var(--muted)" }}>No players match this filter.</td></tr>
            )}
            {rows.map((l) => (
              <tr key={l.userId} style={{ borderTop: "1px solid rgba(255,255,255,.07)" }}>
                {COLS.map((c) => (
                  <td key={c.key} className={c.key === "rating" ? ratingClass(l.rating) : ""} style={{
                    textAlign: c.left ? "left" : "right", padding: "11px 12px",
                    fontWeight: c.key === "name" || c.key === "rating" || c.key === "elo" ? 700 : 400,
                    color: c.key === "elo" ? "var(--gold)" : undefined, whiteSpace: "nowrap",
                  }}>{cell(c.key, l)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
