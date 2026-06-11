import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPlayerProfile } from "@/lib/db/profile";
import { getPlayerMatchHistory } from "@/lib/db/matches";
import { QUEUE_LABELS } from "@/lib/db/types";
import { fmt, fmtPct } from "@/components/format";
import { statTip } from "@/components/stat-tooltips";
import ProfileHeader from "@/components/ProfileHeader";
import MatchHistory from "@/components/MatchHistory";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

// Section sub-headings on the player page. The player name (ProfileHeader) is
// the page's <h1>, so these section titles are <h2> to keep the outline valid.
function eyebrow(text: string) {
  return <h2 style={{ textTransform: "uppercase", letterSpacing: 3, fontSize: 11, color: "var(--muted)", fontWeight: 700, margin: "22px 4px 12px" }}>{text}</h2>;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const profile = await getPlayerProfile(id);
  if (!profile) return { title: "Player" };
  const top = profile.queues[0];
  const parts = top
    ? [`${QUEUE_LABELS[top.queueType]} ELO ${top.elo}`, `Rating ${fmt(top.rating)}`, `${top.games} games`]
    : ["player profile"];
  const description = `${profile.name} — ${parts.join(", ")} on Fast Learner x The Hub.`;
  const url = `/player/${id}`;
  return {
    title: profile.name,
    description,
    alternates: { canonical: url },
    openGraph: { type: "profile", title: profile.name, description, url },
    twitter: { card: "summary_large_image", title: profile.name, description },
  };
}

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getPlayerProfile(id);
  if (!profile) notFound();
  const history = await getPlayerMatchHistory(id, { limit: 15 });

  const wp = profile.webProfile;
  const sameAs = [
    wp?.socials?.twitch ? `https://twitch.tv/${wp.socials.twitch}` : null,
    wp?.socials?.twitter ? `https://x.com/${wp.socials.twitter}` : null,
    wp?.socials?.youtube ?? null,
    wp?.vlr_url ?? null,
    wp?.tracker_url ?? null,
  ].filter((u): u is string => Boolean(u));
  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    url: `${SITE_URL}/player/${id}`,
    ...(profile.avatarUrl ? { image: profile.avatarUrl } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd).replace(/</g, "\\u003c") }}
      />
      <ProfileHeader profile={profile} />
      {profile.queues.length > 0 && (<>
      {eyebrow("Stats by queue")}
      <div className="glass" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <caption className="sr-only">Per-queue statistics for {profile.name}</caption>
          <thead>
            <tr>
              {["Queue", "ELO", "W-L", "Games", "Rating", "ACS", "ADR", "K/D", "KAST", "HS%"].map((h, i) => {
                const tip = statTip(h);
                return (
                <th key={h} scope="col" title={tip} style={{ textAlign: i === 0 ? "left" : "center", padding: "12px", color: "var(--muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: .5, fontWeight: 800, cursor: tip ? "help" : undefined }}>{h}</th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {profile.queues.map((q) => (
              <tr key={q.queueType} style={{ borderTop: "1px solid rgba(255,255,255,.07)" }}>
                <th scope="row" style={{ padding: "11px 12px", fontWeight: 700, textAlign: "left" }}>{QUEUE_LABELS[q.queueType]}</th>
                <td style={{ padding: "11px 12px", textAlign: "center", color: "var(--gold)", fontWeight: 700 }}>{q.elo}</td>
                <td style={{ padding: "11px 12px", textAlign: "center" }}>{q.wins}-{q.losses}</td>
                <td style={{ padding: "11px 12px", textAlign: "center" }}>{q.games}</td>
                <td style={{ padding: "11px 12px", textAlign: "center" }}>{fmt(q.rating)}</td>
                <td style={{ padding: "11px 12px", textAlign: "center" }}>{fmt(q.acs, 0)}</td>
                <td style={{ padding: "11px 12px", textAlign: "center" }}>{fmt(q.adr, 0)}</td>
                <td style={{ padding: "11px 12px", textAlign: "center" }}>{fmt(q.kd)}</td>
                <td style={{ padding: "11px 12px", textAlign: "center" }}>{fmtPct(q.kastPct)}</td>
                <td style={{ padding: "11px 12px", textAlign: "center" }}>{fmtPct(q.hsPct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>)}
      {eyebrow("Recent matches")}
      <MatchHistory rows={history} />
    </>
  );
}
