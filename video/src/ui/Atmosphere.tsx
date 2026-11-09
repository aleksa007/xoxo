import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { rand } from "../three/cel";
import { FONT } from "./fonts";

const W = 1080;
const H = 1920;

/** Gradient sky that sits behind the transparent WebGL canvas. */
export const Sky: React.FC<{
  top: string;
  bottom: string;
  stars?: boolean;
  aurora?: boolean;
  glow?: { x: number; y: number; color: string; r?: number };
}> = ({ top, bottom, stars, aurora, glow }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${top} 0%, ${bottom} 62%)` }}>
      {glow ? (
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at ${glow.x * 100}% ${glow.y * 100}%, ${glow.color} 0%, transparent ${glow.r ?? 40}%)`,
          }}
        />
      ) : null}
      {stars ? (
        <svg width={W} height={H} style={{ position: "absolute" }}>
          {Array.from({ length: 90 }).map((_, i) => {
            const tw = 0.55 + 0.45 * Math.sin(frame / 8 + i * 1.7);
            return (
              <circle
                key={i}
                cx={rand(i + 0.5) * W}
                cy={rand(i + 9.1) * H * 0.55}
                r={1.2 + rand(i + 3.3) * 2.6}
                fill="#ffffff"
                opacity={0.25 + 0.6 * tw * rand(i + 4.4)}
              />
            );
          })}
        </svg>
      ) : null}
      {aurora ? <Aurora frame={frame} /> : null}
    </AbsoluteFill>
  );
};

const curtain = (base: number, amp: number, k: number, phase: number, height: number) => {
  const pts: string[] = [];
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const x = -100 + (i / steps) * (W + 200);
    const y = base + Math.sin(x * k + phase) * amp + Math.sin(x * k * 2.7 + phase * 1.3) * amp * 0.35;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const top = pts
    .slice()
    .reverse()
    .map((p) => {
      const [x, y] = p.split(",").map(Number);
      return `${x.toFixed(1)},${(y - height).toFixed(1)}`;
    });
  return `M${pts.join(" L")} L${top.join(" L")} Z`;
};

const Aurora: React.FC<{ frame: number }> = ({ frame }) => {
  const bands = [
    { base: 620, amp: 70, k: 0.006, sp: 0.03, h: 360, c: "#4dffb0", o: 0.55 },
    { base: 520, amp: 90, k: 0.0045, sp: -0.022, h: 300, c: "#3de0ff", o: 0.4 },
    { base: 760, amp: 60, k: 0.008, sp: 0.026, h: 260, c: "#9b7bff", o: 0.3 },
  ];
  return (
    <svg width={W} height={H} style={{ position: "absolute", filter: "blur(18px)" }}>
      <defs>
        {bands.map((b, i) => (
          <linearGradient key={i} id={`au${i}`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={b.c} stopOpacity={0} />
            <stop offset="12%" stopColor={b.c} stopOpacity={b.o} />
            <stop offset="100%" stopColor={b.c} stopOpacity={0} />
          </linearGradient>
        ))}
      </defs>
      {bands.map((b, i) => (
        <path key={i} d={curtain(b.base, b.amp, b.k, frame * b.sp + i * 2, b.h)} fill={`url(#au${i})`} />
      ))}
    </svg>
  );
};

/** Screen-space snowfall in three parallax layers. */
export const Snowfall: React.FC<{ count?: number; speed?: number; opacity?: number }> = ({
  count = 110,
  speed = 1,
  opacity = 0.9,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={W} height={H}>
        {Array.from({ length: count }).map((_, i) => {
          const layer = i % 3;
          const r = [3, 5.5, 9][layer] * (0.7 + rand(i * 1.3) * 0.6);
          const v = [1.6, 2.8, 4.6][layer] * speed;
          const y = ((rand(i * 2.1) * (H + 60) + frame * v) % (H + 60)) - 30;
          const x = rand(i * 7.7) * W + Math.sin(frame / 22 + i) * (10 + layer * 8);
          return <circle key={i} cx={x} cy={y} r={r} fill="#ffffff" opacity={opacity * [0.55, 0.75, 0.9][layer]} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.45 }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: `radial-gradient(ellipse 75% 60% at 50% 48%, transparent 55%, rgba(5,6,30,${strength}) 100%)`,
    }}
  />
);

/** Faint channel watermark, like the references. Placeholder handle. */
export const Watermark: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div
      style={{
        position: "absolute",
        top: "46%",
        width: "100%",
        textAlign: "center",
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: 40,
        letterSpacing: 6,
        color: "rgba(255,255,255,0.32)",
        WebkitTextStroke: "1.5px rgba(30,30,60,0.25)",
      }}
    >
      @yourchannel
    </div>
  </AbsoluteFill>
);
