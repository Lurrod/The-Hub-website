"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import type { PlayerStatLine } from "@/lib/stats/derive";
import { fmt, fmtPct, ratingClass } from "@/components/format";
import { statTip } from "@/components/stat-tooltips";

type Key = "name" | "games" | "rating" | "acs" | "adr" | "kd" | "kastPct" | "kpr" | "apr" | "fkpr" | "fdpr" | "hsPct" | "elo";

/** Date is serialized to a string across the RSC boundary, so the client table
 * never receives `updatedAt` as a usable Date - exclude it from the prop. */
type StatRow = Omit<PlayerStatLine, "updatedAt">;

const COLS: { key: Key; label: string; left?: boolean }[] = [
  { key: "name", label: "Player", left: true },
  { key: "games", label: "GP" },
  { key: "rating", label: "Rating" },
  { key: "acs", label: "ACS" },
  { key: "adr", label: "ADR" },
  { key: "kd", label: "K/D" },
  { key: "kastPct", label: "KAST" },
  { key: "kpr", label: "KPR" },
  { key: "apr", label: "APR" },
  { key: "fkpr", label: "FKPR" },
  { key: "fdpr", label: "FDPR" },
  { key: "hsPct", label: "HS%" },
  { key: "elo", label: "ELO" },
];

export default function StatsTable({ lines }: { lines: StatRow[] }) {
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

  function cell(key: Key, l: StatRow) {
    switch (key) {
      case "name": return l.name;
      case "games": return l.games;
      case "elo": return l.elo;
      case "kastPct": return fmtPct(l.kastPct);
      case "hsPct": return fmtPct(l.hsPct);
      case "acs": return fmt(l.acs, 0);
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
          <caption className="sr-only">Player statistics, sortable by column</caption>
          <thead>
            <tr>
              {COLS.map((c) => {
                const active = sortKey === c.key;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    // Only the active column carries aria-sort (APG: omit on the
                    // rest to avoid screen readers announcing "none" everywhere).
                    // The left-aligned text column (name) sorts A->Z; the rest desc.
                    aria-sort={active ? (c.left ? "ascending" : "descending") : undefined}
                    style={{ textAlign: c.left ? "left" : "center", padding: 0, whiteSpace: "nowrap" }}
                  >
                    <button
                      type="button"
                      onClick={() => setSortKey(c.key)}
                      title={statTip(c.label)}
                      style={{
                        width: "100%", background: "none", border: "none", cursor: "pointer",
                        font: "inherit", textAlign: c.left ? "left" : "center", padding: "13px 12px",
                        color: active ? "#fff" : "var(--muted)", fontSize: 11,
                        textTransform: "uppercase", letterSpacing: .5, fontWeight: 800, whiteSpace: "nowrap",
                      }}
                    >
                      {c.label}{active ? " ▼" : ""}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={COLS.length} style={{ padding: 20, color: "var(--muted)" }}>No players match this filter.</td></tr>
            )}
            {rows.map((l) => (
              <tr key={l.userId} style={{ borderTop: "1px solid rgba(255,255,255,.07)" }}>
                {COLS.map((c) => {
                  const style: React.CSSProperties = {
                    textAlign: c.left ? "left" : "center", padding: "11px 12px",
                    fontWeight: c.key === "name" || c.key === "rating" || c.key === "elo" ? 700 : 400,
                    color: c.key === "elo" ? "var(--gold)" : undefined, whiteSpace: "nowrap",
                  };
                  if (c.key === "name") {
                    return (
                      <th key={c.key} scope="row" style={style}>
                        <Link href={`/player/${l.userId}`} style={{ color: "var(--txt)", textDecoration: "none" }}>{l.name}</Link>
                      </th>
                    );
                  }
                  return (
                    <td key={c.key} className={c.key === "rating" ? ratingClass(l.rating) : ""} style={style}>
                      {cell(c.key, l)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
