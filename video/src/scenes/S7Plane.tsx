import React, { useMemo } from "react";
import * as THREE from "three";
import { useCurrentFrame } from "remotion";
import { Ball, Block, DAY, Toon, rand, type Look } from "../three/cel";
import { CameraRig, Mountain, Plane } from "../three/props";
import { Sky } from "../ui/Atmosphere";
import { Captions } from "../ui/Captions";
import { Pill } from "../ui/Cards";
import { Shell, ease } from "./Shell";

export const S7_LEN = 150;

const BRIGHT: Look = { ...DAY, fogColor: "#cfe6fb", fogNear: 40, fogFar: 140, lightDir: [0.4, 1, 0.8] };

const Cloud: React.FC<{ position: [number, number, number]; s?: number }> = ({ position, s = 1 }) => (
  <group position={position} scale={s}>
    <Ball r={1.4} position={[0, 0, 0]} color="#ffffff" outline={0.08} />
    <Ball r={1.1} position={[1.5, -0.3, 0.2]} color="#ffffff" outline={0.08} />
    <Ball r={1.0} position={[-1.5, -0.35, 0.1]} color="#ffffff" outline={0.08} />
    <Ball r={0.8} position={[2.6, -0.55, 0]} color="#ffffff" outline={0.08} />
  </group>
);

const Sea: React.FC = () => {
  const g = useMemo(() => new THREE.PlaneGeometry(600, 600).rotateX(-Math.PI / 2), []);
  return <Toon geometry={g} color="#2f7fd8" outline={0} position={[0, -6, 0]} />;
};

export const S7Plane: React.FC = () => {
  const frame = useCurrentFrame();
  const t = ease(frame, 0, S7_LEN);
  const px = -6 + frame * 0.16;
  const py = 4 + Math.sin(frame / 18) * 0.25;
  const bank = Math.sin(frame / 22) * 0.06;
  return (
    <Shell
      look={BRIGHT}
      sky={<Sky top="#3d8fe6" bottom="#d6ecfd" glow={{ x: 0.2, y: 0.15, color: "rgba(255,245,200,0.9)", r: 25 }} />}
      overlay={
        <>
          <Pill at={86} y={250} bg="#ffffff" icon="plane">
            Flown to the mainland
          </Pill>
          <Captions
            y={0.66}
            chunks={[
              { at: 0, text: "So if you're" },
              { at: 18, text: "*seriously ill*" },
              { at: 42, text: "or even about" },
              { at: 60, text: "to *give birth,*" },
              { at: 86, text: "you get *flown*" },
              { at: 110, text: "to the *mainland.*" },
            ]}
          />
        </>
      }
    >
      <CameraRig position={[px + 2.6 - t * 1.6, py + 1.8, 10.8]} target={[px - 0.3, py - 0.1, 0]} fov={42} />
      <Sea />
      {/* wave flecks */}
      {Array.from({ length: 40 }).map((_, i) => (
        <Block
          key={i}
          size={[1.2 + rand(i) * 1.5, 0.05, 0.12]}
          position={[(rand(i + 1) - 0.3) * 80, -5.95, -rand(i + 2) * 50 + 8]}
          color="#bfe3ff"
          outline={0}
          unlit
        />
      ))}
      {/* snowy islands passing by */}
      {Array.from({ length: 9 }).map((_, i) => (
        <Mountain key={i} position={[-20 + i * 11 + rand(i) * 4, -6.3, -26 - rand(i + 3) * 26]} r={6 + rand(i + 4) * 6} h={6 + rand(i + 5) * 7} seed={i + 30} />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <Cloud key={i} position={[-10 + i * 9 + rand(i + 50) * 4, 9 + rand(i + 51) * 4, -14 - rand(i + 52) * 14]} s={0.9 + rand(i + 53) * 0.6} />
      ))}
      <Plane position={[px, py, 0]} rotation={[bank, 0, 0.05 + bank * 0.5]} scale={0.62} />
    </Shell>
  );
};
