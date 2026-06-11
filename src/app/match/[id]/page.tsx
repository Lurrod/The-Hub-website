import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMatchDetail } from "@/lib/db/matches";
import { QUEUE_LABELS } from "@/lib/db/types";
import type { QueueType } from "@/lib/db/types";
import Scoreboard from "@/components/Scoreboard";
import RoundBar from "@/components/RoundBar";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const d = await getMatchDetail(id);
  if (!d) return { title: "Match" };
  const title = d.matchNumber ? `Match #${d.matchNumber}` : "Match";
  const score = d.scoreA !== null && d.scoreB !== null ? `, final score ${d.scoreA}-${d.scoreB}` : "";
  const description = `${QUEUE_LABELS[d.queueType as QueueType]} custom on ${d.map}${score} — Fast Learner x The Hub.`;
  const url = `/match/${id}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "article", title, description, url },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getMatchDetail(id);
  if (!d) notFound();

  const subtitle = [QUEUE_LABELS[d.queueType as QueueType], d.matchNumber ? `Match #${d.matchNumber}` : null]
    .filter(Boolean)
    .join(" · ");
  const colorA = d.winner === "a" ? "var(--green)" : d.winner === "b" ? "var(--red2)" : "var(--txt)";
  const colorB = d.winner === "b" ? "var(--green)" : d.winner === "a" ? "var(--red2)" : "var(--txt)";
  const teko = (size: number): React.CSSProperties => ({ fontFamily: "var(--font-teko)", fontWeight: 700, lineHeight: 1, fontSize: size });

  const startDate = d.createdAt instanceof Date ? d.createdAt.toISOString() : new Date(d.createdAt).toISOString();
  const eventLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${d.matchNumber ? `Match #${d.matchNumber}` : "Match"} — ${d.map}`,
    sport: "Valorant",
    startDate,
    url: `${SITE_URL}/match/${id}`,
    location: { "@type": "VirtualLocation", url: `${SITE_URL}/match/${id}` },
    competitor: [
      { "@type": "SportsTeam", name: "Team A" },
      { "@type": "SportsTeam", name: "Team B" },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventLd).replace(/</g, "\\u003c") }}
      />
      {/* Header band - mirrors the bot scoreboard header (team · score · map · score · team). */}
      <div className="glass match-head" style={{ display: "flex", alignItems: "center", padding: "18px 26px", marginBottom: 16 }}>
        <div className="mh-side" style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
          <span className="mh-team" style={{ ...teko(26), color: colorA, letterSpacing: 1 }}>TEAM A</span>
          {d.scoreA !== null && <span className="mh-score" style={{ ...teko(50), color: colorA }}>{d.scoreA}</span>}
        </div>
        <div className="mh-mid" style={{ textAlign: "center", flex: "0 0 auto", padding: "0 24px" }}>
          <div className="mh-map" style={teko(26)}>{d.map}</div>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "var(--muted)", fontWeight: 700, marginTop: 4 }}>{subtitle}</div>
        </div>
        <div className="mh-side" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 16, flex: 1 }}>
          {d.scoreB !== null && <span className="mh-score" style={{ ...teko(50), color: colorB }}>{d.scoreB}</span>}
          <span className="mh-team" style={{ ...teko(26), color: colorB, letterSpacing: 1 }}>TEAM B</span>
        </div>
      </div>
      <RoundBar rounds={d.rounds} winner={d.winner} />
      <Scoreboard teamA={d.teamA} teamB={d.teamB} winner={d.winner} />
    </>
  );
}
