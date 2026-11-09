import React from "react";
import { useCurrentFrame } from "remotion";
import { NIGHT } from "../three/cel";
import { Character } from "../three/Character";
import { CameraRig, Drifts, House, MountainRange, SnowGround, lerp3 } from "../three/props";
import { Sky, Snowfall, Vignette } from "../ui/Atmosphere";
import { Captions } from "../ui/Captions";
import { Shell, ease } from "./Shell";

export const S1_LEN = 110;

/** Night street of stilted, colourful houses under the aurora. */
export const ArcticTown: React.FC<{ people?: boolean }> = ({ people = true }) => (
  <group>
    <SnowGround color="#dfe8f7" />
    <MountainRange z={-70} seed={4} />
    <Drifts count={14} spread={50} seed={2} z={-6} />
    {/* two rows of houses along a snowy street */}
    <House position={[-6.2, 0, -2]} rotationY={0.35} color="#e2483d" />
    <House position={[-5.4, 0, -9]} rotationY={0.3} color="#ffb703" w={3.4} />
    <House position={[-4.6, 0, -16]} rotationY={0.25} color="#2f9e6e" />
    <House position={[-3.8, 0, -23]} rotationY={0.2} color="#3a7bd5" w={3.6} />
    <House position={[6.2, 0, -4]} rotationY={-0.35} color="#3a7bd5" />
    <House position={[5.6, 0, -11]} rotationY={-0.3} color="#e2483d" w={3.4} />
    <House position={[4.8, 0, -18]} rotationY={-0.25} color="#ffb703" />
    <House position={[4.0, 0, -25]} rotationY={-0.2} color="#8e5bd9" />
    {people ? (
      <>
        <Character position={[-1.1, 0, 1.5]} rotationY={0.25} coat="#2f9e6e" hat="#e2483d" shiver seed={1} />
        <Character position={[1.2, 0, 0.6]} rotationY={-0.3} coat="#ffb703" hat="#3a7bd5" skin="#c98f63" shiver seed={2} />
      </>
    ) : null}
  </group>
);

export const S1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const t = ease(frame, 0, S1_LEN);
  const snap = ease(frame, 54, 60);
  const pos = lerp3(lerp3([0, 9, 26], [0, 4.2, 15], t), [0, 3.2, 10], snap * 0.6);
  return (
    <Shell
      look={NIGHT}
      sky={<Sky top="#0b1033" bottom="#2a3f84" stars aurora />}
      overlay={
        <>
          <Snowfall />
          <Vignette strength={0.55} />
          <Captions
            y={0.36}
            chunks={[
              { at: 0, text: "In this town," },
              { at: 22, text: "you're not" },
              { at: 38, text: "*allowed*" },
              { at: 54, text: "to *die.*" },
            ]}
          />
        </>
      }
    >
      <CameraRig position={pos} target={[0, 1.6 + t * 0.3, -6]} fov={42} />
      <ArcticTown />
    </Shell>
  );
};
