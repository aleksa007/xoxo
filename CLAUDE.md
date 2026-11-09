# Project brief: short-form explainer videos (TikTok)

This repo has two parts:
- The repo root is an old Vite/React tic-tac-toe app. Ignore it.
- **`video/`** is where the real work happens: Remotion + Three.js explainer videos.

Read this file before making a new video.

## The channel and audience
- English-language "fun facts / how it's built" explainers, vertical 1080×1920.
- Audience from the analytics: **~55% Netherlands**, then UK, Belgium, Germany. **25–34 is the biggest age group (43%)**.
- Best performer: "The island that lost its sea" (Schokland).
  - 89K views in 19h, average watch 57%, 39% watched to the end.
  - Views came in two waves: Dutch evening, then the next morning. Post around **17:00 NL time**.
- Weak spots: follows (42 from 89K views) and comments/shares. Fix them with series hooks ("Part 2"), questions in the description, and loop endings.
- Dutch-pride topics in English work: Dutch people love seeing the Netherlands explained.

## Format rules (lessons learned, keep these)
1. **Hook in the first second, with motion.** No static or meaningless first frame. Viewers decide at 0:01.
2. **One location / one hero object for the whole video.** The camera glides and zooms. No hard cuts between unrelated sets. (The Amsterdam video failed here.)
3. **Script in the "levee" style:**
   - Use "you" as the builder.
   - Chain **"But… So…"**: every fix creates the next problem.
   - Add naming moments ("This is a pile foundation") and "That's why…" links to real life.
4. **Every "but" must be visible and caused on screen.** No time jumps or history detours mid-chain; history only as a payoff near the end.
5. **Things accumulate.** Each step adds something that stays, so viewers want to see the finished result.
6. **End with a loop.** The last beat should lead back into the first line. A question that the opening line answers works well.
7. Put **comment bait in the description**, not the voice-over. For example: "Dutchies, what's the trick to remember 13,659? 👇"
8. **Before a full render:** make storyboard stills plus a short style test and get approval. Renders are expensive.

## Writing and voice
- Simple English, short sentences. Spell out numbers for TTS ("fourteen fifty-two", "A-S-M-L", "A.I.").
- Fact-check every claim with sources before writing. Use careful wording where needed ("Dutch engineers helped create Wi-Fi").
- ElevenLabs settings:
  - Voice: **Alex – Upbeat, Energetic and Clear** (eleven v4).
  - Speed 1.05–1.1, stability ~45%, similarity ~75%, style low.
- Tighten long pauses between sentences to keep the pace up (see the ASML video).

## Visual style
- Toon/cel-shaded 3D, dark outlines, big-head characters, bright clean palette, Dutch flag accents.
- Captions:
  - 1–3 words per chunk, UPPERCASE Montserrat Black.
  - White text with the **keyword in yellow (#ffd23f)**, thick black stroke, pop-in.
  - Placed at ~70% of the screen height.
- Info cards: dark navy panels, pills, counters, FAIL stamps, comparison cards.
- **Direction: more realism in the same style.** Use Blender for 3D (soft lighting, bevels, real materials, physics) via the `blender-mcp` add-on. Use Remotion for captions, cards, sound and the final edit.

## Pipeline (`video/`)
- **Compositions:** `Asml` (current best), `Amsterdam`, `FrozenTown` (first mock). See `video/README.md`.
- **Captions synced to the voice-over:**
  1. Force-align with pocketsphinx (`scripts/align.py`, offline).
  2. Snap word edges to pauses (ffmpeg `silencedetect`).
  3. Run `scripts/make-captions.py words.json silences.txt script.txt out.ts config.json`. The config holds number spans like "fifty|thousand" → "50,000" and the highlight words. See `scripts/asml-captions.json`.
- **Audio:** music and sound effects are synthesized (`scripts/make-asml-audio.mjs`). Loudness-normalize the final render to about −14 LUFS with a peak limiter.
- **Render on the Mac:** `cd video && npx remotion render Asml out/asml.mp4`. The `--gl=swangle` flag is only needed on GPU-less cloud machines.
- **Fixing one part:** re-render only the affected frames with `--frames=a-b` and splice them in with ffmpeg.

## Ideas backlog
- "How the Dutch turn the sea into land" (Flevoland). Single location, build format, a sequel to Schokland.
- "How 43 windmills deleted a lake" (Beemster, 1612).
- Dutch inventions, part 2: telescope, pendulum clock, cassette/CD (Philips), Bluetooth.
- Afsluitdijk / Delta Works step-by-step builds.
- "The Dutch built Dubai's Palm island". Verify the facts first.
