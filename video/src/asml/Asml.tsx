import React from "react";
import * as THREE from "three";
import { AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Block, LookProvider, type Look } from "../three/cel";
import { Character } from "../three/Character";
import { CameraRig } from "../three/props";
import { Captions } from "../ui/Captions";
import { Icon, Pill } from "../ui/Cards";
import { FONT } from "../ui/fonts";
import { Counter, FailStamp, NameCard, Sfx, Tag, TiltShift, Grade } from "../amsterdam/overlays";
import { CAPTIONS } from "./timing";
import {
  Air,
  Beam,
  Bus,
  Chamber,
  ChipCity,
  Collector,
  Droplet,
  DutchFlag,
  F,
  Glow,
  Housing,
  Laptop,
  LaserBox,
  LENS,
  Layers,
  Lens,
  LightBars,
  M1,
  M2,
  M3,
  MASK,
  Mask,
  Mirror,
  Nozzle,
  OldMachine,
  Pen,
  Phone,
  Projector,
  Pump,
  Room,
  Server,
  Shards,
  Shed,
  Stage,
  W,
  WAFER_TOP,
  Wafer,
  type V3,
} from "./world";

export const FPS = 30;
export const END = 107.8;
export const TOTAL = Math.round(END * FPS);

const ez = (t: number, a: number, b: number) => {
  const k = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return k * k * (3 - 2 * k);
};
const lin = (t: number, a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));

const DARK_BG = new THREE.Color("#0e1428");
const LIGHT_TOP = new THREE.Color("#e8eef6");
const LIGHT_BOT = new THREE.Color("#f6f8fb");

const CLEAN: Look = {
  lightDir: [0.4, 1, 0.8],
  shade: 0.8,
  shadeTint: "#c7d3ff",
  fogColor: "#dfe8f3",
  fogNear: 24,
  fogFar: 80,
  outlineColor: "#1b2233",
  exposure: 1,
  rim: 0.18,
  rimColor: "#ffffff",
};
const DARK: Look = { ...CLEAN, exposure: 0.42, shade: 0.75, shadeTint: "#8f9cff", fogColor: "#121a30", fogNear: 16, fogFar: 55, rim: 0.45, rimColor: "#b76bff" };
const MID: Look = { ...CLEAN, exposure: 0.7, fogColor: "#6f7c9c", fogNear: 20, fogFar: 70, rim: 0.3, rimColor: "#d6c2ff" };
/** The lights go down while we build the inside of the machine, so the EUV light can glow. */
const darkness = (t: number) => ez(t, 30.15, 30.5) * (1 - ez(t, 76.1, 76.45));
const lookAt = (t: number) => {
  const d = darkness(t);
  return d > 0.75 ? DARK : d > 0.2 ? MID : CLEAN;
};

/* ----------------------------------------------------------- camera */

type Key = [number, V3, V3, number];
const STAGE_POS: V3 = [2.4, 2.9, 5.6];
const STAGE_TGT: V3 = [0, 0.84, 0];
const KEYS: Key[] = [
  [0.0, [0, 3.05, 6.4], [0, 3.0, 1.6], 40],
  [2.5, [0, 3.05, 6.0], [0, 3.0, 1.6], 40],
  [3.5, [0.5, 3.3, 7.6], [0, 3.0, 1.6], 44],
  [5.2, [0.12, 3.12, 3.2], [0, 3.1, 1.6], 34],
  [5.9, [0.12, 3.12, 3.2], [0, 3.1, 1.6], 34],
  [8.4, [7.8, 6.2, 16], [-1.8, 3.4, 0], 42],
  [9.9, [7.2, 5.9, 15.2], [-1.8, 3.4, 0], 42],
  [10.9, STAGE_POS, STAGE_TGT, 40],
  [11.3, STAGE_POS, STAGE_TGT, 40],
  [12.6, STAGE_POS, STAGE_TGT, 2.8],
  [18.35, STAGE_POS, STAGE_TGT, 2.8],
  [19.3, [3.8, 3.8, 8.2], [0, 1.7, 0], 42],
  [22.9, [3.3, 3.5, 7.4], [0, 1.6, 0], 42],
  [23.8, STAGE_POS, STAGE_TGT, 3.2],
  [26.6, STAGE_POS, STAGE_TGT, 3.2],
  [27.6, [3.8, 3.8, 8.2], [0, 1.8, 0], 42],
  [30.0, [3.4, 3.8, 8.0], [-1.2, 2.2, 0], 42],
  [31.2, [-2.0, 3.4, 5.8], [-5, 2.7, 0], 36],
  [33.6, [-2.5, 3.1, 4.4], [-5, 2.6, 0], 30],
  [34.7, [-3.1, 2.9, 3.0], [-5, 2.6, 0], 26],
  [39.4, [-2.8, 3.0, 3.6], [-5, 2.6, 0], 30],
  [41.4, [-1.2, 4.3, 8.4], [-4.4, 3.9, 0], 40],
  [44.9, [-1.0, 4.3, 8.2], [-4.4, 3.9, 0], 40],
  [46.2, [2.4, 4.8, 15.5], [-2.0, 3.9, 0], 42],
  [50.5, [2.2, 4.8, 15.0], [-2.0, 3.9, 0], 42],
  [51.5, [-2.4, 5.0, 5.8], [-4.7, 4.8, 0], 38],
  [54.6, [-2.5, 5.3, 6.0], [-4.7, 5.3, 0], 38],
  [55.7, [-3.2, 6.4, 2.7], [-4.6, 6.0, 0], 30],
  [62.9, [-3.3, 6.4, 2.5], [-4.6, 6.0, 0], 28],
  [63.9, [1.0, 4.2, 16.5], [-1.0, 3.9, 0], 42],
  [67.6, [0.9, 4.2, 16.0], [-1.0, 3.9, 0], 42],
  [68.6, STAGE_POS, STAGE_TGT, 3.0],
  [70.85, STAGE_POS, STAGE_TGT, 3.0],
  [71.7, [3.4, 2.7, 6.0], [0, 1.3, 0], 40],
  [75.9, [3.1, 2.8, 5.6], [0, 1.4, 0], 40],
  [77.6, [15.5, 8.6, 22.5], [-2.0, 3.4, -1.6], 44],
  [85.4, [14.2, 8.1, 21.2], [-2.0, 3.4, -1.6], 44],
  [87.4, [10.2, 6.2, 16.4], [-2.0, 4.2, 0], 42],
  [91.6, [9.6, 5.9, 15.6], [-2.0, 4.2, 0], 42],
  [96.6, [9.6, 5.7, 15.2], [-2.0, 3.8, 0], 42],
  [98.0, [12.0, 6.1, 18.0], [0.4, 3.0, 0], 44],
  [102.3, [11.4, 6.0, 17.4], [0.4, 3.0, 0], 44],
];

const camAt = (t: number) => {
  if (t >= 102.3) {
    const a = 0.58 - ez(t, 102.3, END) * 0.42;
    const R = 18.5;
    return { pos: [0.4 + Math.sin(a) * R, 6.0 - ez(t, 102.3, END) * 0.6, Math.cos(a) * R] as V3, tgt: [-0.8, 3.4, 0] as V3, fov: 44 };
  }
  let i = 0;
  while (i < KEYS.length - 1 && KEYS[i + 1][0] <= t) i++;
  const a = KEYS[i];
  const b = KEYS[Math.min(i + 1, KEYS.length - 1)];
  const k = b[0] === a[0] ? 0 : ez(t, a[0], b[0]);
  const L = (p: V3, q: V3): V3 => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k, p[2] + (q[2] - p[2]) * k];
  const fov = Math.exp(Math.log(a[3]) + (Math.log(b[3]) - Math.log(a[3])) * k);
  return { pos: L(a[1], b[1]), tgt: L(a[2], b[2]), fov };
};

const SHAKES: [number, number][] = [
  [34.9, 0.14],
  [52.75, 0.08],
  [77.25, 0.12],
  [79.1, 0.1],
];
const shakeAt = (t: number, fov: number): [number, number] => {
  let x = 0;
  let y = 0;
  for (const [at, amp] of SHAKES) {
    const age = t - at;
    if (age < 0 || age > 0.5) continue;
    const k = Math.exp(-age * 8) * amp * (fov / 40);
    x += Math.sin(age * 85) * k;
    y += Math.cos(age * 71) * k;
  }
  return [x, y];
};

/* ----------------------------------------------------------- 3D scene */

const Scene: React.FC<{ t: number }> = ({ t }) => {
  const cam = camAt(t);
  const [sx, sy] = shakeAt(t, cam.fov);
  const drift: V3 = [Math.sin(t * 0.7) * 0.03, Math.sin(t * 0.9) * 0.02, 0];

  // phone intro
  const explode = ez(t, 2.55, 3.5);
  const hideParts = ez(t, 5.6, 7.0);
  const chipFly = ez(t, 10.05, 10.95);
  const phonePos: V3 = [0, 3.0, 1.6];
  const chipPos: V3 = [phonePos[0] * (1 - chipFly), phonePos[1] + (WAFER_TOP + 0.02 - phonePos[1]) * chipFly, phonePos[2] * (1 - chipFly)];
  const ghost = ez(t, 6.2, 7.6) * (1 - ez(t, 10.0, 10.6));

  // wafer states
  const city = ez(t, 11.4, 12.6) * (1 - ez(t, 76.0, 76.6));
  const ink = t > 16.9 && t < 18.5 ? ez(t, 17.0, 17.75) * 0.06 : 0;
  const projY = 3.05 + (1 - ez(t, 19.45, 20.0)) * 6 + ez(t, 26.9, 27.8) * 7;
  const projOn = t > 20.35 && t < 27.0 ? 1 : 0;
  const blur = ez(t, 23.6, 24.4) * (1 - ez(t, 26.9, 27.4));
  const print = ez(t, 66.95, 67.6) * (1 - ez(t, 76.0, 76.4));

  // source
  const nozzleIn = 1 - ez(t, 30.25, 30.8);
  const laserIn = 1 - ez(t, 32.85, 33.3);
  const sourceOn = t > 30.25 && t < 92.0;
  const drops: number[] = [];
  if (t > 30.9 && t < 34.88) {
    for (let i = 0; i < 4; i++) drops.push(F[0] + 1.25 - (((t - 30.9) * 1.4 + i * 0.5) % 2.0));
  }
  const hit1 = t >= 33.62 && t < 34.3;
  const plasma = t >= 34.3 ? Math.max(ez(t, 34.3, 34.45) * (1 - ez(t, 44.9, 45.3)) * 1.0, 0) : 0;
  const strobe = t > 42.3 && t < 44.95 ? (Math.floor(t * 18) % 2 === 0 ? 1 : 0.35) : 1;
  const plasmaI = plasma * strobe * (0.85 + 0.15 * Math.sin(t * 40));
  const steadyGlow = t >= 45.3 && t < 92 ? 0.75 + 0.12 * Math.sin(t * 30) : 0;

  // beam path
  const collector = ez(t, 39.6, 40.2);
  const beamStart = ez(t, 40.1, 41.0);
  const air = ez(t, 45.1, 45.6) * (1 - ez(t, 48.9, 50.3));
  const chamber = ez(t, 48.25, 48.95);
  const suck = lin(t, 48.9, 50.4);
  const lensShow = t > 50.55 && t < 52.75 ? ez(t, 50.55, 50.9) : 0;
  const lensCrack = ez(t, 52.25, 52.6);
  const m1 = ez(t, 53.85, 54.35);
  const others = ez(t, 63.3, 63.9);
  const b1 = t < 50.6 ? beamStart : t < 52.75 ? 1 : 1;
  const b2 = ez(t, 54.2, 54.8) * 0.35 + ez(t, 63.7, 64.3) * 0.65;
  const b3 = ez(t, 64.35, 64.9);
  const b4 = ez(t, 64.85, 65.3);
  const b5 = ez(t, 66.75, 67.25);
  const beamsVisible = t < 76.4 || t > 96.8;
  const maskLit = ez(t, 65.6, 66.2);

  // layers
  const layers = t < 71.3 ? 0 : t < 73.0 ? ez(t, 71.3, 71.6) : t < 73.8 ? 1 + ez(t, 73.0, 73.3) : t < 74.4 ? 2 + ez(t, 73.8, 74.1) : 3 + lin(t, 74.4, 75.85) * 5;
  const layersShow = t < 76.3;

  // housing, bus, flag
  const housing = ez(t, 76.15, 77.25) * (1 - ez(t, 91.9, 92.5)) + ez(t, 96.75, 97.4);
  const bus = ez(t, 78.6, 79.1);
  const flag = ez(t, 90.7, 91.2);
  const shed = ez(t, 91.9, 92.7) * (1 - ez(t, 96.7, 97.3));
  const oldM = ez(t, 92.3, 92.8) * (1 - ez(t, 96.7, 97.1));

  // products
  const pPhone = ez(t, 98.3, 98.6);
  const pLaptop = ez(t, 98.9, 99.2);
  const pServer = ez(t, 99.85, 100.15);

  // technician pose
  const techPos: V3 = [3.4 + ez(t, 75.9, 77.0) * 1.8, 0, 3.0 + ez(t, 75.9, 77.0) * 0.8];
  let armL: [number, number] = [0, -0.25];
  let armR: [number, number] = [0, 0.25];
  let brows: "neutral" | "worried" | "angry" | "raised" = "neutral";
  let wide = false;
  if (t > 17.1 && t < 18.6) {
    armR = [-2.6, 0.5];
    brows = "worried";
  } else if (t > 25.0 && t < 26.8) {
    armL = [0, -1.3];
    armR = [0, 1.3];
    brows = "worried";
  } else if (t > 34.8 && t < 36.8) {
    armL = [-2.4, -0.4];
    armR = [-2.4, 0.4];
    wide = true;
    brows = "raised";
  } else if (t > 102.4) {
    armR = [0, 2.6 + Math.sin(t * 10) * 0.35];
    brows = "raised";
  }

  return (
    <>
      <CameraRig position={[cam.pos[0] + sx + drift[0], cam.pos[1] + sy + drift[1], cam.pos[2]]} target={cam.tgt} fov={cam.fov} />
      <Room dark={darkness(t) > 0.5} />
      <Stage />
      <Wafer t={t} blur={blur * 0.5} print={print} ink={ink} lit={projOn * (1 - blur) * 0.6} />
      <ChipCity show={city} />
      <LightBars blur={blur} crisp={ez(t, 68.3, 68.7) * (1 - ez(t, 70.85, 71.1))} />
      {t > 16.4 && t < 19.0 ? <Pen tip={[0.02 + (1 - ez(t, 16.5, 17.0)) * 0.6, WAFER_TOP + 0.005 + (1 - ez(t, 16.5, 17.0)) * 0.5 + ez(t, 18.4, 18.95) * 2, 0.0]} /> : null}
      {t > 19.3 && t < 28.2 ? <Projector y={projY} on={projOn} /> : null}

      {/* phone + chip */}
      {t < 11.0 ? (
        <>
          {t < 7.2 ? <Phone position={phonePos} explode={explode} hideParts={hideParts} chipGlow={ez(t, 3.8, 4.4)} screenOn={t < 2.6 ? 1 : 0} /> : null}
          {t >= 7.2 ? (
            <group position={chipPos} rotation={[-Math.PI / 2 * chipFly, 0, 0]} scale={1 - chipFly * 0.6}>
              <Block2 glow={1 - chipFly} />
            </group>
          ) : null}
        </>
      ) : null}
      {ghost > 0 ? <Ghost k={ghost} /> : null}

      {/* source */}
      {sourceOn ? (
        <>
          <Nozzle drop={nozzleIn} />
          {t > 32.8 ? <LaserBox drop={laserIn} /> : null}
          {drops.map((x, i) => (
            <Droplet key={i} x={x} />
          ))}
          {t > 33.55 && t < 34.35 ? <Droplet x={F[0]} flat={hit1 ? ez(t, 33.62, 33.75) : 1} /> : null}
          {(t > 33.55 && t < 33.75) || (t > 34.22 && t < 34.42) ? <Beam from={[-3.6, 1.0, 1.8]} to={F} color="#ff3b3b" width={0.07} /> : null}
          {t > 42.3 && t < 44.95 && strobe === 1 ? <Beam from={[-3.6, 1.0, 1.8]} to={F} color="#ff3b3b" width={0.05} /> : null}
          <Glow position={F} r={0.32 + plasma * 0.22} color="#b76bff" intensity={Math.max(plasmaI, steadyGlow)} />
          {t > 34.3 && t < 35.4 ? <Sparks t={t - 34.3} /> : null}
          <Collector show={collector} glow={plasmaI + steadyGlow} />
        </>
      ) : null}

      {/* vacuum chamber + air */}
      <Chamber build={t < 76.4 ? chamber : 0} />
      <Pump show={chamber * (t < 76.4 ? 1 : 0)} t={t} />
      <Air t={t} suck={suck} show={air > 0 && t < 50.5 ? 1 : 0} />

      {/* optics */}
      {beamsVisible ? (
        <>
          <Beam from={F} to={lensShow > 0 ? LENS : M1} progress={b1} falloff={air} opacity={t > 40 ? 1 : 0} />
          <Beam from={M1} to={MASK} progress={b2} />
          <Beam from={MASK} to={M2} progress={b3} />
          <Beam from={M2} to={M3} progress={b4} />
          <Beam from={M3} to={W} progress={b5} />
        </>
      ) : null}
      <Lens show={lensShow} crack={lensCrack} glow={t > 50.9 ? 1 : 0} />
      <Shards origin={M1} age={t - 52.75} />
      <Mirror at={1} prev={F} next={MASK} show={t < 76.4 || t > 96.8 ? m1 : 0} r={0.65} hot={b1} />
      <Mirror at={3} prev={MASK} next={M3} show={t < 76.4 || t > 96.8 ? others : 0} />
      <Mirror at={4} prev={M2} next={W} show={t < 76.4 || t > 96.8 ? others : 0} r={0.5} />
      <Mask show={t < 76.4 || t > 96.8 ? others : 0} lit={maskLit} />
      {print > 0 && t < 76 && cam.fov > 10 ? <Glow position={[0, WAFER_TOP + 0.05, 0]} r={1.1} color="#b76bff" intensity={print * 0.35} /> : null}

      {layersShow ? <Layers count={layers} t={t} /> : null}

      <Housing build={housing} />
      <DutchFlag position={[1.8, 8.1, 0.5]} t={t} show={flag * (1 - shed)} s={1.2} />
      <Bus position={[-2 + ez(t, 85.4, 86.8) * 26, 0, 6.2]} show={bus * (1 - shed)} />
      <Shed show={shed} t={t} />
      <OldMachine show={oldM} />

      <Phone position={[5.4, 1.5, 3.4]} rotation={[0, -0.5, 0]} scale={pPhone * 0.75} screenOn={1} />
      <Laptop position={[7.0, 0.9, 3.0]} s={pLaptop} />
      <Server position={[8.8, 0, 2.2]} s={pServer} t={t} />
      {pPhone > 0 ? (
        <>
          <Plinth x={5.4} z={3.4} h={0.45} />
          <Plinth x={7.0} z={3.0} h={0.9} />
        </>
      ) : null}

      <Character
        position={techPos}
        rotationY={-0.75}
        hatStyle="none"
        hair="#f1f4f8"
        coat="#f4f6fa"
        pants="#e6ebf2"
        skin="#f1cfae"
        cheeks={false}
        mask
        goggles={t > 30}
        wideEyes={wide}
        brows={brows}
        armL={armL}
        armR={armR}
        seed={3}
      />
    </>
  );
};


const Plinth: React.FC<{ x: number; z: number; h: number }> = ({ x, z, h }) => (
  <group>
    <BlockLite size={[1.4, h, 1.2]} position={[x, h / 2, z]} />
  </group>
);

const BlockLite: React.FC<{ size: V3; position: V3 }> = ({ size, position }) => <Block size={size} position={position} color="#f4f7fb" outline={0.03} />;

const Block2: React.FC<{ glow: number }> = ({ glow }) => (
  <group>
    <Block size={[0.42, 0.42, 0.06]} color="#2a2f3a" outline={0.02} rim={0.4} />
    <Block size={[0.3, 0.3, 0.07]} color="#b76bff" unlit outline={0} />
    {glow > 0 ? <Glow position={[0, 0, 0.05]} r={0.5} color="#b76bff" intensity={glow * 0.6} /> : null}
  </group>
);

/** Holographic preview of the finished machine. */
const Ghost: React.FC<{ k: number }> = ({ k }) => {
  const g = React.useMemo(() => new THREE.BoxGeometry(11.2, 7.6, 4.4), []);
  const mats = React.useMemo(
    () => [
      new THREE.MeshBasicMaterial({ color: "#7cc6ff", transparent: true, opacity: 0.2, depthWrite: false }),
      new THREE.MeshBasicMaterial({ color: "#2f6fd6", wireframe: true, transparent: true, opacity: 0.85 }),
    ],
    [],
  );
  mats[0].opacity = 0.22 * k;
  mats[1].opacity = 0.9 * k;
  return (
    <group position={[-2, 3.8, 0]} scale={[1, 0.6 + 0.4 * k, 1]}>
      <mesh geometry={g} material={mats[0]} />
      <mesh geometry={g} material={mats[1]} />
    </group>
  );
};

const Sparks: React.FC<{ t: number }> = ({ t }) => (
  <group>
    {Array.from({ length: 16 }).map((_, i) => {
      const a = (i / 16) * Math.PI * 2;
      const b = Math.sin(i * 1.7) * 0.8;
      const d = t * (3 + (i % 4));
      return <Glow key={i} position={[F[0] + Math.cos(a) * d, F[1] + Math.sin(a) * d * 0.8 + b * d * 0.2, F[2] + Math.sin(a * 3) * d * 0.4]} r={0.08} color="#e7c6ff" intensity={Math.max(0, 1 - t)} />;
    })}
  </group>
);

/* ----------------------------------------------------------- overlays */

const DutchFlagCss: React.FC<{ w?: number }> = ({ w = 60 }) => (
  <div style={{ width: w, height: w * 0.66, borderRadius: 6, overflow: "hidden", border: "3px solid #11131f", display: "flex", flexDirection: "column" }}>
    <div style={{ flex: 1, background: "#ae1c28" }} />
    <div style={{ flex: 1, background: "#ffffff" }} />
    <div style={{ flex: 1, background: "#21468b" }} />
  </div>
);
const GermanFlagCss: React.FC<{ w?: number }> = ({ w = 60 }) => (
  <div style={{ width: w, height: w * 0.6, borderRadius: 6, overflow: "hidden", border: "3px solid #11131f", display: "flex", flexDirection: "column" }}>
    <div style={{ flex: 1, background: "#111111" }} />
    <div style={{ flex: 1, background: "#dd0000" }} />
    <div style={{ flex: 1, background: "#ffce00" }} />
  </div>
);

const Card: React.FC<{ t: number; at: number; out: number; y: number; children: React.ReactNode; width?: number }> = ({ t, at, out, y, children, width = 900 }) => {
  if (t < at || t > out + 0.2) return null;
  const k = ez(t, at, at + 0.25);
  const o = 1 - ez(t, out, out + 0.2);
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: (1080 - width) / 2,
        width,
        opacity: o,
        transform: `translateY(${(1 - k) * 50}px) scale(${0.85 + 0.15 * k})`,
        background: "linear-gradient(180deg, #232846 0%, #171a30 100%)",
        border: "6px solid #0d0f1c",
        borderRadius: 30,
        boxShadow: "0 12px 0 rgba(0,0,0,0.4)",
        padding: "26px 34px",
        fontFamily: FONT,
        color: "#fff",
      }}
    >
      {children}
    </div>
  );
};

const Overlays: React.FC<{ t: number; f: number }> = ({ t, f }) => {
  const flash = t > 34.3 && t < 35.0 ? Math.exp(-(t - 34.3) * 9) : 0;
  const strobe = t > 42.3 && t < 44.95 && Math.floor(t * 18) % 2 === 0 ? 0.1 : 0;
  const sepia = ez(t, 91.9, 92.5) * (1 - ez(t, 96.6, 97.1));
  const glitch = t > 2.55 && t < 3.15 ? 1 - lin(t, 2.55, 3.15) : 0;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {glitch > 0 ? (
        <AbsoluteFill style={{ background: `linear-gradient(90deg, rgba(255,0,80,${0.18 * glitch}), transparent 40%, transparent 60%, rgba(0,200,255,${0.18 * glitch}))` }} />
      ) : null}
      {flash + strobe > 0 ? <AbsoluteFill style={{ background: `rgba(205,160,255,${Math.min(0.55, flash * 0.55 + strobe)})` }} /> : null}
      {sepia > 0 ? (
        <>
          <AbsoluteFill style={{ background: `rgba(150,100,50,${0.38 * sepia})`, mixBlendMode: "color" }} />
          <AbsoluteFill style={{ background: `rgba(60,40,20,${0.12 * sepia})` }} />
          <Rain t={t} o={sepia} />
        </>
      ) : null}

      {/* hook */}
      <Pill at={Math.round(9.05 * FPS)} out={Math.round(10.0 * FPS)} y={250} bg="#ffffff" size={52}>
        <span style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <DutchFlagCss w={64} /> Dutch
        </span>
      </Pill>
      {t < 16.4 ? <Tag at={12.7} text="Billions of switches" color="#7cc6ff" /> : null}
      <FailStamp at={17.85} out={18.45} text="TOO THICK" y={0.3} />
      <FailStamp at={25.6} out={26.6} text="BLURRY" y={0.3} />
      <WaveCompare t={t} />
      <NameCard at={37.07} out={39.5} title="40× HOTTER" sub="THAN THE SUN'S SURFACE" y={0.16} accent="#e7c6ff" />
      {t > 42.3 && t < 45.0 ? <Counter from={0} to={50000} start={42.4} end={43.4} y={0.15} label="TIN DROPS PER SECOND" size={120} color="#e7c6ff" /> : null}
      {t > 48.9 && t < 50.6 ? <Tag at={48.95} text="Vacuum" color="#7cc6ff" /> : null}
      <Sfx at={52.6} text="CRACK!" x={0.42} y={0.36} color="#bfe6ff" />
      <Card t={t} at={56.3} out={60.95} y={190}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <GermanFlagCss w={90} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 28, letterSpacing: 3, color: "#9aa3c7" }}>IF THIS MIRROR WAS THE SIZE OF GERMANY</div>
            <div style={{ fontWeight: 900, fontSize: 50, color: t > 59.5 ? "#ffd23f" : "#ffffff", lineHeight: 1.1 }}>{t > 59.5 ? "BIGGEST BUMP: 0.1 MM" : "…"}</div>
          </div>
        </div>
      </Card>
      {t > 61.4 && t < 63.3 ? (
        <Pill at={Math.round(61.5 * FPS)} y={250} bg="#ffffff" size={46}>
          <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <GermanFlagCss w={56} /> Zeiss · German partner
          </span>
        </Pill>
      ) : null}
      <HairCompare t={t} />
      {t > 71.35 && t < 76.1 ? <Tag at={71.4} text={`Layer ${Math.max(1, Math.ceil(t < 73 ? 1 : t < 73.8 ? 2 : t < 74.4 ? 3 : 3 + lin(t, 74.4, 75.85) * 5))}`} color="#e7c6ff" /> : null}
      {t > 78.8 && t < 79.9 ? <Tag at={78.85} text="Size of a bus" color="#ffd23f" /> : null}
      {t > 79.9 && t < 82.75 ? <Counter from={0} to={200000000} start={80.4} end={81.9} y={0.15} label="PRICE" format={(n) => "$" + Math.round(n).toLocaleString("en-US")} size={96} color="#4ade80" /> : null}
      <Jets t={t} />
      <AsmlCard t={t} />
      <NameCard at={92.45} out={96.5} title="1984" sub="A LEAKY SHED IN EINDHOVEN" y={0.15} accent="#ffcf8a" />
      {t > 101.2 && t < 102.4 ? (
        <Pill at={Math.round(101.25 * FPS)} y={250} bg="#ffffff" size={50}>
          <span style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <DutchFlagCss w={64} /> Dutch machines
          </span>
        </Pill>
      ) : null}
      <Confetti t={t - 102.45} />
      {f < 0 ? null : null}
    </AbsoluteFill>
  );
};

const Rain: React.FC<{ t: number; o: number }> = ({ t, o }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", opacity: o * 0.7 }}>
    {Array.from({ length: 70 }).map((_, i) => {
      const x = (i * 157) % 1080;
      const y = ((t * 1400 + i * 211) % 2100) - 100;
      return <line key={i} x1={x} y1={y} x2={x - 10} y2={y + 60} stroke="#cfe6ff" strokeWidth={3} strokeLinecap="round" />;
    })}
  </svg>
);

const WaveCompare: React.FC<{ t: number }> = ({ t }) => {
  if (t < 27.0 || t > 30.3) return null;
  const k = ez(t, 27.0, 27.3);
  const o = 1 - ez(t, 30.0, 30.3);
  const path = (amp: number, period: number, y: number) => {
    let d = "";
    for (let x = 0; x <= 760; x += 4) d += `${x === 0 ? "M" : "L"}${x},${y + Math.sin((x / period) * Math.PI * 2 + t * 6) * amp}`;
    return d;
  };
  return (
    <div style={{ position: "absolute", top: 200, left: 90, width: 900, opacity: o, transform: `scale(${0.85 + 0.15 * k})`, background: "rgba(23,26,48,0.92)", border: "6px solid #0d0f1c", borderRadius: 30, padding: 26, fontFamily: FONT, color: "#fff" }}>
      <div style={{ fontWeight: 800, fontSize: 28, letterSpacing: 3, color: "#ffe08a" }}>NORMAL LIGHT</div>
      <svg width={800} height={120}>
        <path d={path(42, 260, 60)} stroke="#ffe08a" strokeWidth={10} fill="none" strokeLinecap="round" />
      </svg>
      <div style={{ fontWeight: 800, fontSize: 28, letterSpacing: 3, color: "#e7c6ff", marginTop: 8 }}>EUV LIGHT · ~14× SMALLER</div>
      <svg width={800} height={70}>
        <path d={path(10, 19, 35)} stroke="#c58cff" strokeWidth={6} fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
};

const HairCompare: React.FC<{ t: number }> = ({ t }) => {
  if (t < 68.6 || t > 70.95) return null;
  const k = ez(t, 68.6, 68.9);
  const o = 1 - ez(t, 70.7, 70.95);
  return (
    <div style={{ position: "absolute", top: 210, left: 90, width: 900, opacity: o, transform: `scale(${0.85 + 0.15 * k})`, background: "rgba(23,26,48,0.92)", border: "6px solid #0d0f1c", borderRadius: 30, padding: "24px 30px", fontFamily: FONT, color: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div style={{ width: 120, height: 150, background: "linear-gradient(90deg,#5a3a22,#8a5a32,#5a3a22)", borderRadius: 16, border: "4px solid #0a0b16" }} />
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 150 }}>
          {Array.from({ length: 22 }).map((_, i) => (
            <div key={i} style={{ width: 2, height: 150, background: "#c58cff" }} />
          ))}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 26, letterSpacing: 3, color: "#9aa3c7" }}>ONE HAIR vs. CHIP LINES</div>
          <div style={{ fontWeight: 900, fontSize: 46, color: "#ffd23f", lineHeight: 1.1 }}>1000s OF TIMES THINNER</div>
        </div>
      </div>
    </div>
  );
};

const Jets: React.FC<{ t: number }> = ({ t }) => {
  if (t < 83.9 || t > 85.6) return null;
  const at = [83.98, 84.4, 84.85];
  return (
    <div style={{ position: "absolute", top: 230, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 30, opacity: 1 - ez(t, 85.35, 85.6) }}>
      {at.map((a, i) => {
        const k = ez(t, a, a + 0.25);
        if (k <= 0) return <div key={i} style={{ width: 170 }} />;
        return (
          <div key={i} style={{ width: 170, height: 170, borderRadius: 40, background: "#ffffff", border: "6px solid #11131f", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${0.4 + 0.6 * k}) rotate(${(1 - k) * -20}deg)`, boxShadow: "0 10px 0 rgba(0,0,0,0.35)" }}>
            <Icon name="plane" size={110} color="#2f6fd6" />
          </div>
        );
      })}
    </div>
  );
};

const AsmlCard: React.FC<{ t: number }> = ({ t }) => {
  if (t < 88.45 || t > 91.75) return null;
  const letters = [
    ["A", 88.5],
    ["S", 89.02],
    ["M", 89.6],
    ["L", 90.12],
  ] as const;
  const o = 1 - ez(t, 91.5, 91.75);
  return (
    <div style={{ position: "absolute", top: 190, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", opacity: o, fontFamily: FONT }}>
      <div style={{ display: "flex", gap: 14 }}>
        {letters.map(([c, a]) => {
          const k = ez(t, a, a + 0.22);
          return (
            <div key={c} style={{ width: 150, height: 170, borderRadius: 26, background: "#2f6fd6", border: "6px solid #0d0f1c", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 120, color: "#fff", transform: `translateY(${(1 - k) * -60}px) scale(${k})`, boxShadow: "0 10px 0 rgba(0,0,0,0.35)" }}>
              {c}
            </div>
          );
        })}
      </div>
      {t > 90.6 ? (
        <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 16, background: "#fff", border: "5px solid #11131f", borderRadius: 999, padding: "10px 30px", fontWeight: 900, fontSize: 44, color: "#1c2140", transform: `scale(${ez(t, 90.6, 90.85)})` }}>
          <DutchFlagCss w={60} /> THE NETHERLANDS
        </div>
      ) : null}
    </div>
  );
};

const Confetti: React.FC<{ t: number }> = ({ t }) => {
  if (t < 0) return null;
  const colors = ["#ae1c28", "#ffffff", "#21468b", "#ff9f1c", "#ffd23f"];
  return (
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      {Array.from({ length: 140 }).map((_, i) => {
        const delay = ((i * 37) % 100) / 100 * 1.2;
        const age = t - delay;
        if (age < 0) return null;
        const x = ((i * 131) % 1080) + Math.sin(age * 3 + i) * 40;
        const y = -60 + (380 + ((i * 53) % 420)) * age;
        const rot = (age * 300 + i * 30) % 360;
        return <rect key={i} x={x} y={y} width={16} height={26} fill={colors[i % colors.length]} stroke="#11131f" strokeWidth={1.5} transform={`rotate(${rot} ${x + 8} ${y + 13})`} />;
      })}
    </svg>
  );
};

/* ----------------------------------------------------------- captions */

const GlobalCaptions: React.FC<{ t: number }> = ({ t }) => {
  const chunks = CAPTIONS.map((c) => ({ at: Math.round(c.start * FPS), text: c.text }));
  const active = CAPTIONS.find((c, i) => t >= c.start && t < (CAPTIONS[i + 1]?.start ?? c.end + 0.6));
  if (!active || t > active.end + 0.45) return null;
  return <Captions chunks={chunks} y={0.72} size={96} />;
};

/* ----------------------------------------------------------- sound */

type Cue = [number, string, number];
const CUES: Cue[] = [
  [2.6, "glitch", 0.6],
  [3.8, "rise", 0.5],
  [6.3, "whoosh", 0.4],
  [9.05, "pop", 0.6],
  [10.1, "whoosh", 0.45],
  [11.4, "zoom", 0.5],
  [12.7, "pop", 0.45],
  [16.6, "whoosh", 0.3],
  [17.05, "splat", 0.7],
  [17.85, "stamp", 0.7],
  [18.4, "zoom", 0.4],
  [19.5, "servo", 0.5],
  [20.4, "hum", 0.5],
  [23.2, "zoom", 0.4],
  [25.6, "stamp", 0.7],
  [27.0, "servo", 0.4],
  [27.1, "pop", 0.5],
  [30.3, "servo", 0.5],
  [31.0, "drip", 0.5],
  [31.7, "drip", 0.5],
  [32.4, "drip", 0.5],
  [32.9, "servo", 0.5],
  [33.62, "zap", 0.7],
  [34.25, "zap", 0.8],
  [34.3, "boom", 0.9],
  [37.1, "pop", 0.5],
  [39.7, "rise", 0.5],
  ...Array.from({ length: 16 }).map((_, i): Cue => [42.35 + i * 0.16, "zap", 0.28]),
  [45.4, "whoosh", 0.3],
  [48.3, "servo", 0.5],
  [48.9, "vacuum", 0.75],
  [50.6, "pop", 0.4],
  [52.3, "crack", 0.7],
  [52.75, "glass", 0.85],
  [53.9, "servo", 0.5],
  [54.3, "ding", 0.45],
  [56.3, "pop", 0.5],
  [59.6, "ding", 0.5],
  [61.5, "pop", 0.5],
  [63.4, "servo", 0.45],
  [63.75, "zap", 0.35],
  [64.4, "zap", 0.35],
  [64.9, "zap", 0.35],
  [65.7, "rise", 0.45],
  [66.8, "zap", 0.45],
  [67.3, "ding", 0.5],
  [68.6, "pop", 0.5],
  [71.4, "pop", 0.5],
  [73.05, "pop", 0.55],
  [73.83, "pop", 0.55],
  ...Array.from({ length: 5 }).map((_, i): Cue => [74.45 + i * 0.29, "pop", 0.45]),
  [76.2, "whoosh", 0.5],
  [77.25, "thud", 0.9],
  [79.1, "thud", 0.8],
  ...Array.from({ length: 16 }).map((_, i): Cue => [80.4 + i * 0.095, "tick", 0.25]),
  [81.95, "cash", 0.6],
  [84.0, "jet", 0.45],
  [84.4, "pop", 0.5],
  [84.85, "pop", 0.5],
  [88.5, "pop", 0.6],
  [89.02, "pop", 0.6],
  [89.6, "pop", 0.6],
  [90.12, "pop", 0.6],
  [90.7, "chime", 0.55],
  [92.0, "rain", 0.5],
  [96.75, "whoosh", 0.45],
  [98.35, "pop", 0.55],
  [98.95, "pop", 0.55],
  [99.9, "pop", 0.55],
  [101.25, "ding", 0.5],
  [102.45, "chime", 0.75],
  [102.45, "pop", 0.6],
];

const Sound: React.FC = () => (
  <>
    <Html5Audio src={staticFile("asml/voice.mp3")} volume={1} />
    <Html5Audio src={staticFile("asml/sfx/music.mp3")} volume={0.15} />
    {CUES.map(([at, name, vol], i) => (
      <Sequence key={i} from={Math.round(at * FPS)} durationInFrames={name === "rain" ? 140 : name === "hum" ? 200 : 75} layout="none">
        <Html5Audio src={staticFile(`asml/sfx/${name}.mp3`)} volume={vol} />
      </Sequence>
    ))}
  </>
);

/* ----------------------------------------------------------- root */

export const Asml: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  return (
    <AbsoluteFill style={{ background: "#dfe8f3" }}>
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${LIGHT_TOP.clone().lerp(DARK_BG, darkness(t)).getStyle()} 0%, ${LIGHT_BOT.clone().lerp(DARK_BG, darkness(t)).getStyle()} 70%)`,
        }}
      />
      <ThreeCanvas width={1080} height={1920} gl={{ antialias: true, alpha: true }} flat>
        <LookProvider look={lookAt(t)}>
          <Scene t={t} />
        </LookProvider>
      </ThreeCanvas>
      <TiltShift amount={camAt(t).fov < 10 ? 2 : 5} />
      <Grade warm={0.06} vignette={0.3 + darkness(t) * 0.3} />
      <Overlays t={t} f={f} />
      <GlobalCaptions t={t} />
      <Sound />
    </AbsoluteFill>
  );
};
