import type { RoundBreakdown } from "@/lib/db/match-types";

// Per-round W/L bar, mirroring the bot scoreboard's round bar.
// Two rows of squares (team A on top, team B below). A team's WON rounds
// are filled with its overall match colour (green if it won, red if it
// lost); other squares stay grey. The end-type icon is stamped on won squares.

const GREY = "#384254";

const END_ICON: Record<string, string> = {
  Eliminated: "eliminated",
  "Bomb defused": "defused",
  Defused: "defused",
  "Bomb detonated": "detonated",
  Detonated: "detonated",
  "Round timer expired": "time",
  Time: "time",
};

function iconFor(end: string): string | null {
  const f = END_ICON[end];
  return f ? `/round_outcomes/${f}.png` : null;
}

function Square({ won, color, end }: { won: boolean; color: string; end: string }) {
  const icon = won ? iconFor(end) : null;
  return (
    <span
      style={{
        width: 22, height: 22, borderRadius: 4, flex: "0 0 auto",
        background: won ? color : GREY,
        display: "grid", placeItems: "center",
      }}
    >
      {icon && (
        // Recoloured via mask so the icon stays a clean solid white on the
        // coloured won squares.
        <span
          aria-hidden
          style={{
            width: 13, height: 13,
            backgroundColor: "#ffffff",
            WebkitMaskImage: `url("${icon}")`,
            maskImage: `url("${icon}")`,
            WebkitMaskSize: "contain", maskSize: "contain",
            WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
            WebkitMaskPosition: "center", maskPosition: "center",
          }}
        />
      )}
    </span>
  );
}

function Row({ rounds, team, color }: { rounds: RoundBreakdown[]; team: "a" | "b"; color: string }) {
  return (
    <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
      {rounds.map((r, i) => (
        // Half-time gap after round 12, like the bot / VLR.
        <span key={i} style={{ marginLeft: i === 12 ? 14 : 0, display: "inline-flex" }}>
          <Square won={r.winner === team} color={color} end={r.end} />
        </span>
      ))}
    </div>
  );
}

export default function RoundBar({ rounds, winner }: { rounds: RoundBreakdown[]; winner: "a" | "b" | null }) {
  if (rounds.length === 0) return null;
  const aColor = winner === "a" ? "var(--green)" : winner === "b" ? "var(--red2)" : GREY;
  const bColor = winner === "b" ? "var(--green)" : winner === "a" ? "var(--red2)" : GREY;
  return (
    <div className="glass" style={{ padding: "12px 16px", marginBottom: 14, display: "flex", flexDirection: "column", gap: 4, overflowX: "auto" }}>
      <Row rounds={rounds} team="a" color={aColor} />
      <Row rounds={rounds} team="b" color={bColor} />
    </div>
  );
}
