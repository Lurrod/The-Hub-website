import Link from "next/link";
import Image from "next/image";
import SearchBox from "./SearchBox";
import { auth, signIn, signOut } from "@/auth";
import Avatar from "./Avatar";

export default async function Navbar() {
  const session = await auth();
  return (
    <nav className="glass site-nav" style={{
      position: "sticky", top: 14, zIndex: 5, display: "flex", alignItems: "center",
      gap: 18, margin: "14px auto 0", maxWidth: 1100, padding: "12px 22px", borderRadius: 16,
    }}>
      <Link href="/" aria-label="The Hub - home" style={{ display: "flex", alignItems: "center", flex: "0 0 auto" }}>
        <Image src="/fl_logo.png" alt="The Hub logo" width={42} height={42} priority style={{ display: "block", objectFit: "contain" }} />
      </Link>
      <SearchBox />
      <div className="nav-links" style={{ marginLeft: "auto", display: "flex", gap: 22, fontWeight: 600, fontSize: 13, color: "var(--muted)" }}>
        <Link href="/leaderboard" style={{ color: "inherit", textDecoration: "none" }}>Leaderboards</Link>
        <Link href="/stats" style={{ color: "inherit", textDecoration: "none" }}>Stats</Link>
        <Link href="/matches" style={{ color: "inherit", textDecoration: "none" }}>Matches</Link>
      </div>
      {session ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/me" style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--txt)", textDecoration: "none", fontWeight: 700, fontSize: 13 }}>
            <Avatar
              name={session.username || "Me"}
              size={28}
              src={session.avatar ? `https://cdn.discordapp.com/avatars/${session.discordId}/${session.avatar}.png` : null}
            />
            {session.username || "Me"}
          </Link>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
            <button style={{ background: "rgba(255,255,255,.06)", border: "1px solid var(--line)", color: "var(--muted)", borderRadius: 999, padding: "8px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Logout</button>
          </form>
        </div>
      ) : (
        <form action={async () => { "use server"; await signIn("discord", { redirectTo: "/me" }); }}>
          <button style={{ background: "linear-gradient(135deg,#5865F2,#414cc4)", color: "#fff", border: "none", borderRadius: 999, padding: "8px 16px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Login with Discord</button>
        </form>
      )}
    </nav>
  );
}
