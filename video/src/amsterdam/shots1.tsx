import React from "react";
import { AbsoluteFill } from "remotion";
import { Ball, Block, WaterSurface, rand } from "../three/cel";
import { Character } from "../three/Character";
import { CameraRig, Pin, lerp3 } from "../three/props";
import { Pill } from "../ui/Cards";
import { CanalHouse, Debris, Diorama, DustPuff, Flames, LAYERS, Pile, PileRig, Reeds, Skyline, Smoke, WoodHouse } from "./models";
import { DepthGauge, FailStamp, NameCard, Sfx } from "./overlays";
import { AShell, DAYLOOK, FIRELOOK, SKY_DAY, SWAMPLOOK, SkyCss, ez, ezOut, shake, useT } from "./kit";

type V3 = [number, number, number];
const FILL_Y = 0.9; // ground level after raising
/** seconds -> frames (Pill/Panel take frames). */
const F = (sec: number) => Math.round(sec * 30);

/* =============================== A: "Amsterdam is one big swamp…" (0 – 4.75) */
export const ShotSwamp: React.FC<{ start: number }> = ({ start }) => {
  const t = useT(start);
  const fly = ezOut(t, 0, 2.7);
  const [sx, sy] = shake(t, [3.05], 0.25);
  const drop = ez(t, 2.72, 3.05, (x) => x * x);
  const bounce = t > 3.05 && t < 3.4 ? Math.sin(((t - 3.05) / 0.35) * Math.PI) * 0.35 : 0;
  const sink = ez(t, 3.98, 4.7) * 2.6;
  const houseY = 9 * (1 - drop) + bounce - sink;
  const housePos: V3 = [0, houseY, -14];
  return (
    <AShell
      look={SWAMPLOOK}
      sky={<SkyCss top="#8fb9d6" bottom="#eef1e2" sun={{ x: 0.25, y: 0.12, r: 26 }} />}
      overlay={
        <>
          <AbsoluteFill style={{ background: "linear-gradient(180deg, transparent 35%, rgba(240,245,235,0.45) 52%, transparent 70%)" }} />
          <Pill at={0} out={74} y={250} bg="#ffffff" icon="pin" size={60}>
            Amsterdam
          </Pill>
          <Sfx at={4.05 - start} text="GLUG!" x={0.66} y={0.5} color="#bfe3ff" rotate={8} />
        </>
      }
    >
      <CameraRig position={lerp3([0.4 + sx, 5.6 + sy, 4.5], [1.4 + sx, 3.4 + sy, -6], fly)} target={[0, 1.2 - sink * 0.2, -14]} fov={42} />
      {t < 2.72 ? (
        <Pin position={[0, Math.max(0, 6 * (1 - ezOut(t, 0, 0.45))) + (t > 0.45 && t < 0.7 ? Math.sin(((t - 0.45) / 0.25) * Math.PI) * 0.4 : 0), -14]} scale={2.4} />
      ) : null}
      <Diorama t={t} surface="swamp" waterY={-99} />
      <Reeds area={[-16, 16, -40, -2]} count={420} seed={3} />
      {[
        [-3, -12, 3.5, 2.4],
        [4, -18, 5, 3],
        [-6, -22, 4, 3],
        [2.5, -9, 2.4, 1.6],
        [0, -14, 4.2, 3.2],
      ].map(([x, z, w, d], i) => (
        <WaterSurface key={i} size={[w, d]} position={[x, 0.05, z]} time={t} color="#7fb0b8" deep="#4d7c7a" />
      ))}
      <CanalHouse position={housePos} floors={3} gable="bell" color="#8f3e2c" tilt={ez(t, 3.98, 4.7) * 0.18} />
      <DustPuff t={t} at={3.05} position={[0, 0.1, -14]} r={1.8} color="#cfe6ee" count={12} />
      {t > 4.0
        ? Array.from({ length: 10 }).map((_, i) => {
            const age = t - 4.0 - i * 0.06;
            if (age < 0) return null;
            return <Ball key={i} r={0.12 + rand(i) * 0.1} position={[(rand(i + 2) - 0.5) * 3, 0.1 + age * 1.6, -14 + (rand(i + 5) - 0.5) * 2 + 1.5]} color="#cfeaf2" opacity={Math.max(0, 1 - age)} outline={0.015} />;
          })
        : null}
    </AShell>
  );
};

/* ================== B: "…raise the ground with sand and mud…wooden house" (4.75 – 9.5) */
export const ShotRaise: React.FC<{ start: number }> = ({ start }) => {
  const t = useT(start);
  const fill = ez(t, 5.9, 7.75);
  const cam = ez(t, start, 9.5);
  const build = ez(t, 7.8, 9.25);
  return (
    <AShell look={DAYLOOK} sky={SKY_DAY}>
      <CameraRig position={lerp3([8.5, 2.2, 17], [6, 3.4, 14], cam)} target={[0, -0.9, -3]} fov={42} />
      <Diorama t={t} fill={fill} surface={fill > 0.5 ? "sand" : "swamp"} />
      {fill > 0.95 ? <Skyline wood z={-16} /> : null}
      <Reeds area={[-14, 14, -30, -0.5]} count={300} seed={5} sink={fill * 1.6} />
      <Debris t={t} t0={5.85} t1={6.95} area={[-6, 6, -9, -0.6]} landY={fill * FILL_Y} colors={["#e2bd72", "#d3a85c"]} seed={2} count={46} />
      <Debris t={t} t0={6.95} t1={7.6} area={[-6, 6, -9, -0.6]} landY={fill * FILL_Y} colors={["#6f4c33", "#5b3c28"]} seed={9} count={30} />
      {build > 0 ? <WoodHouse position={[0, FILL_Y, -2]} build={build} /> : null}
    </AShell>
  );
};

/* ========================= C1: "But wood burns." (9.5 – 11.35) */
export const ShotBurn: React.FC<{ start: number }> = ({ start }) => {
  const t = useT(start);
  const fire = ez(t, 10.3, 10.85);
  const cam = ez(t, start, 11.35);
  return (
    <AShell
      look={{ ...DAYLOOK, rim: 0.2 + fire * 0.4, rimColor: "#ff9a4a" }}
      sky={<SkyCss top={fire > 0.5 ? "#6a3a4a" : "#4f9be3"} bottom={fire > 0.5 ? "#ffa25a" : "#f7dcc0"} />}
      overlay={<Sfx at={10.5 - start} text="FWOOSH!" x={0.5} y={0.33} color="#ff9a3c" />}
    >
      <CameraRig position={lerp3([4.5, 3, 7.5], [3.5, 2.6, 5.6], cam)} target={[0, 1.9, -3.3]} fov={42} />
      <Diorama t={t} fill={1} />
      <Skyline wood z={-16} />
      <WoodHouse position={[0, FILL_Y, -2]} burnt={fire * 0.55} />
      {fire > 0 ? (
        <>
          <Flames position={[-0.6, FILL_Y + 2.6, -2.6]} s={fire * 1.1} t={t} seed={1} />
          <Flames position={[0.7, FILL_Y + 2.2, -3.2]} s={fire * 0.9} t={t} seed={2} />
          <Flames position={[0.9, FILL_Y + 0.9, -0.2]} s={fire * 0.6} t={t} seed={3} />
          <Smoke position={[0, FILL_Y + 3.8, -3]} t={t} s={fire} seed={4} />
        </>
      ) : null}
    </AShell>
  );
};

/* ================ C2: "In 1452, a fire destroyed most of the city." (11.35 – 15.0) */
export const ShotCityFire: React.FC<{ start: number }> = ({ start }) => {
  const t = useT(start);
  const cam = ez(t, start, 15);
  const houses = Array.from({ length: 6 }).flatMap((_, i) => [
    { x: -4.2, z: -i * 3.6, side: 1, i },
    { x: 4.2, z: -i * 3.6 - 1.4, side: -1, i: i + 10 },
  ]);
  return (
    <AShell
      look={FIRELOOK}
      sky={<SkyCss top="#1d1030" bottom="#ff7a2f" sun={{ x: 0.5, y: 0.62, r: 55, color: "rgba(255,150,60,0.9)" }} />}
      overlay={
        <>
          <NameCard at={11.45 - start} title="1452" sub="THE GREAT FIRE" y={0.17} accent="#ff9a3c" />
          <Embers t={t} />
        </>
      }
      warm={0.2}
      vignette={0.55}
    >
      <CameraRig position={lerp3([0, 2.6, 9], [0.3, 2.2, 3.5], cam)} target={[0, 2.4, -14]} fov={46} />
      <Block size={[60, 0.2, 80]} position={[0, -0.1, -30]} color="#3d2a22" outline={0} pattern="cobbles" patScale={[0.5, 0.5]} patColor="#21160f" />
      {houses.map((h) => (
        <group key={`${h.x}${h.z}`}>
          <WoodHouse position={[h.x, 0, h.z]} rotationY={(h.side * Math.PI) / 2} burnt={0.75} color={h.i % 2 ? "#9a6a3c" : "#8a5a32"} />
          <Flames position={[h.x - h.side * 0.3, 2.8, h.z - 1.2]} s={1.15 + rand(h.i) * 0.5} t={t} seed={h.i} />
          <Flames position={[h.x + h.side * 0.8, 0.6, h.z - 0.4]} s={0.7} t={t} seed={h.i + 3} />
          <Smoke position={[h.x, 4.2, h.z - 1.2]} t={t + h.i * 0.37} s={1.4} seed={h.i} color="#3a2d33" />
        </group>
      ))}
    </AShell>
  );
};

const Embers: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <svg width={1080} height={1920}>
      {Array.from({ length: 60 }).map((_, i) => {
        const speed = 120 + rand(i) * 220;
        const y = 1920 - (((t * speed + rand(i + 3) * 1920) % 2100) - 100);
        const x = rand(i + 7) * 1080 + Math.sin(t * 2 + i) * 30;
        return <circle key={i} cx={x} cy={y} r={2 + rand(i + 9) * 4} fill={i % 3 ? "#ffb347" : "#ffe08a"} opacity={0.85} />;
      })}
    </svg>
  </AbsoluteFill>
);

/* ===================== D: "So the city says: no more wood. Use brick." (15.0 – 17.95) */
export const ShotDecree: React.FC<{ start: number }> = ({ start }) => {
  const t = useT(start);
  const brickDrop = ez(t, 17.15, 17.38, (x) => x * x);
  const landed = t >= 17.38;
  const [sx, sy] = shake(t, [17.38], 0.2);
  return (
    <AShell
      look={{ ...DAYLOOK, fogColor: "#b9a7a0", fogNear: 8, fogFar: 40 }}
      sky={<SkyCss top="#6f6a7d" bottom="#d7b9a4" />}
      overlay={
        <>
          <NoWood at={16.1 - start} />
        </>
      }
    >
      <CameraRig position={[0.2 + sx, 1.7 + sy, 5.6 - ez(t, start, 17.95) * 0.6]} target={[0, 1.35, 0]} fov={40} />
      <Block size={[60, 0.2, 60]} position={[0, -0.1, -20]} color="#7b6d62" outline={0} pattern="cobbles" patScale={[0.5, 0.5]} patColor="#544a42" />
      <Character
        position={[0, 0, 0]}
        hatStyle="brim"
        hat="#1d1d26"
        coat="#23222c"
        collar
        cheeks={false}
        skin="#f1cfae"
        hair="#6b4a2e"
        mouth={t > 17.38 ? "o" : "talk"}
        brows={t > 17.38 ? "raised" : "angry"}
        wideEyes={t > 17.38}
        armR={t < 16.0 ? [-0.9, 0.5] : [-1.2, 1.6]}
        seed={3}
      />
      {/* scroll in his hand */}
      <group position={[0.62, 1.25, 0.45]} rotation={[0, 0, 0.1]}>
        <Block size={[0.5, 0.7, 0.02]} position={[0, -0.25, 0]} color="#efe1bd" outline={0.012} />
        <Block size={[0.56, 0.06, 0.06]} position={[0, 0.1, 0]} color="#c9a46a" outline={0.012} />
      </group>
      {/* the ruins behind */}
      {[-3.8, 3.6, -1.2, 1.4].map((x, i) => (
        <group key={x}>
          <WoodHouse position={[x, 0, -6 - i * 1.5]} burnt={1} build={0.85} rotationY={(rand(i) - 0.5) * 0.4} />
          <Smoke position={[x, 2.2, -7 - i * 1.5]} t={t + i} s={1} seed={i} color="#4b4650" />
        </group>
      ))}
      {/* "Use brick." */}
      <Block
        size={[1.4, 0.5, 0.7]}
        position={[landed ? -1.2 : -1.2, landed ? 0.25 : 0.25 + (1 - brickDrop) * 6, 0.9]}
        rotation={[0, 0.3, 0]}
        color="#b5452f"
        outline={0.04}
        pattern="speckle"
        patScale={[0.2, 0.2]}
        patColor="#7d2a1b"
      />
      <DustPuff t={t} at={17.38} position={[-1.2, 0, 0.9]} r={1.1} color="#d9c2a2" />
    </AShell>
  );
};

const NoWood: React.FC<{ at: number }> = ({ at }) => (
  <Pill at={F(at)} y={250} bg="#ffffff" color="#c1121f" size={52} icon="warn">
    No more wood
  </Pill>
);

/* ========= E: "But brick is heavy. Your house sinks into the mud… and cracks." (17.95 – 22.85) */
export const ShotBrickSinks: React.FC<{ start: number }> = ({ start }) => {
  const t = useT(start);
  const drop = ez(t, 18.0, 18.38, (x) => x * x);
  const sink = ez(t, 19.75, 21.5) * 1.15;
  const tilt = ez(t, 19.9, 21.6) * 0.13;
  const cracks = ez(t, 21.7, 22.4);
  const [sx, sy] = shake(t, [18.38, 21.8], 0.22);
  return (
    <AShell
      look={DAYLOOK}
      sky={SKY_DAY}
      overlay={
        <>
          <Sfx at={18.38 - start} text="THUD!" x={0.3} y={0.38} />
          <Pill at={F(18.7 - start)} out={F(19.7 - start)} y={250} bg="#ffd23f" icon="warn">
            Heavy!
          </Pill>
          <FailStamp at={21.85 - start} y={0.24} />
        </>
      }
    >
      <CameraRig position={lerp3([7 + sx, 4.2 + sy, 16.5], [5.2 + sx, 3.4 + sy, 13.2], ez(t, start, 22.85))} target={[0, 1.6 - sink * 0.6, -3.6]} fov={42} />
      <Diorama t={t} fill={1} wobble={sink > 0 && sink < 1.1 ? 0.8 : 0} />
      <Skyline z={-17} />
      <CanalHouse position={[0, FILL_Y + (1 - drop) * 12, -1.6]} floors={4} gable="step" sink={sink} tilt={tilt} cracks={cracks} hoist={false} />
      <DustPuff t={t} at={18.38} position={[0, FILL_Y, -2.5]} r={2.2} />
    </AShell>
  );
};

/* ===================== F: "The only hard ground… 12 meters down." (22.85 – 26.95) */
export const ShotDive: React.FC<{ start: number }> = ({ start }) => {
  const t = useT(start);
  const k = ez(t, 23.0, 26.5);
  const camY = 2.4 + (LAYERS.sandTop - 1.0 - 2.4) * k;
  const depth = Math.min(12, Math.max(0, ((FILL_Y - (camY - 0.3)) / (FILL_Y - LAYERS.sandTop)) * 12));
  return (
    <AShell
      look={DAYLOOK}
      sky={SKY_DAY}
      tilt={4}
      overlay={
        <>
          <DepthGauge value={Math.min(12, depth)} show={ez(t, start, 23.2)} />
          <LayerTag at={23.25 - start} out={24.25 - start} text="Peat" color="#7a5634" />
          <LayerTag at={24.3 - start} out={25.35 - start} text="Clay" color="#867b70" />
          <LayerTag at={25.45 - start} text="Hard sand" color="#e0bb6a" dark />
        </>
      }
    >
      <CameraRig position={[2.6, camY, 10.5 - k * 1.5]} target={[0, camY - 0.6, -1]} fov={44} />
      <Diorama t={t} fill={1} />
      <Skyline z={-17} />
      <CanalHouse position={[0, FILL_Y - 1.15, -1.6]} floors={4} gable="step" tilt={0.13} cracks={1} hoist={false} />
    </AShell>
  );
};

const LayerTag: React.FC<{ at: number; out?: number; text: string; color: string; dark?: boolean }> = ({ at, out, text, color, dark }) => (
  <Pill at={F(at)} out={out !== undefined ? F(out) : undefined} x={600} y={820} bg={color} color={dark ? "#1c2140" : "#ffffff"} size={50}>
    {text}
  </Pill>
);

/* ======= G: "So you stand a tree trunk up, and drop a heavy block on it…" (26.95 – 33.95) */
const SLAMS = [
  { at: 30.1, d: 0.22 },
  { at: 30.55, d: 0.4 },
  { at: 31.62, d: 0.56 },
  { at: 32.45, d: 0.7 },
  { at: 32.85, d: 0.84 },
  { at: 33.28, d: 1.0 },
];
const TIP_FINAL_ = LAYERS.sandTop - 0.55;
export const PILE_LEN = FILL_Y + 0.05 - TIP_FINAL_; // top ends flush with the ground
export const TIP_FINAL = TIP_FINAL_;

const pileDepth = (t: number) => {
  let d = 0;
  for (const s of SLAMS) {
    if (t >= s.at) d = s.d;
    else {
      const prev = d;
      const k = Math.min(1, Math.max(0, (t - (s.at - 0.06)) / 0.06));
      return prev + (s.d - prev) * k;
    }
  }
  return d;
};

const blockLift = (t: number) => {
  if (t < 28.6) return 1.6;
  const times = [28.6, ...SLAMS.map((s) => s.at)];
  for (let i = 1; i < times.length; i++) {
    if (t < times[i]) {
      const a = times[i - 1];
      const b = times[i];
      const fallStart = b - 0.07;
      if (t >= fallStart) return 1.5 * (1 - (t - fallStart) / 0.07);
      const up = Math.min(1, (t - a) / Math.max(0.12, (fallStart - a) * 0.7));
      return 1.5 * (i === 1 ? 1 : up);
    }
  }
  return 0;
};

export const ShotDrive: React.FC<{ start: number }> = ({ start }) => {
  const t = useT(start);
  const stand = ez(t, 27.2, 28.3);
  const d = pileDepth(t);
  const tipY = FILL_Y + (TIP_FINAL - FILL_Y) * d;
  const top = tipY + PILE_LEN;
  const lift = blockLift(t);
  const rigIn = ez(t, 28.0, 28.5);
  const hit = t >= 33.28;
  const [sx, sy] = shake(t, SLAMS.map((s) => s.at), 0.2);
  const camK = ez(t, 30.3, 33.2);
  const pulling = lift > 0.2 && lift < 1.49;
  const arms = pulling ? 0.9 + 1.6 * (1 - lift / 1.5) : 2.7;
  return (
    <AShell
      look={DAYLOOK}
      sky={SKY_DAY}
      overlay={
        <>
          <Sfx at={30.1 - start} text="BAM!" x={0.72} y={0.36} />
          <Sfx at={30.55 - start} text="BAM!" x={0.3} y={0.33} rotate={8} />
          <Sfx at={31.62 - start} text="BAM!" x={0.7} y={0.3} />
          <Pill at={F(33.3 - start)} y={250} bg="#4ade80" icon="pin">
            Hit the sand
          </Pill>
        </>
      }
    >
      <CameraRig
        position={lerp3([6.5 + sx, 6.2 + sy, 21], [5.2 + sx, -0.2 + sy, 18], camK)}
        target={lerp3([0, 4.6, -1], [0, -3.4, -0.5], camK)}
        fov={42}
      />
      <Diorama t={t} fill={1} />
      <Skyline z={-17} />
      <Pile tip={[0, tipY, 0]} len={PILE_LEN} rotation={[0, 0, (-Math.PI / 2) * (1 - stand)]} glow={hit ? Math.max(0, 1 - (t - 33.28) * 1.5) : 0} />
      {rigIn > 0 ? (
        <group position={[0, (1 - rigIn) * 8, 0]}>
          <PileRig position={[0, FILL_Y, 0]} top={FILL_Y + PILE_LEN + 2.6} blockY={top + lift - FILL_Y} />
        </group>
      ) : null}
      {[
        { a: -2.3, z: 1.4, c: "#5b6b8c", h: "#7a4a2a" },
        { a: 2.3, z: 1.2, c: "#8c5b3b", h: "#2b2b2b" },
        { a: -1.6, z: -2.2, c: "#6a7d4a", h: "#c58a3a" },
        { a: 2.0, z: -2.0, c: "#7b4b6a", h: "#3b2a20" },
      ].map((p, i) => (
        <Character
          key={i}
          position={[p.a, FILL_Y, p.z]}
          rotationY={Math.atan2(-p.a, -p.z)}
          hatStyle="none"
          hair={p.h}
          coat={p.c}
          cheeks={false}
          mouth={pulling ? "o" : "flat"}
          brows="angry"
          armL={[0, -arms]}
          armR={[0, arms]}
          seed={i + 2}
        />
      ))}
      {SLAMS.map((s) => (
        <DustPuff key={s.at} t={t} at={s.at} position={[0, FILL_Y, 0.4]} r={1.0} />
      ))}
    </AShell>
  );
};

/* ======== H: "One trunk isn't enough… dozens, side by side. This is a pile foundation." (33.95 – 40.05) */
export const GRID: { x: number; z: number }[] = [];
for (const z of [0, -1.1, -2.2, -3.3, -4.4, -5.5]) for (const x of [-1.35, -0.45, 0.45, 1.35]) GRID.push({ x, z });

export const ShotDozens: React.FC<{ start: number }> = ({ start }) => {
  const t = useT(start);
  const order = GRID.map((g, i) => ({ ...g, i })).filter((g) => !(g.x === -0.45 && g.z === 0));
  const cam = ez(t, start, 39.5);
  const impacts = order.map((_, k) => 34.15 + k * 0.165);
  const [sx, sy] = shake(t, impacts, 0.08);
  return (
    <AShell
      look={DAYLOOK}
      sky={SKY_DAY}
      overlay={<NameCard at={38.15 - start} title="PILE FOUNDATION" sub="THIS IS A" y={0.16} />}
    >
      <CameraRig position={lerp3([5 + sx, 3.2 + sy, 14], [7.5 + sx, 7.5 + sy, 15.5], cam)} target={lerp3([0, -1.2, -2], [0, -2.2, -2.8], cam)} fov={42} />
      <Diorama t={t} fill={1} />
      <Skyline z={-17} />
      <Pile tip={[-0.45, TIP_FINAL, 0]} len={PILE_LEN} glow={t > 38.15 ? Math.max(0, Math.sin((t - 38.15) * 4)) * 0.6 : 0} />
      {order.map((g, k) => {
        const at = impacts[k];
        if (t < at - 0.3) return null;
        const k1 = Math.min(1, Math.max(0, (t - (at - 0.3)) / 0.3));
        const drive = t >= at ? 1 : 0;
        const tip = drive ? TIP_FINAL : FILL_Y + (1 - k1) * 6;
        return (
          <group key={g.i}>
            <Pile tip={[g.x, tip, g.z]} len={PILE_LEN} glow={t > 38.15 ? Math.max(0, Math.sin((t - 38.15) * 4)) * 0.6 : 0} />
            <DustPuff t={t} at={at} position={[g.x, FILL_Y, g.z]} r={0.6} count={6} />
          </group>
        );
      })}
    </AShell>
  );
};
