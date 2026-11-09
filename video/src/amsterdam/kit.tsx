import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { LookProvider, type Look } from "../three/cel";
import { Grade, TiltShift } from "./overlays";

/* ------------------------------------------------------------ looks */

export const DAYLOOK: Look = {
  lightDir: [0.55, 0.9, 0.75],
  shade: 0.7,
  shadeTint: "#c3c6ff",
  fogColor: "#f2dcc4",
  fogNear: 28,
  fogFar: 110,
  outlineColor: "#1a1420",
  exposure: 1,
  rim: 0.16,
  rimColor: "#fff1d6",
};

export const SWAMPLOOK: Look = { ...DAYLOOK, fogColor: "#e3ead8", fogNear: 18, fogFar: 85, lightDir: [0.3, 1, 0.5], shade: 0.74 };
export const FIRELOOK: Look = {
  ...DAYLOOK,
  lightDir: [0.2, 0.55, 1],
  shade: 0.5,
  shadeTint: "#7a5cff",
  fogColor: "#7a3420",
  fogNear: 16,
  fogFar: 75,
  exposure: 1,
  rim: 0.55,
  rimColor: "#ff8a3d",
};
export const HOTLOOK: Look = { ...DAYLOOK, fogColor: "#f7c98a", shadeTint: "#ffb79a", rimColor: "#ffd38a", rim: 0.25 };
export const INDOOR: Look = { ...DAYLOOK, fogNear: 60, fogFar: 200, lightDir: [0.4, 0.8, 1] };

/* ------------------------------------------------------------- skies */

export const SkyCss: React.FC<{ top: string; bottom: string; sun?: { x: number; y: number; r?: number; color?: string } }> = ({
  top,
  bottom,
  sun,
}) => (
  <AbsoluteFill style={{ background: `linear-gradient(180deg, ${top} 0%, ${bottom} 70%)` }}>
    {sun ? (
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${sun.x * 100}% ${sun.y * 100}%, ${sun.color ?? "rgba(255,244,214,1)"} 0%, rgba(255,230,180,0.55) ${(sun.r ?? 9) * 0.6}%, transparent ${sun.r ?? 9 * 3}%)`,
        }}
      />
    ) : null}
  </AbsoluteFill>
);

export const SKY_DAY = <SkyCss top="#4f9be3" bottom="#f7dcc0" sun={{ x: 0.82, y: 0.1, r: 30 }} />;

/* ------------------------------------------------------------- shell */

/** Absolute time (s) of the current frame, given where the shot starts. */
export const useT = (shotStart: number) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return shotStart + f / fps;
};

export const ez = (t: number, a: number, b: number, easing = Easing.inOut(Easing.cubic)) =>
  interpolate(t, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

export const ezOut = (t: number, a: number, b: number) => ez(t, a, b, Easing.out(Easing.cubic));

/** Decaying camera shake from a list of impact times. */
export const shake = (t: number, impacts: number[], amp = 0.18): [number, number] => {
  let x = 0;
  let y = 0;
  for (const at of impacts) {
    const age = t - at;
    if (age < 0 || age > 0.45) continue;
    const k = Math.exp(-age * 9) * amp;
    x += Math.sin(age * 90) * k;
    y += Math.cos(age * 77) * k;
  }
  return [x, y];
};

export const AShell: React.FC<{
  look: Look;
  sky: React.ReactNode;
  overlay?: React.ReactNode;
  children: React.ReactNode;
  punch?: number;
  tilt?: number;
  warm?: number;
  vignette?: number;
}> = ({ look, sky, overlay, children, punch = 0.06, tilt = 6, warm = 0.12, vignette = 0.35 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const z = 1 + punch * (1 - interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }));
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${z})` }}>
        {sky}
        <ThreeCanvas width={width} height={height} gl={{ antialias: true, alpha: true }} flat>
          <LookProvider look={look}>{children}</LookProvider>
        </ThreeCanvas>
        {tilt > 0 ? <TiltShift amount={tilt} /> : null}
        <Grade warm={warm} vignette={vignette} />
      </AbsoluteFill>
      {overlay}
    </AbsoluteFill>
  );
};
