import React, { useMemo } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Ball, Block, Cyl, Toon, ToonInstances, mat4, rand, useCelMaterial, useLook, type PatternOpts } from "../three/cel";
import { Rod } from "../amsterdam/models";
import { F, Glow, IF, WAFER_TOP, type V3 } from "./world";

/* ------------------------------------------------------- rounded box */

export const RBox: React.FC<
  PatternOpts & { size: V3; r?: number; position?: V3; rotation?: V3; color: string; outline?: number; opacity?: number; unlit?: boolean; soft?: number }
> = ({ size, r = 0.12, ...p }) => {
  const g = useMemo(() => new RoundedBoxGeometry(size[0], size[1], size[2], 4, Math.min(r, Math.min(...size) / 2 - 0.001)), [size[0], size[1], size[2], r]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Toon geometry={g} outline={p.outline ?? 0.035} {...p} />;
};

/* ------------------------------------------------------- phone with a real lock screen */

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const drawLockScreen = (ctx: CanvasRenderingContext2D, W: number, H: number, glitch: number, crack: number, on: number, seed: number) => {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#1d2b64");
  g.addColorStop(0.55, "#6a4fa3");
  g.addColorStop(1, "#f8a978");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // Dutch skyline silhouette: canal houses + a windmill
  ctx.fillStyle = "#1a1530";
  const base = H - 120;
  let x = -10;
  let i = 0;
  while (x < W) {
    const w = 62 + (i % 3) * 10;
    const h = 120 + ((i * 37) % 60);
    ctx.fillRect(x, base - h, w, h + 130);
    ctx.fillRect(x + w * 0.25, base - h - 22, w * 0.5, 24);
    ctx.fillRect(x + w * 0.38, base - h - 38, w * 0.24, 18);
    x += w + 4;
    i++;
  }
  const mx = W - 110;
  const my = base - 260;
  ctx.fillRect(mx - 14, my, 28, 140);
  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(0.35);
  for (let k = 0; k < 4; k++) {
    ctx.rotate(Math.PI / 2);
    ctx.fillRect(-7, 0, 14, 105);
  }
  ctx.restore();
  // status bar
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 26px Montserrat";
  ctx.fillText("9:41", 34, 46);
  roundRect(ctx, W - 86, 26, 52, 24, 7);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillRect(W - 82, 30, 38, 16);
  // big clock
  ctx.textAlign = "center";
  ctx.font = "900 150px Montserrat";
  ctx.fillText("9:41", W / 2, 230);
  ctx.font = "700 30px Montserrat";
  ctx.fillText("Monday, 10 November", W / 2, 278);
  ctx.textAlign = "left";
  // notifications = your life
  const notes: [string, string, string, (cx: number, cy: number) => void][] = [
    ["Maps", "Turn right in 200 m", "#22c55e", (cx, cy) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy - 18);
      ctx.lineTo(cx + 16, cy + 16);
      ctx.lineTo(cx, cy + 8);
      ctx.lineTo(cx - 16, cy + 16);
      ctx.closePath();
      ctx.fill();
    }],
    ["Mom", "Dinner at 6?", "#3b82f6", (cx, cy) => {
      roundRect(ctx, cx - 20, cy - 15, 40, 28, 10);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy + 10);
      ctx.lineTo(cx - 16, cy + 20);
      ctx.lineTo(cx, cy + 12);
      ctx.fill();
    }],
    ["Music", "Now playing: Summer Hits", "#ef4444", (cx, cy) => {
      ctx.beginPath();
      ctx.arc(cx - 6, cy + 10, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx, cy - 18, 5, 28);
      ctx.fillRect(cx, cy - 18, 16, 5);
    }],
    ["Bank", "€4,50 paid · Coffee", "#f59e0b", (cx, cy) => {
      ctx.font = "900 34px Montserrat";
      ctx.textAlign = "center";
      ctx.fillText("€", cx, cy + 12);
      ctx.textAlign = "left";
    }],
  ];
  notes.forEach(([app, msg, col, icon], k) => {
    const y = 340 + k * 128;
    roundRect(ctx, 26, y, W - 52, 112, 26);
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.fill();
    roundRect(ctx, 44, y + 20, 72, 72, 18);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    icon(80, y + 56);
    ctx.fillStyle = "#11131f";
    ctx.font = "800 28px Montserrat";
    ctx.fillText(app, 134, y + 48);
    ctx.fillStyle = "#3b4252";
    ctx.font = "600 26px Montserrat";
    ctx.fillText(msg, 134, y + 86);
  });
  // glitch: torn slices + colour bars
  if (glitch > 0) {
    for (let k = 0; k < 14; k++) {
      const yy = ((seed * 97 + k * 131) % H) | 0;
      const hh = 8 + ((seed * 13 + k * 29) % 60);
      const dx = (((seed * 7 + k * 53) % 120) - 60) * glitch;
      ctx.drawImage(ctx.canvas, 0, yy, W, hh, dx, yy, W, hh);
      ctx.fillStyle = k % 3 === 0 ? `rgba(255,0,90,${0.45 * glitch})` : k % 3 === 1 ? `rgba(0,220,255,${0.45 * glitch})` : `rgba(0,0,0,${0.5 * glitch})`;
      ctx.fillRect(0, yy, W, hh * 0.4);
    }
  }
  // crack lines from the impact point
  if (crack > 0) {
    const cx = W * 0.62;
    const cy = H * 0.46;
    ctx.strokeStyle = `rgba(255,255,255,${Math.min(1, crack * 1.5)})`;
    ctx.lineWidth = 4;
    for (let k = 0; k < 11; k++) {
      let a = (k / 11) * Math.PI * 2 + 0.3;
      let px = cx;
      let py = cy;
      ctx.beginPath();
      ctx.moveTo(px, py);
      const len = (260 + ((k * 71) % 300)) * Math.min(1, crack * 1.4);
      for (let s = 0; s < 6; s++) {
        a += (((k * 17 + s * 31) % 10) - 5) * 0.06;
        px += Math.cos(a) * (len / 6);
        py += Math.sin(a) * (len / 6);
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, 34 * Math.min(1, crack * 2), 0, Math.PI * 2);
    ctx.stroke();
  }
  if (on < 1) {
    ctx.fillStyle = `rgba(5,6,12,${1 - on})`;
    ctx.fillRect(0, 0, W, H);
  }
};

export const PhoneV2: React.FC<{
  position: V3;
  explode?: number;
  hideParts?: number;
  chipGlow?: number;
  glitch?: number;
  crack?: number;
  on?: number;
  seed?: number;
  rotation?: V3;
  scale?: number;
}> = ({ position, explode = 0, hideParts = 0, chipGlow = 0, glitch = 0, crack = 0, on = 1, seed = 0, rotation, scale = 1 }) => {
  const W = 540;
  const H = 1080;
  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    return c;
  }, []);
  const tex = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [canvas]);
  const ctx = canvas.getContext("2d")!;
  drawLockScreen(ctx, W, H, glitch, crack, on, seed);
  tex.needsUpdate = true;
  const screenMat = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), [tex]);
  const screenGeo = useMemo(() => new THREE.PlaneGeometry(1.36, 2.72), []);
  const e = explode;
  const ps = 1 - hideParts;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {ps > 0.01 ? (
        <>
          <group position={[0, -2.0 * e, -0.5 * e]} rotation={[0.5 * e, 0, 0]} scale={ps}>
            <RBox size={[1.5, 3.0, 0.1]} r={0.14} position={[0, 0, -0.04]} color="#2b3140" outline={0.03} rim={0.3} />
            <RBox size={[0.55, 0.55, 0.08]} r={0.1} position={[-0.38, 1.05, -0.11]} color="#1b1f2a" outline={0.02} />
          </group>
          <group position={[-1.7 * e, -0.2 * e, -0.3 * e]} rotation={[0, 0, 0.5 * e]} scale={ps}>
            <RBox size={[1.0, 1.5, 0.1]} r={0.06} position={[0, -0.45, 0]} color="#4b5568" outline={0.025} />
            <Block size={[0.6, 0.12, 0.11]} position={[0, -0.1, 0]} color="#ffd23f" outline={0} />
          </group>
          <group position={[1.7 * e, 0.6 * e, -0.2 * e]} rotation={[0, 0, -0.6 * e]} scale={ps}>
            <Cyl rt={0.14} rb={0.14} h={0.1} seg={18} rotation={[Math.PI / 2, 0, 0]} position={[-0.38, 1.05, 0]} color="#0f1320" outline={0.02} />
          </group>
          <group position={[0.2 * e, 2.1 * e, 0.1 - 0.2 * e]} rotation={[-0.4 * e, 0, 0.15 * e]} scale={ps}>
            <RBox size={[1.5, 3.0, 0.1]} r={0.14} position={[0, 0, 0.0]} color="#11131f" outline={0.03} />
            <mesh geometry={screenGeo} material={screenMat} position={[0, 0, 0.052]} />
          </group>
        </>
      ) : null}
      <group position={[0, 0.1, 0.0]}>
        <RBox size={[0.44, 0.44, 0.06]} r={0.03} color="#2a2f3a" outline={0.02} rim={0.4} />
        <Block size={[0.3, 0.3, 0.07]} color={chipGlow > 0 ? "#b76bff" : "#8a93a6"} unlit={chipGlow > 0} outline={0} pattern="cobbles" patScale={[0.05, 0.05]} patColor="#3b4252" />
        {[-1, 1].flatMap((s) => [-0.14, -0.05, 0.05, 0.14].map((o) => <Block key={`${s}${o}`} size={[0.06, 0.03, 0.03]} position={[s * 0.25, o, 0]} color="#e0b43c" outline={0} />))}
        {chipGlow > 0 ? <Glow position={[0, 0, -0.08]} r={0.32} color="#b76bff" intensity={chipGlow * 0.22} /> : null}
      </group>
    </group>
  );
};

/* ------------------------------------------------------- flag made of tiles */

/** Big waving Dutch flag that can be deleted (and rebuilt) tile by tile. */
export const FlagTiles: React.FC<{ position: V3; t: number; gone: [number, number]; back?: [number, number]; size?: number }> = ({
  position,
  t,
  gone,
  back,
  size = 0.42,
}) => {
  const cols = 16;
  const rows = 9;
  const g = useMemo(() => new THREE.BoxGeometry(size * 0.98, size * 0.98, 0.06), [size]);
  const colors = ["#ae1c28", "#f4f6fa", "#21468b"];
  const mats: THREE.Matrix4[][] = [[], [], []];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const dOut = gone[0] + rand(i * 1.37) * (gone[1] - gone[0]);
      let s = 1 - Math.min(1, Math.max(0, (t - dOut) / 0.12));
      if (back) {
        const dIn = back[0] + rand(i * 2.11) * (back[1] - back[0]);
        if (t >= dIn) s = Math.min(1, (t - dIn) / 0.12);
      }
      if (s <= 0.001) continue;
      const x = (c - (cols - 1) / 2) * size;
      const y = ((rows - 1) / 2 - r) * size;
      const z = Math.sin(t * 2.6 + c * 0.45 + r * 0.1) * 0.12;
      const rot = Math.cos(t * 2.6 + c * 0.45) * 0.12;
      mats[Math.floor(r / 3)].push(mat4([x, y, z], [0, rot, 0], [s, s, s]));
    }
  return (
    <group position={position}>
      {colors.map((c, k) => (
        <ToonInstances key={c} geometry={g} color={c} matrices={mats[k]} outline={0.012} outlineMode="scale" />
      ))}
    </group>
  );
};

/* ------------------------------------------------------- the chip, magnified */

type Part = { geo: THREE.BufferGeometry; color: string; at: V3[]; layer: number; h: number };

/**
 * A magnified patch of a modern chip: silicon fins, gates across them, copper
 * contacts and two layers of copper wiring. `build` (0..5) grows it layer by layer.
 */
export const ChipStack: React.FC<{ build: number; glowLayer?: number }> = ({ build }) => {
  const parts = useMemo<Part[]>(() => {
    const top = WAFER_TOP;
    const fins: V3[] = Array.from({ length: 8 }).map((_, i) => [0, top + 0.0035, -0.0665 + i * 0.019]);
    const gates: V3[] = Array.from({ length: 9 }).map((_, j) => [-0.064 + j * 0.016, top + 0.0055, 0]);
    const contacts: V3[] = [];
    fins.forEach((f, i) => gates.forEach((g, j) => (i + j) % 2 === 0 && contacts.push([g[0], top + 0.0135, f[2]])));
    const m1: V3[] = fins.map((f) => [0, top + 0.0195, f[2]]);
    const m2: V3[] = gates.filter((_, j) => j % 2 === 0).map((g) => [g[0], top + 0.0245, 0]);
    return [
      { geo: new THREE.BoxGeometry(0.15, 0.007, 0.0045), color: "#7cc6ff", at: fins, layer: 1, h: 0.007 },
      { geo: new THREE.BoxGeometry(0.0055, 0.011, 0.155), color: "#e0b43c", at: gates, layer: 2, h: 0.011 },
      { geo: new THREE.BoxGeometry(0.004, 0.006, 0.004), color: "#c9773b", at: contacts, layer: 3, h: 0.006 },
      { geo: new THREE.BoxGeometry(0.152, 0.003, 0.0035), color: "#d98b4a", at: m1, layer: 4, h: 0.003 },
      { geo: new THREE.BoxGeometry(0.0045, 0.003, 0.157), color: "#f2b56b", at: m2, layer: 5, h: 0.003 },
    ];
  }, []);
  if (build <= 0) return null;
  return (
    <group>
      <Block size={[0.172, 0.0016, 0.172]} position={[0, WAFER_TOP + 0.0008, 0]} color="#8a93a6" outline={0.0006} />
      {parts.map((p) => {
        const k = Math.min(1, Math.max(0, build - (p.layer - 1)));
        if (k <= 0) return null;
        const ms = p.at.map((a) => mat4([a[0], a[1] - (p.h * (1 - k)) / 2 + (1 - k) * 0.01, a[2]], [0, 0, 0], [1, Math.max(0.02, k), 1]));
        return <ToonInstances key={p.layer} geometry={p.geo} color={p.color} matrices={ms} outline={0.0006} outlineMode="scale" />;
      })}
    </group>
  );
};

/* ------------------------------------------------------- light source */

const additive = (color: string, opacity: number) =>
  new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });

/** Concave collector mirror with a hole in the middle for the laser. */
export const CollectorV2: React.FC<{ show: number; glow: number }> = ({ show, glow }) => {
  const g = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 14; i++) {
      const r = 0.2 + (i / 14) * 1.15;
      pts.push(new THREE.Vector2(r, 0.32 * (r / 1.35) ** 2));
    }
    return new THREE.LatheGeometry(pts, 48);
  }, []);
  const mat = useCelMaterial(glow > 0.2 ? "#efe6ff" : "#e8edf5", { side: THREE.DoubleSide, rim: 0.9, soft: 0.6 });
  const ring = useMemo(() => new THREE.TorusGeometry(1.36, 0.06, 10, 64), []);
  if (show <= 0) return null;
  return (
    <group position={[F[0] - 1.25, F[1], F[2]]} rotation={[0, 0, -Math.PI / 2]} scale={show}>
      <mesh geometry={g} material={mat} />
      <Toon geometry={ring} color="#8a93a6" outline={0.015} position={[0, 0.32, 0]} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  );
};

/** Converging cone of EUV light from the collector to its focus. */
export const EuvCone: React.FC<{ k: number }> = ({ k }) => {
  const len = IF[0] - (F[0] - 1.0);
  const g = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.04, 1.2, len, 40, 1, true);
    geo.rotateZ(Math.PI / 2);
    return geo;
  }, [len]);
  const mats = useMemo(() => [additive("#b76bff", 0.2), additive("#e7c6ff", 0.12)], []);
  mats[0].opacity = 0.22 * k;
  mats[1].opacity = 0.12 * k;
  if (k <= 0.01) return null;
  return (
    <group position={[F[0] - 1.0 + len / 2, F[1], 0]}>
      <mesh geometry={g} material={mats[0]} />
      <mesh geometry={g} material={mats[1]} scale={[1, 0.6, 0.6]} />
    </group>
  );
};

export const Shockwave: React.FC<{ age: number }> = ({ age }) => {
  const g = useMemo(() => new THREE.TorusGeometry(1, 0.04, 8, 64), []);
  const m = useMemo(() => additive("#e7c6ff", 0.8), []);
  if (age < 0 || age > 0.6) return null;
  const s = 0.2 + age * 4;
  m.opacity = 0.8 * (1 - age / 0.6);
  return <mesh geometry={g} material={m} position={F} rotation={[0, Math.PI / 2 - 0.5, 0]} scale={[s, s, s]} />;
};

/** CO2 laser unit, fires through the collector's hole from the left. */
export const LaserUnit: React.FC<{ drop: number; firing: number }> = ({ drop, firing }) => (
  <group position={[-10.6, drop * 7, 0]}>
    <RBox size={[2.6, 3.4, 2.4]} r={0.2} position={[0, 1.7, 0]} color="#eef2f7" outline={0.035} />
    <RBox size={[2.64, 0.3, 2.44]} r={0.1} position={[0, 2.2, 0]} color="#e63946" outline={0.012} />
    <Cyl rt={0.22} rb={0.22} h={0.4} seg={20} rotation={[0, 0, Math.PI / 2]} position={[1.45, 2.6, 0]} color="#1b1f2a" outline={0.015} />
    <Cyl rt={0.12} rb={0.12} h={0.42} seg={20} rotation={[0, 0, Math.PI / 2]} position={[1.47, 2.6, 0]} color={firing > 0 ? "#ff6a4d" : "#3b2020"} unlit outline={0} />
    {firing > 0 ? <Glow position={[1.7, 2.6, 0]} r={0.35} color="#ff3b3b" intensity={firing} /> : null}
    <Block size={[0.8, 0.5, 0.04]} position={[-0.6, 1.0, 1.21]} color="#ffd23f" outline={0.01} />
  </group>
);

export const NOZZLE: V3 = [F[0], F[1] + 1.55, -1.3];
const DROP_DIR = new THREE.Vector3(F[0] - NOZZLE[0], F[1] - NOZZLE[1], F[2] - NOZZLE[2]);
const DROP_LEN = DROP_DIR.length();
DROP_DIR.normalize();

export const NozzleV2: React.FC<{ drop: number }> = ({ drop }) => {
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), DROP_DIR);
  const e = new THREE.Euler().setFromQuaternion(q);
  return (
    <group position={[NOZZLE[0], NOZZLE[1] + drop * 7, NOZZLE[2]]} rotation={[e.x, e.y, e.z]}>
      <RBox size={[0.8, 0.9, 0.8]} r={0.12} position={[0, 0.55, 0]} color="#eef2f7" outline={0.03} />
      <RBox size={[0.84, 0.16, 0.84]} r={0.06} position={[0, 0.75, 0]} color="#2f6fd6" outline={0.01} />
      <Cyl rt={0.07} rb={0.16} h={0.3} seg={16} position={[0, -0.03, 0]} rotation={[Math.PI, 0, 0]} color="#9aa4b5" outline={0.015} />
    </group>
  );
};

/** Position along the droplet line: s=0 at the nozzle tip, s=1 at the plasma focus. */
export const dropAt = (s: number): V3 => [NOZZLE[0] + DROP_DIR.x * DROP_LEN * s, NOZZLE[1] + DROP_DIR.y * DROP_LEN * s, NOZZLE[2] + DROP_DIR.z * DROP_LEN * s];

export const TinDrop: React.FC<{ pos: V3; flat?: number }> = ({ pos, flat = 0 }) => (
  <group position={pos}>
    <Ball r={0.11} seg={18} scale={[1 - flat * 0.8, 1 + flat * 1.8, 1 + flat * 1.8]} color="#f4f7fb" outline={0.018} rim={0.9} unlit />
    <Ball r={0.035} seg={10} position={[0.03, 0.04, 0.06]} color="#ffffff" outline={0} unlit />
  </group>
);

/* ------------------------------------------------------- the finished machine */

export const HousingV2: React.FC<{ build: number; t: number }> = ({ build, t }) => {
  if (build <= 0) return null;
  const fly = (1 - build) * 10;
  const white = "#f4f7fb";
  return (
    <group>
      {/* plinth */}
      <RBox size={[12.2, 0.5, 5.0]} r={0.15} position={[-1.7, 0.25, 0]} color="#d9e1ea" outline={0.03} />
      {/* source vessel (left) with a porthole */}
      <group position={[-6.6 - fly, 0, 0]}>
        <RBox size={[2.6, 6.2, 4.6]} r={0.45} position={[0, 3.6, 0]} color={white} outline={0.04} />
        <RBox size={[2.62, 0.35, 4.62]} r={0.12} position={[0, 2.3, 0]} color="#2f6fd6" outline={0.012} />
        <Cyl rt={0.75} rb={0.75} h={0.12} seg={40} rotation={[Math.PI / 2, 0, 0]} position={[0.2, 4.3, 2.31]} color="#1b1630" outline={0.02} />
        <Cyl rt={0.85} rb={0.85} h={0.08} seg={40} rotation={[Math.PI / 2, 0, 0]} position={[0.2, 4.3, 2.29]} color="#c3ccd8" outline={0.015} />
        <Glow position={[0.2, 4.3, 2.4]} r={0.55} color="#b76bff" intensity={0.55 + 0.1 * Math.sin(t * 20)} />
      </group>
      {/* main body: back, roof, right module, glass front */}
      <RBox size={[8.2, 7.0, 0.5]} r={0.2} position={[-1.1, 4.0, -2.2 - fly]} color={white} outline={0.04} />
      <RBox size={[8.6, 0.7, 4.8]} r={0.3} position={[-1.1, 7.85 + fly, 0]} color={white} outline={0.04} />
      <group position={[3.9 + fly, 0, 0]}>
        <RBox size={[2.4, 7.0, 4.6]} r={0.35} position={[0, 4.0, 0]} color={white} outline={0.04} />
        <RBox size={[2.42, 0.35, 4.62]} r={0.12} position={[0, 2.3, 0]} color="#2f6fd6" outline={0.012} />
        {/* wafer load port with a pod */}
        <RBox size={[1.6, 0.18, 1.0]} r={0.06} position={[0, 2.9, 2.75]} color="#c3ccd8" outline={0.015} />
        <RBox size={[1.2, 1.0, 0.9]} r={0.15} position={[0, 3.5, 2.75]} color="#ffd23f" outline={0.02} />
        <RBox size={[1.0, 1.6, 0.06]} r={0.04} position={[0, 5.2, 2.31]} color="#1b2233" outline={0.012} />
        {/* stack light */}
        <Cyl rt={0.1} rb={0.1} h={0.3} seg={12} position={[0.7, 7.65, 1.6]} color="#9aa4b5" outline={0.012} />
        {["#4ade80", "#ffd23f", "#e63946"].map((c, i) => (
          <Cyl key={c} rt={0.13} rb={0.13} h={0.2} seg={14} position={[0.7, 7.9 + i * 0.22, 1.6]} color={c} unlit={i === 0} outline={0.012} />
        ))}
      </group>
      <group position={[0, 0, fly]}>
        <RBox size={[7.6, 6.6, 0.12]} r={0.25} position={[-1.1, 4.25, 2.25]} color="#9fb6d8" opacity={0.18} outline={0.03} />
        <RBox size={[7.8, 0.35, 0.3]} r={0.12} position={[-1.1, 1.0, 2.3]} color="#2f6fd6" outline={0.012} />
        <RBox size={[7.8, 0.3, 0.3]} r={0.12} position={[-1.1, 7.55, 2.3]} color={white} outline={0.02} />
      </group>
      {/* cable trays + vents on the roof */}
      <RBox size={[7.0, 0.3, 0.6]} r={0.08} position={[-1.6, 8.35 + fly, -1.4]} color="#c3ccd8" outline={0.02} />
      {[-4.0, -2.4, -0.8].map((x) => (
        <RBox key={x} size={[1.0, 0.35, 1.0]} r={0.1} position={[x, 8.4 + fly, 0.8]} color="#e2e8f0" outline={0.02} />
      ))}
      {/* beam pipe from the laser unit */}
      <Rod from={[-9.1, 2.6, 0]} to={[-7.9 - fly, 2.6, 0]} r={0.18} color="#c3ccd8" outline={0.02} />
    </group>
  );
};

export { useLook };
