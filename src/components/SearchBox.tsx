"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); const v = q.trim(); if (v) router.push(`/search?q=${encodeURIComponent(v)}`); }}
      style={{ display: "flex" }}
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="🔍  Search player…"
        style={{ background: "rgba(255,255,255,.05)", border: "1px solid var(--line)", borderRadius: 999, padding: "8px 16px", color: "var(--txt)", fontSize: 12, minWidth: 240 }}
      />
    </form>
  );
}
