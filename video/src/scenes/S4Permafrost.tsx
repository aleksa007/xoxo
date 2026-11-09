import React from "react";
import { useCurrentFrame } from "remotion";
import { Block, DAY, rand, type Look } from "../three/cel";
import { Character } from "../three/Character";
import { CameraRig, Coffin, House, IceShard, MountainRange, Rock, lerp3 } from "../three/props";
import { Sky, Vignette } from "../ui/Atmosphere";
import { Captions } from "../ui/Captions";
import { Icon, Panel, Pill } from "../ui/Cards";
import { Shell, ease } from "./Shell";

export const S4_LEN = 170;

const LOOK: Look = { ...DAY, fogColor: "#b9d4f0", fogNear: 30, fogFar: 110 };

const FRONT = 4; // z of the cut face

/** The ground, sliced open like a diorama so we can see the layers. */
export const GroundCut: React.FC<{ coffin?: boolean }> = ({ coffin = true }) => (
  <group>
    {/* layers: snow / thawing "active layer" / permafrost. Only exists behind
        the cut face, so the front reads as a cross-section. */}
    <Block size={[300, 0.6, 300]} position={[0, -0.3, FRONT - 150]} color="#f1f6fe" outline={0.05} />
    <Block size={[300, 1.4, 300]} position={[0, -1.3, FRONT - 150]} color="#7a5a45" outline={0.05} />
    <Block size={[300, 9, 300]} position={[0, -6.5, FRONT - 150]} color="#5f86b5" outline={0.05} />
    {/* frozen bits in the cut face */}
    {[-2.7, -4.2, -6.9, -8.6].map((y) => (
      <Block key={y} size={[300, 0.09, 0.02]} position={[0, y, FRONT + 0.01]} color="#4b6f99" outline={0} />
    ))}
    {Array.from({ length: 44 }).map((_, i) => {
      const x = (rand(i + 1) - 0.5) * 16;
      const y = -2.4 - rand(i + 2.2) * 7.5;
      return i % 3 === 0 ? (
        <Rock key={i} position={[x, y, FRONT + 0.05]} s={0.25 + rand(i) * 0.3} seed={i} color="#46597a" />
      ) : (
        <IceShard key={i} position={[x, y, FRONT + 0.1]} s={0.18 + rand(i + 5) * 0.22} rot={rand(i + 9) * 3} />
      );
    })}
    {Array.from({ length: 9 }).map((_, i) => (
      <Rock key={`r${i}`} position={[(rand(i + 40) - 0.5) * 20, -1.2 - rand(i + 41) * 0.6, FRONT + 0.05]} s={0.18 + rand(i + 42) * 0.18} seed={i + 40} color="#4e3a2e" />
    ))}
    {coffin ? <Coffin position={[1.0, -5.2, FRONT - 0.2]} rotation={[0, 0, Math.PI / 2]} scale={1.1} /> : null}
  </group>
);

export const S4Permafrost: React.FC = () => {
  const frame = useCurrentFrame();
  const t = ease(frame, 40, 140);
  const pos = lerp3([0, 1.2, 16], [1.0, -4.8, 11.5], t);
  const tgt = lerp3([0, -0.4, 0], [1.0, -5.2, 0], t);
  return (
    <Shell
      look={LOOK}
      sky={<Sky top="#5aa9ef" bottom="#d8ecfb" glow={{ x: 0.8, y: 0.12, color: "rgba(255,240,180,0.9)", r: 22 }} />}
      overlay={
        <>
          <Vignette strength={0.3} />
          <Pill at={8} out={60} y={250} bg="#ffffff" icon="therm">
            Air: -16°C
          </Pill>
          <Pill at={100} y={250} bg="#3de0ff" icon="snow">
            Permafrost
          </Pill>
          <Panel at={118} y={390} width={900}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <Icon name="therm" size={60} color="#ff6b6b" />
              <div>
                <div style={{ fontWeight: 800, fontSize: 26, letterSpacing: 3, color: "#9aa3c7" }}>GROUND TEMPERATURE</div>
                <div style={{ fontWeight: 900, fontSize: 50, color: "#3de0ff", lineHeight: 1.1, whiteSpace: "nowrap" }}>BELOW 0°C · ALL YEAR</div>
              </div>
            </div>
          </Panel>
          <Captions
            y={0.68}
            chunks={[
              { at: 0, text: "The ground here" },
              { at: 24, text: "is *frozen*" },
              { at: 44, text: "*solid.*" },
              { at: 64, text: "All year," },
              { at: 86, text: "*every* year." },
              { at: 108, text: "It's called" },
              { at: 128, text: "*permafrost.*" },
            ]}
          />
        </>
      }
    >
      <CameraRig position={pos} target={tgt} fov={42} />
      <MountainRange z={-70} seed={9} />
      <House position={[-1.6, 0, -0.2]} color="#e2483d" w={2.6} h={1.8} d={2.2} />
      <Character position={[1.5, 0, 2.2]} rotationY={-0.35} coat="#3a7bd5" hat="#ffb703" shiver seed={4} mouth="frown" brows="worried" />
      <GroundCut />
    </Shell>
  );
};
