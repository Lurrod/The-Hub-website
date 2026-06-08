"use client";
import { useRef, useState, useEffect, type ReactNode } from "react";

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={dir === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
    </svg>
  );
}

/** Horizontal strip of match cards. The card strip spans the full content
 * width; when it overflows, glass arrows appear in the page margins just
 * OUTSIDE the strip (left/right of the main column). */
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

  const arrowPos = (side: "left" | "right"): React.CSSProperties => ({
    position: "absolute", top: "50%", transform: "translateY(-50%)", zIndex: 3,
    ...(side === "left" ? { left: -50 } : { right: -50 }),
  });

  return (
    <div style={{ position: "relative" }}>
      {overflow && (
        <button aria-label="Scroll left" className="slide-arrow" style={arrowPos("left")} onClick={() => scroll(-1)}>
          <Chevron dir="left" />
        </button>
      )}
      <div
        ref={ref}
        className="noscrollbar"
        style={{ display: "flex", gap: 12, overflowX: "auto", scrollBehavior: "smooth" }}
      >
        {children}
      </div>
      {overflow && (
        <button aria-label="Scroll right" className="slide-arrow" style={arrowPos("right")} onClick={() => scroll(1)}>
          <Chevron dir="right" />
        </button>
      )}
    </div>
  );
}
