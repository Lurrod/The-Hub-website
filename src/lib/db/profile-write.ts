import { getDb } from "./client";

export interface WebProfileWrite {
  bio: string;
  favorite_role: string;
  nationality: string;
  socials: { twitch?: string; twitter?: string; youtube?: string };
  vlr_url: string;
  tracker_url: string;
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
  await db.collection<{ _id: string }>("web_profiles").updateOne(
    { _id: userId },
    {
      $set: {
        bio: data.bio,
        favorite_role: data.favorite_role,
        nationality: data.nationality,
        socials: data.socials,
        vlr_url: data.vlr_url,
        tracker_url: data.tracker_url,
        discord_username: identity.username,
        discord_avatar: identity.avatar,
        updated_at: new Date(),
      },
    },
    { upsert: true },
  );
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
    { $set: { discord_username: identity.username, discord_avatar: identity.avatar } },
    { upsert: true },
  );
}
