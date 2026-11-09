import React, { useMemo } from "react";
import * as THREE from "three";
import { Ball, Block, Cone, Cyl, Toon, ToonInstances, mat4, rand, useLook } from "../three/cel";
import { Crack, Rod } from "../amsterdam/models";

export type V3 = [number, number, number];

/* -------------------------------------------------------- layout */
export const WAFER_C: V3 = [0, 0.82, 0];
export const WAFER_TOP = 0.836;
export const F: V3 = [-5.2, 2.6, 0]; // plasma focus
export const IF: V3 = [-3.9, 2.6, 0]; // where the collector focuses the light
export const M1: V3 = [-2.7, 2.6, 0];
export const MASK: V3 = [-1.0, 7.0, 0];
export const M2: V3 = [2.4, 5.0, 0];
export const M3: V3 = [-0.6, 3.4, 0];
/** Where the glass lens sits on the first beam. */
export const LENS: V3 = [-3.35, 2.6, 0];
export const W: V3 = [0, WAFER_TOP + 0.01, 0];
export const PATH: V3[] = [F, M1, MASK, M2, M3, W];

const v = (a: V3) => new THREE.Vector3(...a);

/* ------------------------------------------------------- glow bits */

const useUnitCyl = () =>
  useMemo(() => {
    const g = new THREE.CylinderGeometry(1, 1, 1, 16, 1, true);
    g.translate(0, 0.5, 0);
    return g;
  }, []);

const additive = (color: string, opacity: number) =>
  new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });

/** Glowing light beam between two points; `progress` draws it out, `falloff` fades it (air absorption). */
export const Beam: React.FC<{ from: V3; to: V3; progress?: number; color?: string; width?: number; falloff?: number; opacity?: number }> = ({
  from,
  to,
  progress = 1,
  color = "#b76bff",
  width = 0.08,
  falloff = 0,
  opacity = 1,
}) => {
  const g = useUnitCyl();
  const a = v(from);
  const b = v(to);
  const dir = b.clone().sub(a);
  const len = dir.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  const e = new THREE.Euler().setFromQuaternion(q);
  const segs = falloff > 0 ? 8 : 1;
  const mats = useMemo(
    () => ({
      core: Array.from({ length: segs }).map(() => new THREE.MeshBasicMaterial({ color: "#f3e6ff", transparent: true, opacity: 0.95, toneMapped: false })),
      mid: Array.from({ length: segs }).map(() => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75, depthWrite: false, toneMapped: false })),
      halo: Array.from({ length: segs }).map(() => additive(color, 0.18)),
    }),
    [color, segs],
  );
  if (progress <= 0.001 || opacity <= 0.001) return null;
  const shown = len * Math.min(1, progress);
  return (
    <group position={from} rotation={[e.x, e.y, e.z]}>
      {Array.from({ length: segs }).map((_, i) => {
        const s0 = (i / segs) * shown;
        const sl = shown / segs;
        const k = falloff > 0 ? Math.max(0, 1 - ((i + 0.5) / segs) * falloff * 1.6) ** 1.6 : 1;
        mats.core[i].opacity = 0.95 * k * opacity;
        mats.mid[i].opacity = 0.7 * k * opacity;
        mats.halo[i].opacity = 0.22 * k * opacity;
        return (
          <group key={i} position={[0, s0, 0]}>
            <mesh geometry={g} material={mats.core[i]} scale={[width * 0.28, sl, width * 0.28]} />
            <mesh geometry={g} material={mats.mid[i]} scale={[width * 0.55, sl, width * 0.55]} />
            <mesh geometry={g} material={mats.halo[i]} scale={[width * 1.9, sl, width * 1.9]} />
          </group>
        );
      })}
    </group>
  );
};

/** Soft additive glow ball. */
export const Glow: React.FC<{ position: V3; r: number; color: string; intensity?: number }> = ({ position, r, color, intensity = 1 }) => {
  const g = useMemo(() => new THREE.SphereGeometry(1, 20, 16), []);
  const mats = useMemo(() => [additive("#ffffff", 0.9), additive(color, 0.5), additive(color, 0.18), additive(color, 0.07)], [color]);
  mats[0].opacity = 0.9 * intensity;
  mats[1].opacity = 0.5 * intensity;
  mats[2].opacity = 0.18 * intensity;
  mats[3].opacity = 0.07 * intensity;
  if (intensity <= 0.001) return null;
  return (
    <group position={position}>
      <mesh geometry={g} material={mats[0]} scale={r * 0.35} />
      <mesh geometry={g} material={mats[1]} scale={r * 0.6} />
      <mesh geometry={g} material={mats[2]} scale={r} />
      <mesh geometry={g} material={mats[3]} scale={r * 1.7} />
    </group>
  );
};

/* ------------------------------------------------------------ room */

export const Room: React.FC<{ dark?: boolean }> = ({ dark = false }) => (
  <group>
    <Block size={[80, 0.2, 60]} position={[0, -0.1, -10]} color="#e6ecf3" outline={0} pattern="cobbles" patScale={[1.4, 1.4]} patColor="#c3ccd8" patStrength={0.45} />
    <Block size={[80, 14, 0.4]} position={[0, 7, -13]} color="#d5dfeb" outline={0.04} pattern="planks" patScale={[2.5, 1.6]} patColor="#b7c3d2" patStrength={0.5} />
    <Block size={[0.4, 14, 60]} position={[-17, 7, -10]} color="#d0dae6" outline={0.04} pattern="planks" patScale={[2.5, 1.6]} patColor="#b7c3d2" patStrength={0.5} />
    {/* ceiling light strips */}
    {[-9, -3, 3, 9].map((z) =>
      [-10, 0, 10].map((x) => <Block key={`${x}${z}`} size={[7, 0.12, 0.7]} position={[x, 11.5, z - 2]} color={dark ? "#33406a" : "#ffffff"} unlit outline={0} />),
    )}
    {/* yellow safety lines around the work area */}
    <Block size={[14, 0.02, 0.18]} position={[-2, 0.011, 3.2]} color="#ffd23f" outline={0} unlit />
    <Block size={[14, 0.02, 0.18]} position={[-2, 0.011, -3.2]} color="#ffd23f" outline={0} unlit />
    {/* other tools along the back wall */}
    {[-13, -7, -1, 5, 11].map((x, i) => (
      <group key={x} position={[x, 0, -10.5]}>
        <Block size={[4.6, 4.2 + (i % 2) * 1.2, 2.6]} position={[0, (4.2 + (i % 2) * 1.2) / 2, 0]} color="#f3f6fa" outline={0.05} />
        <Block size={[4.62, 0.3, 2.62]} position={[0, 2.6, 0]} color="#2f6fd6" outline={0} />
        <Block size={[1.2, 0.8, 0.04]} position={[-1, 1.5, 1.32]} color="#1b2233" outline={0.015} />
        <Ball r={0.07} position={[1.6, 3.5, 1.32]} color={i % 2 ? "#4ade80" : "#ffd23f"} unlit outline={0} />
      </group>
    ))}
  </group>
);

/* ------------------------------------------------------------ phone */

export const Phone: React.FC<{ position: V3; explode?: number; chipGlow?: number; screenOn?: number; hideParts?: number; rotation?: V3; scale?: number }> = ({
  position,
  explode = 0,
  chipGlow = 0,
  screenOn = 1,
  hideParts = 0,
  rotation,
  scale = 1,
}) => {
  const e = explode;
  const ps = 1 - hideParts;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {ps > 0.01 ? (
        <>
          {/* back plate */}
          <group position={[0, -1.9 * e, -0.5 * e]} rotation={[0.5 * e, 0, 0]} scale={ps}>
            <Block size={[1.4, 2.8, 0.08]} color="#2b3140" outline={0.03} rim={0.3} />
            <Block size={[0.5, 0.5, 0.06]} position={[-0.38, 1.0, -0.06]} color="#1b1f2a" outline={0.02} />
          </group>
          {/* battery */}
          <group position={[-1.6 * e, -0.2 * e, -0.3 * e]} rotation={[0, 0, 0.5 * e]} scale={ps}>
            <Block size={[1.0, 1.4, 0.1]} position={[0, -0.4, 0]} color="#4b5568" outline={0.025} />
          </group>
          {/* camera module */}
          <group position={[1.6 * e, 0.6 * e, -0.2 * e]} rotation={[0, 0, -0.6 * e]} scale={ps}>
            <Cyl rt={0.14} rb={0.14} h={0.1} seg={18} rotation={[Math.PI / 2, 0, 0]} position={[-0.38, 1.0, 0]} color="#0f1320" outline={0.02} />
          </group>
          {/* screen */}
          <group position={[0.2 * e, 2.0 * e, -0.2 * e]} rotation={[-0.4 * e, 0, 0.15 * e]} scale={ps}>
            <Block size={[1.4, 2.8, 0.08]} position={[0, 0, 0.08]} color="#1b1f2a" outline={0.03} />
            <Block size={[1.28, 2.62, 0.02]} position={[0, 0, 0.125]} color={screenOn > 0.5 ? "#4f8cf7" : "#0b0e16"} unlit outline={0} />
            {screenOn > 0.5
              ? Array.from({ length: 12 }).map((_, i) => (
                  <Block key={i} size={[0.24, 0.24, 0.02]} position={[-0.42 + (i % 4) * 0.28, 0.9 - Math.floor(i / 4) * 0.36, 0.14]} color={["#ffd23f", "#4ade80", "#ff5a5a", "#ffffff"][i % 4]} unlit outline={0} />
                ))
              : null}
          </group>
        </>
      ) : null}
      {/* the chip */}
      <group position={[0, 0.1, 0.02]}>
        <Block size={[0.42, 0.42, 0.06]} color="#2a2f3a" outline={0.02} rim={0.4} />
        <Block size={[0.3, 0.3, 0.07]} color={chipGlow > 0 ? "#b76bff" : "#8a93a6"} unlit={chipGlow > 0} outline={0} pattern="cobbles" patScale={[0.05, 0.05]} patColor="#3b4252" />
        {[-1, 1].flatMap((s) =>
          [-0.14, -0.05, 0.05, 0.14].map((o) => (
            <Block key={`${s}${o}`} size={[0.06, 0.03, 0.03]} position={[s * 0.24, o, 0]} color="#e0b43c" outline={0} />
          )),
        )}
        {chipGlow > 0 ? <Glow position={[0, 0, -0.08]} r={0.32} color="#b76bff" intensity={chipGlow * 0.22} /> : null}
      </group>
    </group>
  );
};

/* ------------------------------------------------------------ stage + wafer */

const waferVert = /* glsl */ `
  varying vec3 vPosO; varying vec3 vNormalO; varying vec3 vPosW; varying vec3 vNormalW;
  void main() {
    vPosO = position; vNormalO = normal;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vPosW = wp.xyz; vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;
const waferFrag = /* glsl */ `
  uniform float uBlur; uniform float uPrint; uniform float uInk; uniform float uLit; uniform float uTime; uniform vec3 uTint;
  varying vec3 vPosO; varying vec3 vNormalO; varying vec3 vPosW; varying vec3 vNormalW;
  float edge(float f, float w) { float aa = fwidth(f) * 1.2 + 1e-5; return 1.0 - smoothstep(w, w + aa, f); }
  void main() {
    vec3 n = normalize(vNormalW);
    vec3 vdir = normalize(cameraPosition - vPosW);
    float lit = 0.75 + 0.25 * max(dot(n, normalize(vec3(0.4, 1.0, 0.7))), 0.0);
    if (vNormalO.y < 0.5) {
      vec3 c = vec3(0.7, 0.74, 0.8) * lit;
      gl_FragColor = vec4(c, 1.0);
      #include <colorspace_fragment>
      return;
    }
    vec2 p = vPosO.xz;
    float r = length(p);
    float ang = dot(n, vdir);
    vec3 irid = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + ang * 1.4 + p.x * 0.7 + p.y * 0.5));
    vec3 col = mix(vec3(0.6, 0.64, 0.72), irid, 0.42) * lit;
    vec2 g = fract(p / 0.16 + 0.5);
    float grid = max(edge(g.x, 0.03), edge(g.y, 0.03));
    col = mix(col, vec3(0.25, 0.28, 0.36), grid * 0.55);
    // projected light: blurry wide stripes
    float s = 0.5 + 0.5 * sin(p.x * 160.0);
    col = mix(col, vec3(1.0, 0.93, 0.7), uLit * 0.25);
    col = mix(col, vec3(1.0, 0.95, 0.75), uBlur * (0.35 + 0.45 * s));
    // crisp printed lines
    float line = edge(abs(fract(p.x * 25.0) - 0.5) * 2.0, 0.22) * step(0.06, 1.0 - grid);
    col = mix(col, vec3(0.78, 0.55, 1.0) + uTint * 0.2, uPrint * line * 0.9);
    col += uPrint * vec3(0.12, 0.05, 0.2);
    // ink blob
    if (r < uInk) col = vec3(0.07, 0.1, 0.38);
    col = mix(col, vec3(0.85, 0.88, 0.95), smoothstep(0.96, 1.0, r) * 0.6);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

export const Wafer: React.FC<{ blur?: number; print?: number; ink?: number; lit?: number; t: number }> = ({ blur = 0, print = 0, ink = 0, lit = 0, t }) => {
  const g = useMemo(() => new THREE.CylinderGeometry(1, 1, 0.03, 96), []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: waferVert,
        fragmentShader: waferFrag,
        uniforms: { uBlur: { value: 0 }, uPrint: { value: 0 }, uInk: { value: 0 }, uLit: { value: 0 }, uTime: { value: 0 }, uTint: { value: new THREE.Color("#ffffff") } },
      }),
    [],
  );
  mat.uniforms.uBlur.value = blur;
  mat.uniforms.uPrint.value = print;
  mat.uniforms.uInk.value = ink;
  mat.uniforms.uLit.value = lit;
  mat.uniforms.uTime.value = t;
  return <mesh geometry={g} material={mat} position={WAFER_C} />;
};

export const Stage: React.FC = () => (
  <group>
    <Block size={[2.8, 0.78, 2.8]} position={[0, 0.39, 0]} color="#f4f7fb" outline={0.04} />
    <Block size={[2.82, 0.14, 2.82]} position={[0, 0.55, 0]} color="#2f6fd6" outline={0.015} />
    <Cyl rt={1.08} rb={1.08} h={0.04} seg={64} position={[0, 0.79, 0]} color="#3b4252" outline={0.02} />
  </group>
);

/** A die on the wafer, magnified: a tiny "city" of switches. */
export const ChipCity: React.FC<{ show: number }> = ({ show }) => {
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const groups = useMemo(() => {
    const cols = ["#c9773b", "#e0b43c", "#4f7fd6", "#9aa4b5"];
    const out = cols.map(() => [] as THREE.Matrix4[]);
    const n = 10;
    const pitch = 0.016;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const h = 0.003 + rand(i * 31 + j) * 0.016;
        const x = (i - (n - 1) / 2) * pitch;
        const z = (j - (n - 1) / 2) * pitch;
        out[(i * 7 + j * 3) % cols.length].push(mat4([x, WAFER_TOP + h / 2, z], [0, 0, 0], [0.0105, h, 0.0105]));
      }
    return cols.map((c, k) => ({ c, m: out[k] }));
  }, []);
  if (show <= 0) return null;
  return (
    <group>
      {groups.map(({ c, m }) => (
        <ToonInstances key={c} geometry={box} color={c} matrices={m.map((mm) => mm.clone().premultiply(new THREE.Matrix4().makeScale(1, show, 1)))} outline={0.0009} outlineMode="scale" />
      ))}
      {/* glowing traces between blocks */}
      {Array.from({ length: 9 }).map((_, i) => (
        <Block key={i} size={[0.16, 0.0006, 0.0018]} position={[0, WAFER_TOP + 0.0004, -0.072 + i * 0.016 + 0.008]} color="#7cc6ff" unlit outline={0} />
      ))}
    </group>
  );
};

/* ------------------------------------------------------------ pen + projector */

export const Pen: React.FC<{ tip: V3 }> = ({ tip }) => (
  <group position={tip} rotation={[0.35, 0, -0.5]}>
    <Cone r={0.07} h={0.22} seg={18} position={[0, 0.11, 0]} color="#c3cad6" outline={0.01} rim={0.5} />
    <Cyl rt={0.075} rb={0.075} h={1.9} seg={18} position={[0, 1.17, 0]} color="#2f6fd6" outline={0.012} />
    <Cyl rt={0.08} rb={0.08} h={0.5} seg={18} position={[0, 2.2, 0]} color="#1d4fa8" outline={0.012} />
  </group>
);

export const Projector: React.FC<{ y: number; on: number; color?: string }> = ({ y, on, color = "#fff2c4" }) => {
  const cone = useMemo(() => {
    const h = y - 0.32 - WAFER_TOP;
    const g = new THREE.CylinderGeometry(0.12, 1.0, Math.max(0.01, h), 48, 1, true);
    g.translate(0, -h / 2, 0);
    return g;
  }, [y]);
  const mat = useMemo(() => additive(color, 0.22), [color]);
  mat.opacity = 0.22 * on;
  return (
    <group>
      <group position={[0, y, 0]}>
        <Block size={[0.95, 0.55, 0.85]} color="#3b4252" outline={0.03} />
        <Block size={[0.97, 0.12, 0.87]} position={[0, 0.2, 0]} color="#ffd23f" outline={0.01} />
        <Cyl rt={0.16} rb={0.2} h={0.2} seg={20} position={[0, -0.37, 0]} color="#1b1f2a" outline={0.015} />
        {on > 0 ? <mesh geometry={cone} material={mat} position={[0, -0.47, 0]} /> : null}
      </group>
      <Rod from={[0.45, y, -0.2]} to={[1.9, y + 0.3, -1.4]} r={0.06} color="#9aa4b5" />
      <Rod from={[1.9, y + 0.3, -1.4]} to={[1.9, 0, -1.4]} r={0.08} color="#9aa4b5" />
    </group>
  );
};

/* ------------------------------------------------------------ source */

export const Nozzle: React.FC<{ drop: number }> = ({ drop }) => (
  <group position={[F[0] + 1.75, F[1] + drop * 6, F[2]]} rotation={[0, 0, -Math.PI / 2]}>
    <Block size={[0.9, 0.8, 0.9]} position={[0, 0.3, 0]} color="#f4f7fb" outline={0.03} />
    <Block size={[0.92, 0.14, 0.92]} position={[0, 0.5, 0]} color="#2f6fd6" outline={0.01} />
    <Cone r={0.16} h={0.4} seg={16} position={[0, -0.3, 0]} rotation={[Math.PI, 0, 0]} color="#9aa4b5" outline={0.015} />
  </group>
);

export const LaserBox: React.FC<{ drop: number }> = ({ drop }) => (
  <group position={[-2.8, 0.55 + drop * 6, 2.2]} rotation={[0, 0.75, 0]}>
    <Block size={[1.6, 0.9, 0.9]} color="#f4f7fb" outline={0.03} />
    <Block size={[1.62, 0.16, 0.92]} position={[0, 0.25, 0]} color="#e63946" outline={0.01} />
    <Cyl rt={0.12} rb={0.12} h={0.3} seg={14} rotation={[0, 0, Math.PI / 2]} position={[-0.92, 0.05, 0]} color="#1b1f2a" outline={0.012} />
  </group>
);

export const Collector: React.FC<{ show: number; glow: number }> = ({ show, glow }) => {
  const g = useMemo(() => new THREE.SphereGeometry(1.3, 36, 20, 0, Math.PI * 2, 0, Math.PI * 0.32), []);
  if (show <= 0) return null;
  return (
    <group position={[F[0] - 1.25, F[1], F[2]]} rotation={[0, 0, -Math.PI / 2]} scale={show}>
      <Toon geometry={g} color={glow > 0.2 ? "#d9c6ff" : "#c9d1dc"} outline={0.03} rim={0.6} soft={0.4} position={[0, -1.2, 0]} />
    </group>
  );
};

/** One tin droplet's life: falls from the nozzle; `phase` 0=round, 1=flattened, 2=exploded. */
export const Droplet: React.FC<{ x: number; flat?: number }> = ({ x, flat = 0 }) => (
  <Ball r={0.07} seg={14} position={[x, F[1], F[2]]} scale={[1 - flat * 0.75, 1 + flat * 1.6, 1 + flat * 1.6]} color="#cfd6e0" outline={0.012} rim={0.6} />
);

/* ------------------------------------------------------------ vacuum chamber */

export const CH = { x0: -7.3, x1: 3.3, y0: 0.9, y1: 7.5, z0: -1.9, z1: 1.9 };

export const Chamber: React.FC<{ build: number }> = ({ build }) => {
  if (build <= 0) return null;
  const k = build;
  const cx = (CH.x0 + CH.x1) / 2;
  const cy = (CH.y0 + CH.y1) / 2;
  const w = CH.x1 - CH.x0;
  const h = CH.y1 - CH.y0;
  const d = CH.z1 - CH.z0;
  const glass = { color: "#cfe8ff", opacity: 0.13, outline: 0.03 };
  return (
    <group>
      <Block size={[w, h, 0.05]} position={[cx, cy + (1 - k) * 9, CH.z0]} {...glass} />
      <Block size={[w, 0.05, d]} position={[cx, CH.y1 + (1 - k) * 9, 0]} {...glass} />
      <Block size={[0.05, h, d]} position={[CH.x0 - (1 - k) * 9, cy, 0]} {...glass} />
      <Block size={[0.05, h, d]} position={[CH.x1 + (1 - k) * 9, cy, 0]} {...glass} />
      <Block size={[w, h, 0.05]} position={[cx, cy, CH.z1 + (1 - k) * 9]} {...glass} />
      {/* frame */}
      {k > 0.98
        ? [
            [CH.x0, CH.z0],
            [CH.x1, CH.z0],
            [CH.x0, CH.z1],
            [CH.x1, CH.z1],
          ].map(([x, z]) => <Block key={`${x}${z}`} size={[0.12, h, 0.12]} position={[x, cy, z]} color="#9aa4b5" outline={0.015} />)
        : null}
    </group>
  );
};

export const Pump: React.FC<{ show: number; t: number }> = ({ show, t }) => {
  if (show <= 0) return null;
  return (
    <group position={[2.6, 0, 3.0]} scale={show}>
      <Block size={[1.2, 1.0, 1.0]} position={[0, 0.5, 0]} color="#3b4252" outline={0.03} />
      <Cyl rt={0.32} rb={0.32} h={0.1} seg={20} rotation={[Math.PI / 2, 0, t * 20]} position={[0, 0.55, 0.53]} color="#9aa4b5" outline={0.012} />
      <Rod from={[-0.3, 0.9, -0.3]} to={[-0.3, 1.2, -1.15]} r={0.12} color="#9aa4b5" />
    </group>
  );
};

/** Air molecules drifting in the chamber; `suck` drags them into the pump. */
export const Air: React.FC<{ t: number; suck: number; show: number }> = ({ t, suck, show }) => {
  const g = useMemo(() => new THREE.SphereGeometry(0.09, 10, 8), []);
  const mats: THREE.Matrix4[] = [];
  if (show > 0) {
    const inlet = new THREE.Vector3(2.3, 1.2, 1.85);
    for (let i = 0; i < 70; i++) {
      const home = new THREE.Vector3(
        CH.x0 + 0.4 + rand(i) * (CH.x1 - CH.x0 - 0.8) + Math.sin(t * 1.3 + i) * 0.25,
        CH.y0 + 0.4 + rand(i + 1.7) * (CH.y1 - CH.y0 - 0.8) + Math.cos(t * 1.1 + i * 2) * 0.25,
        (rand(i + 3.3) - 0.5) * 3,
      );
      const delay = rand(i + 9) * 0.5;
      const k = Math.min(1, Math.max(0, (suck - delay) / 0.5));
      if (k >= 1) continue;
      const p = home.lerp(inlet, k * k);
      const s = show * (1 - k * 0.6);
      mats.push(mat4([p.x, p.y, p.z], [0, 0, 0], [s, s, s]));
    }
  }
  return <ToonInstances geometry={g} color="#7cc6ff" matrices={mats} outline={0.012} />;
};

/* ------------------------------------------------------------ lens, mirrors, mask */

const alignY = (dir: THREE.Vector3): V3 => {
  const e = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()));
  return [e.x, e.y, e.z];
};

const facing = (pos: V3, prev: V3, next: V3) => {
  const n = v(prev).sub(v(pos)).normalize().add(v(next).sub(v(pos)).normalize()).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
  const e = new THREE.Euler().setFromQuaternion(q);
  return [e.x, e.y, e.z] as V3;
};

export const Mirror: React.FC<{ at: number; prev: V3; next: V3; show: number; r?: number; hot?: number }> = ({ at, prev, next, show, r = 0.6, hot = 0 }) => {
  if (show <= 0) return null;
  const pos = PATH[at];
  return (
    <group position={[pos[0], pos[1] + (1 - show) * 6, pos[2]]} rotation={facing(pos, prev, next)}>
      <Cyl rt={r} rb={r} h={0.14} seg={40} position={[0, -0.07, 0]} color="#8a93a6" outline={0.025} />
      <Cyl rt={r * 0.88} rb={r * 0.88} h={0.15} seg={40} position={[0, -0.06, 0]} color={hot > 0 ? "#f1e6ff" : "#eef3fa"} outline={0} unlit />
      <Block size={[r * 1.2, 0.152, r * 0.16]} position={[0, -0.06, -r * 0.3]} rotation={[0, 0.6, 0]} color="#ffffff" unlit outline={0} />
      <Block size={[r * 0.9, 0.153, r * 0.07]} position={[0, -0.06, -r * 0.05]} rotation={[0, 0.6, 0]} color="#ffffff" unlit outline={0} />
      {hot > 0 ? <Glow position={[0, 0.02, 0]} r={r * 0.6} color="#b76bff" intensity={0.45 * hot} /> : null}
    </group>
  );
};

export const Lens: React.FC<{ show: number; crack: number; glow: number }> = ({ show, crack, glow }) => {
  if (show <= 0) return null;
  return (
    <group position={LENS} rotation={alignY(v(M1).sub(v(F)))}>
      <Ball r={0.6} seg={28} scale={[1, 0.28, 1]} color={glow > 0.3 ? "#d9b8ff" : "#bfe6ff"} opacity={0.75} outline={0.025} />
      {crack > 0 ? <group rotation={[-Math.PI / 2, 0, 0]}><Crack position={[0.1, 0.4, 0.2]} progress={crack} seed={4} len={0.8} color="#ffffff" /></group> : null}
    </group>
  );
};

export const Mask: React.FC<{ show: number; lit: number }> = ({ show, lit }) => {
  if (show <= 0) return null;
  return (
    <group position={[MASK[0], MASK[1] + (1 - show) * 6, MASK[2]]}>
      <Block size={[1.5, 0.1, 1.5]} color="#3b4252" outline={0.025} />
      <Block size={[1.2, 0.02, 1.2]} position={[0, -0.06, 0]} color={lit > 0.3 ? "#c9a6ff" : "#8a93a6"} unlit={lit > 0.3} outline={0} pattern="cobbles" patScale={[0.12, 0.12]} patColor="#3b2a5a" />
      <Block size={[1.0, 0.25, 0.25]} position={[0, 0.17, 0]} color="#9aa4b5" outline={0.015} />
    </group>
  );
};

export const Shards: React.FC<{ origin: V3; age: number; color?: string }> = ({ origin, age, color = "#cfe8ff" }) => {
  if (age < 0 || age > 1.1) return null;
  return (
    <group>
      {Array.from({ length: 14 }).map((_, i) => {
        const vx = (rand(i) - 0.5) * 3;
        const vy = 0.5 + rand(i + 2) * 2;
        const vz = 1 + rand(i + 4) * 2;
        return (
          <Block
            key={i}
            size={[0.12, 0.16, 0.02]}
            position={[origin[0] + vx * age, origin[1] + vy * age - 6 * age * age, origin[2] + vz * age]}
            rotation={[age * 7 + i, age * 5, i]}
            color={color}
            unlit
            outline={0.01}
          />
        );
      })}
    </group>
  );
};

/* ------------------------------------------------------------ chip layers */

export const Layers: React.FC<{ count: number; t: number }> = ({ count }) => {
  const cols = ["#c9773b", "#7cc6ff", "#b76bff", "#e0b43c", "#4ade80", "#ff8a5b", "#7c8cff", "#f4f7fb"];
  const n = Math.floor(count);
  const frac = count - n;
  return (
    <group>
      {Array.from({ length: Math.min(8, n + 1) }).map((_, i) => {
        const k = i < n ? 1 : frac;
        if (k <= 0) return null;
        return (
          <Cyl key={i} rt={0.95} rb={0.95} h={0.06} seg={64} position={[0, WAFER_TOP + 0.04 + i * 0.075 + (1 - k) * 0.8, 0]} color={cols[i % cols.length]} opacity={0.92} outline={0.015} />
        );
      })}
    </group>
  );
};

/* ------------------------------------------------------------ housing */

export const Housing: React.FC<{ build: number; small?: number }> = ({ build, small = 0 }) => {
  if (build <= 0) return null;
  const k = build;
  const fly = (1 - k) * 10;
  return (
    <group>
      <Block size={[11.2, 0.6, 4.4]} position={[-2, 0.3, 0]} color="#e9eef5" outline={0.04} />
      <Block size={[11.2, 7.2, 0.3]} position={[-2, 4.2, -2.2 - fly]} color="#f4f7fb" outline={0.04} />
      <Block size={[0.3, 7.2, 4.4]} position={[-7.6 - fly, 4.2, 0]} color="#f4f7fb" outline={0.04} />
      <Block size={[0.3, 7.2, 4.4]} position={[3.6 + fly, 4.2, 0]} color="#f4f7fb" outline={0.04} />
      <Block size={[11.5, 0.4, 4.7]} position={[-2, 7.9 + fly, 0]} color="#e9eef5" outline={0.04} />
      {/* front: panels + window into the light path */}
      <group position={[0, 0, fly]}>
        <Block size={[11.2, 2.2, 0.3]} position={[-2, 1.7, 2.2]} color="#f4f7fb" outline={0.04} />
        <Block size={[11.2, 1.4, 0.3]} position={[-2, 7.0, 2.2]} color="#f4f7fb" outline={0.04} />
        <Block size={[2.6, 3.6, 0.3]} position={[-6.2, 4.6, 2.2]} color="#f4f7fb" outline={0.04} />
        <Block size={[3.0, 3.6, 0.3]} position={[2.1, 4.6, 2.2]} color="#f4f7fb" outline={0.04} />
        <Block size={[5.6, 3.6, 0.06]} position={[-2.1, 4.6, 2.3]} color="#2a1d4d" outline={0.02} />
        <Block size={[5.2, 0.12, 0.08]} position={[-2.1, 3.0, 2.34]} color="#b76bff" unlit outline={0} />
        <Glow position={[-3.6, 4.6, 2.5]} r={0.8} color="#b76bff" intensity={0.5} />
        <Block size={[11.24, 0.35, 0.34]} position={[-2, 2.6, 2.2]} color="#2f6fd6" outline={0.012} />
        {[-6.8, -6.4, -6.0, -5.6].map((x) => (
          <Block key={x} size={[0.2, 1.2, 0.05]} position={[x, 1.5, 2.37]} color="#c3ccd8" outline={0} />
        ))}
        <Block size={[0.7, 0.5, 0.04]} position={[2.6, 1.4, 2.37]} color="#ffd23f" outline={0.01} />
      </group>
      <group position={[3.0, 8.1 + fly, 1.6]}>
        <Cyl rt={0.12} rb={0.12} h={0.3} seg={12} position={[0, 0.15, 0]} color="#9aa4b5" outline={0.012} />
        {["#4ade80", "#ffd23f", "#e63946"].map((c, i) => (
          <Cyl key={c} rt={0.14} rb={0.14} h={0.22} seg={14} position={[0, 0.42 + i * 0.24, 0]} color={c} unlit={i === 0} outline={0.012} />
        ))}
      </group>
      <Block size={[9, 0.35, 0.7]} position={[-2.5, 8.25 + fly, -1.2]} color="#c3ccd8" outline={0.02} />
      {small > 0 ? null : null}
    </group>
  );
};

/** Dutch flag on a pole, gently waving. */
export const DutchFlag: React.FC<{ position: V3; t: number; show: number; s?: number }> = ({ position, t, show, s = 1 }) => {
  if (show <= 0) return null;
  const cols = ["#ae1c28", "#ffffff", "#21468b"];
  return (
    <group position={position} scale={show * s}>
      <Cyl rt={0.04} rb={0.04} h={2.2} seg={8} position={[0, 1.1, 0]} color="#9aa4b5" outline={0.012} />
      {Array.from({ length: 6 }).map((_, i) => (
        <group key={i} position={[0.12 + i * 0.22, 1.85, Math.sin(t * 5 - i * 0.8) * 0.06 * i]}>
          {cols.map((c, j) => (
            <Block key={c} size={[0.22, 0.2, 0.03]} position={[0, -j * 0.2, 0]} color={c} outline={i === 0 || i === 5 ? 0.008 : 0} soft={0.5} />
          ))}
        </group>
      ))}
    </group>
  );
};

/* ------------------------------------------------------------ bus */

export const Bus: React.FC<{ position: V3; show: number }> = ({ position, show }) => {
  if (show <= 0) return null;
  return (
    <group position={[position[0], position[1] + (1 - show) * 8, position[2]]}>
      <Block size={[11, 2.9, 2.6]} position={[0, 1.85, 0]} color="#ffc93c" outline={0.05} />
      <Block size={[11.02, 0.3, 2.62]} position={[0, 1.1, 0]} color="#1b1f2a" outline={0} />
      {Array.from({ length: 8 }).map((_, i) => (
        <Block key={i} size={[1.0, 0.9, 0.05]} position={[-4.4 + i * 1.25, 2.45, 1.31]} color="#2b3a55" outline={0.012} rim={0.3} />
      ))}
      <Block size={[0.05, 1.2, 2.2]} position={[5.51, 2.3, 0]} color="#2b3a55" outline={0.012} />
      {[-3.8, 3.6].map((x) => (
        <Cyl key={x} rt={0.5} rb={0.5} h={0.4} seg={20} rotation={[Math.PI / 2, 0, 0]} position={[x, 0.5, 1.2]} color="#1b1f2a" outline={0.02} />
      ))}
    </group>
  );
};

/* ------------------------------------------------------------ 1984 shed */

export const Shed: React.FC<{ show: number; t: number }> = ({ show, t }) => {
  if (show <= 0) return null;
  const k = show;
  return (
    <group>
      <Block size={[22, 11, 0.4]} position={[-2, 5.5 + (1 - k) * 14, -4.6]} color="#8a6240" outline={0.04} pattern="planks" patScale={[1, 0.45]} patColor="#4a3020" />
      <Block size={[0.4, 11, 12]} position={[-10.5 - (1 - k) * 12, 5.5, 1]} color="#7b5536" outline={0.04} pattern="planks" patScale={[1, 0.45]} patColor="#4a3020" />
      {[-8, -4.5, -1, 2.5, 6].map((x, i) => (
        <Block key={x} size={[3.0, 0.3, 12]} position={[x, 10.2 + (1 - k) * 12 + (i % 2) * 0.1, 1]} rotation={[0, 0, (i % 2 ? 0.05 : -0.04)]} color="#6b4a2e" outline={0.03} pattern="planks" patScale={[0.6, 1]} patColor="#3b2a1a" />
      ))}
      {/* bucket catching the drips */}
      <group position={[3.2, 0, 2.6]} scale={k}>
        <Cyl rt={0.42} rb={0.34} h={0.6} seg={20} position={[0, 0.3, 0]} color="#9aa4b5" outline={0.02} />
        <Cyl rt={0.36} rb={0.36} h={0.02} seg={20} position={[0, 0.5, 0]} color="#4f9fd6" outline={0} />
      </group>
      {Array.from({ length: 5 }).map((_, i) => {
        const y = 10 - (((t * 7 + i * 2) % 10) + 10) % 10;
        return <Ball key={i} r={0.06} position={[3.2 + (i % 2) * 0.1, y, 2.6]} scale={[0.8, 1.4, 0.8]} color="#7cc6ff" outline={0.008} />;
      })}
    </group>
  );
};

export const OldMachine: React.FC<{ show: number }> = ({ show }) => {
  if (show <= 0) return null;
  return (
    <group position={[-1.5, 0, 0]} scale={show}>
      <Block size={[3.2, 2.4, 2.2]} position={[0, 1.2, 0]} color="#d9cdb0" outline={0.04} />
      <Block size={[3.22, 0.3, 2.22]} position={[0, 1.8, 0]} color="#7a5b3a" outline={0.012} />
      <Block size={[1.0, 0.7, 0.05]} position={[-0.7, 1.2, 1.11]} color="#2b3140" outline={0.015} />
      {[0.4, 0.8, 1.2].map((x) => (
        <Cyl key={x} rt={0.12} rb={0.12} h={0.06} seg={14} rotation={[Math.PI / 2, 0, 0]} position={[x, 1.2, 1.12]} color="#e63946" outline={0.01} />
      ))}
      <Cyl rt={0.35} rb={0.45} h={1.2} seg={16} position={[0, 3.0, 0]} color="#b9ad90" outline={0.03} />
    </group>
  );
};

/* ------------------------------------------------------------ products */

export const Laptop: React.FC<{ position: V3; s: number }> = ({ position, s }) =>
  s <= 0 ? null : (
    <group position={position} scale={s} rotation={[0, -0.4, 0]}>
      <Block size={[1.6, 0.08, 1.1]} position={[0, 0.04, 0]} color="#c3cad6" outline={0.02} />
      <group position={[0, 0.08, -0.55]} rotation={[-0.25, 0, 0]}>
        <Block size={[1.6, 1.05, 0.06]} position={[0, 0.52, 0]} color="#c3cad6" outline={0.02} />
        <Block size={[1.45, 0.9, 0.02]} position={[0, 0.52, 0.035]} color="#4f8cf7" unlit outline={0} />
      </group>
    </group>
  );

export const Server: React.FC<{ position: V3; s: number; t: number }> = ({ position, s, t }) =>
  s <= 0 ? null : (
    <group position={position} scale={s} rotation={[0, -0.3, 0]}>
      <Block size={[1.0, 2.4, 0.9]} position={[0, 1.2, 0]} color="#1b2233" outline={0.03} />
      {Array.from({ length: 7 }).map((_, i) => (
        <group key={i}>
          <Block size={[0.85, 0.04, 0.02]} position={[0, 0.35 + i * 0.3, 0.46]} color="#3b4252" outline={0} />
          <Ball r={0.035} position={[0.32, 0.4 + i * 0.3, 0.46]} color={Math.sin(t * 9 + i * 2) > 0 ? "#4ade80" : "#7cc6ff"} unlit outline={0} />
        </group>
      ))}
    </group>
  );

/** Re-export for scene code. */
export { useLook };

/** Projected light pattern hovering just above the magnified die. */
export const LightBars: React.FC<{ blur: number; crisp: number }> = ({ blur, crisp }) => {
  const g = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const soft = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffd86b", transparent: true, opacity: 0.25, depthWrite: false, toneMapped: false }), []);
  const hard = useMemo(() => new THREE.MeshBasicMaterial({ color: "#c58cff", transparent: true, opacity: 0.95, depthWrite: false, toneMapped: false }), []);
  soft.opacity = 0.16 * blur;
  hard.opacity = 0.95 * crisp;
  if (blur <= 0.01 && crisp <= 0.01) return null;
  const y = WAFER_TOP + 0.021;
  return (
    <group>
      {blur > 0.01
        ? Array.from({ length: 9 }).flatMap((_, i) =>
            [0.022, 0.016, 0.01].map((wd, j) => (
              <mesh key={`${i}-${j}`} geometry={g} material={soft} position={[-0.08 + i * 0.02, y + j * 0.0005, 0]} scale={[wd, 0.0008, 0.2]} />
            )),
          )
        : null}
      {crisp > 0.01
        ? Array.from({ length: 17 }).map((_, i) => <mesh key={i} geometry={g} material={hard} position={[-0.08 + i * 0.01, y, 0]} scale={[0.0016, 0.0008, 0.2]} />)
        : null}
    </group>
  );
};
