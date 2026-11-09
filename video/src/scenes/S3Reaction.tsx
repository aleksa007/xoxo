import React from "react";
import { useCurrentFrame } from "remotion";
import type { Look } from "../three/cel";
import { NIGHT } from "../three/cel";
import { Character } from "../three/Character";
import { CameraRig } from "../three/props";
import { Sky, Snowfall, Vignette } from "../ui/Atmosphere";
import { Captions } from "../ui/Captions";
import { ArcticTown } from "./S1Hook";
import { Shell, ease } from "./Shell";

export const S3_LEN = 80;

const DUSK: Look = { ...NIGHT, fogColor: "#6b5a9c", fogNear: 6, fogFar: 34, exposure: 0.9, shadeTint: "#a99cff" };

export const S3Reaction: React.FC = () => {
  const frame = useCurrentFrame();
  const t = ease(frame, 0, S3_LEN);
  const turned = frame >= 46;
  return (
    <Shell
      look={DUSK}
      sky={<Sky top="#2a2160" bottom="#d77fa1" glow={{ x: 0.5, y: 0.75, color: "rgba(255,170,120,0.55)", r: 50 }} />}
      overlay={
        <>
          <Snowfall count={70} opacity={0.7} />
          <Vignette strength={0.5} />
          <Captions
            y={0.16}
            chunks={[
              { at: 0, text: "Sounds *fake,*" },
              { at: 24, text: "right?" },
              { at: 46, text: "It's *not.*" },
            ]}
          />
        </>
      }
    >
      <CameraRig position={[0.1, 1.6, 4.6 - t * 0.5]} target={[0, 1.55, 0]} fov={38} roll={turned ? 0.03 : -0.02} />
      <group position={[0, 0, 0]}>
        <Character
          position={[0, 0, 0]}
          coat="#ffb703"
          hat="#3a7bd5"
          skin="#c98f63"
          wideEyes={!turned}
          mouth={turned ? "flat" : "o"}
          brows={turned ? "worried" : "raised"}
          look={turned ? 0 : 0.12}
          seed={2}
        />
      </group>
      <group position={[0, 0, -4]}>
        <ArcticTown people={false} />
      </group>
    </Shell>
  );
};
