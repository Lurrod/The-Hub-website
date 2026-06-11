import type { Metadata } from "next";
import Link from "next/link";
import { getOngoingMatches, getRecentMatches, type OngoingMatch, type OngoingTeamPlayer, type RecentMatch } from "@/lib/db/ongoing";
import { QUEUE_TYPES, QUEUE_LABELS, type QueueType } from "@/lib/db/types";
import { relativeTime } from "@/lib/stats/match-line";
import QueueMatches from "@/components/QueueMatches";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Matches",
  description: "Recent validated custom matches with scoreboards, maps and per-round breakdowns.",
};

// Shared card width so in-progress and recent match cards line up identically.
// Sized so exactly 3 cards fit the 1052px content width (1100 max - 2*24 pad)
// before the scroll strip overflows: 3*342 + 2*12 gap = 1050 <= 1052.
const CARD_WIDTH = 342;

function TeamLines({ players, align }: { players: OngoingTeamPlayer[]; align: "left" | "right" }) {
  if (players.length === 0) return <span style={{ color: "var(--muted)" }}>-</span>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0, overflow: "hidden" }}>
      {players.map((p) => (
        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flexDirection: align === "right" ? "row-reverse" : "row" }}>
          <Link
            href={`/player/${p.id}`}
            // position/z-index keep player links clickable above a stretched
            // card link (see RecentCard); harmless where there is no overlay.
            style={{ position: "relative", zIndex: 2, color: "var(--txt)", textDecoration: "none", fontWeight: 600, flex: 1, minWidth: 0, textAlign: align, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >{p.name}</Link>
          <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: 12, fontFamily: "var(--font-teko)", flex: "0 0 auto" }}>{p.elo ?? "-"}</span>
        </div>
      ))}
    </div>
  );
}

function MatchCard({ m }: { m: OngoingMatch }) {
  return (
    <div className="glass" style={{ padding: 12, width: CARD_WIDTH, flex: "0 0 auto", boxShadow: "none" }}>
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

function RecentCard({ m }: { m: RecentMatch }) {
  const hasScore = m.scoreA !== null && m.scoreB !== null;
  return (
    <div
      className="glass"
      style={{ position: "relative", display: "flex", flexDirection: "column", gap: 8, padding: 12, width: CARD_WIDTH, flex: "0 0 auto", color: "var(--txt)", boxShadow: "none" }}
    >
      {/* Stretched link: makes the whole card navigate to the match without
          wrapping the inner player links (which would nest <a> in <a>). */}
      <Link
        href={`/match/${m.matchId}`}
        aria-label={m.matchNumber ? `Match #${m.matchNumber}` : "Match details"}
        style={{ position: "absolute", inset: 0, zIndex: 1, borderRadius: "inherit", textDecoration: "none" }}
      />
      {/* Match number / map, with time on the right */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="teko" style={{ fontFamily: "var(--font-teko)", fontSize: 20, fontWeight: 700, lineHeight: 1 }}>
          {m.matchNumber ? `#${m.matchNumber}` : "Match"}
        </span>
        {m.map && <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 700 }}>{m.map}</span>}
        <span style={{ marginLeft: "auto", color: "var(--muted)", fontSize: 11 }}>{relativeTime(m.createdAt)}</span>
      </div>
      {/* Teams with the final score (winner highlighted) in the middle */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 10, fontSize: 12 }}>
        <TeamLines players={m.teamA} align="left" />
        <span style={{ fontFamily: "var(--font-teko)", fontSize: 24, fontWeight: 700, whiteSpace: "nowrap", lineHeight: 1, alignSelf: "center" }}>
          {hasScore ? (
            <>
              <span style={{ color: m.winner === "a" ? "var(--green)" : "var(--txt)" }}>{m.scoreA}</span>
              <span style={{ color: "var(--muted)" }}> - </span>
              <span style={{ color: m.winner === "b" ? "var(--green)" : "var(--txt)" }}>{m.scoreB}</span>
            </>
          ) : (
            <span style={{ color: "var(--muted)", fontSize: 13, fontWeight: 700 }}>vs</span>
          )}
        </span>
        <TeamLines players={m.teamB} align="right" />
      </div>
    </div>
  );
}

export default async function MatchesPage() {
  const matches = await getOngoingMatches();
  const recent = await getRecentMatches(20);
  const byQueue = new Map<QueueType, OngoingMatch[]>();
  for (const m of matches) {
    const q = m.queueType as QueueType;
    if (!byQueue.has(q)) byQueue.set(q, []);
    byQueue.get(q)!.push(m);
  }
  const recentByQueue = new Map<QueueType, RecentMatch[]>();
  for (const m of recent) {
    const q = m.queueType as QueueType;
    if (!recentByQueue.has(q)) recentByQueue.set(q, []);
    recentByQueue.get(q)!.push(m);
  }

  return (
    <>
      <h1 style={{ textTransform: "uppercase", letterSpacing: 3, fontSize: 11, color: "var(--muted)", fontWeight: 700, margin: "22px 4px 12px" }}>
        Matches in progress
      </h1>
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
              <QueueMatches>
                {ms.map((m) => (<MatchCard key={m.matchId} m={m} />))}
              </QueueMatches>
            </div>
          );
        })
      )}

      <h2 style={{ textTransform: "uppercase", letterSpacing: 3, fontSize: 11, color: "var(--muted)", fontWeight: 700, margin: "28px 4px 12px" }}>
        Recent matches
      </h2>
      {recent.length === 0 ? (
        <div className="glass" style={{ padding: 20, color: "var(--muted)" }}>No matches played yet.</div>
      ) : (
        QUEUE_TYPES.map((q) => {
          const ms = recentByQueue.get(q);
          if (!ms || ms.length === 0) return null;
          return (
            <div key={q} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)", fontWeight: 800, margin: "0 4px 8px" }}>
                {QUEUE_LABELS[q]}
              </div>
              <QueueMatches>
                {ms.map((m) => (<RecentCard key={m.matchId} m={m} />))}
              </QueueMatches>
            </div>
          );
        })
      )}
    </>
  );
}
