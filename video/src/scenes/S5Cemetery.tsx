import React from "react";
import { useCurrentFrame } from "remotion";
import { DAY, type Look } from "../three/cel";
import { Character } from "../three/Character";
import { CameraRig, Cross, Drifts, Fence, MountainRange, SnowGround, lerp3 } from "../three/props";
import { Sky, Snowfall, Vignette } from "../ui/Atmosphere";
import { Captions } from "../ui/Captions";
import { Pill } from "../ui/Cards";
import { Shell, ease } from "./Shell";
import { rand } from "../three/cel";

export const S5_LEN = 180;

const OVERCAST: Look = {
  ...DAY,
  lightDir: [0.3, 1, 0.5],
  shade: 0.75,
  shadeTint: "#b6c2e6",
  fogColor: "#b8c3dc",
  fogNear: 18,
  fogFar: 75,
  exposure: 0.92,
};

export const S5Cemetery: React.FC = () => {
  const frame = useCurrentFrame();
  const t = ease(frame, 0, S5_LEN);
  const late = frame >= 90;
  return (
    <Shell
      look={OVERCAST}
      sky={<Sky top="#7f8db3" bottom="#d5dcec" />}
      overlay={
        <>
          <Snowfall count={80} opacity={0.75} speed={0.8} />
          <Vignette strength={0.4} />
          <Pill at={6} out={84} y={240} bg="#ffd23f" icon="cross">
            Since 1950
          </Pill>
          <Pill at={128} y={240} bg="#ff6b6b" icon="warn">
            Bodies don't decompose
          </Pill>
          <Captions
            y={0.36}
            chunks={[
              { at: 0, text: "So back in *1950,*" },
              { at: 30, text: "the town" },
              { at: 44, text: "*stopped burying*" },
              { at: 66, text: "people." },
              { at: 90, text: "because the bodies" },
              { at: 116, text: "were *not*" },
              { at: 134, text: "*decomposing.*" },
            ]}
          />
        </>
      }
    >
      <CameraRig position={lerp3([-3, 3.2, 12.5], [1.0, 2.5, 10.2], t)} target={lerp3([-1, 1.6, 0], [0.8, 1.5, 0], t)} fov={42} />
      <SnowGround color="#e9eef8" />
      <MountainRange z={-60} seed={12} />
      <Drifts count={10} spread={40} seed={7} z={-8} />
      {/* hillside with rows of white crosses */}
      <group position={[0, 0, -3]}>
        {Array.from({ length: 4 }).flatMap((_, row) =>
          Array.from({ length: 7 }).map((__, col) => {
            const i = row * 7 + col;
            return (
              <Cross
                key={i}
                position={[(col - 3) * 1.7 + (row % 2) * 0.6, row * 0.35, -row * 2.4]}
                rotationY={(rand(i) - 0.5) * 0.25}
                tilt={(rand(i + 3) - 0.5) * 0.14}
              />
            );
          }),
        )}
      </group>
      <Fence from={-9} to={9} z={1.6} />
      <Character
        position={[0.9, 0, 3.4]}
        rotationY={-0.2}
        coat="#8e5bd9"
        hat="#2f9e6e"
        mouth={late ? "o" : "frown"}
        brows={late ? "raised" : "worried"}
        wideEyes={late}
        shiver
        seed={5}
      />
    </Shell>
  );
};
