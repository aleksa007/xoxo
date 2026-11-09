# Mock short: "The town where you can't die"

A 36-second vertical (1080×1920, 30 fps) explainer mock built with
**Remotion** + **Three.js** (`@remotion/three` / React Three Fiber).

It borrows the *techniques* of popular short-form explainers. It doesn't
copy their characters or branding:

| Reference trait | How it's done here |
| --- | --- |
| Toon-shaded 3D sets, thick black outlines | Custom two-tone cel shader + inverted-hull outlines (`src/three/cel.tsx`) |
| Big-head stick-figure characters | Original Arctic character (parka, beanie, mittens) with expressions, blinking, waving, shivering (`src/three/Character.tsx`) |
| Word-chunk captions, keyword in yellow, heavy stroke, pop-in | `src/ui/Captions.tsx` (wrap a word in `*asterisks*` to highlight) |
| Infographic UI cards, pills, poll bars | `src/ui/Cards.tsx` |
| Fast cuts with a punch-in zoom, slow camera dollies | `src/scenes/Shell.tsx` + `CameraRig` |
| Night sky, aurora, snowfall, vignette, faint watermark | `src/ui/Atmosphere.tsx` (watermark is a `@yourchannel` placeholder) |

## Shots

1. **Hook**: stilted, colourful houses under the aurora. "In this town, you're not allowed to die."
2. **Globe**: pin drops on a toon globe, plus a location card (78°N, ~2,500 people, 0 trees).
3. **Reaction**: close-up of the character. "Sounds fake, right? It's not."
4. **Permafrost**: the ground sliced open like a diorama; the camera cranes down to a coffin.
5. **Cemetery**: rows of white crosses. "Since 1950", "bodies don't decompose".
6. **1918 flu**: virus particles drift out of the frozen grave.
7. **Plane**: medevac and pregnancy flights to the mainland.
8. **Poll**: "Would you live here?" A/B poll card with a follow call to action.

Audio is a placeholder: a synthesized music bed plus whoosh/pop SFX
(`scripts/make-audio.mjs`). There is no voice-over.

## Run it

```bash
cd video
npm install
npm run studio            # live preview / scrub in the browser
npm run render            # -> out/frozen-town.mp4
```

Every shot is also registered on its own (`shot-hook`, `shot-globe`, …)
so you can iterate on one shot in the Studio.

**Headless / GPU-less machines (CI, containers):** WebGL needs a software
renderer:

```bash
npx remotion render FrozenTown out/frozen-town.mp4 --gl=swangle --concurrency=4
```

To regenerate the placeholder audio (needs `ffmpeg` for the MP3 step):

```bash
node scripts/make-audio.mjs 36.4
```

## Editing the script

Each shot lives in `src/scenes/S*.tsx`. Caption timing is a list of
`{ at: <frame within the shot>, text }` chunks. Shot lengths are the
exported `S*_LEN` constants, and `src/FrozenTown.tsx` sequences them and
places the SFX.
