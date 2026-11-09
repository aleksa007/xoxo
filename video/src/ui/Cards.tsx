import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT } from "./fonts";

/* Flat infographic UI in the "you vs the world" style: chunky dark panels,
   bright accent bars, all-caps labels. */

const usePop = (at: number, out?: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: { damping: 12, stiffness: 200, mass: 0.7 } });
  const o = out !== undefined ? interpolate(frame, [out, out + 6], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  return { p, o, visible: frame >= at };
};

export const Icon: React.FC<{ name: "pin" | "snow" | "plane" | "warn" | "cross" | "therm"; size?: number; color?: string }> = ({
  name,
  size = 44,
  color = "#fff",
}) => {
  const s = { width: size, height: size, display: "block" } as const;
  switch (name) {
    case "pin":
      return (
        <svg viewBox="0 0 24 24" style={s}>
          <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7z" fill={color} />
          <circle cx="12" cy="9" r="2.6" fill="#1c2140" />
        </svg>
      );
    case "snow":
      return (
        <svg viewBox="0 0 24 24" style={s} stroke={color} strokeWidth={2.4} strokeLinecap="round" fill="none">
          <path d="M12 2v20M3.3 7l17.4 10M3.3 17l17.4-10M9 4l3 3 3-3M9 20l3-3 3 3" />
        </svg>
      );
    case "plane":
      return (
        <svg viewBox="0 0 24 24" style={s}>
          <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" fill={color} />
        </svg>
      );
    case "warn":
      return (
        <svg viewBox="0 0 24 24" style={s}>
          <path d="M12 2 1 21h22z" fill={color} />
          <path d="M12 9v5" stroke="#1c2140" strokeWidth={2.6} strokeLinecap="round" />
          <circle cx="12" cy="17.5" r="1.4" fill="#1c2140" />
        </svg>
      );
    case "cross":
      return (
        <svg viewBox="0 0 24 24" style={s}>
          <path d="M10 2h4v6h6v4h-6v10h-4V12H4V8h6z" fill={color} />
        </svg>
      );
    case "therm":
      return (
        <svg viewBox="0 0 24 24" style={s}>
          <path d="M10 3a2 2 0 0 1 4 0v10.3a4.5 4.5 0 1 1-4 0z" fill={color} />
          <circle cx="12" cy="17" r="2.4" fill="#3de0ff" />
          <rect x="11" y="8" width="2" height="8" rx="1" fill="#3de0ff" />
        </svg>
      );
  }
};

export const Pill: React.FC<{
  at: number;
  out?: number;
  x?: number | "center";
  y: number;
  bg?: string;
  color?: string;
  icon?: React.ComponentProps<typeof Icon>["name"];
  children: React.ReactNode;
  size?: number;
}> = ({ at, out, x = "center", y, bg = "#ff9f1c", color = "#1c2140", icon, children, size = 44 }) => {
  const { p, o, visible } = usePop(at, out);
  if (!visible) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: x === "center" ? 0 : x,
        right: x === "center" ? 0 : undefined,
        display: "flex",
        justifyContent: x === "center" ? "center" : "flex-start",
        opacity: o,
        transform: `scale(${interpolate(p, [0, 1], [0.3, 1])})`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: `${size * 0.38}px ${size * 0.7}px`,
          background: bg,
          color,
          borderRadius: 999,
          border: "5px solid #11131f",
          boxShadow: "0 8px 0 rgba(0,0,0,0.45)",
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: size,
          letterSpacing: 1,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        {icon ? <Icon name={icon} size={size * 1.05} color={color} /> : null}
        {children}
      </div>
    </div>
  );
};

export const Panel: React.FC<{
  at: number;
  out?: number;
  y: number;
  width?: number;
  children: React.ReactNode;
}> = ({ at, out, y, width = 860, children }) => {
  const { p, o, visible } = usePop(at, out);
  if (!visible) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: (1080 - width) / 2,
        width,
        opacity: o,
        transform: `translateY(${interpolate(p, [0, 1], [60, 0])}px) scale(${interpolate(p, [0, 1], [0.85, 1])})`,
        background: "linear-gradient(180deg, #232846 0%, #181c33 100%)",
        border: "6px solid #0d0f1c",
        borderRadius: 34,
        boxShadow: "0 14px 0 rgba(0,0,0,0.45), inset 0 3px 0 rgba(255,255,255,0.12)",
        padding: "30px 36px",
        fontFamily: FONT,
        color: "#fff",
      }}
    >
      {children}
    </div>
  );
};

export const Stat: React.FC<{ label: string; value: string; accent: string }> = ({ label, value, accent }) => (
  <div
    style={{
      flex: 1,
      background: "#0f1226",
      borderRadius: 20,
      border: "4px solid #0a0b16",
      padding: "16px 18px",
      textAlign: "center",
    }}
  >
    <div style={{ fontWeight: 900, fontSize: 52, color: accent, lineHeight: 1.05 }}>{value}</div>
    <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: 2, color: "#9aa3c7", marginTop: 6 }}>{label}</div>
  </div>
);

export const PollBar: React.FC<{ label: string; pct: number; color: string; at: number }> = ({ label, pct, color, at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: { damping: 20, stiffness: 60 } });
  const shown = Math.round(pct * p);
  return (
    <div
      style={{
        position: "relative",
        height: 92,
        borderRadius: 20,
        background: "#0f1226",
        border: "4px solid #0a0b16",
        overflow: "hidden",
        marginTop: 18,
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct * p}%`, background: color, borderRadius: 14 }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 26px",
          fontWeight: 900,
          fontSize: 38,
          textShadow: "0 3px 0 rgba(0,0,0,0.5)",
        }}
      >
        <span>{label}</span>
        <span>{shown}%</span>
      </div>
    </div>
  );
};
