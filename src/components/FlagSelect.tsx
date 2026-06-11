"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { COUNTRIES, flagUrl, countryName } from "@/lib/profile/countries";

/** flagcdn flag image for a country code, sized for inline use in the list. */
function Flag({ code }: { code: string }) {
  return (
    <Image
      src={flagUrl(code)}
      alt=""
      width={22}
      height={16}
      style={{ borderRadius: 2, objectFit: "cover", flex: "0 0 auto", boxShadow: "0 0 0 1px rgba(255,255,255,.12)" }}
    />
  );
}

const control: React.CSSProperties = {
  background: "rgba(255,255,255,.05)",
  border: "1px solid var(--line)",
  borderRadius: 8,
  padding: "8px 12px",
  color: "var(--txt)",
  fontSize: 13,
  fontFamily: "inherit",
  width: "100%",
};

/**
 * Nationality picker that shows flagcdn flag images (a native <select> can only
 * render text, so flag emoji fell back to the bare 2-letter code on Windows).
 * A hidden input carries the selected code so the surrounding <form> submits it.
 */
export default function FlagSelect({ name, defaultValue = "" }: { name: string; defaultValue?: string }) {
  const [code, setCode] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q)
    : COUNTRIES;

  const pick = (next: string) => { setCode(next); setOpen(false); setQuery(""); };
  const selectedName = code ? countryName(code) : "";

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <input type="hidden" name={name} value={code} />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{ ...control, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", textAlign: "left" }}
      >
        {code && <Flag code={code} />}
        <span style={{ color: code ? "var(--txt)" : "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selectedName || "-"}
        </span>
        <span aria-hidden style={{ marginLeft: "auto", color: "var(--muted)", flex: "0 0 auto" }}>▾</span>
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 30,
            background: "#0c131c", border: "1px solid var(--line)", borderRadius: 8,
            padding: 6, boxShadow: "0 14px 40px rgba(0,0,0,.5)",
          }}
        >
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search country…"
            style={{ ...control, marginBottom: 6 }}
          />
          <div style={{ overflowY: "auto", maxHeight: 240 }}>
            <Option code="" label="-" selected={code === ""} onPick={() => pick("")} />
            {filtered.map((c) => (
              <Option key={c.code} code={c.code} label={c.name} selected={code === c.code} onPick={() => pick(c.code)} />
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: "8px 10px", color: "var(--muted)", fontSize: 12 }}>No match.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Option({ code, label, selected, onPick }: {
  code: string; label: string; selected: boolean; onPick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onPick}
      className="flag-opt"
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 8,
        padding: "7px 8px", borderRadius: 6, border: "none", cursor: "pointer",
        background: selected ? "rgba(255,255,255,.08)" : "transparent",
        color: "var(--txt)", fontSize: 13, fontFamily: "inherit", textAlign: "left",
      }}
    >
      {code ? <Flag code={code} /> : <span style={{ width: 22, flex: "0 0 auto" }} />}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
    </button>
  );
}
