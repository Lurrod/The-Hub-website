import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { fetchUserGuilds, isGuildMember } from "@/lib/auth/guild";
import { syncDiscordIdentity } from "@/lib/db/profile-write";

const GUILD_ID = process.env.DISCORD_GUILD_ID ?? "";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Discord({
      authorization: { params: { scope: "identify guilds" } },
    }),
  ],
  callbacks: {
    async signIn({ account }) {
      // Gate: only members of the community guild may sign in.
      if (!account?.access_token) return false;
      const guilds = await fetchUserGuilds(account.access_token);
      return isGuildMember(guilds, GUILD_ID);
    },
    async jwt({ token, profile }) {
      if (profile) {
        token.discordId = (profile.id as string) ?? "";
        token.username = (profile.global_name as string) || (profile.username as string) || "";
        token.avatar = (profile.avatar as string) ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      session.discordId = (token.discordId as string) ?? "";
      session.username = (token.username as string) ?? "";
      session.avatar = (token.avatar as string | null) ?? null;
      return session;
    },
  },
  events: {
    // Refresh the stored Discord avatar/username on every login so a player's
    // picture stays current without them having to re-save their /me profile.
    async signIn({ profile }) {
      if (!profile) return;
      const userId = (profile.id as string) ?? "";
      const username =
        (profile.global_name as string) || (profile.username as string) || "";
      const avatar = (profile.avatar as string) ?? null;
      try {
        await syncDiscordIdentity(userId, { username, avatar });
      } catch {
        // Non-fatal: a failed avatar refresh must never block sign-in.
      }
    },
  },
});
