import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT } from "./fonts";

/**
 * Word-chunk captions in the style of short-form explainers:
 * heavy uppercase type, white fill, keyword(s) in yellow, thick black stroke,
 * hard drop shadow, and a little "pop" each time a new chunk lands.
 *
 * Wrap a word in *asterisks* to highlight it.
 */

export type Chunk = { at: number; text: string };

const HL = "#ffd23f";

const Words: React.FC<{ text: string; stroke: boolean }> = ({ text, stroke }) => {
  const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) => {
        const hl = p.startsWith("*") && p.endsWith("*");
        const word = hl ? p.slice(1, -1) : p;
        return (
          <span key={i} style={{ color: stroke ? "#111" : hl ? HL : "#ffffff" }}>
            {word}
          </span>
        );
      })}
    </>
  );
};

export const Captions: React.FC<{ chunks: Chunk[]; y?: number; size?: number; until?: number }> = ({
  chunks,
  y = 0.6,
  size = 104,
  until,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (until !== undefined && frame >= until) return null;
  let idx = -1;
  for (let i = 0; i < chunks.length; i++) if (chunks[i].at <= frame) idx = i;
  if (idx < 0) return null;
  const c = chunks[idx];
  const local = frame - c.at;
  const pop = spring({ frame: local, fps, config: { damping: 11, stiffness: 260, mass: 0.6 } });
  const scale = interpolate(pop, [0, 1], [0.55, 1]);
  const rot = interpolate(pop, [0, 1], [-4, 0]);

  const base: React.CSSProperties = {
    fontFamily: FONT,
    fontWeight: 900,
    fontSize: size,
    lineHeight: 1.05,
    letterSpacing: -1,
    textTransform: "uppercase",
    textAlign: "center",
    whiteSpace: "pre-wrap",
    position: "absolute",
    left: 0,
    right: 0,
  };

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 70,
          right: 70,
          top: `${y * 100}%`,
          transform: `translate(0, -50%) scale(${scale}) rotate(${rot}deg)`,
        }}
      >
        <div style={{ position: "relative" }}>
          {/* stroke + shadow layer */}
          <div
            style={{
              ...base,
              position: "relative",
              WebkitTextStroke: `${size * 0.2}px #111`,
              textShadow: `0 ${size * 0.11}px 0 rgba(0,0,0,0.55)`,
            }}
          >
            <Words text={c.text} stroke />
          </div>
          {/* fill layer */}
          <div style={{ ...base, top: 0 }}>
            <Words text={c.text} stroke={false} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
