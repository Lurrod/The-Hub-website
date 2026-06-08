"use client";
import { useRef, useState, useEffect, type ReactNode } from "react";

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={dir === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
    </svg>
  );
}

/** Horizontal strip of match cards with original slide arrows + edge fades,
 * shown only when the content overflows the page width. */
export default function QueueMatches({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setOverflow(el.scrollWidth > el.clientWidth + 4);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children]);

  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 280, behavior: "smooth" });

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={ref}
        className="noscrollbar"
        style={{ display: "flex", gap: 12, overflowX: "auto", scrollBehavior: "smooth", padding: overflow ? "0 42px" : 0 }}
      >
        {children}
      </div>
      {overflow && (
        <>
          <div className="edge-fade left" />
          <div className="edge-fade right" />
          <button aria-label="Scroll left" className="slide-arrow" style={{ left: 0 }} onClick={() => scroll(-1)}>
            <Chevron dir="left" />
          </button>
          <button aria-label="Scroll right" className="slide-arrow" style={{ right: 0 }} onClick={() => scroll(1)}>
            <Chevron dir="right" />
          </button>
        </>
      )}
    </div>
  );
}
