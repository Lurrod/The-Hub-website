"use server";
import { auth } from "@/auth";
import { profileSchema } from "@/lib/profile/schema";
import { updateWebProfile } from "@/lib/db/profile-write";
import { revalidatePath } from "next/cache";

export type SaveResult = { ok: true } | { ok: false; error: string };

export async function saveProfile(
  _prev: SaveResult | null,
  formData: FormData,
): Promise<SaveResult> {
  const session = await auth();
  if (!session?.discordId) return { ok: false, error: "Not signed in." };

  const parsed = profileSchema.safeParse({
    bio: formData.get("bio") ?? "",
    favorite_role: formData.get("favorite_role") ?? "",
    favorite_agent: formData.get("favorite_agent") ?? "",
    twitch: formData.get("twitch") ?? "",
    twitter: formData.get("twitter") ?? "",
    youtube: formData.get("youtube") ?? "",
    vlr_url: formData.get("vlr_url") ?? "",
    tracker_url: formData.get("tracker_url") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const d = parsed.data;
  await updateWebProfile(
    session.discordId,
    {
      bio: d.bio,
      favorite_role: d.favorite_role,
      favorite_agent: d.favorite_agent,
      socials: {
        twitch: d.twitch || undefined,
        twitter: d.twitter || undefined,
        youtube: d.youtube || undefined,
      },
      vlr_url: d.vlr_url,
      tracker_url: d.tracker_url,
    },
    { username: session.username, avatar: session.avatar },
  );
  revalidatePath(`/player/${session.discordId}`);
  revalidatePath("/me");
  return { ok: true };
}
