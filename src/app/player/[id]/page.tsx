import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPlayerProfile } from "@/lib/db/profile";
import { getPlayerMatchHistory } from "@/lib/db/matches";
import { QUEUE_LABELS } from "@/lib/db/types";
import { fmt, fmtPct } from "@/components/format";
import { statTip } from "@/components/stat-tooltips";
import ProfileHeader from "@/components/ProfileHeader";
import MatchHistory from "@/components/MatchHistory";

export const dynamic = "force-dynamic";

function eyebrow(text: string) {
  return <div style={{ textTransform: "uppercase", letterSpacing: 3, fontSize: 11, color: "var(--muted)", fontWeight: 700, margin: "22px 4px 12px" }}>{text}</div>;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const profile = await getPlayerProfile(id);
  return { title: profile?.name ?? "Player" };
}

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getPlayerProfile(id);
  if (!profile) notFound();
  const history = await getPlayerMatchHistory(id, { limit: 15 });

  return (
    <>
      <ProfileHeader profile={profile} />
      {profile.queues.length > 0 && (<>
      {eyebrow("Stats by queue")}
      <div className="glass" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {["Queue", "ELO", "W-L", "Games", "Rating", "ACS", "ADR", "K/D", "KAST", "HS%"].map((h, i) => {
                const tip = statTip(h);
                return (
                <th key={h} title={tip} style={{ textAlign: i === 0 ? "left" : "center", padding: "12px", color: "var(--muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: .5, fontWeight: 800, cursor: tip ? "help" : undefined }}>{h}</th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {profile.queues.map((q) => (
              <tr key={q.queueType} style={{ borderTop: "1px solid rgba(255,255,255,.07)" }}>
                <td style={{ padding: "11px 12px", fontWeight: 700 }}>{QUEUE_LABELS[q.queueType]}</td>
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
