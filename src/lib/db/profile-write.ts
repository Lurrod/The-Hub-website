import { getDb } from "./client";

export interface WebProfileWrite {
  bio: string;
  roles: string[];
  nationality: string;
  socials: { twitch?: string; twitter?: string; youtube?: string };
  vlr_url: string;
  tracker_url: string;
  date_of_birth: string;
  lft_enabled: boolean;
}

export interface DiscordIdentity {
  username: string;
  avatar: string | null;
}

/** Upsert the web_profiles doc for `userId`. The ONLY DB write in the app. */
export async function updateWebProfile(
  userId: string,
  data: WebProfileWrite,
  identity: DiscordIdentity,
): Promise<void> {
  const db = await getDb();
  const coll = db.collection<{ _id: string; lft_enabled?: boolean }>("web_profiles");

  const existing = await coll.findOne(
    { _id: userId },
    { projection: { lft_enabled: 1 } },
  );
  const wasLft = existing?.lft_enabled === true;

  const set: Record<string, unknown> = {
    bio: data.bio,
    roles: data.roles,
    nationality: data.nationality,
    socials: data.socials,
    vlr_url: data.vlr_url,
    tracker_url: data.tracker_url,
    lft_enabled: data.lft_enabled,
    discord_username: identity.username,
    discord_avatar: identity.avatar,
    updated_at: new Date(),
  };
  // Only stamp the LFT timestamp on a fresh opt-in so listings sort by it.
  if (data.lft_enabled && !wasLft) set.lft_updated_at = new Date();

  // Legacy single-role field is always dropped on re-save.
  const unset: Record<string, ""> = { favorite_role: "" };
  if (data.date_of_birth) set.date_of_birth = data.date_of_birth;
  else unset.date_of_birth = "";

  await coll.updateOne({ _id: userId }, { $set: set, $unset: unset }, { upsert: true });
}

/**
 * Refresh ONLY the Discord identity (username + avatar) for `userId`, leaving
 * any other web_profile fields untouched. Called on every login so a player's
 * avatar stays current even if they never re-save their /me profile. Upserts so
 * first-time logins still get an avatar on record.
 */
export async function syncDiscordIdentity(
  userId: string,
  identity: DiscordIdentity,
): Promise<void> {
  if (!userId) return;
  const db = await getDb();
  await db.collection<{ _id: string }>("web_profiles").updateOne(
    { _id: userId },
    { $set: { discord_username: identity.username, discord_avatar: identity.avatar, last_seen: new Date() } },
    { upsert: true },
  );
}
