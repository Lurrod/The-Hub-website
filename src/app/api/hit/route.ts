import type { NextRequest } from "next/server";
import { recordHit } from "@/lib/analytics/record";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const ip =
      (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
    const userAgent = req.headers.get("user-agent") ?? "unknown";
    await recordHit({ ip, userAgent });
  } catch (err) {
    // Analytics must never break a page load; log and move on.
    console.error("analytics hit failed", err);
  }
  return new Response(null, { status: 204 });
}
