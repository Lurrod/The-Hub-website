import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="glass" style={{ padding: 32, marginTop: 24, textAlign: "center", maxWidth: 560, marginInline: "auto" }}>
      <h1 className="teko" style={{ fontFamily: "var(--font-teko)", fontSize: 56, margin: "0 0 4px", color: "var(--gold)" }}>
        404
      </h1>
      <p style={{ color: "var(--muted)", margin: "0 0 20px" }}>
        This page could not be found.
      </p>
      <Link
        href="/"
        style={{
          display: "inline-block", background: "rgba(255,255,255,.07)", border: "1px solid var(--line)",
          borderRadius: 999, padding: "10px 22px", fontWeight: 700, fontSize: 13, color: "var(--txt)", textDecoration: "none",
        }}
      >
        Back to home
      </Link>
    </div>
  );
}
