// Synthesises the placeholder soundtrack + SFX for the mock (no samples, no deps).
// Writes WAVs to public/audio, then encodes them to MP3 with ffmpeg if available.
//   node scripts/make-audio.mjs [durationSeconds]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SR = 44100;
const OUT = path.resolve(import.meta.dirname, "../public/audio");
fs.mkdirSync(OUT, { recursive: true });

let seed = 7;
const noise = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return (seed / 4294967296) * 2 - 1;
};

const writeWav = (name, L, R = L) => {
  const n = L.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 4, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i])) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i])) * 32767), 46 + i * 4);
  }
  const file = path.join(OUT, `${name}.wav`);
  fs.writeFileSync(file, buf);
  return file;
};

const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

/* ------------------------------------------------------------- music */
const DUR = Number(process.argv[2] ?? 37);
const N = Math.round(DUR * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);
const BPM = 112;
const beat = 60 / BPM;
// Am - F - C - G, one bar each
const chords = [
  [57, 60, 64],
  [53, 57, 60],
  [48, 52, 55],
  [55, 59, 62],
];
const bars = Math.ceil(DUR / (beat * 4));
const drumsFrom = 3.67; // drums enter on the first cut

const add = (arr, start, len, fn) => {
  const s0 = Math.round(start * SR);
  for (let i = 0; i < len * SR && s0 + i < N; i++) arr[s0 + i] += fn(i / SR);
};

for (let b = 0; b < bars; b++) {
  const t0 = b * beat * 4;
  const ch = chords[b % 4];
  // soft pad (detuned triangles)
  for (const m of ch) {
    const f = midi(m);
    add(L, t0, beat * 4, (t) => {
      const env = Math.min(1, t / 0.4) * Math.min(1, (beat * 4 - t) / 0.3);
      const tri = (x) => 2 * Math.abs(2 * (x - Math.floor(x + 0.5))) - 1;
      return env * 0.035 * (tri(f * t) + tri(f * 1.004 * t));
    });
    add(R, t0, beat * 4, (t) => {
      const env = Math.min(1, t / 0.4) * Math.min(1, (beat * 4 - t) / 0.3);
      const tri = (x) => 2 * Math.abs(2 * (x - Math.floor(x + 0.5))) - 1;
      return env * 0.035 * (tri(f * t) + tri(f * 0.996 * t));
    });
  }
  // plucky marimba arpeggio in eighths
  const pattern = [0, 1, 2, 1, 2, 0, 1, 2];
  pattern.forEach((p, k) => {
    const f = midi(ch[p] + 12 + (k === 4 ? 12 : 0));
    const st = t0 + (k * beat) / 2;
    const pan = k % 2 ? 0.35 : -0.35;
    add(L, st, 0.6, (t) => (1 - pan) * 0.09 * Math.exp(-t * 9) * (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t)));
    add(R, st, 0.6, (t) => (1 + pan) * 0.09 * Math.exp(-t * 9) * (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t)));
  });
  // bass + drums
  for (let k = 0; k < 4; k++) {
    const st = t0 + k * beat;
    if (st < drumsFrom) continue;
    const fb = midi(ch[0] - 24);
    if (k % 2 === 0) {
      const bass = (t) => 0.22 * Math.exp(-t * 3) * Math.sin(2 * Math.PI * fb * t);
      add(L, st, beat * 1.8, bass);
      add(R, st, beat * 1.8, bass);
      const kick = (t) => 0.35 * Math.exp(-t * 18) * Math.sin(2 * Math.PI * (45 + 90 * Math.exp(-t * 40)) * t);
      add(L, st, 0.3, kick);
      add(R, st, 0.3, kick);
    } else {
      // soft snap
      const snap = (t) => 0.12 * Math.exp(-t * 30) * noise();
      add(L, st, 0.15, snap);
      add(R, st, 0.15, snap);
    }
    // off-beat hat
    let hp = 0;
    let prev = 0;
    const hat = (t) => {
      const x = noise();
      hp = 0.6 * (hp + x - prev);
      prev = x;
      return 0.05 * Math.exp(-t * 60) * hp;
    };
    add(L, st + beat / 2, 0.08, hat);
    add(R, st + beat / 2, 0.08, hat);
  }
}
// master fade in/out
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const g = Math.min(1, t / 0.3) * Math.min(1, Math.max(0, (DUR - t) / 1.8));
  L[i] *= g;
  R[i] *= g;
}

/* --------------------------------------------------------------- sfx */
const sfx = (dur, fn) => {
  const a = new Float32Array(Math.round(dur * SR));
  for (let i = 0; i < a.length; i++) a[i] = fn(i / SR, i);
  return a;
};

// whoosh: noise through a sweeping resonant band-pass
let low = 0;
let band = 0;
const whoosh = sfx(0.5, (t) => {
  const fc = 300 + 3200 * Math.sin(Math.PI * Math.min(1, t / 0.5)) ** 2;
  const f = 2 * Math.sin((Math.PI * fc) / SR);
  const q = 0.35;
  const hi = noise() - low - q * band;
  band += f * hi;
  low += f * band;
  const env = Math.sin(Math.PI * Math.min(1, t / 0.5)) ** 1.5;
  return 0.55 * env * band;
});

const pop = sfx(0.12, (t) => 0.45 * Math.exp(-t * 38) * Math.sin(2 * Math.PI * (520 + 700 * Math.min(1, t / 0.03)) * t));

const files = [writeWav("music", L, R), writeWav("whoosh", whoosh), writeWav("pop", pop)];

try {
  for (const f of files) {
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", f, "-b:a", "160k", f.replace(/\.wav$/, ".mp3")]);
    fs.unlinkSync(f);
  }
  console.log("Wrote MP3s to", OUT);
} catch {
  console.log("ffmpeg not found, kept WAVs in", OUT);
}
