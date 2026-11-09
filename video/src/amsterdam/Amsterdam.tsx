import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../ui/Captions";
import { CAPTIONS } from "./timing";
import { ShotBrickSinks, ShotBurn, ShotCityFire, ShotDecree, ShotDive, ShotDozens, ShotDrive, ShotRaise, ShotSwamp } from "./shots1";
import { ShotBuild, ShotDrought, ShotFinale, ShotForest, ShotHoist, ShotPalace, ShotRot, ShotSoup, ShotStairs, ShotStreet } from "./shots2";

export const FPS = 30;
export const END = 95.0;

type Shot = { id: string; start: number; C: React.FC<{ start: number }>; capY?: number };

/** Shot list, cut on the voice-over (seconds). */
export const SHOTS: Shot[] = [
  { id: "swamp", start: 0, C: ShotSwamp },
  { id: "raise", start: 4.75, C: ShotRaise },
  { id: "burn", start: 9.5, C: ShotBurn },
  { id: "cityfire", start: 11.35, C: ShotCityFire },
  { id: "decree", start: 15.0, C: ShotDecree },
  { id: "bricksinks", start: 17.95, C: ShotBrickSinks },
  { id: "dive", start: 22.85, C: ShotDive },
  { id: "drive", start: 26.95, C: ShotDrive },
  { id: "dozens", start: 33.95, C: ShotDozens },
  { id: "forest", start: 40.05, C: ShotForest },
  { id: "rot", start: 44.3, C: ShotRot },
  { id: "drought", start: 51.8, C: ShotDrought },
  { id: "build", start: 56.9, C: ShotBuild },
  { id: "stairs", start: 61.95, C: ShotStairs },
  { id: "hoist", start: 66.75, C: ShotHoist },
  { id: "street", start: 77.0, C: ShotStreet },
  { id: "soup", start: 80.4, C: ShotSoup },
  { id: "palace", start: 86.0, C: ShotPalace },
  { id: "finale", start: 90.7, C: ShotFinale },
];

export const shotFrames = (i: number) => {
  const a = Math.round(SHOTS[i].start * FPS);
  const b = Math.round((i + 1 < SHOTS.length ? SHOTS[i + 1].start : END) * FPS);
  return { from: a, len: b - a };
};

export const TOTAL = Math.round(END * FPS);

const GlobalCaptions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const chunks = CAPTIONS.map((c) => ({ at: Math.round(c.start * FPS), text: c.text }));
  // hide captions during long pauses
  const active = CAPTIONS.find((c, i) => t >= c.start && t < (CAPTIONS[i + 1]?.start ?? c.end + 0.6));
  if (!active || t > active.end + 0.45) return null;
  const shot = [...SHOTS].reverse().find((s) => t >= s.start);
  return <Captions chunks={chunks} y={shot?.capY ?? 0.7} size={96} />;
};

/* ------------------------------------------------------------ sound */

type Cue = [number, string, number];
const range = (a: number, b: number, step: number, name: string, vol: number): Cue[] => {
  const out: Cue[] = [];
  for (let x = a; x <= b + 1e-6; x += step) out.push([x, name, vol]);
  return out;
};

const CUES: Cue[] = [
  [3.05, "splash", 0.7],
  [4.05, "glug", 0.8],
  [5.9, "pour", 0.6],
  [7.85, "pop", 0.45],
  [8.3, "pop", 0.45],
  [8.75, "pop", 0.45],
  [9.2, "thud", 0.35],
  [10.42, "whoosh", 0.6],
  [10.5, "crackle", 0.5],
  [11.45, "pop", 0.6],
  [16.1, "pop", 0.6],
  [17.38, "slam", 0.8],
  [18.38, "thud", 1],
  [18.7, "pop", 0.45],
  [19.85, "creak", 0.6],
  [21.75, "crack", 0.8],
  [21.85, "stamp", 0.8],
  [23.25, "pop", 0.45],
  [24.3, "pop", 0.45],
  [25.45, "pop", 0.45],
  [28.0, "whoosh", 0.3],
  ...[30.1, 30.55, 31.62, 32.45, 32.85, 33.28].map((x): Cue => [x, "slam", 0.75]),
  [33.3, "ding", 0.6],
  ...Array.from({ length: 23 }).map((_, k): Cue => [34.15 + k * 0.165, "thud", 0.35]),
  [38.15, "pop", 0.7],
  [42.5, "whoosh", 0.6],
  [44.6, "pop", 0.4],
  [45.95, "fill", 0.7],
  [47.32, "pop", 0.5],
  [48.1, "ding", 0.5],
  [49.6, "pop", 0.5],
  [51.95, "pop", 0.5],
  [52.9, "drain", 0.7],
  [54.3, "pop", 0.35],
  [55.3, "creak", 0.6],
  [55.95, "stamp", 0.7],
  [57.05, "saw", 0.6],
  ...[58.65, 58.95, 59.3, 59.6].map((x): Cue => [x, "thud", 0.6]),
  ...range(60.1, 61.8, 0.17, "pop", 0.22),
  [63.9, "pop", 0.5],
  [66.0, "nope", 0.6],
  [67.0, "creak", 0.35],
  [68.4, "creak", 0.35],
  [70.5, "whoosh", 0.4],
  [71.75, "glass", 0.9],
  [71.75, "thud", 0.6],
  [72.05, "stamp", 0.7],
  [73.6, "creak", 0.6],
  [76.15, "ding", 0.6],
  ...range(83.45, 85.6, 0.1, "tick", 0.25),
  ...range(87.35, 89.95, 0.08, "tick", 0.22),
  [90.0, "ding", 0.7],
  [90.85, "chime", 0.7],
  [90.85, "pop", 0.6],
];

const Sound: React.FC = () => (
  <>
    <Html5Audio src={staticFile("amsterdam/voice.mp3")} volume={1} />
    <Html5Audio src={staticFile("amsterdam/sfx/music.mp3")} volume={0.16} />
    {SHOTS.slice(1).map((sh) => (
      <Sequence key={sh.id} from={Math.max(0, Math.round((sh.start - 0.08) * FPS))} durationInFrames={18} layout="none">
        <Html5Audio src={staticFile("amsterdam/sfx/whoosh.mp3")} volume={0.3} />
      </Sequence>
    ))}
    {CUES.map(([at, name, vol], i) => (
      <Sequence key={i} from={Math.round(at * FPS)} durationInFrames={name === "crackle" ? 145 : 60} layout="none">
        <Html5Audio src={staticFile(`amsterdam/sfx/${name}.mp3`)} volume={vol} />
      </Sequence>
    ))}
  </>
);

export const Amsterdam: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    {SHOTS.map((s, i) => {
      const { from, len } = shotFrames(i);
      return (
        <Sequence key={s.id} from={from} durationInFrames={len} name={s.id}>
          <s.C start={s.start} />
        </Sequence>
      );
    })}
    <GlobalCaptions />
    <Sound />
  </AbsoluteFill>
);
