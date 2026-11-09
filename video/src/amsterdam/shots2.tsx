import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, interpolate } from "remotion";
import { Ball, Block, ToonInstances, WaterSurface, mat4, rand } from "../three/cel";
import { Character } from "../three/Character";
import { CameraRig, lerp3 } from "../three/props";
import { Pill } from "../ui/Cards";
import { Boat, CanalHouse, Debris, Diorama, DustPuff, Mushroom, Palace, Pile, PileField, Rod, Skyline, Sofa, Tree, Window, type CanalHouseProps } from "./models";
import { Counter, FailStamp, Sfx, Tag } from "./overlays";
import { AShell, DAYLOOK, HOTLOOK, INDOOR, SKY_DAY, SkyCss, ez, ezOut, shake, useT } from "./kit";
import { PILE_LEN, TIP_FINAL } from "./shots1";

type V3 = [number, number, number];
const FILL_Y = 0.9;
const F = (sec: number) => Math.round(sec * 30);

const STREET: Omit<CanalHouseProps, "position">[] = [
  { color: "#8f3e2c", gable: "step" },
  { color: "#3b3b44", gable: "bell", painted: true },
  { color: "#a85a3a", gable: "neck" },
  { color: "#6e2f25", gable: "step" },
  { color: "#b9b2a6", gable: "bell", painted: true },
  { color: "#7a4a35", gable: "neck" },
  { color: "#2f3a33", gable: "plain", painted: true },
  { color: "#8f3e2c", gable: "bell" },
];

/* ============== I: "That's why people say Amsterdam stands on an upside-down forest." (40.05 – 44.3) */
export const ShotForest: React.FC<{ start: number }> = ({ start }) => {
  const t = useT(start);
  const roll = ez(t, 42.5, 43.4) * Math.PI;
  const xs = useMemo(() => Array.from({ length: 16 }).map((_, i) => -6 + i * 0.8), []);
  const tips: V3[] = useMemo(() => xs.map((x) => [x, TIP_FINAL, 0]), [xs]);
  const sphere = useMemo(() => new THREE.SphereGeometry(1, 16, 12), []);
  const canopies = useMemo(() => {
    const out: THREE.Matrix4[] = [];
    xs.forEach((x, i) => {
      const k = Math.min(1, Math.max(0, (t - (42.1 + (i % 7) * 0.05)) / 0.35));
      if (k <= 0) return;
      const s = k * (0.55 + rand(i) * 0.15);
      out.push(mat4([x, TIP_FINAL - 0.55, 0.2], [0, 0, 0], [s, s * 1.15, s]));
      out.push(mat4([x - 0.32, TIP_FINAL - 0.2, 0.25], [0, 0, 0], [s * 0.72, s * 0.72, s * 0.72]));
      out.push(mat4([x + 0.32, TIP_FINAL - 0.28, 0.25], [0, 0, 0], [s * 0.72, s * 0.72, s * 0.72]));
    });
    return out;
  }, [t, xs]);
  return (
    <AShell
      look={DAYLOOK}
      sky={
        <AbsoluteFill style={{ transform: `rotate(${(roll * 180) / Math.PI}deg)` }}>
          {SKY_DAY}
        </AbsoluteFill>
      }
      tilt={0}
    >
      <CameraRig position={[0, -0.9, 24]} target={[0, -0.9, 0]} fov={42} roll={roll} />
      <Diorama t={t} fill={1} surface="street" />
      {[-4.35, -1.45, 1.45, 4.35].map((x, i) => (
        <CanalHouse key={x} position={[x, FILL_Y, -0.3]} w={2.85} floors={4} {...STREET[i]} />
      ))}
      <PileField tips={tips} len={PILE_LEN} />
      <ToonInstances geometry={sphere} color="#4f9a45" matrices={canopies} outline={0.035} />
    </AShell>
  );
};

/* =========== J: "But wood rots. Except underwater. No air, no rot. So the piles must stay wet. Forever." (44.3 – 51.8) */
export const ShotRot: React.FC<{ start: number }> = ({ start }) => {
  const t = useT(start);
  const water = ez(t, 45.95, 46.9);
  const waterY = -9 + water * 8.5;
  const rot = ez(t, 44.45, 45.6) * (1 - ez(t, 46.3, 47.0)) * 0.9;
  const shroom = ezOut(t, 44.6, 45.4) * (1 - ez(t, 46.5, 47.0));
  const pull = ez(t, 48.9, 50.6);
  const camPos = lerp3([0.9, -2.7, 5.4], [6, 1.6, 17.5], pull);
  const camTgt = lerp3([0, -2.7, 0], [-1.6, -2.4, -2], pull);
  const frontXs = [-2.65, -2.1, -1.55, -1.0, -0.45, 0.55, 1.1, 1.65, 2.2, 3.4, 3.95, 4.5, 5.05];
  return (
    <AShell
      look={DAYLOOK}
      sky={SKY_DAY}
      tilt={pull > 0.5 ? 5 : 0}
      overlay={
        <>
          <Pill at={F(47.32 - start)} out={F(48.05 - start)} y={250} bg="#7cc6ff" icon="warn">
            No air
          </Pill>
          <Pill at={F(48.1 - start)} out={F(49.4 - start)} y={250} bg="#4ade80" icon="pin">
            No rot
          </Pill>
          <Tag at={49.6 - start} text="Water level" color="#7cc6ff" />
        </>
      }
    >
      <CameraRig position={camPos} target={camTgt} fov={38 + pull * 4} />
      <Diorama t={t} fill={1} waterY={waterY} canal surface="street" canalY={-0.6} />
      {pull > 0 ? <Skyline z={-17} /> : null}
      <Pile tip={[0, TIP_FINAL, 0]} len={PILE_LEN} rot={rot} />
      {[
        [-1, -1.55, 0.15],
        [1, -2.15, -0.1],
        [-1, -2.95, -0.2],
        [1, -3.6, 0.2],
        [-1, -4.1, 0.1],
        [1, -1.35, 0],
      ].map(([side, y, a], i) => (
        <Mushroom
          key={i}
          position={[side * 0.2, y, 0.12]}
          s={shroom * (1.0 + (i % 2) * 0.35)}
          rotation={[0, 0, -side * (Math.PI / 2 - 0.35) + a]}
          color={i % 2 ? "#d9773c" : "#b85a2a"}
        />
      ))}
      {t > 46.9 && t < 49.5
        ? Array.from({ length: 9 }).map((_, i) => {
            const age = t - 46.95 - i * 0.18;
            if (age < 0) return null;
            return <Ball key={i} r={0.07 + rand(i) * 0.05} position={[(rand(i + 3) - 0.5) * 0.9, -4 + age * 1.6, 0.3]} color="#e8f6ff" opacity={0.85} outline={0.012} />;
          })
        : null}
      {pull > 0 ? (
        <>
          {frontXs.map((x) => (
            <Pile key={x} tip={[x, TIP_FINAL, 0]} len={PILE_LEN} />
          ))}
          <CanalHouse position={[-1.6, FILL_Y, -0.3]} w={2.85} floors={4} {...STREET[2]} />
          <CanalHouse position={[1.4, FILL_Y, -0.3]} w={2.85} floors={5} {...STREET[0]} />
          <CanalHouse position={[4.3, FILL_Y, -0.3]} w={2.8} floors={4} {...STREET[3]} />
          <Block size={[30, 0.05, 0.05]} position={[0, -0.5, 0.03]} color="#9ff3ff" outline={0} unlit opacity={0.6 + 0.4 * Math.sin(t * 6)} />
        </>
      ) : null}
    </AShell>
  );
};

/* ===== K: "In dry summers, the water drops, air reaches the wood, and houses start to sink." (51.8 – 56.9) */
export const ShotDrought: React.FC<{ start: number }> = ({ start }) => {
  const t = useT(start);
  const drop = ez(t, 52.9, 53.95);
  const waterY = -0.5 - drop * 2.3;
  const dryRot = ez(t, 54.0, 55.2) * 0.95;
  const sink = ez(t, 55.25, 56.6) * 0.38;
  const tilt = ez(t, 55.25, 56.6) * 0.06;
  const cracks = ez(t, 55.6, 56.4);
  const frontXs = [-2.65, -2.1, -1.55, -1.0, -0.45, 0.55, 1.1, 1.65, 2.2, 3.4, 3.95, 4.5, 5.05];
  const [sx, sy] = shake(t, [55.3], 0.08);
  return (
    <AShell
      look={HOTLOOK}
      sky={<SkyCss top="#ff9f43" bottom="#ffe6a8" sun={{ x: 0.8, y: 0.12, r: 40, color: "rgba(255,255,220,1)" }} />}
      warm={0.2}
      overlay={
        <>
          <Tag at={51.95 - start} text="Dry summer" color="#ffb347" icon="therm" />
          <FailStamp at={55.95 - start} text="SINKING" color="#ff7b00" y={0.24} rotate={-8} />
        </>
      }
    >
      <CameraRig position={[6 + sx, 1.6 + sy, 17.5 - ez(t, start, 56.9) * 2]} target={[-1.6, -2.2, -2]} fov={42} />
      <Diorama t={t} fill={1} waterY={waterY} canal surface="street" canalY={-0.6 - drop * 2.0} />
      <Skyline z={-17} />
      {frontXs.map((x) => (
        <Pile key={x} tip={[x, TIP_FINAL - (x > 0.3 && x < 2.5 ? sink : 0), 0]} len={PILE_LEN} dryAbove={waterY} dryRot={dryRot} />
      ))}
      {[0.55, 1.65].map((x, i) =>
        [waterY + 0.5, waterY + 1.3].map((y, j) => (
          <Mushroom key={`${i}${j}`} position={[x + (j ? 0.2 : -0.2), y - (x > 0.3 && x < 2.5 ? sink : 0), 0.12]} s={ez(t, 54.3 + j * 0.2, 54.9 + j * 0.2) * 1.1} rotation={[0, 0, j ? -1.2 : 1.2]} />
        )),
      )}
      <CanalHouse position={[-1.6, FILL_Y, -0.3]} w={2.85} floors={4} {...STREET[2]} />
      <CanalHouse position={[1.4, FILL_Y, -0.3]} w={2.85} floors={5} {...STREET[0]} sink={sink} tilt={-tilt} cracks={cracks} />
      <CanalHouse position={[4.3, FILL_Y, -0.3]} w={2.8} floors={4} {...STREET[3]} />
    </AShell>
  );
};

/* ===== L: "Now you saw the tops flat, lay heavy beams across them, and build… brick by brick." (56.9 – 61.95) */
const GRID_X = [-1.35, -0.45, 0.45, 1.35];
const GRID_Z = [0, -1.1, -2.2, -3.3, -4.4];
const SAW_A = 57.05;
const SAW_B = 58.35;
const sawX = (t: number) => -2.4 + 4.8 * ez(t, SAW_A, SAW_B, (x) => x);

export const ShotBuild: React.FC<{ start: number }> = ({ start }) => {
  const t = useT(start);
  const sx = sawX(t);
  const build = ez(t, 60.05, 61.85, (x) => x);
  const beams = [
    { at: 58.65, size: [3.6, 0.26, 0.32] as V3, pos: [0, FILL_Y + 0.18, 0.02] as V3 },
    { at: 58.95, size: [3.6, 0.26, 0.32] as V3, pos: [0, FILL_Y + 0.18, -4.4] as V3 },
    { at: 59.3, size: [0.32, 0.26, 4.8] as V3, pos: [-1.35, FILL_Y + 0.44, -2.2] as V3 },
    { at: 59.6, size: [0.32, 0.26, 4.8] as V3, pos: [1.35, FILL_Y + 0.44, -2.2] as V3 },
  ];
  const cam = ez(t, start, 61.95);
  const [shx, shy] = shake(t, beams.map((b) => b.at), 0.06);
  return (
    <AShell look={DAYLOOK} sky={SKY_DAY} overlay={<Tag at={60.1 - start} text="Brick by brick" color="#ffd23f" />}>
      <CameraRig
        position={lerp3([4.6 + shx, 3.0 + shy, 10.5], [6.2 + shx, 4.6 + shy, 15], ez(t, 59.8, 61.9))}
        target={lerp3([0, 1.0, -1.8], [0, 2.6 + cam * 0.2, -2.4], ez(t, 59.8, 61.9))}
        fov={42}
      />
      <Diorama t={t} fill={1} />
      <Skyline z={-17} />
      {GRID_Z.flatMap((z, zi) =>
        GRID_X.map((x, xi) => {
          const extra = 0.25 + rand(zi * 4 + xi) * 0.75;
          const cut = sx > x;
          const len = PILE_LEN + (cut ? 0 : extra);
          return (
            <group key={`${zi}-${xi}`}>
              <Pile tip={[x, TIP_FINAL, z]} len={len} />
              {cut && t - (SAW_A + ((x + 2.4) / 4.8) * (SAW_B - SAW_A)) < 0.8 ? (
                <FlyingTop x={x} z={z} h={extra} age={t - (SAW_A + ((x + 2.4) / 4.8) * (SAW_B - SAW_A))} seed={zi * 4 + xi} />
              ) : null}
            </group>
          );
        }),
      )}
      {/* hand saw */}
      {t < SAW_B + 0.3 ? (
        <group position={[sx + Math.sin(t * 38) * 0.18, FILL_Y + 0.12, 0.42]}>
          <Block size={[1.3, 0.3, 0.02]} color="#c3cad6" outline={0.015} rim={0.4} />
          <Block size={[0.32, 0.36, 0.08]} position={[0.78, 0.04, 0]} color="#7a4a2a" outline={0.015} />
        </group>
      ) : null}
      <Debris t={t} t0={SAW_A} t1={SAW_B} area={[-2.2, 2.2, 0.1, 0.5]} landY={FILL_Y} colors={["#e8c48e"]} seed={21} count={26} fromY={FILL_Y + 0.6} />
      {beams.map((b) => {
        const k = ez(t, b.at - 0.25, b.at, (x) => x * x);
        if (t < b.at - 0.25) return null;
        return (
          <group key={b.at}>
            <Block size={b.size} position={[b.pos[0], b.pos[1] + (1 - k) * 5, b.pos[2]]} color="#7b5132" outline={0.03} pattern="wood" patScale={[0.12, 0.6]} patColor="#4a2e1a" />
            <DustPuff t={t} at={b.at} position={[b.pos[0], FILL_Y, b.pos[2]]} r={0.7} count={6} />
          </group>
        );
      })}
      {build > 0 ? <CanalHouse position={[0, FILL_Y + 0.58, -0.05]} w={3.0} d={4.4} floors={5} gable="neck" build={build} /> : null}
      {build > 0 && build < 0.95 ? (
        <Debris t={t} t0={60.05} t1={61.6} area={[-1.3, 1.3, -0.4, -0.2]} landY={FILL_Y + 0.6 + build * 5.2} colors={["#b5452f", "#9c3a27"]} seed={33} count={20} fromY={FILL_Y + 9} />
      ) : null}
    </AShell>
  );
};

const FlyingTop: React.FC<{ x: number; z: number; h: number; age: number; seed: number }> = ({ x, z, h, age, seed }) => {
  const dir = rand(seed) > 0.5 ? 1 : -1;
  return (
    <group position={[x + dir * age * 2.2, FILL_Y + 0.05 + h / 2 + age * 3 - 9 * age * age, z + age * 0.8]} rotation={[age * 6, 0, dir * age * 9]}>
      <Pile tip={[0, -h / 2, 0]} len={h} />
    </group>
  );
};

/* ===== M: "But the stairs are so steep, they're basically a ladder. Your sofa won't fit." (61.95 – 66.75) */
export const ShotStairs: React.FC<{ start: number }> = ({ start }) => {
  const t = useT(start);
  const bump = t > 65.5 && t < 66.6 ? Math.abs(Math.sin((t - 65.5) * 14)) * 0.12 : 0;
  const push = ez(t, 62.2, 63.2);
  const steps = 13;
  return (
    <AShell
      look={INDOOR}
      sky={<SkyCss top="#3b2a20" bottom="#3b2a20" />}
      tilt={4}
      warm={0.16}
      overlay={
        <>
          <Sfx at={63.9 - start} text="A LADDER?!" x={0.66} y={0.27} size={78} rotate={6} />
          <Sfx at={66.0 - start} dur={0.75} text="NOPE!" x={0.4} y={0.36} color="#ff5a5a" />
        </>
      }
    >
      <CameraRig position={lerp3([0.3, 2.1, 7.6], [0.7, 2.2, 6.3], ez(t, start, 66.75))} target={[0.5, 1.9, -0.6]} fov={44} />
      {/* room */}
      <Block size={[6.4, 0.2, 4.4]} position={[0, -0.1, -0.4]} color="#a87b4f" outline={0.03} pattern="planks" patScale={[1, 0.3]} patColor="#6b4a2e" />
      <Block size={[6.4, 4.6, 0.2]} position={[0, 2.2, -2.6]} color="#efe2c6" outline={0.03} />
      <Block size={[6.4, 1.1, 0.24]} position={[0, 0.55, -2.55]} color="#5d7a6e" outline={0.02} />
      <Block size={[0.2, 4.6, 4.4]} position={[-3.2, 2.2, -0.4]} color="#e6d6b5" outline={0.03} />
      <Block size={[0.2, 4.6, 4.4]} position={[3.2, 2.2, -0.4]} color="#e6d6b5" outline={0.03} />
      <Block size={[4.0, 0.3, 4.4]} position={[-1.2, 4.55, -0.4]} color="#8a6240" outline={0.03} pattern="planks" patScale={[1, 0.3]} patColor="#5a3e26" />
      <Window position={[-1.5, 2.4, -2.48]} w={0.9} h={1.3} />
      <group position={[-2.5, 2.6, -2.48]}>
        <Block size={[0.8, 0.6, 0.06]} color="#c9a227" outline={0.015} />
        <Block size={[0.66, 0.46, 0.07]} color="#4f7a9a" outline={0} />
      </group>
      {/* the very steep stairs */}
      {Array.from({ length: steps }).map((_, i) => {
        const y = (i + 1) * (4.4 / steps);
        const z = 0.9 - i * 0.2;
        return <Block key={i} size={[1.1, 0.07, 0.32]} position={[1.75, y, z]} color="#9a6b43" outline={0.02} pattern="wood" patScale={[0.1, 0.6]} patColor="#6b4a2e" />;
      })}
      {[1.17, 2.33].map((x) => (
        <Rod key={x} from={[x, 0, 1.15]} to={[x, 4.5, 0.9 - steps * 0.2]} r={0.06} color="#6b4a2e" outline={0.02} />
      ))}
      <Sofa position={[0.65 - push * 0.15, 0.62 + bump, 0.75]} rotation={[0.08, -0.2, 0.62 + bump]} />
      <Character
        position={[-0.85 + push * 0.25, 0, 0.9]}
        rotationY={0.9}
        hatStyle="none"
        hair="#3b2a20"
        coat="#3a7bd5"
        cheeks={false}
        mouth={t > 65.6 ? "o" : "flat"}
        brows={t > 63.8 ? "worried" : "angry"}
        wideEyes={t > 65.6}
        armL={[-1.4, -0.1]}
        armR={[-1.4, 0.1]}
        seed={7}
      />
    </AShell>
  );
};

/* ===== N: hoist, swing, smash, lean forward (66.75 – 77.0) */
const SWING: [number, number][] = [
  [70.38, 0],
  [70.75, 0.13],
  [71.12, -0.08],
  [71.45, 0.2],
  [71.75, -0.2],
  [72.05, 0.07],
  [72.5, 0],
];
const swingAngle = (t: number) => {
  if (t <= SWING[0][0] || t >= SWING[SWING.length - 1][0]) return 0;
  for (let i = 1; i < SWING.length; i++) {
    if (t < SWING[i][0]) {
      const [a, va] = SWING[i - 1];
      const [b, vb] = SWING[i];
      const k = (1 - Math.cos(((t - a) / (b - a)) * Math.PI)) / 2;
      return va + (vb - va) * k;
    }
  }
  return 0;
};

export const ShotHoist: React.FC<{ start: number }> = ({ start }) => {
  const t = useT(start);
  const floors = 5;
  const H = floors * 1.05;
  const lean = ez(t, 73.6, 75.4) * 0.11;
  const pivotLocal = new THREE.Vector3(0, H + 1.8 * 0.78 - 0.24, 0.84);
  const pivot = pivotLocal.clone().applyEuler(new THREE.Euler(lean, 0, 0));
  // rope length over time
  let hookY: number;
  let carry = false;
  if (t < 68.25) hookY = pivot.y - 0.3 - ez(t, 66.85, 68.2) * (pivot.y - 1.4);
  else if (t < 73.5) {
    carry = true;
    hookY = 1.4 + ez(t, 68.35, 70.2) * (4.35 - 1.4);
  } else {
    carry = true;
    hookY = 1.4 + ez(t, 74.0, 76.0) * (5.55 - 1.4);
  }
  const L = pivot.y - hookY;
  const th = carry ? swingAngle(t) : 0;
  const hook = new THREE.Vector3(pivot.x, pivot.y - L * Math.cos(th), pivot.z + L * Math.sin(th));
  const smashed = t >= 71.75 && t < 73.5;
  const into = ez(t, 76.25, 76.9);
  const sofaPos: V3 = [hook.x, hook.y - 0.95, hook.z - into * 1.1];
  const [sx, sy] = shake(t, [71.75], 0.3);
  const cam = ez(t, 73.4, 75.2);
  const openTop = ez(t, 75.6, 76.15);
  return (
    <AShell
      look={DAYLOOK}
      sky={SKY_DAY}
      overlay={
        <>
          <Sfx at={71.75 - start} text="CRASH!" x={0.62} y={0.34} color="#ff5a5a" size={110} />
          <FailStamp at={72.05 - start} y={0.22} />
          <Tag at={76.15 - start} text="On purpose ✓" color="#4ade80" />
        </>
      }
    >
      <CameraRig position={lerp3([-6.4 + sx, 3.0 + sy, 9.6], [-10.2 + sx, 3.4 + sy, 3.6], cam)} target={[0, 3.6, 0.2]} fov={44} />
      <Block size={[40, 0.2, 7]} position={[0, -0.1, 2.5]} color="#9a958c" outline={0} pattern="cobbles" patScale={[0.35, 0.35]} patColor="#6d6a64" />
      <Block size={[40, 0.5, 0.4]} position={[0, -0.25, 6.2]} color="#7d776f" outline={0.03} />
      <WaterSurface size={[40, 30]} position={[0, -0.6, 21]} time={t} />
      <CanalHouse
        position={[0, 0, 0]}
        w={2.9}
        floors={floors}
        gable="neck"
        color="#8f3e2c"
        lean={lean}
        smashed={smashed ? [3, 1] : null}
        openWindow={openTop > 0 ? [4, 1, openTop] : null}
        cracks={smashed ? 0.6 : 0}
      />
      <CanalHouse position={[-3.0, 0, -0.05]} w={2.9} floors={4} {...STREET[1]} lean={0.03} />
      <CanalHouse position={[3.0, 0, -0.05]} w={2.9} floors={4} {...STREET[4]} lean={0.05} />
      {/* plumb line vs the leaning house */}
      {lean > 0.005 ? <Rod from={[-1.5, 0.02, 0.06]} to={[-1.5, 7.2, 0.06]} r={0.025} color="#ffffff" outline={0} /> : null}
      {/* rope + hook + sofa */}
      <Rod from={[pivot.x, pivot.y, pivot.z]} to={[hook.x, hook.y, hook.z]} r={0.025} color="#d9c39a" outline={0.01} seg={6} />
      <group position={[hook.x, hook.y - 0.08, hook.z]}>
        <Block size={[0.06, 0.22, 0.06]} color="#3a3d45" outline={0.01} />
      </group>
      {carry ? (
        <group>
          <Rod from={[hook.x, hook.y, hook.z]} to={[sofaPos[0] - 0.7, sofaPos[1] + 0.75, sofaPos[2]]} r={0.015} color="#d9c39a" outline={0} seg={5} />
          <Rod from={[hook.x, hook.y, hook.z]} to={[sofaPos[0] + 0.7, sofaPos[1] + 0.75, sofaPos[2]]} r={0.015} color="#d9c39a" outline={0} seg={5} />
          <Sofa position={sofaPos} rotation={[th * 0.6, 0, 0]} scale={0.95} />
        </group>
      ) : (
        <Sofa position={[1.2, 0.02, 1.6]} rotation={[0, -0.3, 0]} scale={0.95} />
      )}
      <Character position={[-1.6, 0, 2.2]} rotationY={0.35} hatStyle="none" hair="#3b2a20" coat="#3a7bd5" cheeks={false} mouth={smashed ? "o" : "flat"} wideEyes={smashed} brows={smashed ? "raised" : "neutral"} armL={[0, -2.6]} armR={[0, 2.6]} seed={7} />
      {smashed ? <GlassShards age={t - 71.75} origin={[0, 3 * 1.05 + 0.6, 0.15]} /> : null}
    </AShell>
  );
};

const GlassShards: React.FC<{ age: number; origin: V3 }> = ({ age, origin }) => {
  if (age > 1.2) return null;
  return (
    <group>
      {Array.from({ length: 14 }).map((_, i) => {
        const vx = (rand(i) - 0.5) * 3;
        const vz = 1.5 + rand(i + 4) * 2;
        const vy = 1 + rand(i + 8) * 2;
        return (
          <Block
            key={i}
            size={[0.1 + rand(i + 2) * 0.1, 0.14, 0.02]}
            position={[origin[0] + vx * age, origin[1] + vy * age - 6 * age * age, origin[2] + vz * age]}
            rotation={[age * 8 + i, age * 6, i]}
            color="#bfe9ff"
            outline={0.01}
            unlit
          />
        );
      })}
    </group>
  );
};

/* ===== O: "That's why Amsterdam houses look like they're about to fall over." (77.0 – 80.4) */
export const StreetRow: React.FC<{ t: number; leanScale?: number }> = ({ t, leanScale = 1 }) => {
  let x = -12;
  const row = STREET.concat(STREET.slice(0, 2)).map((h, i) => {
    const w = 2.6 + rand(i + 1) * 0.5;
    const cx = x + w / 2;
    x += w + 0.04;
    return { ...h, w, cx, i };
  });
  return (
    <group>
      <Block size={[60, 0.2, 3]} position={[0, -0.1, 1.4]} color="#9a958c" outline={0} pattern="cobbles" patScale={[0.35, 0.35]} patColor="#6d6a64" />
      <Block size={[60, 0.6, 0.35]} position={[0, -0.3, 2.95]} color="#7d776f" outline={0.03} />
      <WaterSurface size={[60, 40]} position={[0, -0.6, 23]} time={t} />
      {row.map((h) => (
        <CanalHouse
          key={h.i}
          position={[h.cx, 0, 0]}
          w={h.w}
          floors={4 + (h.i % 3 === 0 ? 1 : 0)}
          color={h.color}
          gable={h.gable}
          painted={h.painted}
          lean={(0.035 + rand(h.i + 5) * 0.06) * leanScale}
          tilt={(rand(h.i + 9) - 0.5) * 0.09 * leanScale}
        />
      ))}
      {[-11.5, -6.8, 7.9, 12.6].map((tx, i) => (
        <Tree key={tx} position={[tx, 0, 2.2]} s={0.85 + rand(i) * 0.2} />
      ))}
      <Boat position={[-4.5, -0.55, 4.6]} rotationY={0.05} />
      <Boat position={[6.5, -0.55, 4.8]} rotationY={-0.04} color="#7a2f3a" />
    </group>
  );
};

export const ShotStreet: React.FC<{ start: number }> = ({ start }) => {
  const t = useT(start);
  const k = ez(t, start, 80.4, (x) => x);
  const cx = -4 + 8 * k;
  return (
    <AShell look={DAYLOOK} sky={SKY_DAY}>
      <CameraRig position={[cx, 3.4, 19.5]} target={[cx + 0.8, 3.5, 0]} fov={44} />
      <StreetRow t={t} />
      <Skyline z={-9} from={-22} to={22} seed={11} />
    </AShell>
  );
};

/* ===== P: "All around you, the ground is soft as soup… but your house stands for hundreds of years." (80.4 – 86.0) */
const DAY_TOP = new THREE.Color("#4f9be3");
const NIGHT_TOP = new THREE.Color("#141a3d");
const DAY_BOT = new THREE.Color("#f7dcc0");
const NIGHT_BOT = new THREE.Color("#3a3f7a");

export const ShotSoup: React.FC<{ start: number }> = ({ start }) => {
  const t = useT(start);
  const cyc = t > 83.3 ? (1 - Math.cos((t - 83.3) * Math.PI * 2 * 1.1)) / 2 : 0;
  const top = DAY_TOP.clone().lerp(NIGHT_TOP, cyc).getStyle();
  const bot = DAY_BOT.clone().lerp(NIGHT_BOT, cyc).getStyle();
  const orbit = ez(t, start, 86) * 0.5 - 0.15;
  const frontXs = [-2.65, -2.1, -1.55, -1.0, -0.45, 0.55, 1.1, 1.65, 2.2, 3.4, 3.95, 4.5, 5.05];
  return (
    <AShell
      look={DAYLOOK}
      sky={<SkyCss top={top} bottom={bot} />}
      overlay={
        <>
          <AbsoluteFill style={{ background: `rgba(20,25,70,${cyc * 0.45})`, mixBlendMode: "multiply" }} />
          <Counter from={1650} to={2026} start={83.45 - start} end={85.7 - start} y={0.14} label="YEAR" format={(n) => String(Math.round(n))} size={110} />
        </>
      }
    >
      <CameraRig position={[Math.sin(orbit) * 18, 2.0, Math.cos(orbit) * 18]} target={[0, -1.6, -2]} fov={42} />
      <Diorama t={t} fill={1} canal surface="street" waterY={-0.5} wobble={1} />
      <Skyline z={-17} />
      {frontXs.map((x) => (
        <Pile key={x} tip={[x, TIP_FINAL, 0]} len={PILE_LEN} />
      ))}
      <CanalHouse position={[-1.6, FILL_Y, -0.3]} w={2.85} floors={4} {...STREET[2]} lean={0.04} />
      <CanalHouse position={[1.4, FILL_Y, -0.3]} w={2.85} floors={5} {...STREET[0]} lean={0.07} />
      <CanalHouse position={[4.3, FILL_Y, -0.3]} w={2.8} floors={4} {...STREET[3]} lean={0.05} />
      {/* things that are NOT on piles bob and sink in the soup */}
      {[
        [7.2, -1.5],
        [-5.2, -2.2],
        [8.6, -4.0],
      ].map(([x, z], i) => (
        <group key={i} position={[x, FILL_Y - 0.25 + Math.sin(t * 3 + i * 2) * 0.12, z]} rotation={[Math.sin(t * 2.4 + i) * 0.15, i, Math.cos(t * 2.1 + i) * 0.15]}>
          <Block size={[0.7, 0.9, 0.7]} position={[0, 0.45, 0]} color="#7b5132" outline={0.03} pattern="planks" patScale={[1, 0.18]} patColor="#4a2e1a" />
        </group>
      ))}
    </AShell>
  );
};

/* ===== Q: "The Royal Palace needed 13,659 piles." (86.0 – 90.7) */
export const ShotPalace: React.FC<{ start: number }> = ({ start }) => {
  const t = useT(start);
  const crane = ez(t, 86.6, 88.7);
  const tips: V3[] = useMemo(() => {
    const out: V3[] = [];
    for (let r = 0; r < 5; r++) for (let i = 0; i < 41; i++) out.push([-6.2 + i * 0.31 + (r % 2) * 0.15, TIP_FINAL - rand(r * 50 + i) * 0.15, 0.2 + r * 0.42]);
    return out;
  }, []);
  return (
    <AShell
      look={DAYLOOK}
      sky={<SkyCss top="#4f9be3" bottom="#f7dcc0" sun={{ x: 0.2, y: 0.1, r: 30 }} />}
      overlay={<Counter from={0} to={13659} start={87.35 - start} end={90.0 - start} y={0.15} label="WOODEN PILES" />}
    >
      <CameraRig position={lerp3([0, 7.2, 23], [0, -2.0, 22], crane)} target={lerp3([0, 5.2, -2.5], [0, -3.4, 0], crane)} fov={44} />
      <Diorama t={t} fill={1} surface="street" />
      <Skyline z={-14} from={-24} to={24} seed={7} />
      <Palace position={[0, FILL_Y, -0.6]} />
      <PileField tips={tips} len={PILE_LEN} />
    </AShell>
  );
};

/* ===== R: "Congratulations. You have built a house in Amsterdam." (90.7 – 95.0) */
export const ShotFinale: React.FC<{ start: number }> = ({ start }) => {
  const t = useT(start);
  const k = ez(t, start, 95);
  return (
    <AShell
      look={{ ...DAYLOOK, rim: 0.3, rimColor: "#ffd2a0" }}
      sky={<SkyCss top="#6a7fd8" bottom="#ffc08a" sun={{ x: 0.75, y: 0.3, r: 45, color: "rgba(255,226,170,1)" }} />}
      warm={0.2}
      overlay={<Confetti t={t - 90.85} />}
    >
      <CameraRig position={lerp3([3.4, 1.9, 12.5], [1.6, 2.6, 9.4], k)} target={[0.2, 3.4, 0]} fov={44} />
      <StreetRow t={t} leanScale={0.7} />
      <Skyline z={-9} from={-22} to={22} seed={11} />
      <Character position={[0.6, 0, 2.0]} rotationY={-0.15} hatStyle="none" hair="#3b2a20" coat="#3a7bd5" cheeks={false} mouth="smile" wave seed={7} />
      <Sofa position={[-0.9, 0.02, 1.9]} rotation={[0, 0.4, 0]} scale={0.9} />
      <DustPuff t={t} at={90.85} position={[0.6, 0.1, 2.0]} r={1.2} color="#ffe08a" />
      <Debris t={t} t0={90.9} t1={91.8} area={[-3, 3, 0.5, 3]} landY={0.05} colors={["#ffd23f", "#ff5a5a", "#4ade80", "#7cc6ff"]} seed={77} count={40} fromY={8} />
    </AShell>
  );
};

const Confetti: React.FC<{ t: number }> = ({ t }) => {
  if (t < 0) return null;
  const colors = ["#ffd23f", "#ff5a5a", "#4ade80", "#7cc6ff", "#c084fc"];
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1080} height={1920}>
        {Array.from({ length: 140 }).map((_, i) => {
          const delay = rand(i + 11) * 1.2;
          const age = t - delay;
          if (age < 0) return null;
          const x = rand(i) * 1080 + Math.sin(age * 3 + i) * 40;
          const y = -60 + (380 + rand(i + 2) * 420) * age;
          const rot = (age * (200 + rand(i + 3) * 500) + i * 30) % 360;
          const op = interpolate(t, [3.6, 4.2], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <rect key={i} x={x} y={y} width={16} height={26} fill={colors[i % colors.length]} opacity={op} transform={`rotate(${rot} ${x + 8} ${y + 13})`} />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
