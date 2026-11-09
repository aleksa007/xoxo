// Synthesises the music bed + extra sound effects for the ASML video (no samples).
// Shared effects (whoosh, pop, stamp, crack, glass, ding, thud, tick, chime) are copied from public/amsterdam/sfx.
//   node scripts/make-asml-audio.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SR = 44100;
const OUT = path.resolve(import.meta.dirname, "../public/asml/sfx");
fs.mkdirSync(OUT, { recursive: true });

let seed = 11;
const noise = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return (seed / 4294967296) * 2 - 1;
};
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

const save = (name, L, R = L) => {
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
  const wav = path.join(OUT, `${name}.wav`);
  fs.writeFileSync(wav, buf);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", wav, "-b:a", "160k", wav.replace(/\.wav$/, ".mp3")]);
  fs.unlinkSync(wav);
};

const make = (dur, fn) => {
  const a = new Float32Array(Math.round(dur * SR));
  for (let i = 0; i < a.length; i++) a[i] = fn(i / SR);
  return a;
};

// simple resonant band-pass for noise shaping
const bp = () => {
  let low = 0;
  let band = 0;
  return (x, fc, q = 0.4) => {
    const f = 2 * Math.sin((Math.PI * Math.min(fc, SR / 6)) / SR);
    const hi = x - low - q * band;
    band += f * hi;
    low += f * band;
    return band;
  };
};


/* ------------------------------------------------------------ sfx */
{
  const f = bp();
  save("glitch", make(0.6, (t) => 0.45 * Math.exp(-t * 5) * (Math.sign(Math.sin(2 * Math.PI * (90 + 600 * ((t * 23) % 1)) * t)) * 0.5 + f(noise(), 2500, 0.3) * (Math.floor(t * 30) % 2))));
}
save("rise", make(1.1, (t) => 0.25 * Math.min(1, t / 0.9) * Math.exp(-Math.max(0, t - 0.9) * 12) * (Math.sin(2 * Math.PI * (300 + 900 * t * t) * t) + 0.4 * Math.sin(2 * Math.PI * (600 + 1800 * t * t) * t))));
{
  const f = bp();
  save("zoom", make(0.7, (t) => 0.5 * Math.sin((Math.PI * t) / 0.7) * f(noise(), 400 + 3500 * (t / 0.7), 0.25)));
}
{
  const f = bp();
  save("splat", make(0.5, (t) => 0.7 * Math.exp(-t * 10) * f(noise(), 700 - t * 600, 0.6) + 0.4 * Math.exp(-t * 14) * Math.sin(2 * Math.PI * 85 * t)));
}
save("servo", make(0.8, (t) => {
  const env = Math.sin(Math.PI * Math.min(1, t / 0.8));
  const f0 = 180 + 260 * Math.sin((Math.PI * t) / 0.8);
  return 0.16 * env * (((t * f0) % 1) * 2 - 1);
}));
save("hum", make(6.5, (t) => {
  const env = Math.min(1, t / 0.3) * Math.min(1, (6.5 - t) / 0.5);
  return env * (0.08 * Math.sin(2 * Math.PI * 110 * t) + 0.05 * Math.sin(2 * Math.PI * 220.5 * t) + 0.02 * Math.sin(2 * Math.PI * 440 * t));
}));
save("drip", make(0.35, (t) => 0.4 * Math.exp(-t * 22) * Math.sin(2 * Math.PI * (900 + 1500 * t) * t)));
{
  const f = bp();
  save("zap", make(0.35, (t) => 0.45 * Math.exp(-t * 14) * (Math.sin(2 * Math.PI * (2400 - 3000 * t) * t) * 0.6 + f(noise(), 4000, 0.3) * 0.5)));
}
{
  const f = bp();
  save("boom", make(1.8, (t) => 0.95 * Math.exp(-t * 3.2) * Math.sin(2 * Math.PI * (38 + 120 * Math.exp(-t * 18)) * t) + 0.55 * Math.exp(-t * 6) * f(noise(), 1200 + 2500 * Math.exp(-t * 4), 0.4)));
}
{
  const f = bp();
  save("vacuum", make(1.7, (t) => {
    const env = Math.min(1, t / 0.15) * Math.min(1, (1.7 - t) / 0.4);
    return 0.5 * env * f(noise(), 1800 - 1100 * (t / 1.7), 0.35);
  }));
}
save("cash", make(1.0, (t) => {
  let s = 0.4 * Math.exp(-t * 30) * noise();
  [2093, 2637, 3136].forEach((fq, k) => {
    const a = t - 0.05 - k * 0.06;
    if (a > 0) s += 0.16 * Math.exp(-a * 5) * Math.sin(2 * Math.PI * fq * a);
  });
  return s;
}));
{
  const f = bp();
  save("jet", make(1.6, (t) => 0.45 * Math.sin((Math.PI * t) / 1.6) * f(noise(), 300 + 1500 * Math.sin((Math.PI * t) / 1.6), 0.2)));
}
{
  const f = bp();
  save("rain", make(4.8, (t) => {
    const env = Math.min(1, t / 0.4) * Math.min(1, (4.8 - t) / 0.6);
    const drop = noise() > 0.997 ? noise() : 0;
    return env * (0.14 * f(noise(), 3000, 0.6) + 0.6 * drop);
  }));
}

/* ---------------------------------------------------------- music */
const DUR = 108.4;
const N = Math.round(DUR * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);
const add = (arr, start, len, fn) => {
  const s0 = Math.round(start * SR);
  for (let i = 0; i < len * SR && s0 + i < N; i++) if (s0 + i >= 0) arr[s0 + i] += fn(i / SR);
};
const BPM = 112;
const beat = 60 / BPM;
// Am - F - C - G with a techy 16th-note arp
const chords = [
  [57, 60, 64],
  [53, 57, 60],
  [48, 52, 55],
  [55, 59, 62],
];
const bars = Math.ceil(DUR / (beat * 4));
for (let b = 0; b < bars; b++) {
  const t0 = b * beat * 4;
  const ch = chords[b % 4];
  for (let k = 0; k < 16; k++) {
    const m = ch[[0, 1, 2, 1][k % 4]] + 12 + (k >= 8 && k % 4 === 2 ? 12 : 0);
    const fq = midi(m);
    const st = t0 + (k * beat) / 4;
    const pan = k % 2 ? 0.35 : -0.35;
    const arp = (t) => 0.03 * Math.exp(-t * 18) * (((t * fq) % 1) < 0.5 ? 1 : -1) + 0.03 * Math.exp(-t * 18) * Math.sin(2 * Math.PI * fq * t);
    add(L, st, 0.25, (t) => arp(t) * (1 - pan));
    add(R, st, 0.25, (t) => arp(t) * (1 + pan));
  }
  for (let k = 0; k < 4; k++) {
    const fb = midi(ch[0] - 24);
    const bs = (t) => 0.14 * Math.exp(-t * 4) * Math.sin(2 * Math.PI * fb * t);
    add(L, t0 + k * beat, beat * 0.9, bs);
    add(R, t0 + k * beat, beat * 0.9, bs);
    if (b > 0 && k % 2 === 0) {
      const kick = (t) => 0.22 * Math.exp(-t * 20) * Math.sin(2 * Math.PI * (45 + 90 * Math.exp(-t * 40)) * t);
      add(L, t0 + k * beat, 0.3, kick);
      add(R, t0 + k * beat, 0.3, kick);
    }
  }
  ch.forEach((m) => {
    const fq = midi(m);
    const pad = (t) => 0.018 * Math.min(1, t / 0.6) * Math.min(1, (beat * 4 - t) / 0.4) * (Math.sin(2 * Math.PI * fq * t) + 0.5 * Math.sin(2 * Math.PI * fq * 1.003 * t));
    add(L, t0, beat * 4, pad);
    add(R, t0, beat * 4, pad);
  });
}
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const g = Math.min(1, t / 0.4) * Math.min(1, Math.max(0, (DUR - t) / 2.0));
  L[i] *= g;
  R[i] *= g;
}
save("music", L, R);
console.log("audio written to", OUT);
