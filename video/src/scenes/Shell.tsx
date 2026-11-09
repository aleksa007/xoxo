import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { LookProvider, type Look } from "../three/cel";

export const ease = (frame: number, from: number, to: number, easing = Easing.inOut(Easing.cubic)) =>
  interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

/**
 * One shot: CSS sky behind, Three.js set in the middle, overlays on top.
 * Every cut lands with a quick "punch" zoom, a staple of the reference edits.
 */
export const Shell: React.FC<{
  look: Look;
  sky: React.ReactNode;
  overlay?: React.ReactNode;
  children: React.ReactNode;
  punch?: number;
}> = ({ look, sky, overlay, children, punch = 0.07 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const z = 1 + punch * (1 - ease(frame, 0, 9, Easing.out(Easing.cubic)));
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${z})` }}>
        {sky}
        <ThreeCanvas width={width} height={height} gl={{ antialias: true, alpha: true }} flat linear={false}>
          <LookProvider look={look}>{children}</LookProvider>
        </ThreeCanvas>
      </AbsoluteFill>
      {overlay}
    </AbsoluteFill>
  );
};
