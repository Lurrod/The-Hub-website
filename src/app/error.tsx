"use client";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error in the browser console for debugging; the digest
    // ties it to the server log entry without leaking details to the UI.
    console.error(error);
  }, [error]);

  return (
    <div className="glass" style={{ padding: 32, marginTop: 24, textAlign: "center", maxWidth: 560, marginInline: "auto" }}>
      <h1 className="teko" style={{ fontFamily: "var(--font-teko)", fontSize: 40, margin: "0 0 8px" }}>
        Something went wrong
      </h1>
      <p style={{ color: "var(--muted)", margin: "0 0 20px" }}>
        An unexpected error occurred. You can try again.
      </p>
      <button
        type="button"
        onClick={reset}
        style={{
          background: "linear-gradient(135deg,var(--red),#d8323f)", color: "#fff", border: "none",
          borderRadius: 999, padding: "10px 22px", fontWeight: 700, fontSize: 13, cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}
