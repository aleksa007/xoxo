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

---

# "How to build a house in Amsterdam" (95 s)

Vertical 1080×1920 explainer built around the ElevenLabs voice-over in
`public/amsterdam/voice.mp3`. Composition id: **`Amsterdam`**.

```bash
npx remotion render Amsterdam out/amsterdam.mp4 --gl=swangle --concurrency=4
```

## How it's put together

| Piece | File |
| --- | --- |
| Shot list (cut on the voice-over, in seconds) + sound cues | `src/amsterdam/Amsterdam.tsx` |
| Shots 1–9 (swamp → pile foundation) | `src/amsterdam/shots1.tsx` |
| Shots 10–19 (upside-down forest → finale) | `src/amsterdam/shots2.tsx` |
| Models: canal houses (step/bell/neck gables, lean, cracks, smashed windows), piles, pile-driver rig, sofa, Royal Palace, cut-away ground with layers + canal, fire, debris | `src/amsterdam/models.tsx` |
| Looks, skies, shot shell (punch-in, tilt-shift, grade), camera shake | `src/amsterdam/kit.tsx` |
| Overlays: FAIL stamp, name card, depth gauge, counters, comic SFX words | `src/amsterdam/overlays.tsx` |
| Word timings + caption chunks (generated) | `src/amsterdam/timing.ts` |

The toon shader (`src/three/cel.tsx`) now also does procedural brick / wood /
soil / cobble / roof-tile patterns, rim light, instancing, and "groundwater"
blue dots on cut faces below a given water level.

## Re-timing to a new voice-over

1. Put the new MP3 in `public/amsterdam/voice.mp3` and the exact text in
   `scripts/amsterdam-script.txt`.
2. Force-align it (pocketsphinx, works offline):
   ```bash
   python3 -m venv .venv && .venv/bin/pip install pocketsphinx
   ffmpeg -i public/amsterdam/voice.mp3 -ar 16000 -ac 1 -f s16le /tmp/voice.raw
   .venv/bin/python scripts/align.py /tmp/voice.raw scripts/amsterdam-script.txt /tmp/words.json
   ffmpeg -i public/amsterdam/voice.mp3 -af silencedetect=noise=-35dB:d=0.08 -f null - 2>&1 | grep -o "silence_[se][a-z]*: [0-9.]*" > /tmp/silences.txt
   python3 scripts/make-captions.py /tmp/words.json /tmp/silences.txt scripts/amsterdam-script.txt src/amsterdam/timing.ts
   ```
3. Run `scripts/make-captions.py` to regenerate `src/amsterdam/timing.ts`, then
   adjust the shot start times in `Amsterdam.tsx` and the per-shot cue times.

Music and SFX are synthesized: `node scripts/make-amsterdam-audio.mjs`.

---

# "The machine only the Dutch can build" (ASML, 108 s)

Composition id **`Asml`**, voice-over in `public/asml/voice.mp3` (ElevenLabs
take with the pauses between sentences tightened to keep the pace up).

Built on the lessons from the Amsterdam video:

- **One continuous set.** A single clean room, one `ThreeCanvas` for the whole
  video, and a key-framed camera (`KEYS` in `src/asml/Asml.tsx`) that glides and
  telephoto-zooms instead of cutting between unrelated scenes.
- **One hero object.** The phone's chip lands on the wafer and the machine is
  assembled around it, piece by piece.
- **Every "but" is visible.** Pen too thick (ink blob), projector lines blur,
  air swallows the beam, glass lens cracks, etc.
- **Lighting arc.** The room dims while the machine's insides are built so the
  EUV light glows, and comes back up at "put it all together".

Files: `src/asml/world.tsx` (models), `src/asml/Asml.tsx` (timeline, camera,
overlays, sound cues), `src/asml/timing.ts` (generated captions, via
`scripts/make-captions.py … scripts/asml-captions.json`), `scripts/make-asml-audio.mjs`.
