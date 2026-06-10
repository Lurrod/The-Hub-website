"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); const v = q.trim(); if (v) router.push(`/search?q=${encodeURIComponent(v)}`); }}
      className="nav-search"
      role="search"
      style={{ display: "flex", gap: 6 }}
    >
      <label htmlFor="player-search" className="sr-only">Search player</label>
      <input
        id="player-search"
        type="search"
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search player…"
        style={{ background: "rgba(255,255,255,.05)", border: "1px solid var(--line)", borderRadius: 999, padding: "8px 16px", color: "var(--txt)", fontSize: 12, minWidth: 240 }}
      />
      <button
        type="submit"
        aria-label="Search"
        style={{ background: "rgba(255,255,255,.05)", border: "1px solid var(--line)", borderRadius: 999, padding: "8px 14px", color: "var(--txt)", fontSize: 12, cursor: "pointer", display: "inline-flex", alignItems: "center" }}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </button>
    </form>
  );
}
