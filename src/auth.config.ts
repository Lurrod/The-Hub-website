import type { NextAuthConfig } from "next-auth";
import Discord from "next-auth/providers/discord";

// Edge-safe Auth.js config used by the middleware. It deliberately contains NO
// Node-only imports (no mongodb, no guild fetch) so it can run in the lightweight
// middleware runtime. The full config in `auth.ts` layers the DB-backed callbacks
// and events on top of this. `authorized` is the route gate: it runs on every
// matched request and decides whether to allow it or redirect to sign-in.
export const authConfig = {
  providers: [Discord],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;
      // Defense in depth: the pages themselves also call auth(), but this
      // guarantees a protected route is never reachable without a session even
      // if a future page forgets its own check.
      if (path.startsWith("/admin") || path === "/me") {
        return isLoggedIn;
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
