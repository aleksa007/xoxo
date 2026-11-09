import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { DAY, rand, type Look } from "../three/cel";
import { CameraRig, Virus, lerp3 } from "../three/props";
import { Sky, Vignette } from "../ui/Atmosphere";
import { Captions } from "../ui/Captions";
import { Pill } from "../ui/Cards";
import { GroundCut } from "./S4Permafrost";
import { Shell, ease } from "./Shell";

export const S6_LEN = 130;

const ICE: Look = { ...DAY, fogColor: "#13234a", fogNear: 20, fogFar: 60, lightDir: [0.5, 0.8, 1], exposure: 0.95 };

export const S6Virus: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = ease(frame, 0, S6_LEN);
  return (
    <Shell
      look={ICE}
      sky={<Sky top="#0c1430" bottom="#24396e" />}
      overlay={
        <>
          <Vignette strength={0.6} />
          <Pill at={54} y={250} bg="#ff6b6b" icon="warn">
            1918 Flu
          </Pill>
          <Captions
            y={0.32}
            chunks={[
              { at: 0, text: "Scientists even found" },
              { at: 34, text: "traces of the" },
              { at: 54, text: "*1918 flu*" },
              { at: 78, text: "still *preserved*" },
              { at: 100, text: "in the graves." },
            ]}
          />
        </>
      }
    >
      <CameraRig position={lerp3([1.0, -4.9, 13.5], [1.0, -5.1, 11], t)} target={[1.0, -5.2, 0]} fov={40} />
      <GroundCut />
      {/* virus particles drifting out of the frozen grave */}
      {Array.from({ length: 11 }).map((_, i) => {
        const at = 38 + i * 4;
        const p = spring({ frame: frame - at, fps, config: { damping: 10, stiffness: 120 } });
        if (frame < at) return null;
        const ang = (i / 11) * Math.PI * 2 + rand(i) * 0.5;
        const x = 1.0 + Math.cos(ang) * (0.55 + rand(i + 2) * 0.45) * p;
        const y = -5.0 + Math.sin(ang) * (0.9 + rand(i + 3) * 0.9) * p + Math.sin((frame + i * 9) / 14) * 0.08;
        const s = interpolate(p, [0, 1], [0.02, 0.12 + rand(i + 4) * 0.08]);
        return <Virus key={i} position={[x, y, 4.6 + rand(i + 7) * 0.6]} r={s} spin={(frame + i * 20) / 30} />;
      })}
    </Shell>
  );
};
