import Link from "next/link";
import Image from "next/image";
import Avatar from "./Avatar";
import type { LftPlayer } from "@/lib/db/lft";
import { flagUrl } from "@/lib/profile/countries";

export default function LftCard({ player }: { player: LftPlayer }) {
  const avatarSrc = player.avatar
    ? `https://cdn.discordapp.com/avatars/${player.userId}/${player.avatar}.png`
    : null;
  return (
    <Link
      href={`/player/${player.userId}`}
      className="glass"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: 14,
        borderRadius: 14,
        textDecoration: "none",
        color: "var(--txt)",
      }}
    >
      <Avatar name={player.username} size={44} src={avatarSrc} />
      <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
        <span style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {player.username}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--muted)", fontSize: 12, flexWrap: "wrap" }}>
          {player.nationality && (
            <Image
              src={flagUrl(player.nationality)}
              alt={player.nationality}
              width={20}
              height={15}
              style={{ borderRadius: 2, display: "block" }}
            />
          )}
          <span>{player.age !== null ? `${player.age} yrs` : "—"}</span>
          {player.roles.length > 0 && <span>· {player.roles.join(", ")}</span>}
        </span>
      </div>
    </Link>
  );
}
