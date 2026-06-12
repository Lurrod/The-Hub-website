"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { saveProfile, type SaveResult } from "@/app/me/actions";
import { ROLES } from "@/lib/profile/schema";
import FlagSelect from "@/components/FlagSelect";

interface Initial {
  bio: string;
  roles: string[];
  nationality: string;
  twitch: string;
  twitter: string;
  youtube: string;
  vlr_url: string;
  tracker_url: string;
  date_of_birth: string;
  lft_enabled: boolean;
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

const fieldLabel: React.CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: ".5px",
  color: "var(--muted)",
  fontWeight: 700,
};

const roleChip: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "7px 12px",
  borderRadius: 999,
  border: "1px solid var(--line)",
  background: "rgba(255,255,255,.05)",
  color: "var(--muted)",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  userSelect: "none",
  position: "relative",
  transition: "border-color .15s ease, background .15s ease, color .15s ease",
};

const roleChipOn: React.CSSProperties = {
  borderColor: "var(--red)",
  background: "rgba(217,50,63,.18)",
  color: "var(--txt)",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

/**
 * Multi-select roles as toggle chips. Each chip is a styled checkbox named
 * "roles" so the server action reads them with formData.getAll("roles").
 * "Flex" has no role icon — render its label only.
 */
function RolesPicker({ initialRoles }: { initialRoles: string[] }) {
  const allowed = new Set<string>(ROLES);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialRoles.filter((r) => allowed.has(r))),
  );

  const toggle = (role: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });

  return (
    <div role="group" aria-label="Roles" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {ROLES.map((r) => {
        const on = selected.has(r);
        return (
          <label key={r} style={{ ...roleChip, ...(on ? roleChipOn : null) }}>
            <input
              type="checkbox"
              name="roles"
              value={r}
              checked={on}
              onChange={() => toggle(r)}
              style={{ position: "absolute", width: 1, height: 1, opacity: 0, margin: 0 }}
            />
            {r !== "Flex" && (
              <Image
                src={`/roles/${r.toLowerCase()}.png`}
                alt=""
                aria-hidden
                width={16}
                height={16}
                style={{ display: "block", objectFit: "contain" }}
              />
            )}
            <span>{r}</span>
          </label>
        );
      })}
    </div>
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

  // error-state-shake: shake the Save button + reveal the message when the
  // server action returns a validation error, then auto-revert on a hold timer.
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const errRef = useRef<HTMLParagraphElement>(null);
  // Dérivé du résultat de l'action serveur — pas de setState dans l'effect.
  const errorMsg = state && state.ok === false ? state.error : "";

  useEffect(() => {
    if (!state) return;
    const wrap = wrapRef.current;
    const btn = btnRef.current;
    if (state.ok === false) {
      if (!wrap || !btn) return;
      wrap.classList.add("is-error");
      btn.classList.remove("is-shaking");
      void btn.offsetWidth; // force reflow so the shake replays
      btn.classList.add("is-shaking");
      // Move focus to the error so keyboard/screen-reader users are taken to it
      // (role="alert" also announces it). Focus, then the visual shake plays.
      errRef.current?.focus();

      const cs = getComputedStyle(document.documentElement);
      const ms = (name: string, fb: number) => {
        const v = parseFloat(cs.getPropertyValue(name));
        return Number.isFinite(v) ? v : fb;
      };
      const shakeMs = ms("--shake-dur-a", 80) * 2 + ms("--shake-dur-b", 60) * 2;
      const t1 = setTimeout(() => btn.classList.remove("is-shaking"), shakeMs + 20);
      const t2 = setTimeout(
        () => wrap.classList.remove("is-error"),
        shakeMs + ms("--revert-hold", 3000),
      );
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
    wrap?.classList.remove("is-error");
  }, [state]);

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

      <div style={{ display: "grid", gap: 6 }}>
        <span style={fieldLabel}>Roles</span>
        <RolesPicker initialRoles={initial.roles} />
      </div>

      <Field label="Nationality">
        <FlagSelect name="nationality" defaultValue={initial.nationality} />
      </Field>

      <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
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

      <Field label="Date of birth (only your age is shown publicly)">
        <input
          type="date"
          name="date_of_birth"
          defaultValue={initial.date_of_birth}
          max="9999-12-31"
          style={input}
        />
      </Field>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <input
          type="checkbox"
          name="lft_enabled"
          defaultChecked={initial.lft_enabled}
          style={{ width: 16, height: 16, accentColor: "var(--red)" }}
        />
        <span style={{ ...fieldLabel, textTransform: "none", letterSpacing: 0, fontSize: 13 }}>
          Looking For Team (LFT) — show me on the LFT page
        </span>
      </label>

      <div ref={wrapRef} className="t-input-wrap">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button ref={btnRef} type="submit" disabled={pending} className="t-input" style={btn}>
            {pending ? "Saving…" : "Save"}
          </button>
          <Link href={viewHref} style={{ color: "var(--muted)", fontSize: 13 }}>
            View my public profile →
          </Link>
          {state?.ok === true && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--green)", fontSize: 13 }}>
              <span className="t-success-check" data-state="in" aria-hidden="true" style={{ width: 18, height: 18 }}>
                <svg viewBox="0 0 48 48" fill="none" width="18" height="18">
                  <path
                    d="M13 24 l7 7 l15 -16"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ strokeDasharray: 33, strokeDashoffset: 33 }}
                  />
                </svg>
              </span>
              Saved
            </span>
          )}
        </div>
        <p
          ref={errRef}
          className="t-error-msg"
          role="alert"
          aria-live="assertive"
          tabIndex={-1}
          style={{ margin: "8px 0 0", color: "var(--red2)", fontSize: 13, outline: "none" }}
        >
          {errorMsg}
        </p>
      </div>
    </form>
  );
}
