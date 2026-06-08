"use client";
import { useActionState } from "react";
import Link from "next/link";
import { saveProfile, type SaveResult } from "@/app/me/actions";
import { ROLES, AGENTS } from "@/lib/profile/schema";

interface Initial {
  bio: string;
  favorite_role: string;
  favorite_agent: string;
  twitch: string;
  twitter: string;
  youtube: string;
  vlr_url: string;
  tracker_url: string;
}

const input: React.CSSProperties = {
  background: "rgba(255,255,255,.05)",
  border: "1px solid var(--line)",
  borderRadius: 8,
  padding: "8px 12px",
  color: "var(--txt)",
  fontSize: 13,
  fontFamily: "inherit",
  width: "100%",
};

const btn: React.CSSProperties = {
  background: "linear-gradient(135deg,var(--red),#d8323f)",
  color: "#fff",
  border: "none",
  borderRadius: 999,
  padding: "9px 22px",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: ".5px",
          color: "var(--muted)",
          fontWeight: 700,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

export default function MeForm({
  initial,
  viewHref,
}: {
  initial: Initial;
  viewHref: string;
}) {
  const [state, action, pending] = useActionState<SaveResult | null, FormData>(
    saveProfile,
    null,
  );

  return (
    <form
      action={action}
      className="glass"
      style={{ padding: 24, display: "grid", gap: 14, maxWidth: 680 }}
    >
      <Field label="Bio">
        <textarea
          name="bio"
          defaultValue={initial.bio}
          maxLength={280}
          rows={3}
          style={input}
        />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Favorite role">
          <select name="favorite_role" defaultValue={initial.favorite_role} style={input}>
            <option value="">—</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Favorite agent">
          <select name="favorite_agent" defaultValue={initial.favorite_agent} style={input}>
            <option value="">—</option>
            {AGENTS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Twitch (handle)">
          <input name="twitch" defaultValue={initial.twitch} style={input} />
        </Field>
        <Field label="Twitter / X (handle)">
          <input name="twitter" defaultValue={initial.twitter} style={input} />
        </Field>
      </div>

      <Field label="YouTube (URL)">
        <input
          name="youtube"
          defaultValue={initial.youtube}
          placeholder="https://youtube.com/@…"
          style={input}
        />
      </Field>
      <Field label="VLR.gg (URL)">
        <input
          name="vlr_url"
          defaultValue={initial.vlr_url}
          placeholder="https://vlr.gg/player/…"
          style={input}
        />
      </Field>
      <Field label="Tracker.gg (URL)">
        <input
          name="tracker_url"
          defaultValue={initial.tracker_url}
          placeholder="https://tracker.gg/valorant/…"
          style={input}
        />
      </Field>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button type="submit" disabled={pending} style={btn}>
          {pending ? "Saving…" : "Save"}
        </button>
        <Link href={viewHref} style={{ color: "var(--muted)", fontSize: 13 }}>
          View my public profile →
        </Link>
        {state?.ok === true && (
          <span style={{ color: "var(--green)", fontSize: 13 }}>Saved ✓</span>
        )}
        {state?.ok === false && (
          <span style={{ color: "var(--red2)", fontSize: 13 }}>{state.error}</span>
        )}
      </div>
    </form>
  );
}
