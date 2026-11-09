/**
 * Six style studies of the same little scene (a house on a cut-away piece of
 * ground with our mascot), to help pick a signature look for the channel.
 * One composition per style: StyleClay, StylePaper, StyleIso, StyleBlueprint,
 * StyleToy, StyleComic.
 */
import React, { createContext, useContext, useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import "@fontsource/caveat/700.css";
import "@fontsource/permanent-marker/400.css";
import { CameraRig } from "../three/props";
import { FONT } from "../ui/fonts";

type V3 = [number, number, number];
type Kind = "default" | "chrome" | "glass" | "dark";

/* ------------------------------------------------------------------ helpers */

const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Procedural bump textures: soft clay with fingerprints, or paper fibres. */
const makeTexture = (kind: "clay" | "paper") => {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#808080";
  g.fillRect(0, 0, 512, 512);
  if (kind === "clay") {
    for (let i = 0; i < 260; i++) {
      const x = hash(i) * 512;
      const y = hash(i + 7.3) * 512;
      const r = 6 + hash(i + 2.1) * 40;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      const v = hash(i + 9.9) > 0.5 ? 255 : 0;
      gr.addColorStop(0, `rgba(${v},${v},${v},0.16)`);
      gr.addColorStop(1, `rgba(${v},${v},${v},0)`);
      g.fillStyle = gr;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // fingerprints: groups of concentric arcs
    for (let f = 0; f < 6; f++) {
      const x = hash(f + 40) * 512;
      const y = hash(f + 41) * 512;
      g.strokeStyle = "rgba(40,40,40,0.18)";
      g.lineWidth = 1.6;
      for (let k = 1; k < 9; k++) {
        g.beginPath();
        g.ellipse(x, y, k * 4.5, k * 3.2, hash(f) * 3, 0.3, Math.PI * 1.7);
        g.stroke();
      }
    }
  } else {
    for (let i = 0; i < 2600; i++) {
      const x = hash(i) * 512;
      const y = hash(i + 3.7) * 512;
      const a = hash(i + 1.3) * Math.PI;
      const l = 3 + hash(i + 5.1) * 10;
      const v = hash(i + 8.8) > 0.5 ? 200 : 60;
      g.strokeStyle = `rgba(${v},${v},${v},0.25)`;
      g.lineWidth = 0.8;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      g.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  return t;
};

const toonGradient = (() => {
  let tex: THREE.DataTexture | null = null;
  return () => {
    if (!tex) {
      tex = new THREE.DataTexture(new Uint8Array([90, 170, 255]), 3, 1, THREE.RedFormat);
      tex.minFilter = tex.magFilter = THREE.NearestFilter;
      tex.needsUpdate = true;
    }
    return tex;
  };
})();

/** Ink outline: back faces pushed out along the normal. */
const outlineMaterial = (thickness: number, color = "#16161f") =>
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { uT: { value: thickness }, uC: { value: new THREE.Color(color) } },
    vertexShader: /* glsl */ `
      uniform float uT;
      void main() {
        vec3 p = position + normalize(normal) * uT;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uC;
      void main() { gl_FragColor = vec4(uC, 1.0); }`,
  });

/** Comic-book shading: two tones plus halftone dots in the shadows. */
const comicMaterial = (color: string) =>
  new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uLight: { value: new THREE.Vector3(0.5, 0.8, 0.6).normalize() } },
    vertexShader: /* glsl */ `
      varying vec3 vN;
      void main() {
        vN = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform vec3 uLight; varying vec3 vN;
      void main() {
        float d = dot(normalize(vN), uLight);
        float lit = smoothstep(0.02, 0.08, d);
        vec2 p = gl_FragCoord.xy / 10.0;
        p = mat2(0.707, -0.707, 0.707, 0.707) * p;
        float r = length(fract(p) - 0.5);
        float size = mix(0.22, 0.46, 1.0 - smoothstep(-0.7, 0.05, d));
        float dots = 1.0 - smoothstep(size - 0.05, size, r);
        vec3 col = mix(uColor * 0.78, uColor, lit);
        col = mix(col, uColor * 0.35, dots * (1.0 - lit));
        col += smoothstep(0.92, 0.97, d) * 0.12;
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });

/* ------------------------------------------------------------------ style context */

type Style = {
  mat: (color: string, kind: Kind) => THREE.Material;
  outline: number;
  shadows: boolean;
  round: number;
};
const StyleCtx = createContext<Style | null>(null);
const useStyle = () => useContext(StyleCtx)!;

const P: React.FC<{ geo: THREE.BufferGeometry; color: string; kind?: Kind; position?: V3; rotation?: V3; scale?: number | V3 }> = ({
  geo,
  color,
  kind = "default",
  position,
  rotation,
  scale,
}) => {
  const s = useStyle();
  const mat = useMemo(() => s.mat(color, kind), [s, color, kind]);
  const ol = useMemo(() => (s.outline > 0 ? outlineMaterial(s.outline) : null), [s]);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geo} material={mat} castShadow={s.shadows} receiveShadow={s.shadows} />
      {ol ? <mesh geometry={geo} material={ol} /> : null}
    </group>
  );
};

const RB: React.FC<{ size: V3; color: string; kind?: Kind; position?: V3; rotation?: V3 }> = ({ size, ...p }) => {
  const s = useStyle();
  const g = useMemo(() => new RoundedBoxGeometry(size[0], size[1], size[2], 4, Math.min(s.round, Math.min(...size) / 2 - 0.001)), [size[0], size[1], size[2], s.round]); // eslint-disable-line react-hooks/exhaustive-deps
  return <P geo={g} {...p} />;
};
const Sph: React.FC<{ r: number; color: string; kind?: Kind; position?: V3; scale?: number | V3 }> = ({ r, ...p }) => {
  const g = useMemo(() => new THREE.SphereGeometry(r, 32, 24), [r]);
  return <P geo={g} {...p} />;
};
const Cap: React.FC<{ r: number; len: number; color: string; position?: V3; rotation?: V3 }> = ({ r, len, ...p }) => {
  const g = useMemo(() => new THREE.CapsuleGeometry(r, len, 8, 20), [r, len]);
  return <P geo={g} {...p} />;
};
const Cyl: React.FC<{ r: number; h: number; color: string; kind?: Kind; position?: V3; rotation?: V3 }> = ({ r, h, ...p }) => {
  const g = useMemo(() => new THREE.CylinderGeometry(r, r, h, 28), [r, h]);
  return <P geo={g} {...p} />;
};

/* ------------------------------------------------------------------ the shared 3D scene */

const PALETTE = {
  grass: "#7cc46a",
  soil: "#9a6b47",
  rock: "#8a8f9c",
  house: "#f2d39b",
  roof: "#d1495b",
  door: "#3d405b",
  window: "#a8dcf5",
  trunk: "#8d6346",
  leaf: "#4f9a5c",
  leaf2: "#6dbb6b",
  coat: "#e2483d",
  hat: "#2f6fd6",
  skin: "#f6d7b8",
  fence: "#fbf6ee",
  stone: "#d9d2c3",
};

const Roof: React.FC<{ color: string }> = ({ color }) => {
  const g = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-1.35, 0);
    s.lineTo(1.35, 0);
    s.lineTo(0, 1.05);
    s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: 2.15, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 3 });
    geo.translate(0, 0, -1.075);
    geo.computeVertexNormals();
    return geo;
  }, []);
  return <P geo={g} color={color} position={[-0.7, 1.6, -0.3]} />;
};

const Mascot: React.FC<{ position: V3 }> = ({ position }) => {
  const smile = useMemo(() => new THREE.TorusGeometry(0.11, 0.025, 10, 24, Math.PI), []);
  const cap = useMemo(() => new THREE.SphereGeometry(0.52, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.38), []);
  return (
    <group position={position} rotation={[0, -0.35, 0]}>
      <Cap r={0.07} len={0.4} color="#2b2f4a" position={[-0.12, 0.3, 0]} />
      <Cap r={0.07} len={0.4} color="#2b2f4a" position={[0.12, 0.3, 0]} />
      <Cap r={0.3} len={0.32} color={PALETTE.coat} position={[0, 0.82, 0]} />
      <Cap r={0.07} len={0.36} color={PALETTE.coat} position={[-0.38, 0.9, 0]} rotation={[0, 0, -0.35]} />
      <group position={[0.34, 1.05, 0]} rotation={[0, 0, 2.5]}>
        <Cap r={0.07} len={0.36} color={PALETTE.coat} position={[0, -0.24, 0]} />
        <Sph r={0.1} color={PALETTE.hat} position={[0, -0.48, 0]} />
      </group>
      <Sph r={0.48} color={PALETTE.skin} position={[0, 1.55, 0]} />
      <P geo={cap} color={PALETTE.hat} position={[0, 1.57, 0]} rotation={[-0.15, 0, 0]} />
      <Sph r={0.11} color="#ffffff" position={[0, 2.08, -0.05]} />
      {[-1, 1].map((s) => (
        <Sph key={s} r={0.06} color="#16161f" kind="dark" position={[s * 0.16, 1.58, 0.44]} scale={[1, 1.3, 0.6]} />
      ))}
      <P geo={smile} color="#16161f" kind="dark" position={[0, 1.4, 0.45]} rotation={[0, 0, Math.PI]} />
      {[-1, 1].map((s) => (
        <Sph key={`c${s}`} r={0.06} color="#f19a9a" position={[s * 0.28, 1.45, 0.38]} scale={[1, 0.7, 0.4]} />
      ))}
    </group>
  );
};

/** House on a cut-away block of ground, a tree, a fence, and the mascot. */
const MiniScene: React.FC<{ floating?: boolean }> = ({ floating }) => (
  <group>
    <RB size={[5.2, 0.35, 3.6]} color={PALETTE.grass} position={[0, -0.175, 0]} />
    <RB size={[5.2, 1.0, 3.6]} color={PALETTE.soil} position={[0, -0.85, 0]} />
    <RB size={[5.2, 0.8, 3.6]} color={PALETTE.rock} position={[0, -1.75, 0]} />
    {floating
      ? [
          [-1.4, -2.5, 0.4, 0.9],
          [0.6, -2.7, -0.3, 1.1],
          [1.8, -2.4, 0.6, 0.7],
          [-0.2, -3.2, 0.2, 0.7],
        ].map(([x, y, z, s], i) => <Sph key={i} r={s} color={PALETTE.rock} position={[x, y, z]} scale={[1.3, 0.8, 1]} />)
      : null}
    {/* house */}
    <RB size={[2.2, 1.6, 1.8]} color={PALETTE.house} position={[-0.7, 0.8, -0.3]} />
    <Roof color={PALETTE.roof} />
    <RB size={[0.32, 0.7, 0.32]} color={PALETTE.roof} position={[-0.05, 2.3, -0.55]} />
    <RB size={[0.5, 0.9, 0.08]} color={PALETTE.door} position={[-0.75, 0.45, 0.62]} />
    <Sph r={0.04} color="#e0b43c" kind="chrome" position={[-0.58, 0.45, 0.68]} />
    {[-1.4, -0.05].map((x) => (
      <group key={x}>
        <RB size={[0.52, 0.52, 0.06]} color={PALETTE.fence} position={[x, 1.05, 0.61]} />
        <RB size={[0.4, 0.4, 0.08]} color={PALETTE.window} kind="glass" position={[x, 1.05, 0.62]} />
      </group>
    ))}
    {/* path stones */}
    {[0, 1, 2].map((i) => (
      <Cyl key={i} r={0.18} h={0.06} color={PALETTE.stone} position={[-0.7 + i * 0.12, 0.03, 0.95 + i * 0.42]} />
    ))}
    {/* tree */}
    <Cyl r={0.13} h={1.2} color={PALETTE.trunk} position={[1.75, 0.6, -0.95]} />
    <Sph r={0.66} color={PALETTE.leaf} position={[1.75, 1.6, -0.95]} />
    <Sph r={0.48} color={PALETTE.leaf2} position={[1.4, 1.35, -0.7]} />
    <Sph r={0.44} color={PALETTE.leaf2} position={[2.1, 1.4, -0.7]} />
    {/* fence */}
    {[-2.35, -1.95, -1.55].map((x) => (
      <RB key={x} size={[0.12, 0.55, 0.12]} color={PALETTE.fence} position={[x, 0.28, 1.45]} />
    ))}
    <RB size={[1.0, 0.08, 0.06]} color={PALETTE.fence} position={[-1.95, 0.38, 1.47]} />
    <Mascot position={[1.0, 0, 0.85]} />
  </group>
);

/* ------------------------------------------------------------------ frame + overlays */

const Label: React.FC<{ n: number; name: string; sub: string; dark?: boolean }> = ({ n, name, sub, dark }) => (
  <div style={{ position: "absolute", top: 120, left: 0, right: 0, textAlign: "center", fontFamily: FONT }}>
    <div
      style={{
        display: "inline-block",
        background: dark ? "#ffffff" : "#16161f",
        color: dark ? "#16161f" : "#ffffff",
        borderRadius: 999,
        padding: "14px 40px",
        fontWeight: 900,
        fontSize: 58,
        letterSpacing: 2,
      }}
    >
      {n} · {name}
    </div>
    <div style={{ marginTop: 18, fontWeight: 700, fontSize: 34, color: dark ? "#ffffff" : "#16161f", opacity: 0.85 }}>{sub}</div>
  </div>
);

/** Our caption style, so you can judge how captions sit on each look. */
const SampleCaption: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: "74%",
      left: 0,
      right: 0,
      textAlign: "center",
      fontFamily: FONT,
      fontWeight: 900,
      fontSize: 100,
      color: "#ffffff",
      WebkitTextStroke: "18px #111",
      paintOrder: "stroke fill",
      textShadow: "0 10px 0 rgba(0,0,0,0.45)",
    }}
  >
    WOOD OR <span style={{ color: "#ffd23f" }}>BRICK?</span>
  </div>
);

const Shot: React.FC<{
  bg: string;
  style: Style;
  cam: { pos: V3; tgt: V3; fov: number };
  flat?: boolean;
  ortho?: number;
  overlay?: React.ReactNode;
  children: React.ReactNode;
  env?: boolean;
  clip?: boolean;
}> = ({ bg, style, cam, flat, ortho, overlay, children, env, clip }) => (
  <AbsoluteFill style={{ background: bg }}>
    <ThreeCanvas
      width={1080}
      height={1920}
      gl={{ antialias: true, alpha: true, localClippingEnabled: !!clip } as THREE.WebGLRendererParameters}
      shadows={style.shadows ? "soft" : false}
      flat={flat}
      orthographic={!!ortho}
      camera={ortho ? { zoom: ortho, position: cam.pos, near: 0.1, far: 200 } : undefined}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = !!clip;
      }}
    >
      <StyleCtx.Provider value={style}>
        {ortho ? <OrthoRig pos={cam.pos} tgt={cam.tgt} /> : <CameraRig position={cam.pos} target={cam.tgt} fov={cam.fov} />}
        {env ? <StudioEnv /> : null}
        {children}
      </StyleCtx.Provider>
    </ThreeCanvas>
    {overlay}
  </AbsoluteFill>
);

const OrthoRig: React.FC<{ pos: V3; tgt: V3 }> = ({ pos, tgt }) => {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    camera.position.set(...pos);
    camera.lookAt(...tgt);
    camera.updateProjectionMatrix();
  });
  return null;
};

const StudioEnv: React.FC = () => {
  const { gl, scene } = useThree();
  useLayoutEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      pm.dispose();
    };
  }, [gl, scene]);
  return null;
};

const Sun: React.FC<{ color?: string; intensity?: number; pos?: V3; shadow?: boolean }> = ({ color = "#fff1dc", intensity = 2.4, pos = [4, 8, 5], shadow = true }) => (
  <directionalLight
    color={color}
    intensity={intensity}
    position={pos}
    castShadow={shadow}
    shadow-mapSize-width={2048}
    shadow-mapSize-height={2048}
    shadow-camera-left={-6}
    shadow-camera-right={6}
    shadow-camera-top={6}
    shadow-camera-bottom={-6}
    shadow-bias={-0.0004}
  />
);

const CAM = { pos: [6.4, 5.2, 10.5] as V3, tgt: [0.1, 0.5, 0] as V3, fov: 46 };

/* ------------------------------------------------------------------ 1. claymation */

export const StyleClay: React.FC = () => {
  const tex = useMemo(() => makeTexture("clay"), []);
  const style = useMemo<Style>(
    () => ({
      mat: (c, k) =>
        new THREE.MeshStandardMaterial({ color: k === "glass" ? "#bfe6f5" : c, roughness: k === "chrome" ? 0.4 : 0.88, metalness: 0, bumpMap: tex, bumpScale: 3 }),
      outline: 0,
      shadows: true,
      round: 0.16,
    }),
    [tex],
  );
  return (
    <Shot
      bg="radial-gradient(circle at 50% 40%, #fff3e0 0%, #f2d7b6 70%)"
      style={style}
      cam={CAM}
      overlay={
        <>
          <Label n={1} name="CLAYMATION" sub="soft, handmade, cosy" />
          <SampleCaption />
        </>
      }
    >
      <hemisphereLight args={["#fff1dc", "#c9a27c", 1.4]} />
      <Sun color="#ffe2bd" intensity={2.6} />
      <MiniScene />
    </Shot>
  );
};

/* ------------------------------------------------------------------ 2. paper craft */

type PaperLayer = { shape: THREE.Shape; color: string; z: number };

const circle = (x: number, y: number, r: number) => {
  const s = new THREE.Shape();
  s.absarc(x, y, r, 0, Math.PI * 2, false);
  return s;
};
const rect = (x: number, y: number, w: number, h: number) => {
  const s = new THREE.Shape();
  s.moveTo(x, y);
  s.lineTo(x + w, y);
  s.lineTo(x + w, y + h);
  s.lineTo(x, y + h);
  s.closePath();
  return s;
};
const wavy = (x0: number, x1: number, top: number, amp: number, freq: number, bottom: number, phase = 0) => {
  const s = new THREE.Shape();
  s.moveTo(x0, bottom);
  for (let i = 0; i <= 40; i++) {
    const x = x0 + ((x1 - x0) * i) / 40;
    s.lineTo(x, top + Math.sin(x * freq + phase) * amp);
  }
  s.lineTo(x1, bottom);
  s.closePath();
  return s;
};
const tri = (x: number, y: number, w: number, h: number) => {
  const s = new THREE.Shape();
  s.moveTo(x - w / 2, y);
  s.lineTo(x + w / 2, y);
  s.lineTo(x, y + h);
  s.closePath();
  return s;
};

const PaperPiece: React.FC<{ layer: PaperLayer; tex: THREE.Texture }> = ({ layer, tex }) => {
  const geo = useMemo(() => new THREE.ExtrudeGeometry(layer.shape, { depth: 0.035, bevelEnabled: false }), [layer.shape]);
  const mats = useMemo(
    () => [
      new THREE.MeshStandardMaterial({ color: layer.color, roughness: 0.95, bumpMap: tex, bumpScale: 2.5 }),
      new THREE.MeshStandardMaterial({ color: "#fbf7ef", roughness: 1 }),
    ],
    [layer.color, tex],
  );
  return <mesh geometry={geo} material={mats} position={[0, 0, layer.z]} castShadow receiveShadow />;
};

export const StylePaper: React.FC = () => {
  const tex = useMemo(() => {
    const t = makeTexture("paper");
    t.repeat.set(0.4, 0.4);
    return t;
  }, []);
  const layers = useMemo<PaperLayer[]>(() => {
    const L: PaperLayer[] = [];
    const add = (shape: THREE.Shape, color: string, z: number) => L.push({ shape, color, z });
    add(rect(-6, -6, 12, 14), "#a9d8e8", -1.6);
    add(circle(1.7, 4.0, 0.75), "#ffd166", -1.5);
    [
      [-1.8, 3.4, 0.45],
      [-1.3, 3.55, 0.6],
      [-0.75, 3.4, 0.45],
    ].forEach(([x, y, r]) => add(circle(x, y, r), "#ffffff", -1.45));
    add(wavy(-6, 6, 1.0, 0.35, 0.9, -6, 0.5), "#8fd19e", -1.3);
    add(wavy(-6, 6, 0.45, 0.25, 1.4, -6, 2.0), "#5cae6e", -1.1);
    // the cut-away ground, front view
    add(wavy(-2.7, 2.7, 0.0, 0.06, 4, -0.35), "#4f9a5c", -0.75);
    add(wavy(-2.7, 2.7, -0.3, 0.08, 3, -1.45, 1), "#9a6b47", -0.8);
    add(wavy(-2.7, 2.7, -1.4, 0.1, 2.5, -2.5, 2), "#7b7f8c", -0.85);
    [
      [-1.6, -0.8, 0.12],
      [0.9, -1.1, 0.09],
      [1.9, -0.6, 0.11],
      [-0.4, -1.9, 0.18],
      [1.4, -2.1, 0.14],
    ].forEach(([x, y, r]) => add(circle(x, y, r), "#c49a6c", -0.74));
    // house
    add(rect(-1.85, 0, 2.3, 1.7), "#f2d39b", -0.6);
    add(rect(-0.55, 1.9, 0.32, 0.75), "#d1495b", -0.62);
    add(tri(-0.7, 1.6, 2.9, 1.15), "#d1495b", -0.55);
    add(rect(-1.0, 0, 0.55, 0.95), "#3d405b", -0.5);
    add(rect(-1.65, 0.9, 0.5, 0.5), "#fbf7ef", -0.52);
    add(rect(-1.6, 0.95, 0.4, 0.4), "#a8dcf5", -0.5);
    add(rect(-0.25, 0.9, 0.5, 0.5), "#fbf7ef", -0.52);
    add(rect(-0.2, 0.95, 0.4, 0.4), "#a8dcf5", -0.5);
    // tree
    add(rect(1.9, 0, 0.22, 1.2), "#8d6346", -0.65);
    add(circle(2.0, 1.55, 0.7), "#3f8a4c", -0.62);
    add(circle(1.65, 1.25, 0.45), "#5cae6e", -0.58);
    add(circle(2.35, 1.3, 0.42), "#5cae6e", -0.58);
    // mascot
    add(rect(0.72, 0.0, 0.14, 0.5), "#2b2f4a", -0.4);
    add(rect(0.96, 0.0, 0.14, 0.5), "#2b2f4a", -0.4);
    const body = new THREE.Shape();
    body.absarc(0.91, 0.75, 0.33, 0, Math.PI * 2, false);
    L.push({ shape: body, color: "#e2483d", z: -0.36 });
    add(circle(0.91, 1.42, 0.46), "#f6d7b8", -0.32);
    const hat = new THREE.Shape();
    hat.absarc(0.91, 1.5, 0.49, 0.1, Math.PI - 0.1, false);
    hat.closePath();
    add(hat, "#2f6fd6", -0.28);
    add(circle(0.91, 2.0, 0.11), "#ffffff", -0.27);
    add(circle(0.76, 1.42, 0.06), "#16161f", -0.26);
    add(circle(1.06, 1.42, 0.06), "#16161f", -0.26);
    const smile = new THREE.Shape();
    smile.absarc(0.91, 1.3, 0.12, Math.PI + 0.3, Math.PI * 2 - 0.3, false);
    smile.absarc(0.91, 1.3, 0.08, Math.PI * 2 - 0.3, Math.PI + 0.3, true);
    add(smile, "#16161f", -0.26);
    const arm = rect(1.18, 0.75, 0.13, 0.55);
    add(arm, "#e2483d", -0.37);
    add(circle(1.245, 1.33, 0.1), "#2f6fd6", -0.36);
    return L;
  }, []);
  const style = useMemo<Style>(() => ({ mat: (c) => new THREE.MeshStandardMaterial({ color: c }), outline: 0, shadows: true, round: 0.02 }), []);
  return (
    <Shot
      bg="#e9dcc3"
      style={style}
      cam={{ pos: [0.2, 0.6, 17.5], tgt: [0.2, 0.6, 0], fov: 34 }}
      overlay={
        <>
          <Label n={2} name="PAPER CRAFT" sub="layered paper cut-outs, real shadows" />
          <SampleCaption />
        </>
      }
    >
      <ambientLight intensity={1.1} />
      <directionalLight
        intensity={2.2}
        position={[-3, 5, 9]}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-bias={-0.0006}
      />
      {layers.map((l, i) => (
        <PaperPiece key={i} layer={l} tex={tex} />
      ))}
    </Shot>
  );
};

/* ------------------------------------------------------------------ 3. isometric + doodles */

const Doodles: React.FC = () => {
  // positions are in the 1080×1920 frame
  const ink = "#1d1d2b";
  const hand: React.CSSProperties = { position: "absolute", fontFamily: "'Caveat', cursive", fontWeight: 700, color: ink, fontSize: 64, lineHeight: 1 };
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g fill="none" stroke={ink} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round">
          {/* arrow to the roof */}
          <path d="M 200 610 C 250 640, 320 640, 380 610" />
          <path d="M 350 592 L 382 610 L 350 632" />
          {/* arrow to the soil */}
          <path d="M 160 1250 C 190 1200, 220 1170, 250 1140" />
          <path d="M 222 1142 L 252 1138 L 250 1170" />
          {/* scribble around the mascot */}
          <path d="M 520 700 C 610 670, 690 720, 690 820 C 690 930, 600 990, 530 960 C 450 925, 440 820, 470 760 C 485 730, 505 712, 530 702" />
          {/* little stars */}
          <path d="M 905 700 l 0 40 M 885 720 l 40 0" />
          <path d="M 120 1180 l 0 30 M 105 1195 l 30 0" />
        </g>
      </svg>
      <div style={{ ...hand, left: 70, top: 560, transform: "rotate(-6deg)" }}>red roof!</div>
      <div style={{ ...hand, left: 60, top: 1260, transform: "rotate(-4deg)" }}>real dirt</div>
      <div style={{ ...hand, left: 700, top: 660, transform: "rotate(8deg)", fontSize: 58 }}>me :)</div>
    </>
  );
};

export const StyleIso: React.FC = () => {
  const style = useMemo<Style>(
    () => ({
      mat: (c, k) => new THREE.MeshToonMaterial({ color: k === "glass" ? "#bfe6f5" : c, gradientMap: toonGradient() }),
      outline: 0.025,
      shadows: false,
      round: 0.05,
    }),
    [],
  );
  return (
    <Shot
      bg="radial-gradient(circle at 50% 45%, #fffaf0 0%, #f6ecd9 75%), #f6ecd9"
      style={style}
      cam={{ pos: [10, 8.6, 10], tgt: [0, 0.0, 0], fov: 40 }}
      ortho={150}
      flat
      overlay={
        <>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(#e2d6bf 2px, transparent 2px)", backgroundSize: "36px 36px", opacity: 0.6, mixBlendMode: "multiply" }} />
          <Doodles />
          <Label n={3} name="ISO DIORAMA + DOODLES" sub="floating mini world, hand-drawn notes" />
          <SampleCaption />
        </>
      }
    >
      <ambientLight intensity={1.0} />
      <directionalLight intensity={2.0} position={[4, 9, 3]} />
      <MiniScene floating />
    </Shot>
  );
};

/* ------------------------------------------------------------------ 4. blueprint → real */

const WireCopy: React.FC = () => {
  const { scene } = useThree();
  const lines = useMemo(() => new THREE.Group(), []);
  useLayoutEffect(() => {
    const host = scene.getObjectByName("solid");
    if (!host) return;
    lines.clear();
    host.updateMatrixWorld(true);
    host.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || m.material instanceof THREE.ShaderMaterial) return;
      const eg = new THREE.EdgesGeometry(m.geometry, 12);
      const ls = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: "#e8f2ff", transparent: true, opacity: 0.95 }));
      ls.applyMatrix4(m.matrixWorld);
      lines.add(ls);
    });
  });
  return <primitive object={lines} />;
};

export const StyleBlueprint: React.FC = () => {
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(1, 0, 0.35).normalize(), 0.4), []);
  const style = useMemo<Style>(
    () => ({
      mat: (c, k) => new THREE.MeshToonMaterial({ color: k === "glass" ? "#bfe6f5" : c, gradientMap: toonGradient(), clippingPlanes: [plane] }),
      outline: 0,
      shadows: false,
      round: 0.002,
    }),
    [plane],
  );
  const grid =
    "repeating-linear-gradient(0deg, rgba(255,255,255,0.12) 0 2px, transparent 2px 60px), repeating-linear-gradient(90deg, rgba(255,255,255,0.12) 0 2px, transparent 2px 60px), repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 12px), repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 12px), #1d4e89";
  return (
    <Shot
      bg={grid}
      style={style}
      cam={CAM}
      flat
      clip
      overlay={
        <>
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            <g stroke="#e8f2ff" strokeWidth={3} fill="none">
              <path d="M 150 1260 L 930 1260" strokeDasharray="14 10" />
              <path d="M 150 1240 L 150 1280 M 930 1240 L 930 1280" />
            </g>
            <text x={540} y={1240} fill="#e8f2ff" fontSize={40} textAnchor="middle" fontFamily="monospace">6.2 m</text>
          </svg>
          <div style={{ position: "absolute", right: 60, bottom: 230, border: "3px solid #e8f2ff", padding: "14px 22px", color: "#e8f2ff", fontFamily: "monospace", fontSize: 26, lineHeight: 1.5 }}>
            PROJECT: TINY HOUSE
            <br />
            SCALE 1:50 · SHEET 01
          </div>
          <Label n={4} name="BLUEPRINT → REAL" sub="lines turn into the real thing" dark />
          <SampleCaption />
        </>
      }
    >
      <ambientLight intensity={1.0} />
      <directionalLight intensity={2.0} position={[4, 9, 5]} />
      <group name="solid">
        <MiniScene />
      </group>
      <WireCopy />
    </Shot>
  );
};

/* ------------------------------------------------------------------ 5. glossy toy */

export const StyleToy: React.FC = () => {
  const style = useMemo<Style>(
    () => ({
      mat: (c, k) =>
        k === "chrome"
          ? new THREE.MeshPhysicalMaterial({ color: "#ffffff", metalness: 1, roughness: 0.08 })
          : k === "glass"
            ? new THREE.MeshPhysicalMaterial({ color: "#bfe6f5", metalness: 0, roughness: 0.05, clearcoat: 1, transmission: 0.2 })
            : new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.08 }),
      outline: 0,
      shadows: true,
      round: 0.12,
    }),
    [],
  );
  return (
    <Shot
      bg="linear-gradient(180deg, #eef2f9 0%, #c9d3e6 100%)"
      style={style}
      cam={CAM}
      env
      overlay={
        <>
          <Label n={5} name="GLOSSY TOY" sub="shiny plastic + chrome, studio light" />
          <SampleCaption />
        </>
      }
    >
      <ambientLight intensity={0.25} />
      <Sun color="#ffffff" intensity={2.0} pos={[3, 9, 6]} />
      <MiniScene />
      <Sph r={0.45} color="#ffffff" kind="chrome" position={[2.0, 0.45, 1.1]} />
    </Shot>
  );
};

/* ------------------------------------------------------------------ 6. comic / halftone */

export const StyleComic: React.FC = () => {
  const style = useMemo<Style>(
    () => ({
      mat: (c, k) => (k === "dark" ? new THREE.MeshBasicMaterial({ color: "#16161f" }) : comicMaterial(k === "glass" ? "#9fd8f0" : c)),
      outline: 0.045,
      shadows: false,
      round: 0.04,
    }),
    [],
  );
  return (
    <Shot
      bg="radial-gradient(#f2c9a0 2.5px, transparent 2.5px) 0 0 / 22px 22px, #fff1d6"
      style={style}
      cam={CAM}
      flat
      overlay={
        <>
          <div style={{ position: "absolute", inset: 28, border: "10px solid #16161f", borderRadius: 6 }} />
          <div
            style={{
              position: "absolute",
              left: 70,
              top: 330,
              background: "#ffd23f",
              border: "6px solid #16161f",
              padding: "12px 24px",
              fontFamily: "'Permanent Marker', cursive",
              fontSize: 44,
              color: "#16161f",
              transform: "rotate(-2deg)",
            }}
          >
            MEANWHILE, IN THE SUBURBS…
          </div>
          <div style={{ position: "absolute", right: 70, top: 560 }}>
            <div
              style={{
                background: "#ffffff",
                border: "6px solid #16161f",
                borderRadius: 60,
                padding: "22px 34px",
                fontFamily: "'Permanent Marker', cursive",
                fontSize: 50,
                color: "#16161f",
              }}
            >
              HOME SWEET HOME!
            </div>
            <svg width={120} height={110} style={{ position: "absolute", left: 120, top: 92 }}>
              <path d="M 10 0 L 70 0 L 30 100 Z" fill="#ffffff" stroke="#16161f" strokeWidth={6} strokeLinejoin="round" />
              <path d="M 14 -4 L 66 -4" stroke="#ffffff" strokeWidth={12} />
            </svg>
          </div>
          <Label n={6} name="COMIC / HALFTONE" sub="ink lines + print dots, movie-poster feel" />
          <SampleCaption />
        </>
      }
    >
      <MiniScene />
    </Shot>
  );
};

export const STYLE_COMPS = [
  { id: "StyleClay", C: StyleClay },
  { id: "StylePaper", C: StylePaper },
  { id: "StyleIso", C: StyleIso },
  { id: "StyleBlueprint", C: StyleBlueprint },
  { id: "StyleToy", C: StyleToy },
  { id: "StyleComic", C: StyleComic },
];
