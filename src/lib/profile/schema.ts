import { z } from "zod";
import { isCountryCode } from "./countries";

export const ROLES = ["Duelist", "Initiator", "Controller", "Sentinel", "Flex"] as const;

const nationality = z
  .string()
  .trim()
  .refine((v) => v === "" || isCountryCode(v), { message: "unknown country" });

const handle = z
  .string()
  .trim()
  .max(50)
  .regex(/^[A-Za-z0-9_.]*$/, "letters, digits, _ and . only")
  .or(z.literal(""));

function urlOnDomain(domains: string[]) {
  return z
    .string()
    .trim()
    .max(300)
    .refine(
      (v) => {
        if (v === "") return true;
        try {
          const u = new URL(v);
          return u.protocol === "https:" && domains.some((d) => u.hostname === d || u.hostname.endsWith(`.${d}`));
        } catch {
          return false;
        }
      },
      { message: "invalid or off-domain URL" },
    )
    .or(z.literal(""));
}

export const profileSchema = z.object({
  bio: z.string().trim().max(280).optional().default(""),
  // Players can pick several roles (incl. "Flex"). Deduped, order-preserving.
  roles: z
    .array(z.enum(ROLES))
    .max(20)
    .optional()
    .default([])
    .transform((arr) => [...new Set(arr)]),
  nationality: nationality.optional().default(""),
  twitch: handle.optional().default(""),
  twitter: handle.optional().default(""),
  youtube: urlOnDomain(["youtube.com", "youtu.be"]).optional().default(""),
  vlr_url: urlOnDomain(["vlr.gg"]).optional().default(""),
  tracker_url: urlOnDomain(["tracker.gg"]).optional().default(""),
});

export type ProfileInput = z.infer<typeof profileSchema>;
