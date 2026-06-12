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
    roles: formData.getAll("roles"),
    nationality: formData.get("nationality") ?? "",
    twitch: formData.get("twitch") ?? "",
    twitter: formData.get("twitter") ?? "",
    youtube: formData.get("youtube") ?? "",
    vlr_url: formData.get("vlr_url") ?? "",
    tracker_url: formData.get("tracker_url") ?? "",
    date_of_birth: formData.get("date_of_birth") ?? "",
    lft_enabled: formData.get("lft_enabled") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const d = parsed.data;
  await updateWebProfile(
    session.discordId,
    {
      bio: d.bio,
      roles: d.roles,
      nationality: d.nationality,
      socials: {
        twitch: d.twitch || undefined,
        twitter: d.twitter || undefined,
        youtube: d.youtube || undefined,
      },
      vlr_url: d.vlr_url,
      tracker_url: d.tracker_url,
      date_of_birth: d.date_of_birth,
      lft_enabled: d.lft_enabled,
    },
    { username: session.username, avatar: session.avatar },
  );
  revalidatePath(`/player/${session.discordId}`);
  revalidatePath("/me");
  return { ok: true };
}
