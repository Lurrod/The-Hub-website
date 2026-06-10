import type { Metadata } from "next";
import { auth, signIn } from "@/auth";
import { getDb } from "@/lib/db/client";
import type { WebProfile } from "@/lib/db/types";
import MeForm from "@/components/MeForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "My Profile",
  description: "Edit your public profile — bio, favorite role, nationality and social links.",
  robots: { index: false, follow: true },
};

export default async function MePage() {
  const session = await auth();
  if (!session?.discordId) {
    return (
      <div
        className="glass"
        style={{
          padding: 26,
          marginTop: 22,
          textAlign: "center",
          maxWidth: 680,
          marginInline: "auto",
        }}
      >
        <p style={{ color: "var(--muted)", marginTop: 0 }}>
          Sign in to edit your profile.
        </p>
        <form
          action={async () => {
            "use server";
            await signIn("discord", { redirectTo: "/me" });
          }}
        >
          <button
            style={{
              background: "linear-gradient(135deg,#5865F2,#414cc4)",
              color: "#fff",
              border: "none",
              borderRadius: 999,
              padding: "10px 20px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Login with Discord
          </button>
        </form>
      </div>
    );
  }

  const db = await getDb();
  const wp = await db
    .collection<WebProfile>("web_profiles")
    .findOne({ _id: session.discordId });

  return (
    <div style={{ maxWidth: 680, marginInline: "auto" }}>
      <div
        style={{
          textTransform: "uppercase",
          letterSpacing: "3px",
          fontSize: 11,
          color: "var(--muted)",
          fontWeight: 700,
          margin: "22px 4px 12px",
        }}
      >
        My profile
      </div>
      <MeForm
        initial={{
          bio: wp?.bio ?? "",
          favorite_role: wp?.favorite_role ?? "",
          nationality: wp?.nationality ?? "",
          twitch: wp?.socials?.twitch ?? "",
          twitter: wp?.socials?.twitter ?? "",
          youtube: wp?.socials?.youtube ?? "",
          vlr_url: wp?.vlr_url ?? "",
          tracker_url: wp?.tracker_url ?? "",
        }}
        viewHref={`/player/${session.discordId}`}
      />
    </div>
  );
}
