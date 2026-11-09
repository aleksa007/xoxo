import React from "react";
import { useCurrentFrame } from "remotion";
import { NIGHT } from "../three/cel";
import { Character } from "../three/Character";
import { CameraRig, lerp3 } from "../three/props";
import { Sky, Snowfall, Vignette } from "../ui/Atmosphere";
import { Captions } from "../ui/Captions";
import { Panel, PollBar, Pill } from "../ui/Cards";
import { ArcticTown } from "./S1Hook";
import { Shell, ease } from "./Shell";

export const S8_LEN = 150;

export const S8Poll: React.FC = () => {
  const frame = useCurrentFrame();
  const t = ease(frame, 0, S8_LEN);
  return (
    <Shell
      look={NIGHT}
      sky={<Sky top="#0b1033" bottom="#2a3f84" stars aurora />}
      overlay={
        <>
          <Snowfall count={80} />
          <Vignette strength={0.5} />
          <Panel at={10} y={200}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  background: "#ff9f1c",
                  color: "#1c2140",
                  fontWeight: 900,
                  fontSize: 26,
                  letterSpacing: 3,
                  padding: "8px 22px",
                  borderRadius: 999,
                  border: "4px solid #0a0b16",
                }}
              >
                YOUR VOTE
              </div>
            </div>
            <div style={{ fontWeight: 900, fontSize: 54, textAlign: "center", marginTop: 14 }}>WOULD YOU LIVE HERE?</div>
            <PollBar label="A: YES, I'D MOVE" pct={41} color="#2f9e6e" at={24} />
            <PollBar label="B: NO WAY" pct={59} color="#e2483d" at={30} />
          </Panel>
          <Pill at={100} y={680} bg="#ffd23f" size={40}>
            Follow for part 2
          </Pill>
          <Captions
            y={0.6}
            chunks={[
              { at: 0, text: "Would *you*" },
              { at: 18, text: "live here?" },
              { at: 50, text: "Comment *A* or *B*" },
            ]}
            until={96}
          />
        </>
      }
    >
      <CameraRig position={lerp3([0.4, 2.5, 10.2], [0.1, 2.2, 8.8], t)} target={[0, 1.3, 0]} fov={40} />
      <group position={[0, 0, 0]}>
        <ArcticTown people={false} />
        <Character position={[-0.95, 0, 1.4]} rotationY={0.2} coat="#2f9e6e" hat="#e2483d" mouth="smile" wave seed={1} />
        <Character position={[0.95, 0, 1.2]} rotationY={-0.25} coat="#ffb703" hat="#3a7bd5" skin="#c98f63" mouth="o" brows="worried" shiver seed={2} />
      </group>
    </Shell>
  );
};
