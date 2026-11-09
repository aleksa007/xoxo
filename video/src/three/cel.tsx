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
  ${FOG_VERT}
  void main() {
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
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
  varying vec3 vNormalW;
  ${fogFrag}
  void main() {
    float d = dot(normalize(vNormalW), normalize(uLightDir));
    float lit = smoothstep(-0.02, 0.06, d);
    vec3 shadow = uColor * uShadeTint * uShade;
    vec3 col = mix(shadow, uColor, max(lit, uUnlit));
    col *= mix(uExposure, 1.0, uUnlit);
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
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
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

export type CelOpts = {
  unlit?: boolean;
  /** 0..1, lifts the shadow side (faces read better when flatter). */
  soft?: number;
  opacity?: number;
  side?: THREE.Side;
};

export const useCelMaterial = (color: string, opts: CelOpts = {}) => {
  const look = useLook();
  const { unlit = false, opacity = 1, side = THREE.FrontSide, soft = 0 } = opts;
  return useMemo(
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
          ...fogUniforms(look),
        },
      }),
    [color, look, unlit, opacity, side, soft],
  );
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

export type ToonProps = {
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
}) => {
  const mat = useCelMaterial(color, { unlit, opacity, soft });
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
