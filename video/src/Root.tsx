import React from "react";
import "./ui/fonts";
import { Composition } from "remotion";
import { FrozenTown, SCENES, TOTAL_FRAMES } from "./FrozenTown";
import { Amsterdam, TOTAL as AMS_TOTAL } from "./amsterdam/Amsterdam";
import { Asml, TOTAL as ASML_TOTAL } from "./asml/Asml";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Asml" component={Asml} durationInFrames={ASML_TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="Amsterdam" component={Amsterdam} durationInFrames={AMS_TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="FrozenTown" component={FrozenTown} durationInFrames={TOTAL_FRAMES} fps={30} width={1080} height={1920} />
    {/* One composition per shot, handy for iterating in the Studio. */}
    {SCENES.map(({ id, len, C }) => (
      <Composition key={id} id={`shot-${id}`} component={C} durationInFrames={len} fps={30} width={1080} height={1920} />
    ))}
  </>
);
