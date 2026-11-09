import React, { createContext, useContext, useMemo } from "react";
import * as THREE from "three";

/**
 * Cel-shading kit.
 *
 * Every solid gets a two-tone "toon" material (lit / shadow, hard edge) plus an
 * inverted-hull outline, which gives the thick-black-line cartoon look of the
 * reference clips. Fog is done by hand so it blends in linear space and always
 * matches the CSS sky behind the transparent canvas.
 */

export type Look = {
  lightDir: [number, number, number];
  /** Brightness of the shadow side (0..1). */
  shade: number;
  /** Colour the shadow side is multiplied by (cool blue for night etc). */
  shadeTint: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  outlineColor: string;
  /** Global multiplier, handy for night scenes. */
  exposure: number;
  rim?: number;
  rimColor?: string;
};

export const DAY: Look = {
  lightDir: [0.6, 1, 0.7],
  shade: 0.72,
  shadeTint: "#c9d4ff",
  fogColor: "#cfe4f5",
  fogNear: 25,
  fogFar: 90,
  outlineColor: "#16161f",
  exposure: 1,
};

export const NIGHT: Look = {
  lightDir: [-0.4, 0.8, 0.95],
  shade: 0.62,
  shadeTint: "#8f9cff",
  fogColor: "#22306a",
  fogNear: 20,
  fogFar: 95,
  outlineColor: "#0b0c1c",
  exposure: 0.72,
};

const LookCtx = createContext<Look>(DAY);
export const LookProvider: React.FC<{ look: Look; children: React.ReactNode }> = ({ look, children }) => (
  <LookCtx.Provider value={look}>{children}</LookCtx.Provider>
);
export const useLook = () => useContext(LookCtx);

const FOG_VERT = /* glsl */ `
  varying float vFogDepth;
`;

const celVertex = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vNormalO;
  varying vec3 vPosO;
  varying vec3 vPosW;
  ${FOG_VERT}
  void main() {
    vec4 lp = vec4(position, 1.0);
    vec3 ln = normal;
    #ifdef USE_INSTANCING
      lp = instanceMatrix * lp;
      ln = mat3(instanceMatrix) * ln;
    #endif
    vNormalW = normalize(mat3(modelMatrix) * ln);
    vNormalO = normal;
    vPosO = position;
    vec4 wp = modelMatrix * lp;
    vPosW = wp.xyz;
    vec4 mv = viewMatrix * wp;
    vFogDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const fogFrag = /* glsl */ `
  uniform vec3 uFogColor;
  uniform float uFogNear;
  uniform float uFogFar;
  varying float vFogDepth;
  vec3 applyFog(vec3 c) {
    float f = smoothstep(uFogNear, uFogFar, vFogDepth);
    return mix(c, uFogColor, f);
  }
`;

const celFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uLightDir;
  uniform float uShade;
  uniform vec3 uShadeTint;
  uniform float uUnlit;
  uniform float uExposure;
  uniform float uOpacity;
  uniform int uPattern;
  uniform vec2 uPatScale;
  uniform vec3 uPatColor;
  uniform float uPatStrength;
  uniform float uRim;
  uniform vec3 uRimColor;
  uniform float uWaterY;
  uniform float uDots;
  uniform float uTime;
  varying vec3 vNormalW;
  varying vec3 vNormalO;
  varying vec3 vPosO;
  varying vec3 vPosW;
  ${fogFrag}

  float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  vec2 planeUV() {
    vec3 n = abs(vNormalO);
    if (n.x > n.y && n.x > n.z) return vPosO.zy;
    if (n.z >= n.y) return vPosO.xy;
    return vPosO.xz;
  }

  // anti-aliased "is this pixel within w of a cell edge" mask
  float edge(float f, float w) {
    float aa = fwidth(f) * 1.2 + 1e-4;
    return 1.0 - smoothstep(w, w + aa, f);
  }

  vec3 applyPattern(vec3 c) {
    if (uPattern == 0) return c;
    vec2 uv = planeUV() / uPatScale;
    float fade = 1.0 - smoothstep(18.0, 45.0, vFogDepth);
    float st = uPatStrength * fade;
    if (uPattern == 1 || uPattern == 5) {            // bricks / stone blocks
      float row = floor(uv.y);
      uv.x += mod(row, 2.0) * 0.5;
      vec2 f = fract(uv);
      float id = hash2(vec2(floor(uv.x), row));
      c *= 0.88 + 0.22 * id * fade + 0.11 * (1.0 - fade);
      float m = max(edge(f.x, uPattern == 1 ? 0.05 : 0.025), edge(f.y, uPattern == 1 ? 0.11 : 0.05));
      c = mix(c, uPatColor, m * st);
    } else if (uPattern == 2) {                       // wood grain along local y
      float g = sin(uv.x * 9.0 + sin(uv.y * 1.3) * 2.2) * 0.5 + 0.5;
      c *= 0.9 + 0.14 * g;
      c = mix(c, uPatColor, edge(fract(uv.x * 0.5), 0.03) * st * 0.6);
    } else if (uPattern == 3) {                       // speckled soil
      vec2 q = uv * 3.0;
      vec2 cell = floor(q);
      float h = hash2(cell);
      vec2 o = vec2(hash2(cell + 7.1), hash2(cell + 3.7)) - 0.5;
      float d = length(fract(q) - 0.5 - o * 0.5);
      float dotm = (1.0 - smoothstep(0.12, 0.16, d)) * step(0.55, h);
      c *= 0.93 + 0.12 * hash2(floor(uv * 0.7));
      c = mix(c, uPatColor, dotm * st);
    } else if (uPattern == 4) {                       // horizontal planks
      float row = floor(uv.y);
      c *= 0.9 + 0.16 * hash2(vec2(row, 3.0));
      c = mix(c, uPatColor, edge(fract(uv.y), 0.06) * st);
    } else if (uPattern == 6) {                       // roof tiles
      float row = floor(uv.y);
      uv.x += mod(row, 2.0) * 0.5;
      vec2 f = fract(uv);
      c *= 0.8 + 0.28 * f.y;
      c = mix(c, uPatColor, max(edge(f.y, 0.08), edge(f.x, 0.04)) * st);
    } else if (uPattern == 7) {                       // cobbles
      vec2 cell = floor(uv);
      vec2 f = fract(uv) - 0.5;
      float r = max(abs(f.x), abs(f.y));
      c *= 0.86 + 0.24 * hash2(cell);
      c = mix(c, uPatColor, smoothstep(0.38, 0.47, r) * st);
    }
    return c;
  }

  void main() {
    vec3 n = normalize(vNormalW);
    float d = dot(n, normalize(uLightDir));
    float lit = smoothstep(-0.02, 0.06, d);
    vec3 base = applyPattern(uColor);
    vec3 shadow = base * uShadeTint * uShade;
    vec3 col = mix(shadow, base, max(lit, uUnlit));
    col *= mix(uExposure, 1.0, uUnlit);
    if (uRim > 0.0) {
      vec3 v = normalize(cameraPosition - vPosW);
      float r = pow(1.0 - max(dot(n, v), 0.0), 3.0);
      col += uRimColor * r * uRim * (1.0 - uUnlit);
    }
    if (uDots > 0.5 && vPosW.y < uWaterY && n.z > 0.5) {   // groundwater, shown as blue dots on cut faces
      vec2 q = vPosW.xy * 2.3 + vec2(0.0, uTime * 0.25);
      vec2 cell = floor(q);
      vec2 o = vec2(hash2(cell + 1.3), hash2(cell + 9.2)) - 0.5;
      float dd = length(fract(q) - 0.5 - o * 0.45);
      float dm = (1.0 - smoothstep(0.11, 0.15, dd)) * step(0.35, hash2(cell + 4.4));
      col = mix(col, vec3(0.42, 0.78, 1.0), dm * 0.95);
      col = mix(col, vec3(0.25, 0.5, 0.95), 0.06);
    }
    col = applyFog(col);
    gl_FragColor = vec4(col, uOpacity);
    #include <colorspace_fragment>
  }
`;

const outlineVertex = /* glsl */ `
  uniform float uThickness;
  uniform float uMode;      // 0 = push along normal, 1 = per-axis scale (boxes, cones, cylinders)
  uniform vec3 uHalf;       // half extents for mode 1
  uniform vec3 uCenter;
  ${FOG_VERT}
  void main() {
    vec3 p = position;
    if (uMode < 0.5) {
      p += normalize(normal) * uThickness;
    } else {
      vec3 rel = p - uCenter;
      p = uCenter + rel * (uHalf + vec3(uThickness)) / max(uHalf, vec3(1e-4));
    }
    vec4 lp = vec4(p, 1.0);
    #ifdef USE_INSTANCING
      lp = instanceMatrix * lp;
    #endif
    vec4 mv = modelViewMatrix * lp;
    vFogDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const outlineFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  ${fogFrag}
  void main() {
    gl_FragColor = vec4(applyFog(uColor), uOpacity);
    #include <colorspace_fragment>
  }
`;

const fogUniforms = (look: Look) => ({
  uFogColor: { value: new THREE.Color(look.fogColor) },
  uFogNear: { value: look.fogNear },
  uFogFar: { value: look.fogFar },
});

export type Pattern = "none" | "brick" | "wood" | "speckle" | "planks" | "stone" | "tiles" | "cobbles";
const PATTERN_ID: Record<Pattern, number> = { none: 0, brick: 1, wood: 2, speckle: 3, planks: 4, stone: 5, tiles: 6, cobbles: 7 };

export type PatternOpts = {
  pattern?: Pattern;
  /** Size of one pattern cell in local units [u, v]. */
  patScale?: [number, number];
  patColor?: string;
  patStrength?: number;
  rim?: number;
  /** Groundwater dots on +z faces below this world y. */
  waterY?: number;
  time?: number;
};

export type CelOpts = PatternOpts & {
  unlit?: boolean;
  /** 0..1, lifts the shadow side (faces read better when flatter). */
  soft?: number;
  opacity?: number;
  side?: THREE.Side;
};

export const useCelMaterial = (color: string, opts: CelOpts = {}) => {
  const look = useLook();
  const {
    unlit = false,
    opacity = 1,
    side = THREE.FrontSide,
    soft = 0,
    pattern = "none",
    patScale = [0.25, 0.1],
    patColor = "#e9dfcf",
    patStrength = 1,
    rim = 0,
    waterY,
    time = 0,
  } = opts;
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: celVertex,
        fragmentShader: celFragment,
        transparent: opacity < 1,
        side,
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uLightDir: { value: new THREE.Vector3(...look.lightDir) },
          uShade: { value: look.shade + (1 - look.shade) * soft },
          uShadeTint: { value: new THREE.Color(look.shadeTint) },
          uUnlit: { value: unlit ? 1 : 0 },
          uExposure: { value: look.exposure },
          uOpacity: { value: opacity },
          uPattern: { value: PATTERN_ID[pattern] },
          uPatScale: { value: new THREE.Vector2(patScale[0], patScale[1]) },
          uPatColor: { value: new THREE.Color(patColor) },
          uPatStrength: { value: patStrength },
          uRim: { value: rim || look.rim || 0 },
          uRimColor: { value: new THREE.Color(look.rimColor ?? "#ffffff") },
          uWaterY: { value: waterY ?? -1e9 },
          uDots: { value: waterY === undefined ? 0 : 1 },
          uTime: { value: time },
          ...fogUniforms(look),
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [color, look, unlit, opacity, side, soft, pattern, patScale[0], patScale[1], patColor, patStrength, rim, waterY === undefined],
  );
  // per-frame values without rebuilding the material
  mat.uniforms.uWaterY.value = waterY ?? -1e9;
  mat.uniforms.uTime.value = time;
  return mat;
};

const useOutlineMaterial = (
  thickness: number,
  geometry: THREE.BufferGeometry,
  mode: "normal" | "scale",
  opacity: number,
) => {
  const look = useLook();
  return useMemo(() => {
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    const half = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(half).multiplyScalar(0.5);
    box.getCenter(center);
    return new THREE.ShaderMaterial({
      vertexShader: outlineVertex,
      fragmentShader: outlineFragment,
      side: THREE.BackSide,
      transparent: opacity < 1,
      uniforms: {
        uThickness: { value: thickness },
        uMode: { value: mode === "normal" ? 0 : 1 },
        uHalf: { value: half },
        uCenter: { value: center },
        uColor: { value: new THREE.Color(look.outlineColor) },
        uOpacity: { value: opacity },
        ...fogUniforms(look),
      },
    });
  }, [thickness, geometry, mode, look, opacity]);
};

export type ToonProps = PatternOpts & {
  geometry: THREE.BufferGeometry;
  color: string;
  /** Outline thickness in local units. 0 disables the outline. */
  outline?: number;
  outlineMode?: "normal" | "scale";
  unlit?: boolean;
  soft?: number;
  opacity?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  renderOrder?: number;
};

export const Toon: React.FC<ToonProps> = ({
  geometry,
  color,
  outline = 0.035,
  outlineMode = "normal",
  unlit,
  soft,
  opacity = 1,
  position,
  rotation,
  scale,
  renderOrder,
  ...pat
}) => {
  const mat = useCelMaterial(color, { unlit, opacity, soft, ...pat });
  const outlineMat = useOutlineMaterial(outline, geometry, outlineMode, opacity);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geometry} material={mat} renderOrder={renderOrder} />
      {outline > 0 ? <mesh geometry={geometry} material={outlineMat} renderOrder={renderOrder} /> : null}
    </group>
  );
};

/* ---------- Primitive helpers (geometry is memoised per size) ---------- */

type Placement = Omit<ToonProps, "geometry">;

export const Ball: React.FC<Placement & { r: number; seg?: number }> = ({ r, seg = 28, ...p }) => {
  const g = useMemo(() => new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75)), [r, seg]);
  return <Toon geometry={g} {...p} />;
};

export const Block: React.FC<Placement & { size: [number, number, number] }> = ({ size, ...p }) => {
  const g = useMemo(() => new THREE.BoxGeometry(...size), [size[0], size[1], size[2]]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Toon geometry={g} outlineMode="scale" {...p} />;
};

export const Cone: React.FC<Placement & { r: number; h: number; seg?: number }> = ({ r, h, seg = 24, ...p }) => {
  const g = useMemo(() => new THREE.ConeGeometry(r, h, seg), [r, h, seg]);
  return <Toon geometry={g} outlineMode="scale" {...p} />;
};

export const Cyl: React.FC<Placement & { rt: number; rb: number; h: number; seg?: number }> = ({
  rt,
  rb,
  h,
  seg = 24,
  ...p
}) => {
  const g = useMemo(() => new THREE.CylinderGeometry(rt, rb, h, seg), [rt, rb, h, seg]);
  return <Toon geometry={g} outlineMode="scale" {...p} />;
};

export const Capsule: React.FC<Placement & { r: number; len: number }> = ({ r, len, ...p }) => {
  const g = useMemo(() => new THREE.CapsuleGeometry(r, len, 6, 16), [r, len]);
  return <Toon geometry={g} {...p} />;
};

/** Flat soft-edged dark disc used as a cheap contact shadow. */
export const BlobShadow: React.FC<{ r: number; position?: [number, number, number]; opacity?: number }> = ({
  r,
  position,
  opacity = 0.22,
}) => {
  const g = useMemo(() => new THREE.CircleGeometry(r, 32), [r]);
  return (
    <mesh geometry={g} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <meshBasicMaterial color="#0d1030" transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
};

/** Deterministic pseudo random, so every render of a frame is identical. */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/* ------------------------------------------------------------------ water */

const waterFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uDeep;
  uniform float uTime;
  uniform float uOpacity;
  varying vec3 vPosW;
  ${fogFrag}
  void main() {
    vec2 p = vPosW.xz;
    float w1 = sin(p.x * 1.7 + uTime * 1.6 + sin(p.y * 0.9 + uTime) * 1.5);
    float w2 = sin(p.y * 2.3 - uTime * 1.2 + sin(p.x * 1.1) * 1.2);
    float ripple = smoothstep(0.82, 0.97, (w1 * 0.6 + w2 * 0.4) * 0.5 + 0.5);
    vec3 col = mix(uDeep, uColor, 0.55 + 0.25 * w2);
    col = mix(col, vec3(1.0), ripple * 0.55);
    col = applyFog(col);
    gl_FragColor = vec4(col, uOpacity);
    #include <colorspace_fragment>
  }
`;

const waterVertex = /* glsl */ `
  varying vec3 vPosW;
  ${FOG_VERT}
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vPosW = wp.xyz;
    vec4 mv = viewMatrix * wp;
    vFogDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

/** Flat animated water surface (horizontal plane). */
export const WaterSurface: React.FC<{
  size: [number, number];
  position?: [number, number, number];
  color?: string;
  deep?: string;
  time: number;
  opacity?: number;
}> = ({ size, position, color = "#4f9fd6", deep = "#2a5f8f", time, opacity = 0.95 }) => {
  const look = useLook();
  const g = useMemo(() => new THREE.PlaneGeometry(size[0], size[1]).rotateX(-Math.PI / 2), [size[0], size[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: waterVertex,
        fragmentShader: waterFragment,
        transparent: opacity < 1,
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uDeep: { value: new THREE.Color(deep) },
          uTime: { value: 0 },
          uOpacity: { value: opacity },
          ...fogUniforms(look),
        },
      }),
    [color, deep, opacity, look],
  );
  mat.uniforms.uTime.value = time;
  return <mesh geometry={g} material={mat} position={position} />;
};

/** Many copies of one toon mesh in a single draw call (piles, bricks, reeds...). */
export const ToonInstances: React.FC<
  PatternOpts & {
    geometry: THREE.BufferGeometry;
    color: string;
    matrices: THREE.Matrix4[];
    outline?: number;
    outlineMode?: "normal" | "scale";
    unlit?: boolean;
  }
> = ({ geometry, color, matrices, outline = 0.035, outlineMode = "normal", unlit, ...pat }) => {
  const mat = useCelMaterial(color, { unlit, ...pat });
  const outlineMat = useOutlineMaterial(outline, geometry, outlineMode, 1);
  const count = matrices.length;
  const fill = useMemo(() => new THREE.InstancedMesh(geometry, mat, Math.max(count, 1)), [geometry, mat, count]);
  const line = useMemo(() => new THREE.InstancedMesh(geometry, outlineMat, Math.max(count, 1)), [geometry, outlineMat, count]);
  for (const m of [fill, line]) {
    m.count = count;
    matrices.forEach((mx, i) => m.setMatrixAt(i, mx));
    m.instanceMatrix.needsUpdate = true;
    m.frustumCulled = false;
  }
  return (
    <group>
      <primitive object={fill} />
      {outline > 0 ? <primitive object={line} /> : null}
    </group>
  );
};

export const mat4 = (
  pos: [number, number, number],
  rot: [number, number, number] = [0, 0, 0],
  scale: [number, number, number] = [1, 1, 1],
) =>
  new THREE.Matrix4().compose(
    new THREE.Vector3(...pos),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),
    new THREE.Vector3(...scale),
  );
