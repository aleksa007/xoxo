import React, { useMemo } from "react";
import * as THREE from "three";
import { useCurrentFrame } from "remotion";
import { Ball, BlobShadow, Block, Capsule, Cyl, Toon } from "./cel";

/**
 * Original big-head "explainer" character, dressed for the Arctic:
 * parka, beanie with pom-pom, mittens. Built from toon primitives so it sits
 * naturally inside the 3D sets.
 */

export type Mouth = "o" | "smile" | "frown" | "flat" | "talk";
export type Brows = "neutral" | "worried" | "angry" | "raised";

export type CharacterProps = {
  position?: [number, number, number];
  rotationY?: number;
  scale?: number;
  skin?: string;
  coat?: string;
  hat?: string;
  pants?: string;
  mouth?: Mouth;
  brows?: Brows;
  wideEyes?: boolean;
  wave?: boolean;
  shiver?: boolean;
  /** Head turn in radians (left/right). */
  look?: number;
  /** Offset so several characters do not blink/bob in sync. */
  seed?: number;
  /** Hide the beanie and show hair instead. */
  hair?: string;
  goggles?: boolean;
  /** Headwear. Defaults to the Arctic beanie (or hair when `hair` is set). */
  hatStyle?: "beanie" | "brim" | "none";
  collar?: boolean;
  cheeks?: boolean;
  /** Arm rotations [x, z] at the shoulder; overrides the default pose. */
  armL?: [number, number];
  armR?: [number, number];
};

const HEAD_Y = 1.52;
const HEAD_R = 0.5;

/** Position on the head sphere for a face feature at (x, y) offset from centre. */
const onFace = (x: number, y: number, lift = 0.0): [number, number, number] => {
  const z = Math.sqrt(Math.max(HEAD_R * HEAD_R - x * x - y * y, 0)) + lift;
  return [x, HEAD_Y + y, z];
};

const Arc: React.FC<{ up: boolean; position: [number, number, number]; w?: number }> = ({ up, position, w = 0.1 }) => {
  const g = useMemo(() => new THREE.TorusGeometry(w, 0.022, 8, 20, Math.PI), [w]);
  return (
    <Toon
      geometry={g}
      color="#16161f"
      unlit
      outline={0}
      position={position}
      rotation={[0, 0, up ? Math.PI : 0]}
    />
  );
};

const Beanie: React.FC<{ color: string }> = ({ color }) => {
  const cap = useMemo(() => new THREE.SphereGeometry(HEAD_R * 1.04, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.35), []);
  return (
    <group position={[0, HEAD_Y, 0]} rotation={[-0.12, 0, 0]}>
      <Toon geometry={cap} color={color} outline={0.03} />
      <Cyl rt={HEAD_R * 0.93} rb={HEAD_R * 0.97} h={0.13} position={[0, 0.3, 0]} color="#f4f1ea" outline={0.025} />
      <Ball r={0.12} position={[0, HEAD_R * 1.06, 0]} color="#f4f1ea" outline={0.025} />
    </group>
  );
};

/** 17th-century wide-brimmed hat. */
const BrimHat: React.FC<{ color: string }> = ({ color }) => (
  <group position={[0, HEAD_Y + 0.33, 0]} rotation={[-0.08, 0, 0.05]}>
    <Cyl rt={0.66} rb={0.66} h={0.05} color={color} outline={0.025} />
    <Cyl rt={0.3} rb={0.36} h={0.4} position={[0, 0.22, 0]} color={color} outline={0.025} />
    <Cyl rt={0.365} rb={0.365} h={0.07} position={[0, 0.06, 0]} color="#c9a227" outline={0.012} />
  </group>
);

const Hair: React.FC<{ color: string }> = ({ color }) => {
  const cap = useMemo(() => new THREE.SphereGeometry(HEAD_R * 1.03, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.36), []);
  return (
    <group position={[0, HEAD_Y, 0]} rotation={[-0.3, 0, 0]}>
      <Toon geometry={cap} color={color} outline={0.03} />
    </group>
  );
};

export const Character: React.FC<CharacterProps> = ({
  position = [0, 0, 0],
  rotationY = 0,
  scale = 1,
  skin = "#f6d7b8",
  coat = "#e2483d",
  hat = "#2f6fd6",
  pants = "#2b2f4a",
  mouth = "flat",
  brows = "neutral",
  wideEyes = false,
  wave = false,
  shiver = false,
  look = 0,
  seed = 0,
  hair,
  goggles = false,
  hatStyle,
  collar = false,
  cheeks = true,
  armL,
  armR,
}) => {
  const frame = useCurrentFrame() + seed * 17;
  const bob = Math.sin(frame / 9) * 0.015;
  const shake = shiver ? Math.sin(frame * 2.3) * 0.012 : 0;
  const blinkPhase = (frame + seed * 31) % 84;
  const eyeY = blinkPhase < 3 ? 0.12 : 1;
  const rightArm = wave ? 2.55 + Math.sin(frame / 3.2) * 0.4 : 0.22;
  const talkOpen = mouth === "talk" ? (Math.sin(frame / 2.2) > 0 ? 1 : 0.35) : 1;

  const handColor = hatStyle === "brim" || hatStyle === "none" ? skin : hat;
  const browRot = { neutral: 0, worried: 0.32, angry: -0.38, raised: 0.12 }[brows];
  const browLift = brows === "raised" ? 0.05 : 0;

  return (
    <group position={[position[0] + shake, position[1], position[2]]} rotation={[0, rotationY, 0]} scale={scale}>
      <BlobShadow r={0.42} position={[0, 0.01, 0]} />

      {/* legs + boots */}
      {[-1, 1].map((s) => (
        <group key={`leg${s}`}>
          <Capsule r={0.065} len={0.42} position={[s * 0.12, 0.3, 0]} color={pants} outline={0.025} />
          <Ball r={0.1} position={[s * 0.13, 0.07, 0.04]} scale={[1, 0.65, 1.35]} color="#3b2b25" outline={0.025} />
        </group>
      ))}

      {/* parka body */}
      <group position={[0, 0.8 + bob, 0]}>
        <Capsule r={0.27} len={0.3} scale={[1, 1, 0.82]} color={coat} outline={0.03} soft={0.3} />
        <Block size={[0.035, 0.42, 0.02]} position={[0, -0.02, 0.225]} color="#16161f" outline={0} unlit />
        <Ball r={0.035} position={[0, 0.12, 0.235]} color="#f4f1ea" outline={0.012} />
      </group>

      {/* arms (pivot at the shoulder) */}
      {collar ? <Cyl rt={0.3} rb={0.38} h={0.07} position={[0, 1.08 + bob, 0]} color="#f7f5ef" outline={0.02} /> : null}
      <group position={[-0.3, 1.0 + bob, 0]} rotation={armL ? [armL[0], 0, armL[1]] : [0, 0, -0.22]}>
        <Capsule r={0.068} len={0.36} position={[0, -0.24, 0]} color={coat} outline={0.025} />
        <Ball r={0.095} position={[0, -0.5, 0]} color={handColor} outline={0.025} />
      </group>
      <group position={[0.3, 1.0 + bob, 0]} rotation={armR ? [armR[0], 0, armR[1]] : [0, 0, rightArm]}>
        <Capsule r={0.068} len={0.36} position={[0, -0.24, 0]} color={coat} outline={0.025} />
        <Ball r={0.095} position={[0, -0.5, 0]} color={handColor} outline={0.025} />
      </group>

      {/* head */}
      <group position={[0, bob * 1.3, 0]}>
        <group position={[0, HEAD_Y, 0]} rotation={[0, look, 0]}>
          <group position={[0, -HEAD_Y, 0]}>
            <Ball r={HEAD_R} position={[0, HEAD_Y, 0]} color={skin} outline={0.032} soft={0.55} />
            {hatStyle === "brim" ? (
              <>
                {hair ? <Hair color={hair} /> : null}
                <BrimHat color={hat} />
              </>
            ) : hatStyle === "none" ? (
              hair ? <Hair color={hair} /> : null
            ) : hair ? (
              <Hair color={hair} />
            ) : (
              <Beanie color={hat} />
            )}

            {/* eyes */}
            {[-1, 1].map((s) =>
              wideEyes ? (
                <group key={`eye${s}`} position={onFace(s * 0.17, 0.03, -0.04)} scale={[1, eyeY, 1]}>
                  <Ball r={0.12} scale={[1, 1.1, 0.5]} color="#ffffff" outline={0.018} unlit />
                  <Ball r={0.05} position={[0, 0, 0.05]} scale={[1, 1, 0.5]} color="#16161f" outline={0} unlit />
                </group>
              ) : (
                <group key={`eye${s}`} position={onFace(s * 0.17, 0.0, -0.02)} scale={[1, eyeY, 1]}>
                  <Ball r={0.058} scale={[1, 1.25, 0.5]} color="#16161f" outline={0} unlit />
                </group>
              ),
            )}

            {goggles ? (
              <group>
                {[-1, 1].map((s) => (
                  <Cyl
                    key={`g${s}`}
                    rt={0.13}
                    rb={0.13}
                    h={0.05}
                    rotation={[Math.PI / 2, 0, 0]}
                    position={onFace(s * 0.17, 0.05, 0.02)}
                    color="#9fe3ff"
                    opacity={0.55}
                    outline={0.02}
                  />
                ))}
              </group>
            ) : null}

            {/* brows */}
            {[-1, 1].map((s) => (
              <Block
                key={`brow${s}`}
                size={[0.15, 0.035, 0.03]}
                position={onFace(s * 0.17, (wideEyes ? 0.2 : 0.13) + browLift, 0)}
                rotation={[-0.35, 0, -s * browRot]}
                color="#16161f"
                outline={0}
                unlit
              />
            ))}

            {/* mouth */}
            {mouth === "o" || (mouth === "talk" && talkOpen === 1) ? (
              <Ball
                r={0.07}
                position={onFace(0, -0.17, -0.02)}
                scale={[0.9, mouth === "o" ? 1.3 : 0.9, 0.45]}
                color="#3a1418"
                outline={0}
                unlit
              />
            ) : mouth === "smile" ? (
              <Arc up position={onFace(0, -0.12, 0)} />
            ) : mouth === "frown" ? (
              <Arc up={false} position={onFace(0, -0.24, 0)} w={0.065} />
            ) : (
              <Block size={[0.12, 0.028, 0.02]} position={onFace(0, -0.17, 0)} rotation={[-0.3, 0, 0]} color="#16161f" outline={0} unlit />
            )}

            {/* cold cheeks */}
            {(cheeks ? [-1, 1] : []).map((s) => (
              <Ball key={`ch${s}`} r={0.065} position={onFace(s * 0.3, -0.1, -0.03)} scale={[1, 0.7, 0.3]} color="#f19a9a" outline={0} unlit opacity={0.75} />
            ))}
          </group>
        </group>
      </group>
    </group>
  );
};
