import { getDb } from "./client";

export interface WebProfileWrite {
  bio: string;
  favorite_role: string;
  favorite_agent: string;
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
        favorite_agent: data.favorite_agent,
        favorite_role: data.favorite_role,
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
