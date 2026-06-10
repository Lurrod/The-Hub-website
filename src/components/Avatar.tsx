import Image from "next/image";
import { initials } from "./ui";

export default function Avatar({ name, size = 36, src }: { name: string; size?: number; src?: string | null }) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        sizes={`${size}px`}
        style={{
          borderRadius: "50%", flex: "0 0 auto", display: "block",
          objectFit: "cover", border: "1px solid var(--line)",
        }}
      />
    );
  }
  return (
    <div
      aria-hidden
      style={{
        width: size, height: size, borderRadius: "50%", flex: "0 0 auto",
        display: "grid", placeItems: "center",
        background: "linear-gradient(135deg,#3a5a72,#0e1620)",
        border: "1px solid var(--line)", color: "var(--txt)",
        fontWeight: 700, fontSize: size * 0.4, fontFamily: "var(--font-teko)",
      }}
    >
      {initials(name)}
    </div>
  );
}
