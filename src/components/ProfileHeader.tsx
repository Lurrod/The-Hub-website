import Avatar from "./Avatar";
import type { PlayerProfile } from "@/lib/db/profile";
import { QUEUE_LABELS } from "@/lib/db/types";
import { countryName, flagUrl } from "@/lib/profile/countries";

type SocialKind = "twitch" | "twitter" | "youtube" | "vlr" | "tracker";

function logoImg(url: string): React.CSSProperties {
  return {
    width: 22, height: 22, display: "block",
    backgroundImage: `url("${url}")`, backgroundSize: "contain",
    backgroundRepeat: "no-repeat", backgroundPosition: "center",
  };
}

function SocialIcon({ kind }: { kind: SocialKind }) {
  switch (kind) {
    case "twitch":
      return (
        <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden>
          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0 1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
        </svg>
      );
    case "twitter":
      return (
        <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" width={17} height={17} fill="currentColor" aria-hidden>
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12z" />
        </svg>
      );
    case "tracker":
      return <span aria-hidden style={logoImg("/icons/tracker.png")} />;
    case "vlr":
      return <span aria-hidden style={logoImg("/icons/vlr.png")} />;
  }
}

export default function ProfileHeader({ profile }: { profile: PlayerProfile }) {
  const top = profile.queues[0];
  const wp = profile.webProfile;
  const socials: { kind: SocialKind; label: string; url: string }[] = [];
  if (wp?.socials?.twitch) socials.push({ kind: "twitch", label: "Twitch", url: `https://twitch.tv/${wp.socials.twitch}` });
  if (wp?.socials?.twitter) socials.push({ kind: "twitter", label: "Twitter / X", url: `https://x.com/${wp.socials.twitter}` });
  if (wp?.socials?.youtube) socials.push({ kind: "youtube", label: "YouTube", url: wp.socials.youtube });
  if (wp?.vlr_url) socials.push({ kind: "vlr", label: "VLR.gg", url: wp.vlr_url });
  if (wp?.tracker_url) socials.push({ kind: "tracker", label: "Tracker.gg", url: wp.tracker_url });

  return (
    <div className="glass profile-head" style={{ display: "flex", gap: 22, alignItems: "center", padding: 26, marginBottom: 16 }}>
      <Avatar name={profile.name} size={92} src={profile.avatarUrl} />
      <div style={{ flex: 1 }}>
        <div className="teko profile-name" style={{ fontFamily: "var(--font-teko)", fontSize: 44, fontWeight: 700, lineHeight: 1 }}>
          {profile.name}
        </div>
        {(wp?.favorite_role || (wp?.nationality && countryName(wp.nationality))) && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0" }}>
            {wp?.favorite_role && (
              <span style={{ ...chip, display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span aria-hidden style={{ width: 16, height: 16, display: "block", backgroundImage: `url("/roles/${wp.favorite_role.toLowerCase()}.png")`, backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center" }} />
                {wp.favorite_role}
              </span>
            )}
            {wp?.nationality && countryName(wp.nationality) && (
              <span
                title={countryName(wp.nationality)}
                aria-label={countryName(wp.nationality)}
                style={{ ...chip, display: "inline-flex", alignItems: "center", padding: "6px 12px" }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 24,
                    height: 18,
                    display: "block",
                    borderRadius: 3,
                    backgroundImage: `url("${flagUrl(wp.nationality)}")`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    boxShadow: "0 0 0 1px rgba(255,255,255,.18)",
                  }}
                />
              </span>
            )}
          </div>
        )}
        {wp?.bio && <p style={{ color: "var(--muted)", margin: "0 0 8px", maxWidth: 640 }}>{wp.bio}</p>}
        {socials.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {socials.map((s) => (
              <a key={s.kind} className="social" href={s.url} target="_blank" rel="noopener noreferrer" title={s.label} aria-label={s.label}>
                <SocialIcon kind={s.kind} />
              </a>
            ))}
          </div>
        )}
      </div>
      {top && (
        <div className="profile-side" style={{ textAlign: "center", paddingLeft: 22, borderLeft: "1px solid var(--line)" }}>
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
