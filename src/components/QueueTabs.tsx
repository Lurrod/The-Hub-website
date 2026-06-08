import Link from "next/link";
import { QUEUE_TYPES, QUEUE_LABELS, type QueueType } from "@/lib/db/types";

export default function QueueTabs({ active, basePath }: { active: QueueType; basePath: string }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
      {QUEUE_TYPES.map((q) => {
        const on = q === active;
        return (
          <Link key={q} href={`${basePath}?queue=${q}`} style={{
            fontSize: 12, fontWeight: 700, padding: "9px 16px", borderRadius: 999, textDecoration: "none",
            color: on ? "#fff" : "var(--muted)",
            background: on ? "linear-gradient(135deg,var(--red),#d8323f)" : "rgba(255,255,255,.06)",
            border: on ? "1px solid transparent" : "1px solid var(--line)",
          }}>{QUEUE_LABELS[q]}</Link>
        );
      })}
    </div>
  );
}
