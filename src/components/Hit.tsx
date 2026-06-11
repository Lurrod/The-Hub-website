"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Fire-and-forget cookieless page-view beacon. Sends on each route change. */
export function Hit(): null {
  const pathname = usePathname();
  useEffect(() => {
    try {
      navigator.sendBeacon("/api/hit");
    } catch {
      // sendBeacon unsupported / blocked — ignore, analytics is best-effort.
    }
  }, [pathname]);
  return null;
}
