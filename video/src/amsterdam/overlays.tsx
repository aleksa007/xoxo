import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT } from "../ui/fonts";
import { Icon } from "../ui/Cards";

const useLocalSec = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return { f, fps, s: f / fps };
};

/** Big red rubber-stamp that slams onto the screen. */
export const FailStamp: React.FC<{ at: number; text?: string; y?: number; color?: string; rotate?: number }> = ({
  at,
  text = "FAIL",
  y = 0.3,
  color = "#e63946",
  rotate = -12,
}) => {
  const { f, fps } = useLocalSec();
  const start = Math.round(at * fps);
  if (f < start) return null;
  const p = spring({ frame: f - start, fps, config: { damping: 9, stiffness: 320, mass: 0.6 } });
  const scale = interpolate(p, [0, 1], [2.6, 1]);
  const op = interpolate(f - start, [0, 3], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: `${y * 100}%`,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: op,
          transform: `translateY(-50%) rotate(${rotate}deg) scale(${scale})`,
        }}
      >
        <div
          style={{
            border: `14px solid ${color}`,
            borderRadius: 26,
            padding: "6px 40px",
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 150,
            letterSpacing: 8,
            color,
            background: "rgba(255,255,255,0.9)",
            boxShadow: "0 12px 0 rgba(0,0,0,0.35)",
          }}
        >
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** "This is a ___" naming card, with a little pointer. */
export const NameCard: React.FC<{ at: number; out?: number; title: string; sub?: string; y?: number; accent?: string }> = ({
  at,
  out,
  title,
  sub,
  y = 0.2,
  accent = "#ffd23f",
}) => {
  const { f, fps } = useLocalSec();
  const start = Math.round(at * fps);
  if (f < start) return null;
  if (out !== undefined && f > Math.round(out * fps) + 6) return null;
  const p = spring({ frame: f - start, fps, config: { damping: 12, stiffness: 220 } });
  const o = out !== undefined ? interpolate(f, [out * fps, out * fps + 6], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: `${y * 100}%`,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: o,
          transform: `translateY(${interpolate(p, [0, 1], [40, 0])}px) scale(${interpolate(p, [0, 1], [0.7, 1])})`,
        }}
      >
        <div
          style={{
            background: "linear-gradient(180deg, #232846 0%, #171a30 100%)",
            border: "6px solid #0d0f1c",
            borderRadius: 30,
            padding: "22px 46px",
            boxShadow: "0 12px 0 rgba(0,0,0,0.4)",
            textAlign: "center",
            fontFamily: FONT,
          }}
        >
          {sub ? <div style={{ fontWeight: 800, fontSize: 30, letterSpacing: 5, color: "#9aa3c7" }}>{sub}</div> : null}
          <div style={{ fontWeight: 900, fontSize: 70, color: accent, letterSpacing: 1, lineHeight: 1.1 }}>{title}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Vertical depth ruler on the left edge (0 → 12 m). */
export const DepthGauge: React.FC<{ value: number; show: number }> = ({ value, show }) => {
  if (show <= 0) return null;
  const ticks = Array.from({ length: 13 }).map((_, i) => i);
  const top = 360;
  const h = 1000;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: show }}>
      <div style={{ position: "absolute", left: 40, top, height: h, width: 16, background: "#11131f", borderRadius: 8, border: "4px solid #0a0b14" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: `${(value / 12) * 100}%`, background: "linear-gradient(180deg,#ffd23f,#ff9f1c)", borderRadius: 6 }} />
      </div>
      {ticks.map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 66,
            top: top + (i / 12) * h - 14,
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: i % 3 === 0 ? 30 : 0,
            color: "#fff",
            WebkitTextStroke: "6px #111",
            paintOrder: "stroke fill",
          }}
        >
          {i % 3 === 0 ? `${i}m` : ""}
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          left: 66,
          top: top + (value / 12) * h - 34,
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 56,
          color: "#ffd23f",
          WebkitTextStroke: "10px #111",
          paintOrder: "stroke fill",
        }}
      >
        {value.toFixed(0)}m
      </div>
    </AbsoluteFill>
  );
};

/** Big number that counts up (used for 13,659 and the years). */
export const Counter: React.FC<{
  from: number;
  to: number;
  start: number;
  end: number;
  y?: number;
  label?: string;
  format?: (n: number) => string;
  size?: number;
  color?: string;
}> = ({ from, to, start, end, y = 0.2, label, format = (n) => Math.round(n).toLocaleString("en-US"), size = 130, color = "#ffd23f" }) => {
  const { s, f, fps } = useLocalSec();
  if (s < start - 0.1) return null;
  const k = interpolate(s, [start, end], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const eased = 1 - Math.pow(1 - k, 2.2);
  const v = from + (to - from) * eased;
  const pop = spring({ frame: f - Math.round(end * fps), fps, config: { damping: 8, stiffness: 300 } });
  const sc = s >= end ? interpolate(pop, [0, 0.5, 1], [1, 1.18, 1]) : 1;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: `${y * 100}%`, left: 0, right: 0, textAlign: "center", transform: `scale(${sc})` }}>
        {label ? (
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 40, letterSpacing: 6, color: "#fff", WebkitTextStroke: "8px #111", paintOrder: "stroke fill" }}>{label}</div>
        ) : null}
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: size, color, WebkitTextStroke: `${size * 0.16}px #111`, paintOrder: "stroke fill", lineHeight: 1.05 }}>
          {format(v)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Small corner tag, e.g. "TRY 2" or "STEP 3". */
export const Tag: React.FC<{ at: number; text: string; color?: string; icon?: React.ComponentProps<typeof Icon>["name"] }> = ({
  at,
  text,
  color = "#ffd23f",
  icon,
}) => {
  const { f, fps } = useLocalSec();
  const start = Math.round(at * fps);
  if (f < start) return null;
  const p = spring({ frame: f - start, fps, config: { damping: 12, stiffness: 220 } });
  return (
    <div
      style={{
        position: "absolute",
        top: 250,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        transform: `scale(${interpolate(p, [0, 1], [0.3, 1])})`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: color,
          color: "#1c2140",
          border: "5px solid #11131f",
          borderRadius: 999,
          padding: "12px 34px",
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 44,
          letterSpacing: 2,
          boxShadow: "0 8px 0 rgba(0,0,0,0.45)",
          textTransform: "uppercase",
        }}
      >
        {icon ? <Icon name={icon} size={46} color="#1c2140" /> : null}
        {text}
      </div>
    </div>
  );
};

/** Faux tilt-shift: blur the top and bottom bands so sets read as miniatures. */
export const TiltShift: React.FC<{ amount?: number }> = ({ amount = 7 }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        height: "26%",
        backdropFilter: `blur(${amount}px)`,
        WebkitMaskImage: "linear-gradient(180deg, black 0%, transparent 100%)",
        maskImage: "linear-gradient(180deg, black 0%, transparent 100%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: "22%",
        backdropFilter: `blur(${amount}px)`,
        WebkitMaskImage: "linear-gradient(0deg, black 0%, transparent 100%)",
        maskImage: "linear-gradient(0deg, black 0%, transparent 100%)",
      }}
    />
  </AbsoluteFill>
);

/** Warm colour grade + vignette + subtle film grain-free glow. */
export const Grade: React.FC<{ warm?: number; vignette?: number }> = ({ warm = 0.12, vignette = 0.35 }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ background: `rgba(255,170,90,${warm})`, mixBlendMode: "soft-light" }} />
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 65% at 50% 45%, transparent 58%, rgba(10,8,30,${vignette}) 100%)` }} />
  </AbsoluteFill>
);

/** Comic sound-effect word (GLUG!, SLAM!, CRASH!). */
export const Sfx: React.FC<{ at: number; dur?: number; text: string; x: number; y: number; color?: string; rotate?: number; size?: number }> = ({
  at,
  dur = 0.7,
  text,
  x,
  y,
  color = "#ffd23f",
  rotate = -8,
  size = 96,
}) => {
  const { s, f, fps } = useLocalSec();
  if (s < at || s > at + dur) return null;
  const p = spring({ frame: f - Math.round(at * fps), fps, config: { damping: 8, stiffness: 380, mass: 0.5 } });
  const o = interpolate(s, [at + dur - 0.15, at + dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: `translate(-50%,-50%) rotate(${rotate}deg) scale(${interpolate(p, [0, 1], [0.2, 1])})`,
        opacity: o,
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: size,
        color,
        WebkitTextStroke: `${size * 0.18}px #111`,
        paintOrder: "stroke fill",
        textShadow: "0 8px 0 rgba(0,0,0,0.4)",
        pointerEvents: "none",
      }}
    >
      {text}
    </div>
  );
};
