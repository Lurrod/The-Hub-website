export interface DiscordGuild {
  id: string;
  name?: string;
}

/** True if `guildId` is present in the user's Discord guild list. */
export function isGuildMember(guilds: DiscordGuild[] | null | undefined, guildId: string): boolean {
  if (!guilds || !guildId) return false;
  return guilds.some((g) => g.id === guildId);
}

/** Fetch the user's guilds from the Discord API using their OAuth access token. */
export async function fetchUserGuilds(accessToken: string): Promise<DiscordGuild[]> {
  const res = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? (data as DiscordGuild[]) : [];
}
