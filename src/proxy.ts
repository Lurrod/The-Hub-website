import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Centralised route protection. NextAuth's `auth` wrapper runs the edge-safe
// `authorized` callback for every matched path and redirects unauthenticated
// users to the sign-in page. mongodb is never imported here, so this bundles
// for the middleware runtime.
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  // Guard the owner dashboard and the profile editor. Other routes are public.
  matcher: ["/admin/:path*", "/me"],
};
