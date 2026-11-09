import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { DAY, type Look } from "../three/cel";
import { CameraRig, Globe, Pin, lerp3 } from "../three/props";
import { Sky } from "../ui/Atmosphere";
import { Captions } from "../ui/Captions";
import { Icon, Panel, Stat } from "../ui/Cards";
import { Shell, ease } from "./Shell";

export const S2_LEN = 120;

const SPACE: Look = { ...DAY, fogColor: "#141a40", fogNear: 40, fogFar: 80, lightDir: [-0.4, 0.8, 0.9] };

export const S2Globe: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = ease(frame, 0, S2_LEN);
  const spin = interpolate(frame, [0, 50], [-2.4, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const drop = spring({ frame: frame - 18, fps, config: { damping: 8, stiffness: 140 } });
  const pinY = 3 + interpolate(drop, [0, 1], [3.5, 0]);
  return (
    <Shell
      look={SPACE}
      sky={<Sky top="#0a0d2b" bottom="#2b1f5c" stars glow={{ x: 0.5, y: 0.62, color: "rgba(80,140,255,0.45)", r: 45 }} />}
      overlay={
        <>
          <Panel at={40} y={170}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ background: "#e2483d", borderRadius: 16, padding: 10, border: "4px solid #0a0b16" }}>
                <Icon name="pin" size={48} />
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: 56, letterSpacing: 1, lineHeight: 1 }}>LONGYEARBYEN</div>
                <div style={{ fontWeight: 800, fontSize: 28, letterSpacing: 4, color: "#9aa3c7", marginTop: 6 }}>
                  SVALBARD · NORWAY
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 24 }}>
              <Stat value="78°N" label="LATITUDE" accent="#3de0ff" />
              <Stat value="~2,500" label="PEOPLE" accent="#ffd23f" />
              <Stat value="0" label="TREES" accent="#4dffb0" />
            </div>
          </Panel>
          <Captions
            y={0.72}
            size={92}
            chunks={[
              { at: 0, text: "This is" },
              { at: 14, text: "*Longyearbyen,*" },
              { at: 44, text: "Norway." },
              { at: 62, text: "just *1,300 km*" },
              { at: 84, text: "from the *North Pole.*" },
            ]}
          />
        </>
      }
    >
      <CameraRig position={lerp3([0, 0.5, 15], [0, 2.6, 12.5], t)} target={lerp3([0, -0.2, 0], [0, 1.8, 0], t)} fov={40} />
      <group position={[0, -0.6, 0]}>
        <Globe rotationY={spin} />
        {/* pin container shares the globe's tilt/spin so it rides on the surface */}
        <group rotation={[0.25, spin, 0]}>
          <group rotation={[0, -Math.PI / 2, 0]}>
            <group rotation={[0, 0, -0.21]}>
              <Pin position={[0, pinY, 0]} scale={0.9} />
            </group>
          </group>
        </group>
      </group>
    </Shell>
  );
};
