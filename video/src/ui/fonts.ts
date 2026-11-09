import "@fontsource/montserrat/700.css";
import "@fontsource/montserrat/800.css";
import "@fontsource/montserrat/900.css";
import { continueRender, delayRender } from "remotion";

export const FONT = "'Montserrat', 'Arial Black', sans-serif";

// Block rendering until the caption font is ready so no frame falls back to Arial.
if (typeof document !== "undefined") {
  const handle = delayRender("Loading Montserrat");
  Promise.all([
    document.fonts.load(`900 80px Montserrat`),
    document.fonts.load(`800 40px Montserrat`),
    document.fonts.load(`700 30px Montserrat`),
  ])
    .then(() => continueRender(handle))
    .catch(() => continueRender(handle));
}
