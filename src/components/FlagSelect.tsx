"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
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
 *
 * Accessibility: the search box is an ARIA combobox controlling a listbox popup.
 * Arrow keys / Home / End move a virtual `aria-activedescendant` highlight,
 * Enter selects, Escape closes — full keyboard support without a native select.
 */
export default function FlagSelect({ name, defaultValue = "" }: { name: string; defaultValue?: string }) {
  const [code, setCode] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  const q = query.trim().toLowerCase();
  const options = useMemo(() => {
    const matches = q
      ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q)
      : COUNTRIES;
    return [{ code: "", name: "-" }, ...matches];
  }, [q]);

  const optId = (i: number) => `${listId}-opt-${i}`;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Scroll the highlighted option into view as it moves. (The index is reset to
  // 0 whenever the query changes, so it never runs past the filtered list.)
  useEffect(() => {
    if (!open) return;
    document.getElementById(optId(activeIndex))?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (next: string) => {
    setCode(next);
    setOpen(false);
    setQuery("");
    buttonRef.current?.focus();
  };

  const close = () => {
    setOpen(false);
    setQuery("");
    buttonRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
        e.preventDefault();
        if (options[activeIndex]) pick(options[activeIndex].code);
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
    }
  };

  // Toggle the popup. When opening, highlight the currently-selected country so
  // arrow keys start from the right place (done here, not in an effect).
  const toggle = () => {
    const next = !open;
    if (next) {
      const sel = [{ code: "" }, ...COUNTRIES].findIndex((o) => o.code === code);
      setActiveIndex(sel >= 0 ? sel : 0);
    }
    setOpen(next);
  };

  const selectedName = code ? countryName(code) : "";

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <input type="hidden" name={name} value={code} />
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={selectedName ? `Nationality: ${selectedName}` : "Select nationality"}
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
          style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 30,
            background: "#0c131c", border: "1px solid var(--line)", borderRadius: 8,
            padding: 6, boxShadow: "0 14px 40px rgba(0,0,0,.5)",
          }}
        >
          <input
            autoFocus
            role="combobox"
            aria-expanded
            aria-controls={listId}
            aria-activedescendant={optId(activeIndex)}
            aria-autocomplete="list"
            aria-label="Search country"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search country…"
            style={{ ...control, marginBottom: 6 }}
          />
          <div id={listId} role="listbox" aria-label="Countries" style={{ overflowY: "auto", maxHeight: 240 }}>
            {options.map((o, i) => (
              <Option
                key={o.code || "__clear"}
                id={optId(i)}
                code={o.code}
                label={o.name}
                selected={code === o.code}
                active={i === activeIndex}
                onPick={() => pick(o.code)}
                onHover={() => setActiveIndex(i)}
              />
            ))}
            {options.length === 1 && (
              <div style={{ padding: "8px 10px", color: "var(--muted)", fontSize: 12 }}>No match.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Option({ id, code, label, selected, active, onPick, onHover }: {
  id: string; code: string; label: string; selected: boolean; active: boolean;
  onPick: () => void; onHover: () => void;
}) {
  return (
    <div
      id={id}
      role="option"
      aria-selected={selected}
      onClick={onPick}
      onMouseMove={onHover}
      className="flag-opt"
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 8,
        padding: "7px 8px", borderRadius: 6, cursor: "pointer",
        background: active ? "rgba(46,230,212,.16)" : selected ? "rgba(255,255,255,.08)" : "transparent",
        color: "var(--txt)", fontSize: 13, fontFamily: "inherit", textAlign: "left",
      }}
    >
      {code ? <Flag code={code} /> : <span style={{ width: 22, flex: "0 0 auto" }} />}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
    </div>
  );
}
