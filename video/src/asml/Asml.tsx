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
import { ChipStack, CollectorV2, EuvCone, FlagTiles, HousingV2, LaserUnit, NozzleV2, PhoneV2, Shockwave, TinDrop, dropAt } from "./world2";
import {
  Air,
  Beam,
  Bus,
  Chamber,
  DutchFlag,
  F,
  Glow,
  IF,
  Laptop,
  LENS,
  Lens,
  LightBars,
  M1,
  M2,
  M3,
  MASK,
  Mask,
  Mirror,
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
export const END = 103.75;
export const TOTAL = Math.round(END * FPS);
/** We drop the voice-over's last line ("Congratulations…") and loop back to the opening instead. */
const VOICE_END = 102.4;

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
const PH: V3 = [0, 3.0, 5.0]; // the phone in the opening (and the loop at the end)
const OPEN_POS: V3 = [0, 3.05, 10.4];
const OPEN_TGT: V3 = [0, 3.0, 4.6];
const KEYS: Key[] = [
  [0.0, OPEN_POS, OPEN_TGT, 40],
  [2.5, [0, 3.05, 9.9], OPEN_TGT, 40],
  [3.5, [0.5, 3.3, 10.6], OPEN_TGT, 44],
  [5.2, [0.1, 3.12, 6.6], [0, 3.1, 5.0], 34],
  [5.9, [0.1, 3.12, 6.6], [0, 3.1, 5.0], 34],
  [8.4, [7.8, 6.2, 17], [-1.8, 3.4, 0], 42],
  [9.9, [7.2, 5.9, 16.2], [-1.8, 3.4, 0], 42],
  [10.9, STAGE_POS, STAGE_TGT, 40],
  [11.3, STAGE_POS, STAGE_TGT, 40],
  [12.6, STAGE_POS, STAGE_TGT, 2.8],
  [18.35, STAGE_POS, STAGE_TGT, 2.8],
  [19.3, [3.8, 3.8, 8.2], [0, 1.7, 0], 42],
  [22.9, [3.3, 3.5, 7.4], [0, 1.6, 0], 42],
  [23.8, STAGE_POS, STAGE_TGT, 3.2],
  [26.6, STAGE_POS, STAGE_TGT, 3.2],
  [27.6, [3.8, 3.8, 8.2], [0, 1.8, 0], 42],
  [30.0, [3.4, 3.8, 8.0], [-1.6, 2.4, 0], 42],
  [31.2, [-2.2, 3.4, 3.4], [-5.6, 2.75, 0], 36],
  [33.6, [-2.4, 3.1, 2.8], [-5.8, 2.6, 0], 34],
  [34.7, [-3.4, 2.9, 1.9], [-5.2, 2.6, 0], 30],
  [39.4, [-3.5, 3.0, 2.8], [-5.2, 2.6, 0], 32],
  [41.4, [-1.0, 4.0, 8.6], [-4.6, 2.9, 0], 40],
  [44.9, [-0.8, 4.0, 8.4], [-4.6, 2.9, 0], 40],
  [46.2, [2.4, 4.8, 16.5], [-2.2, 4.0, 0], 42],
  [50.5, [2.2, 4.8, 16.0], [-2.2, 4.0, 0], 42],
  [51.5, [-1.6, 3.4, 4.6], [-3.35, 2.6, 0], 36],
  [54.6, [-1.5, 3.6, 4.6], [-3.0, 2.9, 0], 36],
  [55.7, [-1.5, 3.4, 2.5], [-2.7, 2.6, 0], 30],
  [62.9, [-1.6, 3.4, 2.3], [-2.7, 2.6, 0], 28],
  [63.9, [1.0, 4.4, 17], [-1.4, 4.2, 0], 42],
  [67.6, [0.9, 4.4, 16.5], [-1.4, 4.2, 0], 42],
  [68.6, STAGE_POS, STAGE_TGT, 3.0],
  [75.9, STAGE_POS, STAGE_TGT, 3.0],
  [77.6, [11, 9.5, 31], [-3.5, 3.4, -1], 44],
  [85.4, [10.4, 9.0, 29.5], [-3.5, 3.4, -1], 44],
  [87.4, [8.4, 6.6, 19.5], [-2.6, 4.2, 0], 42],
  [91.6, [8.0, 6.3, 18.8], [-2.6, 4.2, 0], 42],
  [96.6, [8.0, 6.0, 18.4], [-2.6, 3.8, 0], 42],
  [98.0, [12.0, 6.1, 18.0], [0.4, 3.0, 0], 44],
  [102.3, [11.4, 6.0, 17.4], [0.4, 3.0, 0], 44],
  [103.35, OPEN_POS, OPEN_TGT, 40],
];

const camAt = (t: number) => {
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
  [2.62, 0.1],
  [34.3, 0.14],
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

  // opening: flag deleted, phone glitches, cracks and falls apart (and rebuilds for the loop)
  const loopBack = ez(t, 102.45, 103.3);
  const explode = ez(t, 2.75, 3.6) * (1 - loopBack);
  const glitch = t < 2.75 ? ez(t, 1.85, 2.4) : 0;
  const crack = t < 102 ? ez(t, 2.45, 2.7) : 0;
  const hideParts = ez(t, 5.6, 7.0) * (1 - ez(t, 102.3, 102.5));
  const phoneOn = t < 2.75 || t > 102.3 ? 1 : 0;
  const chipFly = ez(t, 10.05, 10.95);
  const chipPos: V3 = [PH[0] * (1 - chipFly), PH[1] + 0.1 + (WAFER_TOP + 0.02 - PH[1] - 0.1) * chipFly, PH[2] * (1 - chipFly)];
  const ghost = ez(t, 6.2, 7.6) * (1 - ez(t, 10.0, 10.6));

  // the chip, magnified: preview, then printed layer by layer
  let chip = 0;
  if (t < 66.9) chip = ez(t, 11.4, 12.6) * 5;
  else if (t < 70.85) chip = ez(t, 69.6, 70.4);
  else chip = t < 73.0 ? 1 : t < 73.8 ? 1 + ez(t, 73.0, 73.3) : t < 74.4 ? 2 + ez(t, 73.8, 74.1) : 3 + lin(t, 74.4, 75.6) * 2;
  if (t > 76.4) chip = 0;
  const ink = t > 16.9 && t < 18.5 ? ez(t, 17.0, 17.75) * 0.06 : 0;
  const projY = 3.05 + (1 - ez(t, 19.45, 20.0)) * 6 + ez(t, 26.9, 27.8) * 7;
  const projOn = t > 20.35 && t < 27.0 ? 1 : 0;
  const blur = ez(t, 23.6, 24.4) * (1 - ez(t, 26.9, 27.4));
  const print = ez(t, 66.95, 67.6) * (1 - ez(t, 76.0, 76.4));

  // light source
  const inShed = t > 92.3 && t < 96.8;
  const nozzleIn = 1 - ez(t, 30.25, 30.8);
  const laserIn = 1 - ez(t, 32.7, 33.2);
  const sourceOn = t > 30.25 && !inShed;
  const drops: V3[] = [];
  if (t > 30.9 && t < 33.55) for (let i = 0; i < 6; i++) drops.push(dropAt(((t - 30.9) * 0.9 + i * 0.27) % 1.6));
  if (t > 42.3 && t < 44.95) for (let i = 0; i < 6; i++) drops.push(dropAt(((t - 42.3) * 6 + i * 0.27) % 1.6));
  const pre = t >= 33.62 && t < 33.75;
  const main = t >= 34.22 && t < 34.42;
  const strobe = t > 42.3 && t < 44.95 ? (Math.floor(t * 18) % 2 === 0 ? 1 : 0.35) : 1;
  const plasma = t >= 34.3 ? ez(t, 34.3, 34.45) * (1 - ez(t, 44.9, 45.3)) : 0;
  const plasmaI = plasma * strobe * (0.85 + 0.15 * Math.sin(t * 40));
  const steadyGlow = t >= 45.3 && !inShed ? 0.75 + 0.12 * Math.sin(t * 30) : 0;
  const laserFiring = pre ? 0.6 : main ? 1 : t > 42.3 && t < 44.95 && strobe === 1 ? 0.8 : steadyGlow > 0 ? 0.4 : 0;

  // light path
  const collector = ez(t, 30.3, 30.8);
  const cone = ez(t, 39.6, 40.3);
  const beamStart = ez(t, 40.2, 41.0);
  const air = ez(t, 45.1, 45.6) * (1 - ez(t, 48.9, 50.3));
  const chamber = ez(t, 48.25, 48.95);
  const suck = lin(t, 48.9, 50.4);
  const lensShow = t > 50.55 && t < 52.75 ? ez(t, 50.55, 50.9) : 0;
  const lensCrack = ez(t, 52.25, 52.6);
  const m1 = ez(t, 53.85, 54.35);
  const others = ez(t, 63.3, 63.9);
  const b1 = air > 0.05 ? beamStart * (0.45 + 0.1 * Math.sin(t * 13)) : beamStart;
  const b2 = ez(t, 54.2, 54.8) * 0.35 + ez(t, 63.7, 64.3) * 0.65;
  const b3 = ez(t, 64.35, 64.9);
  const b4 = ez(t, 64.85, 65.3);
  const b5 = ez(t, 66.75, 67.25);
  const opticsOn = !inShed;
  const maskLit = ez(t, 65.6, 66.2);

  // machine, bus, flag, 1984
  const housing = ez(t, 76.15, 77.25) * (1 - ez(t, 91.9, 92.5)) + ez(t, 96.75, 97.4);
  const bus = ez(t, 78.6, 79.1);
  const flagOnTop = ez(t, 9.0, 9.4) * (1 - ez(t, 10.0, 10.4)) + ez(t, 90.7, 91.2) * (1 - ez(t, 91.9, 92.3)) + ez(t, 97.4, 97.8);
  const shed = ez(t, 91.9, 92.7) * (1 - ez(t, 96.7, 97.3));
  const oldM = ez(t, 92.3, 92.8) * (1 - ez(t, 96.7, 97.1));

  // products
  const pPhone = ez(t, 98.3, 98.6);
  const pLaptop = ez(t, 98.9, 99.2);
  const pServer = ez(t, 99.85, 100.15);

  // technician
  const techPos: V3 = [3.4 + ez(t, 75.9, 77.0) * 3.4, 0, 3.0 + ez(t, 75.9, 77.0) * 1.6];
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
  } else if (t > 34.3 && t < 36.8) {
    armL = [-2.4, -0.4];
    armR = [-2.4, 0.4];
    wide = true;
    brows = "raised";
  } else if (t > 98.3) {
    armR = [0, 2.6 + Math.sin(t * 10) * 0.35];
    brows = "raised";
  }

  return (
    <>
      <CameraRig position={[cam.pos[0] + sx + drift[0], cam.pos[1] + sy + drift[1], cam.pos[2]]} target={cam.tgt} fov={cam.fov} />
      <Room dark={darkness(t) > 0.5} />
      <Stage />
      <Wafer t={t} blur={blur * 0.5} print={print * (cam.fov < 10 ? 0.12 : 1)} ink={ink} lit={projOn * (1 - blur) * 0.6} />
      <ChipStack build={chip} />
      <LightBars blur={blur} crisp={ez(t, 68.3, 68.7) * (1 - ez(t, 70.6, 70.9))} />
      {t > 16.4 && t < 19.0 ? <Pen tip={[0.02 + (1 - ez(t, 16.5, 17.0)) * 0.6, WAFER_TOP + 0.005 + (1 - ez(t, 16.5, 17.0)) * 0.5 + ez(t, 18.4, 18.95) * 2, 0.0]} /> : null}
      {t > 19.3 && t < 28.2 ? <Projector y={projY} on={projOn} /> : null}

      {/* opening + loop: the flag behind your phone */}
      {t < 2.0 || t > 102.3 ? <FlagTiles position={[0, 3.0, 3.2]} t={t} gone={[0.75, 1.6]} back={[102.45, 103.15]} /> : null}
      {t < 7.2 || t > 102.3 ? (
        <PhoneV2 position={PH} explode={explode} hideParts={hideParts} chipGlow={t < 50 ? ez(t, 3.8, 4.4) : 0} glitch={glitch} crack={crack} on={phoneOn} seed={Math.floor(t * 12)} />
      ) : null}
      {t >= 7.2 && t < 11.0 ? (
        <group position={chipPos} rotation={[(-Math.PI / 2) * chipFly, 0, 0]} scale={1 - chipFly * 0.6}>
          <Block2 glow={1 - chipFly} />
        </group>
      ) : null}
      {ghost > 0 ? <Ghost k={ghost} /> : null}
      <DutchFlag position={t < 20 ? [1.6, 7.6, 0.5] : [2.6, 8.7, 0.6]} t={t} show={flagOnTop * (1 - shed)} s={1.2} />

      {/* light source: laser through the collector, tin drops, plasma */}
      {sourceOn ? (
        <>
          <NozzleV2 drop={nozzleIn} />
          <LaserUnit drop={laserIn} firing={laserFiring} />
          <CollectorV2 show={collector} glow={plasmaI + steadyGlow} />
          {drops.map((d, i) => (
            <TinDrop key={i} pos={d} />
          ))}
          {t > 33.5 && t < 34.32 ? <TinDrop pos={F} flat={ez(t, 33.62, 33.72)} /> : null}
          {pre ? <Beam from={[-8.95, 2.6, 0]} to={F} color="#ff8a3d" width={0.05} /> : null}
          {main ? <Beam from={[-8.95, 2.6, 0]} to={F} color="#ff2a1a" width={0.14} /> : null}
          {t > 42.3 && t < 44.95 && strobe === 1 ? <Beam from={[-8.95, 2.6, 0]} to={F} color="#ff2a1a" width={0.1} /> : null}
          {steadyGlow > 0 && t < 76.4 ? <Beam from={[-8.95, 2.6, 0]} to={F} color="#ff2a1a" width={0.05} opacity={0.5} /> : null}
          <Glow position={F} r={0.3 + plasma * 0.22} color="#b76bff" intensity={Math.max(plasmaI, steadyGlow)} />
          <Shockwave age={t - 34.3} />
          {t > 34.3 && t < 35.4 ? <Sparks t={t - 34.3} /> : null}
          <EuvCone k={cone * (air > 0.05 ? 0.55 : 1)} />
        </>
      ) : null}

      {/* vacuum chamber + air */}
      <Chamber build={t < 76.4 ? chamber : 0} />
      <Pump show={chamber * (t < 76.4 ? 1 : 0)} t={t} />
      <Air t={t} suck={suck} show={air > 0 && t < 50.5 ? 1 : 0} />

      {/* optics */}
      {opticsOn ? (
        <>
          <Beam from={IF} to={lensShow > 0 ? LENS : M1} progress={b1} falloff={air} opacity={t > 40 ? 1 : 0} />
          <Beam from={M1} to={MASK} progress={b2} />
          <Beam from={MASK} to={M2} progress={b3} />
          <Beam from={M2} to={M3} progress={b4} />
          <Beam from={M3} to={W} progress={b5} opacity={cam.fov < 10 ? 0.3 : 1} />
        </>
      ) : null}
      <Lens show={lensShow} crack={lensCrack} glow={t > 50.9 ? 1 : 0} />
      <Shards origin={LENS} age={t - 52.75} />
      <Mirror at={1} prev={F} next={MASK} show={opticsOn ? m1 : 0} r={0.6} hot={b1} />
      <Mirror at={3} prev={MASK} next={M3} show={opticsOn ? others : 0} />
      <Mirror at={4} prev={M2} next={W} show={opticsOn ? others : 0} r={0.5} />
      <Mask show={opticsOn ? others : 0} lit={maskLit} />
      {print > 0 && t < 76 && cam.fov > 10 ? <Glow position={[0, WAFER_TOP + 0.05, 0]} r={1.1} color="#b76bff" intensity={print * 0.35} /> : null}

      <HousingV2 build={housing} t={t} />
      <Bus position={[-2 + ez(t, 85.4, 86.8) * 26, 0, 6.2]} show={bus * (1 - shed)} />
      <Shed show={shed} t={t} />
      <OldMachine show={oldM} />

      <Phone position={[5.6, 1.5, 4.4]} rotation={[0, -0.5, 0]} scale={pPhone * 0.75} screenOn={1} />
      <Laptop position={[7.4, 0.9, 4.0]} s={pLaptop} />
      <Server position={[9.4, 0, 3.0]} s={pServer} t={t} />
      {pPhone > 0 ? (
        <>
          <Plinth x={5.6} z={4.4} h={0.45} />
          <Plinth x={7.4} z={4.0} h={0.9} />
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
      {t > 11.2 && t < 13.2 ? <Counter from={1} to={100000} start={11.3} end={12.6} y={0.13} label="ZOOM" format={(n) => "×" + Math.round(n).toLocaleString("en-US")} size={110} color="#7cc6ff" /> : null}
      {t > 13.2 && t < 16.4 ? <Tag at={13.25} text="Billions of switches" color="#7cc6ff" /> : null}
      {t > 30.9 && t < 34.85 ? <Tag at={30.95} text="Super slow motion" color="#e7c6ff" /> : null}
      <Labels t={t} />
      <Question t={t} />
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
      {t > 70.9 && t < 76.1 ? <Tag at={70.95} text={`Layer ${t < 73 ? 1 : t < 73.8 ? 2 : t < 74.4 ? 3 : Math.min(5, 3 + Math.ceil(lin(t, 74.4, 75.6) * 2))}`} color="#e7c6ff" /> : null}
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

/** Labels pinned to the machine's modules (projected from 3D). */
const projector = new THREE.PerspectiveCamera(40, 1080 / 1920, 0.1, 400);
const project = (t: number, p: V3) => {
  const c = camAt(t);
  projector.fov = c.fov;
  projector.position.set(...c.pos);
  projector.lookAt(...c.tgt);
  projector.updateProjectionMatrix();
  projector.updateMatrixWorld();
  const v = new THREE.Vector3(...p).project(projector);
  return { x: ((v.x + 1) / 2) * 1080, y: ((1 - v.y) / 2) * 1920 };
};

const LABELS: [string, V3, number][] = [
  ["LASER", [-10.6, 3.8, 0.8], 76.6],
  ["LIGHT SOURCE", [-6.6, 7.2, 1.2], 76.9],
  ["MIRRORS", [-1.2, 6.2, 2.4], 77.2],
  ["WAFER", [0, 1.4, 2.4], 77.5],
  ["CHIPS IN / OUT", [3.9, 4.4, 2.9], 77.8],
];

const Labels: React.FC<{ t: number }> = ({ t }) => {
  if (t < 76.5 || t > 79.0) return null;
  const o = 1 - ez(t, 78.6, 79.0);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      {LABELS.map(([text, p, at]) => {
        const k = ez(t, at, at + 0.25);
        if (k <= 0) return null;
        const { x, y } = project(t, p);
        return (
          <div key={text} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -100%) scale(${k})`, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ background: "#ffffff", border: "4px solid #11131f", borderRadius: 999, padding: "6px 18px", fontFamily: FONT, fontWeight: 900, fontSize: 30, color: "#1c2140", whiteSpace: "nowrap", boxShadow: "0 6px 0 rgba(0,0,0,0.35)" }}>{text}</div>
            <div style={{ width: 5, height: 34, background: "#11131f" }} />
            <div style={{ width: 14, height: 14, borderRadius: 999, background: "#ffd23f", border: "3px solid #11131f" }} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** The loop: end on the question the first line answers. */
const Question: React.FC<{ t: number }> = ({ t }) => {
  if (t < 102.45 || t > 103.5) return null;
  const k = ez(t, 102.45, 102.7);
  const o = 1 - ez(t, 103.3, 103.5);
  return (
    <div style={{ position: "absolute", top: 1180, left: 60, right: 60, opacity: o, transform: `scale(${0.7 + 0.3 * k})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, fontFamily: FONT }}>
      <DutchFlagCss w={110} />
      <div style={{ textAlign: "center", fontWeight: 900, fontSize: 92, lineHeight: 1.05, color: "#ffffff", WebkitTextStroke: "16px #111", paintOrder: "stroke fill", textShadow: "0 10px 0 rgba(0,0,0,0.45)" }}>
        WHAT IF THE DUTCH <span style={{ color: "#ffd23f" }}>NEVER EXISTED?</span>
      </div>
    </div>
  );
};

/* ----------------------------------------------------------- captions */

const GlobalCaptions: React.FC<{ t: number }> = ({ t }) => {
  const caps = CAPTIONS.filter((c) => c.start < VOICE_END);
  const chunks = caps.map((c) => ({ at: Math.round(c.start * FPS), text: c.text }));
  const active = caps.find((c, i) => t >= c.start && t < (caps[i + 1]?.start ?? c.end + 0.6));
  if (!active || t > active.end + 0.45) return null;
  return <Captions chunks={chunks} y={0.72} size={96} />;
};

/* ----------------------------------------------------------- sound */

type Cue = [number, string, number];
const CUES: Cue[] = [
  [0.8, "glitch", 0.35],
  [1.9, "glitch", 0.6],
  [2.47, "crack", 0.7],
  [2.75, "glass", 0.5],
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
  [32.75, "servo", 0.5],
  [33.62, "zap", 0.6],
  [34.22, "zap", 0.9],
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
  [102.4, "whoosh", 0.55],
  [102.5, "rise", 0.5],
  [102.6, "pop", 0.6],
];

const Sound: React.FC = () => (
  <>
    <Html5Audio src={staticFile("asml/voice.mp3")} volume={1} trimAfter={Math.round(VOICE_END * FPS)} />
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
