import Avatar from "./Avatar";
import type { PlayerProfile } from "@/lib/db/profile";
import { QUEUE_LABELS } from "@/lib/db/types";

export default function ProfileHeader({ profile }: { profile: PlayerProfile }) {
  const top = profile.queues[0];
  const wp = profile.webProfile;
  const socials: { label: string; url: string }[] = [];
  if (wp?.socials?.twitch) socials.push({ label: "Twitch", url: `https://twitch.tv/${wp.socials.twitch}` });
  if (wp?.socials?.twitter) socials.push({ label: "Twitter", url: `https://x.com/${wp.socials.twitter}` });
  if (wp?.socials?.youtube) socials.push({ label: "YouTube", url: wp.socials.youtube });
  if (wp?.vlr_url) socials.push({ label: "VLR", url: wp.vlr_url });
  if (wp?.tracker_url) socials.push({ label: "Tracker", url: wp.tracker_url });

  return (
    <div className="glass" style={{ display: "flex", gap: 22, alignItems: "center", padding: 26, marginBottom: 16 }}>
      <Avatar name={profile.name} size={92} />
      <div style={{ flex: 1 }}>
        <div className="teko" style={{ fontFamily: "var(--font-teko)", fontSize: 44, fontWeight: 700, lineHeight: 1 }}>
          {profile.name}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0" }}>
          {wp?.favorite_role && <span style={chip}>{wp.favorite_role}</span>}
          {wp?.favorite_agent && <span style={chip}>Main: {wp.favorite_agent}</span>}
          {wp?.favorite_map && <span style={chip}>Map: {wp.favorite_map}</span>}
        </div>
        {wp?.bio && <p style={{ color: "var(--muted)", margin: "0 0 8px", maxWidth: 640 }}>{wp.bio}</p>}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {socials.map((s) => (
            <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" style={chip}>{s.label}</a>
          ))}
        </div>
      </div>
      {top && (
        <div style={{ textAlign: "center", paddingLeft: 22, borderLeft: "1px solid var(--line)" }}>
          <div className="teko" style={{ fontFamily: "var(--font-teko)", fontSize: 52, fontWeight: 700, color: "var(--gold)", lineHeight: 1 }}>{top.elo}</div>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "var(--muted)", fontWeight: 700 }}>{QUEUE_LABELS[top.queueType]} ELO</div>
        </div>
      )}
    </div>
  );
}

const chip: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, padding: "6px 12px", borderRadius: 999,
  background: "rgba(255,255,255,.07)", border: "1px solid var(--line)",
  color: "#d4e4f0", textDecoration: "none",
};
