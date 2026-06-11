export interface DiscordGuild {
  id: string;
  name?: string;
}

/** True if `guildId` is present in the user's Discord guild list. */
export function isGuildMember(guilds: DiscordGuild[] | null | undefined, guildId: string): boolean {
  if (!guilds || !guildId) return false;
  return guilds.some((g) => g.id === guildId);
}

/** Discord API call timeout (ms). Keeps the login flow from hanging if Discord
 * is slow or unreachable. */
const GUILDS_FETCH_TIMEOUT_MS = 5000;

/** Fetch the user's guilds from the Discord API using their OAuth access token.
 * Bounded by a 5s timeout; any network error or timeout resolves to an empty
 * list, which is fail-secure: the guild-membership gate then denies access
 * rather than blocking the login indefinitely. */
export async function fetchUserGuilds(accessToken: string): Promise<DiscordGuild[]> {
  try {
    const res = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(GUILDS_FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? (data as DiscordGuild[]) : [];
  } catch {
    return [];
  }
}
