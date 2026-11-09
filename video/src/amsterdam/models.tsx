import React, { useMemo } from "react";
import * as THREE from "three";
import { Ball, Block, Cone, Cyl, Toon, ToonInstances, WaterSurface, mat4, rand, type Pattern } from "../three/cel";

type V3 = [number, number, number];

/* ------------------------------------------------------------- helpers */

/** A cylinder stretched between two points (legs, ropes, poles). */
export const Rod: React.FC<{ from: V3; to: V3; r: number; color: string; outline?: number; seg?: number }> = ({
  from,
  to,
  r,
  color,
  outline = 0.02,
  seg = 10,
}) => {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const len = a.distanceTo(b);
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  const e = new THREE.Euler().setFromQuaternion(q);
  return <Cyl rt={r} rb={r} h={Math.max(len, 0.001)} seg={seg} position={[mid.x, mid.y, mid.z]} rotation={[e.x, e.y, e.z]} color={color} outline={outline} />;
};

const useExtrude = (pts: [number, number][], depth: number, curve?: (s: THREE.Shape) => void) =>
  useMemo(() => {
    const s = new THREE.Shape();
    if (curve) curve(s);
    else {
      s.moveTo(pts[0][0], pts[0][1]);
      pts.slice(1).forEach(([x, y]) => s.lineTo(x, y));
      s.closePath();
    }
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 10 });
    g.translate(0, 0, -depth);
    return g;
  }, [JSON.stringify(pts), depth]); // eslint-disable-line react-hooks/exhaustive-deps

/** Triangular roof prism, ridge along z, sitting on y=0, spanning z ∈ [0, -d]. */
export const RoofPrism: React.FC<{ w: number; h: number; d: number; color: string; position?: V3; pattern?: Pattern }> = ({
  w,
  h,
  d,
  color,
  position,
  pattern = "tiles",
}) => {
  const g = useExtrude(
    [
      [-w / 2, 0],
      [w / 2, 0],
      [0, h],
    ],
    d,
  );
  return <Toon geometry={g} color={color} outline={0.035} outlineMode="scale" position={position} pattern={pattern} patScale={[0.22, 0.16]} patColor="#1d1f27" patStrength={0.6} />;
};

/* --------------------------------------------------------- windows etc */

export const Window: React.FC<{
  w?: number;
  h?: number;
  position: V3;
  trim?: string;
  glass?: string;
  broken?: number;
  open?: number;
}> = ({ w = 0.5, h = 0.72, position, trim = "#f4efe4", glass = "#3d5f86", broken = 0, open = 0 }) => (
  <group position={position}>
    <Block size={[w + 0.13, h + 0.13, 0.06]} position={[0, 0, 0.03]} color={trim} outline={0.018} />
    {open > 0 ? (
      <Block size={[w, h, 0.07]} position={[0, 0, 0.035]} color="#1b1e2b" outline={0} unlit />
    ) : (
      <>
        <Block size={[w, h, 0.07]} position={[0, 0, 0.035]} color={broken > 0 ? "#151826" : glass} outline={0} rim={0.25} />
        {broken > 0 ? null : (
          <Block size={[w * 0.18, h * 0.35, 0.075]} position={[-w * 0.22, h * 0.18, 0.04]} rotation={[0, 0, 0.5]} color="#ffffff" opacity={0.35} outline={0} unlit />
        )}
        <Block size={[0.045, h, 0.08]} position={[0, 0, 0.04]} color={trim} outline={0} />
        <Block size={[w, 0.045, 0.08]} position={[0, h * 0.12, 0.04]} color={trim} outline={0} />
      </>
    )}
    {open > 0 ? (
      // two shutters swung open
      <>
        <Block size={[w / 2, h, 0.04]} position={[-w / 2 - (w / 4) * Math.cos(open * 1.4), 0, 0.06 + (w / 4) * Math.sin(open * 1.4)]} rotation={[0, open * 1.4, 0]} color={trim} outline={0.012} />
        <Block size={[w / 2, h, 0.04]} position={[w / 2 + (w / 4) * Math.cos(open * 1.4), 0, 0.06 + (w / 4) * Math.sin(open * 1.4)]} rotation={[0, -open * 1.4, 0]} color={trim} outline={0.012} />
      </>
    ) : null}
  </group>
);

/** Zig-zag crack drawn on a wall (local xy plane, facing +z). */
export const Crack: React.FC<{ position: V3; progress: number; seed?: number; len?: number; color?: string }> = ({
  position,
  progress,
  seed = 1,
  len = 1.6,
  color = "#16161f",
}) => {
  if (progress <= 0) return null;
  const segs = 7;
  const shown = Math.ceil(segs * Math.min(progress, 1));
  const pts: [number, number][] = [[0, 0]];
  for (let i = 1; i <= segs; i++) {
    pts.push([pts[i - 1][0] + (rand(seed + i) - 0.5) * 0.35, pts[i - 1][1] - len / segs]);
  }
  return (
    <group position={position}>
      {pts.slice(0, shown).map((p, i) => {
        const q = pts[i + 1];
        const dx = q[0] - p[0];
        const dy = q[1] - p[1];
        const l = Math.hypot(dx, dy);
        return (
          <Block
            key={i}
            size={[0.045 * (1 - i / segs) + 0.015, l + 0.02, 0.02]}
            position={[(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, 0.01]}
            rotation={[0, 0, Math.atan2(dy, dx) + Math.PI / 2]}
            color={color}
            outline={0}
            unlit
          />
        );
      })}
    </group>
  );
};

/* ---------------------------------------------------------- canal house */

export type Gable = "step" | "bell" | "neck" | "plain";

const gableShape = (type: Gable, w: number, h: number) => (s: THREE.Shape) => {
  const hw = w / 2;
  if (type === "step") {
    const st = h / 4;
    const xs = [hw, hw * 0.76, hw * 0.52, hw * 0.3];
    s.moveTo(-hw, 0);
    for (let i = 0; i < 4; i++) {
      s.lineTo(-xs[i], (i + 1) * st);
      if (i < 3) s.lineTo(-xs[i + 1], (i + 1) * st);
    }
    for (let i = 3; i >= 0; i--) {
      if (i < 3) s.lineTo(xs[i + 1], (i + 1) * st);
      s.lineTo(xs[i], (i + 1) * st);
      s.lineTo(xs[i], i * st);
    }
    s.closePath();
  } else if (type === "bell") {
    s.moveTo(-hw, 0);
    s.bezierCurveTo(-hw * 1.05, h * 0.5, -hw * 0.35, h * 0.45, -hw * 0.38, h * 0.86);
    s.quadraticCurveTo(0, h * 1.12, hw * 0.38, h * 0.86);
    s.bezierCurveTo(hw * 0.35, h * 0.45, hw * 1.05, h * 0.5, hw, 0);
    s.closePath();
  } else if (type === "neck") {
    s.moveTo(-hw, 0);
    s.lineTo(-hw, h * 0.12);
    s.quadraticCurveTo(-hw * 0.5, h * 0.18, -hw * 0.5, h * 0.55);
    s.lineTo(-hw * 0.5, h * 0.88);
    s.lineTo(0, h * 1.08);
    s.lineTo(hw * 0.5, h * 0.88);
    s.lineTo(hw * 0.5, h * 0.55);
    s.quadraticCurveTo(hw * 0.5, h * 0.18, hw, h * 0.12);
    s.lineTo(hw, 0);
    s.closePath();
  } else {
    s.moveTo(-hw, 0);
    s.lineTo(0, h);
    s.lineTo(hw, 0);
    s.closePath();
  }
};

export type CanalHouseProps = {
  position?: V3;
  rotationY?: number;
  w?: number;
  floors?: number;
  floorH?: number;
  d?: number;
  color?: string;
  trim?: string;
  door?: string;
  gable?: Gable;
  /** Forward lean in radians (top moves toward +z). */
  lean?: number;
  /** Sideways lean in radians. */
  tilt?: number;
  hoist?: boolean;
  cracks?: number;
  /** Window index (floor, col) that is smashed. */
  smashed?: [number, number] | null;
  /** Open window (floor, col) with shutters swung open, 0..1 */
  openWindow?: [number, number, number] | null;
  /** 0..1 build progress (walls rise from the ground). */
  build?: number;
  sink?: number;
  painted?: boolean;
};

export const CanalHouse: React.FC<CanalHouseProps> = ({
  position = [0, 0, 0],
  rotationY = 0,
  w = 2.6,
  floors = 4,
  floorH = 1.05,
  d = 4,
  color = "#8f3e2c",
  trim = "#f4efe4",
  door = "#1f4d3a",
  gable = "step",
  lean = 0,
  tilt = 0,
  hoist = true,
  cracks = 0,
  smashed = null,
  openWindow = null,
  build = 1,
  sink = 0,
  painted = false,
}) => {
  const H = floors * floorH;
  const gh = gable === "plain" ? w * 0.55 : 1.8;
  const shape = useMemo(() => gableShape(gable, w, gh), [gable, w, gh]);
  const gableGeo = useExtrude([], 0.32, shape);
  const cols = w >= 2.5 ? 3 : 2;
  const xs = cols === 3 ? [-w * 0.3, 0, w * 0.3] : [-w * 0.22, w * 0.22];
  const brick = painted
    ? { pattern: "planks" as Pattern, patScale: [1, 0.35] as [number, number], patColor: "#00000022", patStrength: 0.15 }
    : { pattern: "brick" as Pattern, patScale: [0.2, 0.085] as [number, number], patColor: "#e6d8c3", patStrength: 0.6 };
  const shownH = H * Math.min(1, build * 1.25);
  const gableVisible = build >= 0.82;
  return (
    <group position={[position[0], position[1] - sink, position[2]]} rotation={[lean, rotationY, tilt]}>
      {/* plinth */}
      <Block size={[w + 0.06, 0.32, d + 0.04]} position={[0, 0.16, -d / 2]} color="#57524e" outline={0.03} pattern="stone" patScale={[0.5, 0.16]} patColor="#3c3835" patStrength={0.5} />
      {shownH > 0.33 ? (
        <Block size={[w, shownH - 0.32, d]} position={[0, 0.32 + (shownH - 0.32) / 2, -d / 2]} color={color} outline={0.04} {...brick} />
      ) : null}
      {build >= 1 ? (
        <>
          {/* cornice under the gable */}
          <Block size={[w + 0.14, 0.12, 0.3]} position={[0, H, 0.0]} color={trim} outline={0.02} />
          {/* floor bands */}
          {Array.from({ length: floors - 1 }).map((_, f) => (
            <Block key={f} size={[w + 0.02, 0.05, 0.05]} position={[0, (f + 1) * floorH, 0.025]} color={trim} outline={0} />
          ))}
        </>
      ) : null}
      {gableVisible ? (
        <group position={[0, H, 0]}>
          <Toon geometry={gableGeo} color={color} outline={0.04} outlineMode="scale" {...brick} />
          <Toon geometry={gableGeo} color={trim} outline={0.03} outlineMode="scale" position={[0, -0.02, -0.06]} scale={[(w + 0.16) / w, (gh + 0.12) / gh, 1]} />
          <RoofPrism w={w * 0.98} h={gh * 0.8} d={d - 0.35} color="#3a3f4c" position={[0, 0, -0.33]} />
          {/* attic window + hoist beam */}
          <Window w={0.42} h={0.55} position={[0, gh * 0.38, 0.01]} trim={trim} />
          {hoist ? (
            <group position={[0, gh * 0.78, 0]}>
              <Block size={[0.14, 0.14, 1.0]} position={[0, 0, 0.42]} color="#3b2a20" outline={0.02} />
              <Block size={[0.1, 0.24, 0.1]} position={[0, -0.12, 0.84]} color="#3b2a20" outline={0.015} />
            </group>
          ) : null}
        </group>
      ) : null}
      {/* windows */}
      {Array.from({ length: floors }).flatMap((_, f) =>
        xs.map((x, c) => {
          const y = f * floorH + floorH * 0.55 + (f === 0 ? 0.05 : 0);
          if (y + 0.4 > shownH) return null;
          if (f === 0 && c === 0) return null; // door goes here
          const isSmashed = smashed && smashed[0] === f && smashed[1] === c ? 1 : 0;
          const op = openWindow && openWindow[0] === f && openWindow[1] === c ? openWindow[2] : 0;
          return (
            <Window
              key={`${f}-${c}`}
              position={[x, y, 0]}
              w={f === 0 ? 0.52 : 0.5}
              h={f === floors - 1 ? 0.62 : 0.72}
              trim={trim}
              broken={isSmashed}
              open={op}
            />
          );
        }),
      )}
      {/* door + stoop */}
      {shownH > 1.2 ? (
        <group position={[xs[0], 0, 0]}>
          <Block size={[0.72, 1.18, 0.06]} position={[0, 0.88, 0.03]} color={trim} outline={0.02} />
          <Block size={[0.56, 1.02, 0.08]} position={[0, 0.82, 0.04]} color={door} outline={0.012} pattern="planks" patScale={[1, 0.2]} patColor="#00000033" patStrength={0.4} />
          <Ball r={0.035} position={[0.16, 0.8, 0.1]} color="#d6b04c" outline={0} />
          <Block size={[0.9, 0.14, 0.42]} position={[0, 0.07, 0.24]} color="#6e6863" outline={0.02} />
          <Block size={[0.9, 0.14, 0.26]} position={[0, 0.21, 0.13]} color="#6e6863" outline={0.02} />
        </group>
      ) : null}
      {/* cracks */}
      {cracks > 0 ? (
        <>
          <Crack position={[w * 0.12, H * 0.92, 0.075]} progress={cracks} seed={3} len={H * 0.55} />
          <Crack position={[-w * 0.36, H * 0.6, 0.075]} progress={cracks * 1.2 - 0.2} seed={8} len={H * 0.4} />
        </>
      ) : null}
    </group>
  );
};

/* ------------------------------------------------------- wooden house */

export const WoodHouse: React.FC<{
  position?: V3;
  rotationY?: number;
  color?: string;
  w?: number;
  h?: number;
  d?: number;
  build?: number;
  burnt?: number;
  sink?: number;
  tilt?: number;
}> = ({ position = [0, 0, 0], rotationY = 0, color = "#a8723f", w = 2.6, h = 2.1, d = 3, build = 1, burnt = 0, sink = 0, tilt = 0 }) => {
  const c = new THREE.Color(color).lerp(new THREE.Color("#241a16"), burnt).getStyle();
  const roofC = new THREE.Color("#6a4527").lerp(new THREE.Color("#1a1412"), burnt).getStyle();
  const wallH = h * Math.min(1, build / 0.7);
  const roofT = Math.max(0, (build - 0.7) / 0.3);
  const gableGeo = useExtrude(
    [
      [-w / 2, 0],
      [w / 2, 0],
      [0, w * 0.62],
    ],
    0.08,
  );
  return (
    <group position={[position[0], position[1] - sink, position[2]]} rotation={[0, rotationY, tilt]}>
      {wallH > 0.02 ? (
        <Block size={[w, wallH, d]} position={[0, wallH / 2, -d / 2]} color={c} outline={0.04} pattern="planks" patScale={[1, 0.28]} patColor="#4a2e1a" patStrength={0.7} />
      ) : null}
      {build >= 0.7 ? (
        <>
          {[-0.55, 0.55].map((x) => (
            <group key={x} position={[x * w * 0.6, h * 0.55, 0.01]}>
              <Block size={[0.5, 0.5, 0.05]} color={burnt > 0.3 ? "#ff8a2a" : "#2d2f3d"} unlit={burnt > 0.3} outline={0.015} />
              <Block size={[0.06, 0.5, 0.07]} color="#5a3a22" outline={0} />
            </group>
          ))}
          <Block size={[0.6, 1.1, 0.05]} position={[0, 0.55, 0.01]} color="#5b3820" outline={0.015} pattern="planks" patScale={[1, 0.18]} patColor="#2c1a10" />
        </>
      ) : null}
      {roofT > 0 ? (
        <group position={[0, h + (1 - roofT) * 2.5, 0]}>
          <Toon geometry={gableGeo} color={c} outline={0.03} outlineMode="scale" position={[0, 0, 0.04]} pattern="planks" patScale={[1, 0.28]} patColor="#4a2e1a" patStrength={0.7} />
          <RoofPrism w={w + 0.5} h={w * 0.66} d={d + 0.4} color={roofC} position={[0, -0.02, 0.2]} />
        </group>
      ) : null}
    </group>
  );
};

/* --------------------------------------------------------------- piles */

export const PILE_COLOR = "#c08c55";

export const Pile: React.FC<{
  /** World position of the pointed bottom tip. */
  tip: V3;
  len: number;
  r?: number;
  rot?: number;
  rotation?: V3;
  glow?: number;
  /** World y above which the pile is exposed to air (dry summer). */
  dryAbove?: number;
  dryRot?: number;
}> = ({ tip, len, r = 0.22, rot = 0, rotation, glow = 0, dryAbove, dryRot = 0 }) => {
  const c = new THREE.Color(PILE_COLOR).lerp(new THREE.Color("#3b2d22"), rot * 0.85);
  if (glow > 0) c.lerp(new THREE.Color("#fff3b0"), glow * 0.6);
  const col = c.getStyle();
  return (
    <group position={tip} rotation={rotation}>
      <Cone r={r * 0.92} h={0.45} seg={14} position={[0, 0.225, 0]} rotation={[Math.PI, 0, 0]} color={col} outline={0.02} pattern="wood" patScale={[0.08, 0.5]} patColor="#7a5332" />
      <Cyl rt={r} rb={r * 0.92} h={len - 0.45} seg={16} position={[0, 0.45 + (len - 0.45) / 2, 0]} color={col} outline={0.025} pattern="wood" patScale={[0.08, 0.5]} patColor="#7a5332" />
      <Cyl rt={r * 0.96} rb={r * 0.96} h={0.03} seg={16} position={[0, len, 0]} color={rot > 0.5 ? "#4a3a2c" : "#e8c48e"} outline={0} />
      {dryAbove !== undefined && dryRot > 0 && dryAbove < tip[1] + len ? (
        <Cyl
          rt={r * 1.03}
          rb={r * 1.03}
          h={tip[1] + len - Math.max(dryAbove, tip[1] + 0.5)}
          seg={16}
          position={[0, (len + Math.max(dryAbove - tip[1], 0.5)) / 2, 0]}
          color={new THREE.Color(PILE_COLOR).lerp(new THREE.Color("#2e241c"), dryRot).getStyle()}
          outline={0.025}
          pattern="speckle"
          patScale={[0.12, 0.12]}
          patColor="#1a140f"
        />
      ) : null}
    </group>
  );
};

/** Lots of identical piles in one draw call. */
export const PileField: React.FC<{ tips: V3[]; len: number; r?: number; color?: string }> = ({ tips, len, r = 0.22, color = PILE_COLOR }) => {
  const g = useMemo(() => {
    const geo = new THREE.CylinderGeometry(r, r * 0.8, len, 10);
    geo.translate(0, len / 2, 0);
    return geo;
  }, [len, r]);
  const mats = useMemo(() => tips.map((t) => mat4(t)), [tips]);
  return <ToonInstances geometry={g} color={color} matrices={mats} outline={0.02} outlineMode="scale" pattern="wood" patScale={[0.08, 0.5]} patColor="#7a5332" />;
};

export const Mushroom: React.FC<{ position: V3; s: number; rotation?: V3; color?: string }> = ({ position, s, rotation, color = "#d9773c" }) => {
  if (s <= 0.01) return null;
  return (
    <group position={position} rotation={rotation} scale={s}>
      <Cyl rt={0.05} rb={0.07} h={0.18} seg={8} position={[0, 0.09, 0]} color="#f2e8d5" outline={0.012} />
      <Ball r={0.16} seg={14} position={[0, 0.2, 0]} scale={[1, 0.6, 1]} color={color} outline={0.015} />
      <Ball r={0.035} seg={8} position={[0.07, 0.27, 0.06]} color="#fff6e6" outline={0} unlit />
      <Ball r={0.03} seg={8} position={[-0.06, 0.26, 0.08]} color="#fff6e6" outline={0} unlit />
    </group>
  );
};

/* ------------------------------------------------------ pile driver rig */

export const PileRig: React.FC<{ position: V3; top: number; blockY: number; ropeColor?: string }> = ({
  position,
  top,
  blockY,
  ropeColor = "#d9c39a",
}) => {
  const feet: V3[] = [0, 1, 2].map((i) => {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
    return [Math.cos(a) * 1.7, 0, Math.sin(a) * 1.4];
  });
  const apex: V3 = [0, top, 0];
  return (
    <group position={position}>
      {feet.map((f, i) => (
        <Rod key={i} from={f} to={apex} r={0.11} color="#7a5332" outline={0.03} />
      ))}
      <Cyl rt={0.22} rb={0.22} h={0.1} seg={18} position={[0, top - 0.15, 0.12]} rotation={[Math.PI / 2, 0, 0]} color="#5a4030" outline={0.02} />
      {/* rope to the block */}
      <Rod from={[0, top - 0.15, 0.12]} to={[0, blockY + 0.6, 0.12]} r={0.022} color={ropeColor} outline={0.01} seg={6} />
      {/* the heavy block (heiblok) */}
      <group position={[0, blockY, 0.12]}>
        <Block size={[0.85, 0.8, 0.85]} position={[0, 0.4, 0]} color="#5a4a40" outline={0.04} pattern="wood" patScale={[0.12, 0.6]} patColor="#2d2724" />
        {[-0.28, 0.28].map((y) => (
          <Block key={y} size={[0.9, 0.09, 0.9]} position={[0, 0.4 + y, 0]} color="#2c2e36" outline={0.015} />
        ))}
      </group>
    </group>
  );
};

/* --------------------------------------------------------------- sofa */

export const Sofa: React.FC<{ position?: V3; rotation?: V3; color?: string; scale?: number }> = ({
  position,
  rotation,
  color = "#b8324a",
  scale = 1,
}) => (
  <group position={position} rotation={rotation} scale={scale}>
    <Block size={[1.6, 0.26, 0.72]} position={[0, 0.2, 0]} color="#6b1d2c" outline={0.025} />
    <Block size={[0.72, 0.18, 0.62]} position={[-0.37, 0.42, 0.04]} color={color} outline={0.02} />
    <Block size={[0.72, 0.18, 0.62]} position={[0.37, 0.42, 0.04]} color={color} outline={0.02} />
    <Block size={[1.6, 0.62, 0.2]} position={[0, 0.62, -0.28]} color={color} outline={0.025} />
    {[-0.82, 0.82].map((x) => (
      <Block key={x} size={[0.2, 0.46, 0.74]} position={[x, 0.44, 0]} color={color} outline={0.025} />
    ))}
    {[-0.7, 0.7].map((x) => (
      <Cyl key={x} rt={0.05} rb={0.035} h={0.12} seg={8} position={[x, 0.04, 0.22]} color="#3b2a20" outline={0.01} />
    ))}
  </group>
);

/* --------------------------------------------------------- nature bits */

export const Reeds: React.FC<{ area: [number, number, number, number]; count: number; seed?: number; y?: number; sink?: number }> = ({
  area,
  count,
  seed = 1,
  y = 0,
  sink = 0,
}) => {
  const blade = useMemo(() => {
    const g = new THREE.ConeGeometry(0.035, 1.3, 5);
    g.translate(0, 0.65, 0);
    return g;
  }, []);
  const head = useMemo(() => {
    const g = new THREE.CapsuleGeometry(0.05, 0.22, 3, 8);
    return g;
  }, []);
  const { blades, heads } = useMemo(() => {
    const b: THREE.Matrix4[] = [];
    const h: THREE.Matrix4[] = [];
    const [x0, x1, z0, z1] = area;
    for (let i = 0; i < count; i++) {
      const x = x0 + rand(seed + i * 1.7) * (x1 - x0);
      const z = z0 + rand(seed + i * 3.1) * (z1 - z0);
      const tall = 0.7 + rand(seed + i * 5.3) * 0.8;
      const lean: V3 = [(rand(seed + i * 7.9) - 0.5) * 0.35, rand(seed + i) * 3, (rand(seed + i * 2.2) - 0.5) * 0.35];
      b.push(mat4([x, y - sink, z], lean, [1, tall, 1]));
      if (i % 3 === 0) {
        const tip = new THREE.Vector3(0, 1.3 * tall + 0.05, 0).applyEuler(new THREE.Euler(...lean));
        h.push(mat4([x + tip.x, y - sink + tip.y, z + tip.z], lean));
      }
    }
    return { blades: b, heads: h };
  }, [area, count, seed, y, sink]);
  return (
    <group>
      <ToonInstances geometry={blade} color="#86a046" matrices={blades} outline={0.012} />
      <ToonInstances geometry={head} color="#6b4a2e" matrices={heads} outline={0.012} />
    </group>
  );
};

export const Tree: React.FC<{ position: V3; s?: number; color?: string }> = ({ position, s = 1, color = "#5c9a48" }) => (
  <group position={position} scale={s}>
    <Cyl rt={0.14} rb={0.2} h={2.2} seg={10} position={[0, 1.1, 0]} color="#6b4b35" outline={0.03} pattern="wood" patScale={[0.08, 0.5]} patColor="#4a3020" />
    <Ball r={1.0} seg={18} position={[0, 2.7, 0]} color={color} outline={0.04} />
    <Ball r={0.75} seg={16} position={[0.7, 2.4, 0.2]} color={color} outline={0.04} />
    <Ball r={0.7} seg={16} position={[-0.7, 2.35, -0.1]} color={color} outline={0.04} />
    <Ball r={0.65} seg={16} position={[0.1, 3.3, 0.1]} color={color} outline={0.04} />
  </group>
);

export const Boat: React.FC<{ position: V3; rotationY?: number; color?: string }> = ({ position, rotationY = 0, color = "#2f5d50" }) => {
  const hull = useExtrude(
    [
      [-1.6, 0.25],
      [-1.3, -0.2],
      [1.3, -0.2],
      [1.8, 0.3],
    ],
    0.9,
  );
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Toon geometry={hull} color={color} outline={0.03} outlineMode="scale" position={[0, 0, 0.45]} />
      <Block size={[3.1, 0.08, 0.92]} position={[0.1, 0.27, 0]} color="#f2efe6" outline={0.02} />
      <Block size={[1.2, 0.45, 0.7]} position={[-0.3, 0.52, 0]} color="#e9e3d2" outline={0.02} />
      <Block size={[1.25, 0.08, 0.75]} position={[-0.3, 0.78, 0]} color="#b8324a" outline={0.015} />
    </group>
  );
};

/* ------------------------------------------------------------- fire */

const useFlameGeo = () =>
  useMemo(() => {
    // teardrop: round belly, pointed curling tip
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 16; i++) {
      const v = i / 16;
      const r = Math.sin(Math.PI * Math.pow(v, 0.62)) * (1 - v) ** 0.35 * 0.42;
      pts.push(new THREE.Vector2(Math.max(r, 0.0001), v * 1.6));
    }
    return new THREE.LatheGeometry(pts, 14);
  }, []);

export const Flames: React.FC<{ position: V3; s?: number; t: number; seed?: number }> = ({ position, s = 1, t, seed = 0 }) => {
  const g = useFlameGeo();
  return (
    <group position={position} scale={s}>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 + seed;
        const r = i === 0 ? 0 : 0.34;
        const fl = 1 + 0.25 * Math.sin(t * 15 + i * 2.1 + seed) + 0.14 * Math.sin(t * 27 + i);
        const h = (i === 0 ? 1.25 : 0.8) * fl;
        const sway = Math.sin(t * 9 + i + seed) * 0.12;
        return (
          <group key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]} rotation={[0, 0, sway]}>
            <Toon geometry={g} color="#ff5a1f" outline={0.03} unlit scale={[1, h, 1]} />
            <Toon geometry={g} color="#ffb02e" outline={0} unlit scale={[0.68, h * 0.72, 0.68]} position={[0, 0, 0.06]} />
            <Toon geometry={g} color="#fff1a8" outline={0} unlit scale={[0.36, h * 0.42, 0.36]} position={[0, 0, 0.12]} />
          </group>
        );
      })}
    </group>
  );
};

export const Smoke: React.FC<{ position: V3; t: number; s?: number; seed?: number; color?: string }> = ({
  position,
  t,
  s = 1,
  seed = 0,
  color = "#55525e",
}) => (
  <group position={position} scale={s}>
    {Array.from({ length: 7 }).map((_, i) => {
      const life = ((t * 0.45 + i / 7 + rand(seed + i) * 0.1) % 1 + 1) % 1;
      const r = 0.35 + life * 0.9;
      return (
        <Ball
          key={i}
          r={r}
          seg={14}
          position={[(rand(seed + i * 3) - 0.5) * 0.8 + life * 0.6, life * 5, (rand(seed + i * 5) - 0.5) * 0.6]}
          color={color}
          opacity={Math.max(0.05, 0.85 * (1 - life))}
          outline={0}
        />
      );
    })}
  </group>
);

/* ------------------------------------------------------------ particles */

/** Chunks of material falling from above and landing on a surface. */
export const Debris: React.FC<{
  t: number;
  t0: number;
  t1: number;
  area: [number, number, number, number];
  landY: number;
  count?: number;
  colors: string[];
  seed?: number;
  fromY?: number;
}> = ({ t, t0, t1, area, landY, count = 40, colors, seed = 1, fromY = 9 }) => {
  const g = useMemo(() => new THREE.DodecahedronGeometry(0.16, 0), []);
  const mats = colors.map(() => [] as THREE.Matrix4[]);
  for (let i = 0; i < count; i++) {
    const start = t0 + (t1 - t0) * (i / count);
    const age = t - start;
    if (age < 0) continue;
    const fallT = Math.sqrt((2 * (fromY - landY)) / 25);
    const x = area[0] + rand(seed + i) * (area[1] - area[0]);
    const z = area[2] + rand(seed + i * 2.3) * (area[3] - area[2]);
    let y = fromY - 12.5 * age * age;
    let sc = 0.8 + rand(seed + i * 4.1) * 0.9;
    if (age > fallT) {
      y = landY;
      sc *= Math.max(0, 1 - (age - fallT) * 2.2);
      if (sc <= 0) continue;
    }
    mats[i % colors.length].push(mat4([x, y, z], [rand(i) * 3 + age * 5, rand(i + 1) * 3, age * 4], [sc, sc, sc]));
  }
  return (
    <group>
      {colors.map((c, k) => (
        <ToonInstances key={k} geometry={g} color={c} matrices={mats[k]} outline={0.025} outlineMode="scale" />
      ))}
    </group>
  );
};

/** Ring of dust puffs bursting out from an impact. */
export const DustPuff: React.FC<{ t: number; at: number; position: V3; r?: number; color?: string; count?: number }> = ({
  t,
  at,
  position,
  r = 1,
  color = "#d8c3a0",
  count = 9,
}) => {
  const age = t - at;
  if (age < 0 || age > 0.7) return null;
  const k = age / 0.7;
  return (
    <group position={position}>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        const d = r * (0.3 + k * 1.1);
        const s = 0.25 + Math.sin(k * Math.PI) * 0.35 * r;
        return <Ball key={i} r={s} seg={12} position={[Math.cos(a) * d, 0.15 + k * 0.4, Math.sin(a) * d * 0.7]} color={color} opacity={Math.max(0, 1 - k)} outline={0} />;
      })}
    </group>
  );
};

/* ----------------------------------------------------------- palace */

export const Palace: React.FC<{ position?: V3 }> = ({ position }) => {
  const W = 12;
  const H = 6.2;
  const D = 5;
  const stone = { pattern: "stone" as Pattern, patScale: [0.6, 0.28] as [number, number], patColor: "#b9a684", patStrength: 0.55 };
  const ped = useExtrude(
    [
      [-2.4, 0],
      [2.4, 0],
      [0, 1.15],
    ],
    0.3,
  );
  return (
    <group position={position}>
      <Block size={[W, 0.5, D]} position={[0, 0.25, -D / 2]} color="#a99878" outline={0.04} {...stone} />
      <Block size={[W, H, D]} position={[0, H / 2 + 0.5, -D / 2]} color="#e2d3b2" outline={0.05} {...stone} />
      <Block size={[4.6, H + 0.2, 0.4]} position={[0, (H + 0.2) / 2 + 0.5, 0.2]} color="#e8dabb" outline={0.04} {...stone} />
      <Toon geometry={ped} color="#e8dabb" outline={0.04} outlineMode="scale" position={[0, H + 0.7, 0.38]} {...stone} />
      <Block size={[W + 0.3, 0.25, D + 0.3]} position={[0, H + 0.62, -D / 2]} color="#cdbb95" outline={0.03} />
      <Block size={[W - 0.6, 0.7, D - 0.6]} position={[0, H + 1.05, -D / 2]} color="#3c4250" outline={0.03} pattern="tiles" patScale={[0.3, 0.2]} patColor="#22252e" />
      {/* windows: 3 rows x 15 */}
      {Array.from({ length: 3 }).flatMap((_, r) =>
        Array.from({ length: 15 }).map((__, c) => {
          const x = -W / 2 + 0.55 + c * ((W - 1.1) / 14);
          const front = Math.abs(x) < 2.3 ? 0.42 : 0.02;
          return (
            <group key={`${r}-${c}`} position={[x, 1.5 + r * 1.85, front]}>
              <Block size={[0.46, 0.95, 0.05]} color="#f6efe0" outline={0.012} />
              <Block size={[0.34, 0.82, 0.06]} color="#344a68" outline={0} rim={0.2} />
            </group>
          );
        }),
      )}
      {/* entrance arches */}
      {[-1.2, -0.4, 0.4, 1.2].map((x) => (
        <Block key={x} size={[0.55, 1.0, 0.06]} position={[x, 1.0, 0.42]} color="#2a2420" outline={0.015} />
      ))}
      {/* cupola */}
      <group position={[0, H + 1.4, -D / 2]}>
        <Block size={[2.0, 0.7, 2.0]} position={[0, 0.35, 0]} color="#e2d3b2" outline={0.03} {...stone} />
        <Cyl rt={0.85} rb={0.9} h={1.6} seg={8} position={[0, 1.5, 0]} color="#e8dabb" outline={0.03} {...stone} />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
          return <Block key={i} size={[0.22, 0.85, 0.05]} position={[Math.sin(a) * 0.86, 1.55, Math.cos(a) * 0.86]} rotation={[0, a, 0]} color="#2e3a4f" outline={0} />;
        })}
        <Ball r={0.95} seg={20} position={[0, 2.3, 0]} scale={[1, 0.9, 1]} color="#5e9a86" outline={0.03} />
        <Cyl rt={0.2} rb={0.25} h={0.7} seg={8} position={[0, 3.35, 0]} color="#5e9a86" outline={0.02} />
        <Ball r={0.2} seg={12} position={[0, 3.8, 0]} color="#e0b43c" outline={0.02} />
        <Block size={[0.5, 0.35, 0.05]} position={[0, 4.15, 0]} color="#e0b43c" outline={0.012} />
      </group>
    </group>
  );
};

/* ------------------------------------------------------ the diorama */

export const LAYERS = {
  peatTop: 0,
  clayTop: -4.2,
  sandTop: -7.2,
  bottom: -10.8,
};

const range = (x0: number, x1: number) => ({ cx: (x0 + x1) / 2, w: x1 - x0 });

/**
 * The cut-away plot of ground everything is built on. The front face sits at
 * z = 0, so anything centred on z = 0 (piles, pipes) shows up sliced in half.
 */
export const Diorama: React.FC<{
  t: number;
  fill?: number;
  waterY?: number;
  surface?: "swamp" | "sand" | "street";
  canal?: boolean;
  wobble?: number;
  showSand?: boolean;
  canalY?: number;
}> = ({ t, fill = 0, waterY = -99, surface = "sand", canal = false, wobble = 0, canalY = -0.6 }) => {
  const fillH = 0.9 * fill;
  const depth = 70;
  const zc = -depth / 2;
  const segments = canal ? [range(-40, -12.4), range(-7.2, 40)] : [range(-40, 40)];
  const dots = { waterY, time: t };
  const topColor = surface === "swamp" ? "#6f7d3c" : surface === "street" ? "#9a958c" : "#d8b06a";
  return (
    <group>
      {segments.map(({ cx, w }, i) => (
        <group key={i}>
          <Block size={[w, LAYERS.sandTop - LAYERS.bottom, depth]} position={[cx, (LAYERS.sandTop + LAYERS.bottom) / 2, zc]} color="#e0bb6a" outline={0.05} pattern="speckle" patScale={[0.5, 0.5]} patColor="#b08d47" {...dots} />
          <Block size={[w, LAYERS.clayTop - LAYERS.sandTop, depth]} position={[cx, (LAYERS.clayTop + LAYERS.sandTop) / 2, zc]} color="#867b70" outline={0.05} pattern="speckle" patScale={[0.6, 0.6]} patColor="#615850" {...dots} />
          <Block size={[w, LAYERS.peatTop - LAYERS.clayTop, depth]} position={[cx, (LAYERS.peatTop + LAYERS.clayTop) / 2, zc]} color="#4c3426" outline={0.05} pattern="speckle" patScale={[0.45, 0.45]} patColor="#7a5634" {...dots} />
          {fillH > 0.01 ? (
            <>
              <Block size={[w, fillH * 0.5, depth]} position={[cx, fillH * 0.25, zc]} color="#6f4c33" outline={0.04} pattern="speckle" patScale={[0.4, 0.4]} patColor="#4a3020" {...dots} />
              <Block size={[w, fillH * 0.5, depth]} position={[cx, fillH * 0.75, zc]} color={topColor} outline={0.04} pattern={surface === "street" ? "cobbles" : "speckle"} patScale={surface === "street" ? [0.35, 0.35] : [0.4, 0.4]} patColor={surface === "street" ? "#6d6a64" : "#b38d4f"} {...dots} />
            </>
          ) : (
            <Block size={[w, 0.04, depth]} position={[cx, 0.02, zc]} color={topColor} outline={0} pattern="speckle" patScale={[0.5, 0.5]} patColor="#56622c" />
          )}
        </group>
      ))}
      {canal ? (
        <group>
          {/* canal bed + water + brick quay walls */}
          <Block size={[5.2, LAYERS.sandTop - LAYERS.bottom, depth]} position={[-9.8, (LAYERS.sandTop + LAYERS.bottom) / 2, zc]} color="#e0bb6a" outline={0.05} pattern="speckle" patScale={[0.5, 0.5]} patColor="#b08d47" {...dots} />
          <Block size={[5.2, LAYERS.clayTop - LAYERS.sandTop + 1.2, depth]} position={[-9.8, (LAYERS.clayTop + 1.2 + LAYERS.sandTop) / 2, zc]} color="#5a4a3e" outline={0.05} pattern="speckle" patScale={[0.5, 0.5]} patColor="#3a2e26" {...dots} />
          <Block size={[5.2, canalY + 3.0, depth]} position={[-9.8, (canalY - 3.0) / 2, zc]} color="#3f7fb6" opacity={0.82} outline={0.03} />
          <WaterSurface size={[5.2, depth]} position={[-9.8, canalY, zc]} time={t} />
          {[-12.55, -7.05].map((x) => (
            <Block key={x} size={[0.35, 3.6, depth]} position={[x, -1.5, zc]} color="#8a4030" outline={0.04} pattern="brick" patScale={[0.22, 0.09]} patColor="#d9c8b0" />
          ))}
        </group>
      ) : null}
      {wobble > 0 ? <SoupRipples t={t} amount={wobble} y={fillH + 0.02} /> : null}
    </group>
  );
};

/** Concentric ripples on the soft ground, for "soft as soup". */
const SoupRipples: React.FC<{ t: number; amount: number; y: number }> = ({ t, amount, y }) => {
  const g = useMemo(() => new THREE.TorusGeometry(1, 0.009, 6, 72), []);
  return (
  <group>
    {[0, 1, 2, 3].map((i) => {
      const k = ((t * 0.6 + i / 4) % 1 + 1) % 1;
      const sc = 2.5 + k * 9;
      return (
        <mesh key={i} geometry={g} position={[0, y, -3.5]} rotation={[Math.PI / 2, 0, 0]} scale={[sc, sc, sc]}>
          <meshBasicMaterial color="#3a2618" transparent opacity={(1 - k) * 0.6 * amount} />
        </mesh>
      );
    })}
  </group>
  );
};

/* ------------------------------------------------- distant skyline */

const PALETTE = ["#8f3e2c", "#6e2f25", "#a85a3a", "#3b3b44", "#7a4a35", "#b9b2a6", "#55302a", "#2f3a33"];

export const LowHouse: React.FC<{ position: V3; w: number; floors: number; color: string; gable: Gable; wood?: boolean }> = ({
  position,
  w,
  floors,
  color,
  gable,
  wood,
}) => {
  const H = floors * 1.05;
  const gh = gable === "plain" ? w * 0.6 : 1.7;
  const shape = useMemo(() => gableShape(gable, w, gh), [gable, w, gh]);
  const g = useExtrude([], 0.3, shape);
  const cols = w >= 2.6 ? 3 : 2;
  return (
    <group position={position}>
      <Block size={[w, H, 3.5]} position={[0, H / 2, -1.75]} color={color} outline={0.05} pattern={wood ? "planks" : "none"} patScale={[1, 0.3]} patColor="#4a2e1a" />
      <Toon geometry={g} color={color} outline={0.05} outlineMode="scale" position={[0, H, 0]} />
      <RoofPrism w={w * 0.98} h={gh * 0.8} d={3.2} color="#3a3f4c" position={[0, H, -0.3]} pattern="none" />
      {Array.from({ length: floors }).flatMap((_, f) =>
        Array.from({ length: cols }).map((__, c) => (
          <Block
            key={`${f}${c}`}
            size={[0.45, 0.62, 0.04]}
            position={[(c - (cols - 1) / 2) * (w / cols), f * 1.05 + 0.6, 0.02]}
            color={wood ? "#2d2f3d" : "#f1ece0"}
            outline={0}
            unlit={!wood}
          />
        )),
      )}
    </group>
  );
};

/** A row of simple houses far behind the set. */
export const Skyline: React.FC<{ z?: number; wood?: boolean; seed?: number; from?: number; to?: number }> = ({
  z = -18,
  wood = false,
  seed = 4,
  from = -16,
  to = 16,
}) => {
  const houses: { x: number; w: number; f: number; c: string; g: Gable }[] = [];
  let x = from;
  let i = 0;
  while (x < to) {
    const w = 2.3 + rand(seed + i) * 0.8;
    houses.push({
      x: x + w / 2,
      w,
      f: wood ? 1 + Math.round(rand(seed + i * 3)) : 3 + Math.floor(rand(seed + i * 3) * 3),
      c: wood ? (i % 2 ? "#9a6a3c" : "#7f5532") : PALETTE[Math.floor(rand(seed + i * 7) * PALETTE.length)],
      g: wood ? "plain" : (["step", "bell", "neck", "plain"] as Gable[])[Math.floor(rand(seed + i * 5) * 4)],
    });
    x += w + 0.05;
    i++;
  }
  return (
    <group>
      {houses.map((h, k) => (
        <LowHouse key={k} position={[h.x, 0.9, z - rand(seed + k) * 0.6]} w={h.w} floors={h.f} color={h.c} gable={h.g} wood={wood} />
      ))}
    </group>
  );
};
