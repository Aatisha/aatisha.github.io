// Sounds for the slide projector, synthesised as they play (no audio files): short bursts of
// filtered noise and tones for the clicks and clunks, and a low fan hum while the lamp is on.
// Nothing is created until the visitor presses something.

// Each layer is filtered noise (n: filter type) or a tone (w: waveform); a/d are attack and decay,
// p the peak level and o an offset from the start, all in seconds.
const SFX = {
  tick: { g: 0.45, L: [{ n: 'bandpass', f: 5200, q: 1.8, a: 0.001, d: 0.018, p: 0.14 }, { w: 'sine', f: 2600, a: 0.001, d: 0.012, p: 0.02 }] },
  click: { g: 0.45, L: [{ n: 'bandpass', f: 2200, q: 1.6, a: 0.001, d: 0.016, p: 0.12 }, { n: 'bandpass', f: 3800, q: 1.6, o: 0.03, a: 0.001, d: 0.02, p: 0.1 }] },
  press: { g: 0.4, L: [{ n: 'bandpass', f: 1700, q: 1.4, a: 0.001, d: 0.02, p: 0.13 }] },
  lift: { g: 0.5, L: [{ n: 'lowpass', f: 900, q: 0.8, a: 0.002, d: 0.06, p: 0.12 }, { w: 'sine', f: 150, to: 95, a: 0.002, d: 0.08, p: 0.08 }] },
  advance: {
    g: 0.5,
    L: [
      { n: 'bandpass', f: 1900, q: 1.3, a: 0.001, d: 0.03, p: 0.14 },
      { w: 'triangle', f: 210, a: 0.002, d: 0.06, p: 0.05 },
      { n: 'bandpass', f: 2600, q: 2, o: 0.09, a: 0.001, d: 0.02, p: 0.08 },
    ],
  },
  drop: {
    g: 0.55,
    L: [
      { n: 'bandpass', f: 1300, q: 1.2, a: 0.001, d: 0.035, p: 0.15 },
      { n: 'lowpass', f: 520, q: 0.7, o: 0.045, a: 0.002, d: 0.1, p: 0.2 },
      { w: 'sine', f: 95, to: 70, o: 0.045, a: 0.003, d: 0.14, p: 0.14 },
    ],
  },
  lampOn: { g: 0.4, L: [{ w: 'sine', f: 60, a: 0.01, d: 0.25, p: 0.05 }, { n: 'lowpass', f: 1500, q: 0.6, a: 0.02, d: 0.2, p: 0.05 }] },
};

let ctx = null;
let noise = null;
let fan = null;
let fanWanted = false;
let muted = false;

function context() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i += 1) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Call from a click or key press: browsers only allow audio to start from one.
export const unlock = () => context();

export function play(name, mul = 1) {
  const c = ctx && context();
  if (!c || muted || !SFX[name]) return;
  const s = SFX[name];
  const t0 = c.currentTime + 0.004;
  const out = c.createGain();
  out.gain.value = s.g * mul;
  out.connect(c.destination);
  let end = 0;
  s.L.forEach((l) => {
    const t = t0 + (l.o || 0);
    const dur = l.a + l.d + 0.05;
    end = Math.max(end, (l.o || 0) + dur);
    const env = c.createGain();
    env.gain.setValueAtTime(1e-4, t);
    env.gain.exponentialRampToValueAtTime(l.p, t + l.a);
    env.gain.exponentialRampToValueAtTime(1e-4, t + l.a + l.d);
    if (l.n) {
      const src = c.createBufferSource();
      const f = c.createBiquadFilter();
      src.buffer = noise;
      f.type = l.n;
      f.frequency.value = l.f;
      f.Q.value = l.q ?? 1;
      src.connect(f).connect(env);
      src.start(t, Math.random() * 1.5, dur);
    } else {
      const o = c.createOscillator();
      o.type = l.w;
      o.frequency.setValueAtTime(l.f, t);
      if (l.to) o.frequency.exponentialRampToValueAtTime(l.to, t + l.a + l.d);
      o.connect(env);
      o.start(t);
      o.stop(t + dur);
    }
    env.connect(out);
  });
  setTimeout(() => out.disconnect(), (end + 0.2) * 1000);
}

// The fan runs while the lamp is on and the projector is on screen.
export function setFan(on) {
  fanWanted = on;
  if (!ctx) return;
  const c = context();
  if (!fan) {
    fan = c.createGain();
    fan.gain.value = 0;
    fan.connect(c.destination);
    const src = c.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 520;
    lp.Q.value = 0.4;
    const pk = c.createBiquadFilter();
    pk.type = 'peaking';
    pk.frequency.value = 180;
    pk.gain.value = 8;
    src.connect(lp).connect(pk).connect(fan);
    src.start();
    const hum = c.createOscillator();
    const hg = c.createGain();
    hum.frequency.value = 120;
    hg.gain.value = 0.12;
    hum.connect(hg).connect(fan);
    hum.start();
  }
  const level = fanWanted && !muted ? 0.035 : 0;
  fan.gain.setTargetAtTime(level, c.currentTime, level ? 0.5 : 0.18);
}

export const isMuted = () => muted;
export function setMuted(value) {
  muted = value;
  setFan(fanWanted);
}
