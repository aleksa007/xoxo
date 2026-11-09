import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, Series, staticFile } from "remotion";
import { Watermark } from "./ui/Atmosphere";
import { S1Hook, S1_LEN } from "./scenes/S1Hook";
import { S2Globe, S2_LEN } from "./scenes/S2Globe";
import { S3Reaction, S3_LEN } from "./scenes/S3Reaction";
import { S4Permafrost, S4_LEN } from "./scenes/S4Permafrost";
import { S5Cemetery, S5_LEN } from "./scenes/S5Cemetery";
import { S6Virus, S6_LEN } from "./scenes/S6Virus";
import { S7Plane, S7_LEN } from "./scenes/S7Plane";
import { S8Poll, S8_LEN } from "./scenes/S8Poll";

export const SCENES = [
  { id: "hook", len: S1_LEN, C: S1Hook },
  { id: "globe", len: S2_LEN, C: S2Globe },
  { id: "reaction", len: S3_LEN, C: S3Reaction },
  { id: "permafrost", len: S4_LEN, C: S4Permafrost },
  { id: "cemetery", len: S5_LEN, C: S5Cemetery },
  { id: "virus", len: S6_LEN, C: S6Virus },
  { id: "plane", len: S7_LEN, C: S7Plane },
  { id: "poll", len: S8_LEN, C: S8Poll },
] as const;

export const TOTAL_FRAMES = SCENES.reduce((a, s) => a + s.len, 0);

const STARTS = SCENES.map((_, i) => SCENES.slice(0, i).reduce((a, s) => a + s.len, 0));

/** Local frames (per shot) where a UI card pops in, for the "pop" SFX. */
const POPS: Record<(typeof SCENES)[number]["id"], number[]> = {
  hook: [],
  globe: [40],
  reaction: [],
  permafrost: [8, 100, 118],
  cemetery: [6, 128],
  virus: [54],
  plane: [86],
  poll: [10, 100],
};

const Sound: React.FC = () => (
  <>
    <Html5Audio src={staticFile("audio/music.mp3")} volume={0.55} />
    {SCENES.map(({ id }, i) => (
      <React.Fragment key={id}>
        {i > 0 ? (
          <Sequence from={STARTS[i] - 4} durationInFrames={20} layout="none">
            <Html5Audio src={staticFile("audio/whoosh.mp3")} volume={0.45} />
          </Sequence>
        ) : null}
        {POPS[id].map((f) => (
          <Sequence key={f} from={STARTS[i] + f} durationInFrames={8} layout="none">
            <Html5Audio src={staticFile("audio/pop.mp3")} volume={0.7} />
          </Sequence>
        ))}
      </React.Fragment>
    ))}
  </>
);

export const FrozenTown: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Series>
      {SCENES.map(({ id, len, C }) => (
        <Series.Sequence key={id} durationInFrames={len} name={id}>
          <C />
        </Series.Sequence>
      ))}
    </Series>
    <Watermark />
    <Sound />
  </AbsoluteFill>
);
