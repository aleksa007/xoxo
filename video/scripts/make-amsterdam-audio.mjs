// Synthesises the music bed + sound effects for the Amsterdam video (no samples).
//   node scripts/make-amsterdam-audio.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SR = 44100;
const OUT = path.resolve(import.meta.dirname, "../public/amsterdam/sfx");
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
  save("whoosh", make(0.5, (t) => 0.6 * Math.sin(Math.PI * Math.min(1, t / 0.5)) ** 1.5 * f(noise(), 300 + 3000 * Math.sin(Math.PI * t / 0.5) ** 2, 0.35)));
}
save("pop", make(0.12, (t) => 0.5 * Math.exp(-t * 38) * Math.sin(2 * Math.PI * (520 + 700 * Math.min(1, t / 0.03)) * t)));
save("thud", make(0.5, (t) => 0.9 * Math.exp(-t * 11) * Math.sin(2 * Math.PI * (55 + 80 * Math.exp(-t * 30)) * t) + 0.25 * Math.exp(-t * 40) * noise()));
{
  const f = bp();
  save("slam", make(0.55, (t) => 0.85 * Math.exp(-t * 14) * Math.sin(2 * Math.PI * (48 + 110 * Math.exp(-t * 35)) * t) + 0.5 * Math.exp(-t * 30) * f(noise(), 900, 0.6) + 0.12 * Math.exp(-t * 9) * Math.sin(2 * Math.PI * 310 * t)));
}
save("splash", (() => {
  const f = bp();
  return make(0.9, (t) => 0.6 * Math.exp(-t * 5) * f(noise(), 1800 - t * 1200, 0.5) + 0.3 * Math.exp(-t * 12) * Math.sin(2 * Math.PI * 70 * t));
})());
save("glug", make(0.9, (t) => {
  let s = 0;
  for (let k = 0; k < 4; k++) {
    const st = k * 0.18;
    const a = t - st;
    if (a > 0) s += Math.exp(-a * 18) * Math.sin(2 * Math.PI * (180 + 420 * a * 4) * a) * 0.5;
  }
  return s;
}));
save("crackle", (() => {
  const f = bp();
  return make(4.8, (t) => {
    const env = Math.min(1, t / 0.3) * Math.min(1, (4.8 - t) / 0.6);
    const pop = noise() > 0.995 ? 1 : 0;
    return env * (0.18 * f(noise(), 600, 0.7) + 0.5 * pop * noise());
  });
})());
save("crack", (() => {
  const f = bp();
  return make(0.6, (t) => 0.7 * Math.exp(-t * 22) * f(noise(), 2500, 0.3) + 0.4 * Math.exp(-t * 8) * Math.sin(2 * Math.PI * 90 * t) * (noise() * 0.5 + 0.5));
})());
save("glass", make(1.0, (t) => {
  let s = 0.5 * Math.exp(-t * 25) * noise();
  [2900, 3700, 4400, 5300].forEach((fq, k) => (s += 0.08 * Math.exp(-t * (6 + k)) * Math.sin(2 * Math.PI * fq * t + k)));
  return s;
}));
save("saw", (() => {
  const f = bp();
  return make(1.4, (t) => {
    const stroke = Math.abs(Math.sin(t * Math.PI * 6));
    return 0.35 * stroke * f(noise(), 1800 + 1200 * stroke, 0.25);
  });
})());
save("ding", make(1.4, (t) => 0.35 * Math.exp(-t * 3.2) * (Math.sin(2 * Math.PI * 1318 * t) + 0.5 * Math.sin(2 * Math.PI * 1976 * t))));
save("tick", make(0.05, (t) => 0.4 * Math.exp(-t * 120) * Math.sin(2 * Math.PI * 2200 * t)));
save("stamp", make(0.5, (t) => 0.9 * Math.exp(-t * 16) * Math.sin(2 * Math.PI * (70 + 60 * Math.exp(-t * 40)) * t) + 0.3 * Math.exp(-t * 50) * noise()));
save("creak", make(1.1, (t) => {
  const f0 = 140 + 40 * Math.sin(t * 9) + 30 * t;
  const saw = ((t * f0) % 1) * 2 - 1;
  return 0.18 * Math.sin(Math.PI * Math.min(1, t / 1.1)) * saw * (0.6 + 0.4 * Math.sin(t * 70));
}));
save("fill", make(1.2, (t) => {
  let s = 0;
  for (let k = 0; k < 10; k++) {
    const a = t - k * 0.1;
    if (a > 0) s += 0.25 * Math.exp(-a * 25) * Math.sin(2 * Math.PI * (300 + k * 60 + a * 2000) * a);
  }
  return s;
}));
save("drain", make(1.3, (t) => {
  let s = 0;
  for (let k = 0; k < 8; k++) {
    const a = t - k * 0.14;
    if (a > 0) s += 0.3 * Math.exp(-a * 15) * Math.sin(2 * Math.PI * (700 - k * 60 - a * 900) * a);
  }
  return s;
}));
save("chime", make(2.2, (t) => {
  let s = 0;
  [72, 76, 79, 84].forEach((m, k) => {
    const a = t - k * 0.09;
    if (a > 0) s += 0.16 * Math.exp(-a * 2.4) * (Math.sin(2 * Math.PI * midi(m) * a) + 0.3 * Math.sin(4 * Math.PI * midi(m) * a));
  });
  return s;
}));
save("nope", make(0.5, (t) => 0.22 * Math.exp(-t * 4) * Math.sign(Math.sin(2 * Math.PI * 110 * t)) * (t < 0.2 || t > 0.28 ? 1 : 0)));
save("pour", (() => {
  const f = bp();
  return make(1.9, (t) => 0.4 * Math.min(1, t / 0.2) * Math.min(1, (1.9 - t) / 0.4) * f(noise(), 500 + 300 * Math.sin(t * 13), 0.5));
})());

/* ---------------------------------------------------------- music */
const DUR = 95.2;
const N = Math.round(DUR * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);
const add = (arr, start, len, fn) => {
  const s0 = Math.round(start * SR);
  for (let i = 0; i < len * SR && s0 + i < N; i++) if (s0 + i >= 0) arr[s0 + i] += fn(i / SR);
};
const BPM = 104;
const beat = 60 / BPM;
// C - Am - F - G (curious, upbeat "building" vibe)
const chords = [
  [60, 64, 67],
  [57, 60, 64],
  [53, 57, 60],
  [55, 59, 62],
];
const bars = Math.ceil(DUR / (beat * 4));
for (let b = 0; b < bars; b++) {
  const t0 = b * beat * 4;
  const ch = chords[b % 4];
  // pizzicato plucks on 8ths
  const pat = [0, 2, 1, 2, 0, 2, 1, 2];
  pat.forEach((p, k) => {
    if ((b * 8 + k) % 16 === 15) return;
    const fq = midi(ch[p] + 12);
    const st = t0 + (k * beat) / 2;
    const pan = k % 2 ? 0.3 : -0.3;
    const pl = (t) => 0.07 * Math.exp(-t * 14) * (Math.sin(2 * Math.PI * fq * t) + 0.25 * Math.sin(6 * Math.PI * fq * t));
    add(L, st, 0.4, (t) => pl(t) * (1 - pan));
    add(R, st, 0.4, (t) => pl(t) * (1 + pan));
  });
  // soft bass on 1 and 3
  [0, 2].forEach((k) => {
    const fb = midi(ch[0] - 24);
    const bs = (t) => 0.16 * Math.exp(-t * 2.5) * Math.sin(2 * Math.PI * fb * t);
    add(L, t0 + k * beat, beat * 1.9, bs);
    add(R, t0 + k * beat, beat * 1.9, bs);
  });
  // light shaker on off-beats
  for (let k = 0; k < 8; k++) {
    let prev = 0;
    let hp = 0;
    const sh = (t) => {
      const x = noise();
      hp = 0.7 * (hp + x - prev);
      prev = x;
      return 0.025 * Math.exp(-t * 45) * hp;
    };
    add(L, t0 + (k * beat) / 2 + beat / 4, 0.06, sh);
    add(R, t0 + (k * beat) / 2 + beat / 4, 0.06, sh);
  }
  // pad
  ch.forEach((m) => {
    const fq = midi(m);
    const pad = (t) => 0.02 * Math.min(1, t / 0.5) * Math.min(1, (beat * 4 - t) / 0.4) * Math.sin(2 * Math.PI * fq * t);
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
