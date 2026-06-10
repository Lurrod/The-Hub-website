export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{ display: "grid", placeItems: "center", minHeight: "40vh", color: "var(--muted)" }}
    >
      <span
        aria-hidden
        data-spinner
        style={{
          width: 32, height: 32, borderRadius: "50%",
          border: "3px solid var(--line)", borderTopColor: "var(--gold)",
          animation: "spin 0.7s linear infinite",
        }}
      />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
