import type { NextRequest } from "next/server";
import { recordHit } from "@/lib/analytics/record";
import { clientIpFromForwardedFor } from "@/lib/analytics/client-ip";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Use the rightmost (trusted-proxy) X-Forwarded-For hop: the leftmost value
    // is client-controllable and could be rotated to forge unique visitors.
    const ip = clientIpFromForwardedFor(req.headers.get("x-forwarded-for"));
    const userAgent = req.headers.get("user-agent") ?? "unknown";
    await recordHit({ ip, userAgent });
  } catch (err) {
    // Analytics must never break a page load; log and move on.
    console.error("analytics hit failed", err);
  }
  return new Response(null, { status: 204 });
}
