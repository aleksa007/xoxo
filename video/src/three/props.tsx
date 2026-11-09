import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useCurrentFrame } from "remotion";
import { Ball, Block, Cone, Cyl, Toon, rand } from "./cel";

type V3 = [number, number, number];

/* ---------------------------------------------------------------- camera */

export const CameraRig: React.FC<{ position: V3; target: V3; fov?: number; roll?: number }> = ({
  position,
  target,
  fov = 40,
  roll = 0,
}) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...position);
    camera.up.set(Math.sin(roll), Math.cos(roll), 0);
    camera.lookAt(...target);
    if (camera.fov !== fov) {
      camera.fov = fov;
    }
    camera.near = 0.1;
    camera.far = 400;
    camera.updateProjectionMatrix();
  });
  return null;
};

/** Ease helpers for camera moves. */
export const lerp3 = (a: V3, b: V3, t: number): V3 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/* ---------------------------------------------------------------- ground */

export const SnowGround: React.FC<{ color?: string; size?: number; y?: number }> = ({
  color = "#eef3fb",
  size = 400,
  y = 0,
}) => {
  const g = useMemo(() => new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2), [size]);
  return <Toon geometry={g} color={color} outline={0} position={[0, y, 0]} />;
};

/** Low, lumpy snow drifts to break up the flat ground. */
export const Drifts: React.FC<{ count?: number; spread?: number; seed?: number; z?: number }> = ({
  count = 10,
  spread = 30,
  seed = 1,
  z = 0,
}) => (
  <group>
    {Array.from({ length: count }).map((_, i) => {
      const x = (rand(seed + i) - 0.5) * spread;
      const zz = z - rand(seed + i * 3.1) * spread * 0.6;
      const r = 0.8 + rand(seed + i * 7.7) * 1.6;
      return <Ball key={i} r={r} seg={18} position={[x, -r * 0.72, zz]} scale={[1.6, 1, 1]} color="#f6f9ff" outline={0.05} />;
    })}
  </group>
);

/* ---------------------------------------------------------------- houses */

const useGable = (w: number, h: number, d: number) =>
  useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0);
    s.lineTo(w / 2, 0);
    s.lineTo(0, h);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
    g.translate(0, 0, -d / 2);
    return g;
  }, [w, h, d]);

export const House: React.FC<{
  position?: V3;
  rotationY?: number;
  color: string;
  w?: number;
  h?: number;
  d?: number;
  lit?: boolean;
}> = ({ position = [0, 0, 0], rotationY = 0, color, w = 3, h = 2, d = 2.4, lit = true }) => {
  const stilt = 0.45;
  const roof = useGable(w + 0.5, h * 0.55, d + 0.5);
  const snow = useGable(w + 0.62, h * 0.55 + 0.12, d + 0.62);
  const win = lit ? "#ffd86b" : "#bfe3ff";
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* stilts: houses here stand on piles because the ground is frozen */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <Cyl key={`${sx}${sz}`} rt={0.08} rb={0.08} h={stilt} seg={8} position={[sx * (w / 2 - 0.25), stilt / 2, sz * (d / 2 - 0.25)]} color="#4a3a33" outline={0.03} />
        )),
      )}
      <Block size={[w, h, d]} position={[0, stilt + h / 2, 0]} color={color} outline={0.05} />
      {/* wood siding lines */}
      {[0.3, 0.55, 0.8].map((t) => (
        <Block key={t} size={[w * 0.999, 0.03, 0.01]} position={[0, stilt + h * t, d / 2 + 0.006]} color="#000000" opacity={0.18} outline={0} unlit />
      ))}
      <Toon geometry={roof} color="#2b2a3a" outline={0.05} outlineMode="scale" position={[0, stilt + h, 0]} />
      <Toon geometry={snow} color="#f7faff" outline={0.05} outlineMode="scale" position={[0, stilt + h + 0.1, 0]} />
      {/* windows */}
      {[-w * 0.27, w * 0.27].map((x) => (
        <group key={x} position={[x, stilt + h * 0.58, d / 2 + 0.02]}>
          <Block size={[0.62, 0.62, 0.04]} color="#f4f1ea" outline={0.03} />
          <Block size={[0.48, 0.48, 0.05]} position={[0, 0, 0.01]} color={win} unlit outline={0} />
          <Block size={[0.04, 0.48, 0.06]} position={[0, 0, 0.02]} color="#f4f1ea" outline={0} />
          <Block size={[0.48, 0.04, 0.06]} position={[0, 0, 0.02]} color="#f4f1ea" outline={0} />
        </group>
      ))}
      {/* stairs to the door on the side */}
      <Block size={[0.7, 0.12, 0.6]} position={[w / 2 + 0.35, stilt - 0.06, d * 0.15]} color="#5a463c" outline={0.03} />
      <Block size={[0.05, h * 0.62, 0.7]} position={[w / 2 + 0.03, stilt + h * 0.31, d * 0.15]} color="#f4f1ea" outline={0.03} />
    </group>
  );
};

/* ------------------------------------------------------------- mountains */

export const Mountain: React.FC<{ position: V3; r: number; h: number; seed?: number; color?: string; top?: number }> = ({
  position,
  r,
  h,
  seed = 1,
  color = "#e9eef8",
  top = 0.35,
}) => (
  <group position={position} rotation={[0, rand(seed) * Math.PI, 0]}>
    {/* flat-topped plateau mountain with exposed rock bands */}
    <Cyl rt={r * top} rb={r} h={h} seg={8} position={[0, h / 2, 0]} color="#7d86a3" outline={0.18} />
    <Cyl rt={r * top * 1.02} rb={r * (top + (1 - top) * 0.45)} h={h * 0.55} seg={8} position={[0, h - h * 0.275 + 0.02, 0]} color={color} outline={0.18} />
    <Cyl rt={r * 0.72} rb={r * 1.01} h={h * 0.28} seg={8} position={[0, h * 0.14, 0]} color={color} outline={0.18} />
  </group>
);

export const MountainRange: React.FC<{ z?: number; seed?: number; count?: number; spread?: number; scale?: number }> = ({
  z = -60,
  seed = 3,
  count = 7,
  spread = 140,
  scale = 1,
}) => (
  <group>
    {Array.from({ length: count }).map((_, i) => {
      const x = (i / (count - 1) - 0.5) * spread + (rand(seed + i) - 0.5) * 10;
      const r = (14 + rand(seed + i * 2.3) * 9) * scale;
      const h = (5 + rand(seed + i * 5.1) * 6) * scale;
      return <Mountain key={i} position={[x, -0.5, z - rand(seed + i * 9.2) * 20]} r={r} h={h} seed={seed + i} />;
    })}
  </group>
);

/* ------------------------------------------------------------- cemetery */

export const Cross: React.FC<{ position: V3; rotationY?: number; tilt?: number }> = ({ position, rotationY = 0, tilt = 0 }) => (
  <group position={position} rotation={[tilt, rotationY, tilt * 0.6]}>
    <Block size={[0.16, 1.5, 0.12]} position={[0, 0.75, 0]} color="#fbfbf7" outline={0.035} />
    <Block size={[0.8, 0.14, 0.12]} position={[0, 1.08, 0]} color="#fbfbf7" outline={0.035} />
    <Ball r={0.42} seg={16} position={[0, -0.1, 0]} scale={[1.4, 0.5, 1.2]} color="#f6f9ff" outline={0.035} />
  </group>
);

export const Fence: React.FC<{ from: number; to: number; z: number; y?: number }> = ({ from, to, z, y = 0 }) => {
  const posts = Math.round((to - from) / 1.2);
  return (
    <group position={[0, y, z]}>
      {Array.from({ length: posts + 1 }).map((_, i) => (
        <Block key={i} size={[0.14, 1.1, 0.14]} position={[from + i * 1.2, 0.55, 0]} color="#6b4e3d" outline={0.035} />
      ))}
      <Block size={[to - from, 0.1, 0.06]} position={[(from + to) / 2, 0.85, 0.06]} color="#7c5b47" outline={0.03} />
      <Block size={[to - from, 0.1, 0.06]} position={[(from + to) / 2, 0.45, 0.06]} color="#7c5b47" outline={0.03} />
    </group>
  );
};

/* ------------------------------------------------------- coffin & virus */

export const Coffin: React.FC<{ position?: V3; rotation?: V3; scale?: number }> = ({ position, rotation, scale = 1 }) => {
  const g = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.32, -1.1);
    s.lineTo(0.32, -1.1);
    s.lineTo(0.52, 0.45);
    s.lineTo(0.36, 1.1);
    s.lineTo(-0.36, 1.1);
    s.lineTo(-0.52, 0.45);
    s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.5, bevelEnabled: false });
    geo.translate(0, 0, -0.25);
    return geo;
  }, []);
  const lid = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.07, -0.55);
    s.lineTo(0.07, -0.55);
    s.lineTo(0.07, 0.25);
    s.lineTo(0.3, 0.25);
    s.lineTo(0.3, 0.4);
    s.lineTo(0.07, 0.4);
    s.lineTo(0.07, 0.75);
    s.lineTo(-0.07, 0.75);
    s.lineTo(-0.07, 0.4);
    s.lineTo(-0.3, 0.4);
    s.lineTo(-0.3, 0.25);
    s.lineTo(-0.07, 0.25);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: false });
  }, []);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Toon geometry={g} color="#7a4a2e" outline={0.04} outlineMode="scale" />
      <Toon geometry={lid} color="#d9b36a" outline={0.015} outlineMode="scale" position={[0, 0, 0.25]} />
    </group>
  );
};

/** Points spread evenly on a sphere. */
const fib = (n: number) =>
  Array.from({ length: n }).map((_, i) => {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const t = i * Math.PI * (3 - Math.sqrt(5));
    return new THREE.Vector3(Math.cos(t) * r, y, Math.sin(t) * r);
  });

export const Virus: React.FC<{ position: V3; r?: number; color?: string; spin?: number }> = ({
  position,
  r = 0.5,
  color = "#ef5b6b",
  spin = 0,
}) => {
  const spikes = useMemo(() => fib(18), []);
  return (
    <group position={position} rotation={[spin * 0.7, spin, 0]}>
      <Ball r={r} color={color} outline={r * 0.08} />
      {spikes.map((v, i) => {
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
        const e = new THREE.Euler().setFromQuaternion(q);
        return (
          <group key={i} position={[v.x * r, v.y * r, v.z * r]} rotation={[e.x, e.y, e.z]}>
            <Cyl rt={r * 0.06} rb={r * 0.06} h={r * 0.45} seg={6} position={[0, r * 0.22, 0]} color="#c23a52" outline={r * 0.04} />
            <Ball r={r * 0.14} seg={10} position={[0, r * 0.48, 0]} color="#ffcf5a" outline={r * 0.04} />
          </group>
        );
      })}
    </group>
  );
};

/* ---------------------------------------------------------------- plane */

export const Plane: React.FC<{ position: V3; rotation?: V3; scale?: number }> = ({ position, rotation, scale = 1 }) => {
  const frame = useCurrentFrame();
  const prop = frame * 1.3;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* fuselage along +x */}
      <group rotation={[0, 0, Math.PI / 2]}>
        <Cyl rt={0.55} rb={0.55} h={4.2} seg={20} color="#f7f8fb" outline={0.06} />
        <Cone r={0.55} h={1.2} seg={20} position={[0, 2.7, 0]} color="#f7f8fb" outline={0.06} />
        <Cone r={0.55} h={1.6} seg={20} position={[0, -2.9, 0]} rotation={[Math.PI, 0, 0]} color="#f7f8fb" outline={0.06} />
      </group>
      {/* stripe + windows */}
      <Block size={[5.8, 0.16, 1.13]} position={[-0.1, -0.12, 0]} color="#e2483d" outline={0} />
      {[-1.4, -0.7, 0, 0.7, 1.4].map((x) => (
        <Ball key={x} r={0.14} seg={12} position={[x, 0.18, 0.5]} scale={[1, 1, 0.4]} color="#2b3a66" outline={0.02} unlit />
      ))}
      <Block size={[0.5, 0.36, 0.9]} position={[2.65, 0.25, 0]} color="#2b3a66" outline={0.03} unlit />
      {/* wings */}
      <Block size={[1.3, 0.12, 9]} position={[0.3, 0.4, 0]} color="#f7f8fb" outline={0.05} />
      {[-2.2, 2.2].map((z) => (
        <group key={z} position={[0.95, 0.25, z]}>
          <Cyl rt={0.28} rb={0.28} h={1.1} seg={14} rotation={[0, 0, Math.PI / 2]} color="#e2483d" outline={0.04} />
          <group position={[0.6, 0, 0]} rotation={[prop, 0, 0]}>
            <Block size={[0.06, 1.8, 0.16]} color="#2b2a3a" outline={0.015} />
          </group>
        </group>
      ))}
      {/* tail */}
      <Block size={[1.0, 1.4, 0.12]} position={[-3.0, 0.85, 0]} rotation={[0, 0, -0.35]} color="#e2483d" outline={0.05} />
      <Block size={[0.8, 0.1, 2.6]} position={[-3.0, 0.15, 0]} color="#f7f8fb" outline={0.05} />
    </group>
  );
};

/* ---------------------------------------------------------------- globe */

export const Globe: React.FC<{ rotationY: number }> = ({ rotationY }) => {
  const cap = useMemo(() => new THREE.SphereGeometry(3.04, 40, 20, 0, Math.PI * 2, 0, 0.42), []);
  const rings = useMemo(
    () =>
      [-0.9, -0.45, 0, 0.45, 0.9].map((lat) => ({
        g: new THREE.TorusGeometry(3.02 * Math.cos(lat), 0.025, 6, 80),
        y: 3.02 * Math.sin(lat),
      })),
    [],
  );
  const meridian = useMemo(() => new THREE.TorusGeometry(3.02, 0.025, 6, 80), []);
  return (
    <group rotation={[0.25, rotationY, 0]}>
      <Ball r={3} seg={48} color="#3f8fe6" outline={0.07} />
      <Toon geometry={cap} color="#f4f8ff" outline={0.05} />
      {rings.map((r, i) => (
        <mesh key={i} geometry={r.g} position={[0, r.y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color="#9cc8ff" transparent opacity={0.55} />
        </mesh>
      ))}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={`m${i}`} geometry={meridian} rotation={[0, (i * Math.PI) / 4, 0]}>
          <meshBasicMaterial color="#9cc8ff" transparent opacity={0.55} />
        </mesh>
      ))}
      {/* stylised land masses */}
      {[
        [0.5, 0.3, 0.9],
        [1.2, -0.2, 1.1],
        [2.3, 0.5, 0.8],
        [3.4, -0.1, 1.2],
        [4.6, 0.25, 0.9],
        [5.5, -0.5, 0.7],
      ].map(([lon, lat, s], i) => (
        <group key={`l${i}`} rotation={[0, lon, lat]}>
          <Ball r={0.9 * s} seg={16} position={[3 - 0.62 * s, 0, 0]} scale={[0.75, 1, 1.25]} color="#5cc06a" outline={0.04} />
        </group>
      ))}
    </group>
  );
};

export const Pin: React.FC<{ position: V3; scale?: number }> = ({ position, scale = 1 }) => (
  <group position={position} scale={scale}>
    <Cone r={0.26} h={0.7} seg={16} position={[0, 0.35, 0]} rotation={[Math.PI, 0, 0]} color="#e2483d" outline={0.04} />
    <Ball r={0.36} seg={20} position={[0, 0.85, 0]} color="#e2483d" outline={0.04} />
    <Ball r={0.14} seg={12} position={[0, 0.88, 0.26]} color="#ffffff" outline={0} unlit />
  </group>
);

/* ------------------------------------------------------ ice & permafrost */

export const IceShard: React.FC<{ position: V3; s?: number; rot?: number }> = ({ position, s = 0.4, rot = 0 }) => {
  const g = useMemo(() => new THREE.OctahedronGeometry(s, 0), [s]);
  return <Toon geometry={g} color="#bfeaff" outline={0.025} outlineMode="scale" position={position} rotation={[rot, rot * 1.7, rot * 0.4]} scale={[0.6, 1.3, 0.6]} />;
};

export const Rock: React.FC<{ position: V3; s?: number; seed?: number; color?: string }> = ({
  position,
  s = 0.5,
  seed = 1,
  color = "#6b5a52",
}) => {
  const g = useMemo(() => new THREE.DodecahedronGeometry(s, 0), [s]);
  return (
    <Toon
      geometry={g}
      color={color}
      outline={0.03}
      outlineMode="scale"
      position={position}
      rotation={[rand(seed) * 3, rand(seed + 1) * 3, 0]}
      scale={[1.3, 0.8, 1]}
    />
  );
};
