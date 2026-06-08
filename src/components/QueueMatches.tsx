"use client";
import { useRef, useState, useEffect, type ReactNode } from "react";

function arrowStyle(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute", top: "50%", transform: "translateY(-50%)",
    ...(side === "left" ? { left: 0 } : { right: 0 }),
    width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--line)",
    background: "rgba(10,15,20,.7)", color: "var(--txt)", cursor: "pointer",
    fontSize: 18, lineHeight: "1", display: "grid", placeItems: "center", zIndex: 2,
    backdropFilter: "blur(6px)",
  };
}

/** Horizontal strip of match cards with prev/next arrows shown only when the
 * content overflows the page width. */
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
        style={{ display: "flex", gap: 12, overflowX: "auto", scrollBehavior: "smooth", padding: overflow ? "0 36px" : 0 }}
      >
        {children}
      </div>
      {overflow && (
        <>
          <button aria-label="Scroll left" onClick={() => scroll(-1)} style={arrowStyle("left")}>‹</button>
          <button aria-label="Scroll right" onClick={() => scroll(1)} style={arrowStyle("right")}>›</button>
        </>
      )}
    </div>
  );
}
